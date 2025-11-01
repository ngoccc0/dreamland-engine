/**
 * World chunk generation engine responsible for creating diverse, procedurally-generated game environments.
 * This module orchestrates the complete pipeline from terrain templates to populated chunks with items,
 * NPCs, structures, enemies, and interactive actions.
 *
 * Key responsibilities:
 * - Terrain-based content generation using template-driven approach
 * - Probabilistic entity spawning with environmental and world-profile modifiers
 * - Resource distribution balancing across chunk properties
 * - Integration of custom-generated content (items, structures) with static templates
 * - Action generation for player interaction with spawned entities
 * - Multi-language support for generated descriptions and content
 *
 * Generation pipeline:
 * 1. **Template Selection**: Choose terrain-appropriate templates for base content
 * 2. **Spawn Candidate Preparation**: Combine static template + custom catalog items
 * 3. **Environmental Filtering**: Apply chunk conditions to eligible entities
 * 4. **Probability Calculation**: Factor in world profile, resource scores, and tier modifiers
 * 5. **Entity Selection**: Use selectEntities() for probabilistic spawning
 * 6. **Content Assembly**: Generate final chunk with descriptions, actions, and entities
 *
 * Data flow and interdependencies:
 * - Terrain templates → provide base spawn candidates and descriptions
 * - ItemDefinition.naturalSpawn → defines custom item spawning rules
 * - WorldProfile → global multipliers for spawn rates and resource density
 * - Chunk properties → environmental factors affecting spawn probabilities
 * - selectEntities() → core probabilistic selection algorithm
 * - Translation system → multi-language content generation
 *
 * Performance characteristics:
 * - O(n*m) complexity where n=spawn candidates, m=chunk filtering operations
 * - Optimized for world generation with batched chunk processing
 * - Memory efficient with streaming entity resolution
 * - Extensive logging for spawn debugging and balance tuning
 */

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
import { getTranslatedText, resolveItemId } from "../../utils";
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

/**
 * Core chunk content generation algorithm that transforms environmental data into playable game content.
 * This function implements the complete procedural generation pipeline, combining terrain templates,
 * custom content, and probabilistic spawning to create diverse, interactive chunks.
 *
 * Generation pipeline overview:
 * 1. **Template Resolution**: Select terrain-appropriate template with descriptions and base entities
 * 2. **Spawn Candidate Assembly**: Merge static template entities with custom-generated content
 * 3. **Resource Capacity Calculation**: Determine max items based on environmental factors
 * 4. **Entity Selection**: Apply probabilistic spawning via selectEntities() with world modifiers
 * 5. **Content Resolution**: Convert entity references to actual game objects with quantities
 * 6. **Structure Processing**: Handle loot distribution and structure-specific spawning
 * 7. **Action Generation**: Create interactive actions based on spawned content
 * 8. **Result Assembly**: Package everything into final ChunkGenerationResult
 *
 * Spawn candidate preparation:
 * - **Static candidates**: From terrain templates (terrainTemplate.items, NPCs, enemies, structures)
 * - **Custom candidates**: From customItemCatalog filtered by spawnEnabled and spawnBiomes
 * - **Combined pool**: Merged arrays passed to selectEntities() for unified probabilistic selection
 *
 * Resource capacity formula:
 * ```
 * // chunkResourceScore is a normalized 0..1 score derived from chunk metrics
 * chunkResourceScore = (veg/100 + moist/100 + (1-human/100) + (1-danger/100) + (1-pred/100)) / 5
 * // worldProfile.resourceDensity is now a multiplier (0.5..1.5). We apply it directly
 * // to scale the chunkCountMultiplier so richer worlds yield more items.
 * chunkCountMultiplier = 0.5 + (chunkResourceScore * worldProfile.resourceDensity)
 * maxItems = max(1, floor(10 * effectiveMultiplier * chunkCountMultiplier))
 * ```
 *
 * Remarks:
 * - This makes per-chunk item counts easily tunable via `WorldProfile.resourceDensity`.
 * - Use `spawnMultiplier` for global spawn frequency adjustments that are softcapped.
 *
 * Item resolution process:
 * 1. selectEntities() returns entity references with names
 * 2. resolveItemByName() converts display names to ItemDefinition objects
 * 3. Quantity determined from ItemDefinition.baseQuantity range
 * 4. ChunkItem objects created with resolved properties
 *
 * Structure loot handling:
 * - Loot items have individual spawn chances within structures
 * - Existing items in chunk get quantity increases (stacking)
 * - New items added to spawnedItems array
 *
 * Action generation rules:
 * - Enemy observation actions for spawned enemies
 * - NPC interaction actions for spawned NPCs
 * - Item pickup actions for all spawned items
 * - Generic exploration actions always available
 *
 * Interdependencies:
 * - selectEntities() → uses entity-generation.ts for probabilistic selection
 * - ItemDefinition → provides spawn rules and properties via naturalSpawn
 * - WorldProfile → global spawn multipliers and resource density scaling
 * - Terrain templates → base content and spawn candidates
 * - Translation system → multi-language descriptions and action text
 *
 * Performance considerations:
 * - O(n) for spawn candidate preparation where n = template + custom items
 * - O(m) for entity selection where m = maxItems parameter
 * - Extensive debug logging for spawn balance tuning
 * - Memory efficient with streaming resolution of large item catalogs
 *
 * @param chunkData - Environmental properties defining chunk characteristics and spawn conditions
 * @param worldProfile - Global world settings affecting spawn rates and content density
 * @param allItemDefinitions - Complete registry of item definitions for resolution and validation
 * @param customItemCatalog - Procedurally generated items that can spawn in addition to templates
 * @param customStructures - Custom structures available for spawning in this chunk
 * @param language - Language code for generating localized descriptions and actions
 * @returns Complete chunk content ready for game integration
 *
 * @example
 * ```typescript
 * const chunk = generateChunkContent(
 *   {
 *     vegetationDensity: 70, moisture: 60, elevation: 100, dangerLevel: 30,
 *     magicAffinity: 20, humanPresence: 10, predatorPresence: 40, temperature: 25,
 *     terrain: 'forest', explorability: 80, soilType: 'fertile', travelCost: 1,
 *     lightLevel: 100, windLevel: 50
 *   },
 *   { spawnMultiplier: 1.2, resourceDensity: 75, difficulty: 0.5, name: 'Test World' },
 *   itemDefinitions,
 *   customGeneratedItems,
 *   customGeneratedStructures,
 *   'en'
 * );
 * // Result contains description, NPCs, items, structures, enemy, and actions
 * ```
 */
