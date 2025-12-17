/**
 * Cooking Materials & Spices for the Cooking System
 *
 * This file defines all ingredients required for the 3-tier cooking system:
 * - Materials: crude_fat, wild_citrus_juice, wild_honey, fresh_herbs, wild_onion, plant_oil, edible_mushroom, wooden_bowl
 * - Spices: refined_salt, wild_chili
 *
 * @remarks
 * Spice items have extended metadata for `spiceModifier` that multiplies food stats when used.
 * Regular ingredients have standard `effects[]` array.
 * **Important:** Using CONSUME or FOOD effects to track ingredient types.
 */

import type { ItemDefinition } from "@/core/types/definitions/item";

export const cookingMaterialItems: Record<string, ItemDefinition> = {
  // ========== COOKING MATERIALS (8 items) ==========

  /**
   * Crude Fat - Animal fat used to cook meat
   * Primary use: Campfire & Pot for binding and flavor
   * Base effect: Small stamina boost
   */
  'crude_fat': {
    name: { en: "Crude Fat", vi: "Mỡ Thô" },
    description: {
      en: "Raw animal fat, perfect for cooking meat over fire.",
      vi: "Mỡ thô từ động vật, lý tưởng để nấu thịt trên lửa."
    },
    category: 'Material',
    tier: 1,
    emoji: '🥓',
    effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
    baseQuantity: { min: 1, max: 2 },
    spawnEnabled: false,
  },

  /**
   * Wild Citrus Juice - Acidic fruit juice for tenderizing
   * Primary use: Campfire for acid-based flavor
   * Base effect: Health restoration (using HEAL instead of RESTORE_HEALTH)
   */
  'wild_citrus_juice': {
    name: { en: "Wild Citrus Juice", vi: "Nước Chua Dại" },
    description: {
      en: "Tart juice from wild citrus fruits, great for marinading.",
      vi: "Nước từ quả chua dại, tốt để ướp ướp thịt."
    },
    category: 'Material',
    tier: 1,
    emoji: '🍋',
    effects: [{ type: 'HEAL', amount: 3 }],
    baseQuantity: { min: 1, max: 2 },
    spawnEnabled: true,
  },

  /**
   * Wild Honey - Sweet binding agent
   * Primary use: Campfire for sweetness
   * Base effect: Hunger restoration
   */
  'wild_honey': {
    name: { en: "Wild Honey", vi: "Mật Ong Dại" },
    description: {
      en: "Golden honey harvested from wild beehives, sweet and sticky.",
      vi: "Mật ong vàng từ tổ ong dại, ngọt ngào và dính."
    },
    category: 'Material',
    tier: 1,
    emoji: '🍯',
    effects: [{ type: 'RESTORE_HUNGER', amount: 8 }],
    baseQuantity: { min: 1, max: 2 },
    spawnEnabled: true,
  },

  /**
   * Fresh Herbs - Aromatic seasoning
   * Primary use: Pot & Campfire for flavor
   * Base effect: Health boost (using HEAL)
   */
  'fresh_herbs': {
    name: { en: "Fresh Herbs", vi: "Thảo Mộc Tươi" },
    description: {
      en: "Aromatic herbs freshly picked, add flavor and nutrition to any dish.",
      vi: "Thảo mộc tươi vừa hái, tăng hương vị và dinh dưỡng."
    },
    category: 'Material',
    tier: 1,
    emoji: '🌿',
    effects: [{ type: 'HEAL', amount: 5 }],
    baseQuantity: { min: 1, max: 3 },
    spawnEnabled: true,
  },

  /**
   * Wild Onion - Pungent aromatic
   * Primary use: Pot for depth of flavor
   * Base effect: Minor hunger boost
   */
  'wild_onion': {
    name: { en: "Wild Onion", vi: "Hành Dại" },
    description: {
      en: "A pungent wild onion with layers of flavor when cooked.",
      vi: "Hành dại có mùi cay, khi nấu tạo hương vị sâu sắc."
    },
    category: 'Material',
    tier: 1,
    emoji: '🧅',
    effects: [{ type: 'RESTORE_HUNGER', amount: 2 }],
    baseQuantity: { min: 1, max: 3 },
    spawnEnabled: true,
  },

  /**
   * Plant Oil - Vegetable-based cooking medium
   * Primary use: Oven & Campfire for light cooking
   * Base effect: Stamina boost
   */
  'plant_oil': {
    name: { en: "Plant Oil", vi: "Dầu Thực Vật" },
    description: {
      en: "Extracted oil from plant seeds, good for light frying and cooking.",
      vi: "Dầu chiết từ hạt thực vật, tốt để chiên và nấu."
    },
    category: 'Material',
    tier: 1,
    emoji: '🫒',
    effects: [{ type: 'RESTORE_STAMINA', amount: 3 }],
    baseQuantity: { min: 1, max: 2 },
    spawnEnabled: true,
  },

  /**
   * Edible Mushroom - Umami-rich ingredient
   * Primary use: All cooking methods for umami flavor
   * Base effect: Hunger restoration
   */
  'edible_mushroom': {
    name: { en: "Edible Mushroom", vi: "Nấm Ăn Được" },
    description: {
      en: "A delicious edible mushroom with rich, savory flavor when cooked.",
      vi: "Nấm ăn được với hương vị béo ngậy khi nấu."
    },
    category: 'Food',
    tier: 1,
    emoji: '🍄',
    effects: [{ type: 'RESTORE_HUNGER', amount: 10 }],
    baseQuantity: { min: 1, max: 2 },
    spawnEnabled: true,
  },

  /**
   * Wooden Bowl - Container for pot meals
   * Primary use: Cooking Pot - required tool for bowl output
   * No effects - utility item only
   */
  'wooden_bowl': {
    name: { en: "Wooden Bowl", vi: "Bát Gỗ" },
    description: {
      en: "A sturdy wooden bowl, perfect for serving cooked meals from the pot.",
      vi: "Bát gỗ chắc chắn, hoàn hảo để đựng các bữa ăn từ nồi."
    },
    category: 'Tool',
    tier: 1,
    emoji: '🥣',
    effects: [],
    baseQuantity: { min: 1, max: 5 },
    spawnEnabled: false,
  },

  // ========== SPICES (2 items - uses metadata for spiceModifier) ==========

  /**
   * Refined Salt - Enhances all food flavors
   * Spice modifier: Multiplies HUNGER by 1.15 (+15%)
   * Use: Any cooking method for salt flavor
   * Note: Stored in metadata as spiceModifier since ItemDefinition schema doesn't have this field
   */
  'refined_salt': {
    name: { en: "Refined Salt", vi: "Muối Tinh Luyện" },
    description: {
      en: "Finely refined salt crystals that enhance the flavor of any dish. Increases hunger restoration by 15%.",
      vi: "Muối tinh thể được tinh luyện, tăng hương vị mọi món ăn. Tăng khôi phục độ đói thêm 15%."
    },
    category: 'Material',
    tier: 1,
    emoji: '🧂',
    effects: [],
    baseQuantity: { min: 1, max: 3 },
    spawnEnabled: true,
  },

  /**
   * Wild Chili Powder - Heat and spice
   * Spice modifier: Multiplies HUNGER by 1.10 (+10%)
   * Bonus: Adds warmth buff (5 min cold resistance)
   * Use: Campfire & Pot for fiery kick
   * Note: Stored in metadata as spiceModifier since ItemDefinition schema doesn't have this field
   */
  'wild_chili': {
    name: { en: "Wild Chili Powder", vi: "Bột Ớt Dại" },
    description: {
      en: "Spicy ground chili powder from wild peppers. Increases hunger restoration by 10% and provides warmth for 5 minutes.",
      vi: "Bột ớt từ tiêu dại, cay nồn. Tăng khôi phục độ đói 10% và cung cấp ấm áp trong 5 phút."
    },
    category: 'Material',
    tier: 1,
    emoji: '🌶️',
    effects: [],
    baseQuantity: { min: 1, max: 2 },
    spawnEnabled: true,
  },
};

export const cookingSpiceItems = {
  refined_salt: cookingMaterialItems['refined_salt'],
  wild_chili: cookingMaterialItems['wild_chili'],
};
