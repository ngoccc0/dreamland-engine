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

import { GAME_BALANCE } from '@/config/game-balance';

/**
 * Environmental conditions of a location
 */
export interface EnvironmentalConditions {
    moisture?: number; // 0-100
    temperature?: number; // degrees
    light?: number; // 0-100
}

/**
 * Plant requirements for growth
 */
export interface PlantRequirements {
    minMoisture?: number;
    maxMoisture?: number;
    minTemperature?: number;
    maxTemperature?: number;
    minLight?: number;
}

/**
 * Suitability result from environmental check
 */
export interface EnvironmentalSuitability {
    suitability: number; // 0-1
    moistureScore: number;
    temperatureScore: number;
    lightScore: number;
    canReproduce: boolean;
}

/**
 * Calculate moisture suitability (0-1)
 *
 * @remarks
 * **Formula:**
 * - If moisture < min: `score = moisture / min` (scales to 0 at zero moisture)
 * - If moisture > max: `score = max(0.3, 1 - (moisture - max) / 28.57)` (wet penalty)
 * - Otherwise: `score = 1.0` (optimal)
 *
 * **Logic:**
 * 1. If below minimum: drying penalty increases as moisture drops toward 0
 * 2. If above maximum: waterlogging penalty caps at 0.3 (30% usability remains)
 * 3. Between min and max: perfect growing conditions
 *
 * **Edge Cases:**
 * - Zero moisture returns 0 (complete drought death)
 * - At exactly max moisture returns 1.0 (threshold boundary)
 * - At 100 moisture returns ~0.3 (severe waterlogging penalty)
 *
 * @param actualMoisture - Current moisture 0-100 (0=desert, 100=swamp)
 * @param minRequired - Minimum viable moisture (typical 30)\n * @param maxTolerance - Maximum comfortable moisture (typical 80)
 * @returns Suitability score 0.0-1.0 (0=lethal, 1.0=optimal)
 *
 * @example
 * calculateMoistureSuitability(50, 30, 80) → 1.0 (perfect conditions)
 * calculateMoistureSuitability(20, 30, 80) → 0.67 (dry stress)
 * calculateMoistureSuitability(100, 30, 80) → ~0.35 (wet stress)
 */
export function calculateMoistureSuitability(
    actualMoisture: number = GAME_BALANCE.NATURE.DEFAULTS.MOISTURE,
    minRequired: number = GAME_BALANCE.NATURE.DEFAULTS.MIN_MOISTURE,
    maxTolerance: number = GAME_BALANCE.NATURE.DEFAULTS.MAX_MOISTURE
): number {
    // Handle undefined/NaN defaults
    const moisture = actualMoisture ?? GAME_BALANCE.NATURE.DEFAULTS.MOISTURE;
    const min = minRequired ?? GAME_BALANCE.NATURE.DEFAULTS.MIN_MOISTURE;
    const max = maxTolerance ?? GAME_BALANCE.NATURE.DEFAULTS.MAX_MOISTURE;

    if (moisture < min) {
        // Drought penalty: scales from 1.0 at min to 0 at 0
        return Math.max(0, moisture / min);
    }
    if (moisture > max) {
        // Wet penalty: scales from 1.0 at max to 0.3 at 100
        return Math.max(
            GAME_BALANCE.NATURE.SUITABILITY.WET_PENALTY_MIN,
            1 - (moisture - max) / GAME_BALANCE.NATURE.SUITABILITY.WET_PENALTY_FACTOR
        );
    }
    return 1.0; // Perfect
}

/**
 * Calculate temperature suitability (0-1)
 *
 * @remarks
 * **Formula:**
 * - If temp < minOpt: `score = (temp - coldMargin) / (minOpt - coldMargin)` (cold penalty, coldMargin = minOpt - 15)
 * - If temp > maxOpt: `score = max(0, 1 - (temp - maxOpt) / 20)` (heat penalty)
 * - Otherwise: `score = 1.0` (optimal)
 *
 * **Logic:**
 * 1. Cold penalty: scales from 1.0 at minimum to 0 at minOpt - 15 degrees
 * 2. Heat penalty: scales from 1.0 at maximum to 0 at maxOpt + 20 degrees
 * 3. Between min and max: perfect growing temperature
 *
 * **Edge Cases:**
 * - At lethal cold (minOpt - 15): returns 0 (plant dies)
 * - At lethal heat (maxOpt + 20): returns 0 (plant dies)
 * - Outside lethal zones: clamped to 0 minimum
 *
 * @param actualTemp - Current temperature in degrees (celsius or relative units)
 * @param minOptimal - Minimum optimal temperature (typical 10)
 * @param maxOptimal - Maximum optimal temperature (typical 30)
 * @returns Suitability score 0.0-1.0 (0=lethal, 1.0=optimal)
 *
 * @example
 * calculateTemperatureSuitability(20, 10, 30) → 1.0 (perfect midpoint)
 * calculateTemperatureSuitability(5, 10, 30) → 0.667 (cold stress)
 * calculateTemperatureSuitability(40, 10, 30) → 0.0 (extreme heat death)
 */
