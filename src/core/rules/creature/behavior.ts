import type { GridPosition } from '@/core/values/grid-position';
import type { PlayerStatusDefinition } from '@/core/types/game';
import type { CreatureState } from './core';

/**
 * Updates creature behavior based on current state and player proximity.
 * @remarks
 * Implements a 5-state behavior machine:
 * - **aggressive**: Hunts player when in range, searches widely when hungry
 * - **passive**: Flees when player approaches (<2 tiles)
 * - **defensive**: Stands ground but doesn't pursue
 * - **territorial**: Hunts targets in search range
 * - **ambush**: Attacks only when adjacent (<1 tile)
 * - **immobile**: Stays idle (statues, plants, etc.)
 * @param creature The creature to update
 * @param playerPosition Current player grid position
 * @param playerStats Player status (HP, etc.)
 */
export function updateBehavior(
    creature: CreatureState,
    playerPosition: GridPosition,
    playerStats: PlayerStatusDefinition
): void {
    // Use per-creature search radius when available. Default to 2 tiles (5x5 area) for predators.
    const searchRange = (creature as any).trophicRange ?? 2;
    const inSquareRange = (creature.position.x !== playerPosition.x || creature.position.y !== playerPosition.y)
        ? Math.max(
            Math.abs(creature.position.x - playerPosition.x),
            Math.abs(creature.position.y - playerPosition.y)
        ) <= searchRange
        : true;

    switch (creature.behavior) {
        case 'aggressive':
            if (inSquareRange) {
                creature.currentBehavior = 'hunting';
                creature.targetPosition = { x: playerPosition.x, y: playerPosition.y } as any;
            } else if (creature.satiation < creature.maxSatiation * 0.5) {
                // If hungry, expand hunting scope (still prefer local player if in range)
                creature.currentBehavior = 'hunting';
                creature.targetPosition = { x: playerPosition.x, y: playerPosition.y } as any;
            } else {
                creature.currentBehavior = 'idle';
            }
            break;

        case 'passive':
            // Passive creatures try to flee if the player gets too close (use smaller radius)
            const passiveFleeRange = Math.max(
                Math.abs(creature.position.x - playerPosition.x),
                Math.abs(creature.position.y - playerPosition.y)
            );
            if (passiveFleeRange <= 2) {
                creature.currentBehavior = 'fleeing';
                creature.targetPosition = { x: playerPosition.x, y: playerPosition.y } as any;
            } else {
                creature.currentBehavior = 'idle';
            }
            break;

        case 'defensive':
            const defensiveRange = Math.max(
                Math.abs(creature.position.x - playerPosition.x),
                Math.abs(creature.position.y - playerPosition.y)
            );
            if (defensiveRange <= 2) {
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
            const ambushRange = Math.max(
                Math.abs(creature.position.x - playerPosition.x),
                Math.abs(creature.position.y - playerPosition.y)
            );
            if (ambushRange <= 1) {
                creature.currentBehavior = 'hunting';
                creature.targetPosition = { x: playerPosition.x, y: playerPosition.y } as any;
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
