import type { Enemy, Chunk, PlayerStatusDefinition } from '@/core/types/game';
import defaultGameConfig from '@/lib/config/game-config';
import { GridPosition } from '@/core/values/grid-position';
import { updateBehavior } from './behavior';
import { updateHunger, canEatPlants, attemptEatPlants } from './feeding';
import { executeMovement, shouldMove } from './movement';

/**
 * Check whether two grid positions are within a square (Chebyshev) range.
 * This is a standalone helper so other systems can reuse consistent adjacency logic.
 * @remarks
 * **Chebyshev Distance:** max(|x1 - x2|, |y1 - y2|)
 * - range=1: adjacent including diagonals (8 neighbors)
 * - range=2: 5×5 area around position
 * - range=10: 20×20 search area
 * @param a Position A
 * @param b Position B
 * @param range Chebyshev range (range=1 => adjacent including diagonals)
 * @returns true if distance <= range, false otherwise
 */
export function arePositionsWithinSquareRange(a: GridPosition, b: GridPosition, range: number): boolean {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.max(dx, dy) <= range;
}

/**
 * Scan an area (square) around a center position and optionally test a predicate
 * against each chunk/cell in that area. Returns list of matching positions (and
 * chunk if available). If no predicate provided, returns all positions in the area.
 * @remarks
 * **Use Cases:**
 * - Find food sources in 5×5 area (creature hunger)
 * - Detect player proximity (creature senses)
 * - Find allies for flocking/herding
 * 
 * **Predicate Function:**
 * Called for each position in range. Receives chunk (or undefined if not loaded) and position.
 * Return true to include in results.
 * @param center Center position for scan
 * @param range Chebyshev range (1 = 3×3 area, 2 = 5×5 area, etc.)
 * @param chunks Optional chunk map for position validation
 * @param predicate Optional filter function (returns true to include position)
 * @returns Array of matching { pos, chunk? } objects
 */
export function scanAreaAround(
    center: GridPosition,
    range: number,
    chunks?: Map<string, Chunk>,
    predicate?: (chunk: Chunk | undefined, pos: GridPosition) => boolean
): Array<{ pos: GridPosition; chunk?: Chunk }> {
    const out: Array<{ pos: GridPosition; chunk?: Chunk }> = [];
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            const p = { x: center.x + dx, y: center.y + dy } as any;
            const key = `${p.x},${p.y}`;
            const chunk = chunks?.get(key);
            if (!predicate || predicate(chunk, p)) {
                out.push({ pos: p, chunk });
            }
        }
    }
    return out;
}

/**
 * Interface for creature state during simulation.
 * Extends Enemy with additional runtime properties.
 * @remarks
 * **Properties Added at Runtime:**
 * - position: GridPosition - Current location
 * - currentChunk: Chunk - Chunk containing creature
 * - lastMoveTick: number - Timestamp of last movement (game ticks, not Date.now)
 * - targetPosition?: GridPosition - Where creature is moving toward (fleeing/hunting)
 * - currentBehavior: CreatureBehavior - State machine: idle|moving|hunting|fleeing|eating
 */
export interface CreatureState extends Enemy {
    /** Current position of the creature */
    position: GridPosition;
    /** Current chunk the creature is in */
    currentChunk: Chunk;
    /** Last time the creature moved (in game ticks) */
    lastMoveTick: number;
    /** Current target position for movement */
    targetPosition?: GridPosition;
    /** Current behavior state */
    currentBehavior: 'idle' | 'moving' | 'hunting' | 'fleeing' | 'eating';
}

