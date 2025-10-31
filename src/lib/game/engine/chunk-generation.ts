import type { 
    WorldProfile,
    ItemDefinition,
    GeneratedItem,
    Structure,
    Language,
    Npc,
    ChunkItem,
    Action,
    Terrain,
    World,
    Region,
    Season,
    SoilType
} from "../types";
import { type TranslationKey } from "../../i18n";
import type { Enemy } from "../types/enemy";
import { translations } from "../../i18n";
import { getTemplates } from "../templates";
import { logger } from "@/lib/logger";
import { getTranslatedText } from "../../utils";
import { getRandomInRange, getValidAdjacentTerrains, weightedRandom } from "./world-generation";
import { selectEntities } from "./entity-generation";
import { worldConfig } from "../world-config";
import { generateRegion } from "./region-generation";

interface SpawnConditions {
    chance?: number;
    [key: string]: any; // Allow other conditions
}

interface SpawnCandidate {
    name: string | TranslationKey;
    conditions?: SpawnConditions;
    data?: any; // For NPCs/Enemies
}

interface ChunkGenerationResult {
    description: string;
    NPCs: Npc[];
    items: ChunkItem[];
    structures: Structure[];
    enemy: Enemy | null;
    actions: Action[];
}

interface ChunkBaseData {
    vegetationDensity: number;
    moisture: number;
    elevation: number;
    dangerLevel: number;
    magicAffinity: number;
    humanPresence: number;
    predatorPresence: number;
    temperature: number;
    terrain: Terrain;
    explorability: number;
    soilType: SoilType;
    travelCost: number;
    lightLevel: number;
    windLevel: number;
}

