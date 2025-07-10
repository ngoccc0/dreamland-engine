import type { BiomeDefinition, Season, SeasonModifiers, Terrain } from "./types";

export const seasonConfig: Record<Season, SeasonModifiers> = {
    spring: { temperatureMod: 0, moistureMod: 2, sunExposureMod: 1, windMod: 1, eventChance: 0.3 },
    summer: { temperatureMod: 3, moistureMod: -1, sunExposureMod: 3, windMod: 0, eventChance: 0.1 },
    autumn: { temperatureMod: -1, moistureMod: 1, sunExposureMod: -1, windMod: 2, eventChance: 0.4 },
    winter: { temperatureMod: -4, moistureMod: -2, sunExposureMod: -3, windMod: 3, eventChance: 0.2 },
};

export const worldConfig: Record<Terrain, BiomeDefinition> = {
    forest: {
        minSize: 10, maxSize: 25, travelCost: 4, spreadWeight: 0.6,
        allowedNeighbors: ['grassland', 'mountain', 'swamp', 'jungle', 'wall', 'tundra', 'mushroom_forest'],
        defaultValueRanges: {
            vegetationDensity: { min: 7, max: 10 }, moisture: { min: 5, max: 8 }, elevation: { min: 1, max: 4 },
            dangerLevel: { min: 4, max: 7 }, magicAffinity: { min: 3, max: 6 }, humanPresence: { min: 0, max: 3 },
            predatorPresence: { min: 5, max: 8 }, temperature: { min: 4, max: 7 },
        },
        soilType: ['loamy'],
    },
    grassland: {
        minSize: 15, maxSize: 30, travelCost: 1, spreadWeight: 0.8,
        allowedNeighbors: ['forest', 'desert', 'swamp', 'jungle', 'wall', 'beach', 'mesa'],
        defaultValueRanges: {
            vegetationDensity: { min: 2, max: 5 }, moisture: { min: 2, max: 5 }, elevation: { min: 0, max: 2 },
            dangerLevel: { min: 1, max: 4 }, magicAffinity: { min: 0, max: 2 }, humanPresence: { min: 2, max: 6 },
            predatorPresence: { min: 2, max: 5 }, temperature: { min: 5, max: 8 },
        },
        soilType: ['loamy', 'sandy'],
    },
    desert: {
        minSize: 12, maxSize: 28, travelCost: 3, spreadWeight: 0.4,
        allowedNeighbors: ['grassland', 'mountain', 'volcanic', 'wall', 'mesa', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 1 }, moisture: { min: 0, max: 1 }, elevation: { min: 0, max: 3 },
            dangerLevel: { min: 5, max: 8 }, magicAffinity: { min: 1, max: 4 }, humanPresence: { min: 0, max: 2 },
            predatorPresence: { min: 6, max: 9 }, temperature: { min: 8, max: 10 },
        },
        soilType: ['sandy'],
    },
    swamp: {
        minSize: 10, maxSize: 20, travelCost: 5, spreadWeight: 0.2,
        allowedNeighbors: ['forest', 'grassland', 'jungle', 'wall', 'floptropica', 'beach', 'mushroom_forest'],
        defaultValueRanges: {
            vegetationDensity: { min: 5, max: 8 }, moisture: { min: 8, max: 10 }, elevation: { min: -1, max: 1 },
            dangerLevel: { min: 7, max: 10 }, magicAffinity: { min: 4, max: 7 }, humanPresence: { min: 0, max: 1 },
            predatorPresence: { min: 7, max: 10 }, temperature: { min: 6, max: 9 },
        },
        soilType: ['clay'],
    },
    mountain: {
        minSize: 10, maxSize: 20, travelCost: 6, spreadWeight: 0.1,
        allowedNeighbors: ['forest', 'desert', 'volcanic', 'wall', 'cave', 'tundra'],
        defaultValueRanges: {
            vegetationDensity: { min: 1, max: 4 }, moisture: { min: 2, max: 5 }, elevation: { min: 5, max: 10 },
            dangerLevel: { min: 6, max: 9 }, magicAffinity: { min: 2, max: 5 }, humanPresence: { min: 1, max: 4 },
            predatorPresence: { min: 4, max: 7 }, temperature: { min: 1, max: 4 },
        },
        soilType: ['rocky'],
    },
    cave: {
        minSize: 15, maxSize: 30, travelCost: 7, spreadWeight: 0.05,
        allowedNeighbors: ['mountain', 'wall', 'mushroom_forest', 'underwater'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 2 }, moisture: { min: 6, max: 9 }, elevation: { min: -10, max: -1 },
            dangerLevel: { min: 8, max: 10 }, magicAffinity: { min: 5, max: 8 }, humanPresence: { min: 0, max: 3 },
            predatorPresence: { min: 8, max: 10 }, temperature: { min: 3, max: 6 },
        },
        soilType: ['rocky'],
    },
    jungle: {
        minSize: 12, maxSize: 25, travelCost: 5, spreadWeight: 0.5,
        allowedNeighbors: ['forest', 'swamp', 'grassland', 'wall', 'floptropica', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 9, max: 10 }, moisture: { min: 8, max: 10 }, elevation: { min: 1, max: 3 },
            dangerLevel: { min: 6, max: 9 }, magicAffinity: { min: 4, max: 8 }, humanPresence: { min: 0, max: 4 },
            predatorPresence: { min: 7, max: 10 }, temperature: { min: 7, max: 10 },
        },
        soilType: ['loamy', 'clay'],
    },
    volcanic: {
        minSize: 8, maxSize: 18, travelCost: 8, spreadWeight: 0.1,
        allowedNeighbors: ['mountain', 'desert', 'wall'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 1 }, moisture: { min: 0, max: 1 }, elevation: { min: 4, max: 8 },
            dangerLevel: { min: 9, max: 10 }, magicAffinity: { min: 6, max: 10 }, humanPresence: { min: 0, max: 1 },
            predatorPresence: { min: 9, max: 10 }, temperature: { min: 9, max: 10 },
        },
        soilType: ['rocky'],
    },
    floptropica: {
        minSize: 10, maxSize: 20, travelCost: 2, spreadWeight: 0.01,
        allowedNeighbors: ['jungle', 'swamp', 'wall', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 8, max: 10 }, moisture: { min: 7, max: 9 }, elevation: { min: 1, max: 3 },
            dangerLevel: { min: 5, max: 8 }, magicAffinity: { min: 8, max: 10 }, humanPresence: { min: 5, max: 10 },
            predatorPresence: { min: 6, max: 9 }, temperature: { min: 7, max: 10 },
        },
        soilType: ['loamy', 'clay'],
    },
    tundra: {
        minSize: 15, maxSize: 30, travelCost: 4, spreadWeight: 0.3,
        allowedNeighbors: ['mountain', 'forest', 'wall', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 1, max: 3 }, moisture: { min: 1, max: 4 }, elevation: { min: 2, max: 5 },
            dangerLevel: { min: 3, max: 6 }, magicAffinity: { min: 1, max: 3 }, humanPresence: { min: 0, max: 2 },
            predatorPresence: { min: 4, max: 7 }, temperature: { min: 0, max: 2 },
        },
        soilType: ['rocky', 'loamy'],
    },
    beach: {
        minSize: 8, maxSize: 18, travelCost: 2, spreadWeight: 0.5,
        allowedNeighbors: ['grassland', 'desert', 'jungle', 'swamp', 'floptropica', 'tundra', 'wall', 'ocean'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 2 }, moisture: { min: 4, max: 7 }, elevation: { min: 0, max: 1 },
            dangerLevel: { min: 1, max: 3 }, magicAffinity: { min: 0, max: 2 }, humanPresence: { min: 1, max: 5 },
            predatorPresence: { min: 1, max: 4 }, temperature: { min: 6, max: 9 },
        },
        soilType: ['sandy'],
    },
    mesa: {
        minSize: 10, maxSize: 25, travelCost: 4, spreadWeight: 0.3,
        allowedNeighbors: ['desert', 'grassland', 'wall'],
        defaultValueRanges: {
            vegetationDensity: { min: 1, max: 3 }, moisture: { min: 1, max: 3 }, elevation: { min: 3, max: 6 },
            dangerLevel: { min: 4, max: 7 }, magicAffinity: { min: 1, max: 4 }, humanPresence: { min: 0, max: 3 },
            predatorPresence: { min: 3, max: 6 }, temperature: { min: 7, max: 10 },
        },
        soilType: ['sandy', 'rocky'],
    },
    mushroom_forest: {
        minSize: 10, maxSize: 20, travelCost: 4, spreadWeight: 0.15,
        allowedNeighbors: ['forest', 'swamp', 'cave', 'wall'],
        defaultValueRanges: {
            vegetationDensity: { min: 6, max: 9 }, moisture: { min: 7, max: 9 }, elevation: { min: -2, max: 2 },
            dangerLevel: { min: 5, max: 8 }, magicAffinity: { min: 7, max: 10 }, humanPresence: { min: 0, max: 1 },
            predatorPresence: { min: 4, max: 7 }, temperature: { min: 4, max: 7 },
        },
        soilType: ['loamy', 'clay'],
    },
    ocean: {
        minSize: 20, maxSize: 40, travelCost: 99, spreadWeight: 0.2,
        allowedNeighbors: ['beach', 'wall', 'underwater'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 0 }, moisture: { min: 10, max: 10 }, elevation: { min: -5, max: -1 },
            dangerLevel: { min: 4, max: 7 }, magicAffinity: { min: 1, max: 4 }, humanPresence: { min: 0, max: 2 },
            predatorPresence: { min: 7, max: 10 }, temperature: { min: 5, max: 9 },
        },
        soilType: ['sandy'],
    },
    wall: {
        minSize: 1, maxSize: 1, travelCost: 999, spreadWeight: 0,
        allowedNeighbors: ['forest', 'grassland', 'desert', 'swamp', 'mountain', 'cave', 'jungle', 'volcanic', 'wall', 'floptropica', 'tundra', 'beach', 'mesa', 'mushroom_forest', 'ocean', 'city', 'space_station', 'underwater'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 0 }, moisture: { min: 0, max: 0 }, elevation: { min: 5, max: 5 },
            dangerLevel: { min: 0, max: 0 }, magicAffinity: { min: 0, max: 0 }, humanPresence: { min: 0, max: 0 },
            predatorPresence: { min: 0, max: 0 }, temperature: { min: 5, max: 5 },
        },
        soilType: ['rocky'],
    },
    city: {
        minSize: 15, maxSize: 30, travelCost: 1, spreadWeight: 0.5,
        allowedNeighbors: ['grassland', 'wall', 'beach'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 2 }, moisture: { min: 1, max: 4 }, elevation: { min: 0, max: 2 },
            dangerLevel: { min: 3, max: 8 }, magicAffinity: { min: 1, max: 5 }, humanPresence: { min: 8, max: 10 },
            predatorPresence: { min: 1, max: 3 }, temperature: { min: 5, max: 8 },
        },
        soilType: ['rocky', 'sandy'],
    },
    space_station: {
        minSize: 20, maxSize: 35, travelCost: 2, spreadWeight: 0.1,
        allowedNeighbors: ['wall'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 1 }, moisture: { min: 0, max: 1 }, elevation: { min: 10, max: 10 },
            dangerLevel: { min: 5, max: 9 }, magicAffinity: { min: 2, max: 6 }, humanPresence: { min: 1, max: 10 },
            predatorPresence: { min: 2, max: 5 }, temperature: { min: 5, max: 5 },
        },
        soilType: ['metal'],
    },
    underwater: {
        minSize: 15, maxSize: 30, travelCost: 6, spreadWeight: 0.2,
        allowedNeighbors: ['ocean', 'wall', 'cave'],
        defaultValueRanges: {
            vegetationDensity: { min: 3, max: 8 }, moisture: { min: 10, max: 10 }, elevation: { min: -10, max: -3 },
            dangerLevel: { min: 6, max: 9 }, magicAffinity: { min: 5, max: 9 }, humanPresence: { min: 0, max: 3 },
            predatorPresence: { min: 6, max: 9 }, temperature: { min: 2, max: 5 },
        },
        soilType: ['sandy', 'rocky'],
    }
};