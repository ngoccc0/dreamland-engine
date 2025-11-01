/**
 * Entity generation engine responsible for spawning game entities (items, enemies, NPCs) in the world.
 * This module implements probabilistic spawning algorithms that consider chunk conditions, item properties,
 * and world generation parameters to create diverse and balanced game environments.
 *
 * Key responsibilities:
 * - Condition validation against chunk properties (terrain, moisture, vegetation, etc.)
 * - Probabilistic entity selection based on spawn chances and world multipliers
 * - Item tier-based spawn rate adjustments for game balance
 * - Chunk resource scoring for environmental influence on spawning
 * - World profile integration for global spawn rate modifications
 *
 * Data flow and interdependencies:
 * 1. Chunk properties → condition checking via checkConditions()
 * 2. ItemDefinition.tier → spawn probability modifiers
 * 3. WorldProfile → global multipliers and resource density bonuses
 * 4. SpawnConditions → per-entity spawn requirements and chances
 * 5. Entity selection → filtered and randomized spawning results
 *
 * Spawn probability calculation pipeline:
 * Base Chance → Tier Modifier → World Density Bonus → Chunk Resource Multiplier → Global Multiplier → Final Chance
 *
 * Algorithm complexity:
 * - O(n log n) for entity selection due to shuffling and filtering
 * - O(m) for condition checking where m = number of conditions
 * - Optimized for world generation performance with early termination
 */

import type { Chunk, SpawnConditions, TranslatableString, ItemDefinition, WorldProfile, Terrain } from "../types";
import { SoilType } from "../types";
import { logger } from "@/lib/logger";

/**
 * Validates whether an entity's spawn conditions are met by the current chunk properties.
 * This function implements the core logic for conditional entity spawning, ensuring entities
 * only appear in appropriate environmental contexts.
 *
 * Condition evaluation logic:
 * 1. **Numeric Range Conditions**: Properties like moisture, vegetationDensity, temperature
 *    are checked against min/max ranges defined in SpawnConditions
 * 2. **Soil Type Matching**: soilType condition requires exact match from allowed soil types
 * 3. **Special Handling**: 'chance' property is ignored (handled separately in spawn probability)
 * 4. **Type Safety**: Non-numeric or malformed conditions are skipped with logging
 *
 * Interdependencies:
 * - Uses SpawnConditions schema from ItemDefinition.naturalSpawn
 * - Called by selectEntities() for each potential spawn candidate
 * - Chunk properties must match the terrain-extended Chunk type
 * - Results determine which entities are eligible for probabilistic selection
 *
 * Performance notes:
 * - O(k) complexity where k = number of conditions
 * - Early termination on first failed condition
 * - Designed for frequent calls during world generation
 *
 * @param conditions - Spawn requirements defined in entity templates or item definitions
 * @param chunk - Current chunk properties including extended terrain information
 * @returns true if all conditions are satisfied, false otherwise
 */
export const checkConditions = (conditions: SpawnConditions, chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures' | 'lastVisited'> & { terrain: Terrain }): boolean => {
    for (const key in conditions) {
        if (key === 'chance') continue;
        const condition = conditions[key as keyof typeof conditions];
        
        const chunkValue = chunk[key as keyof typeof chunk];

        if (key === 'soilType') {
            const soilConditions = condition as SoilType[];
            if (!soilConditions.includes(chunk.soilType)) return false;
            continue;
        }

        if (typeof chunkValue !== 'number' || typeof condition !== 'object' || condition === null) continue;
        
        const range = condition as { min?: number; max?: number };
        if (range.min !== undefined && chunkValue < range.min) return false;
        if (range.max !== undefined && chunkValue > range.max) return false;
    }
    return true;
};

/**
 * Probabilistic entity selection algorithm that implements the complete spawn pipeline.
 * This function transforms potential spawn candidates into actual spawned entities through
 * a multi-stage filtering and randomization process.
 *
 * Selection pipeline:
 * 1. **Input Validation**: Filter out null/undefined entities and those missing conditions
 * 2. **Condition Filtering**: Apply checkConditions() to ensure environmental suitability
 * 3. **Randomization**: Shuffle valid entities to prevent deterministic ordering
 * 4. **Chunk Resource Scoring**: Calculate environmental influence on spawn rates
 * 5. **Probability Calculation**: Apply tier modifiers, world bonuses, and chunk multipliers
 * 6. **Random Selection**: Use calculated probabilities to determine final spawns
 *
 * Spawn probability calculation (per entity):
 * ```
 * Base Chance (from conditions.chance, default 1.0)
 * → Tier Modifier: chance *= (0.9)^(tier-1) [reduces high-tier spawn rates]
 * → World Density Bonus: chance += (resourceDensity - 50) / 100 [-0.5 to +0.5]
 * → Chunk Resource Multiplier: chance *= 0.6 + (resourceScore * 0.8) [0.6 to 1.4]
 * → Global Multiplier: chance *= softcap(worldProfile.spawnMultiplier) [prevent runaway]
 * → Final Clamp: max(0, min(0.95, chance)) [safe probability range]
 * ```
 *
 * Chunk resource scoring formula:
 * ```
 * vegetationFactor = vegetationDensity / 100
 * moistureFactor = moisture / 100
 * humanFactor = 1 - (humanPresence / 100) [inverse relationship]
 * dangerFactor = 1 - (dangerLevel / 100) [inverse relationship]
 * predatorFactor = 1 - (predatorPresence / 100) [inverse relationship]
 * resourceScore = (veg + moist + human + danger + pred) / 5 [0-1 scale]
 * ```
 *
 * Interdependencies:
 * - Consumes ItemDefinition.tier for spawn rate balancing
 * - Uses WorldProfile for global spawn modifications
 * - Calls checkConditions() for environmental validation
 * - Returns entities for integration with chunk/item generation systems
 *
 * Performance characteristics:
 * - O(n log n) due to shuffling operation
 * - Early termination when maxCount is reached
 * - Optimized for world generation with bounded entity counts
 * - Extensive error handling and logging for data integrity
 *
 * @template T - Entity type with optional name/type and conditions properties
 * @param availableEntities - Array of potential entities to spawn
 * @param maxCount - Maximum number of entities to select (capacity limit)
 * @param chunk - Current chunk properties for condition checking
 * @param allItemDefinitions - Complete item registry for tier lookups
 * @param worldProfile - World generation parameters affecting spawn rates
 * @returns Array of selected entities that passed all filters and probability checks
 */
