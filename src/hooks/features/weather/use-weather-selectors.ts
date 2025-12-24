'use client';

import { useMemo } from 'react';
import type { GameState } from '@/core/types/game';
import { WeatherCondition, WeatherType, WeatherIntensity } from '@/core/types/weather';

/**
 * Selector hook for weather-specific state.
 * Extracts only weather-related fields from GameState.
 */
export function useWeatherState(gameState: GameState) {
    return useMemo(() => {
        // Get primary weather from first zone or create default
        const weatherZonesArray = Object.values(gameState.weatherZones || {});
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
