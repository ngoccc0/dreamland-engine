/**
 * Cooking Pot Engine
 *
 * @remarks
 * **Logic Flow:**
 * 1. Validate water item present + ingredients present
 * 2. Match ingredients against recipe (unordered)
 * 3. Calculate bowl yield: ceil(ingredientCount / 2)
 * 4. Generate one merged soup item (combines all ingredients into 1 item per bowl)
 * 5. Mark items as soup (color effect, waterlogged metadata)
 * 6. Create dispense effects (staggered by 0.5s per bowl)
 *
 * **Bowl Yield Formula:** ceil(count / 2) - e.g., 3 items → 2 bowls, 4 items → 2 bowls
 */

import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';
import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { GameEffect } from '@/core/types/game';
import { createItem } from '@/core/domain/item';
import { generateCookedFood } from './food-generator';

export interface PotResult {
    success: boolean;
    items: Item[];
    bowlCount: number;
    message: { en: string; vi: string };
    effects: GameEffect[];
}

/**
 * Cook items in pot with batch yield
 *
 * @param ingredients - Items to cook
 * @param recipe - Cooking recipe to use
 * @param itemDefinitions - Item catalog for lookups
 * @param waterItem - Water item (must be present for pot cooking)
 * @param spice - Optional spice item to enhance flavor
 * @returns Result with soup items and effects
 */
export function cookInPot(
    ingredients: Item[],
    recipe: CookingRecipe,
    itemDefinitions: Record<string, ItemDefinition>,
    waterItem: Item | null,
    spice?: Item | null
): PotResult {
    // STEP 1: Validate water + ingredients
    if (!waterItem) {
        return {
            success: false,
            items: [],
            bowlCount: 0,
            message: { en: 'Need water to cook in pot', vi: 'Cần nước để nấu lẩu' },
            effects: [{ type: 'PLAY_SOUND', value: 'ERROR' }],
        };
    }

    if (ingredients.length === 0) {
        return {
            success: false,
            items: [],
            bowlCount: 0,
            message: { en: 'Need ingredients to cook', vi: 'Cần nguyên liệu để nấu' },
            effects: [{ type: 'PLAY_SOUND', value: 'ERROR' }],
        };
    }

    // STEP 2: Match ingredients (unordered)
    const requiredIds = new Set(recipe.ingredients.map((i) => i.id));
    const ingredientIds = new Set(ingredients.map((i) => i.id));
    const matches = Array.from(requiredIds).every((id) => ingredientIds.has(id));

    if (!matches) {
        return {
            success: false,
            items: [],
            bowlCount: 0,
            message: { en: 'Ingredients do not match recipe', vi: 'Nguyên liệu không phù hợp' },
            effects: [{ type: 'PLAY_SOUND', value: 'ERROR' }],
        };
    }

    // STEP 3: Calculate bowl yield: ceil(count / 2)
    const bowlCount = Math.ceil(ingredients.length / 2);

    // STEP 4: Generate merged soup (one per bowl)
    const cookedFood = generateCookedFood({
        recipe,
        ingredients,
        itemDefinitions,
        spice: spice || undefined,
    });

    const resultItems: Item[] = [];
    for (let i = 0; i < bowlCount; i++) {
        const bowl = createItem(cookedFood.id || 'cooked_soup', 1);
        bowl.metadata['craftedAt'] = Date.now();
        bowl.metadata['isSoup'] = true; // Metadata: marks as soup (affects color rendering)
        resultItems.push(bowl);
    }

    // STEP 5: Create staggered dispense effects (0.5s per bowl)
    const dispenseFx: GameEffect[] = [];
    for (let i = 0; i < bowlCount; i++) {
        dispenseFx.push({
            type: 'PLAY_SOUND',
            value: 'LADLE_DISPENSE',
            delay: i * 500, // Stagger by 0.5s
        });
        dispenseFx.push({
            type: 'SHOW_PARTICLE',
            value: 'STEAM_BURST',
            delay: i * 500,
        });
    }

    return {
        success: true,
        items: resultItems,
        bowlCount,
        message: {
            en: `Made ${bowlCount} bowl${bowlCount > 1 ? 's' : ''} of soup`,
            vi: `Làm được ${bowlCount} bát súp`,
        },
        effects: [
            { type: 'PLAY_SOUND', value: 'COOKING_SUCCESS' },
            { type: 'SHOW_PARTICLE', value: 'BOILING_BUBBLES' },
            ...dispenseFx,
        ],
    };
}
