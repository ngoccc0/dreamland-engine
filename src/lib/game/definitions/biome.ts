
import { z } from 'zod';
import { MultilingualTextSchema, SpawnConditionsSchema, LootDropSchema } from './base';
import type { Terrain } from '../types';

// Defines a template for generating descriptive text.
const DescriptionTemplatesSchema = z.object({
  short: z.array(z.string()),
  medium: z.array(z.string()),
  long: z.array(z.string()),
});

// Defines a template for a single entity spawn (e.g., an item or structure).
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
  }),
  conditions: SpawnConditionsSchema,
});

// Defines a template for an enemy spawn, including its stats and loot.
const EnemySpawnTemplateSchema = z.object({
  data: z.object({
    type: z.string().describe("The unique ID/type of the enemy."),
    emoji: z.string(),
    hp: z.number(),
    damage: z.number(),
    behavior: z.enum(['aggressive', 'passive', 'defensive', 'territorial', 'immobile', 'ambush']),
    size: z.enum(['small', 'medium', 'large']),
    diet: z.array(z.string()),
    satiation: z.number(),
    maxSatiation: z.number(),
    loot: z.array(LootDropSchema).optional(),
  }),
  conditions: SpawnConditionsSchema,
});

// Defines a structure spawn, which might include loot.
const StructureSpawnTemplateSchema = EntitySpawnTemplateSchema.extend({
  loot: z.array(LootDropSchema).optional(),
});


// The main schema for defining a biome. This structure allows mods to create new biomes.
export const BiomeDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the biome, e.g., 'forest', 'modded_lava_caves'."),
  travelCost: z.number().describe("The amount of stamina it costs to enter a tile of this biome."),
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
  templates: z.object({
    descriptionTemplates: DescriptionTemplatesSchema,
    adjectives: z.array(z.string()),
    features: z.array(z.string()),
    smells: z.array(z.string()),
    sounds: z.array(z.string()),
    sky: z.array(z.string()).optional(),
    NPCs: z.array(NpcSpawnTemplateSchema),
    items: z.array(EntitySpawnTemplateSchema),
    structures: z.array(StructureSpawnTemplateSchema),
    enemies: z.array(EnemySpawnTemplateSchema),
  }).describe("The templates used to procedurally generate the content of a chunk within this biome."),
});

export type BiomeDefinition = z.infer<typeof BiomeDefinitionSchema>;
