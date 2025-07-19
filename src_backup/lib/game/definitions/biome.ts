import { z } from 'zod';
import { MultilingualTextSchema, SpawnConditionsSchema } from './base';
import type { Terrain, BiomeTemplateData } from '../types';

// Defines a template for generating descriptive text.
const DescriptionTemplatesSchema = z.object({
  short: z.array(z.string()),
  medium: z.array(z.string()),
  long: z.array(z.string()),
});

// Defines a template for a single entity spawn (e.g., an item, structure, or enemy).
const EntitySpawnTemplateSchema = z.object({
  name: z.string().describe("The unique ID of the entity to spawn."),
  conditions: SpawnConditionsSchema,
});

// Defines a template for an NPC spawn, including dialogue seeds.
const NpcSpawnTemplateSchema = z.object({
  data: z.object({
    name: MultilingualTextSchema,
    description: MultilingualTextSchema,
    dialogueSeed: MultilingualTextSchema,
    quest: MultilingualTextSchema.optional(),
    questItem: z.object({ name: z.string(), quantity: z.number() }).optional(),
    rewardItems: z.array(z.object({ name: z.string(), quantity: z.number(), tier: z.number(), emoji: z.string() })).optional(),
  }),
  conditions: SpawnConditionsSchema,
});
export type NpcSpawn = z.infer<typeof NpcSpawnTemplateSchema>;


// The main schema for defining a biome. This structure allows mods to create new biomes.
export const BiomeDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the biome, e.g., 'forest', 'modded_lava_caves'."),
  travelCost: z.number().describe("The amount of stamina it costs to enter a tile of this biome."),
  minSize: z.number().int().describe("The minimum number of cells a region of this biome can have."),
  maxSize: z.number().int().describe("The maximum number of cells a region of this biome can have."),
  spreadWeight: z.number().describe("How likely this biome is to be chosen during world generation."),
  allowedNeighbors: z.array(z.custom<Terrain>()).describe("A list of other biome IDs this biome can be adjacent to."),
  defaultValueRanges: z.object({
    vegetationDensity: z.object({ min: z.number(), max: z.number() }),
    moisture: z.object({ min: z.number(), max: z.number() }),
    elevation: z.object({ min: z.number(), max: z.number() }),
    dangerLevel: z.object({ min: z.number(), max: z.number() }),
    magicAffinity: z.object({ min: z.number(), max: z.number() }),
    humanPresence: z.object({ min: z.number(), max: z.number() }),
    predatorPresence: z.object({ min: z.number(), max: z.number() }),
    temperature: z.object({ min: z.number(), max: z.number() }),
  }).describe("The base random values for generating chunk attributes."),
  soilType: z.array(z.string()).describe("An array of possible soil types for this biome."),
  templates: z.custom<BiomeTemplateData>().optional().describe("The templates used to procedurally generate the content of a chunk within this biome."),
});

export type BiomeDefinition = z.infer<typeof BiomeDefinitionSchema>;
