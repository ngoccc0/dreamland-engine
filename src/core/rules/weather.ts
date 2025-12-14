/**
 * Weather Rules Module - Pure game logic for environmental mechanics
 *
 * Handles growth calculations, weather modifiers, water needs, and humidity effects.
 * All functions are pure (no side effects, deterministic, testable).
 *
 * @remarks
 * Used by growth usecases to orchestrate plant/creature environmental interactions.
 * Does NOT handle state mutations—returns calculated values only.
 */

/**
 * Calculates plant growth score based on environmental conditions.
 *
 * @remarks
 * **Formula:** `growthScore = baseGrowth × moistureModifier × temperatureModifier`
 *
 * **Logic:**
 * 1. Start with base growth (0.5 for normal conditions)
 * 2. Apply moisture modifier:
 *    - moisture < 20 → 0 (too dry, no growth)
 *    - moisture 20-40 → scales from 0.2 to 0.8
 *    - moisture 40-70 → scales from 0.8 to 1.2 (optimal)
 *    - moisture 70-90 → scales from 1.2 to 0.6
 *    - moisture > 90 → 0 (too wet, root rot)
 * 3. Apply temperature modifier:
 *    - temp < 5 → 0 (too cold)
 *    - temp 5-25 → scales from 0.1 to 1.0 (growing range)
 *    - temp 25-35 → scales from 1.0 to 0.5 (hot)
 *    - temp > 35 → 0 (too hot)
 * 4. Clamp final result to 0-2.0
 *
 * **Edge Cases:**
 * - Both moisture and temperature outside range → 0 growth
 * - Both optimal → 1.2 growth (accelerated)
 * - Negative inputs → treated as 0
 *
 * @param moisture - Soil moisture (0-100)
 * @param temperature - Temperature in Celsius (-10 to 50)
 * @returns Growth score (0-2.0, where 1.0 is normal growth)
 *
 * @example
 * getGrowthScore(55, 20) → 1.2 (optimal conditions)
 * getGrowthScore(15, 20) → 0 (too dry)
 * getGrowthScore(55, 40) → 0 (too hot)
 */
export function getGrowthScore(moisture: number, temperature: number): number {
    // Clamp inputs to valid ranges
    const m = Math.max(0, moisture);
    const t = Math.max(-10, temperature);

    // Moisture modifier (0-1.2)
    let moistureModifier = 0;
    if (m < 20) {
        moistureModifier = 0;
    } else if (m < 40) {
        // 20-40: scale 0.2 to 0.8
        moistureModifier = 0.2 + ((m - 20) / 20) * 0.6;
    } else if (m <= 70) {
        // 40-70: scale 0.8 to 1.2 (peak)
        moistureModifier = 0.8 + ((m - 40) / 30) * 0.4;
    } else if (m < 90) {
        // 70-90: scale 1.2 to 0.6
        moistureModifier = 1.2 - ((m - 70) / 20) * 0.6;
    } else {
        moistureModifier = 0; // too wet
    }

    // Temperature modifier (0-1.0)
    let temperatureModifier = 0;
    if (t < 5) {
        temperatureModifier = 0;
    } else if (t < 25) {
        // 5-25: scale 0.1 to 1.0
        temperatureModifier = 0.1 + ((t - 5) / 20) * 0.9;
    } else if (t < 35) {
        // 25-35: scale 1.0 to 0.5 (declining)
        temperatureModifier = 1.0 - ((t - 25) / 10) * 0.5;
    } else {
        temperatureModifier = 0; // too hot
    }

    // Base growth rate
    const baseGrowth = 0.5;

    // Combine modifiers
    const growthScore = baseGrowth * moistureModifier * temperatureModifier;

    // Clamp to 0-2.0
    return Math.max(0, Math.min(2.0, growthScore));
}

