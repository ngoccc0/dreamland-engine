"use strict";
/**
 * Nature Rules Engine - Pure Functions for Plant Growth and Harvesting
 *
 * These are PURE FUNCTIONS for plant life cycles:
 * - Environmental stress/suitability calculations
 * - Plant part growth and drop
 * - Harvest yield calculations
 * - Vegetation density measurement
 *
 * No external dependencies (no DB, no hooks, no RNG seed management).
 * All dependencies passed as arguments.
 *
 * @example
 * ```typescript
 * const suitability = calculateEnvironmentalSuitability(
 *   { moisture: 60, temperature: 15 },
 *   { minMoisture: 30, maxTemperature: 25 }
 * );
 * // Returns: 0.8 (80% suitable)
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMoistureSuitability = calculateMoistureSuitability;
exports.calculateTemperatureSuitability = calculateTemperatureSuitability;
exports.calculateLightSuitability = calculateLightSuitability;
exports.calculateEnvironmentalSuitability = calculateEnvironmentalSuitability;
exports.calculateEnvironmentalStress = calculateEnvironmentalStress;
exports.calculateGrowthProbability = calculateGrowthProbability;
exports.calculateDropProbability = calculateDropProbability;
exports.calculateHarvestYield = calculateHarvestYield;
exports.calculateVegetationDensity = calculateVegetationDensity;
exports.shouldReproduce = shouldReproduce;
exports.shouldPartGrow = shouldPartGrow;
exports.shouldPartDrop = shouldPartDrop;
/**
 * Calculate moisture suitability (0-1)
 *
 * Penalties applied for being too dry or too wet
 *
 * @param actualMoisture - Current moisture 0-100
 * @param minRequired - Minimum moisture needed
 * @param maxTolerance - Maximum moisture before penalty
 * @returns Score 0-1 (0=dead, 1=perfect)
 *
 * @example
 * calculateMoistureSuitability(50, 30, 80) → 1.0 (perfect)
 * calculateMoistureSuitability(20, 30, 80) → 0.5 (dry penalty)
 */
function calculateMoistureSuitability(actualMoisture = 50, minRequired = 20, maxTolerance = 80) {
    // Handle undefined/NaN defaults
    const moisture = actualMoisture ?? 50;
    const min = minRequired ?? 20;
    const max = maxTolerance ?? 80;
    if (moisture < min) {
        // Drought penalty: scales from 1.0 at min to 0 at 0
        return Math.max(0, moisture / min);
    }
    if (moisture > max) {
        // Wet penalty: scales from 1.0 at max to 0.5 at 100
        return Math.max(0.5, 1 - (moisture - max) / 50);
    }
    return 1.0; // Perfect
}
/**
 * Calculate temperature suitability (0-1)
 *
 * Penalties for temperatures outside optimal range
 *
 * @param actualTemp - Current temperature
 * @param minOptimal - Minimum optimal temperature
 * @param maxOptimal - Maximum optimal temperature
 * @returns Score 0-1 (0=lethal, 1=perfect)
 *
 * @example
 * calculateTemperatureSuitability(20, 10, 30) → 1.0 (perfect)
 * calculateTemperatureSuitability(5, 10, 30) → 0.7 (cold penalty)
 */
function calculateTemperatureSuitability(actualTemp = 15, minOptimal = 10, maxOptimal = 30) {
    // Handle undefined/NaN defaults
    const temp = actualTemp ?? 15;
    const minOpt = minOptimal ?? 10;
    const maxOpt = maxOptimal ?? 30;
    if (temp < minOpt) {
        // Cold penalty: scales from 1.0 at minOpt to 0 at minOpt - 20
        const coldMargin = minOpt - 20;
        return Math.max(0, (temp - coldMargin) / (minOpt - coldMargin));
    }
    if (temp > maxOpt) {
        // Heat penalty: scales from 1.0 at maxOpt to 0 at maxOpt + 20
        return Math.max(0, 1 - (temp - maxOpt) / 20);
    }
    return 1.0; // Perfect
}
/**
 * Calculate light suitability (0-1)
 *
 * @param actualLight - Current light 0-100
 * @param minRequired - Minimum light for growth
 * @returns Score 0-1 (0=no growth, 1=perfect)
 *
 * @example
 * calculateLightSuitability(50, 30) → 1.0 (above minimum)
 * calculateLightSuitability(15, 30) → 0.5 (dimly lit)
 */
function calculateLightSuitability(actualLight = 50, minRequired = 20) {
    if (actualLight < minRequired) {
        return actualLight / minRequired; // Scales to 0 at 0 light
    }
    return 1.0; // Sufficient light
}
/**
 * Calculate overall environmental suitability
 *
 * Combines moisture, temperature, and light into 0-1 score
 *
 * @param conditions - Actual environmental conditions
 * @param requirements - Plant requirements
 * @returns Complete suitability analysis
 *
 * @example
 * const result = calculateEnvironmentalSuitability(
 *   { moisture: 60, temperature: 20, light: 60 },
 *   { minMoisture: 30, minTemperature: 10, maxTemperature: 30, minLight: 40 }
 * );
 * // Returns: { suitability: 0.95, moistureScore: 1.0, ... }
 */