export function calculateTemperatureSuitability(
    actualTemp: number = GAME_BALANCE.NATURE.DEFAULTS.TEMPERATURE,
    minOptimal: number = GAME_BALANCE.NATURE.DEFAULTS.MIN_TEMPERATURE,
    maxOptimal: number = GAME_BALANCE.NATURE.DEFAULTS.MAX_TEMPERATURE
): number {
    // Handle undefined/NaN defaults
    const temp = actualTemp ?? GAME_BALANCE.NATURE.DEFAULTS.TEMPERATURE;
    const minOpt = minOptimal ?? GAME_BALANCE.NATURE.DEFAULTS.MIN_TEMPERATURE;
    const maxOpt = maxOptimal ?? GAME_BALANCE.NATURE.DEFAULTS.MAX_TEMPERATURE;

    if (temp < minOpt) {
        const coldMargin = minOpt - GAME_BALANCE.NATURE.SUITABILITY.COLD_MARGIN;
        return Math.max(0, (temp - coldMargin) / (minOpt - coldMargin));
    }
    if (temp > maxOpt) {
        return Math.max(0, 1 - (temp - maxOpt) / GAME_BALANCE.NATURE.SUITABILITY.HEAT_MARGIN);
    }
    return 1.0; // Perfect
}

/**
 * Calculate light suitability (0-1)
 *
 * @remarks
 * **Formula:**
 * - If light < minRequired: `score = light / minRequired` (scales to 0 at zero light)
 * - Otherwise: `score = 1.0` (sufficient light)
 *
 * **Logic:**
 * 1. No penalty for excess light (always at least 1.0 above minimum)
 * 2. Linear scaling from 0 to 1.0 as light increases from 0 to minimum
 * 3. Simple on/off mechanism (no diminishing returns for very bright conditions)
 *
 * **Edge Cases:**
 * - Zero light returns 0 (no photosynthesis)
 * - Light >= minimum returns 1.0 (no further benefit)
 *
 * @param actualLight - Current light level 0-100 (0=pitch black, 100=full sun)
 * @param minRequired - Minimum light for growth (typical 20)
 * @returns Suitability score 0.0-1.0 (0=no growth, 1.0=sufficient)
 *
 * @example
 * calculateLightSuitability(50, 30) → 1.0 (above minimum)
 * calculateLightSuitability(15, 30) → 0.5 (50% of minimum, dimly lit)
 * calculateLightSuitability(0, 30) → 0.0 (total darkness)
 */
export function calculateLightSuitability(
    actualLight: number = GAME_BALANCE.NATURE.DEFAULTS.LIGHT,
    minRequired: number = GAME_BALANCE.NATURE.DEFAULTS.MIN_LIGHT
): number {
    if (actualLight < minRequired) {
        return actualLight / minRequired; // Scales to 0 at 0 light
    }
    return 1.0; // Sufficient light
}

