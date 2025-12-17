/**
 * Cooking Recipe Type Definitions
 *
 * Defines the schema for recipes used in the 3-tier cooking system:
 * - CAMPFIRE: Skewer-based combo matching
 * - POT: Batch merging with yield calculation
 * - OVEN: Parallel processing with temperature control
 */

import { z } from 'zod';
import { TranslatableStringSchema } from './base';

/**
 * Spice Modifier - Applied to food stats when spice item is used
 *
 * @remarks
 * **Types:**
 * - `MULTIPLY_HUNGER`: Multiplies base hunger by (1 + value)
 * - `MULTIPLY_ALL_STATS`: Multiplies all food stats by (1 + value)
 * - `ADD_BUFF`: Adds a temporary buff to player
 *
 * **Example:**
 * ```
 * refined_salt: { type: 'MULTIPLY_HUNGER', value: 0.15 }
 * Result: hunger_stat * 1.15 = +15%
 * ```
 */
export const SpiceModifierSchema = z.object({
  type: z.enum(['MULTIPLY_HUNGER', 'MULTIPLY_ALL_STATS', 'ADD_BUFF']).describe(
    'Type of spice effect: multiply hunger, all stats, or add buff'
  ),
  value: z.number().min(0).describe('Multiplier value (0.15 = +15%) or buff magnitude'),
  buffId: z.string().optional().describe('Buff ID to apply (e.g., "warmth", "regeneration")'),
  duration: z.number().optional().describe('Buff duration in seconds'),
});

export type SpiceModifier = z.infer<typeof SpiceModifierSchema>;

/**
 * Cooking Recipe - Describes how to cook items
 *
 * @remarks
 * **Key Concept:**
 * - Ingredients are **unordered** (any arrangement = match)
 * - Pattern array is for **visual reference** on UI (e.g., skewer display order)
 * - Recipe matching uses ingredient IDs only, not order
 *
 * **Workflow:**
 * 1. Player adds ingredients to cooking UI
 * 2. System checks: all required ingredient IDs present?
 * 3. If YES: Generate merged food with combined stats
 * 4. If NO: Return individual grilled items (no combo bonus)
 *
 * **Output Calculation:**
 * ```
 * base_hunger = sum(ingredient_hunger)
 * final_hunger = base_hunger * recipe.multiplier.hunger
 * if (spice) final_hunger *= (1 + spice.value)
 * final_hunger = round(final_hunger)
 * ```
 */
export const CookingRecipeSchema = z.object({
  id: z.string().describe('Unique recipe ID (e.g., "buttered_meat_skewer_recipe")'),

  name: TranslatableStringSchema.describe('Recipe display name (EN + VI)'),

  description: TranslatableStringSchema.describe(
    'Recipe flavor text/lore description'
  ),

  // Ingredients (required, unordered)
  ingredients: z
    .array(
      z.object({
        id: z.string().describe('Item ID (must exist in item catalog)'),
        quantity: z.number().int().positive().describe('Required quantity (always integer)'),
        optional: z.boolean().default(false).describe('Is ingredient optional?'),
      })
    )
    .min(1)
    .max(9)
    .describe('1-9 required ingredients (unordered, any arrangement works)'),

  // Campfire: visual pattern (for UI skewer display)
  pattern: z
    .array(z.string())
    .length(3)
    .optional()
    .describe(
      'For Campfire UI: visual order to display items on skewer (e.g., [meat, fat, branch])'
    ),

  // Cooking type
  cookingType: z
    .enum(['CAMPFIRE', 'POT', 'OVEN'])
    .describe('Cooking method: CAMPFIRE (skewer), POT (batch), OVEN (parallel)'),

  cookingTime: z
    .number()
    .int()
    .min(10)
    .max(300)
    .describe('Cooking duration in seconds'),

  // Output
  result: z.object({
    baseFood: z
      .enum(['meat_kebab', 'vegan_kebab', 'herb_kebab', 'soup', 'baked_good'])
      .describe('Category of output food'),
    emoji: z.string().describe('Emoji for result item'),
    description: TranslatableStringSchema.describe('Result food description'),
  }),

  // Stat multipliers (applied to summed ingredient stats)
  statMultipliers: z
    .object({
      hunger: z.number().default(1.0).describe('Hunger stat multiplier'),
      stamina: z.number().default(1.0).describe('Stamina stat multiplier'),
      health: z.number().default(1.0).describe('Health stat multiplier'),
    })
    .default({})
    .describe('Multipliers applied to ingredient stats'),

  // Tier (for rarity/difficulty)
  tier: z.number().int().min(1).max(3).optional().describe('Recipe difficulty tier'),

  // Notes
  notes: z
    .string()
    .optional()
    .describe('Internal notes about recipe (e.g., "Uses combo pattern")'),
});

export type CookingRecipe = z.infer<typeof CookingRecipeSchema>;

/**
 * Validate a cooking recipe schema
 */
export function validateCookingRecipe(recipe: unknown): recipe is CookingRecipe {
  return CookingRecipeSchema.safeParse(recipe).success;
}
