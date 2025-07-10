import type { Recipe } from "../../definitions/recipe";

export const consumableRecipes: Record<string, Recipe> = {
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
    'Băng Gạc': {
        result: { name: 'Băng Gạc', quantity: 1, emoji: '🩹' },
        ingredients: [
            { name: 'Mảnh Vải Rách', quantity: 2 },
            { name: 'Thảo Dược Chữa Lành', quantity: 1 }
        ],
        description: 'recipe_bandage_desc',
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
    'Thuốc Thể Lực': {
        result: { name: 'Thuốc Thể Lực', quantity: 1, emoji: '🥤' },
        ingredients: [
            { name: 'Quả Mọng Ăn Được', quantity: 5 },
            { name: 'Mật Ong Hoang', quantity: 1 },
            { name: 'Nước Ngầm', quantity: 1 }
        ],
        description: 'recipe_stamina_potion_desc',
    },
};
