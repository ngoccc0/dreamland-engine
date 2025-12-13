
/**
 * Defines all tool items in the game.
 * This file contains definitions for items that are primarily used
 * to perform actions (like crafting, harvesting, or building) rather than for
 * combat or consumption. Some tools may double as weak weapons.
 */

import type { ItemDefinition } from '@/core/types/definitions/item';

export const toolItems: Record<string, ItemDefinition> = {
    'whetstone': {
        name: { en: "Whetstone", vi: "Đá Mài" },
        description: { en: 'A stone used to sharpen tools and weapons.', vi: 'Một viên đá dùng để mài sắc các công cụ và vũ khí.' },
        tier: 2,
        category: 'Tool',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: true,
        spawnBiomes: ['mountain', 'cave', 'forest', 'grassland']
    },
    'stone_pickaxe': {
        name: { en: "Stone Pickaxe", vi: "Cuốc Đá" },
        description: { en: 'A sturdy pickaxe made of stone, for mining.', vi: 'Một chiếc cuốc đá chắc chắn, dùng để khai thác mỏ.' },
        tier: 2,
        category: 'Tool',
        emoji: '⛏️',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'torch': {
        name: { en: "Torch", vi: "Bó Đuốc" },
        description: { en: 'A simple torch to light your way.', vi: 'Một ngọn đuốc đơn giản để soi sáng đường đi.' },
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'flint': {
        name: { en: "Flint", vi: "Đá Lửa" },
        description: { en: 'A piece of flint, useful for starting fires.', vi: 'Một mảnh đá lửa, hữu ích để nhóm lửa.' },
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: true,
        spawnBiomes: ['cave', 'mountain']
    },
    'magnifying_glass': {
        name: { en: "Magnifying Glass", vi: "Kính Lúp" },
        description: { en: 'A classic tool for any detective worth their salt.', vi: 'Một công cụ kinh điển cho bất kỳ thám tử nào đáng giá.' },
        tier: 1,
        category: 'Tool',
        emoji: '🔎',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'laser_cutter': {
        name: { en: "Laser Cutter", vi: "Máy cắt Laser" },
        description: { en: 'A powerful tool that can cut through reinforced doors... or enemies.', vi: 'Một công cụ mạnh mẽ có thể cắt xuyên qua các cánh cửa được gia cố... hoặc kẻ thù.' },
        tier: 3,
        category: 'Tool',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'rusty_lantern': {
        name: { en: "Rusty Lantern", vi: "Đèn lồng Gỉ sét" },
        description: { en: 'An old oil lantern. Provides a flickering, unreliable light.', vi: 'Một chiếc đèn lồng dầu cũ kỹ. Cung cấp ánh sáng leo lét, không đáng tin cậy.' },
        tier: 1,
        category: 'Tool',
        emoji: '🏮',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'hoe': {
        name: { en: 'Hoe', vi: 'Cuốc' },
        description: { en: 'A simple hoe for preparing soil for planting.', vi: 'Một cái cuốc đơn giản để chuẩn bị đất trồng.' },
        tier: 1,
        category: 'Tool',
        emoji: '🪓',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'watering_can': {
        name: { en: 'Watering Can', vi: 'Bình Tưới' },
        description: { en: 'A watering can to irrigate nearby soil.', vi: 'Một bình tưới để tưới đất xung quanh.' },
        tier: 1,
        category: 'Tool',
        emoji: '🪣',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
    'fertilizer_compost': {
        name: { en: 'Compost', vi: 'Phân Hữu Cơ' },
        description: { en: 'Compost to enrich soil nutrition.', vi: 'Phân hữu cơ giúp tăng dinh dưỡng đất.' },
        tier: 1,
        category: 'Consumable',
        emoji: '🧴',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        spawnEnabled: false,
    },
};
