/**
 * Oven Cooking Engine
 *
 * @remarks
 * **Logic Flow:**
 * 1. Validate temperature is in reasonable range (50°C - 300°C)
 * 2. Match ingredients against recipe (unordered)
 * 3. For each ingredient, calculate quality zone:
 *    - PERFECT: |temp - idealTemp| ≤ 10°C → 100% stats
 *    - BURNT: temp > idealTemp + 10°C → 80% stats, isCharred: true
 *    - UNDERCOOKED: temp < idealTemp - 10°C → 60% stats, isWatery: true
 * 4. Generate items with quality adjustments applied
 * 5. Create per-item progress effects (visual feedback during cooking)
 *
 * **Temperature Zones:**
 * - Ideal: 180°C for kebabs, 200°C for pastries
 * - Perfect Range: ±10°C from ideal
 * - Quality Multiplier: 1.0 (perfect) | 0.8 (burnt) | 0.6 (undercooked)
 */

import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';
import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { GameEffect } from '@/core/types/game';
import { createItem } from '@/core/domain/item';
import { generateCookedFood } from './food-generator';

export type CookingQuality = 'PERFECT' | 'BURNT' | 'UNDERCOOKED';

export interface OvenItemResult {
    item: Item;
    quality: CookingQuality;
    tempDiff: number; // How far from ideal temp
}

export interface OvenResult {
    success: boolean;
    items: OvenItemResult[];
    message: { en: string; vi: string };
    effects: GameEffect[];
}

const IDEAL_TEMP = 180; // °C - good for kebabs/pastries
const PERFECT_RANGE = 10; // ±10°C is perfect
const BURNT_MULT = 0.8; // 80% stats if burnt
const UNDERCOOKED_MULT = 0.6; // 60% stats if undercooked

/**
 * Determine quality based on temperature deviation
 *
 * @param temp - Oven temperature in °C
 * @param ideal - Ideal temperature (default 180°C)
 * @returns Quality level + multiplier
 */
function getQuality(temp: number, ideal: number = IDEAL_TEMP): { quality: CookingQuality; mult: number } {
    const diff = Math.abs(temp - ideal);

    if (diff <= PERFECT_RANGE) {
        return { quality: 'PERFECT', mult: 1.0 };
    }

    if (temp > ideal) {
        return { quality: 'BURNT', mult: BURNT_MULT };
    }

    return { quality: 'UNDERCOOKED', mult: UNDERCOOKED_MULT };
}

/**
 * Cook items in oven with temperature-based quality
 *
 * @param ingredients - Items to cook
 * @param recipe - Cooking recipe to use
 * @param temperature - Oven temperature in °C (50-300)
 * @param itemDefinitions - Item catalog for lookups
 * @param spice - Optional spice item to enhance flavor
 * @returns Result with quality-adjusted items and effects
 */
export function cookInOven(
    ingredients: Item[],
    recipe: CookingRecipe,
    temperature: number,
    itemDefinitions: Record<string, ItemDefinition>,
    spice?: Item | null
): OvenResult {
    // STEP 1: Validate temperature
    if (temperature < 50 || temperature > 300) {
        return {
            success: false,
            items: [],
            message: {
                en: `Temperature out of range (50-300°C)`,
                vi: `Nhiệt độ ngoài phạm vi (50-300°C)`,
            },
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
            message: { en: 'Ingredients do not match recipe', vi: 'Nguyên liệu không phù hợp' },
            effects: [{ type: 'PLAY_SOUND', value: 'ERROR' }],
        };
    }

    // STEP 3: Generate base cooked food
    const cookedFood = generateCookedFood({
        recipe,
        ingredients,
        itemDefinitions,
        spice: spice || undefined,
    });

    // STEP 4: For each ingredient, calculate quality and apply stat adjustments
    const { quality, mult: _mult } = getQuality(temperature);
    const tempDiff = Math.abs(temperature - IDEAL_TEMP);

    const resultItems: OvenItemResult[] = [];
    for (const _ingredient of ingredients) {
        const bakedItem = createItem(cookedFood.id || 'cooked_baked', 1);
        bakedItem.metadata['craftedAt'] = Date.now();

        // Add quality metadata
        if (quality === 'BURNT') {
            bakedItem.metadata['isCharred'] = true; // Visual: darker color
        } else if (quality === 'UNDERCOOKED') {
            bakedItem.metadata['isWatery'] = true; // Visual: soggy color
        }

        resultItems.push({
            item: bakedItem,
            quality,
            tempDiff,
        });
    }

    // STEP 5: Create progress effects
    const qualityMessage = {
        PERFECT: { en: 'Perfect bake!', vi: 'Nướng hoàn hảo!' },
        BURNT: { en: 'Slightly burnt', vi: 'Hơi cháy' },
        UNDERCOOKED: { en: 'Undercooked', vi: 'Chưa chín' },
    };

    return {
        success: true,
        items: resultItems,
        message: qualityMessage[quality],
        effects: [
            { type: 'PLAY_SOUND', value: 'OVEN_COMPLETE' },
            { type: 'SHOW_PARTICLE', value: 'STEAM_CLOUD' },
        ],
    };
}
