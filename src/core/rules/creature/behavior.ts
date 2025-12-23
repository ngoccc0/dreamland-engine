import type { GridPosition } from '@/core/values/grid-position';
import type { PlayerStatusDefinition } from '@/core/types/game';
import type { CreatureState } from './core';
import {
    determineBehaviorTransition,
    chebyshevDistance,
    isCreatureHungry,
} from './behavior-state';
import { isFauna, isMonster } from '@/core/domain/creature';

/**
 * Updates creature behavior based on current state and player proximity.
 * @remarks
 * Uses the explicit state machine from `behavior-state.ts`.
 * Integrates pathfinding triggers for intelligent movement.
 *
 * @param creature The creature to update
 * @param playerPosition Current player grid position
 * @param playerStats Player status (HP, etc.)
 */
export function updateBehavior(
    creature: CreatureState,
    playerPosition: GridPosition,
    playerStats: PlayerStatusDefinition
): void {
    // Calculate distance to player
    const distance = chebyshevDistance(creature.position, playerPosition);

    // Check hunger
    const isHungry = isCreatureHungry(creature);

    // Check if creature has a valid path
    // @ts-ignore - pathfinding property may not exist on legacy CreatureState
    const hasValidPath = !!(creature as any).pathfinding?.state?.currentPath?.length;

    // Get transition decision
    const transition = determineBehaviorTransition(
        creature,
        playerPosition,
        distance,
        isHungry,
        hasValidPath
    );

    // Apply new behavior state
    creature.currentBehavior = transition.newState as any;

    // Set target position if transitioning to hunting/fleeing
    if (transition.pathfindingTarget && transition.pathfindingTarget.type === 'location') {
        creature.targetPosition = {
            x: transition.pathfindingTarget.x,
            y: transition.pathfindingTarget.y,
        } as any;
    }

    // If pathfinding should be recalculated, update pathfinding state
    // The actual path calculation happens in creature-pathfinding.ts usecase
    // Here we just set the target so the next pathfinding tick picks it up
    if (transition.shouldRecalculatePath && transition.pathfindingTarget) {
        // For creatures with pathfinding capability, update the target
        // @ts-ignore - accessing pathfinding on engine's CreatureState
        if ((creature as any).pathfinding?.state) {
            (creature as any).pathfinding.state.target = transition.pathfindingTarget;
            // Also mark path as stale to force recalculation
            (creature as any).pathfinding.state.pathAge = 999;
        }
    }
}
