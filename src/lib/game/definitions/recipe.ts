
import {z} from 'zod';
import { ItemRelationshipSchema } from './item';
import { TranslatableStringSchema } from './base';
import { RecipeUnlockConditionSchema } from './unlock-condition';

/**
 * Defines an ingredient required for a crafting recipe, including its quantity
 * and optional relationships for substitution. This schema enables flexible crafting
 * requirements where similar items can be used interchangeably.
 *
 * Ingredient matching logic:
 * 1. Primary match: Check if player has exact item ID (name field)
 * 2. Substitution check: If no exact match, look for items with relationship.substituteFor = name
 * 3. Quality calculation: If substitute found, apply quality multiplier to crafting efficiency
 * 4. Quantity verification: Required quantity must be available (considering stacking)
 *
 * Interdependencies:
 * - References ItemDefinitionSchema for item validation
 * - Uses ItemRelationshipSchema for substitution logic
 * - Affects crafting success rates and output quality
 * - Integrated with Inventory system for quantity checking
 */
export const RecipeIngredientSchema = z.object({
  name: z.string().describe("The unique name (key) of the ingredient item required (e.g., 'woodLog'). This serves as the primary lookup key for exact item matching."),
  quantity: z.number().int().min(1).describe("The required quantity of this ingredient for the recipe. Must be consumed from player's inventory during crafting."),
  relationship: ItemRelationshipSchema.optional().describe("Defines how this item relates to others for crafting substitutions, allowing for flexible ingredient requirements. Enables modding by supporting alternative ingredients."),
}).describe("A single ingredient entry for a crafting recipe with substitution support.");
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

/**
 * Defines the result of a crafting recipe, specifying the item produced and its quantity.
 * The result generation considers crafting efficiency, tool quality, and player skills.
 *
 * Result calculation logic:
 * 1. Base quantity: Always produces at least the specified quantity
 * 2. Efficiency bonus: Substitution quality and tool condition can increase output
 * 3. Skill multiplier: Player crafting skill affects success rate and quality
 * 4. Random variation: Small random bonus (0-20%) based on crafting proficiency
 *
 * Interdependencies:
 * - References ItemDefinitionSchema for result item validation
 * - Output quantity affected by ingredient substitution quality
 * - Emoji used for UI display in crafting interface
 * - Result added to player's inventory upon successful crafting
 */
export const RecipeResultSchema = z.object({
    name: z.string().describe("The unique name (key) of the item definition that is crafted (e.g., 'woodenAxe'). Must match an existing item ID in the item registry."),
    quantity: z.number().int().min(1).describe("The base quantity of the item produced by successfully crafting this recipe. Actual output may vary based on crafting efficiency."),
    emoji: z.string().describe("An emoji to visually represent the crafted item in the user interface. Should match the emoji defined in the corresponding ItemDefinition.")
}).describe("The output specification for a crafting recipe, determining what item and how many are produced.");

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
