/**
 * @file src/store/hud.store.ts
 * @description Zustand store for HUD display state
 *
 * @remarks
 * Manages HUD-specific data for atomic, performant re-renders:
 * - Player stats (hp, hunger, energy, level, exp)
 * - Game time (hour, day, season)
 * - Weather (temperature, condition)
 * - Location (current chunk)
 *
 * Uses atomic selectors to prevent over-rendering when unrelated data changes.
 * Example: HudSection re-renders on hp change, but NOT on inventory change.
 *
 * **Integration:**
 * GameLayout's useGameEngine hook updates this store when game state changes.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface PlayerStats {
    hp: number;
    maxHp: number;
    hunger: number;
    maxHunger: number;
    energy: number;
    maxEnergy: number;
    level: number;
    experience: number;
}

export interface GameTimeState {
    currentHour: number;
    currentDay: number;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface WeatherState {
    temperature: number;
    condition: 'clear' | 'cloudy' | 'rainy' | 'snowy';
    biome: string;
}

export interface LocationState {
    chunkName: string;
    biomeType: string;
}

interface HudStoreState {
    // Player statistics
    playerStats: PlayerStats;

    // Game time
    gameTime: GameTimeState;

    // Weather
    weather: WeatherState;

    // Current location
    location: LocationState;

    // Control methods
    setPlayerStats: (stats: Partial<PlayerStats>) => void;
    setGameTime: (time: Partial<GameTimeState>) => void;
    setWeather: (weather: Partial<WeatherState>) => void;
    setLocation: (location: Partial<LocationState>) => void;


}

/**
 * HUD Store - Atomic selectors for display data
 *
 * @remarks
 * Atomic selectors prevent unnecessary re-renders:
 *
 * ✅ GOOD: Subscribe to specific fields
 * ```typescript
 * const playerHp = useHudStore(s => s.playerStats.hp);
 * const gameHour = useHudStore(s => s.gameTime.currentHour);
 * ```
 *
 * ❌ AVOID: Broad selectors
 * ```typescript
 * const allStats = useHudStore(s => s.playerStats); // Re-renders if ANY stat changes
 * ```
 *
 * For multiple fields, use useShallow:
 * ```typescript
 * import { useShallow } from 'zustand/react/shallow';
 * const { hp, maxHp } = useHudStore(
 *   useShallow(s => ({ hp: s.playerStats.hp, maxHp: s.playerStats.maxHp }))
 * );
 * ```
 */
export const useHudStore = create<HudStoreState>()(
    devtools(
        (set) => ({
            playerStats: {
                hp: 100,
                maxHp: 100,
                hunger: 50,
                maxHunger: 100,
                energy: 80,
                maxEnergy: 100,
                level: 1,
                experience: 0,
            },

            gameTime: {
                currentHour: 6,
                currentDay: 1,
                season: 'spring',
            },

            weather: {
                temperature: 20,
                condition: 'clear',
                biome: 'forest',
            },

            location: {
                chunkName: 'Enchanted Forest',
                biomeType: 'forest',
            },

            setPlayerStats: (stats) =>
                set((state) => ({
                    playerStats: { ...state.playerStats, ...stats },
                })),

            setGameTime: (time) =>
                set((state) => ({
                    gameTime: { ...state.gameTime, ...time },
                })),

            setWeather: (weather) =>
                set((state) => ({
                    weather: { ...state.weather, ...weather },
                })),

            setLocation: (location) =>
                set((state) => ({
                    location: { ...state.location, ...location },
                })),
        }),
        { name: 'HudStore' }
    )
);

// Atomic selectors for specific fields (recommended usage)
export const selectPlayerHp = (state: HudStoreState) => state.playerStats.hp;
export const selectPlayerMaxHp = (state: HudStoreState) => state.playerStats.maxHp;
export const selectPlayerHunger = (state: HudStoreState) => state.playerStats.hunger;
export const selectPlayerEnergy = (state: HudStoreState) => state.playerStats.energy;
export const selectPlayerLevel = (state: HudStoreState) => state.playerStats.level;
export const selectGameHour = (state: HudStoreState) => state.gameTime.currentHour;
export const selectGameDay = (state: HudStoreState) => state.gameTime.currentDay;
export const selectSeason = (state: HudStoreState) => state.gameTime.season;
export const selectWeatherCondition = (state: HudStoreState) => state.weather.condition;
export const selectTemperature = (state: HudStoreState) => state.weather.temperature;
export const selectLocationName = (state: HudStoreState) => state.location.chunkName;