/**
 * Applies weather modifier to creature or plant attributes.
 *
 * @remarks
 * **Formula:** `modifiedValue = baseValue × weatherMultiplier`
 *
 * **Logic:**
 * 1. Weather types affect different attributes:
 *    - RAINY: +30% growth, -20% movement
 *    - SUNNY: +20% health_regen, +10% damage
 *    - CLOUDY: no modifier (100%)
 *    - STORMY: -40% health, -50% movement
 *    - SNOWY: -30% health_regen, +40% defense
 * 2. Apply multiplier to base attribute value
 * 3. Clamp result to 0 minimum
 *
 * **Edge Cases:**
 * - Unknown weather type → 100% (no change)
 * - Negative base value → treated as 0
 * - Result is always >= 0
 *
 * @param baseValue - Attribute base value
 * @param weatherType - Weather condition (RAINY, SUNNY, CLOUDY, STORMY, SNOWY)
 * @param attributeType - Attribute affected (growth, movement, health_regen, damage, health, defense)
 * @returns Modified attribute value
 *
 * @example
 * applyWeatherModifier(10, 'RAINY', 'growth') → 13 (10 × 1.30)
 * applyWeatherModifier(10, 'SUNNY', 'movement') → 10 (no modifier)
 * applyWeatherModifier(100, 'STORMY', 'health') → 60 (100 × 0.60)
 */
export function applyWeatherModifier(
    baseValue: number,
    weatherType: string,
    attributeType: string
): number {
    const value = Math.max(0, baseValue);

    // Weather effect matrix
    const weatherEffects: Record<string, Record<string, number>> = {
        RAINY: {
            growth: 1.3,
            movement: 0.8,
            health_regen: 1.0,
            damage: 1.0,
            health: 1.0,
            defense: 1.0,
        },
        SUNNY: {
            growth: 1.0,
            movement: 1.0,
            health_regen: 1.2,
            damage: 1.1,
            health: 1.0,
            defense: 1.0,
        },
        CLOUDY: {
            growth: 1.0,
            movement: 1.0,
            health_regen: 1.0,
            damage: 1.0,
            health: 1.0,
            defense: 1.0,
        },
        STORMY: {
            growth: 0.7,
            movement: 0.5,
            health_regen: 0.6,
            damage: 0.9,
            health: 0.6,
            defense: 1.1,
        },
        SNOWY: {
            growth: 0.5,
            movement: 0.9,
            health_regen: 0.7,
            damage: 0.95,
            health: 1.0,
            defense: 1.4,
        },
    };

    const effects = weatherEffects[weatherType];
    if (!effects) {
        return value; // Unknown weather, no modifier
    }

    const modifier = effects[attributeType] || 1.0;
    return Math.max(0, value * modifier);
}

/**
 * Calculates daily water need for plant based on environmental conditions.
 *
 * @remarks
 * **Formula:** `waterNeed = baseNeed × temperatureMultiplier × moistureMultiplier`
 *
 * **Logic:**
 * 1. Base water need is 5 units per day for normal plant
 * 2. Temperature affects evaporation:
 *    - cold temps (< 10°C) → 0.5× need (less evaporation)
 *    - warm temps (20-30°C) → 1.0× need (normal)
 *    - hot temps (> 30°C) → 2.0× need (high evaporation)
 * 3. Current moisture affects uptake:
 *    - low moisture (< 30) → 1.5× need (thirsty)
 *    - medium moisture (30-70) → 1.0× need (normal)
 *    - high moisture (> 70) → 0.5× need (already wet)
 * 4. Result: 0-20 units per day
 *
 * **Edge Cases:**
 * - Both temperature and moisture unfavorable → max need (20)
 * - Both favorable → min need (1)
 * - Negative temperature treated as 0
 *
 * @param temperature - Temperature in Celsius
 * @param currentMoisture - Current soil moisture (0-100)
 * @returns Water needed today (0-20 units)
 *
 * @example
 * getWaterNeed(25, 50) → 5 (normal conditions)
 * getWaterNeed(35, 20) → 15 (hot + dry = high need)
 * getWaterNeed(5, 80) → 1.25 (cold + wet = low need)
 */