/**
 * Calculate overall environmental suitability from component factors
 *
 * @remarks
 * **Formula:**
 * ```
 * moistureScore = calculateMoistureSuitability(...)
 * temperatureScore = calculateTemperatureSuitability(...)
 * lightScore = calculateLightSuitability(...)
 * suitability = (moisture × 0.4) + (temperature × 0.4) + (light × 0.2)
 * canReproduce = suitability > 0.7
 * ```
 *
 * **Logic:**
 * 1. Calculate component scores independently (0.0-1.0 each)
 * 2. Weight moisture and temperature equally (40% each) as critical factors
 * 3. Weight light less (20%) as secondary factor
 * 4. Return weighted average score and component breakdown
 * 5. Indicate reproduction permission threshold (>0.7 = good conditions)
 *
 * **Edge Cases:**
 * - All perfect conditions → suitability = 1.0, canReproduce = true
 * - Any major factor bad → overall suitability drops significantly
 * - Score exactly 0.7 → canReproduce = false (strict > threshold)
 *
 * @param conditions - Environmental values (moisture, temperature, light)
 * @param requirements - Plant thresholds (min/max values)
 * @returns Object with combined suitability, component scores, and reproduction flag
 *
 * @example
 * const result = calculateEnvironmentalSuitability(
 *   { moisture: 60, temperature: 20, light: 60 },
 *   { minMoisture: 30, maxMoisture: 80, minTemperature: 10, maxTemperature: 30, minLight: 40 }
 * );
 * // Returns: {
 * //   suitability: 1.0,
 * //   moistureScore: 1.0,
 * //   temperatureScore: 1.0,
 * //   lightScore: 1.0,
 * //   canReproduce: true
 * // }
 */
export function calculateEnvironmentalSuitability(
    conditions: EnvironmentalConditions,
    requirements: PlantRequirements
): EnvironmentalSuitability {
    const moistureScore = calculateMoistureSuitability(
        conditions.moisture ?? GAME_BALANCE.NATURE.DEFAULTS.MOISTURE,
        requirements.minMoisture ?? GAME_BALANCE.NATURE.DEFAULTS.MIN_MOISTURE,
        requirements.maxMoisture ?? GAME_BALANCE.NATURE.DEFAULTS.MAX_MOISTURE
    );

    const temperatureScore = calculateTemperatureSuitability(
        conditions.temperature ?? GAME_BALANCE.NATURE.DEFAULTS.TEMPERATURE,
        requirements.minTemperature ?? GAME_BALANCE.NATURE.DEFAULTS.MIN_TEMPERATURE,
        requirements.maxTemperature ?? GAME_BALANCE.NATURE.DEFAULTS.MAX_TEMPERATURE
    );

    const lightScore = calculateLightSuitability(
        conditions.light ?? GAME_BALANCE.NATURE.DEFAULTS.LIGHT,
        requirements.minLight ?? GAME_BALANCE.NATURE.DEFAULTS.MIN_LIGHT
    );

    // Overall suitability is weighted average (moisture and temperature critical)
    const suitability = (
        moistureScore * GAME_BALANCE.NATURE.SUITABILITY.MOISTURE_WEIGHT +
        temperatureScore * GAME_BALANCE.NATURE.SUITABILITY.TEMP_WEIGHT +
        lightScore * GAME_BALANCE.NATURE.SUITABILITY.LIGHT_WEIGHT
    );

    return {
        suitability: Math.max(0, Math.min(1, suitability)),
        moistureScore,
        temperatureScore,
        lightScore,
        canReproduce: suitability > GAME_BALANCE.NATURE.SUITABILITY.REPRODUCTION_THRESHOLD
    };
}

/**
 * Calculate plant health stress damage from environmental conditions
 *
 * @remarks
 * **Formula:** `stress = ceil((1 - suitability) × baseDamagePerTick)`
 *
 * **Logic:**
 * 1. Invert suitability (1.0 suitability = 0 stress, 0.0 suitability = 100% stress)
 * 2. Multiply by base damage value
 * 3. Round UP using `Math.ceil()` to ensure minimum damage at any stress
 *
 * **Stress Damage Scaling:**
 * - Perfect conditions (1.0) → 0 damage (no stress)
 * - Moderate stress (0.5) → ceil(5) = 5 damage
 * - Severe stress (0.2) → ceil(4) = 4 damage
 * - Complete failure (0.0) → ceil(5) = 5 damage (maximum)
 *
 * **Edge Cases:**
 * - Suitability = 1.0 → always 0 damage
 * - Suitability = 0.0 → always baseDamagePerTick (even stress kills plant)
 *
 * @param environmentalSuitability - Suitability score 0.0-1.0 (0=unsuitable, 1=perfect)
 * @param baseDamagePerTick - Base damage value per turn (default 5, configurable)
 * @returns Stress damage integer (0 when perfect, increases as conditions worsen)
 *
 * @example
 * calculateEnvironmentalStress(1.0, 5) → 0 (perfect conditions, no damage)
 * calculateEnvironmentalStress(0.8, 5) → 1 (light stress: ceil(0.2 × 5) = 1)
 * calculateEnvironmentalStress(0.2, 5) → 4 (severe stress: ceil(0.8 × 5) = 4)
 */