export function generateChunkContent(
    chunkData: ChunkBaseData,
    worldProfile: WorldProfile,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
): ChunkGenerationResult {
    logger.debug('[generateChunkContent] STARTING', { chunkData, customItemCatalogLength: customItemCatalog.length });

    const t = (key: TranslationKey, replacements?: { [key: string]: string | number }): string => {
        let textPool = (translations[language as 'en' | 'vi'] as any)[key] || (translations.en as any)[key] || key;
        let text = Array.isArray(textPool) ? textPool[Math.floor(Math.random() * textPool.length)] : textPool;
        if (replacements && typeof text === 'string') {
            for (const [replaceKey, value] of Object.entries(replacements)) {
                text = text.replace(`{${replaceKey}}`, String(value));
            }
        }
        return text;
    };

    // softcap function moved here to be accessible
    const softcap = (m: number, k = 0.4) => {
        if (m <= 1) return m;
        return m / (1 + (m - 1) * k);
    };

    const templates = getTemplates(language);
    const terrainTemplate = templates[chunkData.terrain];

    if (!terrainTemplate) {
        logger.error(`[generateChunkContent] No template found for terrain: ${chunkData.terrain}`);
        return {
            description: "An unknown and undescribable area.",
            NPCs: [],
            items: [],
            structures: [],
            enemy: null,
            actions: [],
        };
    }
    
    const descriptionTemplates = (terrainTemplate.descriptionTemplates?.short || ["A generic area."]).filter(Boolean);
    const finalDescription = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)]
        .replace('[adjective]', (terrainTemplate.adjectives || ['normal'])[Math.floor(Math.random() * (terrainTemplate.adjectives || ['normal']).length)])
        .replace('[feature]', (terrainTemplate.features || ['nothing special'])[Math.floor(Math.random() * (terrainTemplate.features || ['nothing special']).length)]);
    
    const effectiveMultiplier = softcap(worldProfile?.spawnMultiplier ?? 1);

    // Ensure staticSpawnCandidates have a 'conditions' object with 'chance'
    const staticSpawnCandidates: SpawnCandidate[] = (terrainTemplate.items || []).filter(Boolean).map((item: any) => ({
        ...item,
        conditions: {
            ...(item.conditions || {}), // Ensure conditions object exists
            chance: (item.conditions?.chance ?? 1) // keep raw chance; world multiplier applied later in selectEntities
        }
    }));

    const customSpawnCandidates: SpawnCandidate[] = customItemCatalog
        .filter(item => item && item.spawnEnabled !== false && item.spawnBiomes && item.spawnBiomes.includes(chunkData.terrain as Terrain))
        .map(item => {
            // ItemDefinition stores natural spawn info in `naturalSpawn` entries.
            // Try to find a matching biome entry and use its chance/conditions when available.
            const natural = (item as any).naturalSpawn as Array<{ biome?: string; chance?: number; conditions?: any }> | undefined;
            const matched = natural ? natural.find(s => s && s.biome === chunkData.terrain) : undefined;
            const baseChance = matched?.chance ?? 0.5;
            const extraConditions = matched?.conditions ?? undefined;
            return {
                name: getTranslatedText(item.name, 'en', t),
                conditions: {
                    ...(extraConditions || {}),
                    chance: baseChance // keep raw chance; world multiplier applied later in selectEntities
                }
            };
        });
    logger.debug('[generateChunkContent] customSpawnCandidates', { customSpawnCandidatesLength: customSpawnCandidates.length, customSpawnCandidates });

    const allSpawnCandidates = [...staticSpawnCandidates, ...customSpawnCandidates];
    logger.debug('[generateChunkContent] allSpawnCandidates', { allSpawnCandidatesLength: allSpawnCandidates.length, allSpawnCandidates });

    // Default to 10 items, scaled by worldProfile.spawnMultiplier but passed
    // through a softcap so extremely large multipliers don't explode counts.
    const baseMaxItems = 10;
    // Compute a chunk-level resource score (0..1) similar to selectEntities so chunk
    // indicators are the primary influence on how many items spawn here.
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v / 100));
    const vegetation = clamp01(chunkData.vegetationDensity ?? 50);
    const moisture = clamp01(chunkData.moisture ?? 50);
    const humanFactor = 1 - clamp01(chunkData.humanPresence ?? 50);
    const dangerFactor = 1 - clamp01(chunkData.dangerLevel ?? 50);
    const predatorFactor = 1 - clamp01(chunkData.predatorPresence ?? 50);
    const chunkResourceScore = (vegetation + moisture + humanFactor + dangerFactor + predatorFactor) / 5; // 0..1

    // World-level resourceDensity further scales the chunk score. Default 50 -> neutral.
    const worldDensityScale = (worldProfile?.resourceDensity ?? 50) / 100;

    // Map chunkResourceScore to a multiplier for item count in range [0.5, 1.5]
    const chunkCountMultiplier = 0.5 + (chunkResourceScore * 1.0 * worldDensityScale);

    // maxItems now represents the maximum number of *unique* item types to select.
    const maxItems = Math.max(1, Math.floor(baseMaxItems * effectiveMultiplier * chunkCountMultiplier));
    const spawnedItemRefs = selectEntities(allSpawnCandidates, maxItems, chunkData, allItemDefinitions, worldProfile);
    logger.debug('[generateChunkContent] spawnedItemRefs', { spawnedItemRefsLength: spawnedItemRefs.length, spawnedItemRefs });
    const spawnedItems: ChunkItem[] = [];

    // Helper to resolve an itemRef.name (which may be a display string) to an item definition key
    const resolveItemByName = (displayOrKey: string) : ItemDefinition | undefined => {
        // Direct key lookup first
        if (allItemDefinitions[displayOrKey]) return allItemDefinitions[displayOrKey];

        // Otherwise search definitions for a translated/display name match (en/vi)
        for (const key of Object.keys(allItemDefinitions)) {
            const def = allItemDefinitions[key];
            // def.name can be a TranslatableString or plain string
            const defNameAny: any = def.name;
            if (typeof defNameAny === 'string') {
                if (defNameAny === displayOrKey) return def;
            } else if (defNameAny) {
                if (defNameAny.en === displayOrKey || defNameAny.vi === displayOrKey) return def;
            }
        }
        return undefined;
    };

    for (const itemRef of spawnedItemRefs) {
        logger.debug('[generateChunkContent] Processing itemRef', { itemRef });
        const itemDef = resolveItemByName(itemRef.name);
        logger.debug('[generateChunkContent] Resolved itemDef', { itemDef });

        if (itemDef) {
            logger.debug('[generateChunkContent] Item definition found', { baseQuantityMin: itemDef.baseQuantity.min, baseQuantityMax: itemDef.baseQuantity.max });
            // Quantity is now directly from baseQuantity range, as multiplier affects chance
            const finalQuantity = getRandomInRange({ min: itemDef.baseQuantity.min, max: itemDef.baseQuantity.max });
            logger.debug('[generateChunkContent] Final quantity determined from baseQuantity range', { finalQuantity });

            if (finalQuantity > 0) {
                spawnedItems.push({
                    name: itemDef.name,
                    description: itemDef.description,
                    tier: itemDef.tier,
                    quantity: finalQuantity,
                    emoji: itemDef.emoji,
                });
                logger.debug('[generateChunkContent] Item pushed to spawnedItems', { itemName: getTranslatedText(itemDef.name, 'en'), finalQuantity });
            } else {
                logger.debug('[generateChunkContent] finalQuantity is 0, item not spawned (should not happen if baseQuantity.min > 0)', { itemName: getTranslatedText(itemDef.name, 'en'), finalQuantity });
            }
        } else {
            logger.warn('[generateChunkContent] Item definition not found for itemRef', { itemRefName: itemRef.name });
        }
    }
    
    const spawnedNPCs: Npc[] = selectEntities(terrainTemplate.NPCs, 3, chunkData, allItemDefinitions, worldProfile).map(ref => ref.data);

    let allEnemyCandidates = [...(terrainTemplate.enemies || [])].filter(Boolean);

    const spawnedEnemies = selectEntities(allEnemyCandidates, 3, chunkData, allItemDefinitions, worldProfile);
    
    let spawnedStructures: Structure[] = [];
    const spawnedStructureRefs = selectEntities((terrainTemplate.structures || []).filter(Boolean), 2, chunkData, allItemDefinitions, worldProfile);
    
    for (const structRef of spawnedStructureRefs) {
        if (structRef.loot) {
            for (const lootItem of structRef.loot) {
                // Ensure lootItem.chance exists before using it
                if (lootItem.chance !== undefined && Math.random() < lootItem.chance) {
                    const definition = allItemDefinitions[lootItem.name];
                    if (definition) {
                        const quantity = getRandomInRange({ min: lootItem.quantity.min, max: lootItem.quantity.max });
                        const existingItem = spawnedItems.find(i => getTranslatedText(i.name, 'en') === lootItem.name);
                        if (existingItem) {
                            existingItem.quantity += quantity;
                        } else {
                            spawnedItems.push({
                                name: definition.name,
                                description: definition.description,
                                tier: definition.tier,
                                quantity,
                                emoji: definition.emoji,
                            });
                        }
                    }
                }
            }
        }
        spawnedStructures.push(structRef);
    }
   
    const enemyData = spawnedEnemies.length > 0 ? spawnedEnemies[0].data : null;
    const spawnedEnemy = enemyData ? {
        type: enemyData.type,
        hp: enemyData.hp ?? 100,
        damage: enemyData.damage ?? 10,
        behavior: enemyData.behavior ?? 'aggressive',
        size: enemyData.size ?? 'medium',
        emoji: enemyData.emoji ?? '👾',
        satiation: 0,
        maxSatiation: enemyData.maxSatiation ?? 100,
        diet: enemyData.diet ?? ['meat'],
        senseEffect: enemyData.senseEffect ? {
            range: enemyData.senseRadius ?? 3,
            type: 'detection'
        } : undefined
    } : null;
    
    const actions: Action[] = [];
    let actionIdCounter = 1;

    if (spawnedEnemy) {
        actions.push({ 
            id: actionIdCounter++, 
            textKey: 'observeAction_enemy', 
            params: { enemyType: getTranslatedText(spawnedEnemy.type, 'en') }
        });
    }
    if (spawnedNPCs.length > 0) {
        actions.push({ 
            id: actionIdCounter++, 
            textKey: 'talkToAction_npc', 
            params: { npcName: getTranslatedText(spawnedNPCs[0].name, 'en') }
        });
    }

    spawnedItems.forEach(item => {
        actions.push({ id: actionIdCounter++, textKey: 'pickUpAction_item', params: { itemName: getTranslatedText(item.name, 'en') } });
    });
    
    actions.push({ id: actionIdCounter++, textKey: 'exploreAction' });
    actions.push({ id: actionIdCounter++, textKey: 'listenToSurroundingsAction' });

    // Instrumentation: log a compact summary for debugging spawn issues
    logger.debug('[generateChunkContent] spawn summary', {
        terrain: chunkData.terrain,
        spawnedItemsCount: spawnedItems.length,
        spawnedEnemy: !!spawnedEnemy,
        sampleItems: spawnedItems.slice(0, 3).map(i => getTranslatedText(i.name, 'en')).join(', ')
    });
    logger.debug('[generateChunkContent] FINAL spawnedItems', { spawnedItemsLength: spawnedItems.length, spawnedItems });

    return {
        description: finalDescription,
        NPCs: spawnedNPCs,
        items: spawnedItems,
        structures: spawnedStructures,
        enemy: spawnedEnemy,
        actions: actions,
    };
}

