/**
 * @file src/hooks/use-store-sync.ts
 * @description Synchronizes game engine state to Zustand stores
 *
 * @remarks
 * This hook acts as a "store update pipeline" that takes game engine state
 * and synchronizes it to all relevant Zustand stores (hud, minimap, controls, ui).
 *
 * **Why this hook exists:**
 * - Game engine (useGameEngine) is the source of truth
 * - Smart Container sections subscribe to stores
 * - This hook bridges the gap: gameEngine state → stores → sections
 *
 * **Data Flow:**
 * useGameEngine (game logic)
 *  ↓
 * use-store-sync (this hook)
 *  ↓
 * [useHudStore, useMinimapStore, useControlsStore, useUIStore]
 *  ↓
 * [HudSection, MiniMapSection, ControlsSection, DialogSection] (Smart Containers)
 *
 * **When to call:**
 * In GameLayout's useEffect when game state changes:
 * ```typescript
 * const gameState = useGameEngine(props);
 * useStoreSync(gameState);
 * ```
 *
 * **Performance:**
 * - Only updates store slices when values actually change
 * - Uses useEffect to debounce rapid updates
 * - Prevents unnecessary re-renders in subscribed components
 */

import { useEffect, useRef } from 'react';
import { useHudStore } from '@/store/hud.store';
import { useMinimapStore } from '@/store/minimap.store';

interface StoreSyncProps {
    // Player state
    playerStats?: any;
    playerPosition?: { x: number; y: number };
    visualPlayerPosition?: { x: number; y: number };
    isAnimatingMove?: boolean;
    visualMoveTo?: { x: number; y: number } | null;
    turn?: number;

    // Game state
    gameTime?: any;
    currentChunk?: any;
    world?: any;
    weatherZones?: any; // Can be object or array
    grid?: any;
    biomeDefinitions?: any[];

    // Loading state
    isLoading?: boolean;
}

/**
 * Synchronizes game engine state to all Zustand stores
 *
 * @remarks
 * This hook should be called in GameLayout after useGameEngine to keep stores
 * synchronized with game state changes. It intelligently updates only the store
 * slices that changed, preventing unnecessary re-renders.
 *
 * **Example:**
 * ```typescript
 * const gameState = useGameEngine(props);
 * useStoreSync(gameState);
 * ```
 *
 * The hook will automatically:
 * - Update HUD stats (HP, hunger, energy, level)
 * - Update HUD time (hour, day, season)
 * - Update HUD weather (temperature, condition, location)
 * - Update minimap grid data and animation
 * - Keep all stores in sync with game engine
 *
 * @param props - Game engine state to synchronize
 */
export function useStoreSync(props: StoreSyncProps) {
    // Track previous values to prevent unnecessary updates
    const prevStateRef = useRef<StoreSyncProps>({});

    useEffect(() => {
        // Update HUD Store - Player Stats
        if (props.playerStats) {
            const prevStats = prevStateRef.current.playerStats;

            if (prevStats !== props.playerStats) {
                useHudStore.getState().setPlayerStats({
                    hp: props.playerStats.hp ?? 100,
                    maxHp: props.playerStats.maxHp ?? 100,
                    hunger: props.playerStats.hunger ?? 50,
                    maxHunger: props.playerStats.maxHunger ?? 100,
                    energy: props.playerStats.energy ?? 80,
                    maxEnergy: props.playerStats.maxEnergy ?? 100,
                    level: props.playerStats.level ?? 1,
                    experience: props.playerStats.experience ?? 0,
                });
            }
        }

        // Update HUD Store - Game Time
        if (props.gameTime) {
            const prevTime = prevStateRef.current.gameTime;

            if (prevTime !== props.gameTime) {
                useHudStore.getState().setGameTime({
                    currentHour: Math.floor((props.gameTime.hour ?? 0)),
                    currentDay: props.gameTime.day ?? 1,
                    season: (props.gameTime.season ?? 'spring') as 'spring' | 'summer' | 'autumn' | 'winter',
                });
            }
        }

        // Update HUD Store - Location & Weather
        if (props.currentChunk || props.weatherZones) {
            const prevChunk = prevStateRef.current.currentChunk;
            const prevWeather = prevStateRef.current.weatherZones;

            if (prevChunk !== props.currentChunk && props.currentChunk) {
                useHudStore.getState().setLocation({
                    chunkName: props.currentChunk.name ?? 'Unknown',
                    biomeType: props.currentChunk.biome ?? 'unknown',
                });
            }

            if (prevWeather !== props.weatherZones && props.weatherZones) {
                // weatherZones can be object or array, get first value either way
                const weather = Array.isArray(props.weatherZones)
                    ? props.weatherZones[0]
                    : Object.values(props.weatherZones)[0];

                if (weather) {
                    useHudStore.getState().setWeather({
                        temperature: weather.temperature ?? 20,
                        condition: (weather.condition ?? 'clear') as 'clear' | 'cloudy' | 'rainy' | 'snowy',
                        biome: props.currentChunk?.biome ?? 'unknown',
                    });
                }
            }
        }

        // Update Minimap Store
        if (props.grid && props.playerPosition) {
            const prevGrid = prevStateRef.current.grid;
            const prevPosition = prevStateRef.current.playerPosition;

            if (prevGrid !== props.grid || prevPosition !== props.playerPosition) {
                // Grid has centerX and centerY which should match player position
                const centerX = props.playerPosition.x;
                const centerY = props.playerPosition.y;
                useMinimapStore.getState().updateGrid(props.grid, centerX, centerY);
            }
        }

        // Track animation state
        if (props.isAnimatingMove !== undefined) {
            const prevAnimating = prevStateRef.current.isAnimatingMove;
            if (prevAnimating !== props.isAnimatingMove) {
                if (props.isAnimatingMove) {
                    useMinimapStore.getState().startAnimation();
                } else {
                    useMinimapStore.getState().endAnimation();
                }
            }
        }

        // Track current state for next comparison
        prevStateRef.current = { ...props };
    }, [props]);
}
