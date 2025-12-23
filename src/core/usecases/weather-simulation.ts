/**
 * @file src/core/usecases/weather-simulation.ts
 * @description Pure functions for weather simulation and forecasting
 *
 * @remarks
 * **Purpose:**
 * Encapsulates all weather-related logic independently of React.
 * These functions handle weather initialization, updates, forecasting,
 * and condition tracking.
 *
 * **Pattern:**
 * - No React context or refs (testable with pure Jest)
 * - Input → Output transformation
 * - Side effects minimized (engine ref mutations isolated)
 *
 * **Key Functions:**
 * - `buildWeatherData()` - Initialize all weather condition data
 * - `updateWeatherEngine()` - Update engine with current time
 * - `getWeatherForecast()` - Generate weather predictions
 * - `normalizeWeatherData()` - Ensure data consistency
 */

import { WeatherType, WeatherIntensity, WeatherCondition } from '@/core/types/weather';

/**
 * Weather simulation result from update cycle
 *
 * @remarks
 * Returned by updateWeatherCycle for atomic application.
 */
export interface WeatherSimulationResult {
    /** Current weather conditions after update */
    currentCondition: WeatherCondition;
    /** Forecasted weather for next few ticks */
    forecast: WeatherCondition[];
    /** Weather-related narrative messages */
    weatherMessages: Array<{ text: string; type: string }>;
}

/**
 * Build complete weather data map with realistic conditions
 *
 * @remarks
 * Creates initial weather data for all types with:
 * - Realistic temperature values by condition
 * - Appropriate wind speed, precipitation, visibility
 * - Empty effects array (effects handled by EffectEngine)
 * - Empty transitions (forecast system handles transitions)
 *
 * Used during engine initialization and testing.
 *
 * @returns Map of WeatherType → WeatherCondition with full data
 */
export function buildWeatherData(): Map<WeatherType, WeatherCondition> {
    const weatherData: Map<WeatherType, WeatherCondition> = new Map([
        [
            WeatherType.CLEAR,
            {
                type: WeatherType.CLEAR,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600, // 1 hour
                effects: [],
                temperature: 22, // Average grassland temperature
                windSpeed: 10,
                precipitation: 0,
                cloudCover: 0,
                visibility: 100,
                transitions: [],
            },
        ],
        [
            WeatherType.CLOUDY,
            {
                type: WeatherType.CLOUDY,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600,
                effects: [],
                temperature: 20, // Slightly cooler
                windSpeed: 15,
                precipitation: 0,
                cloudCover: 60,
                visibility: 80,
                transitions: [],
            },
        ],
        [
            WeatherType.RAIN,
            {
                type: WeatherType.RAIN,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600,
                effects: [],
                temperature: 17, // Cooler during rain
                windSpeed: 20,
                precipitation: 50,
                cloudCover: 80,
                visibility: 70,
                transitions: [],
            },
        ],
        [
            WeatherType.SNOW,
            {
                type: WeatherType.SNOW,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600,
                effects: [],
                temperature: 0, // Cold during snow
                windSpeed: 25,
                precipitation: 30,
                cloudCover: 90,
                visibility: 50,
                transitions: [],
            },
        ],
        [
            WeatherType.WIND,
            {
                type: WeatherType.WIND,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600,
                effects: [],
                temperature: 20, // Neutral temperature
                windSpeed: 35,
                precipitation: 0,
                cloudCover: 20,
                visibility: 85,
                transitions: [],
            },
        ],
        [
            WeatherType.STORM,
            {
                type: WeatherType.STORM,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600,
                effects: [],
                temperature: 15, // Stormy and cool
                windSpeed: 40,
                precipitation: 70,
                cloudCover: 95,
                visibility: 40,
                transitions: [],
            },
        ],
        [
            WeatherType.FOG,
            {
                type: WeatherType.FOG,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600,
                effects: [],
                temperature: 18, // Cool and damp
                windSpeed: 5,
                precipitation: 10,
                cloudCover: 100,
                visibility: 30,
                transitions: [],
            },
        ],
        [
            WeatherType.HEATWAVE,
            {
                type: WeatherType.HEATWAVE,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600,
                effects: [],
                temperature: 35, // Hot during heatwave
                windSpeed: 10,
                precipitation: 0,
                cloudCover: 20,
                visibility: 90,
                transitions: [],
            },
        ],
    ]);

    return weatherData;
}

