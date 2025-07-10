import type { ItemDefinition } from "../../definitions/item";

export const magicItems: Record<string, ItemDefinition> = {
    'Cát Ma Thuật': {
        description: 'item_cat_ma_thuat_desc',
        tier: 4,
        category: 'Magic',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tinh chất Ma trơi': {
        description: 'item_tinh_chat_ma_troi_desc',
        tier: 4,
        category: 'Magic',
        emoji: '💡',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lõi Người Đá': {
        description: 'item_loi_nguoi_da_desc',
        tier: 5,
        category: 'Energy Source',
        emoji: '💖',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Tinh Linh': {
        description: 'item_hoa_tinh_linh_desc',
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
        description: 'item_re_cay_hiem_desc',
        tier: 3,
        category: 'Material',
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Pha Lê Núi': {
        description: 'item_pha_le_nui_desc',
        tier: 4,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mảnh Tinh Thể': {
        description: 'item_manh_tinh_the_desc',
        tier: 2,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 2, max: 7 }
    },
    'Trái tim Magma': {
        description: 'item_trai_tim_magma_desc',
        tier: 5,
        category: 'Energy Source',
        emoji: '❤️‍🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
};
