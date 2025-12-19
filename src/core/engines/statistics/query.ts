/**
 * Statistics Query Layer - Safe Accessors
 *
 * @remarks
 * **Purpose:** Provide safe, type-checked access to player statistics.
 *
 * **Design:**
 * - All methods return a number (or boolean), never undefined
 * - Undefined keys return 0 (sparse data default)
 * - Enables Quest and Achievement systems to query without null-checking
 *
 * **Usage:**
 * ```typescript
 * const kills = StatsQuery.getKillCount(stats, { creatureType: 'slime' });
 * if (kills >= 10) {
 *   // Complete quest
 * }
 * ```
 */

import { PlayerStatistics } from './schemas';

/**
 * Statistics Query helper class
 * Provides safe, chainable access to player statistics
 */
export class StatsQuery {
  /**
   * Get total or filtered creature kill count
   *
   * @param stats - Player statistics
   * @param filter - Optional filter (creatureType, biome, weapon)
   * @returns Number of creature kills matching filter
   *
   * @remarks
   * Examples:
   * - `getKillCount(stats)` → total kills (all creatures, all weapons, all locations)
   * - `getKillCount(stats, { creatureType: 'slime' })` → kills of slime type
   * - `getKillCount(stats, { biome: 'forest' })` → kills in forest
   * - `getKillCount(stats, { weapon: 'sword_fire', biome: 'forest' })` → fire sword kills in forest
   */
  static getKillCount(
    stats: PlayerStatistics,
    filter?: {
      creatureType?: string;
      biome?: string;
      weapon?: string;
    }
  ): number {
    if (!stats.combat?.kills) {
      return 0;
    }

    if (!filter) {
      return stats.combat.kills.total ?? 0;
    }

    if (filter.creatureType) {
      return stats.combat.kills.byCreatureType?.[filter.creatureType] ?? 0;
    }

    if (filter.biome) {
      return stats.combat.kills.byLocation?.[filter.biome] ?? 0;
    }

    if (filter.weapon) {
      return stats.combat.kills.byWeapon?.[filter.weapon] ?? 0;
    }

    return stats.combat.kills.total ?? 0;
  }

  /**
   * Get total or filtered item collection count
   *
   * @param stats - Player statistics
   * @param itemId - ID of the item to count
   * @param filter - Optional filter (biome, tool)
   * @returns Number of items collected
   *
   * @remarks
   * Examples:
   * - `getItemCount(stats, 'wood')` → total wood collected
   * - `getItemCount(stats, 'wood', { biome: 'forest' })` → wood from forest
   * - `getItemCount(stats, 'wood', { tool: 'axe_stone' })` → wood gathered with stone axe
   */
  static getItemCount(
    stats: PlayerStatistics,
    itemId: string,
    filter?: {
      biome?: string;
      tool?: string;
    }
  ): number {
    const itemStats = stats.gathering?.itemsCollected?.[itemId];
    if (!itemStats) {
      return 0;
    }

    if (!filter) {
      return itemStats.total ?? 0;
    }

    if (filter.biome) {
      return itemStats.byBiome?.[filter.biome] ?? 0;
    }

    if (filter.tool) {
      return itemStats.byTool?.[filter.tool] ?? 0;
    }

    return itemStats.total ?? 0;
  }

  /**
   * Check if player has gathered at least N of an item
   *
   * @param stats - Player statistics
   * @param itemId - Item ID
   * @param count - Required count
   * @param filter - Optional filter
   * @returns True if collected >= count
   */
  static hasGatheredItem(
    stats: PlayerStatistics,
    itemId: string,
    count: number,
    filter?: { biome?: string; tool?: string }
  ): boolean {
    return this.getItemCount(stats, itemId, filter) >= count;
  }

  /**
   * Get total damage dealt
   *
   * @param stats - Player statistics
   * @param filter - Optional filter (source: weapon/spell type)
   * @returns Total damage dealt
   */
  static getDamageDealt(
    stats: PlayerStatistics,
    filter?: { source?: string }
  ): number {
    if (!stats.combat?.damageDealt) {
      return 0;
    }

    if (!filter) {
      return stats.combat.damageDealt.total ?? 0;
    }

    if (filter.source) {
      return stats.combat.damageDealt.bySource?.[filter.source] ?? 0;
    }

    return stats.combat.damageDealt.total ?? 0;
  }

