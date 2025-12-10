/**
 * Game Configuration Export
 *
 * @remarks
 * Central export point for all game balancing and tuning parameters.
 * Consolidates hardcoded values into a single, manageable location.
 *
 * Usage:
 * ```typescript
 * import { combatConfig, plantConfig, renderConfig } from '@/lib/config';
 *
 * // Access config values
 * const damage = playerAttack * combatConfig.classBonus.warrior;
 * const growthRate = plant.growth * plantConfig.baseGrowthRate;
 * ```
 *
 * TODO: Add per-difficulty config overrides
 * TODO: Add config validation function
 * TODO: Add config export/import for modding support
 */

export { combatConfig, type CombatConfig } from './combat-config';
export { playerStatsConfig, type PlayerStatsConfig } from './player-stats-config';
export { environmentConfig, type EnvironmentConfig } from './environment-config';
export { plantConfig, type PlantConfig } from './plant-config';
export { creatureConfig, type CreatureConfig } from './creature-config';
export { renderConfig, type RenderConfig } from './render-config';

/**
 * Import configs for aggregation
 */
import { combatConfig } from './combat-config';
import { playerStatsConfig } from './player-stats-config';
import { environmentConfig } from './environment-config';
import { plantConfig } from './plant-config';
import { creatureConfig } from './creature-config';
import { renderConfig } from './render-config';

/**
 * Aggregate configuration object
 *
 * @remarks
 * Convenient access to all configs in a single object.
 * Useful for debugging and config validation.
 */
export const gameConfig = {
    combat: combatConfig,
    playerStats: playerStatsConfig,
    environment: environmentConfig,
    plants: plantConfig,
    creatures: creatureConfig,
    rendering: renderConfig,
} as const;

/**
 * Type for entire game configuration
 */
export type GameConfigType = typeof gameConfig;
