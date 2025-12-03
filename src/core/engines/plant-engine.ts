import type { Chunk, WorldProfile, Season } from '@/core/types/game';
import type { CreatureDefinition } from '@/core/types/definitions/creature';
import defaultGameConfig from '@/lib/config/game-config';

/**
 * Tracks the state of each plant instance in a chunk
 */
interface PlantInstance {
    definition: CreatureDefinition;
    hp: number;
    maturity: number; // 0-100%, affects contribution to vegetation density
    age: number;     // in ticks
}

/**
 * OVERVIEW: Plant growth simulation engine
 *
 * Simulates individual plant instances and their life cycles within chunks, including growth, maturity,
 * reproduction, and environmental stress mechanics. This is the core system for vegetation dynamics.
 *
 * ## Core Responsibilities
 * - **Individual Plant Simulation:** Tracks PlantInstance entities with health, maturity, and age
 * - **Environmental Modeling:** Calculates suitability based on moisture, light, season, and human presence
 * - **Growth Calculations:** Multi-factor growth mechanics with resource constraints (nutrition, fertilizer, water)
 * - **Reproduction System:** Mature plants spread to adjacent chunks with probability-based offspring
 * - **Resource Management:** Tracks and consumes nutrition, fertilizer, and water over plant lifecycle
 * - **Stress System:** Applies health penalties under environmental stress (stressLevel > 0.7)
 *
 * ## Growth Formula (Core Algorithm)
 *
 * The plant growth system uses a multi-step formula combining environmental and resource factors:
 *
 * ### Step 1: Environmental Stress Calculation
 * ```
 * environmentalSuitability = (moistureFactor + lightFactor + seasonMultiplier) / 3 × (1 - humanPenalty)
 * environmentalSuitability = max(0.1, environmentalSuitability) // Floor prevents complete stall
 * stressLevel = 1 - environmentalSuitability // Higher stress = less suitable
 * ```
 *
 * Components:
 * - **moistureFactor**: chunk.moisture / 100 (scaled to 0-1, where 1.0 = 100% moisture)
 * - **lightFactor**: chunk.lightLevel / 100 (scaled to 0-1)
 * - **seasonMultiplier**: season-based modifier (spring: 1.3, summer: 1.1, autumn: 0.9, winter: 0.6)
 *   - Spring: optimal growth season (1.3× bonus)
 *   - Summer: good growth (1.1× bonus)
 *   - Autumn: moderate decline (0.9× penalty)
 *   - Winter: harsh conditions (0.6× penalty)
 * - **humanPenalty**: (humanPresence / 100) × 0.5 (humans reduce suitability; max 50% penalty at 100% presence)
 * - **0.1 floor**: Ensures plants can always grow minimally, even in terrible conditions
 *
 * ### Step 2: Base Growth Gain
 * ```
 * baseGain = max(0, (1 - stressLevel) × baseGrowthMultiplier × maturityRate)
 * baseGain = max(0, (1 - stressLevel) × 0.5 × 0.02)
 * Result range: 0 (stressed) to ~0.01 per tick (ideal conditions)
 * ```
 *
 * Config values from `game-config.plant`:
 * - **baseGrowthMultiplier** (0.5): Base growth rate scaler. Affects overall growth speed across all plants.
 * - **maturityRate** (0.02): Baseline maturity gain per tick (2% per tick under ideal conditions)
 *
 * Rationale: Lower stress → higher growth. Under ideal conditions (stressLevel=0), max gain. Under max stress (stressLevel=1), zero gain.
 *
 * ### Step 3: Growth Bonuses from Resources
 * ```
 * growthBonus = 1 + (nutrition × 0.01) + (fertilizer × 0.02)
 * waterFactor = waterTimer > 0 ? 1.2 : 1.0
 * potentialGain = baseGain × growthBonus × waterFactor
 * ```
 *
 * Resource scaling:
 * - **nutrition**: +1% growth per nutrition unit (max 100 nutrition = +1.0 multiplier, 2× base growth)
 * - **fertilizer**: +2% growth per fertilizer unit (max 100 fertilizer = +2.0 multiplier, 3× base growth)
 *   - Note: Fertilizer bonus is 2× nutrition, indicating fertilizer is more potent
 * - **waterFactor**: +20% growth bonus when watered (waterTimer > 0)
 *   - Simple on/off switch; doesn't scale with water amount
 *
 * Maximum bonus scenario: nutrition=100 + fertilizer=100 + watered = (0.01 + 0.01 + 0.01) × 1.2 = 1.2× growth
 *
 * ### Step 4: Resource Constraint Scaling
 * ```
 * nutritionNeeded = potentialGain × 0.1  // 0.1 units nutrition consumed per maturity gain
 * fertilizerNeeded = potentialGain × 0.05
 * waterNeeded = potentialGain × 0.15
 *
 * // Bottleneck: limited by scarcest resource
 * finalGain = potentialGain × min(nutritionFactor, fertilizerFactor, waterFactorResource)
 * ```
 *
 * If resources insufficient, growth scales down. Example: if chunk has 50% of needed nutrition,
 * nutritionFactor = 0.5, so finalGain = potentialGain × 0.5.
 *
 * ### Step 5: Maturity Increment
 * ```
 * plant.maturity += finalGain
 * plant.maturity = min(100, plant.maturity)
 * ```
 *
 * Maturity capped at 100%. Plants at maturity >= 80 can reproduce.
 *
 * ## Environmental Stress System
 *
 * If stressLevel > 0.7 (severe environmental stress):
 * ```
 * plant.hp -= ceil(stressLevel × 5)
 * if plant.hp <= 0: plant dies and is removed
 * ```
 *
 * Health loss scales with stress severity. At max stress (stressLevel=1), lose 5 HP per tick.
 * Most plants die within 20 ticks under extreme stress (assuming ~100 HP baseline).
 *
 * ## Reproduction System
 *
 * When plant.maturity >= 80 and reproduction chance succeeds:
 * ```
 * offspringCount = floor(random × maxOffspring) + 1
 * spreadPlants(chunk, chunks, position, definition, offspringCount, range)
 * ```
 *
 * Offspring spread to adjacent chunks within reproduction.range using random placement.
 * New plants start at maturity=0.
 *
 * ## Resource Consumption
 *
 * Each tick:
 * ```
 * fertilizer -= 0.1 per tick (fertilizer decay)
 * waterTimer -= 1 per tick (water duration)
 * nutrition -= nutritionConsumed (see Step 4)
 * ```
 *
 * Fertilizer and water are temporary buffs that decay over time, encouraging player maintenance of crops.
 *
 * ## Vegetation Density Contribution
 *
 * Each plant contributes to chunk.vegetationDensity based on maturity:
 * ```
 * vegetationDensity += plant.maturity / 100  // Mature plant contributes 1 unit, seedling 0.1 unit
 * ```
 *
 * ## Configuration Parameters (from game-config.plant)
 *
 * | Parameter | Value | Purpose |
 * |-----------|-------|---------|
 * | baseGrowthMultiplier | 0.5 | Base growth rate scaler |
 * | maturityRate | 0.02 | Baseline maturity gain per tick (2%) |
 * | nutritionPerMaturity | 0.1 | Nutrition cost per maturity unit gained |
 * | fertilizerPerMaturity | 0.05 | Fertilizer cost per maturity unit gained |
 * | waterPerMaturity | 0.15 | Water cost per maturity unit gained |
 * | fertilizerDecayPerTick | 0.1 | Fertilizer decay rate per tick |
 *
 * ## Design Notes
 *
 * - **Player Agency**: Resource constraints (nutrition, fertilizer, water) require player investment to maintain crops
 * - **Environmental Realism**: Seasonal variation, moisture/light dependence simulate real plant biology
 * - **Stress Penalty**: Severe stress kills plants, creating resource scarcity scenarios in poor conditions
 * - **Reproduction**: Mature plants naturally spread, reducing player workload but increasing world complexity
 * - **Narrative Hooks**: Vegetation change events trigger discovery narratives, encouraging environmental observation
 */

