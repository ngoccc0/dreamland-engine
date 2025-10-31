/**
 * Central hub for accessing narrative templates.
 * This file aggregates biome-specific template data from various modular files.
 * It provides a single function, `getTemplates`, to retrieve the correct set of templates
 * based on the current game language. This architecture allows for easy expansion and modding
 * of narrative content.
 */

import type { Language } from "./types";
import { forest_vi, forest_en } from './templates/forest';
import { grassland_vi, grassland_en } from './templates/grassland';
import { desert_vi, desert_en } from './templates/desert';
import { swamp_vi, swamp_en } from './templates/swamp';
import { mountain_vi, mountain_en } from './templates/mountain';
import { cave_vi, cave_en } from './templates/cave';
import { jungle_vi, jungle_en } from './templates/jungle';
import { volcanic_vi, volcanic_en } from './templates/volcanic';
import { wall_vi, wall_en } from './templates/wall';
import { floptropica_vi, floptropica_en } from './templates/floptropica';
import { tundra_vi, tundra_en } from "./templates/tundra";
import { beach_vi, beach_en } from "./templates/beach";
import { mesa_vi, mesa_en } from "./templates/mesa";
import { mushroom_forest_vi, mushroom_forest_en } from "./templates/mushroom";
import { ocean_vi, ocean_en } from "./templates/ocean";
import { city_vi, city_en } from "./templates/city";
import { space_station_vi, space_station_en } from "./templates/space_station";
import { underwater_vi, underwater_en } from "./templates/underwater";
import type { Terrain } from './types';


const templates_vi: Record<Terrain, any> = {
    forest: forest_vi,
    grassland: grassland_vi,
    desert: desert_vi,
    swamp: swamp_vi,
    mountain: mountain_vi,
    cave: cave_vi,
    jungle: jungle_vi,
    volcanic: volcanic_vi,
    wall: wall_vi,
    floptropica: floptropica_vi,
    tundra: tundra_vi,
    beach: beach_vi,
    mesa: mesa_vi,
    mushroom_forest: mushroom_forest_vi,
    ocean: ocean_vi,
    city: city_vi,
    space_station: space_station_vi,
    underwater: underwater_vi,
};

const templates_en: Record<Terrain, any> = {
    forest: forest_en,
    grassland: grassland_en,
    desert: desert_en,
    swamp: swamp_en,
    mountain: mountain_en,
    cave: cave_en,
    jungle: jungle_en,
    volcanic: volcanic_en,
    wall: wall_en,
    floptropica: floptropica_en,
    tundra: tundra_en,
    beach: beach_en,
    mesa: mesa_en,
    mushroom_forest: mushroom_forest_en,
    ocean: ocean_en,
    city: city_en,
    space_station: space_station_en,
    underwater: underwater_en,
};

/**
 * Retrieves the appropriate set of narrative templates for the game.
 * @param {Language} language The language for which to get templates.
 * @returns {Record<Terrain, any>} An object containing all biome-specific narrative templates for the given language.
 */
export const getTemplates = (language: Language): Record<Terrain, any> => {
    return language === 'vi' ? templates_vi : templates_en;
};
