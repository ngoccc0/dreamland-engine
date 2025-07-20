import {z} from 'zod';

export const RecipeUnlockConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("playerLevel"), level: z.number().int().min(1).max(100).describe("The required player level.") }),
  z.object({ type: z.literal("questCompletion"), questId: z.string().describe("The ID of the quest that must be completed.") }),
  z.object({ type: z.literal("actionRepetition"), action: z.string().describe("The action to repeat."), count: z.number().int().min(1).describe("The number of times the action must be repeated.") }),
  z.object({ type: z.literal("itemPossession"), itemId: z.string().describe("The ID of the item that must be in the player's inventory.") }),
  z.object({ type: z.literal("locationDiscovery"), locationId: z.string().describe("The ID of the location that must be discovered.") }),
  z.object({ type: z.literal("enemyDefeat"), enemyType: z.string().describe("The type of enemy that must be defeated."), count: z.number().int().min(1).describe("The number of enemies that must be defeated.") }),
  z.object({ type: z.literal("playerStatThreshold"), stat: z.enum(["hp", "mana", "stamina", "strength", "intelligence", "dexterity", "luck"]).describe("The stat to check."), threshold: z.number().describe("The required stat value.") }),
  z.object({ type: z.literal("purchaseFromVendor"), vendorId: z.string().describe("The ID of the vendor that the recipe must be purchased from.") }),
  z.object({ type: z.literal("puzzleSolving"), puzzleId: z.string().describe("The ID of the puzzle that must be solved.") }),
  z.object({ type: z.literal("timeCycle"), time: z.enum(["day", "night"]).describe("The required time of day.") }),
  z.object({ type: z.literal("itemDisintegration"), itemId: z.string().describe("The ID of the item that must be disintegrated.") }),
  z.object({ type: z.literal("professionTier"), profession: z.string().describe("The profession to check."), tier: z.number().int().min(1).describe("The required profession tier.") }),
]);
export type RecipeUnlockCondition = z.infer<typeof RecipeUnlockConditionSchema>;
