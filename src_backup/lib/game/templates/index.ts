

import type { Language, Terrain } from "../types";
import { forest_vi, forest_en } from './forest';
import { grassland_vi, grassland_en } from './grassland';
import { desert_vi, desert_en } from './desert';
import { swamp_vi, swamp_en } from './swamp';
import { mountain_vi, mountain_en } from './mountain';
import { cave_vi, cave_en } from './cave';
import { jungle_vi, jungle_en } from './jungle';
import { volcanic_vi, volcanic_en } from './volcanic';
import { wall_vi, wall_en } from './wall';
import { floptropica_vi, floptropica_en } from './floptropica';
import { tundra_vi, tundra_en } from "./tundra";
import { beach_vi, beach_en } from "./beach";
import { mesa_vi, mesa_en } from "./mesa";
import { mushroom_forest_vi, mushroom_forest_en } from "./mushroom";
import { ocean_vi, ocean_en } from "./ocean";
import { city_vi, city_en } from "./city";
import { space_station_vi, space_station_en } from "./space_station";
import { underwater_vi, underwater_en } from "./underwater";

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

export const getTemplates = (lang: Language): Record<Terrain, any> => {
  if (lang === 'vi') {
    return templates_vi;
  }
  return templates_en;
};
