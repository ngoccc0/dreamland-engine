
import { z } from 'zod';
import { MultilingualTextSchema, LootDropSchema } from './base';

// The main schema for defining a creature/entity in the world.
// This can be an animal, a monster, a plant, a rock formation, etc.
export const CreatureDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the creature, e.g., 'wolf', 'iron_ore_vein', 'oak_tree'."),
  name: MultilingualTextSchema,
  description: MultilingualTextSchema,
  emoji: z.string(),

  // --- Core Stats ---
  hp: z.number().describe("Health points. For non-combat entities like trees, this represents harvesting durability."),
  damage: z.number().describe("Base damage dealt. 0 for non-aggressive entities."),

  // --- Behavior ---
  behavior: z.enum(['aggressive', 'passive', 'defensive', 'territorial', 'immobile', 'ambush'])
    .describe("How the creature behaves. 'immobile' is used for static resources like trees or mineral veins."),
  size: z.enum(['small', 'medium', 'large']),
  diet: z.array(z.string()).optional().describe("A list of item IDs this creature eats, influencing its behavior and potential for taming."),
  satiation: z.number().optional().describe("The creature's starting hunger level."),
  maxSatiation: z.number().optional().describe("The satiation level at which the creature is considered full."),

  // --- Interaction & Drops ---
  loot: z.array(LootDropSchema).optional().describe("A list of items this creature drops upon being defeated/destroyed."),
  harvestable: z.object({
      difficulty: z.number().describe("A general difficulty score for harvesting."),
      requiredTool: z.string().describe("The ID of the tool item required to harvest."),
      loot: z.array(LootDropSchema),
  }).optional().describe("Defines if this is a harvestable resource. If present, this creature is a resource node."),
  
  // --- Sensory Details ---
  senseEffect: z.object({
      keywords: z.array(z.string()),
  }).optional().describe("Keywords for sensory descriptions during gameplay."),
});

export type CreatureDefinition = z.infer<typeof CreatureDefinitionSchema>;
