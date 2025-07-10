import type { ItemDefinition } from "../../definitions/item";

export const foodItems: Record<string, ItemDefinition> = {
    // --- RAW MEATS (Low recovery) ---
    'Thịt Sói Sống': {
        description: 'item_thit_soi_song_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🥩',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Heo Rừng': {
        description: 'item_thit_heo_rung_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }, { type: 'RESTORE_MANA', amount: 3 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Thỏ': {
        description: 'item_thit_tho_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🐰',
        effects: [{ type: 'RESTORE_STAMINA', amount: 8 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Dê Núi': {
        description: 'item_thit_de_nui_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Báo Tuyết': {
        description: 'item_thit_bao_tuyet_desc',
        tier: 3,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }, { type: 'RESTORE_MANA', amount: 7 }],
        baseQuantity: { min: 1, max: 2 }
    },
     'Bột Dinh dưỡng': { 
        description: 'item_nutrient_paste_desc', 
        emoji: '🧪', 
        category: 'Food', tier: 1, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }], 
        baseQuantity: { min: 2, max: 4 } 
    },

    // --- COOKED FOODS (Higher recovery) ---
    'Thịt Nướng': {
        description: 'item_cooked_meat_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍗',
        effects: [{ type: 'RESTORE_STAMINA', amount: 35 }, { type: 'RESTORE_MANA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bánh Mì': {
        description: 'item_bread_desc',
        tier: 1,
        category: 'Food',
        emoji: '🍞',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }, { type: 'RESTORE_MANA', amount: 5 }],
        baseQuantity: { min: 1, max: 1 }
    },


    // --- GATHERED FOODS ---
    'Quả Mọng Ăn Được': {
        description: 'item_qua_mong_an_duoc_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Fruit',
        emoji: '🍓',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 2, max: 6 },
        growthConditions: {
            optimal: { moisture: { min: 5 }, vegetationDensity: { min: 7 } },
            subOptimal: { moisture: { min: 3, max: 4 } }
        }
    },
    'Lúa Mì': {
        description: 'item_lua_mi_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🌾',
        effects: [{ type: 'RESTORE_STAMINA', amount: 4 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Rễ Củ Ăn Được': {
        description: 'item_re_cu_an_duoc_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🥔',
        effects: [{ type: 'RESTORE_STAMINA', amount: 18 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Nấm Mỡ': {
        description: 'item_nam_mo_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 8 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Hoa Xương Rồng': {
        description: 'item_hoa_xuong_rong_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Fruit',
        emoji: '🌵',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Xương Rồng Nhỏ': {
        description: 'item_cay_xuong_rong_nho_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🌵',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 1, max: 3 },
        growthConditions: {
            optimal: { temperature: { min: 8 }, moisture: { max: 1 } },
            subOptimal: { temperature: { min: 6, max: 7 }, moisture: { min: 2, max: 3 } }
        }
    },
    'Nấm Đầm Lầy': {
        description: 'item_nam_dam_lay_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 8 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Quả Lạ': {
        description: 'item_qua_la_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Fruit',
        emoji: '🥥',
        effects: [{ type: 'RESTORE_STAMINA', amount: 12 }, { type: 'RESTORE_MANA', amount: 3 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Gusher': { 
        description: "item_gusher_desc", 
        emoji: '🥤', 
        category: 'Food', tier: 1, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }, { type: 'RESTORE_MANA', amount: 10 }], 
        baseQuantity: { min: 1, max: 2 } 
    },

    // --- EGGS & MISC ---
    'Trứng Chim Hoang': {
        description: 'item_trung_chim_hoang_desc',
        tier: 1,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }, { type: 'RESTORE_MANA', amount: 5 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Trứng Đại Bàng': {
        description: 'item_trung_dai_bang_desc',
        tier: 3,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 35 }, { type: 'RESTORE_MANA', amount: 10 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mật Ong Hoang': {
        description: 'item_mat_ong_hoang_desc',
        tier: 2,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🍯',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 12 }, { type: 'RESTORE_MANA', amount: 8 }],
        baseQuantity: { min: 1, max: 1 }
    },
};
