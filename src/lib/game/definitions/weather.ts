
import { z } from 'zod';
import { MultilingualTextSchema } from './base';
import type { Terrain, Season } from '../types';

// The main schema for defining a weather state.
export const WeatherDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the weather state, e.g., 'light_rain'."),
  name: MultilingualTextSchema,
  description: MultilingualTextSchema,
  biome_affinity: z.array(z.custom<Terrain>()).describe("List of biomes where this weather can occur."),
  season_affinity: z.array(z.custom<Season>()).describe("List of seasons where this weather can occur."),
  temperature_delta: z.number().describe("How much this weather changes the chunk's temperature."),
  moisture_delta: z.number().describe("How much this weather changes the chunk's moisture level."),
  wind_delta: z.number().describe("How much this weather changes the chunk's wind level."),
  light_delta: z.number().describe("How much this weather changes the chunk's light level."),
  spawnWeight: z.number().describe("How likely this weather is to be chosen relative to others."),
  exclusive_tags: z.array(z.string()).describe("Tags to prevent illogical combinations (e.g., 'rain', 'storm')."),
  duration_range: z.tuple([z.number(), z.number()]).describe("The min/max duration in game ticks."),
});

export type WeatherDefinition = z.infer<typeof WeatherDefinitionSchema>;