/**
 * Update weather engine with current game time
 *
 * @remarks
 * Advances the weather engine state based on elapsed game time.
 * This triggers transitions between weather conditions based on
 * duration and forecast system.
 *
 * Safe: Handles missing engine gracefully.
 *
 * @param weatherEngineRef - Weather engine instance reference
 * @param currentGameTime - Current game time in minutes
 * @param gameState - Game state for context (seasons, location, etc)
 * @returns Array of weather transition messages
 */
export function updateWeatherEngineSync(
    weatherEngineRef: { current?: any },
    currentGameTime: number,
    gameState: any = {},
): Array<{ text: string; type: string }> {
    if (!weatherEngineRef?.current) {
        return [];
    }

    try {
        if (typeof weatherEngineRef.current.update === 'function') {
            weatherEngineRef.current.update(currentGameTime);
        }

        // Check if there's a method to get weather transition messages
        if (typeof weatherEngineRef.current.getWeatherMessages === 'function') {
            const messages = weatherEngineRef.current.getWeatherMessages();
            if (!Array.isArray(messages)) {
                console.warn(
                    `[WeatherSimulation.updateWeatherEngineSync] Engine returned non-array messages. Got ${typeof messages}`,
                );
                return [];
            }

            // Prevent message flood
            if (messages.length > 500) {
                console.warn(
                    `[WeatherSimulation.updateWeatherEngineSync] Too many weather messages (${messages.length}, max 500). Truncating.`,
                );
                return messages.slice(0, 500);
            }

            return messages;
        }

        return [];
    } catch (err) {
        // Log weather engine error for debugging
        console.warn(
            `[WeatherSimulation.updateWeatherEngineSync] Engine update failed: ${err instanceof Error ? err.message : String(err)}. Continuing without weather update.`,
        );
        return [];
    }
}

/**
 * Get weather forecast from engine
 *
 * @remarks
 * Retrieves predicted weather conditions for the next N turns.
 * Used by UI for showing weather predictions.
 *
 * Safe: Returns empty array if engine unavailable.
 *
 * @param weatherEngineRef - Weather engine instance reference
 * @param turns - Number of turns to forecast (default 5)
 * @returns Array of forecasted WeatherCondition objects
 */
export function getWeatherForecast(
    weatherEngineRef: { current?: any },
    turns: number = 5,
): WeatherCondition[] {
    if (!weatherEngineRef?.current) {
        return [];
    }

    try {
        if (typeof weatherEngineRef.current.getForecast === 'function') {
            const forecast = weatherEngineRef.current.getForecast(turns);
            if (!Array.isArray(forecast)) {
                console.warn(
                    `[WeatherSimulation.getWeatherForecast] Engine returned non-array forecast. Got ${typeof forecast}`,
                );
                return [];
            }

            // Prevent memory bomb from excessive forecast data
            if (forecast.length > 100) {
                console.warn(
                    `[WeatherSimulation.getWeatherForecast] Forecast array too large (${forecast.length} items, max 100). Truncating.`,
                );
                return forecast.slice(0, 100).map((c) => normalizeWeatherCondition(c));
            }

            return forecast.map((c) => normalizeWeatherCondition(c));
        }
    } catch (err) {
        // Log forecast error for debugging
        console.warn(
            `[WeatherSimulation.getWeatherForecast] Failed to retrieve forecast: ${err instanceof Error ? err.message : String(err)}`,
        );
    }

    return [];
}

/**
 * Get current weather condition from engine
 *
 * @remarks
 * Retrieves the active weather condition details.
 * Used by UI for rendering weather visuals and player stats.
 *
 * Safe: Returns sensible default if engine unavailable.
 *
 * @param weatherEngineRef - Weather engine instance reference
 * @returns Current WeatherCondition or default clear weather
 */
