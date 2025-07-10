import { z } from 'genkit';

/**
 * @fileoverview Defines the schema for crafting recipes.
 */

export const RecipeIngredientSchema = z.object({
  name: z.string().describe("The name of the ingredient item."),
  quantity: z.number().int().min(1).describe("The required quantity of this ingredient."),
  alternatives: z.array(z.object({
    name: z.string(),
    tier: z.number().int().min(1).max(3).describe("The effectiveness tier of the alternative (1=best, 3=worst).")
  })).optional().describe("An optional list of substitute ingredients and their effectiveness tier."),
});

export const RecipeResultSchema = z.object({
    name: z.string().describe("The name of the crafted item."),
    quantity: z.number().int().min(1).describe("The quantity of the item produced."),
    emoji: z.string().describe("A single emoji representing the crafted item."),
});

export const RecipeSchema = z.object({
    result: RecipeResultSchema,
    ingredients: z.array(RecipeIngredientSchema).min(2).max(4).describe("A list of 2 to 4 ingredients required for the recipe."),
    description: z.string().describe("A brief, flavorful description of what this recipe creates."),
});
