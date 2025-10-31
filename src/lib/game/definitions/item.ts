/**
 * This file defines the Zod schemas for all item-related types.
 * It acts as the single source of truth for the structure of items,
 * their effects, and their relationships, ensuring type safety and consistency
 * across the game engine and AI flows.
 */
import {z} from 'genkit';
import { PlayerAttributesSchema, SpawnConditionsSchema, TranslatableStringSchema } from './base';
import { allTerrains } from '../types';

/**
 * Defines all possible categories for an item. This helps with organization and game logic.
 */
export const ItemCategorySchema = z.enum([
    'Weapon', 'Armor', 'Accessory', 'Tool',
    'Material', 'Energy Source',
    'Food', 'Consumable', 'Potion',
    'Data', 'Utility',
    'Magic', 'Fusion', 'Misc',
    // Legacy categories to support existing data before it's fully migrated.
    'Equipment', 'Support' 
]).describe("The primary category of the item.");
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

/**
 * Defines the effect an item can have when used.
 */
// Effect schema is now extensible: allows extra fields for custom effects
export const ItemEffectSchema = z.object({
    type: z.string().describe("The type of effect the item has. Can be a built-in or custom effect type."),
    amount: z.number().optional().describe("The numerical value of the effect (e.g., amount of health restored)."),
    duration: z.number().optional().describe("Duration of the effect in game turns, if applicable."),
}).passthrough();
export type ItemEffect = z.infer<typeof ItemEffectSchema>;


/**
 * Defines the relationship of an item to others, for crafting substitution.
 */
export const ItemRelationshipSchema = z.object({
  substituteFor: z.string().optional().describe("The 'base' item ID this item can substitute for (e.g., 'smallHide' can substitute for 'animalHide')."),
  quality: z.number().min(1).optional().describe("The quality of the substitution. Lower is better (e.g., 1 is a perfect substitute, 2 is a decent one)."),
});
export type ItemRelationship = z.infer<typeof ItemRelationshipSchema>;

/**
 * The full definition of an item, containing all its properties.
 */
export const ItemDefinitionSchema = z.object({
  id: z.string().optional().describe("Unique identifier for the item, e.g., 'healingHerb'. If not provided, the key from the record will be used."),
  name: TranslatableStringSchema.describe("The name of the item, either a translation key or a multilingual object."),
  description: TranslatableStringSchema.describe("The item's description, either a translation key or a multilingual object."),
  tier: z.number(),
  category: ItemCategorySchema,
  subCategory: z.string().optional().describe("A more specific category like 'Meat', 'Fruit', 'Potion'."),
  emoji: z.string().describe("A single emoji, SVG filename, or image name representing the item."),
  effects: z.array(ItemEffectSchema).describe("An array of effects the item provides when used. Can be extended with custom fields."),
  baseQuantity: z.object({ min: z.number(), max: z.number() }),
  // Optional growth conditions for natural items (e.g. plants). Some data
  // files include growthConditions; accept them to remain compatible.
  // growthConditions shape varies across recipes and mod data. Accept an
  // open record to remain compatible and avoid frequent schema churn.
  growthConditions: z.record(z.any()).optional(),
  equipmentSlot: z.enum(['weapon', 'armor', 'accessory']).optional().describe("If the item is equippable, which slot it goes into."),
  attributes: PlayerAttributesSchema.optional().describe("The combat attributes this item provides when equipped."),
  relationship: ItemRelationshipSchema.optional().describe("How this item relates to others for crafting substitutions."),
  weight: z.number().optional().describe("The weight of a single item unit."),
  stackable: z.number().int().optional().describe("The maximum number of this item that can be held in one inventory slot."),
  senseEffect: z.object({
    visual: TranslatableStringSchema.optional().describe("How the item looks."),
    auditory: TranslatableStringSchema.optional().describe("How the item sounds when interacted with."),
    tactile: TranslatableStringSchema.optional().describe("How the item feels to the touch."),
    olfactory: TranslatableStringSchema.optional().describe("How the item smells."),
    taste: TranslatableStringSchema.optional().describe("How the item tastes, if applicable."),
    keywords: z.array(z.string()).optional().describe("Keywords for sensory descriptions."),
  }).optional().describe("Descriptions of the item's sensory effects (sight, sound, touch, smell, taste, etc.)."),
  naturalSpawn: z.array(z.object({
      biome: z.string(), // Ideally, this should be of type Terrain, but string allows for modded biomes
      chance: z.number(),
      conditions: SpawnConditionsSchema.optional(),
  })).optional(),
  droppedBy: z.array(z.object({
      creature: z.string(),
      chance: z.number(),
  })).optional(),
  function: z.string().optional().describe("A brief description of the item's primary purpose or function in the game."),
  spawnBiomes: z.array(z.enum(allTerrains)).optional().describe("An array of one or more biomes where this item can naturally be found."),
  spawnEnabled: z.boolean().optional().default(true).describe("Whether this item can spawn naturally in the world. Defaults to true. Set to false for crafted-only items or quest items."),
});
export type ItemDefinition = z.infer<typeof ItemDefinitionSchema>;
