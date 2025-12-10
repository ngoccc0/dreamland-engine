/**
 * Environment & World Configuration
 *
 * @remarks
 * Centralizes all environment parameters including time mechanics,
 * temperature ranges, seasons, and world-scale constants.
 *
 * TODO: Add biome-specific temperature ranges and season effects
 */

/**
 * Environment and world configuration
 *
 * @remarks
 * These values define how the game world behaves, including day/night cycles,
 * seasons, and environmental extremes.
 */
export const environmentConfig = {
  /**
   * Number of game ticks per in-game season
   * @remarks 100 ticks = 1 season = 4 seasons per year = 1 year
   */
  ticksPerSeason: 100,

  /**
   * Number of in-game ticks per day
   * @remarks Used for time progression display
   */
  ticksPerDay: 1440, // 24-hour cycle

  /**
   * Temperature range: minimum (°C)
   * @remarks Coldest possible environmental temperature
   */
  temperatureMin: -30,

  /**
   * Temperature range: maximum (°C)
   * @remarks Hottest possible environmental temperature
   */
  temperatureMax: 50,

  /**
   * Biome temperature modifier ranges
   * @remarks Adjusts base temperature depending on biome type
   */
  biomeTemperatureModifiers: {
    desert: { min: 20, max: 50 },
    tundra: { min: -30, max: -10 },
    tropical: { min: 20, max: 35 },
    temperate: { min: 0, max: 30 },
    volcanic: { min: 25, max: 60 },
    underground: { min: 10, max: 15 },
  },

  /**
   * Starting game time (in ticks from start of day)
   * @remarks 6 AM = 6 * 60 = 360 ticks
   */
  startingGameTimeTicks: 360,

  /**
   * Player damage threshold for cold environment (°C below baseline)
   * @remarks Player takes damage if environment temp < bodyTemp - this value
   */
  coldDamageThreshold: 5,

  /**
   * Player damage threshold for hot environment (°C above baseline)
   * @remarks Player takes damage if environment temp > bodyTemp + this value
   */
  heatDamageThreshold: 5,

  /**
   * Seasons in order
   * @remarks Used for seasonal progression and effects
   */
  seasons: ['winter', 'spring', 'summer', 'autumn'] as const,

  /**
   * Daylight hours (game ticks)
   * @remarks When day transitions to night
   */
  daylightHours: {
    sunrise: 360, // 6 AM
    sunset: 1080, // 6 PM
  },
} as const;

/**
 * Export type for TypeScript consumers
 */
export type EnvironmentConfig = typeof environmentConfig;