export function calculateEnvironmentalStress(
    environmentalSuitability: number,
    baseDamagePerTick: number = GAME_BALANCE.NATURE.GROWTH.BASE_STRESS_DAMAGE
): number {
    const stressLevel = 1 - environmentalSuitability;
    return Math.ceil(stressLevel * baseDamagePerTick);
}

/**
 * Calculate plant part growth probability based on environmental conditions
 *
 * @remarks
 * **Formula:** `growthProbability = baseGrowthProbability × environmentalSuitability`
 *
 * **Logic:**
 * 1. Growth chance is directly proportional to environmental suitability
 * 2. Perfect conditions (1.0) maintain base probability unchanged
 * 3. Poor conditions (0.2) reduce growth chance to 20% of base
 * 4. Unsuitable conditions (0.0) prevent all growth
 *
 * **Biological Intuition:**
 * - Plants grow faster when environment matches their preferences
 * - Environmental stress (heat, drought, shade) slows all growth
 *
 * **Edge Cases:**
 * - Suitability = 0.0 → growth = 0.0 (completely blocked)
 * - Suitability = 1.0 → growth = baseGrowthProbability (unchanged)
 *
 * @param baseGrowthProbability - Base growth chance 0.0-1.0 (typical 0.05 = 5%)
 * @param environmentalSuitability - Suitability multiplier 0.0-1.0
 * @returns Actual growth probability 0.0-1.0
 *
 * @example
 * calculateGrowthProbability(0.05, 1.0) → 0.05 (perfect: full base growth)
 * calculateGrowthProbability(0.05, 0.8) → 0.04 (good: 80% of base)
 * calculateGrowthProbability(0.05, 0.3) → 0.015 (poor: 30% of base)
 * calculateGrowthProbability(0.05, 0.0) → 0.0 (unsuitable: no growth)
 */
export function calculateGrowthProbability(
    baseGrowthProbability: number,
    environmentalSuitability: number
): number {
    return baseGrowthProbability * environmentalSuitability;
}

/**
 * Calculate plant part drop probability (shedding) based on stress
 *
 * @remarks
 * **Formula:** `dropProbability = baseDropProbability × (1 + stressLevel)`
 *
 * **Logic:**
 * 1. Base drop rate applies under perfect conditions (stressLevel = 0)
 * 2. Stress increases drop rate proportionally (stressed plants shed more)
 * 3. At maximum stress (1.0), drop rate doubles
 *
 * **Biological Mechanism:**
 * - Healthy plants shed naturally at low rate (genetic seed dispersal)
 * - Stressed plants shed faster (plant's survival response - invest in seeds)
 * - Can exceed 1.0 in extreme stress (loss condition, not a probability bound)
 *
 * **Edge Cases:**
 * - Stress = 0.0 → drop = baseDropProbability (normal shedding)
 * - Stress = 1.0 → drop = baseDropProbability × 2 (maximum stress shedding)
 * - Stress > 1.0 → drop can exceed 1.0 (becomes certainty)
 *
 * @param baseDropProbability - Base drop chance 0.0-1.0 (typical 0.01 = 1%)
 * @param stressLevel - Stress factor 0.0-1.0+ (0=healthy, 1=lethal, >1=overkill)
 * @returns Drop probability 0.0+ (can exceed 1.0 at extreme stress)
 *
 * @example
 * calculateDropProbability(0.01, 0.0) → 0.01 (healthy: base rate)
 * calculateDropProbability(0.01, 0.5) → 0.015 (moderate stress: 50% increased)
 * calculateDropProbability(0.01, 1.0) → 0.02 (extreme stress: doubled rate)
 */
export function calculateDropProbability(
    baseDropProbability: number,
    stressLevel: number
): number {
    return baseDropProbability * (1 + stressLevel);
}