// end of generateChunkContent

export function ensureChunkExists(
    pos: { x: number; y: number },
    currentWorld: World,
    currentRegions: { [id: number]: Region },
    currentRegionCounter: number,
    worldProfile: WorldProfile,
    currentSeason: Season,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
) {
    logger.debug(`[ensureChunkExists] STARTING for chunk (${pos.x},${pos.y}).`);
    const key = `${pos.x},${pos.y}`;
    if (currentWorld[key]) {
        logger.debug(`[ensureChunkExists] Chunk at (${pos.x},${pos.y}) already exists. Skipping generation.`);
        logger.debug(`[ensureChunkExists] FINISHED for chunk (${pos.x}, ${pos.y}). Returning world profile.`);
        return { worldWithChunk: currentWorld, newRegions: currentRegions, newRegionCounter: currentRegionCounter };
    }
    logger.info(`[ensureChunkExists] Chunk at (${pos.x},${pos.y}) does not exist. Generating new region.`);
    const validTerrains = getValidAdjacentTerrains(pos, currentWorld);
    logger.debug(`[ensureChunkExists] Valid adjacent terrains:`, validTerrains);
    const terrainWeights = validTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
    const newTerrain = weightedRandom(terrainWeights);
    logger.info(`[ensureChunkExists] Selected new terrain: ${newTerrain}`);

    const { newWorld, newRegions, newRegionCounter } = generateRegion(pos, newTerrain, currentWorld, currentRegions, currentRegionCounter, worldProfile, currentSeason, allItemDefinitions, customItemCatalog, customStructures, language);
    logger.debug(`[ensureChunkExists] FINISHED generating region for chunk (${pos.x}, ${pos.y}).`);
    logger.debug(`[ensureChunkExists] FINISHED for chunk (${pos.x}, ${pos.y}). Returning world profile.`);
    return { worldWithChunk: newWorld, newRegions: newRegions, newRegionCounter: newRegionCounter };
}