function calculateEnvironmentalSuitability(conditions, requirements) {
    const moistureScore = calculateMoistureSuitability(conditions.moisture ?? 50, requirements.minMoisture ?? 20, requirements.maxMoisture ?? 80);
    const temperatureScore = calculateTemperatureSuitability(conditions.temperature ?? 15, requirements.minTemperature ?? 10, requirements.maxTemperature ?? 30);
    const lightScore = calculateLightSuitability(conditions.light ?? 50, requirements.minLight ?? 20);
    // Overall suitability is weighted average (moisture and temperature critical)
    const suitability = (moistureScore * 0.4 + temperatureScore * 0.4 + lightScore * 0.2);
    return {
        suitability: Math.max(0, Math.min(1, suitability)),
        moistureScore,
        temperatureScore,
        lightScore,
        canReproduce: suitability > 0.7 // Only reproduce in good conditions
    };
}
/**
 * Calculate plant health stress from poor conditions
 *
 * @param environmentalSuitability - Suitability score 0-1
 * @param baseDamagePerTick - Base damage when unsuitable (default 5)
 * @returns Damage to apply (0 when perfect conditions)
 *
 * @example
 * calculateEnvironmentalStress(0.8, 5) → 1 (light stress)
 * calculateEnvironmentalStress(0.2, 5) → 4 (severe stress)
 */
function calculateEnvironmentalStress(environmentalSuitability, baseDamagePerTick = 5) {
    const stressLevel = 1 - environmentalSuitability;
    return Math.ceil(stressLevel * baseDamagePerTick);
}
/**
 * Calculate plant part growth probability
 *
 * Growth is more likely in ideal conditions
 *
 * @param baseGrowthProbability - Base growth chance 0-1
 * @param environmentalSuitability - Suitability bonus 0-1
 * @returns Actual growth probability 0-1
 *
 * @example
 * calculateGrowthProbability(0.05, 0.8) → 0.04 (80% of base)
 * calculateGrowthProbability(0.05, 1.0) → 0.05 (full growth)
 * calculateGrowthProbability(0.05, 0.3) → 0.015 (starved growth)
 */
function calculateGrowthProbability(baseGrowthProbability, environmentalSuitability) {
    return baseGrowthProbability * environmentalSuitability;
}
/**
 * Calculate plant part drop probability
 *
 * Drop is MORE likely under stress (shedding)
 *
 * @param baseDropProbability - Base drop chance 0-1
 * @param stressLevel - Stress level 0-1 (1=dead, 0=perfect)
 * @returns Actual drop probability 0-1
 *
 * @example
 * calculateDropProbability(0.01, 0.2) → 0.002 (healthy shedding)
 * calculateDropProbability(0.01, 0.8) → 0.008 (stress shedding)
 */
function calculateDropProbability(baseDropProbability, stressLevel) {
    return baseDropProbability * (1 + stressLevel);
}
/**
 * Harvest yield from a plant
 *
 * @param maxYield - Maximum harvestable amount
 * @param plantHealth - Current plant health 0-maxHp
 * @param plantMaxHealth - Plant max health
 * @returns Yield amount (more healthy = more yield)
 *
 * @example
 * calculateHarvestYield(5, 100, 100) → 5 (full health = full yield)
 * calculateHarvestYield(5, 50, 100) → 2.5 → 2 (half health = half yield)
 * calculateHarvestYield(5, 10, 100) → 0 (dying = no yield)
 */
function calculateHarvestYield(maxYield, plantHealth, plantMaxHealth) {
    if (plantHealth <= 0)
        return 0;
    const healthRatio = plantHealth / plantMaxHealth;
    return Math.floor(maxYield * healthRatio);
}
/**
 * Calculate vegetation density from plant count
 *
 * @param plantCount - Number of plants in area
 * @returns Density 0-100 (clamped)
 *
 * @remarks
 * Simple: 1 plant = 10 density, max 100
 * Used for narrative and spawn conditions
 *
 * @example
 * calculateVegetationDensity(5) → 50
 * calculateVegetationDensity(15) → 100 (clamped)
 */
function calculateVegetationDensity(plantCount) {
    return Math.min(100, plantCount * 10);
}
/**
 * Check if plant should reproduce
 *
 * @param reproduction Chance - Base reproduction probability 0-1
 * @param canReproduce - Environmental permission
 * @param randomRoll - Random 0-1 (injectable)
 * @returns true if reproduction triggered
 *
 * @example
 * shouldReproduce(0.02, true, 0.01) → true (triggered)
 * shouldReproduce(0.02, false, 0.01) → false (bad conditions)
 */
function shouldReproduce(reproductionChance, canReproduce, randomRoll = Math.random()) {
    return canReproduce && randomRoll < reproductionChance;
}
/**
 * Check if plant part grows
 *
 * @param growthProbability - Calculated growth chance 0-1
 * @param currentQty - Current part quantity
 * @param maxQty - Maximum part quantity
 * @param randomRoll - Random 0-1 (injectable)
 * @returns true if part should grow
 *
 * @example
 * shouldPartGrow(0.05, 2, 5, 0.03) → true (grows)
 * shouldPartGrow(0.05, 5, 5, 0.03) → false (already max)
 */
function shouldPartGrow(growthProbability, currentQty, maxQty, randomRoll = Math.random()) {
    return currentQty < maxQty && randomRoll < growthProbability;
}
/**
 * Check if plant part drops
 *
 * @param dropProbability - Calculated drop chance 0-1
 * @param currentQty - Current part quantity
 * @param randomRoll - Random 0-1 (injectable)
 * @returns true if part drops
 *
 * @example
 * shouldPartDrop(0.02, 3, 0.01) → true (drops)
 * shouldPartDrop(0.02, 0, 0.01) → false (nothing to drop)
 */
function shouldPartDrop(dropProbability, currentQty, randomRoll = Math.random()) {
    return currentQty > 0 && randomRoll < dropProbability;
}
