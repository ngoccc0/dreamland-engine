import type { ItemDefinition } from "../../types";

export const magicItems: Record<string, ItemDefinition> = {
    'Cát Ma Thuật': {
        name: 'Cát Ma Thuật',
        description: 'item_cat_ma_thuat_desc',
        emoji: '✨',
        tier: 4,
        category: 'Magic',
        subCategory: 'Material',
        baseQuantity: { min: 1, max: 2 },
        weight: 0.1,
        stackable: 20,
        function: 'Sand infused with raw magical energy, used in enchanting and spellcasting.',
        senseEffect: { keywords: ['glowing', 'sparkling'] },
        droppedBy: [{ creature: 'Linh hồn cát', chance: 0.15 }]
    },
    'Tinh chất Ma trơi': {
        name: 'Tinh chất Ma trơi',
        description: 'item_tinh_chat_ma_troi_desc',
        emoji: '💡',
        tier: 4,
        category: 'Magic',
        subCategory: 'Material',
        baseQuantity: { min: 1, max: 1 },
        weight: 0.05,
        stackable: 10,
        function: 'The condensed essence of a Will-o-Wisp, a potent source of light magic.',
        senseEffect: { keywords: ['glowing', 'warm'] },
        droppedBy: [{ creature: 'Ma trơi', chance: 0.2 }]
    },
     'Hoa Tinh Linh': {
        name: 'Hoa Tinh Linh',
        description: 'item_hoa_tinh_linh_desc',
        emoji: '🌸',
        tier: 4,
        category: 'Magic',
        subCategory: 'Material',
        baseQuantity: { min: 1, max: 1 },
        weight: 0.1,
        stackable: 5,
        function: 'A rare flower that blooms in places with high magic affinity.',
        senseEffect: { keywords: ['glowing', 'ethereal', 'fragrant'] },
        naturalSpawn: [{ biome: 'forest', chance: 0.1, conditions: { magicAffinity: { min: 7 } } }]
    },
    'Pha Lê Núi': {
        name: 'Pha Lê Núi',
        description: 'item_pha_le_nui_desc',
        emoji: '💎',
        tier: 4,
        category: 'Magic',
        subCategory: 'Material',
        baseQuantity: { min: 1, max: 2 },
        weight: 0.5,
        stackable: 10,
        function: 'A crystal that can store and focus magical energy.',
        naturalSpawn: [{ biome: 'mountain', chance: 0.1, conditions: { magicAffinity: { min: 5 }, elevation: { min: 7 } } }]
    },
     'Mảnh Tinh Thể': {
        name: 'Mảnh Tinh Thể',
        description: 'item_manh_tinh_the_desc',
        emoji: '💎',
        tier: 2,
        category: 'Magic',
        subCategory: 'Material',
        baseQuantity: { min: 2, max: 7 },
        weight: 0.2,
        stackable: 30,
        function: 'A small fragment of a larger magic crystal.',
        naturalSpawn: [{ biome: 'cave', chance: 0.3, conditions: { magicAffinity: { min: 6 } } }]
    },
};