/**
 * OVERVIEW: Creature AI & behavior engine
 *
 * Simulates creature behavior, movement, hunger mechanics, and AI decision-making in the game world.
 * Handles pathfinding using Chebyshev (square) distance, behavior state transitions, and async updates.
 *
 * ## Core Responsibilities
 *
 * - **Creature State Management**: Tracks CreatureState entities with position, behavior, hunger level
 * - **Behavior State Machine**: Idle → Hunting → Fleeing → Eating transitions based on stimuli
 * - **Movement & Pathfinding**: Chebyshev-distance based movement toward targets or random walk
 * - **Hunger System**: Creatures consume satiation each tick, seek food when hungry, die if starved
 * - **Async Updates**: Movement updates scheduled via setTimeout to avoid blocking game loop
 * - **Area Scanning**: Creature vision/detection uses square range scanning (configurable range)
 * - **Creature Interactions**: Hunts player-owned plants, flees from dangerous areas, eats available food
 *
 * ## Behavior State Machine
 *
 * States and transitions:
 *
 * ```
 * IDLE
 *   ├─ (hunger > threshold) → HUNTING (seek nearby food)
 *   ├─ (player in range) → FLEEING (escape)
 *   └─ (random) → MOVING (wander)
 *
 * HUNTING
 *   ├─ (food found && in range) → EATING (consume)
 *   ├─ (hunger low) → IDLE
 *   ├─ (player nearby) → FLEEING
 *   └─ (search exhausted) → IDLE
 *
 * EATING
 *   ├─ (satiation full) → IDLE
 *   ├─ (no food) → HUNTING
 *   └─ (danger nearby) → FLEEING
 *
 * FLEEING
 *   ├─ (danger cleared) → IDLE
 *   ├─ (hunger high) → HUNTING
 *   └─ (in safe distance) → IDLE
 *
 * MOVING
 *   ├─ (reached target) → IDLE
 *   ├─ (hunger high) → HUNTING
 *   └─ (random) → IDLE
 * ```
 */
export class CreatureEngine {
    private creatures: Map<string, CreatureState> = new Map();
    private pendingCreatureUpdates: Map<string, CreatureState> = new Map();
    // pendingMessages stores narrative/system messages produced by async updates
    private pendingMessages: Map<string, Array<{ text: string; type: 'narrative' | 'system'; meta?: any }>> = new Map();

    private config = defaultGameConfig;

    constructor(private t: (key: string, params?: any) => string, config?: Partial<typeof defaultGameConfig>) {
        if (config) {
            this.config = {
                ...this.config,
                ...config,
                plant: { ...this.config.plant, ...(config as any).plant },
                creature: { ...this.config.creature, ...(config as any).creature }
            } as any;
        }
    }

    /**
     * Registers a creature in the simulation.
     * @param creatureId Unique identifier for the creature
     * @param creature The creature definition
     * @param position Initial position
     * @param chunk The chunk containing the creature
     */
    registerCreature(creatureId: string, creature: Enemy, position: GridPosition, chunk: Chunk): void {
        const creatureState: CreatureState = {
            ...creature,
            position: { x: position.x, y: position.y } as any,
            currentChunk: chunk,
            // lastMoveTick is measured in game ticks (not Date.now)
            lastMoveTick: 0,
            currentBehavior: 'idle'
        };
        this.creatures.set(creatureId, creatureState);
    }

    /**
     * Unregisters a creature from the simulation.
     * @param creatureId Unique identifier for the creature
     */
    unregisterCreature(creatureId: string): void {
        this.creatures.delete(creatureId);
    }

