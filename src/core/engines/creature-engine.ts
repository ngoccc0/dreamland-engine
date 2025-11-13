import type { Enemy, Chunk, PlayerStatusDefinition } from '@/core/types/game';
import defaultGameConfig from '@/lib/config/game-config';
import { GridPosition } from '../values/grid-position';

/**
 * Interface for creature state during simulation.
 * Extends Enemy with additional runtime properties.
 */
interface CreatureState extends Enemy {
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
 * Engine responsible for simulating creature behavior, movement, and AI.
 * Handles hunger mechanics, movement patterns, and behavior-based actions.
 */
export class CreatureEngine {
    private creatures: Map<string, CreatureState> = new Map();
    private pendingCreatureUpdates: Map<string, CreatureState> = new Map();

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
            position: new GridPosition(position.x, position.y),
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
            if (this.isWithinSquareRange(creature.position, playerPosition, 10)) {
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
                    const updatedCreature = this.updateCreature(creature, currentTick, playerPosition, playerStats, chunks);
                    this.pendingCreatureUpdates.set(creatureId, updatedCreature);
                } catch (error) {
                    console.warn(`CreatureEngine: Failed to update creature ${creatureId}`, error);
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
    ): CreatureState {
        const updatedCreature = { ...creature };
        const messages: Array<{ text: string; type: 'narrative' | 'system' }> = [];

        // Update hunger/satiation
        const wasHungry = updatedCreature.satiation < updatedCreature.maxSatiation * 0.3;
        this.updateHunger(updatedCreature, currentTick);
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
    this.updateBehavior(updatedCreature, playerPosition, playerStats);

        // If creature is hunting the player and is in melee range, perform an attack
        try {
            const searchRange = (updatedCreature as any).trophicRange ?? 2; // default 2 -> 5x5 area
            const inSearchSquare = this.isWithinSquareRange(updatedCreature.position, playerPosition, searchRange);
            const isAdjacent = this.isWithinSquareRange(updatedCreature.position, playerPosition, 1);

            if (updatedCreature.currentBehavior === 'hunting' && inSearchSquare) {
                // If creature is a carnivore (or aggressive predator) and is adjacent, attack the player
                if ((updatedCreature.trophic === 'carnivore' || updatedCreature.behavior === 'aggressive') && isAdjacent) {
                    // Apply damage to player
                    const damage = updatedCreature.damage || 0;
                    playerStats.hp = Math.max(0, (playerStats.hp || 0) - damage);

                    const creatureName = (updatedCreature as any).name?.en || updatedCreature.type || 'creature';
                    const attackText = `${creatureName} ${this.t('creatureHunting', { creature: creatureName })} and attacks you (-${damage} HP).`;
                    messages.push({ text: attackText, type: 'narrative' });
                }
            }
        } catch {
            // ignore attack errors
        }

        // Execute movement if needed
        if (this.shouldMove(updatedCreature, currentTick)) {
            const moveResult = this.executeMovement(updatedCreature, chunks, playerPosition, currentTick);
            if (moveResult.message) {
                messages.push(moveResult.message);
            }
        }

        // After movement, if creature is hungry and allowed to eat plants, attempt to eat
        try {
            const eatResult = this.attemptEatPlants(updatedCreature);
            if (eatResult && eatResult.message) {
                messages.push(eatResult.message);
            }
        } catch (err: any) {
            // swallow errors in optional behaviour
            console.warn('CreatureEngine: eating attempt failed', err);
        }

        // For now, we'll handle messages differently since updates are asynchronous
        // Messages will be collected when applying pending updates
        return updatedCreature;
    }

    /**
     * Updates creature hunger and satiation levels.
     */
    private updateHunger(creature: CreatureState, currentTick: number): void {
        // Hunger decay every 10 ticks

        if (currentTick % this.config.creature.hungerDecayInterval === 0) {
            creature.satiation = Math.max(0, creature.satiation - this.config.creature.hungerDecayPerTick);

            // If very hungry, creature becomes more aggressive
            if (creature.satiation < creature.maxSatiation * 0.2) {
                if (creature.behavior === 'passive') {
                    creature.behavior = 'territorial';
                }
            }
        }
    }

    /**
     * Determine if the creature is allowed to eat plants based on trophic tag or diet keywords.
     */
    private canEatPlants(creature: CreatureState): boolean {
        if (creature.trophic === 'herbivore') return true;
        if (creature.trophic === 'carnivore') return false;
        if (creature.trophic === 'omnivore') return true;

        // Fallback: look for plant-like keywords in diet
        const plantKeywords = ['plant', 'berry', 'grass', 'herb', 'leaf'];
        if (Array.isArray(creature.diet)) {
            for (const d of creature.diet) {
                if (!d) continue;
                const lower = d.toString().toLowerCase();
                if (plantKeywords.some(k => lower.includes(k))) return true;
            }
        }

        return false;
    }

