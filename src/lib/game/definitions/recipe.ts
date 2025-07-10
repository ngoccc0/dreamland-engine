import {z} from 'genkit';
import { ItemRelationshipSchema } from './item';

// Defines an ingredient for a recipe, including its quantity and possible substitutes.
export const RecipeIngredientSchema = z.object({
  itemId: z.string().describe("The unique ID of the ingredient item."),
  quantity: z.number().int().min(1).describe("The required quantity of this ingredient."),
  relationship: ItemRelationshipSchema.optional().describe("How this item relates to others for crafting substitutions."),
});
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

// Defines the result of a crafting recipe.
export const RecipeResultSchema = z.object({
    itemId: z.string().describe("The unique ID of the crafted item."),
    quantity: z.number().int().min(1).describe("The quantity of the item produced."),
});

// The main schema for a crafting recipe.
export const RecipeSchema = z.object({
    id: z.string().describe("Unique identifier for the recipe, e.g., 'torch' or 'mod_naturePlus_steelAlloySword'"),
    result: RecipeResultSchema,
    ingredients: z.array(RecipeIngredientSchema).min(1).max(5).describe("A list of 1 to 5 ingredients required for the recipe."),
    description: z.object({ en: z.string(), vi: z.string() }).describe("A brief, multilingual description of what this recipe creates."),
    requiredTool: z.string().optional().describe("The ID of the tool item required to be in the player's inventory to perform this craft."),
});
export type Recipe = z.infer<typeof RecipeSchema>;
