import type { WeatherState } from "./types";

export const weatherPresets: WeatherState[] = [
    // --- NEUTRAL ---
    {
        name: 'Clear Skies',
        description: 'weatherClearSkiesDesc',
        biome_affinity: ['forest', 'grassland', 'desert', 'swamp', 'mountain', 'jungle', 'tundra', 'beach', 'mesa', 'floating_islands'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0,
        moisture_delta: 0,
        wind_delta: 0,
        light_delta: 0,
        spawnWeight: 10,
        exclusive_tags: [],
        duration_range: [20, 40]
    },

    // --- POSITIVE/MILD ---
    {
        name: 'Gentle Breeze',
        description: 'weatherGentleBreezeDesc',
        biome_affinity: ['grassland', 'mountain', 'forest', 'jungle', 'beach', 'mesa', 'floating_islands'],
        season_affinity: ['spring', 'summer'],
        temperature_delta: -1,
        moisture_delta: 0,
        wind_delta: 2,
        light_delta: 0,
        spawnWeight: 8,
        exclusive_tags: ['windy'],
        duration_range: [10, 20]
    },
    {
        name: 'Light Rain',
        description: 'weatherLightRainDesc',
        biome_affinity: ['forest', 'grassland', 'swamp', 'jungle', 'mushroom_forest', 'beach'],
        season_affinity: ['spring', 'autumn'],
        temperature_delta: -2,
        moisture_delta: 2,
        wind_delta: 1,
        light_delta: -1,
        spawnWeight: 7,
        exclusive_tags: ['rain'],
        duration_range: [15, 30]
    },

    // --- NEGATIVE/HARSH ---
    {
        name: 'Heavy Rain',
        description: 'weatherHeavyRainDesc',
        biome_affinity: ['forest', 'swamp', 'jungle', 'mushroom_forest'],
        season_affinity: ['spring', 'autumn'],
        temperature_delta: -3,
        moisture_delta: 4,
        wind_delta: 3,
        light_delta: -3,
        spawnWeight: 4,
        exclusive_tags: ['rain', 'storm'],
        duration_range: [10, 20]
    },
    {
        name: 'Thick Fog',
        description: 'weatherThickFogDesc',
        biome_affinity: ['swamp', 'forest', 'mountain', 'jungle', 'tundra', 'corrupted_lands', 'mushroom_forest'],
        season_affinity: ['autumn', 'winter', 'spring'],
        temperature_delta: -1,
        moisture_delta: 1,
        wind_delta: -2,
        light_delta: -4,
        spawnWeight: 5,
        exclusive_tags: ['fog'],
        duration_range: [20, 35]
    },
    {
        name: 'Scorching Sun',
        description: 'weatherScorchingSunDesc',
        biome_affinity: ['desert', 'grassland', 'volcanic', 'mesa', 'beach'],
        season_affinity: ['summer'],
        temperature_delta: 4,
        moisture_delta: -3,
        wind_delta: 0,
        light_delta: 2,
        spawnWeight: 6,
        exclusive_tags: ['heat'],
        duration_range: [15, 25]
    },
    {
        name: 'Snowfall',
        description: 'weatherSnowfallDesc',
        biome_affinity: ['mountain', 'forest', 'tundra'],
        season_affinity: ['winter'],
        temperature_delta: -5,
        moisture_delta: 1,
        wind_delta: 1,
        light_delta: -1,
        spawnWeight: 7,
        exclusive_tags: ['snow', 'cold'],
        duration_range: [20, 40]
    },
    {
        name: 'Blizzard',
        description: 'weatherBlizzardDesc',
        biome_affinity: ['mountain', 'tundra'],
        season_affinity: ['winter'],
        temperature_delta: -8,
        moisture_delta: 2,
        wind_delta: 6,
        light_delta: -5,
        spawnWeight: 2,
        exclusive_tags: ['snow', 'cold', 'storm', 'windy'],
        duration_range: [10, 20]
    },
    {
        name: 'Sandstorm',
        description: 'weatherSandstormDesc',
        biome_affinity: ['desert', 'mesa', 'beach'],
        season_affinity: ['summer', 'autumn'],
        temperature_delta: 1,
        moisture_delta: -2,
        wind_delta: 7,
        light_delta: -4,
        spawnWeight: 3,
        exclusive_tags: ['windy', 'storm'],
        duration_range: [10, 20]
    },
    
    // --- SPECIAL BIOME WEATHER ---
    {
        name: 'Damp Stillness',
        description: 'weatherDampStillnessDesc',
        biome_affinity: ['cave'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0,
        moisture_delta: 1,
        wind_delta: -5,
        light_delta: 0,
        spawnWeight: 10,
        exclusive_tags: [],
        duration_range: [30, 60]
    },
    {
        name: 'Mysterious Draft',
        description: 'weatherMysteriousDraftDesc',
        biome_affinity: ['cave'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: -2,
        moisture_delta: 0,
        wind_delta: 2,
        light_delta: 0,
        spawnWeight: 5,
        exclusive_tags: ['windy'],
        duration_range: [15, 30]
    },
    {
        name: 'Ashfall',
        description: 'weatherAshfallDesc',
        biome_affinity: ['volcanic', 'corrupted_lands'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 1,
        moisture_delta: -1,
        wind_delta: 1,
        light_delta: -3,
        spawnWeight: 8,
        exclusive_tags: ['ash'],
        duration_range: [15, 30]
    },
    {
        name: 'Spore Cloud',
        description: 'weatherSporeCloudDesc',
        biome_affinity: ['mushroom_forest'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: 0,
        moisture_delta: 1,
        wind_delta: 0,
        light_delta: 2,
        spawnWeight: 9,
        exclusive_tags: ['spores', 'magic'],
        duration_range: [20, 40]
    },
    {
        name: 'Shadowy Haze',
        description: 'weatherShadowyHazeDesc',
        biome_affinity: ['corrupted_lands'],
        season_affinity: ['spring', 'summer', 'autumn', 'winter'],
        temperature_delta: -3,
        moisture_delta: 0,
        wind_delta: 1,
        light_delta: -7,
        spawnWeight: 9,
        exclusive_tags: ['darkness', 'magic', 'cold'],
        duration_range: [25, 50]
    }
];
