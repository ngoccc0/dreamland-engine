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
    
    const staticSpawnCandidates = (terrainTemplate.items || []).filter(Boolean);
    const customSpawnCandidates = customItemCatalog
        .filter(item => item && item.spawnEnabled !== false && item.spawnBiomes && item.spawnBiomes.includes(chunkData.terrain as Terrain))
        .map(item => ({ 
            name: getTranslatedText(item.name, 'en', t), 
            conditions: { chance: 0.5 } // Tăng tỷ lệ spawn lên 50% cho custom items
        }));
    
    const allSpawnCandidates = [...staticSpawnCandidates, ...customSpawnCandidates];

    // Default to 6 items if worldProfile is not available
    const maxItems = 10;
    const spawnedItemRefs = selectEntities(allSpawnCandidates, maxItems, chunkData, allItemDefinitions, worldProfile);
    const spawnedItems: ChunkItem[] = [];

    for (const itemRef of spawnedItemRefs) {
        const itemDef = allItemDefinitions[itemRef.name];
        if (itemDef) {
            const baseQuantity = getRandomInRange({ min: itemDef.baseQuantity.min, max: itemDef.baseQuantity.max });
            const multiplier = worldProfile.resourceDensity / 50;
            const finalQuantity = Math.round(baseQuantity * multiplier);

            if (finalQuantity > 0) {
                spawnedItems.push({
                    name: itemDef.name,
                    description: itemDef.description,
                    tier: itemDef.tier,
                    quantity: finalQuantity,
                    emoji: itemDef.emoji,
                });
            }
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
                if (Math.random() < lootItem.chance) {
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

    return {
        description: finalDescription,
        NPCs: spawnedNPCs,
        items: spawnedItems,
        structures: spawnedStructures,
        enemy: spawnedEnemy,
        actions: actions,
    };
}

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
    let newWorld = { ...currentWorld };
    let newRegions = { ...currentRegions };
    let newRegionCounter = currentRegionCounter;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const chunk_x = center_x + dx;
            const chunk_y = center_y + dy;
            const chunkKey = `${chunk_x},${chunk_y}`;
            logger.debug(`[generateChunksInRadius] Checking chunk at (${chunk_x}, ${chunk_y}).`);
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
    return { world: newWorld, regions: newRegions, regionCounter: newRegionCounter };
};