export const selectEntities = <T extends { name?: TranslatableString | string; type?: string; data?: any; conditions?: any }>(
    availableEntities: T[] | undefined,
    maxCount: number,
    chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures' | 'lastVisited'> & { terrain: Terrain },
    allItemDefinitions: Record<string, ItemDefinition>,
    worldProfile: WorldProfile,
): any[] => {
    if (!availableEntities) {
        return [];
    }

    const cleanPossibleEntities = availableEntities.filter(Boolean);
    
    const validEntities = cleanPossibleEntities.filter(entity => {
        if (!entity) {
            logger.error('[selectEntities] Found an undefined entity in template array.', { availableEntities });
            return false;
        }
        if (!entity.conditions) {
            logger.error('[selectEntities] Entity is missing "conditions" property.', { entity });
            return false;
        }
        return checkConditions(entity.conditions, chunk);
    });

    const selected: any[] = [];
    const shuffled = [...validEntities].sort(() => 0.5 - Math.random());

    // Softcap helper to avoid runaway multiplier effects
    const softcap = (m: number, k = 0.4) => {
        if (m <= 1) return m;
        return m / (1 + (m - 1) * k);
    };

    // Compute a chunk-level resource score (0..1) from several chunk indicators.
    // Assumptions: chunk metric scales are roughly 0..100. Higher vegetation/moisture
    // increase resources; higher humanPresence/dangerLevel/predatorPresence reduce it.
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v / 100));
    const vegetation = clamp01(chunk.vegetationDensity ?? 50);
    const moisture = clamp01(chunk.moisture ?? 50);
    const humanFactor = 1 - clamp01(chunk.humanPresence ?? 50);
    const dangerFactor = 1 - clamp01(chunk.dangerLevel ?? 50);
    const predatorFactor = 1 - clamp01(chunk.predatorPresence ?? 50);
    const chunkResourceScore = (vegetation + moisture + humanFactor + dangerFactor + predatorFactor) / 5; // 0..1

    for (const entity of shuffled) {
        if (selected.length >= maxCount) break;

        const entityData = 'data' in entity && entity.data ? entity.data : entity;

        if (!entityData || (!('name' in entityData) && !('type' in entityData))) {
             logger.error(`[selectEntities] SKIPPING entity data is missing 'name' or 'type' property.`, { entity: entityData });
            continue;
        }

    let spawnChance = entity.conditions?.chance ?? 1.0;
        const itemName = entityData.name || entityData.type;
        const itemDef = allItemDefinitions[itemName];

        // Giảm mức độ ảnh hưởng của tier lên tỷ lệ spawn
        if (itemDef) {
            const tier = itemDef.tier;
            // Tăng hệ số lũy thừa để giảm mức độ ảnh hưởng của tier lên tỷ lệ spawn
            const tierMultiplier = Math.pow(0.9, tier - 1); // Changed from 0.8 to 0.9
            spawnChance *= tierMultiplier;
        }


        // Thêm bonus chance dựa trên world profile
        // Keep resourceDensity effect small to avoid driving spawnChance negative
        if (worldProfile?.resourceDensity) {
            // Use original /100 scaling so densityBonus ranges roughly -0.5..+0.5
            const densityBonus = (worldProfile.resourceDensity - 50) / 100;
            spawnChance = spawnChance + densityBonus;
        }

        // Boost/reduce spawnChance based on chunk resource score so chunk metrics are primary influence
        // We map chunkResourceScore (0..1) into a multiplier in range [0.6, 1.4] (configurable)
        const chunkMultiplier = 0.6 + (chunkResourceScore * 0.8);
        spawnChance *= chunkMultiplier;
        // Apply a global spawn multiplier from the world profile (softcapped)
        const multiplier = worldProfile?.spawnMultiplier ?? 1;
        const effectiveMultiplier = softcap(multiplier);
        // Clamp spawnChance into a safe range [0, 0.95] after multiplier so random check is valid
        spawnChance = Math.max(0, Math.min(0.95, spawnChance * effectiveMultiplier));

        if (Math.random() < spawnChance) {
            selected.push(entity);
        }
    }
    return selected;
};
