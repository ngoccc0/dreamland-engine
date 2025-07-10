import type { ItemDefinition } from "../../types";

export const magicItems: Record<string, ItemDefinition> = {
    'Cát Ma Thuật': {
        description: 'item_cat_ma_thuat_desc',
        tier: 4,
        category: 'Magic',
        subCategory: 'Material',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tinh chất Ma trơi': {
        description: 'item_tinh_chat_ma_troi_desc',
        tier: 4,
        category: 'Magic',
        subCategory: 'Material',
        emoji: '💡',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
     'Hoa Tinh Linh': {
        description: 'item_hoa_tinh_linh_desc',
        tier: 4,
        category: 'Magic',
        subCategory: 'Material',
        emoji: '🌸',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        growthConditions: {
            optimal: { magicAffinity: { min: 7 } },
            subOptimal: { magicAffinity: { min: 5, max: 6 } }
        }
    },
    'Pha Lê Núi': {
        description: 'item_pha_le_nui_desc',
        tier: 4,
        category: 'Magic',
        subCategory: 'Material',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
     'Mảnh Tinh Thể': {
        description: 'item_manh_tinh_the_desc',
        tier: 2,
        category: 'Magic',
        subCategory: 'Material',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 2, max: 7 }
    },
};
