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
 * 1. Chunk properties → condition checking via `checkConditions()`
 * 2. `ItemDefinition.tier` → spawn probability modifiers
 * 3. `WorldProfile` → global multipliers and resource density bonuses
 * 4. `SpawnConditions` → per-entity spawn requirements and chances
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

import type { Chunk, TranslatableString, WorldProfile, Terrain } from '@/core/types/game';
import type { SpawnConditions, ItemDefinition } from '@/core/types/definitions';
import { SoilType } from '@/core/types/game';
import { logger } from "@/lib/core/logger";

/**
 * Validates whether an entity's spawn conditions are met by the current chunk properties.
 *
 * This function implements the per-entity condition checking used during world/chunk
 * generation. `conditions` typically comes from an item's `naturalSpawn` entry
 * or from a template (terrain template, structure loot, etc.). The `chance`
 * property is deliberately ignored here because probability handling is done in
 * `selectEntities`.
 *
 * Behavior summary:
 * - Numeric ranges (min/max) on chunk properties are checked strictly.
 * - Special keys such as `soilType` and `timeOfDay` have bespoke handling.
 * - Player-related checks (`playerHealth`, `playerStamina`) are supported when
 *   a `playerState` is supplied to higher-level callers (here we accept chunk-only checks).
 *
 * @param conditions - Spawn requirements defined in entity templates or item definitions.
 * @param chunk - Current chunk properties used for evaluation (a reduced `Chunk` shape is accepted).
 * @returns `true` when all applicable conditions are satisfied, otherwise `false`.
 *
 * Condition evaluation logic:
 * 1. **Numeric Range Conditions**: Properties like moisture, vegetationDensity, temperature
 *    are checked against min/max ranges defined in SpawnConditions.
 * 2. **Soil Type Matching**: `soilType` condition requires an exact match from allowed soil types.
 * 3. **Special Handling**: The 'chance' property is ignored (handled separately in spawn probability).
 * 4. **Type Safety**: Non-numeric or malformed conditions are skipped with logging.
 *
 * Interdependencies:
 * - Uses `SpawnConditions` schema from `ItemDefinition.naturalSpawn`.
 * - Called by `selectEntities()` for each potential spawn candidate.
 * - Chunk properties must match the terrain-extended `Chunk` type.
 * - Results determine which entities are eligible for probabilistic selection.
 *
 * Performance notes:
 * - O(k) complexity where k = number of conditions.
 * - Early termination on first failed condition.
 * - Designed for frequent calls during world generation.
 *
 * @param conditions - Spawn requirements defined in entity templates or item definitions.
 * @param chunk - Current chunk properties including extended terrain information.
 * @returns `true` if all conditions are satisfied, `false` otherwise.
 */
export const checkConditions = (conditions: SpawnConditions, chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures' | 'lastVisited'> & { terrain: Terrain }): boolean => {
    for (const key in conditions) {
        if (key === 'chance') continue; // 'chance' is handled in selectEntities.
        const condition = conditions[key as keyof typeof conditions];
        
        // Safely access chunk properties, defaulting if necessary.
        const chunkValue = chunk[key as keyof typeof chunk];

        if (key === 'soilType') {
            // Special handling for soilType, expecting an array of allowed soil types.
            const soilConditions = condition as SoilType[];
            if (!soilConditions.includes(chunk.soilType)) return false;
            continue;
        }

        // Skip if chunk value is not a number, or condition is not a valid range object.
        if (typeof chunkValue !== 'number' || typeof condition !== 'object' || condition === null) {
            logger.warn(`[checkConditions] Skipping invalid condition for key "${key}": chunkValue=${chunkValue}, condition=${JSON.stringify(condition)}`);
            continue;
        }
        
        // Evaluate numeric range conditions.
        const range = condition as { min?: number; max?: number };
        if (range.min !== undefined && chunkValue < range.min) return false;
        if (range.max !== undefined && chunkValue > range.max) return false;
    }
    // If all conditions passed, return true.
    return true;
};

