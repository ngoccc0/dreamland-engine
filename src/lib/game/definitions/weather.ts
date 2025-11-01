import { z } from 'zod';
import { MultilingualTextSchema } from './base';
import type { Terrain, Season } from '../types';

/**
 * The main schema for defining a weather state in the game world.
 * Weather conditions dynamically affect the environment and gameplay.
 */
export const WeatherDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the weather state, e.g., 'light_rain', 'sunny', 'blizzard'. Used for internal lookup."),
  name: MultilingualTextSchema.describe("The multilingual display name of the weather condition."),
  description: MultilingualTextSchema.describe("The multilingual description of the weather condition, providing details to the player."),
  biome_affinity: z.array(z.custom<Terrain>()).describe("A list of biome IDs (Terrain types) where this weather can naturally occur. If empty, it can occur anywhere."),
  season_affinity: z.array(z.custom<Season>()).describe("A list of seasons where this weather can naturally occur. If empty, it can occur in any season."),
  temperature_delta: z.number().describe("The change in the chunk's temperature (in Celsius) caused by this weather. Positive for warming, negative for cooling."),
  moisture_delta: z.number().describe("The change in the chunk's moisture level (0-100) caused by this weather. Positive for increasing moisture (e.g., rain), negative for decreasing."),
  wind_delta: z.number().describe("The change in the chunk's wind level (0-100) caused by this weather. Positive for increasing wind, negative for decreasing."),
  light_delta: z.number().describe("The change in the chunk's light level (0-100) caused by this weather. Positive for increasing light, negative for decreasing (e.g., overcast)."),
  spawnWeight: z.number().describe("A weighting factor indicating how likely this weather is to be chosen relative to other possible weather conditions. Higher values mean more common."),
  exclusive_tags: z.array(z.string()).describe("Tags used to prevent illogical combinations of weather (e.g., a weather with 'rain' tag cannot coexist with one with 'drought' tag)."),
  duration_range: z.tuple([z.number(), z.number()]).describe("A tuple specifying the minimum and maximum duration (in game ticks) this weather condition can last."),
}).describe("A complete definition for a dynamic weather state in the game.");

export type WeatherDefinition = z.infer<typeof WeatherDefinitionSchema>;
