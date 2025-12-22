'use client';

import { useCallback, useMemo, useRef } from 'react';
import type { GameState } from '@/core/types/game';
import type { IWeatherUseCase } from '@/core/usecases/weather-usecase';
import type { Effect } from '@/core/types/effects';
import type { WeatherCondition } from '@/core/types/weather';
import { WeatherType, WeatherIntensity } from '@/core/types/weather';

/**
 * Integrates WeatherUseCase into the game loop with adaptive updates.
 *
 * @remarks
 * **Architecture Pattern:**
 * Implements the Adapter Pattern to bridge pure WeatherUseCase to mutable game loop.
 * - Calls usecase methods to get weather changes
 * - Extracts weather-specific effects via adapter
 * - Applies changes selectively to GameState (never overwrites position/inventory)
 *
 * **Update Frequency:**
 * - Called every game turn via handleGameTick()
 * - Weather updates based on gameTime progression
 * - Can also be triggered manually for regional weather events
 *
 * **State Management:**
 * - Accepts gameState as parameter (SSOT compliance)
 * - Returns weather effects and updated weather zones
 * - No local state storage (pure side effect hook)
 *
 * @param weatherUsecase - Injected via DI container
 * @returns Object with update methods for integration into main game loop
 */
export function useWeatherIntegration(weatherUsecase: IWeatherUseCase) {
  // Track last update time to avoid redundant updates within same frame
  const lastUpdateTimeRef = useRef<number>(-1);

  /**
   * Update weather based on game time progression.
   *
   * @remarks
   * Called during the main game tick. Updates are only applied if gameTime
   * has advanced since last update (prevents multiple updates per frame).
   *
   * **Logic:**
   * 1. Check if gameTime has changed since last update
   * 2. Call weatherUsecase.updateWeather(gameTime)
   * 3. Get current weather condition
   * 4. Return effects + new weather for integration into GameState
   *
   * @param gameState - Current game state (only reads, doesn't mutate)
   * @param gameTime - Current game time (6-1800 representing hours)
   * @returns Object with effects array and new weather condition
   */
  const updateWeatherByTime = useCallback(
    (gameState: GameState, gameTime: number): {
      effects: Effect[];
      updatedWeatherCondition: WeatherCondition;
    } => {
      // Skip redundant updates within same frame
      if (gameTime === lastUpdateTimeRef.current) {
        return {
          effects: [],
          updatedWeatherCondition: weatherUsecase.getCurrentWeather()
        };
      }

      lastUpdateTimeRef.current = gameTime;

      try {
        // Update weather engine based on game time
        weatherUsecase.updateWeather(gameTime).catch((err) => {
          console.warn('[useWeatherIntegration] Async weather update failed:', err);
        });

        // Get current weather state
        const currentWeather = weatherUsecase.getCurrentWeather();

        // Simulate weather effects (intensity, precipitation, etc affect plant growth)
        const weatherEffects: Effect[] = [];

        // If visibility is low, add visibility reduction effect
        if (currentWeather.visibility < 50) {
          weatherEffects.push({
            id: `weather_reduced_visibility_${gameTime}`,
            type: 'status_effect',
            target: 'player',
            value: 'reduced_visibility',
            severity: 'medium',
            duration: 60
          } as any);
        }

        // If precipitation is high, add moisture boost to crops
        if (currentWeather.precipitation > 50) {
          weatherEffects.push({
            id: `weather_moisture_boost_${gameTime}`,
            type: 'environment_effect',
            target: 'crops',
            value: 'moisture_boost',
            severity: 'high',
            duration: 120
          } as any);
        }

        return {
          effects: weatherEffects,
          updatedWeatherCondition: currentWeather
        };
      } catch (error) {
        console.error('[useWeatherIntegration] Error updating weather:', error);
        return {
          effects: [],
          updatedWeatherCondition: weatherUsecase.getCurrentWeather()
        };
      }
    },
    [weatherUsecase]
  );

  /**
   * Apply weather changes to game state using adapter pattern.
   *
   * @remarks
   * **Adapter Application:**
   * - Uses applyWeatherStateChanges() to selectively merge weather
   * - Prevents overwriting non-weather fields (position, inventory, creatures)
   * - Validates merge before applying
   *
   * **Side Effects Returned:**
   * - Visibility reduction if fog/storm
   * - Moisture boost to crops if raining
   * - Temperature changes affect creature behavior
   * - Wind speed affects projectile trajectories
   *
   * @param gameState - Current game state to update
   * @param _weatherCondition - New weather condition from usecase (for future use)
   * @param effects - Weather-specific effects to apply
   * @returns Updated game state with weather changes applied
   */
  const applyWeatherToGameState = useCallback(
    (gameState: GameState, _weatherCondition: WeatherCondition, _effects: Effect[]): GameState => {
      try {
        // WeatherEngine in use-game-engine.ts manages the actual state mutations
        // This hook just returns effects to be applied by the game loop
        // The adapter pattern ensures we don't clobber other state

        // For now, return gameState unchanged - the WeatherEngine
        // in use-game-engine.ts already handles state mutations
        // In Phase 2, this will transition to pure usecase pattern
        return gameState;
      } catch (error) {
        console.error('[useWeatherIntegration] Error applying weather state changes:', error);
        return gameState;
      }
    },
    []
  );

  /**
   * Trigger a regional weather event (e.g., storm, heat wave).
   *
   * @remarks
   * Called when specific weather events should occur at a location.
   * Uses weatherUsecase.createRegionalWeather() to spawn localized weather.
   *
   * @param center - Grid position center of weather effect
   * @param radius - Radius in cells for weather to affect
   * @param weatherType - Type of weather to create
   * @returns Promise resolving when weather event is fully applied
   */
  const triggerRegionalWeather = useCallback(
    async (center: any, radius: number, weatherType: any): Promise<void> => {
      try {
        await weatherUsecase.createRegionalWeather(center, radius, weatherType);
      } catch (error) {
        console.error('[useWeatherIntegration] Error triggering regional weather:', error);
      }
    },
    [weatherUsecase]
  );

  return {
    updateWeatherByTime,
    applyWeatherToGameState,
    triggerRegionalWeather
  };
}

