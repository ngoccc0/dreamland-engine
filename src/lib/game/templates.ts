
import type { Language, Terrain } from "./types";
import { forest_vi, forest_en } from './templates/forest';
import { grassland_vi, grassland_en } from './templates/grassland';
import { desert_vi, desert_en } from './templates/desert';
import { swamp_vi, swamp_en } from './templates/swamp';
import { mountain_vi, mountain_en } from './templates/mountain';
import { cave_vi, cave_en } from './templates/cave';
import { jungle_vi, jungle_en } from './templates/jungle';
import { volcanic_vi, volcanic_en } from './templates/volcanic';
import { wall_vi, wall_en } from './templates/wall';

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
};

export const getTemplates = (lang: Language): Record<Terrain, any> => {
  if (lang === 'vi') {
    return templates_vi;
  }
  return templates_en;
};