/**
 * Calculate harvestable yield from a plant
 *
 * @remarks
 * **Formula:** `yield = floor(maxYield × (plantHealth / plantMaxHealth))`
 *
 * **Logic:**
 * 1. Calculate health ratio: `plantHealth / plantMaxHealth` (0.0-1.0)
 * 2. Scale max yield by ratio: `maxYield × ratio`
 * 3. Round down using `Math.floor()` (fractional parts discarded)
 *
 * **Health-Based Scaling:**
 * - Full health (100%) → maximum yield
 * - Half health (50%) → half yield
 * - Critical health (10%) → minimal yield
 * - Dead (0%) → zero yield
 *
 * **Edge Cases:**
 * - plantHealth <= 0 → always 0 (no harvest from dead plants)
 * - plantMaxHealth = 0 → NaN (invalid plant, check before calling)
 * - plantHealth > plantMaxHealth → capped by division (overheal scenario)
 *
 * @param maxYield - Maximum harvestable amount (typical 5-10 per plant)
 * @param plantHealth - Current plant health points (0+)
 * @param plantMaxHealth - Plant max HP (reference for 100% yield)
 * @returns Yield quantity integer (always >= 0)
 *
 * @example
 * calculateHarvestYield(5, 100, 100) → 5 (full health = max yield)
 * calculateHarvestYield(5, 50, 100) → 2 (half health = half yield)
 * calculateHarvestYield(5, 10, 100) → 0 (10% = 0.5, floors to 0)
 * calculateHarvestYield(5, 0, 100) → 0 (dead plant = no yield)
 */
export function calculateHarvestYield(
    maxYield: number,
    plantHealth: number,
    plantMaxHealth: number
): number {
    if (plantHealth <= 0) return 0;
    const healthRatio = plantHealth / plantMaxHealth;
    return Math.floor(maxYield * healthRatio);
}

/**
 * Calculate vegetation density metric from plant count
 *
 * @remarks
 * **Formula:** `density = min(100, plantCount × 10)`
 *
 * **Logic:**
 * 1. Convert plant count to density scale: 1 plant = 10 density units
 * 2. Clamp maximum at 100 (fully saturated)
 * 3. Used for narrative flavor, spawn rates, and chunk saturation
 *
 * **Density Meaning:**
 * - 0: Barren (no plants)
 * - 10-30: Sparse (few plants)
 * - 40-70: Moderate (healthy ecosystem)
 * - 80-100: Dense (fully vegetated)
 *
 * **Edge Cases:**
 * - plantCount = 0 → density = 0 (barren)
 * - plantCount = 5 → density = 50 (moderate)
 * - plantCount >= 10 → density = 100 (fully saturated)
 *
 * @param plantCount - Number of plants in area/chunk (0+)
 * @returns Vegetation density 0-100 (0=none, 100=fully saturated)
 *
 * @example
 * calculateVegetationDensity(0) → 0 (barren)
 * calculateVegetationDensity(5) → 50 (moderate)
 * calculateVegetationDensity(10) → 100 (fully saturated)
 * calculateVegetationDensity(100) → 100 (clamped max)
 */
export function calculateVegetationDensity(plantCount: number): number {
    return Math.min(
        GAME_BALANCE.NATURE.DENSITY.MAX_DENSITY,
        plantCount * GAME_BALANCE.NATURE.DENSITY.UNITS_PER_PLANT
    );
}

/**
 * Determine if a plant should reproduce
 *
 * @remarks
 * **Formula:** `canReproduce && randomRoll < reproductionChance`
 *
 * **Logic:**
 * 1. Check permission: plant meets age and capacity requirements
 * 2. Roll probability: generate random value
 * 3. Compare: if roll < chance, reproduction succeeds
 * 4. Biological intuition: mature plants spread seeds under good conditions
 *
 * **Probability Meaning:**
 * - 0.0: Never reproduces (infertile)
 * - 0.01: 1% chance each tick (slow growth)
 * - 0.05: 5% chance each tick (normal growth)
 * - 1.0: Always reproduces (rapid colonization)
 *
 * **Edge Cases:**
 * - canReproduce = false → always false (permission blocks)
 * - reproductionChance = 0.0 → always false (infertile)
 * - reproductionChance = 1.0 → returns canReproduce (guaranteed if permitted)
 *
 * @param reproductionChance - Base reproduction probability 0-1 (e.g., 0.05 = 5%)
 * @param canReproduce - Whether plant meets environmental requirements
 * @param randomRoll - Random value 0.0-1.0 for RNG testing (injectable)
 * @returns true if reproduction occurs, false otherwise
 *
 * @example
 * shouldReproduce(0.05, true, 0.03) → true (roll 0.03 < 0.05)
 * shouldReproduce(0.05, true, 0.07) → false (roll 0.07 > 0.05)
 * shouldReproduce(0.05, false, 0.01) → false (environmental block)
 * shouldReproduce(1.0, true, 0.5) → true (guaranteed if permitted)
 */
