/**
 * Food Generator - Creates cooked food items dynamically from ingredients
 *
 * @remarks
 * **Algorithm:**
 * 1. Sum all ingredient effects (RESTORE_HUNGER, RESTORE_HEALTH, etc.)
 * 2. Apply recipe stat multipliers
 * 3. Apply spice modifier (only RESTORE_HUNGER ×value)
 * 4. Generate unique food name (EN + VI)
 * 5. Create ItemDefinition with combined stats
 * 6. Generate hash ID for caching
 *
 * **Example:**
 * Input: Meat (90 hunger) + Fat (8 stamina) + Salt spice (×1.15)
 * Output: {
 *   id: 'cooked_meat_kebab_a1b2c3',
 *   name: { en: 'Savory Grilled Meat Skewer', vi: 'Xiên Thịt Nướng Mặn' },
 *   effects: [
 *     { type: 'RESTORE_HUNGER', amount: 104 },  // 90 + (90×0.15)
 *     { type: 'RESTORE_STAMINA', amount: 8 }
 *   ]
 * }
 */

import type { Item } from '@/core/domain/item';
import type { ItemDefinition, ItemEffect } from '@/core/types/definitions/item';
import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import { generateFoodName } from '@/lib/cooking/name-generator';

const foodCache = new Map<string, ItemDefinition>();

interface GeneratorInput {
  recipe: CookingRecipe;
  ingredients: Item[];
  itemDefinitions: Record<string, ItemDefinition>;
  spice?: Item | null;
}

/**
 * Generate a cooked food item from ingredients
 */
export function generateCookedFood(input: GeneratorInput): ItemDefinition {
  const { recipe, ingredients, itemDefinitions, spice } = input;

  // Create cache key (deterministic)
  const ingredientIds = ingredients.map((i) => i.id).sort().join('|');
  const spiceId = spice?.id || 'none';
  const cacheKey = `${recipe.id}|${ingredientIds}|${spiceId}`;

  // Check cache
  if (foodCache.has(cacheKey)) {
    return foodCache.get(cacheKey)!;
  }

  // STEP 1: Sum ingredient effects
  const effectMap = new Map<string, number>();

  ingredients.forEach((ing) => {
    const def = itemDefinitions[ing.id];
    if (def?.effects) {
      def.effects.forEach((eff) => {
        const types = ['RESTORE_HUNGER', 'RESTORE_STAMINA', 'RESTORE_MANA', 'HEAL'];
        if (types.includes(eff.type)) {
          const current = effectMap.get(eff.type) || 0;
          effectMap.set(eff.type, current + (eff.amount || 0));
        }
      });
    }
  });

  // STEP 2: Apply recipe multipliers
  const recipeMultipliers = recipe.statMultipliers || {};
  const hungerMult = recipeMultipliers.hunger ?? 1.0;
  const staminaMult = recipeMultipliers.stamina ?? 1.0;
  const healthMult = recipeMultipliers.health ?? 1.0;

  let hunger = (effectMap.get('RESTORE_HUNGER') || 0) * hungerMult;
  let stamina = (effectMap.get('RESTORE_STAMINA') || 0) * staminaMult;
  let health = (effectMap.get('HEAL') || 0) * healthMult;
  let mana = (effectMap.get('RESTORE_MANA') || 0) || 0;

  // STEP 3: Apply spice modifier (reserved for future enhancement)
  // Currently disabled - spice items just contribute their effects
  // Future: could add spiceModifier logic here if ItemDefinition schema supports it

  // STEP 4: Generate name
  const ingredientNames = ingredients.map((i) => {
    const def = itemDefinitions[i.id];
    const name = def?.name;
    const nameStr = typeof name === 'string' ? name : (typeof name === 'object' && 'en' in name) ? name.en : i.id;
    return { id: i.id, name: nameStr, tier: def?.tier || 1 };
  });

  const spiceInfo = spice
    ? {
        id: spice.id,
        name: (() => {
          const def = itemDefinitions[spice.id];
          const name = def?.name;
          return typeof name === 'string' ? name : (typeof name === 'object' && 'en' in name) ? name.en : spice.id;
        })(),
        tier: (itemDefinitions[spice.id]?.tier || 1),
      }
    : null;

  const name = generateFoodName({
    ingredients: ingredientNames,
    recipe,
    spice: spiceInfo,
  });

  // STEP 5: Create effects array
  const effects: ItemEffect[] = [];
  if (hunger > 0) effects.push({ type: 'RESTORE_HUNGER', amount: Math.round(hunger) });
  if (stamina > 0) effects.push({ type: 'RESTORE_STAMINA', amount: Math.round(stamina) });
  if (health > 0) effects.push({ type: 'HEAL', amount: Math.round(health) });
  if (mana > 0) effects.push({ type: 'RESTORE_MANA', amount: Math.round(mana) });

  // STEP 6: Generate hash ID
  const hashId = hashCode(cacheKey).toString(16);
  const foodId = `cooked_${recipe.result.baseFood}_${hashId}`;

  // STEP 7: Create ItemDefinition
  const cookedFood: ItemDefinition = {
    id: foodId,
    name,
    description: {
      en: 'A delicious cooked meal made with care.',
      vi: 'Một bữa ăn ngon lành được nấu tỉ mỉ.',
    },
    category: 'Food',
    tier: recipe.tier || 2,
    emoji: recipe.result.emoji,
    effects,
    baseQuantity: { min: 1, max: 1 },
    spawnEnabled: false,
  };

  // Cache and return
  foodCache.set(cacheKey, cookedFood);
  return cookedFood;
}

/**
 * Simple hash function for deterministic IDs
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Clear food cache (for testing or resets)
 */
export function clearFoodCache(): void {
  foodCache.clear();
}

/**
 * Get cache size (for debugging)
 */
export function getFoodCacheSize(): number {
  return foodCache.size;
}