    /**
     * Attempt to eat plants in the creature's current chunk. Returns narrative info when eating occurs.
     */
    private attemptEatPlants(creature: CreatureState): { eaten: boolean; message?: { text: string; type: 'narrative' | 'system' } } | null {
        try {
            if (!this.canEatPlants(creature)) return null;

            // Only attempt eating when hungry
            const hungry = creature.satiation < (creature.maxSatiation * 0.6);
            if (!hungry) return null;

            const chunk = creature.currentChunk;
            if (!chunk || typeof chunk.vegetationDensity !== 'number') return null;

            const veg = chunk.vegetationDensity;
            if (veg <= 0) return null;

            // Chance to eat
            if (Math.random() > (this.config.plant.eatChance ?? 0.6)) return null;

            const amount = Math.min(veg, this.config.plant.consumptionPerEat ?? 5);
            if (amount <= 0) return null;

            // Apply consumption
            chunk.vegetationDensity = Math.max(0, veg - amount);

            // Increase satiation based on plantNutrition per vegetation unit
            const nutritionPerUnit = this.config.plant.plantNutrition ?? 0.5;
            const satiationGain = amount * nutritionPerUnit;
            creature.satiation = Math.min(creature.maxSatiation, creature.satiation + satiationGain);

            const creatureName = (creature as any).name?.en || creature.type || 'creature';
            const text = this.t('creatureEating', { creature: creatureName });
            return { eaten: true, message: { text, type: 'narrative' } };
        } catch {
            return null;
        }
    }

    /**
     * Updates creature behavior based on current state and player proximity.
     */
    private updateBehavior(
        creature: CreatureState,
        playerPosition: GridPosition,
        playerStats: PlayerStatusDefinition
    ): void {
        // Use per-creature search radius when available. Default to 2 tiles (5x5 area) for predators.
        const searchRange = (creature as any).trophicRange ?? 2;
        const inSquareRange = this.isWithinSquareRange(creature.position, playerPosition, searchRange);

        switch (creature.behavior) {
            case 'aggressive':
                if (inSquareRange) {
                    creature.currentBehavior = 'hunting';
                    creature.targetPosition = new GridPosition(playerPosition.x, playerPosition.y);
                } else if (creature.satiation < creature.maxSatiation * 0.5) {
                    // If hungry, expand hunting scope (still prefer local player if in range)
                    creature.currentBehavior = 'hunting';
                    creature.targetPosition = new GridPosition(playerPosition.x, playerPosition.y);
                } else {
                    creature.currentBehavior = 'idle';
                }
                break;

            case 'passive':
                // Passive creatures try to flee if the player gets too close (use smaller radius)
                if (this.isWithinSquareRange(creature.position, playerPosition, 2)) {
                    creature.currentBehavior = 'fleeing';
                    creature.targetPosition = new GridPosition(playerPosition.x, playerPosition.y);
                } else {
                    creature.currentBehavior = 'idle';
                }
                break;

            case 'defensive':
                if (this.isWithinSquareRange(creature.position, playerPosition, 2)) {
                    creature.currentBehavior = 'idle'; // Stand ground
                } else {
                    creature.currentBehavior = 'idle';
                }
                break;

            case 'territorial':
                if (inSquareRange) {
                    creature.currentBehavior = 'hunting';
                } else {
                    creature.currentBehavior = 'idle';
                }
                break;

            case 'ambush':
                if (this.isWithinSquareRange(creature.position, playerPosition, 1)) {
                    creature.currentBehavior = 'hunting';
                    creature.targetPosition = new GridPosition(playerPosition.x, playerPosition.y);
                } else {
                    creature.currentBehavior = 'idle';
                }
                break;

            case 'immobile':
            default:
                creature.currentBehavior = 'idle';
                break;
        }
    }

    /**
     * Return true if two positions are within a square (Chebyshev) distance <= range.
     * This models an N x N tile search box centered on the creature (e.g., range=2 -> 5x5).
     */
    private isWithinSquareRange(a: GridPosition, b: GridPosition, range: number): boolean {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return Math.max(dx, dy) <= range;
    }

    /**
     * Determines if the creature should move this tick.
     */
    private shouldMove(creature: CreatureState, currentTick: number): boolean {
        // Move every 5 ticks if not idle
        return creature.currentBehavior !== 'idle' && (currentTick - creature.lastMoveTick) >= 5;
    }

