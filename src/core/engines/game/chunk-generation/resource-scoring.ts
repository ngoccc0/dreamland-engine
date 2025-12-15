/**
 * Resource scoring and calculation helper
 *
 * @remarks
 * Calculates chunk-level resource scores based on environmental factors
 * and determines item spawn limits and chances.
 */

import type { WorldProfile } from "@/core/types/game";
import { clamp01 } from "./helpers";

/**
 * Chunk environmental data type
 */
interface ChunkData {
    vegetationDensity?: number;
    moisture?: number;
    humanPresence?: number;
    dangerLevel?: number;
    predatorPresence?: number;
}

/**
 * Result of resource scoring calculation
 */
export interface ResourceScoreResult {
    chunkResourceScore: number;
    worldDensityScale: number;
    maxItems: number;
    chunkFindChance: number;
}

/**
 * Calculates chunk resource score based on environmental factors.
 *
 * @remarks
 * **Formula:**
 * Scores are normalized to 0-1 range using clamp01():
 * - vegetation: Direct from vegetationDensity
 * - moisture: Direct from moisture
 * - humanFactor: 1 - humanPresence (less humans = more resources)
 * - dangerFactor: 1 - dangerLevel (less danger = more resources)
 * - predatorFactor: 1 - predatorPresence (less predators = more resources)
 *
 * Final score is the average of all five factors, resulting in 0-1 range.
 *
 * @param chunkData - Environmental data for the chunk
 * @returns Score between 0 (poor) and 1 (rich)
 */
export function calculateChunkResourceScore(chunkData: ChunkData): number {
    const vegetation = clamp01(chunkData.vegetationDensity ?? 50);
    const moisture = clamp01(chunkData.moisture ?? 50);
    const humanFactor = 1 - clamp01(chunkData.humanPresence ?? 50);
    const dangerFactor = 1 - clamp01(chunkData.dangerLevel ?? 50);
    const predatorFactor = 1 - clamp01(chunkData.predatorPresence ?? 50);

    return (vegetation + moisture + humanFactor + dangerFactor + predatorFactor) / 5;
}

/**
 * Calculates item spawn parameters for a chunk.
 *
 * @remarks
 * **Calculations:**
 * 1. **chunkCountMultiplier**: Maps resource score to item count range [0.2, 0.7]
 * 2. **maxItems**: Base items (1.4) × effective multiplier × count multiplier
 * 3. **chunkFindChance**: Base chance (3.5%) × world density × find multiplier × effective multiplier
 *
 * **Tuning:**
 * - baseMaxItems: 1.4 (reduced 30% from original 2.0)
 * - baseFindChance: 3.5% (reduced 30% from original 5%)
 *
 * @param chunkResourceScore - Pre-calculated resource score (0-1)
 * @param worldProfile - Global world settings including resourceDensity
 * @param effectiveMultiplier - Softcapped spawn multiplier from world
 * @returns Object with maxItems and chunkFindChance values
 */
export function calculateItemSpawnParameters(
    chunkResourceScore: number,
    worldProfile: WorldProfile | undefined,
    effectiveMultiplier: number
): { maxItems: number; chunkFindChance: number } {
    const worldDensityScale = worldProfile?.resourceDensity ?? 1;
    const baseMaxItems = 1.4;

    // Map resource score to count multiplier [0.2, 0.7]
    const chunkCountMultiplier = 0.2 + (chunkResourceScore * 0.5 * worldDensityScale);

    // Calculate final max items
    const maxItems = Math.max(1, Math.floor(baseMaxItems * effectiveMultiplier * chunkCountMultiplier));

    // Calculate item find chance
    const baseFindChance = 0.035; // 3.5% baseline
    const chunkFindMultiplier = 0.6 + (chunkResourceScore * 0.6); // range [0.6,1.2]
    const chunkFindChance = Math.max(0.01, Math.min(0.9, baseFindChance * worldDensityScale * chunkFindMultiplier * effectiveMultiplier));

    return { maxItems, chunkFindChance };
}

/**
 * Calculates all resource-related parameters for chunk generation.
 *
 * @remarks
 * Combines resource score calculation and item spawn parameter calculation
 * into a single convenient call.
 *
 * @param chunkData - Chunk environmental data
 * @param worldProfile - World settings
 * @param effectiveMultiplier - Softcapped spawn multiplier
 * @returns Complete resource scoring result
 */
export function calculateResourceParameters(
    chunkData: ChunkData,
    worldProfile: WorldProfile | undefined,
    effectiveMultiplier: number
): ResourceScoreResult {
    const chunkResourceScore = calculateChunkResourceScore(chunkData);
    const worldDensityScale = worldProfile?.resourceDensity ?? 1;
    const { maxItems, chunkFindChance } = calculateItemSpawnParameters(
        chunkResourceScore,
        worldProfile,
        effectiveMultiplier
    );

    return {
        chunkResourceScore,
        worldDensityScale,
        maxItems,
        chunkFindChance
    };
}
