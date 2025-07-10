import type { Recipe } from "../../definitions/recipe";

export const equipmentRecipes: Record<string, Recipe> = {
    'Rìu Đá Đơn Giản': {
        result: { name: 'Rìu Đá Đơn Giản', quantity: 1, emoji: '🪓' },
        ingredients: [
            { 
                name: 'Cành Cây Chắc Chắn', 
                quantity: 1, 
                alternatives: [
                    { name: 'Lõi Gỗ', tier: 1 },
                    { name: 'Mảnh Xương', tier: 3 },
                ] 
            },
            { 
                name: 'Đá Cuội', 
                quantity: 1, 
                alternatives: [
                    { name: 'Đá Lửa', tier: 1 }, 
                    { name: 'Đá Granit', tier: 1 },
                    { name: 'Đá Sa Thạch', tier: 2 },
                ] 
            },
            { 
                name: 'Dây Gai', 
                quantity: 1, 
                alternatives: [
                    { name: 'Tơ Nhện Khổng lồ', tier: 1 },
                    { name: 'Da Thú Nhỏ', tier: 2 },
                    { name: 'Mảnh Vải Rách', tier: 3 },
                ] 
            }
        ],
        description: 'recipe_simple_stone_axe_desc',
    },
    'Dao Găm Đá': {
        result: { name: 'Dao Găm Đá', quantity: 1, emoji: '🗡️' },
        ingredients: [
            { name: 'Đá Cuội', quantity: 2 },
            { name: 'Mảnh Vải Rách', quantity: 1 }
        ],
        description: 'recipe_stone_dagger_desc',
    },
    'Khiên Gỗ': {
        result: { name: 'Khiên Gỗ', quantity: 1, emoji: '🛡️' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 4 },
            { name: 'Da Heo Rừng', quantity: 1, alternatives: [{ name: 'Da Gấu', tier: 1 }] }
        ],
        description: 'recipe_wooden_shield_desc',
    },
    'Cuốc Đá': {
        result: { name: 'Cuốc Đá', quantity: 1, emoji: '⛏️' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 2 },
            { name: 'Đá Cuội', quantity: 3 },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: 'recipe_stone_pickaxe_desc',
    },
    'Giáo Xương': {
        result: { name: 'Giáo Xương', quantity: 1, emoji: '🔱' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Nanh Sói', quantity: 1, alternatives: [{ name: 'Móng Vuốt Gấu', tier: 1 }, { name: 'Răng Cá Sấu', tier: 2 }] },
            { name: 'Dây Gai', quantity: 2 }
        ],
        description: 'recipe_bone_spear_desc',
    },
    'Rìu Chiến Obsidian': {
        result: { name: 'Rìu Chiến Obsidian', quantity: 1, emoji: '🪓' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 2 },
            { name: 'Đá Obsidian', quantity: 3 },
            { name: 'Da Gấu', quantity: 1 }
        ],
        description: 'recipe_obsidian_battleaxe_desc',
    },
    'Áo Giáp Da Cá Sấu': {
        result: { name: 'Áo Giáp Da Cá Sấu', quantity: 1, emoji: '👕' },
        ingredients: [
            { name: 'Da Cá Sấu', quantity: 2 },
            { name: 'Tơ Nhện Khổng lồ', quantity: 5 }
        ],
        description: 'recipe_alligator_armor_desc',
    },
    'Cung Tên Harpy': {
        result: { name: 'Cung Tên Harpy', quantity: 1, emoji: '🏹' },
        ingredients: [
            { name: 'Lõi Gỗ', quantity: 3 },
            { name: 'Lông Harpie', quantity: 5 },
            { name: 'Tơ Nhện Khổng lồ', quantity: 3 }
        ],
        description: 'recipe_harpy_bow_desc',
    },
    'Trượng Lõi Đá': {
        result: { name: 'Trượng Lõi Đá', quantity: 1, emoji: '🪄' },
        ingredients: [
            { name: 'Lõi Người Đá', quantity: 1 },
            { name: 'Lõi Gỗ', quantity: 1 },
            { name: 'Pha Lê Núi', quantity: 2 }
        ],
        description: 'recipe_golem_staff_desc',
    },
    'Búa Chiến Người Lùn': {
        result: { name: 'Búa Chiến Người Lùn', quantity: 1, emoji: '🔨' },
        ingredients: [
            { name: 'Quặng Sắt', quantity: 5 },
            { name: 'Lõi Người Đá', quantity: 1 },
            { name: 'Da Gấu', quantity: 2 }
        ],
        description: 'recipe_dwarven_hammer_desc',
    },
};
