import type { GridPosition } from '@/core/values/grid-position';
import type { CreatureState } from './core';
import type { Chunk } from '@/core/types/game';
import { arePositionsWithinSquareRange } from './core';
import { getCreatureNextWaypoint } from '@/core/usecases/creature-pathfinding';

/**
 * Determines if the creature should move this tick.
 * @remarks
 * **Movement Schedule:**
 * - Creatures move every 5 ticks when not idle
 * - Idle creatures never move (wander disabled)
 * @param creature The creature to check
 * @param currentTick Current game tick number
 * @returns true if creature should attempt movement
 */
export function shouldMove(creature: CreatureState, currentTick: number): boolean {
    // Move every 5 ticks if not idle
    return creature.currentBehavior !== 'idle' && (currentTick - creature.lastMoveTick) >= 5;
}

/**
 * Executes movement for the creature based on current behavior.
 * @remarks
 * **Behavior → Movement Type:**
 * - **fleeing**: Move away from target (player)
 * - **hunting**: Move toward target (player or food)
 * - **moving/seek**: Move along A* path if available
 * - **moving/idle**: Random wandering (8 directions)
 * 
 * **Validation:**
 * - Checks chunk exists at destination
 * - Rejects if travelCost >= 100 (blocked terrain)
 * 
 * **Side Effects:**
 * - Updates creature.position (x, y)
 * - Updates creature.lastMoveTick
 * - Updates creature.currentChunk if moved to different chunk
 * - Generates narrative message describing movement
 * 
 * @param creature The creature to move
 * @param chunks Map of available chunks in world
 * @param playerPosition Current player grid position (reference for calculating flee/hunt direction)
 * @param currentTick Current game tick (used to timestamp movement)
 * @param t Translation function for i18n
 * @returns Object with moved flag (true if valid move executed) and optional narrative message
 */
export function executeMovement(
    creature: CreatureState,
    chunks: Map<string, Chunk>,
    playerPosition: GridPosition,
    currentTick: number,
    t: (key: string, params?: any) => string
): { moved: boolean; message?: { text: string; type: 'narrative' | 'system' } } {
    let newPosition: GridPosition;
    let usedPathfinding = false;

    // 1. Priority: Check if there's an A* path to follow
    // @ts-ignore - engine type mismatch vs domain type, safe in runtime
    const nextWaypoint = getCreatureNextWaypoint(creature);

    if (nextWaypoint) {
        newPosition = { x: nextWaypoint[0], y: nextWaypoint[1] } as any;
        usedPathfinding = true;
    } else {
        // 2. Fallback: Legacy greedy behaviors
        switch (creature.currentBehavior) {
            case 'fleeing':
                // Move away from target (usually player)
                newPosition = calculateFleePosition(creature, creature.targetPosition ?? playerPosition);
                break;

            case 'hunting':
                // Move towards target (player or food)
                newPosition = calculateHuntPosition(creature, creature.targetPosition ?? playerPosition);
                break;

            case 'moving':
            case 'idle':
            default:
                // Random movement
                newPosition = calculateRandomPosition(creature);
                break;
        }
    }

    // Check if movement is valid
    if (isValidMove(newPosition, chunks)) {
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
                messageText = t('creatureFleeing', { creature: creatureName });
                break;
            case 'hunting':
                messageText = t('creatureHunting', { creature: creatureName });
                break;
            case 'moving':
                messageText = t('creatureMoving', { creature: creatureName });
                break;
            default:
                messageText = t('creatureMoving', { creature: creatureName });
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

    // Movement blocked/failed
    return { moved: false };
}

/**
 * Calculates a position for fleeing behavior.
 * @remarks
 * **Algorithm:**
 * - Calculates direction vector away from threat (dx = creature.x - threat.x)
 * - Takes sign of each component (-1, 0, or 1)
 * - Moves one cell in that direction
 * - Falls back to random direction if vectors are equal
 * @param creature The creature fleeing
 * @param threatPosition Position to flee from (usually player)
 * @returns New grid position (one cell away from threat)
 */
export function calculateFleePosition(creature: CreatureState, threatPosition: GridPosition): GridPosition {
    // Move away from the threat position (player or predator)
    const dx = creature.position.x - threatPosition.x;
    const dy = creature.position.y - threatPosition.y;
    const nx = Math.sign(dx) || (Math.random() < 0.5 ? -1 : 1);
    const ny = Math.sign(dy) || (Math.random() < 0.5 ? -1 : 1);
    return { x: creature.position.x + nx, y: creature.position.y + ny } as any;
}

/**
 * Calculates a position for hunting behavior.
 * @remarks
 * **Algorithm:**
 * - Calculates direction vector toward target (dx = target.x - creature.x)
 * - Takes sign of each component (-1, 0, or 1)
 * - Moves one cell in that direction
 * - Falls back to random direction if vectors are equal (target at same position)
 * @param creature The creature hunting
 * @param targetPosition Position to hunt toward (usually player or food)
 * @returns New grid position (one cell closer to target)
 */
export function calculateHuntPosition(creature: CreatureState, targetPosition: GridPosition): GridPosition {
    // Move towards the target position (player or food)
    const dx = targetPosition.x - creature.position.x;
    const dy = targetPosition.y - creature.position.y;
    const nx = Math.sign(dx) || (Math.random() < 0.5 ? -1 : 1);
    const ny = Math.sign(dy) || (Math.random() < 0.5 ? -1 : 1);
    return { x: creature.position.x + nx, y: creature.position.y + ny } as any;
}

/**
 * Calculates a random movement position.
 * @remarks
 * **Algorithm:**
 * - Selects one of 8 cardinal/diagonal directions uniformly at random
 * - Moves exactly one cell in chosen direction
 * 
 * **Directions:** N, S, E, W, NE, NW, SE, SW (all equally likely)
 * @param creature The creature moving
 * @returns New grid position (one cell in random direction)
 */
export function calculateRandomPosition(creature: CreatureState): GridPosition {
    const directions = [
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: -1 },
        { x: -1, y: 1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 }
    ];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    return { x: creature.position.x + randomDir.x, y: creature.position.y + randomDir.y } as any;
}

/**
 * Checks if a move to the given position is valid.
 * @remarks
 * **Validation Criteria:**
 * 1. Chunk exists at destination coordinates
 * 2. Chunk travelCost < 100 (not blocked terrain)
 * 
 * High travel costs (>=100) indicate walls, water, lava (impassable)
 * @param position Position to validate
 * @param chunks Map of all chunks in world
 * @returns true if move is valid, false if blocked or chunk missing
 */
export function isValidMove(position: GridPosition, chunks: Map<string, Chunk>): boolean {
    const chunkKey = `${position.x},${position.y}`;
    const chunk = chunks.get(chunkKey);

    // Basic validation: chunk exists and is not blocked
    return chunk !== undefined && chunk.travelCost < 100; // High travel cost indicates blocked
}
