/**
 * @fileOverview Defines all magic-related items in the game.
 * @description This file contains definitions for items that are inherently magical,
 * used as crafting components for enchanted gear, or are potent energy sources.
 */

import type { ItemDefinition } from "../../definitions/item";

export const magicItems: Record<string, ItemDefinition> = {
    'Cát Ma Thuật': {
        name: {en: "Magic Sand", vi: "Cát Ma Thuật"},
        description: {en: 'item_cat_ma_thuat_desc', vi: 'item_cat_ma_thuat_desc'},
        tier: 4,
        category: 'Magic',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tinh chất Ma trơi': {
        name: {en: "Wisp Essence", vi: "Tinh chất Ma trơi"},
        description: {en: 'item_tinh_chat_ma_troi_desc', vi: 'item_tinh_chat_ma_troi_desc'},
        tier: 4,
        category: 'Magic',
        emoji: '💡',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lõi Người Đá': {
        name: {en: "Stone Golem Core", vi: "Lõi Người Đá"},
        description: {en: 'item_loi_nguoi_da_desc', vi: 'item_loi_nguoi_da_desc'},
        tier: 5,
        category: 'Energy Source',
        emoji: '💖',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Tinh Linh': {
        name: {en: "Spirit Bloom", vi: "Hoa Tinh Linh"},
        description: {en: 'item_hoa_tinh_linh_desc', vi: 'item_hoa_tinh_linh_desc'},
        tier: 4,
        category: 'Magic',
        emoji: '🌸',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        growthConditions: {
            optimal: { magicAffinity: { min: 7 } },
            subOptimal: { magicAffinity: { min: 5, max: 6 } }
        }
    },
    'Rễ Cây Hiếm': {
        name: {en: "Rare Root", vi: "Rễ Cây Hiếm"},
        description: {en: 'item_re_cay_hiem_desc', vi: 'item_re_cay_hiem_desc'},
        tier: 3,
        category: 'Material',
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Pha Lê Núi': {
        name: {en: "Mountain Crystal", vi: "Pha Lê Núi"},
        description: {en: 'item_pha_le_nui_desc', vi: 'item_pha_le_nui_desc'},
        tier: 4,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mảnh Tinh Thể': {
        name: {en: "Crystal Shard", vi: "Mảnh Tinh Thể"},
        description: {en: 'item_manh_tinh_the_desc', vi: 'item_manh_tinh_the_desc'},
        tier: 2,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 2, max: 7 }
    },
    'Trái tim Magma': {
        name: {en: "Magma Heart", vi: "Trái tim Magma"},
        description: {en: 'item_trai_tim_magma_desc', vi: 'item_trai_tim_magma_desc'},
        tier: 5,
        category: 'Energy Source',
        emoji: '❤️‍🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bụi Sao': {
        name: {en: "Stardust", vi: "Bụi Sao"},
        description: {en: 'item_stardust_desc', vi: 'item_stardust_desc'},
        tier: 4,
        category: 'Magic',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 2 },
    },
    'Ectoplasm': {
        name: {en: "Ectoplasm", vi: "Ectoplasm"},
        description: {en: 'item_ectoplasm_desc', vi: 'item_ectoplasm_desc'},
        emoji: '👻',
        category: 'Material',
        tier: 3,
        effects: [],
        baseQuantity: { min: 1, max: 2 },
    },
};
