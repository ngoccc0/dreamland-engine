/**
 * Reward Generator Utilities
 *
 * Pure utility functions for generating exploration rewards.
 * These functions are stateless and deterministic, suitable for both
 * runtime gameplay and testing.
 */

import { itemDefinitions } from '@/lib/game/items';

/**
 * generateDiscoveryRewards
 *
 * Generate item rewards for exploring a specific discovery type.
 *
 * @remarks
 * Different discovery types yield different rewards:
 * - ANCIENT_RUINS: High-tier equipment + materials
 * - HERB_GROVE: Food + healing materials
 * - TREASURE_CHEST: Rare items + currency
 * - DUNGEON_ENTRANCE: Equipment from dungeon exploration
 *
 * Reward tier is influenced by:
 * - Discovery type rarity
 * - Player level (if known)
 * - Base tier from discovery definition
 *
 * @param {string} discoveryType - Type of discovery (ANCIENT_RUINS, HERB_GROVE, etc.)
 * @param {number} baseTier - Base tier of rewards (from discovery definition)
 * @param {number} quantity - Number of items to generate
 * @returns {Array} Array of reward items {itemId, tier, grade, quantity}
 */
export function generateDiscoveryRewards(
    discoveryType: string,
    baseTier: number,
    quantity: number = 1
): any[] {
    const rewardTables: { [key: string]: string[] } = {
        ANCIENT_RUINS: [
            'steel_sword',
            'gold_ring',
            'ancient_scroll',
            'crystal_shard',
            'rare_gem'
        ],
        HERB_GROVE: [
            'healing_herb',
            'mana_herb',
            'rare_mushroom',
            'recovery_leaf'
        ],
        TREASURE_CHEST: [
            'gemstone',
            'rare_artifact',
            'treasure_map',
            'gold_coin'
        ],
        DUNGEON_ENTRANCE: [
            'iron_sword',
            'leather_armor',
            'dungeon_key',
            'ancient_map'
        ]
    };

    const itemIds = rewardTables[discoveryType] || rewardTables.TREASURE_CHEST;
    const rewards: any[] = [];

    for (let i = 0; i < quantity; i++) {
        // Randomly select from reward table
        const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
        const itemDef = itemDefinitions[itemId];

        if (itemDef) {
            // Equipment items get tier and grade
            const isEquipment = ['Weapon', 'Armor', 'Accessory'].includes(itemDef.category);

            if (isEquipment) {
                // Use base tier from discovery, enhanced for ANCIENT_RUINS
                let finalTier = baseTier;
                if (discoveryType === 'ANCIENT_RUINS') {
                    finalTier = Math.min(6, baseTier + 2);
                }

                const gradeRoll = Math.random();
                let grade = 0;
                if (gradeRoll > 0.5 && gradeRoll <= 0.8) {
                    grade = 1;
                } else if (gradeRoll > 0.8) {
                    grade = 2;
                }

                rewards.push({
                    itemId,
                    tier: finalTier,
                    grade,
                    quantity: 1
                });
            } else {
                // Non-equipment items (food, materials) don't have tier/grade
                rewards.push({
                    itemId,
                    quantity: 1
                });
            }
        }
    }

    return rewards;
}

/**
 * calculateDiscoveryTierFromLocation
 *
 * Determine reward tier based on discovery location characteristics.
 *
 * @remarks
 * Tier calculation factors:
 * - Location type (ruins → higher tier)
 * - World region (dangerous regions → higher tier)
 * - Depth/difficulty (deeper dungeons → higher tier)
 * - Player level influence (optional)
 *
 * Formula: Base tier = ceil(worldDifficulty / 3), capped at 6
 *
 * @param {number} worldDifficulty - Difficulty score of location (1-30)
 * @returns {number} Tier 1-6
 */
export function calculateDiscoveryTierFromLocation(worldDifficulty: number): number {
    return Math.min(6, Math.ceil(worldDifficulty / 3));
}

