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
    'Thuốc Máu Yếu': {
        description: 'item_thuoc_mau_yeu_desc',
        tier: 1,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 35 }],
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
    'Thuyền Phao': {
        description: 'item_inflatable_raft_desc',
        tier: 3,
        category: 'Equipment',
        emoji: '🛶',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Băng Gạc': {
        description: 'item_bandage_desc',
        tier: 2,
        category: 'Support',
        emoji: '🩹',
        effects: [{ type: 'HEAL', amount: 15 }],
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
    'Thuốc Máu Mạnh': {
        description: 'item_strong_health_potion_desc',
        tier: 3,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 75 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Thể Lực': {
        description: 'item_stamina_potion_desc',
        tier: 3,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🥤',
        effects: [{ type: 'RESTORE_STAMINA', amount: 70 }],
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
