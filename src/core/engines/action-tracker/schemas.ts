/**
 * Action Tracker Schemas - Player action history and metrics
 *
 * @remarks
 * **Purpose:** Define schema for tracking all player actions independently of game logic.
 * Enables features like quests, achievements, statistics to subscribe to action events.
 *
 * **Design:**
 * - Discriminated union for type-safe action handling
 * - Immutable records (events are never modified)
 * - Context-rich payloads (location, target, result data)
 * - Timestamp-based ordering (no duplicates due to unique timestamps)
 */

import { z } from 'zod';

/**
 * Base action event - shared properties
 */
export const BaseActionSchema = z.object({
    id: z.string().describe('Unique action identifier'),
    timestamp: z.number().describe('Unix timestamp in milliseconds'),
    turnCount: z.number().describe('Game turn when action occurred'),
    playerPosition: z.object({
        x: z.number().describe('Player chunk X coordinate'),
        y: z.number().describe('Player chunk Y coordinate'),
    }),
});

/**
 * Combat action - player attacks a creature
 */
export const CombatActionSchema = BaseActionSchema.extend({
    type: z.literal('COMBAT'),
    targetCreatureId: z.string().describe('ID of creature attacked'),
    targetCreatureType: z.string().describe('Type of creature (e.g., "goblin", "spider")'),
    damageDealt: z.number().min(0).describe('Damage dealt to target'),
    equippedWeapon: z.string().optional().describe('Weapon used (name)'),
});

/**
 * Harvesting action - player gathers item from chunk
 */
export const HarvestingActionSchema = BaseActionSchema.extend({
    type: z.literal('HARVESTING'),
    itemId: z.string().describe('Item definition ID'),
    itemName: z.string().describe('Human-readable item name'),
    quantity: z.number().min(1).describe('Number of items gathered'),
    source: z.enum(['CREATURE', 'FLORA', 'MINERAL']).describe('What the item came from'),
    harvestTool: z.string().optional().describe('Tool used to harvest'),
});

/**
 * Crafting action - player combines items
 */
export const CraftingActionSchema = BaseActionSchema.extend({
    type: z.literal('CRAFTING'),
    recipeId: z.string().describe('Recipe identifier'),
    recipeName: z.string().describe('Human-readable recipe name'),
    inputs: z.array(
        z.object({
            itemId: z.string(),
            itemName: z.string(),
            quantity: z.number().min(1),
        })
    ),
    output: z.object({
        itemId: z.string(),
        itemName: z.string(),
        quantity: z.number().min(1),
    }),
});

/**
 * Item usage action - player consumes or equips item
 */
export const ItemUsageActionSchema = BaseActionSchema.extend({
    type: z.literal('ITEM_USAGE'),
    itemId: z.string().describe('Item definition ID'),
    itemName: z.string().describe('Human-readable item name'),
    usageType: z.enum(['CONSUME', 'EQUIP', 'UNEQUIP']).describe('How item was used'),
    effectResult: z.string().optional().describe('Outcome of usage'),
});

/**
 * Skill usage action - player casts spell or uses ability
 */
export const SkillUsageActionSchema = BaseActionSchema.extend({
    type: z.literal('SKILL_USAGE'),
    skillId: z.string().describe('Skill/ability identifier'),
    skillName: z.string().describe('Human-readable skill name'),
    targetCreatureId: z.string().optional().describe('Target creature if applicable'),
    manaCost: z.number().min(0).optional(),
    cooldownSeconds: z.number().min(0).optional(),
});

/**
 * Movement action - player moves between chunks
 */
export const MovementActionSchema = BaseActionSchema.extend({
    type: z.literal('MOVEMENT'),
    destinationPosition: z.object({
        x: z.number(),
        y: z.number(),
    }),
    distance: z.number().min(1).describe('Number of chunks traveled'),
    biomeType: z.string().optional().describe('Biome entered'),
});

/**
 * Exploration action - player discovers new location/features
 */
export const ExplorationActionSchema = BaseActionSchema.extend({
    type: z.literal('EXPLORATION'),
    locationType: z.enum(['LANDMARK', 'STRUCTURE', 'NPC', 'BIOME']),
    locationName: z.string().describe('Name of discovered location'),
    previouslyDiscovered: z.boolean().default(false),
});

/**
 * Farming action - player tends crops
 */
export const FarmingActionSchema = BaseActionSchema.extend({
    type: z.literal('FARMING'),
    actionType: z.enum(['TILL', 'PLANT', 'WATER', 'FERTILIZE', 'HARVEST']),
    cropType: z.string().optional().describe('Crop name (if applicable)'),
    resultingGrowthStage: z.number().optional(),
});

/**
 * Discriminated union of all action types
 */
export const PlayerActionSchema = z.discriminatedUnion('type', [
    CombatActionSchema,
    HarvestingActionSchema,
    CraftingActionSchema,
    ItemUsageActionSchema,
    SkillUsageActionSchema,
    MovementActionSchema,
    ExplorationActionSchema,
    FarmingActionSchema,
]);

export type CombatAction = z.infer<typeof CombatActionSchema>;
export type HarvestingAction = z.infer<typeof HarvestingActionSchema>;
export type CraftingAction = z.infer<typeof CraftingActionSchema>;
export type ItemUsageAction = z.infer<typeof ItemUsageActionSchema>;
export type SkillUsageAction = z.infer<typeof SkillUsageActionSchema>;
export type MovementAction = z.infer<typeof MovementActionSchema>;
export type ExplorationAction = z.infer<typeof ExplorationActionSchema>;
export type FarmingAction = z.infer<typeof FarmingActionSchema>;
export type PlayerAction = z.infer<typeof PlayerActionSchema>;

/**
 * Action history - maintains chronological order of all player actions
 */
export const ActionHistorySchema = z.object({
    actions: z.array(PlayerActionSchema).describe('All recorded actions in chronological order'),
    lastActionId: z.string().describe('ID of most recent action'),
    totalActionCount: z.number().min(0),
});

export type ActionHistory = z.infer<typeof ActionHistorySchema>;

/**
 * Create empty action history
 */
export function createEmptyActionHistory(): ActionHistory {
    return {
        actions: [],
        lastActionId: '',
        totalActionCount: 0,
    };
}

/**
 * Estimate storage size of action history (for optimization)
 *
 * @remarks
 * Rough estimate: ~200-300 bytes per action record
 * Helps determine when to archive old actions
 */
export function estimateActionHistorySize(history: ActionHistory): number {
    return history.actions.length * 250;
}