export function generateChunkContent(
    chunkData: ChunkBaseData,
    worldProfile: WorldProfile,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
): ChunkGenerationResult {
    logger.debug('[generateChunkContent] STARTING', { chunkData, customItemCatalogLength: customItemCatalog.length });

    /**
     * Local translation helper function.
     * @param key - The translation key.
     * @param replacements - Optional replacements for placeholders in the translated text.
     * @returns The translated string.
     */
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

    /**
     * Applies a softcap to a given multiplier.
     * This prevents multipliers from scaling linearly indefinitely, making the game balance more manageable.
     * @param m - The raw multiplier.
     * @param k - The softcap constant, controlling the curve. A higher `k` means a stronger softcap.
     * @returns The softcapped multiplier.
     */
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
    
    // Generate a descriptive text for the chunk based on available templates and adjectives/features.
    const descriptionTemplates = (terrainTemplate.descriptionTemplates?.short || ["A generic area."]).filter(Boolean);
    const finalDescription = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)]
        .replace('[adjective]', (terrainTemplate.adjectives || ['normal'])[Math.floor(Math.random() * (terrainTemplate.adjectives || ['normal']).length)])
        .replace('[feature]', (terrainTemplate.features || ['nothing special'])[Math.floor(Math.random() * (terrainTemplate.features || ['nothing special']).length)]);
    
    // Apply a softcap to the world's spawn multiplier to prevent excessive spawning.
    const effectiveMultiplier = softcap(worldProfile?.spawnMultiplier ?? 1);

    // Prepare static spawn candidates from the terrain template, ensuring a 'conditions' object and 'chance' are present.
    const staticSpawnCandidates: SpawnCandidate[] = (terrainTemplate.items || []).filter(Boolean).map((item: any) => ({
        ...item,
        conditions: {
            ...(item.conditions || {}), // Ensure conditions object exists
            chance: (item.conditions?.chance ?? 1) // keep raw chance; world multiplier applied later in selectEntities
        }
    }));

    // Prepare custom spawn candidates from the custom item catalog.
    // Items must be spawn-enabled and match the current chunk's terrain.
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

    // Combine static and custom spawn candidates for item selection.
    const allSpawnCandidates = [...staticSpawnCandidates, ...customSpawnCandidates];
    logger.debug('[generateChunkContent] allSpawnCandidates', { allSpawnCandidatesLength: allSpawnCandidates.length, allSpawnCandidates });

    // Determine the maximum number of unique item types to select for this chunk.
    // Reduced base so chunks do not automatically fill up with many items.
    const baseMaxItems = 4; // Default (reduced) number of items
    
    // Clamp a value between 0 and 1, typically used for normalizing chunk data values.
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v / 100));

    // Calculate a chunk-level resource score based on various environmental factors.
    // This score influences how many items can spawn in this specific chunk.
    const vegetation = clamp01(chunkData.vegetationDensity ?? 50);
    const moisture = clamp01(chunkData.moisture ?? 50);
    const humanFactor = 1 - clamp01(chunkData.humanPresence ?? 50); // Less human presence = more resources
    const dangerFactor = 1 - clamp01(chunkData.dangerLevel ?? 50);   // Less danger = more resources
    const predatorFactor = 1 - clamp01(chunkData.predatorPresence ?? 50); // Less predators = more resources
    const chunkResourceScore = (vegetation + moisture + humanFactor + dangerFactor + predatorFactor) / 5; // Average score (0..1)

    // Scale the chunk resource score by the world's overall resource density multiplier.
    // resourceDensity is now expected to be a multiplier (e.g. 0.5..1.5).
    const worldDensityScale = worldProfile?.resourceDensity ?? 1; // multiplier applied directly

    // Map the combined chunk and world resource score to a multiplier for item count.
    // This ensures that resource-rich chunks in resource-rich worlds spawn more items.
    const chunkCountMultiplier = 0.5 + (chunkResourceScore * 1.0 * worldDensityScale); // Range [0.5, 1.5]

    // Calculate the final maximum number of unique items, applying all multipliers and ensuring at least one item.
    const maxItems = Math.max(1, Math.floor(baseMaxItems * effectiveMultiplier * chunkCountMultiplier));

    // Chunk-level find chance: decide whether this chunk yields any items at all.
    // This prevents nearly-every-chunk finds when many candidates exist.
    const baseFindChance = 0.35; // ~35% baseline chance a chunk will contain items
    // Scale by world density and chunk richness. Clamp to avoid extreme values.
    const chunkFindMultiplier = 0.6 + (chunkResourceScore * 0.6); // range [0.6,1.2]
    const chunkFindChance = Math.max(0.01, Math.min(0.9, baseFindChance * (worldDensityScale ?? 1) * chunkFindMultiplier * effectiveMultiplier));

    let spawnedItemRefs: any[] = [];
    if (Math.random() < chunkFindChance) {
        spawnedItemRefs = selectEntities(allSpawnCandidates, maxItems, chunkData, allItemDefinitions, worldProfile);
    } else {
        logger.debug('[generateChunkContent] chunkFindChance failed, no items this chunk', { chunkFindChance });
    }
    logger.debug('[generateChunkContent] spawnedItemRefs', { spawnedItemRefsLength: spawnedItemRefs.length, spawnedItemRefs });
    const spawnedItems: ChunkItem[] = [];

    /**
     * Helper function to resolve an item reference name (which might be a display string)
     * to its corresponding {@link ItemDefinition} object.
     * It first attempts a direct key lookup, then searches by translated display name.
     * @param displayOrKey - The display name or key of the item to resolve.
     * @returns The {@link ItemDefinition} if found, otherwise `undefined`.
     */
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
    
    // Select and map NPCs to be spawned in the chunk.
    const spawnedNPCs: Npc[] = selectEntities(terrainTemplate.NPCs, 3, chunkData, allItemDefinitions, worldProfile).map(ref => ref.data);

    // Filter out any null/undefined enemy candidates.
    let allEnemyCandidates = [...(terrainTemplate.enemies || [])].filter(Boolean);

    // Select potential enemies to spawn.
    const spawnedEnemies = selectEntities(allEnemyCandidates, 3, chunkData, allItemDefinitions, worldProfile);
    
    let spawnedStructures: Structure[] = [];
    // Select structures to spawn based on terrain template.
    const spawnedStructureRefs = selectEntities((terrainTemplate.structures || []).filter(Boolean), 2, chunkData, allItemDefinitions, worldProfile);
    
    for (const structRef of spawnedStructureRefs) {
        if (structRef.loot) {
            for (const lootItem of structRef.loot) {
                // Check if the loot item should spawn based on its chance.
                if (lootItem.chance !== undefined && Math.random() < lootItem.chance) {
                    const definition = allItemDefinitions[lootItem.name];
                    if (definition) {
                        // Determine the quantity of the loot item.
                        const quantity = getRandomInRange({ min: lootItem.quantity.min, max: lootItem.quantity.max });
                        // If the item already exists in spawnedItems, update its quantity; otherwise, add it as a new item.
                        const existingItem = spawnedItems.find(i => (
                            // If spawned item has an explicit id, prefer it
                            (i as any).id === lootItem.name ||
                            // Resolve the spawned item's name to a canonical id and compare
                            resolveItemId(i.name, allItemDefinitions) === lootItem.name ||
                            // Fallback to legacy English string comparison
                            getTranslatedText(i.name, 'en') === lootItem.name
                        ));
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
   
    // Determine the final enemy to spawn, if any.
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
    
    // Initialize actions available in this chunk.
    const actions: Action[] = [];
    let actionIdCounter = 1;

    // Add 'observe enemy' action if an enemy is spawned.
    if (spawnedEnemy) {
        actions.push({ 
            id: actionIdCounter++, 
            textKey: 'observeAction_enemy', 
            params: { enemyType: getTranslatedText(spawnedEnemy.type, 'en') }
        });
    }
    // Add 'talk to NPC' action if NPCs are spawned.
    if (spawnedNPCs.length > 0) {
        actions.push({ 
            id: actionIdCounter++, 
            textKey: 'talkToAction_npc', 
            params: { npcName: getTranslatedText(spawnedNPCs[0].name, 'en') }
        });
    }

    // Add 'pick up item' actions for all spawned items.
    spawnedItems.forEach(item => {
        actions.push({ id: actionIdCounter++, textKey: 'pickUpAction_item', params: { itemName: getTranslatedText(item.name, 'en') } });
    });
    
    // Add general exploration and listening actions.
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