/**
 * Probabilistic entity selection algorithm that implements the complete spawn pipeline.
 *
 * This function takes an array of candidate entities (items, NPC refs, enemy refs,
 * structure loot entries) and returns a subset that should actually be spawned in a
 * chunk. It performs deterministic filtering (condition checks) then probabilistic
 * selection using per-entity base chance, tier adjustments, chunk-level resource
 * multipliers, and world-level modifiers.
 *
 * Important notes about probability calculation:
 * - `entity.conditions.chance` (default 1.0) is the base per-entity chance.
 * - Item tier reduces base chance multiplicatively via a conservative factor
 *   (0.9^(tier-1)). This reduces high-tier frequency while keeping rarer items
 *   discoverable.
 * - The world's `resourceDensity` is applied as a direct multiplier (e.g. 0.5..1.5)
 *   so world-level abundance scales spawnChance multiplicatively.
 * - A chunk-level `chunkMultiplier` derived from environmental scores (vegetation,
 *   moisture, predators, danger, human presence) biases spawn probability toward
 *   richer chunks.
 * - A `spawnMultiplier` on `WorldProfile` is soft-capped (via `softcap`) before
 *   final application to avoid runaway multipliers.
 * - Final probability is clamped to [0, 0.95] to avoid guaranteed spawns and keep
 *   some randomness in outcomes.
 *
 * @template T - Entity type with optional `name`, `type`, `data` and `conditions` properties.
 * @param availableEntities - Array of potential entities to spawn. May be `undefined`.
 * @param maxCount - Maximum number of entities to select (capacity limit).
 * @param chunk - Current chunk properties for condition checking.
 * @param allItemDefinitions - Complete item registry for tier lookups (optional lookups by name).
 * @param worldProfile - World generation parameters affecting spawn rates (resourceDensity, spawnMultiplier).
 * @returns An array of selected entity entries (subset of `availableEntities`) chosen to spawn.
 *
 * Probability calculation breakdown:
 * 1. **Base Chance**: `entity.conditions?.chance ?? 1.0`.
 * 2. **Tier Modifier**: `Math.pow(0.9, tier - 1)` reduces chance for higher-tier items.
 * 3. **Density Multiplier**: `worldProfile.resourceDensity` scales chance based on world richness.
 * 4. **Chunk Multiplier**: Derived from `chunkResourceScore` (0..1) to favor richer chunks.
 * 5. **Global Multiplier**: Soft-capped `worldProfile.spawnMultiplier` provides a global adjustment.
 * 6. **Final Clamping**: Result is clamped to [0, 0.95] for randomness.
 *
 * @example
 * ```typescript
 * const itemsToSpawn = selectEntities(
 *   terrainTemplate.items,
 *   3, // maxCount
 *   chunkData,
 *   allItemDefinitions,
 *   worldProfile
 * );
 * ```
 */