export function getWaterNeed(temperature: number, currentMoisture: number): number {
    const t = Math.max(0, temperature);
    const m = Math.max(0, Math.min(100, currentMoisture));

    // Base need
    const baseNeed = 5;

    // Temperature multiplier
    let tempMultiplier = 1.0;
    if (t < 10) {
        tempMultiplier = 0.5;
    } else if (t < 20) {
        // 10-20: scale 0.5 to 1.0
        tempMultiplier = 0.5 + ((t - 10) / 10) * 0.5;
    } else if (t <= 30) {
        // 20-30: scale 1.0 to 2.0
        tempMultiplier = 1.0 + ((t - 20) / 10) * 1.0;
    } else {
        // > 30: high evaporation
        tempMultiplier = 2.0;
    }

    // Moisture multiplier
    let moistureMultiplier = 1.0;
    if (m < 30) {
        moistureMultiplier = 1.5;
    } else if (m <= 70) {
        // 30-70: scale 1.5 to 0.5
        moistureMultiplier = 1.5 - ((m - 30) / 40) * 1.0;
    } else {
        // > 70: high moisture, less need
        moistureMultiplier = 0.5;
    }

    // Calculate final need
    const waterNeed = baseNeed * tempMultiplier * moistureMultiplier;

    // Clamp to 0-20
    return Math.max(0, Math.min(20, waterNeed));
}

/**
 * Calculates current humidity level based on rainfall and temperature.
 *
 * @remarks
 * **Formula:** `humidity = baseHumidity + rainfallContribution - evaporationLoss`
 *
 * **Logic:**
 * 1. Start with base humidity (ambient moisture in air)
 * 2. Rainfall adds moisture:
 *    - Each rainfall unit adds 1 point (saturated)
 *    - Max contribution: 30 points from rain
 * 3. Temperature increases evaporation loss:
 *    - temp < 10°C → 0.5 loss multiplier
 *    - temp 10-25°C → 1.0 loss multiplier (normal)
 *    - temp > 25°C → 2.0 loss multiplier (high evaporation)
 * 4. Final humidity: 0-100 (0=dry, 100=saturated)
 *
 * **Edge Cases:**
 * - Very hot (>40°C) + no rain → near 0
 * - Cool + heavy rain → near 100
 *
 * @param baseHumidity - Starting humidity (0-100)
 * @param rainfall - Rainfall amount today (0+)
 * @param temperature - Temperature in Celsius
 * @returns Current humidity (0-100)
 *
 * @example
 * calculateHumidity(50, 5, 20) → ~70 (rain adds moisture)
 * calculateHumidity(30, 0, 35) → ~10 (heat evaporates)
 * calculateHumidity(60, 10, 15) → ~95 (optimal conditions + rain)
 */
export function calculateHumidity(
    baseHumidity: number,
    rainfall: number,
    temperature: number
): number {
    // Clamp inputs
    const humidity = Math.max(0, Math.min(100, baseHumidity));
    const rain = Math.max(0, rainfall);
    const t = Math.max(-10, temperature);

    // Rainfall contribution (capped at 30)
    const rainfallContribution = Math.min(30, rain);

    // Evaporation loss based on temperature
    let evaporationMultiplier = 1.0;
    if (t < 10) {
        evaporationMultiplier = 0.5;
    } else if (t < 25) {
        // 10-25: scale 0.5 to 1.0
        evaporationMultiplier = 0.5 + ((t - 10) / 15) * 0.5;
    } else {
        // > 25: scale 1.0 to 2.0
        evaporationMultiplier = 1.0 + ((Math.min(t, 40) - 25) / 15) * 1.0;
    }

    // Base evaporation loss is 10 units
    const evaporationLoss = 10 * evaporationMultiplier;

    // Calculate final humidity
    const finalHumidity = humidity + rainfallContribution - evaporationLoss;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, finalHumidity));
}
