import type { ItemDefinition } from "../../types";

export const energySourceItems: Record<string, ItemDefinition> = {
    'Lõi Người Đá': {
        description: 'item_loi_nguoi_da_desc',
        tier: 5,
        category: 'Energy Source',
        subCategory: 'Magic',
        emoji: '💖',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trái tim Magma': {
        description: 'item_trai_tim_magma_desc',
        tier: 5,
        category: 'Energy Source',
        subCategory: 'Magic',
        emoji: '❤️‍🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
     'Pin Năng Lượng': {
        description: 'Một viên pin công nghệ cao, vẫn còn một chút năng lượng.',
        tier: 4,
        category: 'Energy Source',
        subCategory: 'Technology',
        emoji: '🔋',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lõi Năng Lượng Tàu Vũ Trụ': {
        description: 'Lõi năng lượng chính từ một con tàu vũ trụ, tỏa ra năng lượng mạnh mẽ.',
        tier: 6,
        category: 'Energy Source',
        subCategory: 'Technology',
        emoji: '⚛️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bình Nén Khí': {
        description: 'Một bình chứa khí nén áp suất cao, có thể dùng làm nguồn đẩy.',
        tier: 3,
        category: 'Energy Source',
        emoji: '💨',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    }
};
