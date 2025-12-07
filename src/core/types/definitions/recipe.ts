
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
 * The comprehensive schema for a crafting recipe, orchestrating the complete crafting workflow
 * from ingredient validation to result generation. This schema defines how items are created
 * through player interaction with the game world.
 *
 * Complete crafting workflow:
 * 1. **Unlock Check**: Evaluate unlockConditions against player progress and inventory
 * 2. **Tool Verification**: Check if requiredTool is present in player's inventory
 * 3. **Ingredient Matching**: For each ingredient, perform exact match or substitution lookup
 * 4. **Quantity Validation**: Ensure sufficient quantities available (accounting for stacking)
 * 5. **Crafting Execution**: Consume ingredients, apply efficiency calculations
 * 6. **Result Generation**: Create output items with potential bonuses
 * 7. **Inventory Update**: Add crafted items to player's inventory
 *
 * Crafting efficiency calculations:
 * - Base success rate: 80% + (player_crafting_skill * 2%)
 * - Substitution penalty: success_rate *= (1 / substitution_quality)
 * - Tool bonus: success_rate += tool_condition_bonus (0-20%)
 * - Final output: base_quantity * (1 + efficiency_bonus + random_bonus)
 *
 * Interdependencies and data flow:
 * - ingredients[] → references ItemDefinitionSchema for validation
 * - result → produces ItemDefinition instances added to inventory
 * - requiredTool → checked against player's equipped/held items
 * - unlockConditions → evaluated against player progression systems
 * - Integrated with Inventory, Skills, and Effect Engine systems
 */
export const RecipeSchema = z.object({
    result: RecipeResultSchema.describe("The item and quantity produced by this recipe. Defines the primary output of the crafting process."),
    ingredients: z.array(RecipeIngredientSchema).min(1).max(5).describe("A list of 1 to 5 ingredients required to craft this item. Each ingredient supports substitution for flexible crafting."),
    description: TranslatableStringSchema.describe("A brief, multilingual description of what this recipe creates, displayed to the player in crafting interfaces."),
    requiredTool: z.string().optional().describe("The unique ID of the tool item (e.g., 'craftingHammer') that must be in the player's inventory to perform this craft. Tool condition affects success rates."),
    unlockConditions: z.array(RecipeUnlockConditionSchema).optional().describe("An array of conditions that must be met for this recipe to become available to the player (e.g., player level, discovered items). All conditions must be satisfied.")
}).describe("A complete definition for a crafting recipe in the game, encompassing the entire crafting workflow from requirements to results.");
export type Recipe = z.infer<typeof RecipeSchema>;
