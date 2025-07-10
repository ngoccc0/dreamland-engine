import type { ItemDefinition } from "../../definitions/item";

export const supportItems: Record<string, ItemDefinition> = {
    'Thảo Dược Chữa Lành': {
        description: 'item_thao_duoc_chua_lanh_desc',
        tier: 2,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 20 }],
        baseQuantity: { min: 1, max: 2 },
        growthConditions: {
            optimal: { moisture: { min: 6, max: 8 }, temperature: { min: 5, max: 8 }, lightLevel: { min: 2, max: 6 } },
            subOptimal: { moisture: { min: 4, max: 5 }, temperature: { min: 3, max: 4 } }
        }
    },
    'Cây Thuốc Núi': {
        description: 'item_cay_thuoc_nui_desc',
        tier: 3,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 50 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Máu Yếu': {
        description: 'item_thuoc_mau_yeu_desc',
        tier: 1,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 35 }],
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
    'Băng Gạc': {
        description: 'item_bandage_desc',
        tier: 2,
        category: 'Support',
        emoji: '🩹',
        effects: [{ type: 'HEAL', amount: 15 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bình Nước Cũ': {
        description: 'item_binh_nuoc_cu_desc',
        tier: 1,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '💧',
        effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], // More stamina focused than food
        baseQuantity: { min: 1, max: 1 }
    },
    'Tuyết': {
        description: 'item_tuyet_desc',
        tier: 1,
        category: 'Support',
        emoji: '❄️',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Nước Ngầm': {
        description: 'item_nuoc_ngam_desc',
        tier: 1,
        category: 'Support',
        emoji: '💧',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 10 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nước Bùn': {
        description: 'item_nuoc_bun_desc',
        tier: 1,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rượu Synth-Whiskey': { 
        description: 'item_synth_whiskey_desc', 
        emoji: '🥃', 
        category: 'Support', tier: 1, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }],
        baseQuantity: { min: 1, max: 1 } 
    },
    'Nước tẩm Gia vị': { 
        description: 'item_spice_infused_water_desc', 
        emoji: '💧', 
        category: 'Support', tier: 2, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 40 }, { type: 'RESTORE_MANA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 } 
    },
    'Thuốc mỡ Tảo biển': { 
        description: 'item_algae_salve_desc', 
        emoji: '🌿', 
        category: 'Support', tier: 1, 
        effects: [{ type: 'HEAL', amount: 20 }], 
        baseQuantity: { min: 1, max: 2 } 
    },
     'Viên Yass': { 
        description: 'item_yass_pill_desc', 
        emoji: '💊', 
        category: 'Support', tier: 2, 
        effects: [{ type: 'HEAL', amount: 30 }, { type: 'RESTORE_MANA', amount: 5 }], 
        baseQuantity: { min: 2, max: 2 } 
    },
    'Bản Remix của CupcakKe': { 
        description: 'item_cupcakke_remix_desc', 
        emoji: '🎶', 
        category: 'Support', tier: 3, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 50 }, { type: 'RESTORE_MANA', amount: 15 }], 
        baseQuantity: { min: 1, max: 1 } 
    },
    'Thuốc Giải Độc Thảo Mộc': {
        description: 'item_herbal_antidote_desc',
        tier: 4,
        category: 'Support',
        emoji: '💉🌿',
        effects: [{ type: 'CURE_POISON', amount: 100 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Hồi Phục Mạnh': {
        description: 'item_strong_recovery_potion_desc',
        tier: 5,
        category: 'Support',
        emoji: '🧪❤️‍🩹',
        effects: [{ type: 'HEAL', amount: 75 }, { type: 'RESTORE_STAMINA', amount: 75 }],
        baseQuantity: { min: 1, max: 1 }
    },
};