export function shouldReproduce(
    reproductionChance: number,
    canReproduce: boolean,
    randomRoll: number = Math.random()
): boolean {
    return canReproduce && randomRoll < reproductionChance;
}

/**
 * Determine if a plant part should grow
 *
 * @remarks
 * **Formula:** `currentQty < maxQty && randomRoll < growthProbability`
 *
 * **Logic:**
 * 1. Check capacity: current quantity below maximum
 * 2. Roll probability: generate random value
 * 3. Compare: if roll < chance, growth succeeds
 * 4. Biological intuition: mature organs grow if space available
 *
 * **Probability Meaning:**
 * - 0.0: Never grows (infertile)
 * - 0.01: 1% chance per tick (slow growth)
 * - 0.05: 5% chance per tick (normal growth)
 * - 1.0: Always grows (rapid maturation)
 *
 * **Edge Cases:**
 * - currentQty >= maxQty → always false (at capacity)
 * - growthProbability = 0.0 → always false (infertile)
 * - growthProbability = 1.0 → returns (currentQty < maxQty) (guaranteed if room)
 * - maxQty = 1 and currentQty = 1 → always false (mature organ)
 *
 * @param growthProbability - Calculated growth chance 0.0-1.0
 * @param currentQty - Current part quantity (0+)
 * @param maxQty - Maximum part quantity (>0)
 * @param randomRoll - Random value 0.0-1.0 for testing (injectable)
 * @returns true if part should grow, false if max reached or roll fails
 *
 * @example
 * shouldPartGrow(0.05, 2, 5, 0.03) → true (below max, roll succeeds)
 * shouldPartGrow(0.05, 5, 5, 0.03) → false (at max capacity)
 * shouldPartGrow(0.05, 2, 5, 0.07) → false (roll fails)
 * shouldPartGrow(1.0, 1, 3, 0.5) → true (guaranteed if room)
 */
export function shouldPartGrow(
    growthProbability: number,
    currentQty: number,
    maxQty: number,
    randomRoll: number = Math.random()
): boolean {
    return currentQty < maxQty && randomRoll < growthProbability;
}

/**
 * Determine if a plant part should drop (self-prune)
 *
 * @remarks
 * **Formula:** `currentQty > 0 && randomRoll < dropProbability`
 *
 * **Logic:**
 * 1. Check inventory: current quantity above zero
 * 2. Roll probability: generate random value
 * 3. Compare: if roll < chance, drop succeeds
 * 4. Biological intuition: mature organs shed naturally or under stress
 *
 * **Probability Meaning:**
 * - 0.0: Never drops (permanent)
 * - 0.01: 1% chance per tick (slow shedding)
 * - 0.05: 5% chance per tick (normal shedding)
 * - 1.0: Always drops (immediate shedding)
 *
 * **Edge Cases:**
 * - currentQty = 0 → always false (nothing to drop)
 * - dropProbability = 0.0 → always false (permanent organ)
 * - dropProbability = 1.0 → returns (currentQty > 0) (guaranteed if present)
 * - Single organ (maxQty = 1) → can still drop completely
 *
 * @param dropProbability - Calculated drop chance 0.0-1.0
 * @param currentQty - Current part quantity (0+)
 * @param randomRoll - Random value 0.0-1.0 for testing (injectable)
 * @returns true if part drops, false if empty or roll fails
 *
 * @example
 * shouldPartDrop(0.02, 3, 0.01) → true (has items, roll succeeds)
 * shouldPartDrop(0.02, 0, 0.01) → false (empty inventory)
 * shouldPartDrop(0.02, 3, 0.03) → false (roll fails)
 * shouldPartDrop(1.0, 1, 0.5) → true (guaranteed if present)
 */
export function shouldPartDrop(
    dropProbability: number,
    currentQty: number,
    randomRoll: number = Math.random()
): boolean {
    return currentQty > 0 && randomRoll < dropProbability;
}