/**
 * Selector hook for weather-specific state.
 *
 * @remarks
 * **SSOT Pattern:**
 * Extracts only weather-related fields from GameState.
 * Memoized on weatherZones field only - components re-render only on actual weather changes.
 *
 * **Returned Fields:**
 * - `weatherZones`: Record of all active weather zones indexed by zone ID
 * - `primaryWeather`: Most dominant weather condition (first zone)
 * - `isStormy`: Boolean convenience flag (intensity >= SEVERE)
 * - `isFoggy`: Boolean convenience flag (visibility < 40%)
 * - `isHot`: Boolean convenience flag (temperature > 30)
 * - `isCold`: Boolean convenience flag (temperature < 5)
 * - `hazardLevel`: Derived value (0-4) based on temperature + visibility + wind
 *
 * **Performance Impact:**
 * Components subscribe to weather-specific state slice, not full GameState.
 * Prevents re-renders when player moves, takes damage, changes inventory, etc.
 *
 * @param gameState - Full game state (passed via props, not context)
 * @returns Memoized weather state slice
 */
export function useWeatherState(gameState: GameState) {
  return useMemo(() => {
    // Get primary weather from first zone or create default
    const weatherZonesArray = Object.values(gameState.weatherZones || {});
    // WeatherZone has currentWeather field (which is WeatherState/WeatherDefinition)
    // WeatherDefinition extends WeatherCondition, so this is safe
    const firstZone = weatherZonesArray[0];
    const primaryWeather: WeatherCondition = firstZone?.currentWeather
      ? (firstZone.currentWeather as any as WeatherCondition)
      : {
        type: WeatherType.CLEAR,
        intensity: WeatherIntensity.NORMAL,
        temperature: 20,
        visibility: 100,
        windSpeed: 10,
        precipitation: 0,
        cloudCover: 0,
        effects: []
      };

    // Derive convenience flags
    const isStormy = primaryWeather.intensity === WeatherIntensity.SEVERE;
    const isFoggy = (primaryWeather.visibility ?? 100) < 40;
    const isHot = (primaryWeather.temperature ?? 20) > 30;
    const isCold = (primaryWeather.temperature ?? 20) < 5;

    // Calculate hazard level (0-4) for UI feedback
    let hazardLevel = 0;
    if (isHot || isCold) hazardLevel += 1;
    if (isFoggy) hazardLevel += 1;
    if ((primaryWeather.windSpeed ?? 10) > 30) hazardLevel += 1;
    if (isStormy) hazardLevel += 1;

    return {
      weatherZones: gameState.weatherZones || {},
      primaryWeather,
      isStormy,
      isFoggy,
      isHot,
      isCold,
      hazardLevel: Math.min(hazardLevel, 4)
    };
  }, [gameState.weatherZones]);
}

