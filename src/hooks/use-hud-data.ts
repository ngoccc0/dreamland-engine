/**
 * @file src/hooks/use-hud-data.ts
 * @description Custom hook for HUD data subscriptions
 *
 * @remarks
 * Wraps all HUD store subscriptions into a single hook.
 * Uses useShallow to group related fields together.
 *
 * **Benefits:**
 * - Single source of truth for HUD subscriptions
 * - Easier to maintain and modify
 * - Clear dependency list
 * - Better bundling (single import instead of 11)
 *
 * **Usage:**
 * ```typescript
 * const hudData = useHudData();
 * // Returns: { playerHp, playerMaxHp, playerHunger, ... }
 * ```
 */

import { useHudStore } from '@/store/hud.store';
import { useShallow } from 'zustand/react/shallow';

/**
 * Custom hook providing all HUD data in a single subscription
 *
 * @remarks
 * Groups related fields together using useShallow:
 * - Player stats (hp, maxHp, hunger, energy, level)
 * - Game time (hour, day, season)
 * - Weather (condition, temperature)
 * - Location (name)
 *
 * Using useShallow prevents re-renders when unrelated fields change.
 * For example: changing weatherCondition won't trigger re-render if
 * other weather fields haven't changed.
 *
 * @returns Object with all HUD data fields
 */
export function useHudData() {
  return useHudStore(
    useShallow((state) => ({
      // Player stats
      playerHp: state.playerStats.hp,
      playerMaxHp: state.playerStats.maxHp,
      playerHunger: state.playerStats.hunger,
      playerMaxHunger: state.playerStats.maxHunger,
      playerEnergy: state.playerStats.energy,
      playerMaxEnergy: state.playerStats.maxEnergy,
      playerLevel: state.playerStats.level,

      // Game time
      gameHour: state.gameTime.currentHour,
      gameDay: state.gameTime.currentDay,
      season: state.gameTime.season,

      // Weather
      weatherCondition: state.weather.condition,
      temperature: state.weather.temperature,

      // Location
      locationName: state.location.chunkName,
    }))
  );
}