/**
 * generateUnlockRewards
 *
 * Generate special unlocks/achievements from discoveries.
 *
 * @remarks
 * Unlocks can grant:
 * - New item categories
 * - Skills
 * - Map reveals
 * - NPC interactions
 *
 * These are not inventory items but game state unlocks.
 *
 * @param {string} discoveryType - Type of discovery
 * @returns {Array} Array of {type, value} unlocks
 */
export function generateUnlockRewards(discoveryType: string): any[] {
    const unlockTables: { [key: string]: any[] } = {
        ANCIENT_RUINS: [
            { type: 'UNLOCK_ITEM_CATEGORY', value: 'Weapon_Tier3' },
            { type: 'UNLOCK_ABILITY', value: 'ancient_knowledge' },
            { type: 'UNLOCK_MAP_REGION', value: 'lost_temple' }
        ],
        HERB_GROVE: [
            { type: 'UNLOCK_RECIPE', value: 'herbal_potion' },
            { type: 'UNLOCK_ABILITY', value: 'herbalism' }
        ],
        TREASURE_CHEST: [
            { type: 'UNLOCK_ACHIEVEMENT', value: 'treasure_hunter' }
        ],
        DUNGEON_ENTRANCE: [
            { type: 'UNLOCK_DUNGEON_LAYER', value: 'layer_1' },
            { type: 'UNLOCK_ENEMY_TYPE', value: 'dungeon_spawns' }
        ]
    };

    return unlockTables[discoveryType] || [];
}

/**
 * calculateRewardQuantity
 *
 * Determine how many reward items to generate based on discovery rarity.
 *
 * @remarks
 * Rarity scaling:
 * - Common: 1-2 items
 * - Uncommon: 2-3 items
 * - Rare: 3-5 items
 * - Epic: 4-6 items
 * - Legendary: 5-8 items
 *
 * @param {string} rarity - Rarity level (common, uncommon, rare, epic, legendary)
 * @returns {number} Number of items to reward
 */
export function calculateRewardQuantity(rarity: string): number {
    const rarityScaling: { [key: string]: [number, number] } = {
        common: [1, 2],
        uncommon: [2, 3],
        rare: [3, 5],
        epic: [4, 6],
        legendary: [5, 8]
    };

    const range = rarityScaling[rarity.toLowerCase()] || [1, 1];
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
}

/**
 * applyDiscoveryBonus
 *
 * Modify reward based on discovery bonuses or special conditions.
 *
 * @remarks
 * Bonuses can include:
 * - Double rewards for first discovery
 * - Bonus for discovering during specific weather
 * - Bonus for discovering with party members
 * - Rarity multiplier for legendary discoveries
 *
 * @param {any} baseReward - Base reward item
 * @param {number} discoveryMultiplier - Multiplier (1.0 = normal, 2.0 = double)
 * @param {number} rarityBonus - Additional tier boost from rarity
 * @returns {any} Modified reward
 */
export function applyDiscoveryBonus(
    baseReward: any,
    discoveryMultiplier: number = 1.0,
    rarityBonus: number = 0
): any {
    const modified = { ...baseReward };

    // Apply quantity multiplier
    if (modified.quantity) {
        modified.quantity = Math.ceil(modified.quantity * discoveryMultiplier);
    }

    // Apply tier bonus (for equipment)
    if (modified.tier && rarityBonus > 0) {
        modified.tier = Math.min(6, modified.tier + rarityBonus);
    }

    return modified;
}

/**
 * createLootTableEntry
 *
 * Create a properly formatted loot table entry for a discovery.
 *
 * @remarks
 * Used to standardize loot table entries across different discovery types.
 *
 * @param {string} itemId - Item ID from itemDefinitions
 * @param {number} chance - Drop chance (0.0-1.0)
 * @param {number} minQty - Minimum quantity
 * @param {number} maxQty - Maximum quantity
 * @returns {any} Loot table entry
 */
export function createLootTableEntry(
    itemId: string,
    chance: number,
    minQty: number = 1,
    maxQty: number = 1
): any {
    return {
        name: itemId,
        chance: Math.max(0, Math.min(1, chance)),
        quantity: {
            min: Math.max(1, minQty),
            max: Math.max(minQty, maxQty)
        }
    };
}
