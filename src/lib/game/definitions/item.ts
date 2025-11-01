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
  id: z.string().optional().describe("Unique identifier for the item, e.g., 'healingHerb'. If not provided, the key from the record will be used. This ID is used for internal lookup and referencing."),
  name: TranslatableStringSchema.describe("The name of the item, either a translation key or a multilingual object. This is what the player sees in-game."),
  description: TranslatableStringSchema.describe("The item's description, either a translation key or a multilingual object. Provides lore and functional details to the player."),
  tier: z.number().describe("The rarity or power level of the item. Higher tiers generally mean more valuable or potent items, affecting drop rates and crafting difficulty."),
  category: ItemCategorySchema.describe("The primary category of the item, influencing inventory sorting, crafting recipes, and general game logic."),
  subCategory: z.string().optional().describe("A more specific category like 'Meat', 'Fruit', 'Potion'. Used for finer-grained filtering and game mechanics."),
  emoji: z.string().describe("A single emoji, SVG filename, or image name representing the item. Used for visual representation in UI."),
  effects: z.array(ItemEffectSchema).describe("An array of effects the item provides when used. These effects directly impact player attributes, status, or the game world."),
  baseQuantity: z.object({ min: z.number(), max: z.number() }).describe("The base quantity range (min and max) of this item that typically spawns or is found. This is scaled by world and chunk multipliers."),
  /**
   * Optional growth conditions for natural items (e.g., plants).
   * This field is used to determine where and how an item can naturally grow or be cultivated.
   * The shape of `growthConditions` can vary across different recipes and mod data,
   * so it accepts an open record to remain compatible and avoid frequent schema churn.
   */
  growthConditions: z.record(z.any()).optional(),
  equipmentSlot: z.enum(['weapon', 'armor', 'accessory']).optional().describe("If the item is equippable, this specifies which equipment slot it occupies (e.g., 'weapon', 'armor', 'accessory')."),
  attributes: PlayerAttributesSchema.optional().describe("The combat or character attributes this item provides when equipped. These are added to the player's base stats."),
  relationship: ItemRelationshipSchema.optional().describe("Defines how this item relates to others, primarily for crafting substitutions. Allows for flexible recipe requirements."),
  weight: z.number().optional().describe("The weight of a single item unit. Affects player inventory capacity and movement speed."),
  stackable: z.number().int().optional().describe("The maximum number of this item that can be held in one inventory slot. Items with `stackable: 1` are unique per slot."),
  senseEffect: z.object({
    visual: TranslatableStringSchema.optional().describe("How the item looks, affecting player perception and descriptions."),
    auditory: TranslatableStringSchema.optional().describe("How the item sounds when interacted with or present, contributing to environmental immersion."),
    tactile: TranslatableStringSchema.optional().describe("How the item feels to the touch, adding to sensory detail."),
    olfactory: TranslatableStringSchema.optional().describe("How the item smells, if applicable, for richer descriptions."),
    taste: TranslatableStringSchema.optional().describe("How the item tastes, if applicable, for consumable items."),
    keywords: z.array(z.string()).optional().describe("Keywords for sensory descriptions, used by AI for generating richer narratives."),
  }).optional().describe("Descriptions of the item's sensory effects (sight, sound, touch, smell, taste, etc.). These are used to generate immersive descriptions and AI narratives."),
  naturalSpawn: z.array(z.object({
      biome: z.string().describe("The biome where this item can naturally spawn. Ideally, this should be of type Terrain, but string allows for modded biomes."),
      chance: z.number().describe("The probability (0-1) of this item spawning in the specified biome."),
      conditions: SpawnConditionsSchema.optional().describe("Additional conditions that must be met for the item to spawn in this biome."),
  })).optional().describe("Defines the conditions under which this item can naturally appear in the world, based on biome and chance."),
  droppedBy: z.array(z.object({
      creature: z.string().describe("The ID of the creature that can drop this item."),
      chance: z.number().describe("The probability (0-1) of this item being dropped by the specified creature."),
  })).optional().describe("Specifies which creatures can drop this item and with what probability, linking items to the enemy ecosystem."),
  function: z.string().optional().describe("A brief description of the item's primary purpose or function in the game. This is a high-level summary for quick understanding."),
  spawnBiomes: z.array(z.enum(allTerrains)).optional().describe("An array of one or more biomes where this item can naturally be found. This is a simplified way to define general spawn locations."),
  spawnEnabled: z.boolean().optional().default(true).describe("Whether this item can spawn naturally in the world. Defaults to `true`. Set to `false` for crafted-only items, quest items, or items that should not appear randomly."),
});
export type ItemDefinition = z.infer<typeof ItemDefinitionSchema>;
