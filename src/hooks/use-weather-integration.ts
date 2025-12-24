'use client';

import { useCallback, useRef } from 'react';
import type { GameState } from '@/core/types/game';
import type { IWeatherUseCase } from '@/core/usecases/weather-usecase';
import type { Effect } from '@/core/types/effects';
import type { WeatherCondition } from '@/core/types/weather';

// Re-export selectors and utils for convenience
export { useWeatherState } from '@/hooks/features/weather/use-weather-selectors';
export { getWeatherEmoji, describeWeather } from '@/lib/game/weather-utils';

/**
 * Integrates WeatherUseCase into the game loop with adaptive updates.
 */
export function useWeatherIntegration(weatherUsecase: IWeatherUseCase) {
  // Track last update time to avoid redundant updates within same frame
  const lastUpdateTimeRef = useRef<number>(-1);

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

        const currentWeather = weatherUsecase.getCurrentWeather();
        const weatherEffects: Effect[] = [];

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

  const applyWeatherToGameState = useCallback(
    (gameState: GameState, _weatherCondition: WeatherCondition, _effects: Effect[]): GameState => {
      try {
        // WeatherEngine in use-game-engine.ts manages the actual state mutations
        // This hook just returns effects to be applied by the game loop
        return gameState;
      } catch (error) {
        console.error('[useWeatherIntegration] Error applying weather state changes:', error);
        return gameState;
      }
    },
    []
  );

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
