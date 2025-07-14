/**
 * @fileOverview Defines all standard equippable items.
 * @description This file contains definitions for weapons, armor, and accessories
 * that provide direct stat bonuses or other attributes when equipped by the player.
 */

import type { ItemDefinition } from "../../definitions/item";

export const equipmentItems: Record<string, ItemDefinition> = {
    'Dao Găm Đá': {
        description: 'item_stone_dagger_desc',
        tier: 1,
        category: 'Weapon',
        emoji: '🗡️',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'weapon',
        attributes: { physicalAttack: 2, critChance: 1, attackSpeed: 0, cooldownReduction: 0 },
    },
    'Khiên Gỗ': {
        description: 'item_wooden_shield_desc',
        tier: 2,
        category: 'Equipment',
        emoji: '🛡️',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'accessory',
        attributes: { physicalAttack: 0, magicalAttack: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0, physicalDefense: 5 },
    },
    'Giáo Xương': {
        description: 'item_bone_spear_desc',
        tier: 2,
        category: 'Weapon',
        emoji: '🔱',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'weapon',
        attributes: { physicalAttack: 4, magicalAttack: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0 },
    },
    'Rìu Đá Đơn Giản': {
        description: 'item_riu_da_don_gian_desc',
        tier: 1,
        category: 'Tool',
        emoji: '🪓',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'weapon',
        attributes: { physicalAttack: 3, magicalAttack: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0 },
    },
    'Thuyền Phao': {
        description: 'item_inflatable_raft_desc',
        tier: 3,
        category: 'Equipment',
        emoji: '🛶',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rìu Chiến Obsidian': {
        description: 'item_obsidian_battleaxe_desc',
        tier: 4,
        category: 'Weapon',
        emoji: '🪓',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'weapon',
        attributes: { physicalAttack: 12, magicalAttack: 0, critChance: 5, attackSpeed: -0.1, cooldownReduction: 0 },
    },
    'Áo Giáp Da Cá Sấu': {
        description: 'item_alligator_armor_desc',
        tier: 4,
        category: 'Equipment',
        emoji: '👕',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'armor',
        attributes: { physicalAttack: 2, magicalAttack: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 5 },
    },
    'Cung Tên Harpy': {
        description: 'item_harpy_bow_desc',
        tier: 4,
        category: 'Weapon',
        emoji: '🏹',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'weapon',
        attributes: { physicalAttack: 8, magicalAttack: 0, critChance: 0, attackSpeed: 0.2, cooldownReduction: 0 },
    },
    'Trượng Lõi Đá': {
        description: 'item_golem_staff_desc',
        tier: 5,
        category: 'Weapon',
        subCategory: 'Magic',
        emoji: '🪄',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'weapon',
        attributes: { physicalAttack: 2, magicalAttack: 15, critChance: 0, attackSpeed: 0, cooldownReduction: 10 },
    },
    'Búa Chiến Người Lùn': {
        description: 'item_dwarven_hammer_desc',
        tier: 5,
        category: 'Weapon',
        emoji: '🔨',
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        equipmentSlot: 'weapon',
        attributes: { physicalAttack: 15, magicalAttack: 0, critChance: 10, attackSpeed: -0.2, cooldownReduction: 0 },
    },
    'Áo Khoác Trench': { 
        description: 'item_trench_coat_desc', 
        emoji: '🧥', 
        category: 'Equipment', 
        tier: 2, 
        effects: [], 
        baseQuantity: { min: 1, max: 1 }, 
        equipmentSlot: 'armor', 
        attributes: { physicalDefense: 3 } 
    },
    'Khẩu Súng Lục Cũ': { 
        description: 'item_old_revolver_desc', 
        emoji: '🔫', 
        category: 'Weapon', 
        tier: 2, 
        effects: [], 
        baseQuantity: { min: 1, max: 1 }, 
        equipmentSlot: 'weapon', 
        attributes: { physicalAttack: 6, critChance: 3 } 
    },
    'Rìu Băng Tự Chế': { 
        description: 'item_makeshift_ice_axe_desc', 
        emoji: '⛏️', 
        category: 'Weapon', 
        tier: 1, 
        effects: [], 
        baseQuantity: { min: 1, max: 1 }, 
        attributes: { physicalAttack: 4, critChance: 1 }, 
        equipmentSlot: 'weapon' 
    },
    'Đũa Phép Của Học Viên': { 
        description: 'item_student_wand_desc', 
        emoji: '🪄', 
        category: 'Weapon', 
        tier: 2, 
        effects: [], 
        baseQuantity: { min: 1, max: 1 }, 
        equipmentSlot: 'weapon', 
        attributes: { magicalAttack: 5 } 
    },
    'Áo Choàng Học Viện': { 
        description: 'item_academy_robe_desc', 
        emoji: '🥋', 
        category: 'Equipment', 
        tier: 2, 
        effects: [], 
        baseQuantity: { min: 1, max: 1 }, 
        equipmentSlot: 'armor', 
        attributes: { cooldownReduction: 5 } 
    },
    'Súng lục Laser': { 
        description: 'item_laser_revolver_desc', 
        emoji: '🔫', 
        category: 'Weapon', 
        tier: 3, 
        effects: [], 
        baseQuantity: { min: 1, max: 1 }, 
        equipmentSlot: 'weapon', 
        attributes: { physicalAttack: 8, critChance: 5 } 
    },
    'Giáo San hô': { 
        description: 'item_coral_spear_desc', 
        emoji: '🔱', 
        category: 'Weapon', 
        tier: 2, 
        effects: [], 
        baseQuantity: { min: 1, max: 1 }, 
        equipmentSlot: 'weapon', 
        attributes: { physicalAttack: 5 } 
    },
    'Chảo của Jiafei': {
        description: 'item_jiafei_pan_desc',
        emoji: '🍳',
        category: 'Weapon',
        tier: 2,
        effects: [],
        baseQuantity: { min: 1, max: 1 },
        attributes: { physicalAttack: 5, critChance: 2 },
        equipmentSlot: 'weapon',
    }
};
