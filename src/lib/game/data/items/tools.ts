/**
 * @fileOverview Defines all tool items in the game.
 * @description This file contains definitions for items that are primarily used
 * to perform actions (like crafting, harvesting, or building) rather than for
 * combat or consumption. Some tools may double as weak weapons.
 */

import type { ItemDefinition } from "../../definitions/item";

export const toolItems: Record<string, ItemDefinition> = {
    'Đá Mài': {
        description: 'item_da_mai_desc',
        tier: 2,
        category: 'Tool',
        emoji: '🔪',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cuốc Đá': {
        description: 'item_stone_pickaxe_desc',
        tier: 2,
        category: 'Tool',
        emoji: '⛏️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bó Đuốc': {
        description: 'item_bo_duoc_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Lửa': {
        description: 'item_da_lua_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Kính Lúp': {
        description: 'item_magnifying_glass_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🔎',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
     'Máy cắt Laser': {
        description: 'item_laser_cutter_desc',
        tier: 3,
        category: 'Tool',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đèn lồng Gỉ sét': {
        description: 'item_rusty_lantern_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🏮',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
};
