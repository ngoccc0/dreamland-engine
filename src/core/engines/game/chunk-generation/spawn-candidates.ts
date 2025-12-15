/**
 * Spawn candidate preparation helper
 *
 * @remarks
 * Prepares and organizes spawn candidates for items, plants, and animals
 * by filtering terrain templates and custom catalogs based on biome and
 * spawn conditions.
 */

import type { SpawnCandidate } from "./types";
import type { Terrain } from "@/core/types/game";
import { getTranslatedText } from "@/lib/utils";
import type { TranslationKey } from "@/lib/core/i18n";

/**
 * Result of spawn candidate preparation for a chunk
 */
export interface SpawnCandidatesResult {
    itemSpawnCandidates: SpawnCandidate[];
    plantSpawnCandidates: SpawnCandidate[];
    animalSpawnCandidates: SpawnCandidate[];
}

/**
 * Chunk environmental data type
 */
interface ChunkData {
    vegetationDensity?: number;
    moisture?: number;
    humanPresence?: number;
    dangerLevel?: number;
    predatorPresence?: number;
    terrain: Terrain;
}

/**
 * Prepares spawn candidates for items, plants, and animals based on terrain and conditions.
 *
 * @remarks
 * **Process:**
 * 1. **Items**: Combines static terrain template items with custom item catalog
 * 2. **Plants**: Filters creatures with plantProperties matching terrain biome
 * 3. **Animals**: Filters creatures without plantProperties matching terrain biome
 *
 * Each candidate includes spawn conditions (chance, elevation, etc.) from
 * terrain template or custom catalog naturalSpawn data.
 *
 * @param chunkData - Chunk environmental data including terrain type
 * @param terrainTemplate - Terrain template with items, NPCs, structures
 * @param creatureTemplates - All creature definitions (plants and animals)
 * @param customItemCatalog - Custom items that can spawn
 * @param t - Translation helper function
 * @returns Object containing itemSpawnCandidates, plantSpawnCandidates, and animalSpawnCandidates
 */
export function prepareSpawnCandidates(
    chunkData: ChunkData,
    terrainTemplate: any,
    creatureTemplates: Record<string, any>,
    customItemCatalog: any[],
    t: (key: TranslationKey, replacements?: any) => string
): SpawnCandidatesResult {
    // ====================================================================
    // ITEM SPAWN CANDIDATES
    // ====================================================================
    const itemSpawnCandidates: SpawnCandidate[] = [];

    // Static item candidates from terrain template
    const staticItemCandidates: SpawnCandidate[] = (terrainTemplate.items || []).filter(Boolean).map((item: any) => ({
        ...item,
        conditions: {
            ...(item.conditions || {}),
            chance: (item.conditions?.chance ?? 1)
        }
    }));

    // Custom item candidates from customItemCatalog
    const customItemCandidates: SpawnCandidate[] = customItemCatalog
        .filter(item => item && item.spawnEnabled !== false && item.spawnBiomes && item.spawnBiomes.includes(chunkData.terrain as Terrain))
        .map(item => {
            const natural = (item as any).naturalSpawn as Array<{ biome?: string; chance?: number; conditions?: any }> | undefined;
            const matched = natural ? natural.find(s => s && s.biome === chunkData.terrain) : undefined;
            const baseChance = matched?.chance ?? 0.5;
            const extraConditions = matched?.conditions ?? undefined;
            return {
                name: getTranslatedText(item.name, 'en', t),
                conditions: {
                    ...(extraConditions || {}),
                    chance: baseChance
                }
            };
        });

    itemSpawnCandidates.push(...staticItemCandidates, ...customItemCandidates);

    // ====================================================================
    // PLANT SPAWN CANDIDATES
    // ====================================================================
    const plantSpawnCandidates: SpawnCandidate[] = Object.values(creatureTemplates)
        .filter((c: any) => c && c.plantProperties && c.naturalSpawn && Array.isArray(c.naturalSpawn))
        .map((c: any) => ({
            def: c,
            natural: c.naturalSpawn
        }))
        .flatMap((entry: any) => {
            const cDef = entry.def as any;
            const arr = entry.natural as Array<any>;
            return arr
                .filter(s => !!s.biome && s.biome === chunkData.terrain)
                .map(s => ({ name: cDef.id || (cDef.name && cDef.name.en) || String(cDef.id), conditions: { ...(s.conditions || {}), chance: (s.chance ?? 0.5) }, data: cDef }));
        });

    // ====================================================================
    // ANIMAL SPAWN CANDIDATES
    // ====================================================================
    const animalSpawnCandidates: SpawnCandidate[] = Object.values(creatureTemplates)
        .filter((c: any) => c && !c.plantProperties && c.naturalSpawn && Array.isArray(c.naturalSpawn))
        .map((c: any) => ({
            def: c,
            natural: c.naturalSpawn
        }))
        .flatMap((entry: any) => {
            const cDef = entry.def as any;
            const arr = entry.natural as Array<any>;
            return arr
                .filter(s => !!s.biome && s.biome === chunkData.terrain)
                .map(s => ({ name: cDef.id || (cDef.name && cDef.name.en) || String(cDef.id), conditions: { ...(s.conditions || {}), chance: (s.chance ?? 0.5) }, data: cDef }));
        });

    return {
        itemSpawnCandidates,
        plantSpawnCandidates,
        animalSpawnCandidates
    };
}