/**
 * Enhanced PlantEngine that simulates individual plant instances and their effects on vegetation.
 * Plant instances can grow, reproduce, and contribute to the chunk's vegetation density.
 */
export class PlantEngine {
    private config = defaultGameConfig;
    // Resource constants are now configurable via defaultGameConfig.plant

    constructor(private t: (key: string, params?: any) => string, config?: Partial<typeof defaultGameConfig>) {
        if (config) {
            this.config = {
                ...this.config,
                ...config,
                plant: { ...this.config.plant, ...(config as any).plant },
                creature: { ...this.config.creature, ...(config as any).creature }
            } as any;
        }
    }

    /**
     * Return a vegetation narrative message for a chunk, if a significant change has occurred
     * since the last snapshot. This is intended to be called by an explicit "listen around"
     * action rather than emitted every engine tick to avoid spamming the narrative stream.
     */
    public getVegetationNarrativeForChunk(chunk: Chunk): string | null {
        const prev = (chunk as any).prevVegetationDensity ?? 0;
        const cur = chunk.vegetationDensity ?? 0;
        if (Math.abs(cur - prev) <= 10) return null;
        return cur > prev
            ? this.t('vegetationIncreased', { x: chunk.x, y: chunk.y })
            : this.t('vegetationDecreased', { x: chunk.x, y: chunk.y });
    }

