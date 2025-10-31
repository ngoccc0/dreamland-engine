import type { Chunk, SpawnConditions, TranslatableString, ItemDefinition, WorldProfile, Terrain } from "../types";
import { SoilType } from "../types";
import { logger } from "@/lib/logger";

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
 * A robust function to randomly select entities from a list.
 * It ensures that selected entities are valid objects with a 'name' property (and 'type' for enemies).
 * It gracefully handles and logs malformed data like null, undefined, or empty objects.
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
            // Thay đổi hệ số giảm từ 0.5 thành 0.8
            const tierMultiplier = Math.pow(0.8, tier - 1);
            spawnChance *= tierMultiplier;
        }

        // Thêm bonus chance dựa trên world profile
        // World resource density still provides a small additive bonus
        if (worldProfile?.resourceDensity) {
            const densityBonus = (worldProfile.resourceDensity - 50) / 100; // -0.5 to 0.5
            spawnChance = spawnChance + densityBonus;
        }

        // Apply a global spawn multiplier from the world profile (softcapped)
        const multiplier = worldProfile?.spawnMultiplier ?? 1;
        const effectiveMultiplier = softcap(multiplier);
        spawnChance = Math.min(0.95, spawnChance * effectiveMultiplier);

        if (Math.random() < spawnChance) {
            selected.push(entity);
        }
    }
    return selected;
};
