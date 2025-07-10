
import { z } from 'zod';
import { MultilingualTextSchema, LootDropSchema } from './base';

export const EnemyDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the enemy, e.g., 'wolf', 'goblin_shaman'."),
  name: MultilingualTextSchema,
  description: MultilingualTextSchema,
  emoji: z.string(),
  hp: z.number(),
  damage: z.number(),
  behavior: z.enum(['aggressive', 'passive', 'defensive', 'territorial', 'immobile', 'ambush']),
  size: z.enum(['small', 'medium', 'large']),
  diet: z.array(z.string()).describe("A list of item IDs this enemy eats, influencing its behavior and potential for taming."),
  satiation: z.number().describe("The creature's starting hunger level."),
  maxSatiation: z.number().describe("The satiation level at which the creature is considered full."),
  loot: z.array(LootDropSchema).optional().describe("A list of items this enemy can drop upon defeat."),
  harvestable: z.object({
      difficulty: z.number(),
      requiredTool: z.string(),
      loot: z.array(LootDropSchema),
  }).optional().describe("Defines if this is a harvestable resource (like a tree) instead of a mobile enemy."),
  senseEffect: z.object({
      keywords: z.array(z.string()),
  }).optional().describe("Keywords for sensory descriptions during gameplay."),
});

export type EnemyDefinition = z.infer<typeof EnemyDefinitionSchema>;
