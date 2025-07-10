import type { Recipe } from "../../types";

export const toolRecipes: Record<string, Recipe> = {
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
};
