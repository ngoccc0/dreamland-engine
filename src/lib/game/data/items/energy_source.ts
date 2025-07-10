import type { ItemDefinition } from "../../types";

export const energySourceItems: Record<string, ItemDefinition> = {
    'Lõi Người Đá': {
        name: 'Lõi Người Đá',
        description: 'item_loi_nguoi_da_desc',
        emoji: '💖',
        tier: 5,
        category: 'Energy Source',
        subCategory: 'Magic',
        baseQuantity: { min: 1, max: 1 },
        weight: 2.0,
        stackable: 1,
        function: 'A powerful magic core used in high-tier crafting.',
        droppedBy: [{ creature: 'Người đá', chance: 0.1 }]
    },
    'Trái tim Magma': {
        name: 'Trái tim Magma',
        description: 'item_trai_tim_magma_desc',
        emoji: '❤️‍🔥',
        tier: 5,
        category: 'Energy Source',
        subCategory: 'Magic',
        baseQuantity: { min: 1, max: 1 },
        weight: 3.0,
        stackable: 1,
        function: 'The heart of a lava golem, pulsing with intense heat and energy.',
        senseEffect: { keywords: ['hot', 'glowing'] },
        droppedBy: [{ creature: 'Golem dung nham', chance: 0.1 }],
        naturalSpawn: [{ biome: 'volcanic', chance: 0.05, conditions: { dangerLevel: { min: 9 }, magicAffinity: { min: 7 } } }]
    },
     'Pin Năng Lượng': {
        name: 'Pin Năng Lượng',
        description: 'Một viên pin công nghệ cao, vẫn còn một chút năng lượng.',
        emoji: '🔋',
        tier: 4,
        category: 'Energy Source',
        subCategory: 'Technology',
        baseQuantity: { min: 1, max: 1 },
        weight: 0.5,
        stackable: 5,
        function: 'A power cell used for technological devices.'
    },
    'Lõi Năng Lượng Tàu Vũ Trụ': {
        name: 'Lõi Năng Lượng Tàu Vũ Trụ',
        description: 'Lõi năng lượng chính từ một con tàu vũ trụ, tỏa ra năng lượng mạnh mẽ.',
        emoji: '⚛️',
        tier: 6,
        category: 'Energy Source',
        subCategory: 'Technology',
        baseQuantity: { min: 1, max: 1 },
        weight: 10.0,
        stackable: 1,
        function: 'A powerful core for advanced technology.',
        senseEffect: { keywords: ['humming', 'glowing'] }
    },
    'Bình Nén Khí': {
        name: 'Bình Nén Khí',
        description: 'Một bình chứa khí nén áp suất cao, có thể dùng làm nguồn đẩy.',
        emoji: '💨',
        tier: 3,
        category: 'Energy Source',
        baseQuantity: { min: 1, max: 1 },
        weight: 2.5,
        stackable: 3,
        function: 'Provides pressurized gas for certain tools or propulsion.'
    }
};
