import { z } from 'zod';
import { MultilingualTextSchema, SpawnConditionsSchema, EmojiSchema } from './base';
import type { Terrain, BiomeTemplateData } from '../types';

/**
 * Defines a template for generating descriptive text for a biome or location.
 * This schema is exported so that consumers (e.g., mods) can import and extend it if needed.
 */
export const DescriptionTemplatesSchema = z.object({
  short: z.array(z.string()).describe("An array of short descriptive text templates."),
  medium: z.array(z.string()).describe("An array of medium-length descriptive text templates."),
  long: z.array(z.string()).describe("An array of long descriptive text templates."),
}).describe("Templates for generating various lengths of descriptive text.");

/**
 * Defines a template for a single entity spawn (e.g., an item, structure, or enemy).
 * This specifies the entity's ID and the conditions under which it can spawn.
 */
export const EntitySpawnTemplateSchema = z.object({
  name: z.string().describe("The unique ID of the entity definition to spawn (e.g., 'healingHerb', 'goblin')."),
  conditions: SpawnConditionsSchema.describe("The conditions that must be met for this entity to spawn."),
}).describe("A template for spawning a generic entity with specific conditions.");

/**
 * Defines a template for an NPC spawn, including their core data and dialogue seeds.
 * This allows for dynamic NPC generation with predefined characteristics.
 */
export const NpcSpawnTemplateSchema = z.object({
  data: z.object({
    name: MultilingualTextSchema.describe("The multilingual name of the NPC."),
    description: MultilingualTextSchema.describe("The multilingual description of the NPC."),
    dialogueSeed: MultilingualTextSchema.describe("A multilingual seed or key for generating the NPC's dialogue."),
    quest: MultilingualTextSchema.optional().describe("A multilingual description or key for a quest associated with this NPC."),
    questItem: z.object({ 
      name: z.string().describe("The ID of the quest item."), 
      quantity: z.number().describe("The quantity of the quest item.") 
    }).optional().describe("An optional item required for a quest given by this NPC."),
    rewardItems: z.array(z.object({ 
      name: z.string().describe("The ID of the reward item."), 
      quantity: z.number().describe("The quantity of the reward item."), 
      tier: z.number().describe("The tier of the reward item."), 
      emoji: z.string().describe("The emoji representing the reward item.") 
    })).optional().describe("An array of items rewarded by this NPC upon quest completion."),
  }).describe("The core data defining the NPC's characteristics and quest information."),
  conditions: SpawnConditionsSchema.describe("The conditions that must be met for this NPC to spawn."),
}).describe("A template for spawning an NPC with associated data and spawn conditions.");
export type NpcSpawn = z.infer<typeof NpcSpawnTemplateSchema>;


/**
 * The main schema for defining a biome. This structure allows for the creation of new biomes
 * by both the core game and community mods, ensuring extensibility and consistency.
 */
export const BiomeDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the biome, e.g., 'forest', 'modded_lava_caves'. This ID is used for internal lookup and referencing."),
  travelCost: z.number().describe("The amount of stamina or movement points it costs to enter a tile of this biome. Higher values mean more difficult terrain."),
  minSize: z.number().int().describe("The minimum number of cells a contiguous region of this biome can have during world generation."),
  maxSize: z.number().int().describe("The maximum number of cells a contiguous region of this biome can have during world generation."),
  spreadWeight: z.number().describe("A weighting factor indicating how likely this biome is to be chosen during procedural world generation. Higher values mean it's more common."),
  allowedNeighbors: z.array(z.custom<Terrain>()).describe("A list of other biome IDs (Terrain types) that this biome can be adjacent to. This helps create realistic world layouts."),
  defaultValueRanges: z.object({
    vegetationDensity: z.object({ min: z.number(), max: z.number() }).describe("The default random range for vegetation density (0-100) in chunks within this biome."),
    moisture: z.object({ min: z.number(), max: z.number() }).describe("The default random range for moisture level (0-100) in chunks within this biome."),
    elevation: z.object({ min: z.number(), max: z.number() }).describe("The default random range for elevation in chunks within this biome."),
    dangerLevel: z.object({ min: z.number(), max: z.number() }).describe("The default random range for danger level (0-100) in chunks within this biome."),
    magicAffinity: z.object({ min: z.number(), max: z.number() }).describe("The default random range for magic affinity (0-100) in chunks within this biome."),
    humanPresence: z.object({ min: z.number(), max: z.number() }).describe("The default random range for human presence (0-100) in chunks within this biome."),
    predatorPresence: z.object({ min: z.number(), max: z.number() }).describe("The default random range for predator presence (0-100) in chunks within this biome."),
    temperature: z.object({ min: z.number(), max: z.number() }).describe("The default random range for temperature in chunks within this biome."),
  }).describe("Defines the base random value ranges for various chunk attributes when generating chunks within this biome."),
  soilType: z.array(z.string()).describe("An array of possible soil types that can be found in this biome (e.g., ['fertile', 'sandy', 'rocky'])."),
  emoji: EmojiSchema.optional().describe("A single emoji, SVG filename, or image object representing the biome. Used for visual representation in UI."),
  templates: z.custom<BiomeTemplateData>().optional().describe("The templates used to procedurally generate the specific content (items, NPCs, structures) of a chunk within this biome."),
});

export type BiomeDefinition = z.infer<typeof BiomeDefinitionSchema>;