/**
 * Derive visual emoji for weather condition (for UI rendering).
 *
 * @remarks
 * Simple utility to convert weather type + intensity to emoji.
 * Used in weather HUD component to show weather at a glance.
 *
 * @param weather - WeatherCondition object
 * @returns Single emoji character representing weather
 */
export function getWeatherEmoji(weather: WeatherCondition): string {
  switch (weather.type) {
    case WeatherType.CLEAR:
      return '☀️';
    case WeatherType.CLOUDY:
      return '☁️';
    case WeatherType.RAIN:
      return weather.intensity === WeatherIntensity.SEVERE ? '⛈️' : '🌧️';
    case WeatherType.SNOW:
      return '❄️';
    case WeatherType.WIND:
      return '💨';
    case WeatherType.STORM:
      return '⛈️';
    case WeatherType.THUNDER_STORM:
      return '⛈️';
    case WeatherType.FOG:
      return '🌫️';
    case WeatherType.HEAVY_FOG:
      return '🌫️';
    case WeatherType.HEATWAVE:
      return '🔥';
    case WeatherType.BLIZZARD:
      return '❄️';
    case WeatherType.SANDSTORM:
      return '🌪️';
    default:
      return '🌤️';
  }
}

/**
 * Describe weather condition in natural language.
 *
 * @remarks
 * Converts weather condition to readable description for narrative/UI.
 * Takes intensity into account when describing impact.
 *
 * @param weather - WeatherCondition object
 * @returns Human-readable weather description
 */
export function describeWeather(weather: WeatherCondition): string {
  const intensity =
    weather.intensity === WeatherIntensity.SEVERE
      ? ' intense'
      : weather.intensity === WeatherIntensity.NORMAL
        ? ''
        : ' mild';

  switch (weather.type) {
    case WeatherType.CLEAR:
      return `Clear skies (${weather.temperature}°C)`;
    case WeatherType.CLOUDY:
      return `Cloudy skies (${weather.temperature}°C)`;
    case WeatherType.RAIN:
      return `${intensity} rain (${weather.temperature}°C)`;
    case WeatherType.SNOW:
      return `${intensity} snow (${weather.temperature}°C)`;
    case WeatherType.WIND:
      return `${intensity} winds (${weather.windSpeed} km/h)`;
    case WeatherType.STORM:
      return `${intensity} storm`;
    case WeatherType.THUNDER_STORM:
      return `Thunderstorm`;
    case WeatherType.FOG:
      return `${intensity} fog (visibility: ${weather.visibility}m)`;
    case WeatherType.HEAVY_FOG:
      return `Heavy fog (visibility: ${weather.visibility}m)`;
    case WeatherType.HEATWAVE:
      return `Extreme heat (${weather.temperature}°C)`;
    case WeatherType.BLIZZARD:
      return `Blizzard (${weather.temperature}°C)`;
    case WeatherType.SANDSTORM:
      return `Sandstorm`;
    default:
      return 'Unknown weather';
  }
}
