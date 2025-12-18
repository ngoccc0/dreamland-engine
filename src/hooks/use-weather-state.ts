'use client';

import { useMemo } from 'react';
import type { GameState } from '@/core/types/game';
import { WeatherType, type WeatherCondition, WeatherIntensity } from '@/core/types/weather';

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
