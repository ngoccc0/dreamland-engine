import {z} from 'genkit';
import { PlayerAttributesSchema, SpawnConditionsSchema, ItemCategorySchema as BaseItemCategorySchema, TranslatableStringSchema } from './base';
import { allTerrains } from '../types';

// Extend the base schema to include categories that were being used but not defined.
export const ItemCategorySchema = BaseItemCategorySchema.extend({
    enum: [
        ...BaseItemCategorySchema.options,
        'Equipment',
        'Support',
    ]
});
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

// The effect an item can have when used.
export const ItemEffectSchema = z.object({
    type: z.enum([
        'HEAL', 'RESTORE_STAMINA', 'RESTORE_MANA', 'REDUCE_HEAT', 'MANA_REGEN_BOOST', 
        'PROVIDE_LIGHT', 'CURE_POISON', 'POISON_RESISTANCE', 'REST_BOOST', 
        'COLD_RESISTANCE', 'HEAT_RESISTANCE', 'STEALTH_BOOST', 'INVENTORY_SLOTS', 
        'TEMPERATURE_STABILITY_BOOST', 'FOOD_PRESERVATION_BOOST', 'EXPLORATION_ASSIST',
        'HUNGER_REDUCE', 'STAMINA_RECOVER', 'WEATHER_PROTECTION',
    ]).describe("The type of effect the item has."),
    amount: z.number().describe("The numerical value of the effect (e.g., amount of health restored)."),
    duration: z.number().optional().describe("Duration of the effect in game turns, if applicable."),
});
export type ItemEffect = z.infer<typeof ItemEffectSchema>;


// The relationship of an item to others, for crafting substitution.
export const ItemRelationshipSchema = z.object({
  substituteFor: z.string().optional().describe("The 'base' item ID this item can substitute for (e.g., 'smallHide' can substitute for 'animalHide')."),
  quality: z.number().min(1).optional().describe("The quality of the substitution. Lower is better (e.g., 1 is a perfect substitute, 2 is a decent one)."),
});
export type ItemRelationship = z.infer<typeof ItemRelationshipSchema>;

// The full definition of an item, containing all its properties.
export const ItemDefinitionSchema = z.object({
  id: z.string().optional().describe("Unique identifier for the item, e.g., 'healingHerb'. If not provided, the key from the record will be used."),
  name: TranslatableStringSchema.describe("The name of the item, either a translation key or a multilingual object."),
  description: TranslatableStringSchema.describe("The item's description, either a translation key or a multilingual object."),
  tier: z.number(),
  category: ItemCategorySchema,
  subCategory: z.string().optional().describe("A more specific category like 'Meat', 'Fruit', 'Potion'."),
  emoji: z.string().describe("A single emoji that represents the item."),
  effects: z.array(ItemEffectSchema).describe("An array of effects the item provides when used."),
  baseQuantity: z.object({ min: z.number(), max: z.number() }),
  growthConditions: z.object({
    optimal: SpawnConditionsSchema,
    subOptimal: SpawnConditionsSchema,
  }).optional().describe("For living resources like plants or fungi, define the conditions under which they grow."),
  equipmentSlot: z.enum(['weapon', 'armor', 'accessory']).optional().describe("If the item is equippable, which slot it goes into."),
  attributes: PlayerAttributesSchema.optional().describe("The combat attributes this item provides when equipped."),
  relationship: ItemRelationshipSchema.optional().describe("How this item relates to others for crafting substitutions."),
  weight: z.number().optional().describe("The weight of a single item unit."),
  stackable: z.number().int().optional().describe("The maximum number of this item that can be held in one inventory slot."),
  senseEffect: z.object({ keywords: z.array(z.string()) }).optional().describe("Keywords for sensory descriptions."),
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
  spawnEnabled: z.boolean().optional().default(true).describe("Whether this item can spawn naturally in the world. Defaults to true. Set to false for crafted-only items."),
});
export type ItemDefinition = z.infer<typeof ItemDefinitionSchema>;
