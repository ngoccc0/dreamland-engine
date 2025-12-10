/**
 * Creature & Enemy Configuration
 *
 * @remarks
 * Defines spawn rates, difficulty scaling, and creature spawn parameters.
 * Used for world generation and enemy spawning mechanics.
 *
 * TODO: Add creature type-specific configurations
 * TODO: Add difficulty level scaling multipliers
 */

/**
 * Creature system configuration
 *
 * @remarks
 * Controls how creatures spawn and scale with world difficulty.
 * Lower spawn rates = fewer enemies; higher multipliers = tougher enemies.
 */
export const creatureConfig = {
  /**
   * Base creature spawn probability (0-1 scale)
   * @remarks Probability of spawning a creature in a tile
   */
  baseSpawnRate: 0.3,

  /**
   * Minimum spawn rate multiplier
   * @remarks Lower bound for difficulty scaling
   */
  spawnRateMultiplierMin: 0.5,

  /**
   * Maximum spawn rate multiplier
   * @remarks Upper bound for difficulty scaling
   */
  spawnRateMultiplierMax: 1.3,

  /**
   * How spawn rate scales with world expansion
   * @remarks Larger worlds spawn more creatures
   */
  spawnRatePerWorldSize: 0.001,

  /**
   * Base health for spawned creatures
   * @remarks Used as default before applying multipliers
   */
  baseCreatureHealth: 100,

  /**
   * Health scaling based on world difficulty
   * @remarks Creatures become tougher as world expands
   */
  healthScalingMultiplier: 1.1,

  /**
   * Minimum health for any creature
   * @remarks Prevents creatures from being too weak
   */
  minCreatureHealth: 30,

  /**
   * Maximum health for any creature
   * @remarks Prevents creatures from becoming too tanky
   */
  maxCreatureHealth: 500,

  /**
   * Loot drop rate
   * @remarks Probability that creature drops loot on defeat
   */
  lootDropRate: 0.4,

  /**
   * XP multiplier for creature defeats
   * @remarks Scales XP gained from enemy defeats
   */
  xpDropMultiplier: 1.0,

  /**
   * Creature rarity distribution
   * @remarks Probability of each rarity tier
   */
  rarityDistribution: {
    common: 0.70,
    uncommon: 0.20,
    rare: 0.08,
    legendary: 0.02,
  },
} as const;

/**
 * Export type for TypeScript consumers
 */
export type CreatureConfig = typeof creatureConfig;
