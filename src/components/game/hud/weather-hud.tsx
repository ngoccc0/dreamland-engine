'use client';

import React from 'react';
import type { GameState } from '@/core/types/game';
import { useWeatherState, getWeatherEmoji, describeWeather } from '@/hooks/use-weather-integration';

interface WeatherHUDProps {
  gameState: GameState;
  compact?: boolean; // If true, show only emoji; if false, show full details
}

/**
 * Weather HUD component - displays current weather condition.
 *
 * @remarks
 * **Layout:**
 * - **Full Mode** (default): Shows emoji, weather name, temperature, visibility indicator
 * - **Compact Mode**: Shows only weather emoji (for toolbar)
 *
 * **Styling:**
 * - Uses Tailwind with responsive breakpoints
 * - Icon/emoji changes based on weather type
 * - Color coding: Blue (rain), Red (heat), White (snow), Gray (fog/storm)
 * - Shows hazard level as visual indicator
 *
 * **Accessibility:**
 * - Uses aria-label with full weather description
 * - Semantic HTML with heading
 *
 * **Props:**
 * - `gameState`: Full game state (selector hook extracts weather subset)
 * - `compact`: If true, renders minimal version (emoji only)
 *
 * @example
 * // Full weather display
 * <WeatherHUD gameState={gameState} />
 *
 * // Compact emoji only (for toolbar)
 * <WeatherHUD gameState={gameState} compact />
 */
export function WeatherHUD({ gameState, compact = false }: WeatherHUDProps) {
  const weatherState = useWeatherState(gameState);
  const { primaryWeather, hazardLevel, isStormy, isFoggy, isHot, isCold } = weatherState;

  const emoji = getWeatherEmoji(primaryWeather);
  const description = describeWeather(primaryWeather);

  // Color based on hazard level
  const hazardColor = {
    0: 'text-green-600',
    1: 'text-yellow-600',
    2: 'text-orange-600',
    3: 'text-red-600',
    4: 'text-red-800'
  }[hazardLevel];

  if (compact) {
    return (
      <button
        className="relative w-10 h-10 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
        aria-label={description}
        title={description}
      >
        <span className="text-xl">{emoji}</span>
        {hazardLevel > 0 && (
          <div
            className={`absolute top-0 right-0 w-2 h-2 rounded-full ${hazardLevel >= 4
              ? 'bg-red-800'
              : hazardLevel >= 3
                ? 'bg-red-600'
                : hazardLevel >= 2
                  ? 'bg-orange-600'
                  : 'bg-yellow-600'
              }`}
          />
        )}
      </button>
    );
  }

  // Full mode with details
  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h3 className="font-semibold text-blue-900">{primaryWeather.type}</h3>
          <p className={`text-sm ${hazardColor}`}>{description}</p>
        </div>
      </div>

      {/* Weather details grid */}
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div className="bg-white bg-opacity-60 rounded px-2 py-1">
          <span className="text-gray-600">Temp:</span>
          <span
            className={`ml-1 font-mono ${isHot ? 'text-red-600' : isCold ? 'text-blue-600' : 'text-gray-700'}`}
          >
            {primaryWeather.temperature}°C
          </span>
        </div>
        <div className="bg-white bg-opacity-60 rounded px-2 py-1">
          <span className="text-gray-600">Visibility:</span>
          <span className={`ml-1 font-mono ${isFoggy ? 'text-gray-600' : 'text-gray-700'}`}>
            {primaryWeather.visibility}%
          </span>
        </div>
        <div className="bg-white bg-opacity-60 rounded px-2 py-1">
          <span className="text-gray-600">Wind:</span>
          <span className="ml-1 font-mono text-gray-700">{primaryWeather.windSpeed} km/h</span>
        </div>
        <div className="bg-white bg-opacity-60 rounded px-2 py-1">
          <span className="text-gray-600">Precip:</span>
          <span className="ml-1 font-mono text-gray-700">{primaryWeather.precipitation}%</span>
        </div>
      </div>

      {/* Hazard indicator */}
      {hazardLevel > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Hazard:</span>
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i < hazardLevel
                  ? hazardLevel >= 3
                    ? 'bg-red-600'
                    : hazardLevel >= 2
                      ? 'bg-orange-600'
                      : 'bg-yellow-600'
                  : 'bg-gray-300'
                  }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active effects */}
      {(isStormy || isFoggy || isHot || isCold) && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-gray-600 font-medium mb-1">Active Effects:</p>
          <ul className="text-xs space-y-1">
            {isStormy && <li>⚠️ Reduced visibility, wind hazard</li>}
            {isFoggy && <li>🌫️ Heavy fog - limited sight range</li>}
            {isHot && <li>🔥 High temperature - stamina drains faster</li>}
            {isCold && <li>❄️ Low temperature - movement slowed</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
