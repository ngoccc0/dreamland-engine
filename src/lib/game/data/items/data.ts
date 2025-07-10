import type { ItemDefinition } from "../../types";

export const dataItems: Record<string, ItemDefinition> = {
    'Chìa Khóa Rỉ Sét': {
        name: 'Chìa Khóa Rỉ Sét',
        description: 'item_chia_khoa_ri_set_desc',
        emoji: '🗝️',
        tier: 2,
        category: 'Data',
        baseQuantity: { min: 1, max: 1 },
        weight: 0.1,
        stackable: 1,
        function: 'Opens a specific rusted lock.',
    },
    'Tai Yêu Tinh': {
        name: 'Tai Yêu Tinh',
        description: 'item_tai_yeu_tinh_desc',
        emoji: '👂',
        tier: 2,
        category: 'Data',
        subCategory: 'Loot',
        baseQuantity: { min: 1, max: 1 },
        weight: 0.1,
        stackable: 10,
        function: 'Proof of a goblin kill.',
        droppedBy: [{ creature: 'Yêu Tinh Rừng', chance: 0.5 }]
    },
    'Mảnh Gốm Cổ': {
        name: 'Mảnh Gốm Cổ',
        description: 'item_manh_gom_co_desc',
        emoji: '🏺',
        tier: 2,
        category: 'Data',
        baseQuantity: { min: 1, max: 1 },
        weight: 0.2,
        stackable: 5,
        function: 'A piece of an ancient artifact, potentially valuable.',
        naturalSpawn: [{ biome: 'desert', chance: 0.1 }]
    },
     'Trứng Griffon': {
        name: 'Trứng Griffon',
        description: 'item_trung_griffon_desc',
        emoji: '🥚',
        tier: 6,
        category: 'Data',
        subCategory: 'Misc',
        baseQuantity: { min: 1, max: 1 },
        weight: 5.0,
        stackable: 1,
        function: 'An extremely rare egg that could potentially be hatched.',
        naturalSpawn: [{ biome: 'mountain', chance: 0.01, conditions: { elevation: { min: 9 }, magicAffinity: { min: 7 } } }]
    },
    'Bản Đồ Cổ': {
        name: 'Bản Đồ Cổ',
        description: 'item_ban_do_co_desc',
        emoji: '🗺️',
        tier: 3,
        category: 'Data',
        baseQuantity: { min: 1, max: 1 },
        weight: 0.1,
        stackable: 1,
        function: 'Leads to a hidden location.',
        naturalSpawn: [{ biome: 'cave', chance: 0.1, conditions: { humanPresence: { min: 3 } } }]
    },
};
