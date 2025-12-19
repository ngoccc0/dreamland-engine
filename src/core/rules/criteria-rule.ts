/**
 * Criteria Rule - Quest & Achievement Evaluation
 *
 * @remarks
 * **Single Evaluator for Dual Purpose:** Both Quests and Achievements use the same schema.
 * This function checks if criteria are satisfied, enabling code reuse.
 *
 * **Type-Safe:** Discriminated union on criteria.type ensures exhaustiveness.
 *
 * **Shared with:** Quest System, Achievement System
 */

import { QuestCriteria } from '@/core/domain/quest';
import { PlayerStatistics } from '@/core/engines/statistics/schemas';
import { StatsQuery } from '@/core/engines/statistics/query';

/**
 * Evaluate whether quest/achievement criteria are satisfied
 *
 * @param criteria - Quest/Achievement criteria (discriminated union)
 * @param stats - Player statistics
 * @returns true if all criteria conditions are met
 *
 * @remarks
 * Uses StatsQuery for all lookups (safe undefined handling).
 * Works for both quests (checked on demand) and achievements (auto-evaluated).
 *
 * **Examples:**
 * ```typescript
 * // Quest: Kill 10 slimes
 * evaluateCriteria({ type: 'KILL_CREATURE', params: { creatureType: 'slime', count: 10 } }, stats)
 *
 * // Achievement: Gather 50 wood from forest
 * evaluateCriteria({ type: 'GATHER_ITEM', params: { itemId: 'wood', count: 50, biome: 'forest' } }, stats)
 * ```
 */
export function evaluateCriteria(criteria: QuestCriteria, stats: PlayerStatistics): boolean {
    switch (criteria.type) {
        case 'KILL_CREATURE':
            return StatsQuery.hasKilledCreatures(
                stats,
                criteria.params.count,
                {
                    creatureType: criteria.params.creatureType,
                    biome: criteria.params.biome,
                    weapon: criteria.params.weapon,
                }
            );

        case 'GATHER_ITEM':
            return StatsQuery.hasGatheredItem(
                stats,
                criteria.params.itemId,
                criteria.params.count,
                {
                    biome: criteria.params.biome,
                    tool: criteria.params.tool,
                }
            );

        case 'CRAFT_ITEM':
            return StatsQuery.hasCraftedItem(
                stats,
                criteria.params.itemId,
                criteria.params.count
            );

        case 'TRAVEL_DISTANCE':
            return StatsQuery.hasTraveledDistance(
                stats,
                criteria.params.distance,
                criteria.params.biome ? { biome: criteria.params.biome } : undefined
            );

        case 'CUSTOM':
            // Custom criteria require external implementation
            // Typically triggered by game events (e.g., "reach_ancient_ruins")
            // For now, return false (not implemented)
            return false;

        default:
            // TypeScript exhaustiveness check
            return false;
    }
}

/**
 * Evaluate multiple criteria (AND logic)
 *
 * @param criteriaList - Array of criteria objects
 * @param stats - Player statistics
 * @returns true if ALL criteria are satisfied
 */
export function evaluateAllCriteria(
    criteriaList: QuestCriteria[],
    stats: PlayerStatistics
): boolean {
    return criteriaList.every(criteria => evaluateCriteria(criteria, stats));
}

/**
 * Evaluate multiple criteria (OR logic)
 *
 * @param criteriaList - Array of criteria objects
 * @param stats - Player statistics
 * @returns true if ANY criteria is satisfied
 */
export function evaluateAnyCriteria(
    criteriaList: QuestCriteria[],
    stats: PlayerStatistics
): boolean {
    return criteriaList.some(criteria => evaluateCriteria(criteria, stats));
}

/**
 * Get progress towards criteria completion (0-1)
 *
 * @param criteria - Quest/Achievement criteria
 * @param stats - Player statistics
 * @returns Progress ratio (0.0 to 1.0+)
 *
 * @remarks
 * Useful for progress bars. Returns >1.0 if criteria already exceeded.
 * Throws for custom criteria (requires external implementation).
 */
export function getCriteriaProgress(
    criteria: QuestCriteria,
    stats: PlayerStatistics
): number {
    switch (criteria.type) {
        case 'KILL_CREATURE':
            const killCount = StatsQuery.getKillCount(stats, {
                creatureType: criteria.params.creatureType,
                biome: criteria.params.biome,
                weapon: criteria.params.weapon,
            });
            return killCount / criteria.params.count;

        case 'GATHER_ITEM':
            const itemCount = StatsQuery.getItemCount(
                stats,
                criteria.params.itemId,
                {
                    biome: criteria.params.biome,
                    tool: criteria.params.tool,
                }
            );
            return itemCount / criteria.params.count;

        case 'CRAFT_ITEM':
            const craftCount = StatsQuery.getCraftedItemCount(
                stats,
                criteria.params.itemId
            );
            return craftCount / criteria.params.count;

        case 'TRAVEL_DISTANCE':
            const distance = StatsQuery.getDistanceTraveled(
                stats,
                criteria.params.biome ? { biome: criteria.params.biome } : undefined
            );
            return distance / criteria.params.distance;

        case 'CUSTOM':
            throw new Error(
                '[CriteriaRule] Custom criteria cannot be evaluated automatically. Implement custom handler.'
            );

        default:
            return 0;
    }
}