export function getCurrentWeatherCondition(
    weatherEngineRef: { current?: any },
): WeatherCondition {
    const defaultClear: WeatherCondition = {
        type: WeatherType.CLEAR,
        intensity: WeatherIntensity.NORMAL,
        duration: 3600,
        effects: [],
        temperature: 22,
        windSpeed: 10,
        precipitation: 0,
        cloudCover: 0,
        visibility: 100,
        transitions: [],
    };

    if (!weatherEngineRef?.current) {
        return defaultClear;
    }

    try {
        if (typeof weatherEngineRef.current.getCurrentCondition === 'function') {
            const condition = weatherEngineRef.current.getCurrentCondition();
            if (!condition) {
                return defaultClear;
            }

            // Deep clone to prevent engine mutations affecting game state
            const cloned = JSON.parse(JSON.stringify(condition)) as any;
            return normalizeWeatherCondition(cloned);
        }
    } catch (err) {
        // Log condition fetch error for debugging
        console.warn(
            `[WeatherSimulation.getCurrentWeatherCondition] Failed to retrieve current condition: ${err instanceof Error ? err.message : String(err)}. Using default clear weather.`,
        );
    }

    return defaultClear;
}

/**
 * Normalize weather condition data for consistency
 *
 * @remarks
 * Ensures all required fields are present and within valid ranges:
 * - temperature: -50 to 50 °C
 * - windSpeed: 0 to 100 km/h
 * - precipitation: 0 to 100 %
 * - cloudCover: 0 to 100 %
 * - visibility: 0 to 100 %
 *
 * Used after reading from engine or storage.
 *
 * @param condition - Weather condition to normalize
 * @returns Normalized WeatherCondition with all fields in valid ranges
 */
export function normalizeWeatherCondition(condition: any): WeatherCondition {
    const clamp = (val: number, min: number, max: number, name: string) => {
        // Check for NaN/Infinity
        if (!Number.isFinite(val)) {
            console.warn(
                `[WeatherSimulation.normalizeWeatherCondition] Invalid ${name} value: ${val}. Using default.`,
            );
            // Use max for positive infinity, min for negative infinity, min for NaN
            if (val === Infinity) return max;
            if (val === -Infinity) return min;
            return min;
        }
        return Math.max(min, Math.min(max, val ?? min));
    };

    return {
        type: (condition?.type as WeatherType) || WeatherType.CLEAR,
        intensity: (condition?.intensity as WeatherIntensity) || WeatherIntensity.NORMAL,
        duration: Math.max(0, condition?.duration ?? 3600),
        effects: Array.isArray(condition?.effects) ? condition.effects : [],
        temperature: clamp(condition?.temperature ?? 22, -50, 50, 'temperature'),
        windSpeed: clamp(condition?.windSpeed ?? 10, 0, 100, 'windSpeed'),
        precipitation: clamp(condition?.precipitation ?? 0, 0, 100, 'precipitation'),
        cloudCover: clamp(condition?.cloudCover ?? 0, 0, 100, 'cloudCover'),
        visibility: clamp(condition?.visibility ?? 100, 0, 100, 'visibility'),
        transitions: Array.isArray(condition?.transitions) ? condition.transitions : [],
    };
}

/**
 * Run complete weather simulation cycle
 *
 * @remarks
 * Orchestrates all weather update operations:
 * 1. Updates engine state with current game time
 * 2. Retrieves current weather condition
 * 3. Generates forecast for next turns
 * 4. Collects any weather transition messages
 *
 * Pattern: Sync-Back (caller applies messages and updates atomically)
 *
 * @param weatherEngineRef - Weather engine instance reference
 * @param currentGameTime - Current game time in minutes
 * @param gameState - Game state for context (seasons, location, etc)
 * @returns WeatherSimulationResult with current condition, forecast, and messages
 */
export function simulateWeatherSync(
    weatherEngineRef: { current?: any },
    currentGameTime: number,
    gameState: any = {},
): WeatherSimulationResult {
    // Update engine with current game time
    const weatherMessages = updateWeatherEngineSync(weatherEngineRef, currentGameTime, gameState);

    // Get current condition
    const currentCondition = getCurrentWeatherCondition(weatherEngineRef);

    // Get forecast
    const forecast = getWeatherForecast(weatherEngineRef, 5);

    return {
        currentCondition,
        forecast,
        weatherMessages: weatherMessages.map((msg) => ({
            text: msg.text,
            type: msg.type as string,
        })),
    };
}
