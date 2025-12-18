/**
 * Cooking Recipes - 6 Kebab Recipes
 *
 * @remarks
 * All recipes use unordered ingredient matching (any arrangement works).
 * Pattern field is optional - used for UI display hints only.
 * Tier 2 recipes (mid-game).
 */

import type { CookingRecipe } from "@/core/types/definitions/cooking-recipe";

/**
 * 1. Buttered Meat Skewer - CAMPFIRE
 * Ingredients: crude_fat + meat_chunk + plant_oil
 * Stats: Hunger ×1.0 (base) + Stamina ×1.1 (+10%)
 */
export const butterMeatSkewer: CookingRecipe = {
    id: 'buttered_meat_skewer',
    name: { en: "Buttered Meat Skewer", vi: "Xiên Thịt Bơ" },
    description: {
        en: "Tender meat wrapped in rich butter and fat, cooked slowly over campfire embers.",
        vi: "Thịt mềm mại khoác bơ và mỡ, nấu chậm trên than nóng."
    },
    ingredients: [
        { id: 'crude_fat', quantity: 1, optional: false },
        { id: 'meat_chunk', quantity: 1, optional: false },
        { id: 'plant_oil', quantity: 1, optional: false },
    ],
    pattern: ['crude_fat', 'meat_chunk', 'plant_oil'],
    cookingType: 'CAMPFIRE',
    cookingTime: 30,
    result: {
        baseFood: 'meat_kebab',
        emoji: '🍢',
        description: { en: "Buttered Meat Skewer", vi: "Xiên Thịt Bơ" },
    },
    statMultipliers: {
        hunger: 1.0,
        stamina: 1.1,
        health: 1.0,
    },
    tier: 2,
    notes: "Classic campfire dish with stamina bonus",
};

/**
 * 2. Spirit Fire Kebab - CAMPFIRE
 * Ingredients: crude_fat + meat_chunk + wild_chili
 * Stats: Hunger ×1.0 + Stamina ×0.9 (-10% but spicy) + can use wild_chili spice
 */
export const spiritFireKebab: CookingRecipe = {
    id: 'spirit_fire_kebab',
    name: { en: "Spirit Fire Kebab", vi: "Xiên Lửa Linh Hồn" },
    description: {
        en: "Meat seasoned with fiery wild chili, adds warmth and spice to your adventure.",
        vi: "Thịt ướp với ớt dại cay nóng, tăng ấm áp cho cuộc phiêu lưu."
    },
    ingredients: [
        { id: 'crude_fat', quantity: 1, optional: false },
        { id: 'meat_chunk', quantity: 1, optional: false },
        { id: 'wild_chili', quantity: 1, optional: false },
    ],
    pattern: ['crude_fat', 'meat_chunk', 'wild_chili'],
    cookingType: 'CAMPFIRE',
    cookingTime: 35,
    result: {
        baseFood: 'meat_kebab',
        emoji: '🔥',
        description: { en: "Spirit Fire Kebab", vi: "Xiên Lửa Linh Hồn" },
    },
    statMultipliers: {
        hunger: 1.0,
        stamina: 0.9,
        health: 1.0,
    },
    tier: 2,
    notes: "Spicy campfire recipe with warmth buff",
};

/**
 * 3. Tender Hunter Kebab - CAMPFIRE
 * Ingredients: crude_fat + meat_chunk + wild_citrus_juice
 * Stats: Hunger ×1.0 + Health ×1.3 (+30% health)
 */
export const tenderHunterKebab: CookingRecipe = {
    id: 'tender_hunter_kebab',
    name: { en: "Tender Hunter Kebab", vi: "Xiên Thợ Săn Mềm Mại" },
    description: {
        en: "Marinated in citrus juice, the meat becomes incredibly tender and nutritious.",
        vi: "Ướp trong nước chua, thịt trở nên mềm mại và giàu dinh dưỡng."
    },
    ingredients: [
        { id: 'crude_fat', quantity: 1, optional: false },
        { id: 'meat_chunk', quantity: 1, optional: false },
        { id: 'wild_citrus_juice', quantity: 1, optional: false },
    ],
    pattern: ['crude_fat', 'meat_chunk', 'wild_citrus_juice'],
    cookingType: 'CAMPFIRE',
    cookingTime: 40,
    result: {
        baseFood: 'meat_kebab',
        emoji: '🍖',
        description: { en: "Tender Hunter Kebab", vi: "Xiên Thợ Săn Mềm Mại" },
    },
    statMultipliers: {
        hunger: 1.0,
        stamina: 1.0,
        health: 1.3,
    },
    tier: 2,
    notes: "Citrus marinade provides health boost",
};

/**
 * 4. Meaty Mushroom Skewer - CAMPFIRE
 * Ingredients: edible_mushroom + plant_oil + fresh_herbs
 * Stats: Hunger ×1.0 + Stamina ×1.0 + Health ×1.1 (+10%)
 */
