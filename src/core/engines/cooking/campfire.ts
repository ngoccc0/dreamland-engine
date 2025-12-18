/**
 * Campfire Cooking Engine
 *
 * @remarks
 * **Logic Flow:**
 * 1. Validate minimum ingredients (at least 1)
 * 2. Match ingredients against recipe (UNORDERED)
 * 3. If matched: Generate merged kebab with combined stats
 * 4. If not matched: Return ingredients as separately grilled items
 * 5. Mark all items as HOT (isHot: true, craftedAt: now())
 * 6. Apply spice multiplier to hunger if present
 */

import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';
import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { GameEffect } from '@/core/types/game';
import { createItem } from '@/core/domain/item';
import { generateCookedFood } from './food-generator';

export interface CampfireResult {
    success: boolean;
    items: Item[];
    message: { en: string; vi: string };
    effects: GameEffect[];
}

/**
 * Cook items on campfire with pattern matching
 *
 * @param ingredients - Items to cook (should match recipe)
 * @param recipe - Cooking recipe to use
 * @param itemDefinitions - Item catalog for lookups
 * @param spice - Optional spice item to enhance flavor
 * @returns Result with cooked items and effects
 */
export function cookOnCampfire(
    ingredients: Item[],
    recipe: CookingRecipe,
    itemDefinitions: Record<string, ItemDefinition>,
    spice?: Item | null
): CampfireResult {
    // STEP 1: Validate minimum ingredients
    if (ingredients.length < recipe.ingredients.length) {
        return {
            success: false,
            items: [],
            message: {
                en: `Need ${recipe.ingredients.length} ingredients, got ${ingredients.length}`,
                vi: `Cần ${recipe.ingredients.length} nguyên liệu, có ${ingredients.length}`,
            },
            effects: [{ type: 'PLAY_SOUND', value: 'ERROR' }],
        };
    }

    // STEP 2: Match ingredients (unordered)
    const requiredIds = new Set(recipe.ingredients.map((i) => i.id));
    const ingredientIds = new Set(ingredients.map((i) => i.id));

    // Check if all required ingredients are present
    const matches = Array.from(requiredIds).every((id) => ingredientIds.has(id));

    if (!matches) {
        // Not matched: grill items separately
        const grilledItems = ingredients.map((ing) => {
            const grilled = { ...ing };
            grilled.metadata['craftedAt'] = Date.now();
            grilled.metadata['isHot'] = true;
            return grilled;
        });

        return {
            success: false,
            items: grilledItems,
            message: { en: 'Items grilled separately', vi: 'Các món được nướng riêng' },
            effects: [{ type: 'PLAY_SOUND', value: 'GRILL_COMPLETE' }],
        };
    }

    // STEP 3: Matched! Generate merged kebab
    const cookedFood = generateCookedFood({
        recipe,
        ingredients,
        itemDefinitions,
        spice: spice || undefined,
    });

    const resultItem = createItem(cookedFood.id || 'cooked_food', 1);
    resultItem.metadata['craftedAt'] = Date.now();
    resultItem.metadata['isHot'] = true;
    resultItem.metadata['recipeId'] = recipe.id;

    return {
        success: true,
        items: [resultItem],
        message: {
            en: `Perfect kebab!`,
            vi: `Xiên hoàn hảo!`,
        },
        effects: [
            { type: 'PLAY_SOUND', value: 'COOKING_SUCCESS' },
            { type: 'SHOW_PARTICLE', value: 'SMOKE_BURST' },
        ],
    };
}
