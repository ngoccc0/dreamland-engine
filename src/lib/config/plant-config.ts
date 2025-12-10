/**
 * Plant Growth & Farming Configuration
 *
 * @remarks
 * Defines all parameters for plant growth, farming mechanics, and
 * plant-related environmental interactions.
 *
 * TODO: Add plant type-specific growth modifiers (crops, trees, flowers)
 * TODO: Add seasonal growth bonuses/penalties
 */

/**
 * Plant system configuration
 *
 * @remarks
 * Affects farming gameplay, crop yields, and plant growth speed.
 * Lower growth rates = longer progression, higher rates = faster farming loops.
 */
export const plantConfig = {
    /**
     * Base growth rate multiplier
     * @remarks Affects how quickly plants mature
     * TODO: Move to plant-specific definitions
     */
    baseGrowthRate: 1.0,

    /**
     * Default moisture level baseline
     * @remarks Optimal moisture for plant growth
     */
    defaultMoistureBaseline: 50,

    /**
     * Default light level baseline
     * @remarks Optimal light for plant growth (0-100 scale)
     */
    defaultLightBaseline: 50,

    /**
     * Moisture threshold for good plant growth
     * @remarks Moisture below this: poor growth; above this: good growth
     */
    moistureGrowthThreshold: 80,

    /**
     * Light threshold for good plant growth
     * @remarks Light below this: poor growth; above this: good growth
     */
    lightGrowthThreshold: 20,

    /**
     * Maximum moisture level (normalized to 0-100)
     * @remarks Used for moisture calculations and caps
     */
    maxMoisture: 100,

    /**
     * Maximum light level (normalized to 0-100)
     * @remarks Used for light calculations and caps
     */
    maxLight: 100,

    /**
     * Growth penalty for low light
     * @remarks Multiply growth rate by this when light < threshold
     */
    lowLightGrowthPenalty: 0.5,

    /**
     * Growth penalty for low moisture
     * @remarks Multiply growth rate by this when moisture < threshold
     */
    lowMoistureGrowthPenalty: 0.5,

    /**
     * Growth bonus for optimal conditions
     * @remarks Multiply growth rate by this when conditions are ideal
     */
    optimalConditionsGrowthBonus: 1.2,

    /**
     * Fertilization bonus multiplier
     * @remarks How much fertilizer increases growth rate
     */
    fertilizationBonus: 1.5,

    /**
     * Watering effectiveness (moisture increase per action)
     * @remarks How much moisture increases when tiled is watered
     */
    wateringEffectiveness: 30,
} as const;

/**
 * Export type for TypeScript consumers
 */
export type PlantConfig = typeof plantConfig;
