import type { Recipe } from "./types";

export const recipes: Record<string, Recipe> = {
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
    'Thuốc Máu Yếu': {
        result: { name: 'Thuốc Máu Yếu', quantity: 1, emoji: '🧪' },
        ingredients: [
            { 
                name: 'Thảo Dược Chữa Lành', 
                quantity: 1,
                alternatives: [
                    { name: 'Hoa Dại', tier: 3 }
                ]
            },
            { 
                name: 'Nước Ngầm', 
                quantity: 1, 
                alternatives: [
                    { name: 'Nước Bùn', tier: 2 }
                ] 
            }
        ],
        description: 'recipe_weak_health_potion_desc',
    },
    'Bó Đuốc': {
        result: { name: 'Bó Đuốc', quantity: 1, emoji: '🔥' },
        ingredients: [
            { name: 'Cành Cây Chắc Chắn', quantity: 1 },
            { 
                name: 'Mảnh Vải Rách', 
                quantity: 1,
                alternatives: [
                    { name: 'Cỏ Khô', tier: 2 },
                    { name: 'Da Thú Nhỏ', tier: 3 },
                ]
            },
            { name: 'Nhựa Cây Dính', quantity: 1 }
        ],
        description: 'recipe_torch_desc',
    },
    'Thuyền Phao': {
        result: { name: 'Thuyền Phao', quantity: 1, emoji: '🛶' },
        ingredients: [
            { name: 'Da Gấu', quantity: 1, alternatives: [{name: 'Da Cá Sấu', tier: 1}] },
            { name: 'Lõi Gỗ', quantity: 5 },
            { name: 'Dây Gai', quantity: 10, alternatives: [{name: 'Tơ Nhện Khổng lồ', tier: 1}] }
        ],
        description: 'recipe_inflatable_raft_desc',
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
    'Băng Gạc': {
        result: { name: 'Băng Gạc', quantity: 1, emoji: '🩹' },
        ingredients: [
            { name: 'Mảnh Vải Rách', quantity: 2 },
            { name: 'Thảo Dược Chữa Lành', quantity: 1 }
        ],
        description: 'recipe_bandage_desc',
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
    'Thuốc Máu Mạnh': {
        result: { name: 'Thuốc Máu Mạnh', quantity: 1, emoji: '🧪' },
        ingredients: [
            { name: 'Thuốc Máu Yếu', quantity: 1 },
            { name: 'Cây Thuốc Núi', quantity: 1 },
            { name: 'Nước Ngầm', quantity: 1 }
        ],
        description: 'recipe_strong_health_potion_desc',
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
    'Thuốc Thể Lực': {
        result: { name: 'Thuốc Thể Lực', quantity: 1, emoji: '🥤' },
        ingredients: [
            { name: 'Quả Mọng Ăn Được', quantity: 5 },
            { name: 'Mật Ong Hoang', quantity: 1 },
            { name: 'Nước Ngầm', quantity: 1 }
        ],
        description: 'recipe_stamina_potion_desc',
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
