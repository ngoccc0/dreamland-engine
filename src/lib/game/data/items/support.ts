import type { ItemDefinition } from "../../types";

export const supportItems: Record<string, ItemDefinition> = {
    'Thuốc Máu Yếu': {
        description: 'item_thuoc_mau_yeu_desc',
        tier: 1,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 35 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thảo Dược Chữa Lành': {
        description: 'item_thao_duoc_chua_lanh_desc',
        tier: 2,
        category: 'Support',
        subCategory: 'Misc',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 20 }],
        baseQuantity: { min: 1, max: 2 },
        growthConditions: {
            optimal: { moisture: { min: 6, max: 8 }, temperature: { min: 5, max: 8 }, lightLevel: { min: 2, max: 6 } },
            subOptimal: { moisture: { min: 4, max: 5 }, temperature: { min: 3, max: 4 } }
        }
    },
    'Nước Ngầm': {
        description: 'item_nuoc_ngam_desc',
        tier: 1,
        category: 'Support',
        emoji: '💧',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tuyết': {
        description: 'item_tuyet_desc',
        tier: 1,
        category: 'Support',
        emoji: '❄️',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cây Thuốc Núi': {
        description: 'item_cay_thuoc_nui_desc',
        tier: 3,
        category: 'Support',
        subCategory: 'Misc',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 50 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Băng Gạc': {
        description: 'item_bandage_desc',
        tier: 2,
        category: 'Support',
        emoji: '🩹',
        effects: [{ type: 'HEAL', amount: 15 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Máu Mạnh': {
        description: 'item_strong_health_potion_desc',
        tier: 3,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 75 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Thể Lực': {
        description: 'item_stamina_potion_desc',
        tier: 3,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🥤',
        effects: [{ type: 'RESTORE_STAMINA', amount: 70 }],
        baseQuantity: { min: 1, max: 1 }
    },
};