    /**
     * Executes movement for the creature.
     */
    private executeMovement(
        creature: CreatureState,
        chunks: Map<string, Chunk>,
        playerPosition: GridPosition,
        currentTick: number
    ): { moved: boolean; message?: { text: string; type: 'narrative' | 'system' } } {
        let newPosition: GridPosition;

        switch (creature.currentBehavior) {
            case 'fleeing':
                // Move away from target (usually player)
                newPosition = this.calculateFleePosition(creature, creature.targetPosition ?? playerPosition);
                break;

            case 'hunting':
                // Move towards target (player or food)
                newPosition = this.calculateHuntPosition(creature, creature.targetPosition ?? playerPosition);
                break;

            case 'moving':
            case 'idle':
            default:
                // Random movement
                newPosition = this.calculateRandomPosition(creature);
                break;
        }

        // Check if movement is valid
        if (this.isValidMove(newPosition, chunks)) {
            creature.position = newPosition;
            // Record tick at which movement happened
            creature.lastMoveTick = currentTick;

            // Update current chunk if moved to a different one
            const newChunkKey = `${newPosition.x},${newPosition.y}`;
            const newChunk = chunks.get(newChunkKey);
            if (newChunk) {
                creature.currentChunk = newChunk;
            }

            const creatureName = (creature as any).name?.en || creature.type || 'creature';
            let messageText: string;

            switch (creature.currentBehavior) {
                case 'fleeing':
                    messageText = this.t('creatureFleeing', { creature: creatureName });
                    break;
                case 'hunting':
                    messageText = this.t('creatureHunting', { creature: creatureName });
                    break;
                case 'moving':
                    messageText = this.t('creatureMoving', { creature: creatureName });
                    break;
                default:
                    messageText = this.t('creatureMoving', { creature: creatureName });
                    break;
            }

            return {
                moved: true,
                message: {
                    text: messageText,
                    type: 'narrative'
                }
            };
        }

        return { moved: false };
    }

    /**
     * Calculates a position for fleeing behavior.
     */
    private calculateFleePosition(creature: CreatureState, threatPosition: GridPosition): GridPosition {
        // Move away from the threat position (player or predator)
        const dx = creature.position.x - threatPosition.x;
        const dy = creature.position.y - threatPosition.y;
        const nx = Math.sign(dx) || (Math.random() < 0.5 ? -1 : 1);
        const ny = Math.sign(dy) || (Math.random() < 0.5 ? -1 : 1);
        return new GridPosition(creature.position.x + nx, creature.position.y + ny);
    }

    /**
     * Calculates a position for hunting behavior.
     */
    private calculateHuntPosition(creature: CreatureState, targetPosition: GridPosition): GridPosition {
        // Move towards the target position (player or food)
        const dx = targetPosition.x - creature.position.x;
        const dy = targetPosition.y - creature.position.y;
        const nx = Math.sign(dx) || (Math.random() < 0.5 ? -1 : 1);
        const ny = Math.sign(dy) || (Math.random() < 0.5 ? -1 : 1);
        return new GridPosition(creature.position.x + nx, creature.position.y + ny);
    }

    /**
     * Calculates a random movement position.
     */
    private calculateRandomPosition(creature: CreatureState): GridPosition {
        const directions = [
            { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: 1, y: 1 }
        ];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        return new GridPosition(
            creature.position.x + randomDir.x,
            creature.position.y + randomDir.y
        );
    }

    /**
     * Checks if a move to the given position is valid.
     */
    private isValidMove(position: GridPosition, chunks: Map<string, Chunk>): boolean {
        const chunkKey = `${position.x},${position.y}`;
        const chunk = chunks.get(chunkKey);

        // Basic validation: chunk exists and is not blocked
        return chunk !== undefined && chunk.travelCost < 100; // High travel cost indicates blocked
    }

    /**
     * Calculates distance between two positions.
     */
    private calculateDistance(pos1: GridPosition, pos2: GridPosition): number {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
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
    applyPendingUpdates(): Array<{ text: string; type: 'narrative' | 'system' }> {
        const messages: Array<{ text: string; type: 'narrative' | 'system' }> = [];

        for (const [creatureId, updatedCreature] of this.pendingCreatureUpdates) {
            // Apply the updated state to the main creatures map
            this.creatures.set(creatureId, updatedCreature);

            // For now, we don't have a way to collect messages from asynchronous updates
            // Messages would need to be handled differently in the asynchronous context
            // This is a limitation of the current design that could be addressed in future iterations
        }

        // Clear pending updates after applying
        this.pendingCreatureUpdates.clear();

        return messages;
    }

    /**
     * Gets a specific creature by ID.
     */
    getCreature(creatureId: string): CreatureState | undefined {
        return this.creatures.get(creatureId);
    }
}