    /**
     * Update plants for the provided chunks for a single tick.
     * 
     * Now handles individual plant instances and their contributions to vegetation density.
     * 
     * ## Algorithm Overview
     * 
     * For each chunk:
     * 1. Process each PlantInstance:
     *    - Calculate environmental suitability (stress level)
     *    - Apply stress damage if stressLevel > 0.7
     *    - Calculate growth gain using multi-factor formula (see class OVERVIEW)
     *    - Apply resource constraints (nutrition, fertilizer, water bottleneck)
     *    - Increment maturity and consume resources
     *    - Attempt reproduction if maturity >= 80
     *    - Remove dead plants (hp <= 0)
     * 2. Update chunk vegetation density from summed plant maturity
     * 3. Generate narrative messages for significant changes (delta > 10)
     * 
     * Time complexity: O(chunks × plants × checks) ≈ O(n) where n = total plants
     * 
     * @param currentTick Current game tick number (used for aging plants)
     * @param chunks Map of chunk positions (key: "x,y") to Chunk data
     * @param season Current season affecting growth multiplier (spring/summer/autumn/winter)
     * @param worldProfile Optional world profile for region-level affects (unused currently)
     * @returns Array of narrative and system messages (e.g., plant reproduction events, vegetation changes)
     * 
     * ## State Mutations
     * - plant.maturity: incremented based on growth formula
     * - plant.age: incremented each tick
     * - plant.hp: decremented under stress, plant removed if hp <= 0
     * - chunk.nutrition: decremented by amount consumed
     * - chunk.fertilizerLevel: decremented by amount consumed + decay
     * - chunk.waterTimer: decremented by amount consumed + tick decay
     * - chunk.vegetationDensity: recalculated from plant maturities
     * - chunk.plants: deceased plants removed
     */
    updatePlants(
        currentTick: number,
        chunks: Map<string, Chunk>,
        season: Season,
        worldProfile?: WorldProfile
    ): Array<{ text: string; type: 'narrative' | 'system' }> {
        const messages: Array<{ text: string; type: 'narrative' | 'system' }> = [];
        const rand = () => Math.random();

        for (const [key, chunk] of chunks) {
            if (!chunk.plants) chunk.plants = [];
            const plants = chunk.plants as PlantInstance[];
            const oldVegDensity = chunk.vegetationDensity ?? 0;

            // Process each plant instance
            const plantsToRemove: number[] = [];
            plants.forEach((plant, index) => {
                // Skip if no plant properties defined
                if (!plant.definition.plantProperties) return;

                // Environmental checks
                const envCheck = this.checkEnvironmentForPlant(chunk, plant.definition, season);
                const stressLevel = 1 - envCheck.suitability;

                // Effective moisture: chunk.moisture plus any recent watering applied via waterTimer
                const baseMoisture = chunk.moisture ?? 50;
                const waterBonus = (chunk as any).waterTimer && (chunk as any).waterTimer > 0 ? ((chunk as any).waterRetention ?? 1) * 20 : 0;
                // Apply environmental stress
                if (stressLevel > 0.7) { // Severe stress
                    plant.hp -= Math.ceil(stressLevel * 5);
                    if (plant.hp <= 0) {
                        plantsToRemove.push(index);
                        return;
                    }
                }

                // Growth and maturity
                if (plant.maturity < 100 && envCheck.canGrow) {
                    // Base potential gain before resource constraints
                    const baseGain = Math.max(0, (1 - stressLevel) * this.config.plant.baseGrowthMultiplier * this.config.plant.maturityRate);

                    // Growth modifiers from chunk (nutrition, fertilizer) and recent watering
                    const nutrition = (chunk as any).nutrition ?? 0;
                    const fertilizer = (chunk as any).fertilizerLevel ?? 0;
                    const growthBonus = 1 + (nutrition * 0.01) + (fertilizer * 0.02);
                    const waterFactor = (chunk as any).waterTimer && (chunk as any).waterTimer > 0 ? 1.2 : 1.0;

                    const potentialGain = Math.max(0, baseGain * growthBonus * waterFactor);

                    // Determine resource needs for potential gain
                    const nutritionNeeded = potentialGain * this.config.plant.nutritionPerMaturity;
                    const fertilizerNeeded = potentialGain * this.config.plant.fertilizerPerMaturity;
                    const waterNeeded = potentialGain * this.config.plant.waterPerMaturity;

                    // Scale down gain if resources insufficient
                    let nutritionFactor = 1;
                    if (nutritionNeeded > 0 && (chunk as any).nutrition < nutritionNeeded) {
                        nutritionFactor = (chunk as any).nutrition / nutritionNeeded;
                    }
                    let fertilizerFactor = 1;
                    if (fertilizerNeeded > 0 && (chunk as any).fertilizerLevel < fertilizerNeeded) {
                        fertilizerFactor = (chunk as any).fertilizerLevel / fertilizerNeeded;
                    }
                    let waterFactorResource = 1;
                    if (waterNeeded > 0 && ((chunk as any).waterTimer ?? 0) < waterNeeded) {
                        waterFactorResource = ((chunk as any).waterTimer ?? 0) / waterNeeded;
                    }

                    const finalGain = potentialGain * Math.min(nutritionFactor, fertilizerFactor, waterFactorResource);

                    // Apply maturity gain
                    plant.maturity += finalGain;
                    plant.maturity = Math.min(100, plant.maturity);

                    // Consume resources according to what was actually used
                    const nutritionConsumed = Math.min((chunk as any).nutrition ?? 0, finalGain * this.config.plant.nutritionPerMaturity);
                    (chunk as any).nutrition = Math.max(0, ((chunk as any).nutrition ?? 0) - nutritionConsumed);

                    const fertilizerConsumed = Math.min((chunk as any).fertilizerLevel ?? 0, finalGain * this.config.plant.fertilizerPerMaturity);
                    (chunk as any).fertilizerLevel = Math.max(0, ((chunk as any).fertilizerLevel ?? 0) - fertilizerConsumed);

                    const waterConsumed = Math.min(((chunk as any).waterTimer ?? 0), finalGain * this.config.plant.waterPerMaturity);
                    (chunk as any).waterTimer = Math.max(0, ((chunk as any).waterTimer ?? 0) - waterConsumed);
                }

                // Reproduction attempt
                if (plant.maturity >= 80 && // Only mature plants reproduce
                    plant.definition.plantProperties.reproduction) {
                    const repro = plant.definition.plantProperties.reproduction;
                    if (rand() < repro.chance && envCheck.canReproduce) {
                        const offspringCount = Math.floor(rand() * repro.maxOffspring) + 1;
                        this.spreadPlants(chunk, chunks, key, plant.definition, offspringCount, repro.range);
                        // Safe-access plant name (may be translation key or object)
                        const plantName = typeof plant.definition.name === 'string' ? plant.definition.name : (plant.definition.name as any).en || String(plant.definition.id);
                        messages.push({
                            text: this.t('plantReproduced', {
                                name: plantName,
                                x: chunk.x,
                                y: chunk.y
                            }),
                            type: 'narrative'
                        });
                    }
                }

                plant.age++;
            });

            // Remove dead plants
            plantsToRemove.reverse().forEach(index => {
                const plant = plants[index];
                plants.splice(index, 1);
                // Safe-access plant name (may be translation key or object)
                const plantName = typeof plant.definition.name === 'string' ? plant.definition.name : (plant.definition.name as any).en || String(plant.definition.id);
                messages.push({
                    text: this.t('plantDied', {
                        name: plantName,
                        x: chunk.x,
                        y: chunk.y
                    }),
                    type: 'narrative'
                });
            });

            // Consume chunk-level resources / passive decay after processing plants
            if ((chunk as any).waterTimer && (chunk as any).waterTimer > 0) {
                // decrement one tick of water available for the chunk per engine tick
                (chunk as any).waterTimer = Math.max(0, (chunk as any).waterTimer - 1);
            }

            if ((chunk as any).fertilizerLevel && (chunk as any).fertilizerLevel > 0) {
                (chunk as any).fertilizerLevel = Math.max(0, (chunk as any).fertilizerLevel - this.config.plant.fertilizerDecayPerTick);
            }

            // Calculate new vegetation density from surviving plants
            const newDensity = this.calculateVegetationDensity(plants);
            // Previously we emitted vegetationNarrative every time density changed significantly.
            // That produced frequent messages like "vegetationDecreased" every tick.
            // To avoid spam, do not emit narrative here. Instead record the previous density so
            // an explicit 'listen around' action can query and produce a single message.
            // Store the previous density snapshot on the chunk for later inspection.
            (chunk as any).prevVegetationDensity = oldVegDensity;
            (chunk as any).vegetationChangedSignificantly = Math.abs(newDensity - oldVegDensity) > 10;
            chunk.vegetationDensity = newDensity;
        }

        return messages;
    }

