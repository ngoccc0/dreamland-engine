import { z } from 'genkit';

/**
 * @fileoverview Defines the schema for crafting recipes.
 */

export const RecipeIngredientSchema = z.object({
  name: z.string().describe("The name of the required ingredient item."),
  quantity: z.number().int().min(1).describe("The required quantity of this ingredient."),
});

export const RecipeResultSchema = z.object({
    name: z.string().describe("The name of the crafted item."),
    quantity: z.number().int().min(1).describe("The quantity of the item produced."),
    emoji: z.string().describe("A single emoji representing the crafted item."),
});

export const RecipeSchema = z.object({
    result: RecipeResultSchema,
    ingredients: z.array(RecipeIngredientSchema).min(1).max(5).describe("A list of 1 to 5 ingredients required for the recipe."),
    description: z.string().describe("A brief, flavorful description of what this recipe creates."),
    requiredTool: z.string().optional().describe("The name of a tool that must be in the player's inventory to perform this craft (e.g., 'Đá Mài'). The tool is not consumed.")
});
