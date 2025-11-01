
import {z} from 'zod';
import { ItemRelationshipSchema } from './item';
import { TranslatableStringSchema } from './base';
import { RecipeUnlockConditionSchema } from './unlock-condition';

/**
 * Defines an ingredient required for a crafting recipe, including its quantity
 * and optional relationships for substitution.
 */
export const RecipeIngredientSchema = z.object({
  name: z.string().describe("The unique name (key) of the ingredient item required (e.g., 'woodLog')."),
  quantity: z.number().int().min(1).describe("The required quantity of this ingredient for the recipe."),
  relationship: ItemRelationshipSchema.optional().describe("Defines how this item relates to others for crafting substitutions, allowing for flexible ingredient requirements."),
}).describe("A single ingredient entry for a crafting recipe.");
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

/**
 * Defines the result of a crafting recipe, specifying the item produced and its quantity.
 */
export const RecipeResultSchema = z.object({
    name: z.string().describe("The unique name (key) of the item definition that is crafted (e.g., 'woodenAxe')."),
    quantity: z.number().int().min(1).describe("The quantity of the item produced by successfully crafting this recipe."),
    emoji: z.string().describe("An emoji to visually represent the crafted item in the user interface.")
}).describe("The output item and quantity of a crafting recipe.");

/**
 * The main schema for a crafting recipe, detailing its ingredients, result,
 * required tools, and conditions for unlocking.
 */
export const RecipeSchema = z.object({
    result: RecipeResultSchema.describe("The item and quantity produced by this recipe."),
    ingredients: z.array(RecipeIngredientSchema).min(1).max(5).describe("A list of 1 to 5 ingredients required to craft this item."),
    description: TranslatableStringSchema.describe("A brief, multilingual description of what this recipe creates, displayed to the player."),
    requiredTool: z.string().optional().describe("The unique ID of the tool item (e.g., 'craftingHammer') that must be in the player's inventory to perform this craft."),
    unlockConditions: z.array(RecipeUnlockConditionSchema).optional().describe("An array of conditions that must be met for this recipe to become available to the player (e.g., player level, discovered items).")
}).describe("A complete definition for a crafting recipe in the game.");
export type Recipe = z.infer<typeof RecipeSchema>;