    /**
     * Updates all registered creatures for the current game tick.
     * Only processes creatures within a 20x20 range of the player and schedules their updates asynchronously.
     * @param currentTick Current game tick
     * @param playerPosition Current player position
     * @param playerStats Current player stats
     * @param chunks Available chunks for movement
     * @returns Array of narrative messages from immediate creature actions (empty for now)
     */
    updateCreatures(
        currentTick: number,
        playerPosition: GridPosition,
        playerStats: PlayerStatusDefinition,
        chunks: Map<string, Chunk>
    ): Array<{ text: string; type: 'narrative' | 'system' }> {
        // Filter creatures within 20x20 range (10 tile radius)
        const creaturesInRange: Array<[string, CreatureState]> = [];
        for (const [creatureId, creature] of this.creatures) {
            if (arePositionsWithinSquareRange(creature.position, playerPosition, 10)) {
                creaturesInRange.push([creatureId, creature]);
            }
        }

        // Schedule asynchronous updates based on distance
        for (const [creatureId, creature] of creaturesInRange) {
            const distance = Math.max(
                Math.abs(creature.position.x - playerPosition.x),
                Math.abs(creature.position.y - playerPosition.y)
            );

            let delayMs = 0;
            if (distance <= 5) {
                delayMs = 0; // Immediate
            } else if (distance <= 10) {
                delayMs = 50 + Math.random() * 100; // 50-150ms
            } else if (distance <= 15) {
                delayMs = 150 + Math.random() * 150; // 150-300ms
            } else {
                delayMs = 300 + Math.random() * 200; // 300-500ms
            }

            // Schedule the update
            setTimeout(() => {
                try {
                    // Capture previous position so caller can sync world state (from -> to)
                    const prevPos = { x: creature.position.x, y: creature.position.y };
                    const result = this.updateCreature(creature, currentTick, playerPosition, playerStats, chunks);
                    // Attach previous position to the returned updatedCreature for syncing
                    if (result && result.updatedCreature) {
                        // store prevPosition as a non-enforced property for downstream
                        (result.updatedCreature as any)._prevPosition = prevPos;
                        this.pendingCreatureUpdates.set(creatureId, result.updatedCreature);
                    }
                    if (result && Array.isArray(result.messages) && result.messages.length > 0) {
                        this.pendingMessages.set(creatureId, result.messages);
                    }
                } catch (error) {
                    // Silently handle creature update failures
                }
            }, delayMs);
        }

        // Return empty array for now - messages will be handled differently
        return [];
    }

    /**
     * Updates a single creature for the current tick.
     * Returns the updated creature state without modifying the original.
     */
    private updateCreature(
        creature: CreatureState,
        currentTick: number,
        playerPosition: GridPosition,
        playerStats: PlayerStatusDefinition,
        chunks: Map<string, Chunk>
    ): { updatedCreature: CreatureState; messages: Array<{ text: string; type: 'narrative' | 'system'; meta?: any }> } {
        const updatedCreature = { ...creature };
        const messages: Array<{ text: string; type: 'narrative' | 'system'; meta?: any }> = [];

        // Update hunger/satiation
        const wasHungry = updatedCreature.satiation < updatedCreature.maxSatiation * 0.3;
        updateHunger(updatedCreature, currentTick);
        const isHungry = updatedCreature.satiation < updatedCreature.maxSatiation * 0.3;

        // Generate hunger message if creature became hungry
        if (!wasHungry && isHungry) {
            const creatureName = (updatedCreature as any).name?.en || updatedCreature.type || 'creature';
            messages.push({
                text: this.t('creatureHungry', { creature: creatureName }),
                type: 'narrative'
            });
        }

        // Update behavior based on current state and surroundings
        updateBehavior(updatedCreature, playerPosition, playerStats);

        // If creature is hunting the player and is in melee range, perform an attack
        try {
            const searchRange = (updatedCreature as any).trophicRange ?? 2; // default 2 -> 5x5 area
            const inSearchSquare = arePositionsWithinSquareRange(updatedCreature.position, playerPosition, searchRange);
            const isAdjacent = arePositionsWithinSquareRange(updatedCreature.position, playerPosition, 1);

            if (updatedCreature.currentBehavior === 'hunting' && inSearchSquare) {
                // If creature is a carnivore (or aggressive predator) and is adjacent, attack the player
                if ((updatedCreature.trophic === 'carnivore' || updatedCreature.behavior === 'aggressive') && isAdjacent) {
                    // Calculate damage (do not mutate playerStats here - return as meta so caller can update React state)
                    const damage = updatedCreature.damage || 0;

                    const creatureName = (updatedCreature as any).name?.en || updatedCreature.type || 'creature';
                    const attackText = `${creatureName} ${this.t('creatureHunting', { creature: creatureName })} and attacks you (-${damage} HP).`;
                    messages.push({ text: attackText, type: 'narrative', meta: { playerDamage: damage } });
                }
            }
        } catch {
            // ignore attack errors
        }

        // Execute movement if needed
        if (shouldMove(updatedCreature, currentTick)) {
            const moveResult = executeMovement(updatedCreature, chunks, playerPosition, currentTick, this.t);
            if (moveResult.message) {
                messages.push(moveResult.message);
            }
        }

        // After movement, if creature is hungry and allowed to eat plants, attempt to eat
        try {
            const eatResult = attemptEatPlants(updatedCreature, this.t, this.config);
            if (eatResult && eatResult.message) {
                messages.push(eatResult.message);
            }
        } catch (err: any) {
            // swallow errors in optional behaviour
            // Silently handle eating attempt failures
        }

        // Return updated creature plus any messages produced during update
        return { updatedCreature, messages };
    }

