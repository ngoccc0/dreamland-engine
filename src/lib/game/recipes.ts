/**
 * Central recipe book for the game's crafting system.
 * This file aggregates crafting recipes from various modular files
 * (e.g., base game recipes, mod-added recipes) into a single, comprehensive
 * `recipes` object that the game engine can use.
 */

import type { Recipe } from "./definitions/recipe";
import { naturePlusRecipes } from "./data/recipes/nature_plus";

/**
 * The master record of all crafting recipes available in the game.
 * It combines recipes from the base game with those added by mods.
 * @type {Record<string, Recipe>}
 */
export const recipes: Record<string, Recipe> = {
    'simple_stone_axe_recipe': {
        result: { name: 'simple_stone_axe', quantity: 1, emoji: '🪓' },
        ingredients: [
            { 
                name: 'sturdy_branch', 
                quantity: 1, 
            },
            { 
                name: 'cobblestone', 
                quantity: 1, 
            },
            { 
                name: 'thorny_vine', 
                quantity: 1, 
            }
        ],
        description: { en: 'Craft a basic stone axe. An essential tool for survival.', vi: 'Chế tạo một chiếc rìu đá cơ bản. Một công cụ cần thiết để sinh tồn.' },
    },
    'weak_health_potion_recipe': {
        result: { name: 'weak_health_potion', quantity: 1, emoji: '🧪' },
        ingredients: [
            { 
                name: 'healing_herb', 
                quantity: 1,
            },
            { 
                name: 'groundwater', 
                quantity: 1, 
            }
        ],
        description: { en: 'Brew a simple health potion from herbs and clean water.', vi: 'Pha chế một lọ thuốc máu đơn giản từ thảo dược và nước sạch.' },
    },
    'torch_recipe': {
        result: { name: 'torch', quantity: 1, emoji: '🔥' },
        ingredients: [
            { name: 'sturdy_branch', quantity: 1 },
            { 
                name: 'torn_cloth', 
                quantity: 1,
            },
            { name: 'sticky_resin', quantity: 1 }
        ],
        description: { en: 'Create a temporary light source to explore dark places.', vi: 'Tạo một nguồn sáng tạm thời để khám phá những nơi tối tăm.' },
    },
    'inflatable_raft_recipe': {
        result: { name: 'inflatable_raft', quantity: 1, emoji: '🛶' },
        ingredients: [
            { name: 'bear_hide', quantity: 1 },
            { name: 'wood_core', quantity: 5 },
            { name: 'thorny_vine', quantity: 10 }
        ],
        description: { en: 'Craft a simple raft to travel across water.', vi: 'Chế tạo một chiếc bè đơn giản để đi qua mặt nước.' },
    },
    'stone_dagger_recipe': {
        result: { name: 'stone_dagger', quantity: 1, emoji: '🗡️' },
        ingredients: [
            { name: 'cobblestone', quantity: 2 },
            { name: 'torn_cloth', quantity: 1 }
        ],
        description: { en: 'Craft a stone dagger for self-defense.', vi: 'Chế tạo một con dao găm bằng đá để tự vệ.' },
    },
    'wooden_shield_recipe': {
        result: { name: 'wooden_shield', quantity: 1, emoji: '🛡️' },
        ingredients: [
            { name: 'wood_core', quantity: 4 },
            { name: 'boar_hide', quantity: 1 }
        ],
        description: { en: 'Craft a wooden shield to block attacks.', vi: 'Chế tạo một chiếc khiên gỗ để chặn các cuộc tấn công.' },
    },
    'bandage_recipe': {
        result: { name: 'bandage', quantity: 1, emoji: '🩹' },
        ingredients: [
            { name: 'torn_cloth', quantity: 2 },
            { name: 'healing_herb', quantity: 1 }
        ],
        description: { en: 'Create a clean bandage to treat wounds.', vi: 'Tạo một miếng băng sạch để băng bó vết thương.' },
    },
    'stone_pickaxe_recipe': {
        result: { name: 'stone_pickaxe', quantity: 1, emoji: '⛏️' },
        ingredients: [
            { name: 'wood_core', quantity: 2 },
            { name: 'cobblestone', quantity: 3 },
            { name: 'thorny_vine', quantity: 2 }
        ],
        description: { en: 'Craft a stone pickaxe for mining minerals.', vi: 'Chế tạo một chiếc cuốc đá để khai thác khoáng sản.' },
    },
    'bone_spear_recipe': {
        result: { name: 'bone_spear', quantity: 1, emoji: '🔱' },
        ingredients: [
            { name: 'wood_core', quantity: 1 },
            { name: 'wolf_fang', quantity: 1 },
            { name: 'thorny_vine', quantity: 2 }
        ],
        description: { en: 'Craft a bone spear for hunting and combat.', vi: 'Chế tạo một cây giáo xương để săn bắn và chiến đấu.' },
    },
    'obsidian_battleaxe_recipe': {
        result: { name: 'obsidian_battleaxe', quantity: 1, emoji: '🪓' },
        ingredients: [
            { name: 'wood_core', quantity: 2 },
            { name: 'obsidian', quantity: 3 },
            { name: 'bear_hide', quantity: 1 }
        ],
        description: { en: 'Craft a fearsome battleaxe from obsidian.', vi: 'Chế tạo một chiếc rìu chiến đáng sợ từ obsidian.' },
    },
    'alligator_hide_armor_recipe': {
        result: { name: 'alligator_hide_armor', quantity: 1, emoji: '👕' },
        ingredients: [
            { name: 'alligator_hide', quantity: 2 },
            { name: 'giant_spider_silk', quantity: 5 }
        ],
        description: { en: 'Craft a durable set of alligator hide armor.', vi: 'Chế tạo một bộ giáp bền từ da cá sấu.' },
    },
    'strong_health_potion_recipe': {
        result: { name: 'strong_health_potion', quantity: 1, emoji: '🧪' },
        ingredients: [
            { name: 'weak_health_potion', quantity: 1 },
            { name: 'mountain_herb', quantity: 1 },
            { name: 'groundwater', quantity: 1 }
        ],
        description: { en: 'Brew a potent healing potion.', vi: 'Pha chế một lọ thuốc chữa bệnh mạnh.' },
    },
    'harpy_feather_bow_recipe': {
        result: { name: 'harpy_feather_bow', quantity: 1, emoji: '🏹' },
        ingredients: [
            { name: 'wood_core', quantity: 3 },
            { name: 'harpy_feather', quantity: 5 },
            { name: 'giant_spider_silk', quantity: 3 }
        ],
        description: { en: 'Craft a lightweight and precise bow.', vi: 'Chế tạo một cây cung nhẹ và chính xác.' },
    },
    'golem_core_staff_recipe': {
        result: { name: 'golem_core_staff', quantity: 1, emoji: '🪄' },
        ingredients: [
            { name: 'stone_golem_core', quantity: 1 },
            { name: 'wood_core', quantity: 1 },
            { name: 'mountain_crystal', quantity: 2 }
        ],
        description: { en: 'Imbue a staff with the power of a golem core.', vi: 'Thấm nhuần một cây trượng với sức mạnh của lõi người đá.' },
    },
    'stamina_potion_recipe': {
        result: { name: 'stamina_potion', quantity: 1, emoji: '🥤' },
        ingredients: [
            { name: 'edible_berries', quantity: 5 },
            { name: 'wild_honey', quantity: 1 },
            { name: 'groundwater', quantity: 1 }
        ],
        description: { en: 'Mix a potion to rapidly restore stamina.', vi: 'Pha một lọ thuốc để phục hồi thể lực nhanh chóng.' },
    },
    'dwarven_war_hammer_recipe': {
        result: { name: 'dwarven_war_hammer', quantity: 1, emoji: '🔨' },
        ingredients: [
            { name: 'iron_ore', quantity: 5 },
            { name: 'stone_golem_core', quantity: 1 },
            { name: 'bear_hide', quantity: 2 }
        ],
        description: { en: 'Forge a mighty war hammer.', vi: 'Rèn một chiếc búa chiến hùng mạnh.' },
    },
    ...naturePlusRecipes,
};
