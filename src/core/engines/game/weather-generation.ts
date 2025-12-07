import type { WeatherState, Season, Terrain, Chunk, WeatherZone } from '@/core/types/game';
import { weatherPresets } from '@/lib/game/weatherPresets';
import { clamp } from '@/lib/utils';
import { isDay } from '@/lib/game/time/time-utils'; // Import isDay from new time utilities

import { maybeDebug } from '@/lib/debug';

export const generateWeatherForZone = (terrain: Terrain, season: Season, previousWeather?: WeatherState): WeatherState => {
    maybeDebug('generateWeatherForZone');
    let candidateWeather = weatherPresets.filter(
        w => w.biome_affinity.includes(terrain) &&
            w.season_affinity.includes(season)
    );

    // Cooldown logic to prevent back-to-back extreme weather
    if (previousWeather) {
        const extremeTags = ['storm', 'heat', 'cold'];
        const previousIsExtreme = previousWeather.exclusive_tags.some(tag => extremeTags.includes(tag));
        if (previousIsExtreme) {
            candidateWeather = candidateWeather.filter(w => !w.exclusive_tags.some(tag => extremeTags.includes(tag)));
        }
    }

    if (candidateWeather.length === 0) {
        return weatherPresets.find(w => w.id === 'clear')!;
    }

    const totalWeight = candidateWeather.reduce((sum, w) => sum + w.spawnWeight, 0);
    let random = Math.random() * totalWeight;

    for (const weather of candidateWeather) {
        random -= weather.spawnWeight;
        if (random <= 0) {
            return weather;
        }
    }

    return candidateWeather[0];
};

export function getEffectiveChunk(baseChunk: Chunk, weatherZones: Record<string, WeatherZone>, gameTime: number, startTime: number, dayDuration: number): Chunk {
    const effectiveChunk = { ...baseChunk };
    const weatherZone = weatherZones[baseChunk.regionId];
    if (weatherZone) {
        const weather = weatherZone.currentWeather;
        // Temperature range: -30°C to +50°C (realistic scale)
        effectiveChunk.temperature = clamp((effectiveChunk.temperature ?? 20) + weather.temperature_delta, -30, 50);
        effectiveChunk.moisture = clamp(effectiveChunk.moisture + weather.moisture_delta, 0, 100);
        effectiveChunk.lightLevel = clamp(effectiveChunk.lightLevel + weather.light_delta, -100, 100);
        effectiveChunk.windLevel = clamp((effectiveChunk.windLevel ?? 0) + weather.wind_delta, 0, 100);
    }

    const isCurrentDay = isDay(gameTime, startTime, dayDuration);
    if (!isCurrentDay && baseChunk.terrain !== 'cave') {
        effectiveChunk.lightLevel = Math.min(effectiveChunk.lightLevel, -20);
    }

    return effectiveChunk;
}
