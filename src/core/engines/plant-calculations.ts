import type { Chunk, Season } from '@/core/types/game';
import type { CreatureDefinition } from '@/core/types/definitions/creature';
import { defaultGameConfig } from '@/lib/config/game-config';

/**
 * Pure calculation for environmental suitability
 */
export function calculateEnvironmentalSuitability(
    chunk: Chunk,
    season: Season
): {
    suitability: number;
    canGrow: boolean;
    canReproduce: boolean;
} {
    const config = defaultGameConfig.plant;
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
 * Pure calculation for vegetation density
 */
export function calculateVegetationDensity(plants: any[]): number {
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

/**
 * Pure stress damage calculation
 */
export function calculateStressDamage(stressLevel: number): number {
    return Math.ceil(stressLevel * 5);
}
