/**
 * @fileOverview Defines all food items in the game.
 * @description These items are primarily used to restore stamina, and sometimes have
 * minor healing or other effects. They are organized by raw meats, cooked foods,
 * and gathered foods like fruits and vegetables.
 */

import type { ItemDefinition } from "../../definitions/item";

export const foodItems: Record<string, ItemDefinition> = {
    // --- RAW MEATS (Low recovery) ---
    'Thịt Sói Sống': {
        name: {en: "Raw Wolf Meat", vi: "Thịt Sói Sống"},
        description: {en: 'item_thit_soi_song_desc', vi: 'item_thit_soi_song_desc'},
        tier: 1,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🥩',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Heo Rừng': {
        name: {en: "Boar Meat", vi: "Thịt Heo Rừng"},
        description: {en: 'item_thit_heo_rung_desc', vi: 'item_thit_heo_rung_desc'},
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }, { type: 'RESTORE_MANA', amount: 3 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Thỏ': {
        name: {en: "Rabbit Meat", vi: "Thịt Thỏ"},
        description: {en: 'item_thit_tho_desc', vi: 'item_thit_tho_desc'},
        tier: 1,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🐰',
        effects: [{ type: 'RESTORE_STAMINA', amount: 8 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Dê Núi': {
        name: {en: "Mountain Goat Meat", vi: "Thịt Dê Núi"},
        description: {en: 'item_thit_de_nui_desc', vi: 'item_thit_de_nui_desc'},
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Báo Tuyết': {
        name: {en: "Snow Leopard Meat", vi: "Thịt Báo Tuyết"},
        description: {en: 'item_thit_bao_tuyet_desc', vi: 'item_thit_bao_tuyet_desc'},
        tier: 3,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }, { type: 'RESTORE_MANA', amount: 7 }],
        baseQuantity: { min: 1, max: 2 }
    },
     'Bột Dinh dưỡng': { 
        name: {en: "Nutrient Paste", vi: "Bột Dinh dưỡng"},
        description: {en: 'item_nutrient_paste_desc', vi: 'item_nutrient_paste_desc'}, 
        emoji: '🧪', 
        category: 'Food', tier: 1, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }], 
        baseQuantity: { min: 2, max: 4 } 
    },
    'Thịt Cá Nướng': {
        name: {en: "Grilled Fish Meat", vi: "Thịt Cá Nướng"},
        description: {en: 'item_grilled_fish_desc', vi: 'item_grilled_fish_desc'},
        tier: 2,
        category: 'Food',
        emoji: '🐟🔥',
        effects: [{ type: 'HEAL', amount: 10 }, {type: 'RESTORE_STAMINA', amount: 30}],
        baseQuantity: { min: 1, max: 1 },
    },

    // --- COOKED FOODS (Higher recovery) ---
    'Thịt Nướng': {
        name: {en: "Cooked Meat", vi: "Thịt Nướng"},
        description: {en: 'item_cooked_meat_desc', vi: 'item_cooked_meat_desc'},
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        emoji: '🍗',
        effects: [{ type: 'RESTORE_STAMINA', amount: 35 }, { type: 'RESTORE_MANA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bánh Mì': {
        name: {en: "Bread", vi: "Bánh Mì"},
        description: {en: 'item_bread_desc', vi: 'item_bread_desc'},
        tier: 1,
        category: 'Food',
        emoji: '🍞',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }, { type: 'RESTORE_MANA', amount: 5 }],
        baseQuantity: { min: 1, max: 1 }
    },


    // --- GATHERED FOODS ---
    'Quả Mọng Ăn Được': {
        name: {en: "Edible Berries", vi: "Quả Mọng Ăn Được"},
        description: {en: 'item_qua_mong_an_duoc_desc', vi: 'item_qua_mong_an_duoc_desc'},
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
        name: {en: "Wheat", vi: "Lúa Mì"},
        description: {en: 'item_lua_mi_desc', vi: 'item_lua_mi_desc'},
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🌾',
        effects: [{ type: 'RESTORE_STAMINA', amount: 4 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Rễ Củ Ăn Được': {
        name: {en: "Edible Tuber", vi: "Rễ Củ Ăn Được"},
        description: {en: 'item_re_cu_an_duoc_desc', vi: 'item_re_cu_an_duoc_desc'},
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🥔',
        effects: [{ type: 'RESTORE_STAMINA', amount: 18 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Nấm Mỡ': {
        name: {en: "Field Mushroom", vi: "Nấm Mỡ"},
        description: {en: 'item_nam_mo_desc', vi: 'item_nam_mo_desc'},
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 8 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Hoa Xương Rồng': {
        name: {en: "Cactus Flower", vi: "Hoa Xương Rồng"},
        description: {en: 'item_hoa_xuong_rong_desc', vi: 'item_hoa_xuong_rong_desc'},
        tier: 1,
        category: 'Food',
        subCategory: 'Fruit',
        emoji: '🌵',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Xương Rồng Nhỏ': {
        name: {en: "Small Cactus", vi: "Cây Xương Rồng Nhỏ"},
        description: {en: 'item_cay_xuong_rong_nho_desc', vi: 'item_cay_xuong_rong_nho_desc'},
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
        name: {en: "Swamp Mushroom", vi: "Nấm Đầm Lầy"},
        description: {en: 'item_nam_dam_lay_desc', vi: 'item_nam_dam_lay_desc'},
        tier: 1,
        category: 'Food',
        subCategory: 'Vegetable',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 8 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Quả Lạ': {
        name: {en: "Strange Fruit", vi: "Quả Lạ"},
        description: {en: 'item_qua_la_desc', vi: 'item_qua_la_desc'},
        tier: 2,
        category: 'Food',
        subCategory: 'Fruit',
        emoji: '🥥',
        effects: [{ type: 'RESTORE_STAMINA', amount: 12 }, { type: 'RESTORE_MANA', amount: 3 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Gusher': { 
        name: {en: "Gusher", vi: "Gusher"},
        description: {en: "item_gusher_desc", vi: "item_gusher_desc"}, 
        emoji: '🥤', 
        category: 'Food', tier: 1, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }, { type: 'RESTORE_MANA', amount: 10 }], 
        baseQuantity: { min: 1, max: 2 } 
    },

    // --- EGGS & MISC ---
    'Trứng Chim Hoang': {
        name: {en: "Wild Bird Egg", vi: "Trứng Chim Hoang"},
        description: {en: 'item_trung_chim_hoang_desc', vi: 'item_trung_chim_hoang_desc'},
        tier: 1,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }, { type: 'RESTORE_MANA', amount: 5 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Trứng Đại Bàng': {
        name: {en: "Eagle Egg", vi: "Trứng Đại Bàng"},
        description: {en: 'item_trung_dai_bang_desc', vi: 'item_trung_dai_bang_desc'},
        tier: 3,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 35 }, { type: 'RESTORE_MANA', amount: 10 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mật Ong Hoang': {
        name: {en: "Wild Honey", vi: "Mật Ong Hoang"},
        description: {en: 'item_mat_ong_hoang_desc', vi: 'item_mat_ong_hoang_desc'},
        tier: 2,
        category: 'Food',
        subCategory: 'Misc',
        emoji: '🍯',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 12 }, { type: 'RESTORE_MANA', amount: 8 }],
        baseQuantity: { min: 1, max: 1 }
    },
};
