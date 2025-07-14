/**
 * @fileOverview Defines all tool items in the game.
 * @description This file contains definitions for items that are primarily used
 * to perform actions (like crafting, harvesting, or building) rather than for
 * combat or consumption. Some tools may double as weak weapons.
 */

import type { ItemDefinition } from "../../definitions/item";

export const toolItems: Record<string, ItemDefinition> = {
    'Đá Mài': {
        name: {en: "Whetstone", vi: "Đá Mài"},
        description: {en: 'item_da_mai_desc', vi: 'item_da_mai_desc'},
        tier: 2,
        category: 'Tool',
        emoji: '🔪',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cuốc Đá': {
        name: {en: "Stone Pickaxe", vi: "Cuốc Đá"},
        description: {en: 'item_stone_pickaxe_desc', vi: 'item_stone_pickaxe_desc'},
        tier: 2,
        category: 'Tool',
        emoji: '⛏️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bó Đuốc': {
        name: {en: "Torch", vi: "Bó Đuốc"},
        description: {en: 'item_bo_duoc_desc', vi: 'item_bo_duoc_desc'},
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Lửa': {
        name: {en: "Flint", vi: "Đá Lửa"},
        description: {en: 'item_da_lua_desc', vi: 'item_da_lua_desc'},
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Kính Lúp': {
        name: {en: "Magnifying Glass", vi: "Kính Lúp"},
        description: {en: 'item_magnifying_glass_desc', vi: 'item_magnifying_glass_desc'},
        tier: 1,
        category: 'Tool',
        emoji: '🔎',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
     'Máy cắt Laser': {
        name: {en: "Laser Cutter", vi: "Máy cắt Laser"},
        description: {en: 'item_laser_cutter_desc', vi: 'item_laser_cutter_desc'},
        tier: 3,
        category: 'Tool',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đèn lồng Gỉ sét': {
        name: {en: "Rusty Lantern", vi: "Đèn lồng Gỉ sét"},
        description: {en: 'item_rusty_lantern_desc', vi: 'item_rusty_lantern_desc'},
        tier: 1,
        category: 'Tool',
        emoji: '🏮',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
};
