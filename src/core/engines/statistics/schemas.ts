/**
 * Player Statistics Schema - Context-Aware Metrics
 *
 * @remarks
 * **Sparse Data Principle:** Only non-zero values are stored.
 * If player hasn't gathered wood in desert biome, that key doesn't exist.
 * This prevents object bloat and keeps save files lean.
 *
 * **Structure:**
 * - `combat`: Creature kills with context (location, weapon type)
 * - `gathering`: Item collection with context (biome, tool used)
 * - `crafting`: Items crafted with recipe tracking
 * - `exploration`: Distance traveled, biomes discovered
 *
 * All nested fields are optional (`.optional()`) to support sparse storage.
 */

import { z } from 'zod';

/**
 * Combat statistics
 * Tracks creature kills with multiple dimensions
 */
export const CombatStatsSchema = z.object({
  kills: z
    .object({
      total: z.number().int().min(1).describe('Total creatures killed'),
      byCreatureType: z
        .record(z.string(), z.number().int().min(1))
        .optional()
        .describe('Kills grouped by creature type (slime, goblin, etc)'),
      byLocation: z
        .record(z.string(), z.number().int().min(1))
        .optional()
        .describe('Kills grouped by biome'),
      byWeapon: z
        .record(z.string(), z.number().int().min(1))
        .optional()
        .describe('Kills grouped by equipped weapon'),
    })
    .optional()
    .describe('Kill tracking'),
  damageDealt: z
    .object({
      total: z.number().int().min(0).describe('Total damage dealt to creatures'),
      bySource: z
        .record(z.string(), z.number().int().min(1))
        .optional()
        .describe('Damage by weapon/spell type'),
    })
    .optional()
    .describe('Damage output'),
  healthLost: z
    .object({
      total: z.number().int().min(0).describe('Total HP lost to creatures'),
    })
    .optional()
    .describe('Damage taken'),
});

export type CombatStats = z.infer<typeof CombatStatsSchema>;

/**
 * Gathering statistics
 * Tracks item collection with context (biome, tool)
 */
export const GatheringStatsSchema = z.object({
  itemsCollected: z
    .record(
      z.string(),
      z
        .object({
          total: z.number().int().min(1).describe('Total items collected'),
          byBiome: z
            .record(z.string(), z.number().int().min(1))
            .optional()
            .describe('By biome (forest, desert, etc)'),
          byTool: z
            .record(z.string(), z.number().int().min(1))
            .optional()
            .describe('By tool used (axe_stone, pickaxe_iron, etc)'),
        })
        .optional()
    )
    .default({})
    .describe('Items collected indexed by itemId'),
  distanceTraveled: z
    .object({
      total: z.number().min(0).describe('Total distance traveled'),
      byBiome: z
        .record(z.string(), z.number().min(0))
        .optional()
        .describe('Distance by biome'),
    })
    .optional()
    .describe('Travel statistics'),
});

export type GatheringStats = z.infer<typeof GatheringStatsSchema>;

/**
 * Crafting statistics
 * Tracks items crafted with recipe tracking
 */
export const CraftingStatsSchema = z.object({
  itemsCrafted: z
    .record(
      z.string(),
      z
        .object({
          total: z.number().int().min(1).describe('Total items crafted'),
          byRecipe: z
            .record(z.string(), z.number().int().min(1))
            .optional()
            .describe('By recipe variant'),
        })
        .optional()
    )
    .default({})
    .describe('Items crafted indexed by itemId'),
});

export type CraftingStats = z.infer<typeof CraftingStatsSchema>;

/**
 * Exploration statistics
 * Tracks world discovery
 */
export const ExplorationStatsSchema = z.object({
  biomesDiscovered: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Count of unique biomes visited'),
  locationsDiscovered: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Count of unique locations discovered'),
  timeSpent: z
    .object({
      total: z.number().int().min(0).describe('Total playtime in turns'),
      byBiome: z
        .record(z.string(), z.number().int().min(0))
        .optional()
        .describe('Time spent in each biome'),
    })
    .optional()
    .describe('Playtime tracking'),
});

export type ExplorationStats = z.infer<typeof ExplorationStatsSchema>;

/**
 * Complete Player Statistics
 * Union of all stat categories
 */
export const PlayerStatisticsSchema = z.object({
  combat: CombatStatsSchema.optional().describe('Combat metrics'),
  gathering: GatheringStatsSchema.optional().describe('Gathering metrics'),
  crafting: CraftingStatsSchema.optional().describe('Crafting metrics'),
  exploration: ExplorationStatsSchema.optional().describe('Exploration metrics'),
  lastUpdated: z.coerce.date().describe('Timestamp of last stat update'),
});

export type PlayerStatistics = z.infer<typeof PlayerStatisticsSchema>;

/**
 * Factory function to create empty statistics object
 */
export function createEmptyStatistics(): PlayerStatistics {
  return {
    lastUpdated: new Date(),
  };
}

/**
 * Validate statistics conform to schema
 */
export function validateStatistics(stats: unknown): PlayerStatistics {
  return PlayerStatisticsSchema.parse(stats);
}
