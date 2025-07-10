import type { ItemDefinition } from "../../types";

export const toolItems: Record<string, ItemDefinition> = {
    'Đá Mài': {
        description: 'item_da_mai_desc',
        tier: 2,
        category: 'Tool',
        emoji: '🔪',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rìu Đá Đơn Giản': {
        description: 'item_riu_da_don_gian_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🪓',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'weapon',
        attributes: { physicalAttack: 3 },
    },
    'Bó Đuốc': {
        description: 'item_bo_duoc_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
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
    'Đá Lửa': {
        description: 'item_da_lua_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
};
