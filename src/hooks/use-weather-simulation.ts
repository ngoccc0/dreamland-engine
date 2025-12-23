/**
 * @file src/hooks/use-weather-simulation.ts
 * @description React hook for weather simulation with sync-back pattern
 *
 * @remarks
 * Wraps pure weather simulation functions with React context integration.
 * Returns callback for caller to invoke and apply results atomically.
 *
 * **Pattern: Sync-Back**
 * - Hook initialization: Sets up refs and memoization
 * - Caller invokes: `const result = simulateWeather()`
 * - Caller applies: Loop through messages and update state atomically
 */

import { useCallback, useRef } from 'react';
import { useLanguage } from '@/context/language-context';
import {
    simulateWeatherSync,
    buildWeatherData,
    WeatherSimulationResult,
} from '@/core/usecases/weather-simulation';
import type { WeatherCondition } from '@/core/types/weather';

/**
 * Hook dependencies for weather simulation
 *
 * @remarks
 * All dependencies needed by weather simulation:
 * - currentGameTime: Current elapsed game time in minutes
 * - gameState: World state for context (seasons, location, biome, etc)
 * - weatherEngineRef: Reference to the active WeatherEngine instance
 */
export interface UseWeatherSimulationDeps {
    /** Current game time in minutes (0-1440 per day) */
    currentGameTime: number;
    /** Game state for context (seasons, location, world profile) */
    gameState: any;
    /** Reference to active WeatherEngine instance */
    weatherEngineRef: { current?: any };
}

/**
 * Weather simulation callback result
 *
 * @remarks
 * Returned by useWeatherSimulation hook.
 */
export interface UseWeatherSimulationResult {
    /** Callback to run weather simulation (pure, no side effects) */
    simulateWeather: () => WeatherSimulationResult;
    /** Current weather data map (for initialization/testing) */
    weatherData: Map<any, any>;
}

/**
 * React hook for weather simulation with proper dependency tracking
 *
 * @remarks
 * **Usage Pattern:**
 * ```typescript
 * const { simulateWeather, weatherData } = useWeatherSimulation({ ... });
 *
 * // In advanceGameTime:
 * const weatherResult = simulateWeather();
 * // Apply messages and updates atomically
 * for (const msg of weatherResult.weatherMessages) {
 *     addNarrativeEntry(msg.text, msg.type);
 * }
 * ```
 *
 * **Memoization:**
 * - simulateWeather callback memoized with full dependency list
 * - Prevents unnecessary recreations when deps unchanged
 *
 * **Context Integration:**
 * - Language context (t function) for message translation
 * - Proper error handling for missing engine or state
 *
 * @param deps - Dependencies (currentGameTime, gameState, weatherEngineRef)
 * @returns Object with simulateWeather callback and weatherData map
 */
export function useWeatherSimulation(deps: UseWeatherSimulationDeps): UseWeatherSimulationResult {
    const { t } = useLanguage();

    // Initialize weather data once
    const weatherDataRef = useRef(buildWeatherData());

    // Memoize the simulation callback with all dependencies
    const simulateWeather = useCallback((): WeatherSimulationResult => {
        return simulateWeatherSync(
            deps.weatherEngineRef,
            deps.currentGameTime,
            deps.gameState,
        );
    }, [deps.currentGameTime, deps.gameState, deps.weatherEngineRef, t]);

    return {
        simulateWeather,
        weatherData: weatherDataRef.current,
    };
}
