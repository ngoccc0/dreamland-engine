import {z} from 'zod';

/**
 * Defines a discriminated union for various conditions that must be met to unlock a recipe.
 * This allows for flexible and diverse unlock criteria based on player progress, world state, or specific actions.
 */
export const RecipeUnlockConditionSchema = z.discriminatedUnion("type", [
  z.object({ 
    type: z.literal("playerLevel").describe("Unlocks when the player reaches a certain level."), 
    level: z.number().int().min(1).max(100).describe("The required player level (1-100).") 
  }).describe("Condition: Player reaches a specific level."),
  z.object({ 
    type: z.literal("questCompletion").describe("Unlocks upon completion of a specific quest."), 
    questId: z.string().describe("The ID of the quest that must be completed.") 
  }).describe("Condition: Specific quest completion."),
  z.object({ 
    type: z.literal("actionRepetition").describe("Unlocks after repeating a specific action a certain number of times."), 
    action: z.string().describe("The action to repeat (e.g., 'mineOre', 'chopWood')."), 
    count: z.number().int().min(1).describe("The number of times the action must be repeated.") 
  }).describe("Condition: Repeated action count."),
  z.object({ 
    type: z.literal("itemPossession").describe("Unlocks when the player possesses a specific item."), 
    itemId: z.string().describe("The ID of the item that must be in the player's inventory.") 
  }).describe("Condition: Player possesses a specific item."),
  z.object({ 
    type: z.literal("locationDiscovery").describe("Unlocks upon discovering a specific location."), 
    locationId: z.string().describe("The ID of the location that must be discovered.") 
  }).describe("Condition: Specific location discovery."),
  z.object({ 
    type: z.literal("enemyDefeat").describe("Unlocks after defeating a certain number of a specific enemy type."), 
    enemyType: z.string().describe("The type/ID of enemy that must be defeated."), 
    count: z.number().int().min(1).describe("The number of enemies that must be defeated.") 
  }).describe("Condition: Defeating a specific enemy type multiple times."),
  z.object({ 
    type: z.literal("playerStatThreshold").describe("Unlocks when a player's stat reaches a certain threshold."), 
    stat: z.enum(["hp", "mana", "stamina", "strength", "intelligence", "dexterity", "luck"]).describe("The player stat to check."), 
    threshold: z.number().describe("The required stat value.") 
  }).describe("Condition: Player stat reaches a threshold."),
  z.object({ 
    type: z.literal("purchaseFromVendor").describe("Unlocks after purchasing the recipe from a specific vendor."), 
    vendorId: z.string().describe("The ID of the vendor that the recipe must be purchased from.") 
  }).describe("Condition: Recipe purchased from a vendor."),
  z.object({ 
    type: z.literal("puzzleSolving").describe("Unlocks after solving a specific puzzle."), 
    puzzleId: z.string().describe("The ID of the puzzle that must be solved.") 
  }).describe("Condition: Specific puzzle solved."),
  z.object({ 
    type: z.literal("timeCycle").describe("Unlocks during a specific time of day."), 
    time: z.enum(["day", "night"]).describe("The required time of day ('day' or 'night').") 
  }).describe("Condition: Specific time of day."),
  z.object({ 
    type: z.literal("itemDisintegration").describe("Unlocks after disintegrating a specific item."), 
    itemId: z.string().describe("The ID of the item that must be disintegrated.") 
  }).describe("Condition: Specific item disintegration."),
  z.object({ 
    type: z.literal("professionTier").describe("Unlocks when a player's profession reaches a certain tier."), 
    profession: z.string().describe("The profession to check (e.g., 'crafting', 'alchemy')."), 
    tier: z.number().int().min(1).describe("The required profession tier.") 
  }).describe("Condition: Player profession reaches a tier."),
]).describe("A discriminated union representing various conditions for unlocking recipes.");
export type RecipeUnlockCondition = z.infer<typeof RecipeUnlockConditionSchema>;