  /**
   * Get total damage taken
   *
   * @param stats - Player statistics
   * @returns Total health lost
   */
  static getDamageTaken(stats: PlayerStatistics): number {
    return stats.combat?.healthLost?.total ?? 0;
  }

  /**
   * Get total items crafted
   *
   * @param stats - Player statistics
   * @param itemId - Item ID (optional)
   * @returns Total items crafted (or items of specific type)
   */
  static getCraftedItemCount(
    stats: PlayerStatistics,
    itemId?: string
  ): number {
    if (itemId) {
      return stats.crafting?.itemsCrafted?.[itemId]?.total ?? 0;
    }

    let total = 0;
    if (stats.crafting?.itemsCrafted) {
      Object.values(stats.crafting.itemsCrafted).forEach(item => {
        total += item?.total ?? 0;
      });
    }
    return total;
  }

  /**
   * Check if player has crafted at least N of an item
   *
   * @param stats - Player statistics
   * @param itemId - Item ID
   * @param count - Required count
   * @returns True if crafted >= count
   */
  static hasCraftedItem(
    stats: PlayerStatistics,
    itemId: string,
    count: number
  ): boolean {
    return this.getCraftedItemCount(stats, itemId) >= count;
  }

  /**
   * Get total distance traveled
   *
   * @param stats - Player statistics
   * @param filter - Optional filter (biome)
   * @returns Distance traveled
   */
  static getDistanceTraveled(
    stats: PlayerStatistics,
    filter?: { biome?: string }
  ): number {
    if (!stats.exploration?.timeSpent) {
      return 0;
    }

    if (!filter) {
      return stats.exploration.timeSpent.total ?? 0;
    }

    if (filter.biome) {
      return stats.exploration.timeSpent.byBiome?.[filter.biome] ?? 0;
    }

    return stats.exploration.timeSpent.total ?? 0;
  }

  /**
   * Get count of biomes discovered
   *
   * @param stats - Player statistics
   * @returns Count of unique biomes
   */
  static getBiomesDiscovered(stats: PlayerStatistics): number {
    return stats.exploration?.biomesDiscovered ?? 0;
  }

  /**
   * Get count of locations discovered
   *
   * @param stats - Player statistics
   * @returns Count of unique locations
   */
  static getLocationsDiscovered(stats: PlayerStatistics): number {
    return stats.exploration?.locationsDiscovered ?? 0;
  }

  /**
   * Check if player has killed at least N creatures
   *
   * @param stats - Player statistics
   * @param count - Required count
   * @param filter - Optional filter
   * @returns True if killed >= count
   */
  static hasKilledCreatures(
    stats: PlayerStatistics,
    count: number,
    filter?: { creatureType?: string; biome?: string; weapon?: string }
  ): boolean {
    return this.getKillCount(stats, filter) >= count;
  }

  /**
   * Check if player has traveled at least N distance
   *
   * @param stats - Player statistics
   * @param distance - Required distance
   * @param filter - Optional filter
   * @returns True if traveled >= distance
   */
  static hasTraveledDistance(
    stats: PlayerStatistics,
    distance: number,
    filter?: { biome?: string }
  ): boolean {
    return this.getDistanceTraveled(stats, filter) >= distance;
  }

  /**
   * Check if player has discovered at least N biomes
   *
   * @param stats - Player statistics
   * @param count - Required count
   * @returns True if discovered >= count
   */
  static hasDiscoveredBiomes(stats: PlayerStatistics, count: number): boolean {
    return this.getBiomesDiscovered(stats) >= count;
  }

  /**
   * Check if player has discovered at least N locations
   *
   * @param stats - Player statistics
   * @param count - Required count
   * @returns True if discovered >= count
   */
  static hasDiscoveredLocations(
    stats: PlayerStatistics,
    count: number
  ): boolean {
    return this.getLocationsDiscovered(stats) >= count;
  }
}
