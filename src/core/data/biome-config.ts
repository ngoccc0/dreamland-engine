import type { BiomeDefinition, Season, SeasonModifiers, Terrain } from "@/core/types/game";

/**
 * OVERVIEW: Season modifiers as PERCENTAGES of biome temperature range.
 * Formula: finalTemp = baseTemp × (1 + seasonModPercent)
 * Example: Desert base 35-50°C, summer +20% = 42-60°C (clamped to 50°C max)
 */
export const seasonConfig: Record<Season, SeasonModifiers> = {
    spring: { temperatureMod: 0.1, moistureMod: 2, sunExposureMod: 1, windMod: 1, eventChance: 0.3 },      // +10%
    summer: { temperatureMod: 0.2, moistureMod: -1, sunExposureMod: 3, windMod: 0, eventChance: 0.1 },     // +20%
    autumn: { temperatureMod: -0.1, moistureMod: 1, sunExposureMod: -1, windMod: 2, eventChance: 0.4 },    // -10%
    winter: { temperatureMod: -0.25, moistureMod: -2, sunExposureMod: -3, windMod: 3, eventChance: 0.2 },  // -25%
};

// --- TEMPERATURE RANGE: -30°C to +50°C (REALISTIC SCALE, PERCENTAGE-BASED MODIFIERS) ---
export const worldConfig: Record<Terrain, Omit<BiomeDefinition, 'id' | 'templates'>> = {
    forest: {
        minSize: 10, maxSize: 25, travelCost: 4, spreadWeight: 0.6,
        allowedNeighbors: ['grassland', 'mountain', 'swamp', 'jungle', 'wall', 'tundra', 'mushroom_forest'],
        defaultValueRanges: {
            vegetationDensity: { min: 70, max: 100 }, moisture: { min: 50, max: 80 }, elevation: { min: 10, max: 40 },
            dangerLevel: { min: 40, max: 70 }, magicAffinity: { min: 30, max: 60 }, humanPresence: { min: 0, max: 30 },
            predatorPresence: { min: 50, max: 80 }, temperature: { min: 10, max: 25 },
        },
        soilType: ['loamy'],
    },
    grassland: {
        minSize: 15, maxSize: 30, travelCost: 1, spreadWeight: 0.8,
        allowedNeighbors: ['forest', 'desert', 'swamp', 'jungle', 'wall', 'beach', 'mesa'],
        defaultValueRanges: {
            vegetationDensity: { min: 20, max: 50 }, moisture: { min: 20, max: 50 }, elevation: { min: 0, max: 20 },
            dangerLevel: { min: 10, max: 40 }, magicAffinity: { min: 0, max: 20 }, humanPresence: { min: 20, max: 60 },
            predatorPresence: { min: 20, max: 50 }, temperature: { min: 15, max: 30 },
        },
        soilType: ['loamy', 'sandy'],
    },
    desert: {
        minSize: 12, maxSize: 28, travelCost: 3, spreadWeight: 0.4,
        allowedNeighbors: ['grassland', 'mountain', 'volcanic', 'wall', 'mesa', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 10 }, moisture: { min: 0, max: 10 }, elevation: { min: 0, max: 30 },
            dangerLevel: { min: 50, max: 80 }, magicAffinity: { min: 10, max: 40 }, humanPresence: { min: 0, max: 20 },
            predatorPresence: { min: 60, max: 90 }, temperature: { min: 35, max: 50 },
        },
        soilType: ['sandy'],
    },
    swamp: {
        minSize: 10, maxSize: 20, travelCost: 5, spreadWeight: 0.2,
        allowedNeighbors: ['forest', 'grassland', 'jungle', 'wall', 'floptropica', 'beach', 'mushroom_forest'],
        defaultValueRanges: {
            vegetationDensity: { min: 50, max: 80 }, moisture: { min: 80, max: 100 }, elevation: { min: -10, max: 10 },
            dangerLevel: { min: 70, max: 100 }, magicAffinity: { min: 40, max: 70 }, humanPresence: { min: 0, max: 10 },
            predatorPresence: { min: 70, max: 100 }, temperature: { min: 20, max: 32 },
        },
        soilType: ['clay'],
    },
    mountain: {
        minSize: 10, maxSize: 20, travelCost: 6, spreadWeight: 0.1,
        allowedNeighbors: ['forest', 'desert', 'volcanic', 'wall', 'cave', 'tundra'],
        defaultValueRanges: {
            vegetationDensity: { min: 10, max: 40 }, moisture: { min: 20, max: 50 }, elevation: { min: 50, max: 100 },
            dangerLevel: { min: 60, max: 90 }, magicAffinity: { min: 20, max: 50 }, humanPresence: { min: 10, max: 40 },
            predatorPresence: { min: 40, max: 70 }, temperature: { min: -5, max: 15 },
        },
        soilType: ['rocky'],
    },
    cave: {
        minSize: 15, maxSize: 30, travelCost: 7, spreadWeight: 0.05,
        allowedNeighbors: ['mountain', 'wall', 'mushroom_forest', 'underwater'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 20 }, moisture: { min: 60, max: 90 }, elevation: { min: -100, max: -10 },
            dangerLevel: { min: 80, max: 100 }, magicAffinity: { min: 50, max: 80 }, humanPresence: { min: 0, max: 30 },
            predatorPresence: { min: 80, max: 100 }, temperature: { min: 5, max: 15 },
        },
        soilType: ['rocky'],
    },
    jungle: {
        minSize: 12, maxSize: 25, travelCost: 5, spreadWeight: 0.5,
        allowedNeighbors: ['forest', 'swamp', 'grassland', 'wall', 'floptropica', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 90, max: 100 }, moisture: { min: 80, max: 100 }, elevation: { min: 10, max: 30 },
            dangerLevel: { min: 60, max: 90 }, magicAffinity: { min: 40, max: 80 }, humanPresence: { min: 0, max: 40 },
            predatorPresence: { min: 70, max: 100 }, temperature: { min: 28, max: 40 },
        },
        soilType: ['loamy', 'clay'],
    },
    volcanic: {
        minSize: 8, maxSize: 18, travelCost: 8, spreadWeight: 0.1,
        allowedNeighbors: ['mountain', 'desert', 'wall'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 10 }, moisture: { min: 0, max: 10 }, elevation: { min: 40, max: 80 },
            dangerLevel: { min: 90, max: 100 }, magicAffinity: { min: 60, max: 100 }, humanPresence: { min: 0, max: 10 },
            predatorPresence: { min: 90, max: 100 }, temperature: { min: 40, max: 50 },
        },
        soilType: ['rocky'],
    },
    floptropica: {
        minSize: 10, maxSize: 20, travelCost: 2, spreadWeight: 0.01,
        allowedNeighbors: ['jungle', 'swamp', 'wall', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 80, max: 100 }, moisture: { min: 70, max: 90 }, elevation: { min: 10, max: 30 },
            dangerLevel: { min: 50, max: 80 }, magicAffinity: { min: 80, max: 100 }, humanPresence: { min: 50, max: 100 },
            predatorPresence: { min: 60, max: 90 }, temperature: { min: 30, max: 45 },
        },
        soilType: ['loamy', 'clay'],
    },
    tundra: {
        minSize: 15, maxSize: 30, travelCost: 4, spreadWeight: 0.3,
        allowedNeighbors: ['mountain', 'forest', 'wall', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 10, max: 30 }, moisture: { min: 10, max: 40 }, elevation: { min: 20, max: 50 },
            dangerLevel: { min: 30, max: 60 }, magicAffinity: { min: 10, max: 30 }, humanPresence: { min: 0, max: 20 },
            predatorPresence: { min: 40, max: 70 }, temperature: { min: -20, max: 0 },
        },
        soilType: ['rocky', 'loamy'],
    },
    beach: {
        minSize: 8, maxSize: 18, travelCost: 2, spreadWeight: 0.5,
        allowedNeighbors: ['grassland', 'desert', 'jungle', 'swamp', 'floptropica', 'tundra', 'wall', 'ocean'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 20 }, moisture: { min: 40, max: 70 }, elevation: { min: 0, max: 10 },
            dangerLevel: { min: 10, max: 30 }, magicAffinity: { min: 0, max: 20 }, humanPresence: { min: 10, max: 50 },
            predatorPresence: { min: 10, max: 40 }, temperature: { min: 18, max: 28 },
        },
        soilType: ['sandy'],
    },
    mesa: {
        minSize: 10, maxSize: 25, travelCost: 4, spreadWeight: 0.3,
        allowedNeighbors: ['desert', 'grassland', 'wall'],
        defaultValueRanges: {
            vegetationDensity: { min: 10, max: 30 }, moisture: { min: 10, max: 30 }, elevation: { min: 30, max: 60 },
            dangerLevel: { min: 40, max: 70 }, magicAffinity: { min: 10, max: 40 }, humanPresence: { min: 0, max: 30 },
            predatorPresence: { min: 30, max: 60 }, temperature: { min: 30, max: 45 },
        },
        soilType: ['sandy', 'rocky'],
    },
    mushroom_forest: {
        minSize: 10, maxSize: 20, travelCost: 4, spreadWeight: 0.15,
        allowedNeighbors: ['forest', 'swamp', 'cave', 'wall'],
        defaultValueRanges: {
            vegetationDensity: { min: 60, max: 90 }, moisture: { min: 70, max: 90 }, elevation: { min: -20, max: 20 },
            dangerLevel: { min: 50, max: 80 }, magicAffinity: { min: 70, max: 100 }, humanPresence: { min: 0, max: 10 },
            predatorPresence: { min: 40, max: 70 }, temperature: { min: 8, max: 18 },
        },
        soilType: ['loamy', 'clay'],
    },
    ocean: {
        minSize: 20, maxSize: 40, travelCost: 99, spreadWeight: 0.2,
        allowedNeighbors: ['beach', 'wall', 'underwater'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 0 }, moisture: { min: 100, max: 100 }, elevation: { min: -50, max: -10 },
            dangerLevel: { min: 40, max: 70 }, magicAffinity: { min: 10, max: 40 }, humanPresence: { min: 0, max: 20 },
            predatorPresence: { min: 70, max: 100 }, temperature: { min: 12, max: 25 },
        },
        soilType: ['sandy'],
    },
    wall: {
        minSize: 1, maxSize: 1, travelCost: 999, spreadWeight: 0,
        allowedNeighbors: ['forest', 'grassland', 'desert', 'swamp', 'mountain', 'cave', 'jungle', 'volcanic', 'wall', 'floptropica', 'tundra', 'beach', 'mesa', 'mushroom_forest', 'ocean', 'city', 'space_station', 'underwater'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 0 }, moisture: { min: 0, max: 0 }, elevation: { min: 50, max: 50 },
            dangerLevel: { min: 0, max: 0 }, magicAffinity: { min: 0, max: 0 }, humanPresence: { min: 0, max: 0 },
            predatorPresence: { min: 0, max: 0 }, temperature: { min: 20, max: 20 },
        },
        soilType: ['rocky'],
    },
    city: {
        minSize: 15, maxSize: 30, travelCost: 1, spreadWeight: 0.5,
        allowedNeighbors: ['grassland', 'wall', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 20 }, moisture: { min: 10, max: 40 }, elevation: { min: 0, max: 20 },
            dangerLevel: { min: 30, max: 80 }, magicAffinity: { min: 10, max: 50 }, humanPresence: { min: 80, max: 100 },
            predatorPresence: { min: 10, max: 30 }, temperature: { min: 10, max: 25 },
        },
        soilType: ['rocky', 'sandy'],
    },
    space_station: {
        minSize: 20, maxSize: 35, travelCost: 2, spreadWeight: 0.1,
        allowedNeighbors: ['wall'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 10 }, moisture: { min: 0, max: 10 }, elevation: { min: 100, max: 100 },
            dangerLevel: { min: 50, max: 90 }, magicAffinity: { min: 20, max: 60 }, humanPresence: { min: 10, max: 100 },
            predatorPresence: { min: 20, max: 50 }, temperature: { min: 18, max: 24 },
        },
        soilType: ['metal'],
    },
    underwater: {
        minSize: 15, maxSize: 30, travelCost: 6, spreadWeight: 0.2,
        allowedNeighbors: ['ocean', 'wall', 'cave'],
        defaultValueRanges: {
            vegetationDensity: { min: 30, max: 80 }, moisture: { min: 100, max: 100 }, elevation: { min: -100, max: -30 },
            dangerLevel: { min: 60, max: 90 }, magicAffinity: { min: 50, max: 90 }, humanPresence: { min: 0, max: 30 },
            predatorPresence: { min: 60, max: 90 }, temperature: { min: 10, max: 20 },
        },
        soilType: ['sandy', 'rocky'],
    }
};
