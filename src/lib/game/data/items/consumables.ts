import type { ItemDefinition } from "../../types";

export const consumableItems: Record<string, ItemDefinition> = {
    'Thịt Sói Sống': {
        description: 'item_thit_soi_song_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🥩',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Heo Rừng': {
        description: 'item_thit_heo_rung_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Thỏ': {
        description: 'item_thit_tho_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🐰',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Trứng Rắn': {
        description: 'item_trung_ran_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Thịt Dê Núi': {
        description: 'item_thit_de_nui_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Báo Tuyết': {
        description: 'item_thit_bao_tuyet_desc',
        tier: 3,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 40 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Quả Mọng Ăn Được': {
        description: 'item_qua_mong_an_duoc_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Fruit',
        emoji: '🍓',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 2, max: 6 },
        growthConditions: {
            optimal: { moisture: { min: 5 }, vegetationDensity: { min: 7 } },
            subOptimal: { moisture: { min: 3, max: 4 } }
        }
    },
    'Mật Ong Hoang': {
        description: 'item_mat_ong_hoang_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🍯',
        effects: [{ type: 'HEAL', amount: 10 }, { type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lúa Mì': {
        description: 'item_lua_mi_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🌾',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Trứng Chim Hoang': {
        description: 'item_trung_chim_hoang_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Rễ Củ Ăn Được': {
        description: 'item_re_cu_an_duoc_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🥔',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Nấm Mỡ': {
        description: 'item_nam_mo_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Bình Nước Cũ': {
        description: 'item_binh_nuoc_cu_desc',
        tier: 1,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '💧',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Xương Rồng': {
        description: 'item_hoa_xuong_rong_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Fruit',
        emoji: '🌵',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nấm Đầm Lầy': {
        description: 'item_nam_dam_lay_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Trứng Đại Bàng': {
        description: 'item_trung_dai_bang_desc',
        tier: 3,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 50 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tuyết': {
        description: 'item_tuyet_desc',
        tier: 1,
        category: 'Support',
        emoji: '❄️',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Quả Lạ': {
        description: 'item_qua_la_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Fruit',
        emoji: '🥥',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Thảo Dược Chữa Lành': {
        description: 'item_thao_duoc_chua_lanh_desc',
        tier: 2,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 20 }],
        baseQuantity: { min: 1, max: 2 },
        growthConditions: {
            optimal: { moisture: { min: 6, max: 8 }, temperature: { min: 5, max: 8 }, lightLevel: { min: 2, max: 6 } },
            subOptimal: { moisture: { min: 4, max: 5 }, temperature: { min: 3, max: 4 } }
        }
    },
     'Nước Ngầm': {
        description: 'item_nuoc_ngam_desc',
        tier: 1,
        category: 'Support',
        emoji: '💧',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 }
    },
};