/**
 * Creates chunks in a specified radius around a central point if they do not already exist.
 */
import { maybeDebug } from '@/lib/debug';

export const generateChunksInRadius = (
    currentWorld: World,
    currentRegions: { [id: number]: Region },
    currentRegionCounter: number,
    center_x: number,
    center_y: number,
    radius: number,
    worldProfile: WorldProfile,
    currentSeason: Season,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
): { world: World, regions: { [id: number]: Region }, regionCounter: number } => {
    logger.debug(`[generateChunksInRadius] STARTING generation for radius ${radius} around (${center_x}, ${center_y}).`);
    // Pause here when debugging to inspect large generation inputs/state
    maybeDebug('generateChunksInRadius:start');
    let newWorld = { ...currentWorld };
    let newRegions = { ...currentRegions };
    let newRegionCounter = currentRegionCounter;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const chunk_x = center_x + dx;
            const chunk_y = center_y + dy;
            const chunkKey = `${chunk_x},${chunk_y}`;
              logger.debug(`[generateChunksInRadius] Checking chunk at (${chunk_x}, ${chunk_y}).`);
              // Short pause to inspect per-chunk processing if needed
              maybeDebug('generateChunksInRadius:per-chunk');
            if (!newWorld[chunkKey]) {
                const result = ensureChunkExists(
                    { x: chunk_x, y: chunk_y },
                    newWorld,
                    newRegions,
                    newRegionCounter,
                    worldProfile,
                    currentSeason,
                    allItemDefinitions,
                    customItemCatalog,
                    customStructures,
                    language
                );
                newWorld = result.worldWithChunk;
                newRegions = result.newRegions;
                newRegionCounter = result.newRegionCounter;
            }
        }
    }
    logger.info(`[generateChunksInRadius] Finished generation for radius ${radius}.`);
    maybeDebug('generateChunksInRadius:finished');
    return { world: newWorld, regions: newRegions, regionCounter: newRegionCounter };
};
