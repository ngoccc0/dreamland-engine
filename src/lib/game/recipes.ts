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
};
