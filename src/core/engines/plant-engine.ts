import type { Chunk, WorldProfile, Season } from '@/core/types/game';
import type { CreatureDefinition } from '@/core/types/definitions/creature';
import defaultGameConfig from '@/lib/config/game-config';
import { scheduleNextEvent, calculateEnvironmentalMultiplier } from '@/core/usecases/adaptivePlantTick';
import { createRng } from '@/lib/narrative/rng';

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
     * Now handles individual plant instances and their contributions to vegetation density.
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
     * Add a new plant instance to a chunk and initialize scheduling.
     */
    addPlant(chunk: Chunk, plantDef: CreatureDefinition): void {
        if (!chunk.plants) chunk.plants = [];
        const instance = {
            definition: plantDef,
            hp: plantDef.hp,
            maturity: 0,
            age: 0
        };
        // Initialize scheduling for plant parts if they exist
        if (plantDef.plantProperties?.parts) {
            const envResult = calculateEnvironmentalMultiplier(chunk as any, this.config, 0, plantDef);
            const envMult = envResult.multiplier;
            for (const part of plantDef.plantProperties.parts) {
                const p = part as any; // runtime access
                if (p.currentQty === undefined) p.currentQty = 0;
                if ((p.currentQty || 0) < (p.maxQty || 0)) {
                    const rngSeed = `${chunk.x},${chunk.y},${plantDef.id},${p.name},spawn`;
                    p.nextTick = scheduleNextEvent(p, envMult, 0, rngSeed);
                    p.lastEnvMultiplier = envMult;
                    p.decayCounter = p.decayCounter || 0; // Initialize decay counter
                    p.staminaCost = p.staminaCost ?? 5; // Default 5 stamina per harvest
                }
            }
        }
        chunk.plants.push(instance);
    }

    /**
     * Process scheduled plant part events (growth/drop) for a chunk up to gameTime.
     * Respects processing caps to avoid spikes. Returns generated narrative events.
     */
    processDuePlantParts(
        chunk: Chunk,
        gameTime: number,
        maxEventsPerChunk: number = 100
    ): Array<{ text: string; type: 'narrative' | 'system' }> {
        const messages: Array<{ text: string; type: 'narrative' | 'system' }> = [];
        if (!chunk.plants || chunk.plants.length === 0) return messages;

        let eventsProcessed = 0;

        for (const plantInstance of chunk.plants) {
            if (!plantInstance.definition.plantProperties?.parts) continue;
            const parts = plantInstance.definition.plantProperties.parts as any[];
            const envResult = calculateEnvironmentalMultiplier(chunk as any, this.config, gameTime, plantInstance.definition);
            const envMult = envResult.multiplier;
            const envState = envResult.state;

            for (const part of parts) {
                if (typeof part.currentQty !== 'number') part.currentQty = 0;
                if (typeof part.decayCounter !== 'number') part.decayCounter = 0;
                part.staminaCost = part.staminaCost ?? 5;

                // Initialize nextTick if missing
                if ((part.nextTick === undefined || part.nextTick === null) && (part.currentQty || 0) < (part.maxQty || 0)) {
                    part.nextTick = scheduleNextEvent(part, envMult, gameTime, `${chunk.x},${chunk.y},${plantInstance.definition.id},${part.name}`);
                    part.lastEnvMultiplier = envMult;
                }

                // Handle UNSUITABLE state: increment decay counter
                if (envState === 'UNSUITABLE') {
                    part.decayCounter = (part.decayCounter || 0) + 1;
                    // After 10 ticks in unsuitable conditions, start losing parts
                    if (part.decayCounter >= 10 && part.currentQty > 0) {
                        part.currentQty = Math.max(0, part.currentQty - 1);
                        messages.push({ text: `${plantInstance.definition.name} is wilting from unsuitable conditions`, type: 'narrative' });
                    }
                } else {
                    // Reset decay counter in suitable conditions
                    part.decayCounter = 0;
                }

                // Reschedule if env changed significantly (>20%)
                if (part.lastEnvMultiplier !== undefined && part.lastEnvMultiplier > 0) {
                    const relChange = Math.abs(envMult - part.lastEnvMultiplier) / part.lastEnvMultiplier;
                    if (relChange > 0.2) {
                        part.nextTick = scheduleNextEvent(part, envMult, gameTime, `${chunk.x},${chunk.y},${plantInstance.definition.id},${part.name},reschedule`);
                        part.lastEnvMultiplier = envMult;
                    }
                }

                // Process due events (loop while due and cap not reached)
                while (part.nextTick !== null && part.nextTick !== undefined && part.nextTick <= gameTime && eventsProcessed < maxEventsPerChunk) {
                    const rngSeed = `${chunk.x},${chunk.y},${plantInstance.definition.id},${part.name},${part.nextTick}`;
                    const rng = createRng(rngSeed);

                    let eventApplied = false;

                    // Growth attempt
                    const growProb = (part.growProb || 0) * envMult;
                    if ((part.currentQty || 0) < (part.maxQty || 0) && rng.float() < growProb) {
                        part.currentQty = Math.min(part.maxQty || Infinity, (part.currentQty || 0) + 1);
                        messages.push({
                            text: `${part.name} grew on plant at (${chunk.x}, ${chunk.y})`,
                            type: 'system'
                        });
                        eventApplied = true;
                    }

                    // Drop attempt
                    const dropProb = (part.dropProb || 0) * envMult;
                    const windFactor = ((chunk as any).windLevel || 0) / 100;
                    const finalDropProb = dropProb + (part.name === 'leaves' ? windFactor * 0.005 : 0);
                    if ((part.currentQty || 0) > 0 && rng.float() < finalDropProb) {
                        part.currentQty = Math.max(0, (part.currentQty || 0) - 1);
                        messages.push({
                            text: `${part.name} dropped from plant at (${chunk.x}, ${chunk.y})`,
                            type: 'system'
                        });
                        eventApplied = true;
                    }

                    eventsProcessed++;

                    // Schedule next event
                    if ((part.currentQty || 0) < (part.maxQty || 0)) {
                        part.nextTick = scheduleNextEvent(part, envMult, gameTime, `${chunk.x},${chunk.y},${plantInstance.definition.id},${part.name},${eventsProcessed}`);
                    } else {
                        part.nextTick = null;
                    }

                    if (!eventApplied) break; // no actual change, stop loop
                }
            }

            // Remove plant if all harvestable parts are gone (currentQty = 0)
            const allPartsEmpty = parts.every(p => (p.currentQty || 0) === 0);
            if (allPartsEmpty) {
                const plantIndex = chunk.plants.indexOf(plantInstance);
                if (plantIndex >= 0) {
                    chunk.plants.splice(plantIndex, 1);
                    const plantName = typeof plantInstance.definition.name === 'string' 
                        ? plantInstance.definition.name 
                        : (plantInstance.definition.name as any).en || String(plantInstance.definition.id);
                    messages.push({
                        text: `${plantName} has completely withered away.`,
                        type: 'narrative'
                    });
                }
            }
        }

        return messages;
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