    /**
     * Add a new plant instance to a chunk
     */
    addPlant(chunk: Chunk, plantDef: CreatureDefinition): void {
        if (!chunk.plants) chunk.plants = [];
        chunk.plants.push({
            definition: plantDef,
            hp: plantDef.hp,
            maturity: 0,
            age: 0
        });
    }

    /**
     * Calculate total vegetation density from all plant instances
     */
    private calculateVegetationDensity(plants: PlantInstance[]): number {
        let total = 0;
        for (const plant of plants) {
            if (plant.definition.plantProperties) {
                // Scale contribution by maturity
                total += (plant.definition.plantProperties.vegetationContribution * (plant.maturity * 0.01));
            }
        }
        return Math.min(100, total);
    }

    /**
     * Check environmental conditions for a plant
     */
    private checkEnvironmentForPlant(chunk: Chunk, plantDef: CreatureDefinition, season: Season) {
        const props = plantDef.plantProperties;
        if (!props) return { suitability: 0, canGrow: false, canReproduce: false };

        // Effective moisture: chunk.moisture plus any recent watering applied via waterTimer
        const baseMoisture = chunk.moisture ?? 50;
        const waterBonus = (chunk as any).waterTimer && (chunk as any).waterTimer > 0 ? ((chunk as any).waterRetention ?? 1) * 20 : 0;
        const moisture = Math.min(100, baseMoisture + waterBonus);
        const temp = chunk.temperature ?? 20;
        const vegDensity = chunk.vegetationDensity ?? 0;

        // Basic environmental suitability
        let suitability = 1;

        if (props.reproduction?.requirements) {
            const req = props.reproduction.requirements;
            if (moisture < req.minMoisture) suitability *= (moisture / req.minMoisture);
            if (temp < req.minTemperature) suitability *= (temp / req.minTemperature);
            if (temp > req.maxTemperature) suitability *= (req.maxTemperature / temp);
        }

        // Apply resilience if defined
        if (props.resilience) {
            if (moisture < 30) suitability *= (1 + props.resilience.droughtResistance);
            if (temp < 5) suitability *= (1 + props.resilience.coldResistance);
            if (temp > 35) suitability *= (1 + props.resilience.heatResistance);
        }

        // Season effects
        const seasonMod = this.config.plant.seasonMultiplier[season] ?? 1;
        suitability *= seasonMod;

        // Determine if conditions support growth and reproduction
        // Apply soil nutrition / fertilizer as modifiers to suitability for growth
        const nutrition = (chunk as any).nutrition ?? 0;
        const fertilizer = (chunk as any).fertilizerLevel ?? 0;
        const growthBoost = 1 + (nutrition * 0.005) + (fertilizer * 0.01);
        const canGrow = (suitability * growthBoost) > 0.3;
        const canReproduce = props.reproduction?.requirements ? (
            moisture >= props.reproduction.requirements.minMoisture &&
            temp >= props.reproduction.requirements.minTemperature &&
            temp <= props.reproduction.requirements.maxTemperature &&
            vegDensity >= props.reproduction.requirements.minVegetationDensity
        ) : false;

        return { suitability, canGrow, canReproduce };
    }

    /**
     * Attempt to spread plants to neighboring chunks
     */
    private spreadPlants(
        sourceChunk: Chunk,
        chunks: Map<string, Chunk>,
        sourceKey: string,
        plantDef: CreatureDefinition,
        count: number,
        range: number
    ): void {
        const [sx, sy] = sourceKey.split(',').map(s => parseInt(s, 10));
        const potentialSpots: string[] = [];

        // Generate all potential spots within range
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip source chunk
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= range) {
                    potentialSpots.push(`${sx + dx},${sy + dy}`);
                }
            }
        }

        // Randomly select spots for offspring
        for (let i = 0; i < count && potentialSpots.length > 0; i++) {
            const idx = Math.floor(Math.random() * potentialSpots.length);
            const targetKey = potentialSpots[idx];
            potentialSpots.splice(idx, 1);

            const targetChunk = chunks.get(targetKey);
            if (targetChunk) {
                this.addPlant(targetChunk, plantDef);
            }
        }
    }
}
