import type { Chunk } from '@/core/types/game';
import plants from '@/lib/game/data/creatures/plants';
import type { CreatureDefinition } from '@/core/types/definitions/creature';
import {
    getGrowthScore,
    getWaterNeed,
    calculateHumidity,
} from '@/core/rules/weather';

/**
 * Lightweight farming helpers. These are small, pure helpers that operate on a
 * chunk and return an updated chunk. They intentionally don't reach into
 * repositories or engines — the caller (usecases / action handlers) should
 * perform state wiring (setWorld / save) and any narrative side-effects.
 */

export function tillSoil(chunk: Chunk): Chunk {
    const next: Chunk = { ...chunk } as any;
    next.soilType = 'tilled' as any;
    // Ensure farming fields are initialized
    if ((next as any).waterRetention === undefined) (next as any).waterRetention = 1;
    if ((next as any).waterTimer === undefined) (next as any).waterTimer = 0;
    if ((next as any).nutrition === undefined) (next as any).nutrition = 0;
    if ((next as any).fertilizerLevel === undefined) (next as any).fertilizerLevel = 0;
    return next;
}

export function waterTile(chunk: Chunk, durationTicks = 6): Chunk {
    const next: Chunk = { ...chunk } as any;
    const retention = (next as any).waterRetention ?? 1;
    (next as any).waterTimer = Math.max((next as any).waterTimer ?? 0, Math.ceil(durationTicks * retention));
    return next;
}

export function fertilizeTile(chunk: Chunk, nutritionBoost = 20): Chunk {
    const next: Chunk = { ...chunk } as any;
    (next as any).nutrition = Math.min(100, ((next as any).nutrition ?? 0) + nutritionBoost);
    (next as any).fertilizerLevel = ((next as any).fertilizerLevel ?? 0) + 1;
    return next;
}

/**
 * Attempt to plant a seed into a tilled chunk. Returns updated chunk and a boolean
 * indicating whether planting happened.
 */
export function plantSeed(chunk: Chunk, seedId: string): { chunk: Chunk; planted: boolean } {
    // Map some conventional seed IDs to plant definitions. Extend as needed.
    const seedMap: Record<string, string> = {
        'wildflower_seeds': 'tall_grass',
        'wild_cotton_seed': 'wild_cotton',
        'bamboo_seed': 'bamboo',
        'tree_sapling': 'common_tree'
    };

    const plantId = seedMap[seedId];
    if (!plantId) return { chunk, planted: false };
    const plantDef: CreatureDefinition | undefined = (plants as any)[plantId];
    if (!plantDef) return { chunk, planted: false };

    // Require tilled soil for planting crops
    if (chunk.soilType !== 'tilled') return { chunk, planted: false };

    const next: Chunk = { ...chunk } as any;
    if (!next.plants) next.plants = [];

    next.plants.push({
        definition: plantDef,
        hp: plantDef.hp,
        maturity: 0,
        age: 0
    } as any);

    return { chunk: next, planted: true };
}

/**
 * Execute a plant growth tick using weather rules.
 *
 * @param chunk - Chunk containing plant
 * @param plantIndex - Index of plant in chunk.plants
 * @param moisture - Current moisture level (0-100)
 * @param temperature - Current temperature in Celsius
 * @returns Updated chunk with grown plant and growth narrative
 *
 * @remarks
 * Integrates Phase 3.A pure functions:
 * - getGrowthScore(moisture, temperature) → growth multiplier (0-2.0)
 * - getWaterNeed(temperature) → daily water requirement (0-20)
 * - calculateHumidity(rainfall, temperature) → environment humidity (0-100)
 *
 * **Logic:**
 * 1. Calculate growth score based on moisture + temperature
 * 2. If growth > threshold (0.5), increment plant maturity
 * 3. Decay moisture by 5% (plant consumption)
 * 4. Return updated chunk + narrative about growth
 *
 * Pure rules ensure:
 * - Consistent growth mechanics
 * - Testable formulas
 * - Reusable across game systems
 */
export function executePlantGrowthTick(
    chunk: Chunk,
    plantIndex: number,
    moisture: number,
    temperature: number
): { chunk: Chunk; narrative: string } {
    if (!chunk.plants || !chunk.plants[plantIndex]) {
        return { chunk, narrative: 'Plant not found' };
    }

    const plant = chunk.plants[plantIndex];
    const growthScore = getGrowthScore(moisture, temperature);

    const next: Chunk = { ...chunk } as any;
    next.plants = [...next.plants!];

    // Only grow if conditions are sufficient
    if (growthScore > 0.5) {
        const updatedPlant = { ...plant };
        updatedPlant.maturity = (updatedPlant.maturity ?? 0) + growthScore;
        next.plants[plantIndex] = updatedPlant;
    }

    // Decay moisture (plant consumes water)
    (next as any).waterTimer = Math.max(0, ((next as any).waterTimer ?? 0) - 1);

    const narrative = growthScore > 0.5
        ? `Plant grew (score: ${growthScore.toFixed(2)})`
        : `Growth stalled (score: ${growthScore.toFixed(2)})`;

    return { chunk: next, narrative };
}

/**
 * Calculate water requirement for plants based on temperature and moisture.
 *
 * @param temperature - Current temperature in Celsius
 * @param currentMoisture - Current moisture level (0-100)
 * @returns Water amount needed per tick (0-20)
 *
 * @remarks
 * Uses pure rule getWaterNeed(temperature, moisture) to calculate
 * how much water plants need based on climate conditions.
 * Higher temps = more evaporation = more water needed.
 */
export function getWaterRequirement(temperature: number, currentMoisture: number): number {
    return getWaterNeed(temperature, currentMoisture);
}

export default {
    tillSoil,
    waterTile,
    fertilizeTile,
    plantSeed,
    executePlantGrowthTick,
    getWaterRequirement,
};
