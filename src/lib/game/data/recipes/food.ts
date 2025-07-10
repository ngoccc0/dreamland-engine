import type { Recipe } from "../../definitions/recipe";

export const foodRecipes: Record<string, Recipe> = {
    'Thịt Nướng': {
        result: { name: 'Thịt Nướng', quantity: 1, emoji: '🥩' },
        ingredients: [
            { 
                name: 'Thịt Sói Sống', 
                quantity: 1,
                alternatives: [
                    { name: 'Thịt Heo Rừng', tier: 1 },
                    { name: 'Thịt Thỏ', tier: 1 },
                    { name: 'Thịt Dê Núi', tier: 1 },
                    { name: 'Thịt Báo Tuyết', tier: 1 },
                ]
            },
            { name: 'Cành Cây Chắc Chắn', quantity: 1 }
        ],
        description: 'recipe_cooked_meat_desc',
    },
    'Bánh Mì': {
        result: { name: 'Bánh Mì', quantity: 2, emoji: '🍞' },
        ingredients: [
            { name: 'Lúa Mì', quantity: 3 },
            { name: 'Nước Ngầm', quantity: 1 }
        ],
        description: 'recipe_bread_desc',
    }
};

// We also need to add the definition for the new cooked meat item
export const cookedFoodItems = {
    'Thịt Nướng': {
        name: 'Thịt Nướng',
        description: 'item_cooked_meat_desc',
        emoji: '🥩',
        tier: 2,
        category: 'Food',
        subCategory: 'Meat',
        effects: [{ type: 'RESTORE_STAMINA', amount: 40 }],
        baseQuantity: { min: 1, max: 1 },
        weight: 0.4,
        stackable: 5,
        function: 'Cooked meat, much more nutritious and safer than raw.',
    },
    'Bánh Mì': {
        name: 'Bánh Mì',
        description: 'item_bread_desc',
        emoji: '🍞',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 30 }],
        baseQuantity: { min: 2, max: 2 },
        weight: 0.2,
        stackable: 10,
        function: 'A simple loaf of bread.',
    }
}
