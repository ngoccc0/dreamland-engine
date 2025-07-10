import type { ItemDefinition } from "../../types";

export const dataItems: Record<string, ItemDefinition> = {
    'Chìa Khóa Rỉ Sét': {
        description: 'item_chia_khoa_ri_set_desc',
        tier: 2,
        category: 'Data',
        emoji: '🗝️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tai Yêu Tinh': {
        description: 'item_tai_yeu_tinh_desc',
        tier: 2,
        category: 'Data',
        subCategory: 'Loot',
        emoji: '👂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Gốm Cổ': {
        description: 'item_manh_gom_co_desc',
        tier: 2,
        category: 'Data',
        emoji: '🏺',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
     'Trứng Griffon': {
        description: 'item_trung_griffon_desc',
        tier: 6,
        category: 'Data',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bản Đồ Cổ': {
        description: 'item_ban_do_co_desc',
        tier: 3,
        category: 'Data',
        emoji: '🗺️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
};
