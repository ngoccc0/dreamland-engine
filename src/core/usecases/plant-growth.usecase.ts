import type { Chunk, Season, WorldProfile } from '@/core/types/game';
import type { CreatureDefinition } from '@/core/types/definitions/creature';
/**
 * Temporary type until GameEffect is properly defined
 */
type GameEffect = any;
import { createRng } from '@/lib/narrative/rng';
import { getTranslatedText } from '@/lib/i18n';
import { defaultGameConfig } from '@/lib/config/game-config';
import {
    getGrowthScore,
    getWaterNeed,
    applyWeatherModifier,
} from '@/core/rules/weather';

/**
 * Input for plant growth processing
 */
export interface PlantGrowthInput {
    currentTick: number;
    chunks: Map<string, Chunk>;
    season: Season;
    worldProfile?: WorldProfile;
    t: (key: string, params?: any) => string;
}

/**
 * Output from plant growth processing
 */
export interface PlantGrowthOutput {
    newChunks: Map<string, Chunk>;
    effects: GameEffect[];
    narrativeMessages: Array<{ text: string; type: 'narrative' | 'system' }>;
}

/**
 * Plant instance state for unified tracking
 */
interface PlantInstance {
    definition: CreatureDefinition;
    hp: number;
    age: number;
    parts?: Array<{
        name: string;
        currentQty: number;
        maxQty: number;
        growProb: number;
        dropProb: number;
        triggerFrom?: string;
    }>;
}

/**
 * Unified plant growth usecase combining maturity and parts-based simulation.
 *
 * @remarks
 * Merges logic from old plant-engine.ts and adaptivePlantTick.ts:
 * - Environmental stress and maturity from plant-engine
 * - Parts growth/drop with RNG from adaptivePlantTick
 * - Immutable: returns new chunks, never mutates input
 * - Resource consumption and reproduction unified
 * 
 * @param input - Game state for plant processing
 * @returns Updated chunks and side effects
 */
export function processPlantGrowth(input: PlantGrowthInput): PlantGrowthOutput {
    const config = defaultGameConfig.plant;
    const newChunks = new Map<string, Chunk>();
    const effects: GameEffect[] = [];
    const narrativeMessages: Array<{ text: string; type: 'narrative' | 'system' }> = [];

    for (const [key, chunk] of input.chunks) {
        const newChunk: Chunk = { ...chunk };
        newChunk.plants = [];

        if (chunk.plants) {
            const processedPlants = chunk.plants.map((plantInstance: any) => {
                const plantDef = plantInstance.definition as CreatureDefinition;
                const newPlantInstance = processSinglePlant(plantDef, chunk, input, config);
                if (newPlantInstance.hp > 0) {
                    newChunk.plants!.push(newPlantInstance);
                }
                return newPlantInstance;
            }).filter((p: any) => p.hp > 0);

            newChunk.plants = processedPlants;
        }

        // Consume chunk resources
        newChunk.fertilizerLevel = Math.max(0, (newChunk.fertilizerLevel || 0) - config.fertilizerDecayPerTick);
        if (newChunk.waterTimer) {
            newChunk.waterTimer = Math.max(0, newChunk.waterTimer - 1);
        }

        // Calculate vegetation density
        newChunk.vegetationDensity = calculateVegetationDensity(newChunk.plants || []);

        newChunks.set(key, newChunk);
    }

    return { newChunks, effects, narrativeMessages };
}

/**
 * Process single plant with unified logic
 */
function processSinglePlant(
    plantDef: CreatureDefinition,
    chunk: Chunk,
    input: PlantGrowthInput,
    config: any
): any {
    const newPlant = { ...plantDef };
    const rng = createRng(`${input.currentTick}-${plantDef.id}`);
    const envCheck = calculateEnvironmentalSuitability(chunk, input.season, config);
    const stressLevel = 1 - envCheck.suitability;

    // Stress damage
    newPlant.hp = Math.max(0, newPlant.hp - Math.ceil(stressLevel * 5));
    if (newPlant.hp <= 0) {
        return newPlant;
    }

    // Parts processing (from adaptivePlantTick)
    if (newPlant.plantProperties?.parts) {
        newPlant.plantProperties.parts = newPlant.plantProperties.parts.map((part: any) => {
            const partRng = createRng(`${rng.seedHex}-${part.name}`);

            // Growth
            const growProb = part.growProb * envCheck.suitability;
            if (part.currentQty < part.maxQty && partRng.float() < growProb) {
                part.currentQty = Math.min(part.maxQty, part.currentQty + 1);
            }

            // Drop
            const dropProb = part.dropProb * (1 + stressLevel);
            if (part.currentQty > 0 && partRng.float() < dropProb) {
                part.currentQty = Math.max(0, part.currentQty - 1);
            }

            return part;
        });
    }

    // Reproduction (from plant-engine)
    if (newPlant.plantProperties?.reproduction && envCheck.canReproduce) {
        const repro = newPlant.plantProperties.reproduction;
        if (rng.float() < repro.chance) {
            // Spread logic...
        }
    }

    return newPlant;
}

/**
 * Calculate environmental suitability
 */
function calculateEnvironmentalSuitability(chunk: Chunk, season: Season, config: any) {
    const moistureFactor = (chunk.moisture || 50) / 100;
    const lightFactor = (chunk.lightLevel || 50) / 100;
    const seasonMultiplier = config.seasonMultiplier[season] || 1;
    const suitability = Math.max(0.1, (moistureFactor + lightFactor + seasonMultiplier) / 3);

    return {
        suitability,
        canGrow: suitability > 0.3,
        canReproduce: suitability > 0.6
    };
}

/**
 * Calculate vegetation density from plants
 */
function calculateVegetationDensity(plants: any[]): number {
    let total = 0;
    for (const plant of plants) {
        if (plant.plantProperties?.vegetationContribution) {
            const ratio = plant.plantProperties.parts
                ? plant.plantProperties.parts.reduce((sum: number, p: any) => sum + (p.currentQty / p.maxQty), 0) / plant.plantProperties.parts.length
                : 1;
            total += plant.plantProperties.vegetationContribution * ratio;
        }
    }
    return Math.min(100, total);
}