export const meatyMushroomSkewer: CookingRecipe = {
    id: 'meaty_mushroom_skewer',
    name: { en: "Meaty Mushroom Skewer", vi: "Xiên Nấm Béo Ngậy" },
    description: {
        en: "Savory mushrooms with herbs and a hint of oil, umami-rich and satisfying.",
        vi: "Nấm béo ngậy với thảo mộc và một ít dầu, đầy đủ hương vị umami."
    },
    ingredients: [
        { id: 'edible_mushroom', quantity: 1, optional: false },
        { id: 'plant_oil', quantity: 1, optional: false },
        { id: 'fresh_herbs', quantity: 1, optional: false },
    ],
    pattern: ['edible_mushroom', 'plant_oil', 'fresh_herbs'],
    cookingType: 'CAMPFIRE',
    cookingTime: 25,
    result: {
        baseFood: 'vegan_kebab',
        emoji: '🍄',
        description: { en: "Meaty Mushroom Skewer", vi: "Xiên Nấm Béo Ngậy" },
    },
    statMultipliers: {
        hunger: 1.0,
        stamina: 1.0,
        health: 1.1,
    },
    tier: 2,
    notes: "Vegetarian campfire dish",
};

/**
 * 5. Energy Root Skewer - POT
 * Ingredients: wild_honey + fresh_herbs + plant_oil
 * Stats: Hunger ×1.0 + Stamina ×1.4 (+40% stamina boost!)
 */
export const energyRootSkewer: CookingRecipe = {
    id: 'energy_root_skewer',
    name: { en: "Energy Root Skewer", vi: "Xiên Rễ Năng Lượng" },
    description: {
        en: "Sweet and aromatic, this energy-boosting recipe restores significant stamina.",
        vi: "Ngọt ngào và thơm, công thức tăng năng lượng này khôi phục rất nhiều thể lực."
    },
    ingredients: [
        { id: 'wild_honey', quantity: 1, optional: false },
        { id: 'fresh_herbs', quantity: 1, optional: false },
        { id: 'plant_oil', quantity: 1, optional: false },
    ],
    cookingType: 'POT',
    cookingTime: 45,
    result: {
        baseFood: 'vegan_kebab',
        emoji: '⚡',
        description: { en: "Energy Root Skewer", vi: "Xiên Rễ Năng Lượng" },
    },
    statMultipliers: {
        hunger: 1.0,
        stamina: 1.4,
        health: 1.0,
    },
    tier: 2,
    notes: "Honey-based energy recipe for stamina recovery",
};

/**
 * 6. Antidote Kebab - POT
 * Ingredients: fresh_herbs + wild_citrus_juice + edible_mushroom
 * Stats: Hunger ×0.8 (-20% hunger) + Health ×1.5 (+50% health!) - healing focus
 */
export const antidoteKebab: CookingRecipe = {
    id: 'antidote_kebab',
    name: { en: "Antidote Kebab", vi: "Xiên Giải Độc" },
    description: {
        en: "Medicinal herbs and mushrooms combined to form a powerful healing dish.",
        vi: "Thảo mộc dược liệu và nấm kết hợp tạo thành một món ăn chữa bệnh mạnh mẽ."
    },
    ingredients: [
        { id: 'fresh_herbs', quantity: 1, optional: false },
        { id: 'wild_citrus_juice', quantity: 1, optional: false },
        { id: 'edible_mushroom', quantity: 1, optional: false },
    ],
    cookingType: 'POT',
    cookingTime: 50,
    result: {
        baseFood: 'herb_kebab',
        emoji: '🧪',
        description: { en: "Antidote Kebab", vi: "Xiên Giải Độc" },
    },
    statMultipliers: {
        hunger: 0.8,
        stamina: 1.0,
        health: 1.5,
    },
    tier: 2,
    notes: "High-health healing recipe with herb focus",
};

/**
 * Recipe Catalog - All recipes indexed by ID
 */
export const cookingRecipes: Record<string, CookingRecipe> = {
    'buttered_meat_skewer': butterMeatSkewer,
    'spirit_fire_kebab': spiritFireKebab,
    'tender_hunter_kebab': tenderHunterKebab,
    'meaty_mushroom_skewer': meatyMushroomSkewer,
    'energy_root_skewer': energyRootSkewer,
    'antidote_kebab': antidoteKebab,
};

/**
 * Get all cooking recipes
 */
export function getAllCookingRecipes(): CookingRecipe[] {
    return Object.values(cookingRecipes);
}

/**
 * Get recipe by ID
 */
export function getCookingRecipeById(id: string): CookingRecipe | null {
    return cookingRecipes[id] || null;
}

/**
 * Get recipes by cooking type
 */
export function getCookingRecipesByType(type: 'CAMPFIRE' | 'POT' | 'OVEN'): CookingRecipe[] {
    return getAllCookingRecipes().filter((r) => r.cookingType === type);
}
