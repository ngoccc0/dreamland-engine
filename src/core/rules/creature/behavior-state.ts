/**
 * Creature Behavior State Machine
 *
 * @remarks
 * Defines explicit states and transitions for creature behavior.
 * Integrates with pathfinding to trigger path calculations when behavior changes.
 *
 * ### State Machine
 * ```
 * IDLE
 *   ├─ (player in range + aggressive) → HUNTING
 *   ├─ (player too close + passive) → FLEEING
 *   └─ (hungry) → SEEKING_FOOD
 *
 * HUNTING
 *   ├─ (target unreachable 3x) → STUCK → IDLE
 *   ├─ (target dead/gone) → IDLE
 *   └─ (reached target) → ATTACKING
 *
 * FLEEING
 *   ├─ (safe distance) → IDLE
 *   └─ (cornered) → DEFENDING
 *
 * SEEKING_FOOD
 *   ├─ (food found) → EATING
 *   └─ (no food) → IDLE
 * ```
 */

import type { GridPosition } from '@/core/values/grid-position';
import type { CreatureState } from './core';
import type { PathfindingTarget } from './pathfinding-state';

/**
 * Explicit behavior states for creatures.
 * More granular than the legacy `currentBehavior` string.
 */
export type BehaviorState =
    | 'idle'
    | 'hunting'
    | 'fleeing'
    | 'seeking-food'
    | 'eating'
    | 'defending'
    | 'stuck'
    | 'pathing'; // Actively following a path

/**
 * Result of a behavior transition decision.
 */
export interface BehaviorTransitionResult {
    /** New behavior state */
    newState: BehaviorState;
    /** Target for pathfinding (if applicable) */
    pathfindingTarget?: PathfindingTarget;
    /** Whether pathfinding should be triggered */
    shouldRecalculatePath: boolean;
}

/**
 * Determine the next behavior state based on current conditions.
 *
 * @remarks
 * Pure function. Does not mutate inputs.
 * Returns a decision object for the caller to apply.
 *
 * @param creature - Current creature state
 * @param playerPosition - Player's current position
 * @param creatureToPlayerDistance - Chebyshev distance to player
 * @param isHungry - Whether creature satiation is below threshold
 * @param hasValidPath - Whether creature currently has a valid path
 * @returns Transition result with new state and pathfinding trigger
 */
export function determineBehaviorTransition(
    creature: CreatureState,
    playerPosition: GridPosition,
    creatureToPlayerDistance: number,
    isHungry: boolean,
    hasValidPath: boolean
): BehaviorTransitionResult {
    const searchRange = (creature as any).trophicRange ?? 2;
    const playerInRange = creatureToPlayerDistance <= searchRange;
    const playerTooClose = creatureToPlayerDistance <= 2;
    const playerAdjacent = creatureToPlayerDistance <= 1;

    // Default: stay in current state
    let newState: BehaviorState = creature.currentBehavior as BehaviorState;
    let pathfindingTarget: PathfindingTarget | undefined;
    let shouldRecalculatePath = false;

    switch (creature.behavior) {
        case 'aggressive':
            if (playerInRange || isHungry) {
                newState = 'hunting';
                pathfindingTarget = { type: 'location', x: playerPosition.x, y: playerPosition.y };
                shouldRecalculatePath = !hasValidPath || creature.currentBehavior !== 'hunting';
            } else {
                newState = 'idle';
            }
            break;

        case 'passive':
            if (playerTooClose) {
                newState = 'fleeing';
                // Flee target: move AWAY from player (handled by movement, not pathfinding)
                shouldRecalculatePath = false;
            } else {
                newState = 'idle';
            }
            break;

        case 'defensive':
            if (playerAdjacent) {
                newState = 'defending';
            } else {
                newState = 'idle';
            }
            break;

        case 'territorial':
            if (playerInRange) {
                newState = 'hunting';
                pathfindingTarget = { type: 'location', x: playerPosition.x, y: playerPosition.y };
                shouldRecalculatePath = !hasValidPath;
            } else {
                newState = 'idle';
            }
            break;

        case 'ambush':
            if (playerAdjacent) {
                newState = 'hunting';
                pathfindingTarget = { type: 'location', x: playerPosition.x, y: playerPosition.y };
                shouldRecalculatePath = false; // Already adjacent, no path needed
            } else {
                newState = 'idle';
            }
            break;

        case 'immobile':
        default:
            newState = 'idle';
            break;
    }

    // If creature is stuck (from pathfinding failures), reset to idle
    if ((creature.currentBehavior as string) === 'stuck') {
        // Stay stuck for 1 tick, then try again
        newState = 'idle';
    }

    return {
        newState,
        pathfindingTarget,
        shouldRecalculatePath,
    };
}

/**
 * Calculate Chebyshev distance between two positions.
 * @param a Position A
 * @param b Position B
 * @returns Max of |dx| and |dy|
 */
export function chebyshevDistance(a: GridPosition, b: GridPosition): number {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * Check if a creature's satiation qualifies as "hungry".
 * @param creature Creature to check
 * @returns true if satiation < 30% of max
 */
export function isCreatureHungry(creature: CreatureState): boolean {
    return creature.satiation < creature.maxSatiation * 0.3;
}