    /**
     * Gets all registered creatures.
     */
    getCreatures(): Map<string, CreatureState> {
        return new Map(this.creatures);
    }

    /**
     * Applies all pending creature updates to the main creatures map.
     * This should be called at the beginning of each game turn to synchronize state.
     * @returns Array of narrative messages generated during the updates
     */
    applyPendingUpdates(): {
        messages: Array<{ text: string; type: 'narrative' | 'system'; meta?: any }>;
        updates: Array<{
            creatureId: string;
            prevPosition?: { x: number; y: number };
            newPosition: { x: number; y: number };
            creature: CreatureState;
        }>;
    } {
        const messages: Array<{ text: string; type: 'narrative' | 'system'; meta?: any }> = [];
        const updates: Array<{
            creatureId: string;
            prevPosition?: { x: number; y: number };
            newPosition: { x: number; y: number };
            creature: CreatureState;
        }> = [];

        for (const [creatureId, updatedCreature] of this.pendingCreatureUpdates) {
            // Apply the updated state to the main creatures map
            this.creatures.set(creatureId, updatedCreature);

            // Prepare update info for the caller so the world/chunk can be synced
            const prev: any = (updatedCreature as any)._prevPosition;
            updates.push({
                creatureId,
                prevPosition: prev ? { x: prev.x, y: prev.y } : undefined,
                newPosition: { x: updatedCreature.position.x, y: updatedCreature.position.y },
                creature: updatedCreature
            });

            // Collect any messages for this creature
            const msgs = this.pendingMessages.get(creatureId);
            if (msgs && msgs.length) {
                for (const m of msgs) messages.push(m);
            }
        }

        // Clear pending updates and messages after applying
        this.pendingCreatureUpdates.clear();
        this.pendingMessages.clear();

        return { messages, updates };
    }

    /**
     * Gets a specific creature by ID.
     */
    getCreature(creatureId: string): CreatureState | undefined {
        return this.creatures.get(creatureId);
    }

    /**
     * Find a registered creature by its current grid position. Returns the creatureId and state or null.
     */
    getCreatureByPosition(pos: GridPosition): { creatureId: string; creature: CreatureState } | null {
        for (const [id, c] of this.creatures) {
            if (c.position && c.position.x === pos.x && c.position.y === pos.y) {
                return { creatureId: id, creature: c };
            }
        }
        return null;
    }

    /**
     * Updates an existing creature's state directly.
     * Useful for external systems (like pathfinding) to inject state updates.
     * @param creatureId ID of the creature to update
     * @param newState Partial state to apply
     */
    updateCreatureRuntimeState(creatureId: string, newState: Partial<CreatureState>): void {
        const existing = this.creatures.get(creatureId);
        if (existing) {
            this.creatures.set(creatureId, { ...existing, ...newState });
        }
    }
}
