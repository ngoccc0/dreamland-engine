/**
 * @fileOverview Defines all support and healing items in the game.
 * @description This file contains definitions for consumable items like potions,
 * bandages, and other restoratives that directly affect the player's core stats
 * such as health, stamina, or cure status effects.
 */

import type { ItemDefinition } from "../../definitions/item";

export const supportItems: Record<string, ItemDefinition> = {
    'Thảo Dược Chữa Lành': {
        name: { en: 'Healing Herb', vi: 'Thảo Dược Chữa Lành' },
        description: { en: 'item_thao_duoc_chua_lanh_desc', vi: 'item_thao_duoc_chua_lanh_desc' },
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
        name: { en: 'Mountain Herb', vi: 'Cây Thuốc Núi' },
        description: { en: 'item_cay_thuoc_nui_desc', vi: 'item_cay_thuoc_nui_desc' },
        tier: 3,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 50 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Máu Yếu': {
        name: { en: 'Weak Health Potion', vi: 'Thuốc Máu Yếu' },
        description: { en: 'item_thuoc_mau_yeu_desc', vi: 'item_thuoc_mau_yeu_desc' },
        tier: 1,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 35 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Máu Mạnh': {
        name: { en: 'Strong Health Potion', vi: 'Thuốc Máu Mạnh' },
        description: { en: 'item_strong_health_potion_desc', vi: 'item_strong_health_potion_desc' },
        tier: 3,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 75 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Thể Lực': {
        name: { en: 'Stamina Potion', vi: 'Thuốc Thể Lực' },
        description: { en: 'item_stamina_potion_desc', vi: 'item_stamina_potion_desc' },
        tier: 3,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '🥤',
        effects: [{ type: 'RESTORE_STAMINA', amount: 70 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Băng Gạc': {
        name: { en: 'Bandage', vi: 'Băng Gạc' },
        description: { en: 'item_bandage_desc', vi: 'item_bandage_desc' },
        tier: 2,
        category: 'Support',
        emoji: '🩹',
        effects: [{ type: 'HEAL', amount: 15 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bình Nước Cũ': {
        name: { en: 'Old Canteen', vi: 'Bình Nước Cũ' },
        description: { en: 'item_binh_nuoc_cu_desc', vi: 'item_binh_nuoc_cu_desc' },
        tier: 1,
        category: 'Support',
        subCategory: 'Potion',
        emoji: '💧',
        effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], // More stamina focused than food
        baseQuantity: { min: 1, max: 1 }
    },
    'Tuyết': {
        name: { en: 'Snow', vi: 'Tuyết' },
        description: { en: 'item_tuyet_desc', vi: 'item_tuyet_desc' },
        tier: 1,
        category: 'Support',
        emoji: '❄️',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }, { type: 'RESTORE_MANA', amount: 1 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Nước Ngầm': {
        name: { en: 'Groundwater', vi: 'Nước Ngầm' },
        description: { en: 'item_nuoc_ngam_desc', vi: 'item_nuoc_ngam_desc' },
        tier: 1,
        category: 'Support',
        emoji: '💧',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 10 }, { type: 'RESTORE_MANA', amount: 2 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rượu Synth-Whiskey': { 
        name: { en: 'Synth-Whiskey', vi: 'Rượu Synth-Whiskey' },
        description: { en: 'item_synth_whiskey_desc', vi: 'item_synth_whiskey_desc' },
        emoji: '🥃', 
        category: 'Support', tier: 1, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }],
        baseQuantity: { min: 1, max: 1 } 
    },
    'Nước tẩm Gia vị': { 
        name: { en: 'Spice-Infused Water', vi: 'Nước tẩm Gia vị' },
        description: { en: 'item_spice_infused_water_desc', vi: 'item_spice_infused_water_desc' },
        emoji: '💧', 
        category: 'Support', tier: 2, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 40 }, { type: 'RESTORE_MANA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 } 
    },
    'Thuốc mỡ Tảo biển': { 
        name: { en: 'Algae Salve', vi: 'Thuốc mỡ Tảo biển' },
        description: { en: 'item_algae_salve_desc', vi: 'item_algae_salve_desc' },
        emoji: '🌿', 
        category: 'Support', tier: 1, 
        effects: [{ type: 'HEAL', amount: 20 }], 
        baseQuantity: { min: 1, max: 2 } 
    },
     'Viên Yass': { 
        name: { en: 'Yass Pill', vi: 'Viên Yass' },
        description: { en: 'item_yass_pill_desc', vi: 'item_yass_pill_desc' },
        emoji: '💊', 
        category: 'Support', tier: 2, 
        effects: [{ type: 'HEAL', amount: 30 }, { type: 'RESTORE_MANA', amount: 5 }], 
        baseQuantity: { min: 2, max: 2 } 
    },
    'Bản Remix của CupcakKe': { 
        name: { en: "CupcakKe's Remix", vi: 'Bản Remix của CupcakKe' },
        description: { en: 'item_cupcakke_remix_desc', vi: 'item_cupcakke_remix_desc' },
        emoji: '🎶', 
        category: 'Support', tier: 3, 
        effects: [{ type: 'RESTORE_STAMINA', amount: 50 }, { type: 'RESTORE_MANA', amount: 15 }], 
        baseQuantity: { min: 1, max: 1 } 
    },
    'Thuốc Giải Độc Thảo Mộc': {
        name: { en: 'Herbal Antidote', vi: 'Thuốc Giải Độc Thảo Mộc' },
        description: { en: 'item_herbal_antidote_desc', vi: 'item_herbal_antidote_desc' },
        tier: 4,
        category: 'Support',
        emoji: '💉🌿',
        effects: [{ type: 'CURE_POISON', amount: 100 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thuốc Hồi Phục Mạnh': {
        name: { en: 'Strong Recovery Potion', vi: 'Thuốc Hồi Phục Mạnh' },
        description: { en: 'item_strong_recovery_potion_desc', vi: 'item_strong_recovery_potion_desc' },
        tier: 5,
        category: 'Support',
        emoji: '🧪❤️‍🩹',
        effects: [{ type: 'HEAL', amount: 75 }, { type: 'RESTORE_STAMINA', amount: 75 }],
        baseQuantity: { min: 1, max: 1 }
    },
};
