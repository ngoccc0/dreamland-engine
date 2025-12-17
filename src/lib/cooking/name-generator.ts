/**
 * Food Name Generator - Creates descriptive names for cooked foods
 *
 * @remarks
 * **Algorithm:**
 * 1. Identify primary ingredient (highest tier)
 * 2. Identify flavor modifiers (spices, herbs, acids)
 * 3. Get cooking method verb
 * 4. Generate adjective from modifiers
 * 5. Combine: [Adjective] [Method] [Primary]
 *
 * **Examples:**
 * - Meat + Salt → "Savory Grilled Meat Skewer"
 * - Mushroom + Oil → "Golden Sautéed Mushroom Skewer"
 * - Herb + Citrus → "Fresh Citrus Herb Medley"
 */

import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { ItemDefinition } from '@/core/types/definitions/item';

interface IngredientInfo {
  id: string;
  name: string;
  tier: number;
}

interface NameGeneratorInput {
  ingredients: IngredientInfo[];
  recipe: CookingRecipe;
  spice?: IngredientInfo | null;
}

interface GeneratedName {
  en: string;
  vi: string;
}

/**
 * Adjective pools for different modifier combinations
 */
const adjectiveMap = {
  salt: { en: ['Savory', 'Seasoned', 'Salty'], vi: ['Mặn', 'Có mùi mặn', 'Vị mặn'] },
  chili: { en: ['Fiery', 'Spicy', 'Flaming', 'Hot'], vi: ['Cay', 'Nồn', 'Lửa', 'Nóng'] },
  honey: { en: ['Sweet', 'Golden', 'Honeyed'], vi: ['Ngọt', 'Vàng', 'Mật'] },
  citrus: { en: ['Citrus', 'Tangy', 'Fresh', 'Zesty'], vi: ['Chanh', 'Chua', 'Tươi', 'Sảng khoái'] },
  herb: { en: ['Herbal', 'Aromatic', 'Medicinal'], vi: ['Thảo mộc', 'Thơm', 'Thuốc'] },
  mushroom: { en: ['Umami', 'Earthy', 'Savory'], vi: ['Umami', 'Đất', 'Mặn'] },
  default: { en: ['Grilled', 'Roasted', 'Cooked'], vi: ['Nướng', 'Quay', 'Nấu'] },
};

/**
 * Cooking method verbs
 */
const methodVerbs = {
  CAMPFIRE: { en: 'Grilled', vi: 'Nướng' },
  POT: { en: 'Simmered', vi: 'Kho' },
  OVEN: { en: 'Roasted', vi: 'Quay' },
};

/**
 * Base food names
 */
const foodNameMap: Record<string, { en: string; vi: string }> = {
  meat_kebab: { en: 'Meat Skewer', vi: 'Xiên Thịt' },
  vegan_kebab: { en: 'Vegetable Skewer', vi: 'Xiên Rau' },
  herb_kebab: { en: 'Herb Medley', vi: 'Hỗn Hợp Thảo Mộc' },
  soup: { en: 'Soup', vi: 'Súp' },
  baked_good: { en: 'Baked Dish', vi: 'Bánh Nướng' },
};

/**
 * Generate descriptive name for cooked food
 */
export function generateFoodName(input: NameGeneratorInput): GeneratedName {
  const { ingredients, recipe, spice } = input;

  // Find primary ingredient (highest tier)
  const primary = ingredients.reduce((a, b) => (a.tier > b.tier ? a : b));

  // Identify modifiers from ingredients
  const modifiers = identifyModifiers(ingredients, spice);

  // Select adjective (prefer spice modifier first)
  const adjective = selectAdjective(modifiers, recipe.cookingType);

  // Get base food name
  const baseName = foodNameMap[recipe.result.baseFood] || foodNameMap.meat_kebab;

  // Get cooking method verb
  const method = methodVerbs[recipe.cookingType];

  // Combine
  const engName = `${adjective.en} ${method.en} ${baseName.en}`;
  const viName = `${baseName.vi} ${method.vi} ${adjective.vi}`;

  return { en: engName, vi: viName };
}

/**
 * Identify modifiers from ingredient list
 */
function identifyModifiers(ingredients: IngredientInfo[], spice?: IngredientInfo | null): string[] {
  const modifiers: string[] = [];

  ingredients.forEach((ing) => {
    const id = ing.id.toLowerCase();
    if (id.includes('chili') || id.includes('pepper')) modifiers.push('chili');
    if (id.includes('honey')) modifiers.push('honey');
    if (id.includes('citrus') || id.includes('lemon') || id.includes('acid')) modifiers.push('citrus');
    if (id.includes('herb') || id.includes('aromatic')) modifiers.push('herb');
    if (id.includes('mushroom') || id.includes('fungi')) modifiers.push('mushroom');
    if (id.includes('salt')) modifiers.push('salt');
  });

  if (spice) {
    const spiceId = spice.id.toLowerCase();
    if (spiceId.includes('chili')) modifiers.push('chili');
    if (spiceId.includes('salt')) modifiers.push('salt');
  }

  return [...new Set(modifiers)]; // Remove duplicates
}

/**
 * Select best adjective based on modifiers
 */
function selectAdjective(
  modifiers: string[],
  cookingType: 'CAMPFIRE' | 'POT' | 'OVEN'
): { en: string; vi: string } {
  // Prefer spice modifiers
  if (modifiers.includes('chili')) {
    return {
      en: adjectiveMap.chili.en[0],
      vi: adjectiveMap.chili.vi[0],
    };
  }

  if (modifiers.includes('honey')) {
    return {
      en: adjectiveMap.honey.en[0],
      vi: adjectiveMap.honey.vi[0],
    };
  }

  if (modifiers.includes('salt')) {
    return {
      en: adjectiveMap.salt.en[0],
      vi: adjectiveMap.salt.vi[0],
    };
  }

  // Prefer ingredient modifiers
  if (modifiers.includes('citrus')) {
    return {
      en: adjectiveMap.citrus.en[2],
      vi: adjectiveMap.citrus.vi[2],
    };
  }

  if (modifiers.includes('herb')) {
    return {
      en: adjectiveMap.herb.en[0],
      vi: adjectiveMap.herb.vi[0],
    };
  }

  if (modifiers.includes('mushroom')) {
    return {
      en: adjectiveMap.mushroom.en[0],
      vi: adjectiveMap.mushroom.vi[0],
    };
  }

  // Default
  return {
    en: adjectiveMap.default.en[0],
    vi: adjectiveMap.default.vi[0],
  };
}
