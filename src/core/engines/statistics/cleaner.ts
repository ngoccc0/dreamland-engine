/**
 * Statistics Cleaner - Sparse Data Optimization
 *
 * @remarks
 * **Purpose:** Remove zero-valued metrics before save to keep save file lean.
 *
 * **Strategy:**
 * - Recursively prune objects that only contain zero values
 * - Keep structure, but remove empty nested objects
 * - Call before persisting statistics to storage
 *
 * **Example:**
 * ```
 * Before: { wood: { total: 5, forest: 0, desert: 0 } }
 * After:  { wood: { total: 5 } }
 * ```
 */

import { PlayerStatistics } from './schemas';

/**
 * Sanitize statistics by removing zero-valued keys
 * This keeps save files lean (sparse data principle)
 *
 * @param stats - Player statistics to clean
 * @returns New statistics object with zero values removed
 */
export function sanitizeStatistics(stats: PlayerStatistics): PlayerStatistics {
    const cleaned: PlayerStatistics = {
        lastUpdated: stats.lastUpdated,
    };

    // Clean combat stats
    if (stats.combat) {
        const cleanedCombat: typeof stats.combat = {};

        if (stats.combat.kills) {
            const cleanedKills: typeof stats.combat.kills = {
                total: stats.combat.kills.total,
            };

            // Only include non-zero by* objects
            if (stats.combat.kills.byCreatureType) {
                const byType = removeZeroValues(stats.combat.kills.byCreatureType);
                if (Object.keys(byType).length > 0) {
                    cleanedKills.byCreatureType = byType;
                }
            }

            if (stats.combat.kills.byLocation) {
                const byLoc = removeZeroValues(stats.combat.kills.byLocation);
                if (Object.keys(byLoc).length > 0) {
                    cleanedKills.byLocation = byLoc;
                }
            }

            if (stats.combat.kills.byWeapon) {
                const byWeapon = removeZeroValues(stats.combat.kills.byWeapon);
                if (Object.keys(byWeapon).length > 0) {
                    cleanedKills.byWeapon = byWeapon;
                }
            }

            cleanedCombat.kills = cleanedKills;
        }

        if (stats.combat.damageDealt) {
            cleanedCombat.damageDealt = stats.combat.damageDealt;
        }

        if (stats.combat.healthLost) {
            cleanedCombat.healthLost = stats.combat.healthLost;
        }

        if (Object.keys(cleanedCombat).length > 0) {
            cleaned.combat = cleanedCombat;
        }
    }

    // Clean gathering stats
    if (stats.gathering) {
        const cleanedGathering: typeof stats.gathering = { itemsCollected: {} };

        if (stats.gathering.itemsCollected) {
            for (const [itemId, itemStats] of Object.entries(
                stats.gathering.itemsCollected
            )) {
                if (itemStats && itemStats.total > 0) {
                    const cleanedItem: typeof itemStats = { total: itemStats.total };

                    if (itemStats.byBiome) {
                        const byBiome = removeZeroValues(itemStats.byBiome);
                        if (Object.keys(byBiome).length > 0) {
                            cleanedItem.byBiome = byBiome;
                        }
                    }

                    if (itemStats.byTool) {
                        const byTool = removeZeroValues(itemStats.byTool);
                        if (Object.keys(byTool).length > 0) {
                            cleanedItem.byTool = byTool;
                        }
                    }

                    cleanedGathering.itemsCollected![itemId] = cleanedItem;
                }
            }
        }

        if (stats.gathering.distanceTraveled) {
            cleanedGathering.distanceTraveled = stats.gathering.distanceTraveled;
        }

        if (
            Object.keys(cleanedGathering.itemsCollected).length > 0 ||
            cleanedGathering.distanceTraveled
        ) {
            cleaned.gathering = cleanedGathering;
        }
    }

    // Clean crafting stats
    if (stats.crafting) {
        const cleanedCrafting: typeof stats.crafting = { itemsCrafted: {} };

        if (stats.crafting.itemsCrafted) {
            for (const [itemId, itemStats] of Object.entries(
                stats.crafting.itemsCrafted
            )) {
                if (itemStats && itemStats.total > 0) {
                    const cleanedItem: typeof itemStats = { total: itemStats.total };

                    if (itemStats.byRecipe) {
                        const byRecipe = removeZeroValues(itemStats.byRecipe);
                        if (Object.keys(byRecipe).length > 0) {
                            cleanedItem.byRecipe = byRecipe;
                        }
                    }

                    cleanedCrafting.itemsCrafted![itemId] = cleanedItem;
                }
            }
        }

        if (Object.keys(cleanedCrafting.itemsCrafted).length > 0) {
            cleaned.crafting = cleanedCrafting;
        }
    }

    // Clean exploration stats
    if (stats.exploration) {
        const cleanedExploration: Partial<typeof stats.exploration> = {};

        if (stats.exploration.biomesDiscovered && stats.exploration.biomesDiscovered > 0) {
            cleanedExploration.biomesDiscovered = stats.exploration.biomesDiscovered;
        }

        if (stats.exploration.locationsDiscovered && stats.exploration.locationsDiscovered > 0) {
            cleanedExploration.locationsDiscovered =
                stats.exploration.locationsDiscovered;
        }

        if (stats.exploration.timeSpent) {
            cleanedExploration.timeSpent = stats.exploration.timeSpent;
        }

        if (Object.keys(cleanedExploration).length > 0) {
            cleaned.exploration = cleanedExploration as typeof stats.exploration;
        }
    }

    return cleaned;
}

/**
 * Remove entries with zero values from an object
 *
 * @param obj - Object to clean
 * @returns New object with zero values removed
 */
function removeZeroValues(obj: Record<string, number>): Record<string, number> {
    const cleaned: Record<string, number> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value > 0) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

/**
 * Get approximate size of statistics object in bytes
 * Useful for monitoring save file growth
 *
 * @param stats - Player statistics
 * @returns Estimated size in bytes
 */
export function estimateStatisticsSize(stats: PlayerStatistics): number {
    return JSON.stringify(stats).length;
}
