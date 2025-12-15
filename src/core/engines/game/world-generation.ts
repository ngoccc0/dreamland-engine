import type { World, Terrain, WorldProfile, Season, SoilType } from "@/core/types/game";
import { worldConfig, seasonConfig } from "@/core/data/biome-config";
import { logger } from "@/lib/core/logger";
import { clamp } from "@/lib/utils";

export const getRandomInRange = (range: { min: number, max: number }) =>
    Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

export const weightedRandom = (options: [Terrain, number][]): Terrain => {
    if (options.length === 0) {
        logger.warn("[weightedRandom] Received empty options array. Defaulting to 'forest'.");
        return 'forest';
    }
    const total = options.reduce((sum, [, prob]) => sum + prob, 0);
    let r = Math.random() * total;

    // A small correction to handle floating point inaccuracies where r could be exactly equal to total
    if (r >= total) r = total - 0.0001;

    for (const [option, prob] of options) {
        r -= prob;
        if (r <= 0) return option;
    }
    // Fallback in case of unexpected issues
    logger.warn("[weightedRandom] Failed to select an option through standard logic, returning first option.", { options });
    return options[0][0];
}

export const getValidAdjacentTerrains = (pos: { x: number; y: number }, currentWorld: World): Terrain[] => {
    const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
    const adjacentTerrains = new Set<Terrain>();
    for (const dir of directions) {
        const neighborKey = `${pos.x + dir.x},${pos.y + dir.y}`;
        if (currentWorld[neighborKey]) {
            adjacentTerrains.add(currentWorld[neighborKey].terrain);
        }
    }

    if (adjacentTerrains.size === 0) {
        // No adjacent terrains, so any non-wall terrain is possible.
        return Object.keys(worldConfig).filter(t => t !== 'wall') as Terrain[];
    }

    // Get all possible neighbors of our adjacent terrains
    const allPossibleNeighbors = new Set<Terrain>();
    for (const adjTerrain of adjacentTerrains) {
        const adjConfig = worldConfig[adjTerrain];
        if (adjConfig) {
            adjConfig.allowedNeighbors.forEach((neighbor: Terrain) => allPossibleNeighbors.add(neighbor));
        }
    }

    // A terrain is valid if it's a neighbor to ALL adjacent chunks.
    const validTerrains = [...allPossibleNeighbors].filter(terrain => {
        if (terrain === 'wall') return false; // Never generate a wall as a new region type
        const config = worldConfig[terrain];
        if (!config) return false;

        for (const adjTerrain of adjacentTerrains) {
            const adjConfig = worldConfig[adjTerrain];
            if (!adjConfig.allowedNeighbors.includes(terrain)) {
                return false;
            }
        }
        return true;
    });

    // If no terrain is valid for ALL neighbors, relax the condition.
    // For now, we'll return a safe default.
    return validTerrains.length > 0 ? validTerrains : ['grassland', 'forest'];
};

export function calculateDependentChunkAttributes(
    terrain: Terrain,
    baseAttributes: {
        vegetationDensity: number;
        moisture: number;
        dangerLevel: number;
        temperature: number;
    },
    worldProfile: WorldProfile,
    currentSeason: Season
) {
    const biomeDef = worldConfig[terrain];
    const seasonMods = seasonConfig[currentSeason];

    // Calculate final attributes, clamping them within realistic ranges
    // Temperature: -30°C to +50°C realistic range (instead of 0-100 scale)
    const temperature = clamp(baseAttributes.temperature + (seasonMods.temperatureMod * 10) + worldProfile.tempBias, -30, 50);
    const finalMoisture = clamp(baseAttributes.moisture + (seasonMods.moistureMod * 10) + worldProfile.moistureBias, 0, 100);
    const windLevel = clamp(getRandomInRange({ min: 20, max: 80 }) + (seasonMods.windMod * 10), 0, 100);

    let lightLevel: number;
    if (terrain === 'cave') {
        lightLevel = getRandomInRange({ min: -80, max: -50 });
    } else {
        // Base light is determined by sun and season, reduced by vegetation
        let baseLight = (worldProfile.sunIntensity * 10) + (seasonMods.sunExposureMod * 10) - baseAttributes.vegetationDensity;
        // Add some random variation
        lightLevel = baseLight + getRandomInRange({ min: -10, max: 10 });
    }
    lightLevel = clamp(lightLevel, -100, 100);

    const explorability = clamp(100 - (baseAttributes.vegetationDensity / 2) - (baseAttributes.dangerLevel / 2), 0, 100);
    // Ensure soilType is one of the valid SoilType values
    const soilType = biomeDef.soilType[Math.floor(Math.random() * biomeDef.soilType.length)] as SoilType;
    /**
     * @description
     * Reduces the travel cost of the chunk to approximately 1/3 of its original value.
     * This modification directly impacts the stamina consumed when a player traverses this chunk.
     * The `Math.max(1, ...)` ensures that the travel cost never drops below 1,
     * preventing free movement and maintaining a minimal stamina expenditure.
     *
     * @rationale
     * The user requested a direct reduction of travel cost for all chunks to 1/3.
     * Multiplying `biomeDef.travelCost` by `0.33` achieves this.
     *
     * @impact
     * - Directly lowers stamina consumption for player movement across all terrains.
     * - Improves player mobility and reduces the penalty for exploring the world.
     * - May require rebalancing other game mechanics that rely on stamina as a limiting factor.
     */
    const travelCost = Math.max(1, Math.round(biomeDef.travelCost * 0.33));

    return {
        temperature,
        moisture: finalMoisture,
        windLevel,
        lightLevel,
        explorability,
        soilType,
        travelCost,
    };
}

