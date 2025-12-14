/**
 * Defines all magic-related items in the game.
 * This file contains definitions for items that are inherently magical,
 * used as crafting components for enchanted gear, or are potent energy sources.
 */

import type { ItemDefinition } from "@/core/types/definitions/item";

export const magicItems: Record<string, ItemDefinition> = {
    'magic_sand': {
        name: {en: "Magic Sand", vi: "Cát Ma Thuật"},
        description: {en: 'Sand that hums with a faint magical energy.', vi: 'Cát rung động với một năng lượng ma thuật mờ nhạt.'},
        tier: 4,
        category: 'Magic',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 2 },
        spawnEnabled: true,
        spawnBiomes: ['desert', 'beach']
    },
    'wisp_essence': {
        name: {en: "Wisp Essence", vi: "Tinh chất Ma trơi"},
        description: {en: 'The condensed essence of a will-o-wisp.', vi: 'Tinh chất cô đặc của một con ma trơi.'},
        tier: 4,
        category: 'Magic',
        emoji: '💡',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'stone_golem_core': {
        name: {en: "Stone Golem Core", vi: "Lõi Người Đá"},
        description: {en: 'The pulsating core of a stone golem.', vi: 'Lõi đang đập của một người đá.'},
        tier: 5,
        category: 'Energy Source',
        emoji: '💖',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'spirit_bloom': {
        name: {en: "Spirit Bloom", vi: "Hoa Tinh Linh"},
        description: {en: 'A flower that glows with a soft, ethereal light.', vi: 'Một bông hoa phát ra ánh sáng thanh tao, dịu nhẹ.'},
        tier: 4,
        category: 'Magic',
        emoji: '🌸',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        growthConditions: {
            optimal: { magicAffinity: { min: 7 } },
            subOptimal: { magicAffinity: { min: 5, max: 6 } }
        },
        spawnEnabled: true,
    },
    'rare_root': {
        name: {en: "Rare Root", vi: "Rễ Cây Hiếm"},
        description: {en: 'A rare root used in powerful potions.', vi: 'Một loại rễ hiếm được sử dụng trong các loại thuốc mạnh.'},
        tier: 3,
        category: 'Material',
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: true,
        spawnBiomes: ['forest', 'swamp']
    },
    'mountain_crystal': {
        name: {en: "Mountain Crystal", vi: "Pha Lê Núi"},
        description: {en: 'A crystal that amplifies magical energy.', vi: 'Một viên pha lê khuếch đại năng lượng ma thuật.'},
        tier: 4,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 1, max: 2 },
        spawnEnabled: true,
        spawnBiomes: ['mountain', 'cave']
    },
    'crystal_shard': {
        name: {en: "Crystal Shard", vi: "Mảnh Tinh Thể"},
        description: {en: 'A small shard of a larger magic crystal.', vi: 'Một mảnh nhỏ của một viên pha lê ma thuật lớn hơn.'},
        tier: 2,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 2, max: 7 },
        spawnEnabled: false, // Assumed to be a sub-product of mining Mountain Crystal
    },
    'magma_heart': {
        name: {en: "Magma Heart", vi: "Trái tim Magma"},
        description: {en: 'The fiery core of a lava elemental.', vi: 'Lõi rực lửa của một nguyên tố dung nham.'},
        tier: 5,
        category: 'Energy Source',
        emoji: '❤️‍🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'stardust': {
        name: {en: "Stardust", vi: "Bụi Sao"},
        description: {en: 'Shimmering dust collected from cosmic winds. A potent magical catalyst.', vi: 'Bụi lung linh được thu thập từ gió vũ trụ. Một chất xúc tác ma thuật mạnh mẽ.'},
        tier: 4,
        category: 'Magic',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 2 },
        spawnEnabled: false,
    },
    'ectoplasm': {
        name: {en: "Ectoplasm", vi: "Ectoplasm"},
        description: {en: 'A viscous, supernatural substance left behind by a ghost.', vi: 'Một chất siêu nhiên, nhớt do một con ma để lại.'},
        emoji: '👻',
        category: 'Material',
        tier: 3,
        effects: [],
        baseQuantity: { min: 1, max: 2 },
        spawnEnabled: false,
    },
};