export const selectEntities = <T extends { name?: TranslatableString | string; type?: string; data?: any; conditions?: any }>(
    availableEntities: T[] | undefined,
    maxCount: number,
    chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures' | 'lastVisited'> & { terrain: Terrain },
    allItemDefinitions: Record<string, ItemDefinition>,
    worldProfile: WorldProfile,
): any[] => {
    // Return empty array if no entities are available.
    if (!availableEntities) {
        return [];
    }

    // Filter out any null or undefined entries from the available entities.
    const cleanPossibleEntities = availableEntities.filter(Boolean);
    
    // Filter entities based on their spawn conditions and the current chunk's properties.
    const validEntities = cleanPossibleEntities.filter(entity => {
        if (!entity) {
            logger.error('[selectEntities] Found an undefined entity in template array.', { availableEntities });
            return false;
        }
        // Ensure entity has conditions defined; otherwise, log an error and skip.
        if (!entity.conditions) {
            logger.error('[selectEntities] Entity is missing "conditions" property.', { entity });
            return false;
        }
        // Use checkConditions to validate against chunk properties.
        return checkConditions(entity.conditions, chunk);
    });

    const selected: any[] = [];
    // Shuffle the valid entities to ensure random selection order.
    const shuffled = [...validEntities].sort(() => 0.5 - Math.random());

    /**
     * Softcap helper function to prevent runaway multiplier effects.
     * This function applies a diminishing return to multipliers, ensuring game balance.
     * @param m - The raw multiplier value.
     * @param k - The softcap constant, controlling the curve. Defaults to 0.4.
     * @returns The softcapped multiplier.
     */
    const softcap = (m: number, k = 0.4) => {
        if (m <= 1) return m; // No capping needed if multiplier is 1 or less.
        // Apply the softcap formula: m / (1 + (m - 1) * k).
        return m / (1 + (m - 1) * k);
    };

    // Compute a chunk-level resource score (0..1) from several chunk indicators.
    // Assumptions: chunk metric scales are roughly 0..100. Higher vegetation/moisture
    // increase resources; higher humanPresence/dangerLevel/predatorPresence reduce it.
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v / 100));
    const vegetation = clamp01(chunk.vegetationDensity ?? 50);
    const moisture = clamp01(chunk.moisture ?? 50);
    const humanFactor = 1 - clamp01(chunk.humanPresence ?? 50); // Inverted: less human presence = more resources.
    const dangerFactor = 1 - clamp01(chunk.dangerLevel ?? 50);   // Inverted: less danger = more resources.
    const predatorFactor = 1 - clamp01(chunk.predatorPresence ?? 50); // Inverted: less predators = more resources.
    // Calculate the average score across all factors.
    const chunkResourceScore = (vegetation + moisture + humanFactor + dangerFactor + predatorFactor) / 5; // Score is between 0 and 1.

    // Iterate through the shuffled valid entities to select up to maxCount.
    for (const entity of shuffled) {
        // Stop if the maximum count of selected entities is reached.
        if (selected.length >= maxCount) break;

        // Extract entity data, prioritizing 'data' if present, otherwise use the entity itself.
        const entityData = 'data' in entity && entity.data ? entity.data : entity;

        // Basic validation: ensure entityData has a name or type.
        if (!entityData || (!('name' in entityData) && !('type' in entityData))) {
             logger.error(`[selectEntities] SKIPPING entity data is missing 'name' or 'type' property.`, { entity: entityData });
            continue;
        }

    let spawnChance = entity.conditions?.chance ?? 1.0; // Get base spawn chance, default to 1.0.
        const itemName = entityData.name || entityData.type; // Use name or type for lookup.
        const itemDef = allItemDefinitions[itemName]; // Get the item definition for tier-based adjustments.

        // Apply tier-based reduction to spawn chance.
        if (itemDef) {
            const tier = itemDef.tier;
            // Use a power function to reduce chance for higher tiers, making them rarer.
            // The exponent 0.9 is used to reduce the impact of tier compared to previous 0.8.
            const tierMultiplier = Math.pow(0.9, tier - 1); // Tier 1 has multiplier 1, Tier 2 has 0.9, etc.
            spawnChance *= tierMultiplier;
        }


        // Apply world resource density as a direct multiplier.
        // `resourceDensity` is expected to be a multiplier in the range ~0.5 to 1.5.
        const densityMultiplier = worldProfile?.resourceDensity ?? 1;
        spawnChance *= densityMultiplier;

        // Boost/reduce spawnChance based on chunk resource score.
        // This maps the chunkResourceScore (0..1) into a multiplier in the range [0.6, 1.4].
        // This ensures chunk metrics are the primary influence on spawn probability.
        const chunkMultiplier = 0.6 + (chunkResourceScore * 0.8);
        spawnChance *= chunkMultiplier;
        
    // Note: Previous tuning applied a global spawnRateScale and ignored very-small probabilities.
    // That was reverted to allow very-rare items to keep a (small) non-zero chance of spawning.
    // Final clamping is handled later after applying the world spawnMultiplier.
        // Apply a global spawn multiplier from the world profile, which is softcapped.
        const multiplier = worldProfile?.spawnMultiplier ?? 1;
        const effectiveMultiplier = softcap(multiplier);
        // Clamp spawnChance into a safe range [0, 0.95] after applying all multipliers.
        // This ensures the random check is valid and prevents guaranteed spawns.
        spawnChance = Math.max(0, Math.min(0.95, spawnChance * effectiveMultiplier));

        // Perform the final random check to determine if the entity spawns.
        if (Math.random() < spawnChance) {
            selected.push(entity); // Add the entity to the list of selected entities.
        }
    }
    // Return the array of selected entities.
    return selected;
};

