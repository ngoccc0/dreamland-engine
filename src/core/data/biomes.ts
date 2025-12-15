import { worldConfig } from './biome-config';
import type { BiomeDefinition, Terrain } from "@/core/types/game";

// Minimal emoji map for common terrains — can be extended or overridden by mods
const emojiMap: Record<string, string> = {
  forest: '🌲',
  grassland: '🌾',
  desert: '🏜️',
  swamp: '🦆',
  mountain: '⛰️',
  cave: '🕳️',
  jungle: '🌴',
  volcanic: '🌋',
  floptropica: '🏝️',
  wall: '🧱',
  tundra: '❄️',
  beach: '🏖️',
  mesa: '🪨',
  mushroom_forest: '🍄',
  ocean: '🌊',
  city: '🏙️',
  space_station: '🛰️',
  underwater: '🐠',
};

export const biomeDefinitions: Record<string, BiomeDefinition> = Object.fromEntries(
  Object.entries(worldConfig).map(([key, val]) => {
    const def: BiomeDefinition = {
      id: key,
      travelCost: (val as any).travelCost ?? 1,
      minSize: (val as any).minSize ?? 1,
      maxSize: (val as any).maxSize ?? 1,
      spreadWeight: (val as any).spreadWeight ?? 1,
      allowedNeighbors: (val as any).allowedNeighbors ?? [],
      defaultValueRanges: (val as any).defaultValueRanges ?? {},
      soilType: (val as any).soilType ?? [],
      templates: (val as any).templates,
      emoji: emojiMap[key] ?? undefined,
    } as BiomeDefinition;
    return [key, def];
  })
);

export default biomeDefinitions;
