import type { ItemDefinition } from "../../definitions/item";

export const dataItems: Record<string, ItemDefinition> = {
    'Tai Yêu Tinh': {
        description: 'item_tai_yeu_tinh_desc',
        tier: 2,
        category: 'Data',
        emoji: '👂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Chìa Khóa Rỉ Sét': {
        description: 'item_chia_khoa_ri_set_desc',
        tier: 2,
        category: 'Data',
        emoji: '🗝️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mũi Tên Cũ': {
        description: 'item_mui_ten_cu_desc',
        tier: 1,
        category: 'Material',
        emoji: '🏹',
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
    'Túi Trứng Nhện': {
        description: 'item_tui_trung_nhen_desc',
        tier: 3,
        category: 'Material',
        subCategory: 'Misc',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
};
