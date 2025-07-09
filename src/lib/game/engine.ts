

import type { Chunk, ChunkItem, Region, SoilType, SpawnConditions, Terrain, World, WorldProfile, Season, ItemDefinition, GeneratedItem, WeatherState, PlayerItem, Recipe, RecipeIngredient, Structure, Language, Npc, CraftingOutcome, Action, ItemCategory, Skill } from "./types";
import { seasonConfig, worldConfig } from "./world-config";
import { getTemplates } from "./templates";
import { itemDefinitions as staticItemDefinitions } from "@/lib/game/items";
import { weatherPresets } from "./weatherPresets";
import { translations } from "../i18n";
import type { TranslationKey } from "../i18n";
import { clamp } from "@/lib/utils";
import type { SuccessLevel } from "./dice";

// --- HELPER FUNCTIONS ---
const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

// --- WEATHER GENERATION ---
export const generateWeatherForZone = (terrain: Terrain, season: Season, previousWeather?: WeatherState): WeatherState => {
    let candidateWeather = weatherPresets.filter(
      w => w.biome_affinity.includes(terrain) &&
           w.season_affinity.includes(season)
    );

    // Cooldown logic to prevent back-to-back extreme weather
    if (previousWeather) {
        const extremeTags = ['storm', 'heat', 'cold'];
        const previousIsExtreme = previousWeather.exclusive_tags.some(tag => extremeTags.includes(tag));
        if (previousIsExtreme) {
            candidateWeather = candidateWeather.filter(w => !w.exclusive_tags.some(tag => extremeTags.includes(tag)));
        }
    }
    
    if (candidateWeather.length === 0) {
        // Fallback to clear weather if no valid weather is found after filtering
        return weatherPresets.find(w => w.name === 'Clear Skies')!;
    }

    const totalWeight = candidateWeather.reduce((sum, w) => sum + w.spawnWeight, 0);
    let random = Math.random() * totalWeight;

    for (const weather of candidateWeather) {
        random -= weather.spawnWeight;
        if (random <= 0) {
            return weather;
        }
    }
    
    return candidateWeather[0]; // Should not be reached, but as a fallback
};


// --- ENTITY SPAWNING LOGIC ---

// Helper function to check if a chunk meets the spawn conditions for an entity
export const checkConditions = (conditions: SpawnConditions, chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures' | 'lastVisited'>): boolean => {
    for (const key in conditions) {
        if (key === 'chance') continue;
        const condition = conditions[key as keyof typeof conditions];
        
        // This handles the new optional `chunk` parameter in the type
        const chunkValue = chunk[key as keyof typeof chunk];

        if (key === 'soilType') {
            const soilConditions = condition as SoilType[];
            if (!soilConditions.includes((chunk as any).soilType)) return false;
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
 * Selects entities based on conditions and chance.
 * @param possibleEntities - An array of potential entities with their spawn conditions.
 * @param chunk - The chunk data to check conditions against.
 * @param maxCount - The maximum number of entity types to select.
 * @returns An array of selected entity names.
 */
const selectEntities = <T extends {name: string, conditions: SpawnConditions} | {data: any, conditions: SpawnConditions, loot?: any}>(
    possibleEntities: T[],
    chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures' | 'lastVisited'>,
    allItemDefinitions: Record<string, ItemDefinition>, // Pass in all definitions
    maxCount: number = 3
): any[] => {
    const validEntities = possibleEntities.filter(entity => checkConditions(entity.conditions, chunk));
    
    const selected: any[] = [];
    const shuffled = [...validEntities].sort(() => 0.5 - Math.random());
    
    for (const entity of shuffled) {
        if (selected.length >= maxCount) break;

        let spawnChance = entity.conditions.chance ?? 1.0;
        
        // This handles both the old format {data: {type: '...'}, ...} for enemies/NPCs
        // and the new format {name: '...', ...} for items.
        const entityData = 'data' in entity ? entity.data : entity;
        const itemName = entityData.name || entityData.type || entityData;

        // For items, check the definition catalog for the tier
        const itemDef = allItemDefinitions[itemName];
        if (itemDef) {
            const tier = itemDef.tier;
            // Reduce spawn chance by 50% for each tier above 1.
            const tierMultiplier = Math.pow(0.5, tier - 1);
            spawnChance *= tierMultiplier;
        }

        if (Math.random() < spawnChance) {
            selected.push(entity);
        }
    }
    return selected;
};


// --- WORLD GENERATION LOGIC ---

// Selects a random terrain type based on weighted probabilities from worldConfig.
export const weightedRandom = (options: [Terrain, number][]): Terrain => {
    const total = options.reduce((sum, [, prob]) => sum + prob, 0);
    const r = Math.random() * total;
    let current = 0;
    for (const [option, prob] of options) {
        current += prob;
        if (r <= current) return option;
    }
    return options[0][0]; // Fallback
}

// Determines which terrain types can be generated at a new position
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
        return Object.keys(worldConfig) as Terrain[];
    }

    const validTerrains = new Set<Terrain>();
    for (const terrain of Object.keys(worldConfig) as Terrain[]) {
        if (terrain === 'wall') continue; // Walls should not be generated randomly as biomes
        const config = worldConfig[terrain];
        // Check if this new terrain can be a neighbor to all existing adjacent terrains
        let canBeNeighborToAll = true;
        for (const adjTerrain of adjacentTerrains) {
            const adjConfig = worldConfig[adjTerrain];
            if (!adjConfig.allowedNeighbors.includes(terrain)) {
                canBeNeighborToAll = false;
                break;
            }
        }

        // Check if all existing adjacent terrains can be neighbors to this new terrain
        let allCanBeNeighborsTo = true;
        if (canBeNeighborToAll) {
            for (const adjTerrain of adjacentTerrains) {
                if (!config.allowedNeighbors.includes(adjTerrain)) {
                    allCanBeNeighborsTo = false;
                    break;
                }
            }
        }
        
        if (canBeNeighborToAll && allCanBeNeighborsTo) {
            validTerrains.add(terrain);
        }
    }
    
    const validTerrainsArray = Array.from(validTerrains);
    return validTerrainsArray.length > 0 ? validTerrainsArray : Object.keys(worldConfig).filter(t => t !== 'wall') as Terrain[];
};

/**
 * Calculates attributes of a chunk that are dependent on other values
 * (e.g., world profile, season, base attributes).
 * @param terrain The terrain type of the chunk.
 * @param baseAttributes The randomly generated base attributes for the chunk.
 * @param worldProfile The global profile of the world.
 * @param currentSeason The current season.
 * @returns An object containing all calculated attributes.
 */
function calculateDependentChunkAttributes(
    terrain: Terrain,
    baseAttributes: {
        vegetationDensity: number;
        moisture: number; // This is the base moisture before seasonal/world mods
        dangerLevel: number;
        temperature: number;
    },
    worldProfile: WorldProfile,
    currentSeason: Season
) {
    const biomeDef = worldConfig[terrain];
    const seasonMods = seasonConfig[currentSeason];

    const temperature = clamp(baseAttributes.temperature + seasonMods.temperatureMod + worldProfile.tempBias, 0, 10);
    const finalMoisture = clamp(baseAttributes.moisture + seasonMods.moistureMod + worldProfile.moistureBias, 0, 10);
    const windLevel = clamp(getRandomInRange({min: 2, max: 8}) + seasonMods.windMod, 0, 10);
    
    let lightLevel: number;
    if (terrain === 'cave') {
        lightLevel = getRandomInRange({ min: -8, max: -5 });
    } else {
        // Base light from sun, modified by season, reduced by vegetation density
        let baseLight = worldProfile.sunIntensity + seasonMods.sunExposureMod - baseAttributes.vegetationDensity;
        lightLevel = baseLight + getRandomInRange({ min: -1, max: 1 });
    }
    lightLevel = clamp(lightLevel, -10, 10);

    const explorability = clamp(10 - (baseAttributes.vegetationDensity / 2) - (baseAttributes.dangerLevel / 2), 0, 10);
    const soilType = biomeDef.soilType[Math.floor(Math.random() * biomeDef.soilType.length)];
    const travelCost = biomeDef.travelCost;
    
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

/**
 * Generates the "content" of a chunk (description, NPCs, items, enemies, actions)
 * based on its final physical attributes.
 * @param chunkData The complete physical data of the chunk.
 * @param worldProfile The global settings for the world.
 * @returns An object containing the generated content.
 */
function generateChunkContent(
    chunkData: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'explored' | 'structures' | 'terrain' | 'lastVisited'> & { terrain: Terrain },
    worldProfile: WorldProfile,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
) {
    const t = (key: TranslationKey, replacements?: { [key: string]: string | number }): string => {
        let textPool = (translations[language] as any)[key] || (translations.en as any)[key] || key;
        let text = Array.isArray(textPool) ? textPool[Math.floor(Math.random() * textPool.length)] : textPool;
        if (replacements && typeof text === 'string') {
            for (const [replaceKey, value] of Object.entries(replacements)) {
                text = text.replace(`{${replaceKey}}`, String(value));
            }
        }
        return text;
    };

    const templates = getTemplates(language);
    const template = templates[chunkData.terrain];
    
    // Use the first short description as the base, since it's now more generic.
    const finalDescription = template.descriptionTemplates.short[0]
        .replace('[adjective]', template.adjectives[Math.floor(Math.random() * template.adjectives.length)])
        .replace('[feature]', template.features[Math.floor(Math.random() * template.features.length)]);
    
    // --- Create a combined list of all possible items for this biome ---
    const staticSpawnCandidates = template.items;
    const customSpawnCandidates = customItemCatalog
        .filter(item => item.spawnBiomes.includes(chunkData.terrain as Terrain))
        .map(item => ({ name: item.name, conditions: { chance: 0.15 } })); // Give custom items a base chance
    
    const allSpawnCandidates = [...staticSpawnCandidates, ...customSpawnCandidates];

    // --- Generate Items from the combined list ---
    const spawnedItemRefs = selectEntities(allSpawnCandidates, chunkData, allItemDefinitions, 3);
    const spawnedItems: ChunkItem[] = [];

    for (const itemRef of spawnedItemRefs) {
        const itemDef = allItemDefinitions[itemRef.name];
        if (itemDef) {
            const baseQuantity = getRandomInRange(itemDef.baseQuantity);
            const multiplier = worldProfile.resourceDensity / 5.0;
            const finalQuantity = Math.round(baseQuantity * multiplier);

            if (finalQuantity > 0) {
                spawnedItems.push({
                    name: itemRef.name,
                    description: itemDef.description,
                    tier: itemDef.tier,
                    quantity: finalQuantity,
                    emoji: itemDef.emoji,
                });
            }
        }
    }
    
    // NPCs and Enemies
    const spawnedNPCs: Npc[] = selectEntities(template.NPCs, chunkData, allItemDefinitions, 1).map(ref => ref.data);
    const spawnedEnemies = selectEntities(template.enemies, chunkData, allItemDefinitions, 1);
    
    // Structures - Mix of AI-generated and template
    let spawnedStructures: Structure[] = [];
    if (Math.random() < 0.25 && customStructures && customStructures.length > 0) { // 25% chance to spawn a unique AI structure
        const uniqueStructure = customStructures[Math.floor(Math.random() * customStructures.length)];
        spawnedStructures.push(uniqueStructure);
    } else {
        const spawnedStructureRefs = selectEntities(template.structures, chunkData, allItemDefinitions, 1);
        spawnedStructures = spawnedStructureRefs.map(ref => ref.data);
         // Add loot from template structures
        for (const structureRef of spawnedStructureRefs) {
            if (structureRef.loot) {
                for (const lootItem of structureRef.loot) {
                    if (Math.random() < lootItem.chance) {
                        const definition = allItemDefinitions[lootItem.name];
                        if (definition) {
                            const quantity = getRandomInRange(lootItem.quantity);
                            const existingItem = spawnedItems.find(i => i.name === lootItem.name);
                            if (existingItem) {
                                existingItem.quantity += quantity;
                            } else {
                                spawnedItems.push({
                                    name: lootItem.name,
                                    description: definition.description,
                                    tier: definition.tier,
                                    quantity: quantity,
                                    emoji: definition.emoji,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
   
    const enemyData = spawnedEnemies.length > 0 ? spawnedEnemies[0].data : null;
    const spawnedEnemy = enemyData ? { ...enemyData, satiation: 0, emoji: enemyData.emoji } : null;
    
    // Actions
    const actions: Action[] = [];
    let actionIdCounter = 1;

    if (spawnedEnemy) {
        actions.push({ id: actionIdCounter++, textKey: 'observeAction_enemy', params: { enemyType: spawnedEnemy.type as TranslationKey } });
    }
    if (spawnedNPCs.length > 0) {
        actions.push({ id: actionIdCounter++, textKey: 'talkToAction_npc', params: { npcName: spawnedNPCs[0].name as TranslationKey } });
    }

    spawnedItems.forEach(item => {
        actions.push({ id: actionIdCounter++, textKey: 'pickUpAction_item', params: { itemName: item.name as TranslationKey } });
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


function createWallChunk(pos: { x: number; y: number }): Chunk {
    const biomeDef = worldConfig['wall'];
    return {
        x: pos.x,
        y: pos.y,
        terrain: 'wall',
        description: "An impassable rock wall blocks the way.",
        NPCs: [],
        items: [],
        structures: [],
        explored: true, // Walls are always visible
        lastVisited: 0,
        enemy: null,
        actions: [],
        regionId: -1, // Walls don't belong to a region
        travelCost: biomeDef.travelCost,
        vegetationDensity: 0,
        moisture: 0,
        elevation: 5,
        lightLevel: 0,
        dangerLevel: 0,
        magicAffinity: 0,
        humanPresence: 0,
        explorability: 0,
        soilType: 'rocky',
        predatorPresence: 0,
        temperature: 5,
    };
}

// This is the core "factory" function for building a new region of the world.
export const generateRegion = (
    startPos: { x: number; y: number }, 
    terrain: Terrain, 
    currentWorld: World, 
    currentRegions: { [id: number]: Region }, 
    currentRegionCounter: number,
    worldProfile: WorldProfile,
    currentSeason: Season,
    allItemDefinitions: Record<string, ItemDefinition>, // Pass in all definitions
    customItemCatalog: GeneratedItem[],                   // Pass in custom catalog for spawning
    customStructures: Structure[],
    language: Language
) => {
    const newWorld = { ...currentWorld };
    const newRegions = { ...currentRegions };
    let newRegionCounter = currentRegionCounter;

    const biomeDef = worldConfig[terrain];
    
    const size = getRandomInRange({ min: biomeDef.minSize, max: biomeDef.maxSize });
    
    const regionCells: { x: number, y: number }[] = [startPos];
    const visited = new Set<string>([`${startPos.x},${startPos.y}`]);
    const generationQueue: {x: number, y: number}[] = [startPos];
    const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];

    while(generationQueue.length > 0 && regionCells.length < size) {
        const current = generationQueue.shift()!;
        for (const dir of directions.sort(() => Math.random() - 0.5)) {
            if (regionCells.length >= size) break;

            const nextPos = { x: current.x + dir.x, y: current.y + dir.y };
            const nextKey = `${nextPos.x},${nextPos.y}`;

            if (!visited.has(nextKey) && !newWorld[nextKey]) {
                visited.add(nextKey);
                regionCells.push(nextPos);
                generationQueue.push(nextPos);
            }
        }
    }

    const regionId = newRegionCounter++;
    newRegions[regionId] = { terrain, cells: regionCells };

    for (const pos of regionCells) {
        const posKey = `${pos.x},${pos.y}`;

        // Step 1: Generate base attributes from biome definitions
        const vegetationDensity = getRandomInRange(biomeDef.defaultValueRanges.vegetationDensity);
        const baseMoisture = getRandomInRange(biomeDef.defaultValueRanges.moisture);
        const elevation = getRandomInRange(biomeDef.defaultValueRanges.elevation);
        const dangerLevel = getRandomInRange(biomeDef.defaultValueRanges.dangerLevel);
        const magicAffinity = getRandomInRange(biomeDef.defaultValueRanges.magicAffinity);
        const humanPresence = getRandomInRange(biomeDef.defaultValueRanges.humanPresence);
        const predatorPresence = getRandomInRange(biomeDef.defaultValueRanges.predatorPresence);
        const baseTemperature = getRandomInRange(biomeDef.defaultValueRanges.temperature);

        // Step 2: Calculate dependent attributes using the new function
        const dependentAttributes = calculateDependentChunkAttributes(
            terrain,
            { vegetationDensity, moisture: baseMoisture, dangerLevel: baseTemperature, temperature: baseTemperature },
            worldProfile,
            currentSeason
        );
        
        // Step 3: Combine all attributes to form the final chunk data for content generation
        const tempChunkData = {
            terrain,
            vegetationDensity,
            elevation,
            dangerLevel,
            magicAffinity,
            humanPresence,
            predatorPresence,
            temperature: dependentAttributes.temperature,
            ...dependentAttributes,
        };

        // Step 4: Generate content based on the final chunk data
        const content = generateChunkContent(tempChunkData, worldProfile, allItemDefinitions, customItemCatalog, customStructures, language);
        
        newWorld[posKey] = {
            x: pos.x, 
            y: pos.y, 
            terrain, 
            explored: false, 
            lastVisited: 0,
            regionId,
            ...tempChunkData,
            ...content,
        };
    }

    // --- Add walls around certain biomes ---
    const BORDER_WALL_CHANCE = 0.3; 
    if (['cave', 'mountain', 'volcanic'].includes(terrain) && Math.random() < BORDER_WALL_CHANCE) {
        const borderCells = new Set<string>();
        for (const cell of regionCells) {
            for (const dir of directions) {
                const neighborPos = { x: cell.x + dir.x, y: cell.y + dir.y };
                const neighborKey = `${neighborPos.x},${neighborPos.y}`;
                if (!visited.has(neighborKey)) {
                    borderCells.add(neighborKey);
                }
            }
        }
        for (const key of borderCells) {
            if (!newWorld[key]) {
                const [x, y] = key.split(',').map(Number);
                newWorld[key] = createWallChunk({ x, y });
            }
        }
    }


    return { newWorld, newRegions, newRegionCounter };
};

// --- CRAFTING SYSTEM ---
export const calculateCraftingOutcome = (playerItems: PlayerItem[], recipe: Recipe): CraftingOutcome => {
    const tempPlayerItems = new Map(playerItems.map(item => [item.name, item.quantity]));
    const resolvedIngredients: CraftingOutcome['resolvedIngredients'] = [];
    const ingredientsToConsumeMap = new Map<string, number>();
    let worstTier = 1;
    let canCraft = true;

    const getPossibleItems = (ing: RecipeIngredient) => {
        return [{ name: ing.name, tier: 1 as const }, ...(ing.alternatives || [])]
            .sort((a, b) => a.tier - b.tier);
    };

    // First pass: Resolve which item to use for each requirement and check if we have enough
    for (const requirement of recipe.ingredients) {
        const possibleItems = getPossibleItems(requirement);
        let usedItem: { name: string; tier: number } | null = null;
        let hasEnoughForRequirement = false;
        
        // Find the best available item that we have enough of
        for (const possible of possibleItems) {
            if ((tempPlayerItems.get(possible.name) || 0) >= requirement.quantity) {
                usedItem = possible;
                hasEnoughForRequirement = true;
                break;
            }
        }
        
        // If we didn't have enough of any single item, find the best one we have ANY of for display purposes
        if (!usedItem) {
             for (const possible of possibleItems) {
                if ((tempPlayerItems.get(possible.name) || 0) > 0) {
                    usedItem = possible;
                    break;
                }
            }
        }
        
        // If still no item, default to primary for display
        if (!usedItem) {
            usedItem = { name: requirement.name, tier: 1 };
        }

        resolvedIngredients.push({
            requirement,
            usedItem,
            isSubstitute: usedItem.name !== requirement.name,
            hasEnough: hasEnoughForRequirement
        });
    }

    // Second pass: Based on the resolved list, calculate final craftability and consumption
    const finalTempPlayerItems = new Map(playerItems.map(item => [item.name, item.quantity]));
    for (const resolved of resolvedIngredients) {
        if (!resolved.hasEnough) {
            canCraft = false;
            break; // No need to continue if one requirement fails
        }

        const itemToConsume = resolved.usedItem!;
        const currentAmount = finalTempPlayerItems.get(itemToConsume.name) || 0;
        
        // This check should be redundant due to hasEnough, but it's a safeguard
        if (currentAmount < resolved.requirement.quantity) {
            canCraft = false;
            break;
        }
        
        // Decrement from our temporary map to handle recipes needing the same item multiple times
        finalTempPlayerItems.set(itemToConsume.name, currentAmount - resolved.requirement.quantity);
        
        // Tally up the total consumption for the final output
        const currentConsumption = ingredientsToConsumeMap.get(itemToConsume.name) || 0;
        ingredientsToConsumeMap.set(itemToConsume.name, currentConsumption + resolved.requirement.quantity);
        
        worstTier = Math.max(worstTier, itemToConsume.tier);
    }
    
    if (!canCraft) {
        ingredientsToConsumeMap.clear();
    }
    
    const ingredientsToConsume = Array.from(ingredientsToConsumeMap.entries()).map(([name, quantity]) => ({ name, quantity }));
    
    let chance = 100;
    if (worstTier === 2) chance = 50;
    if (worstTier === 3) chance = 10;
    if (!canCraft) chance = 0;

    return {
        canCraft,
        chance,
        ingredientsToConsume,
        resolvedIngredients
    };
};

/**
 * Handles "search" type actions (explore, forage, search for materials).
 * This function reveals hidden items in a chunk, adds them to the chunk's item list,
 * and removes the one-time search action.
 */
export const handleSearchAction = (
    currentChunk: Chunk,
    actionId: number,
    language: Language,
    t: (key: TranslationKey, replacements?: any) => string,
    customItemDefinitions: Record<string, ItemDefinition>,
    getRandomInRange: (range: { min: number, max: number }) => number
): { narrative: string, newChunk: Chunk, toastInfo?: { title: TranslationKey, description: TranslationKey, params: any } } => {
    
    const templates = getTemplates(language);
    const biomeTemplate = templates[currentChunk.terrain];

    // Clone the chunk to modify it safely
    const newChunk: Chunk = JSON.parse(JSON.stringify(currentChunk));
    
    // Remove the search action immediately, as it's a one-time use.
    newChunk.actions = newChunk.actions.filter(a => a.id !== actionId);
    
    if (!biomeTemplate || !biomeTemplate.items || biomeTemplate.items.length === 0) {
        return { narrative: t('exploreFoundNothing'), newChunk };
    }

    // Calculate success chance based on explorability
    const successChance = 0.8 * (newChunk.explorability / 10); // Base 80% chance, scaled by explorability

    if (Math.random() > successChance) {
        return { narrative: t('exploreFoundNothing'), newChunk };
    }
    
    const potentialItems = biomeTemplate.items;
    const itemsToFindCount = getRandomInRange({ min: 1, max: 3 });
    const foundItems: ChunkItem[] = [];

    // Shuffle potential items to find random ones
    const shuffledPotentialItems = [...potentialItems].sort(() => 0.5 - Math.random());

    for (const itemTemplate of shuffledPotentialItems) {
        if (foundItems.length >= itemsToFindCount) break;

        // Don't find items that are already on the ground
        if (newChunk.items.some((i: ChunkItem) => i.name === itemTemplate.name)) continue;

        // Check spawn chance for the item
        if (Math.random() < (itemTemplate.conditions.chance || 0.25)) { // Use 0.25 as a base chance
            const itemDef = customItemDefinitions[itemTemplate.name];
            if (itemDef) {
                const quantity = getRandomInRange(itemDef.baseQuantity);
                if (quantity > 0) {
                    foundItems.push({
                        name: itemTemplate.name,
                        description: itemDef.description,
                        tier: itemDef.tier,
                        quantity,
                        emoji: itemDef.emoji,
                    });
                }
            }
        }
    }
    
    if (foundItems.length > 0) {
        const foundItemsText = foundItems.map(item => `${item.quantity} ${t(item.name as TranslationKey)}`).join(', ');
        
        const toastInfo = {
            title: 'exploreSuccessTitle' as TranslationKey,
            description: 'exploreFoundItems' as TranslationKey,
            params: { items: foundItemsText }
        };

        const narrative = t('exploreFoundItemsNarrative', { items: foundItemsText });

        // Add the newly found items to the chunk's item list
        const newItemsMap = new Map((newChunk.items || []).map((item: ChunkItem) => [item.name, { ...item }]));
        foundItems.forEach(foundItem => {
            const existing = newItemsMap.get(foundItem.name);
            if (existing) {
                existing.quantity += foundItem.quantity;
            } else {
                newItemsMap.set(foundItem.name, foundItem);
            }
        });
        newChunk.items = Array.from(newItemsMap.values());
        
        // Regenerate pickup actions for ALL items in the chunk now
        const otherActions = newChunk.actions.filter((a: Action) => a.textKey !== 'pickUpAction_item');
        let actionIdCounter = newChunk.actions.reduce((maxId: number, a: Action) => Math.max(a.id, maxId), 0) + 1;

        const pickUpActions = newChunk.items.map((item: ChunkItem) => ({
            id: actionIdCounter++,
            textKey: 'pickUpAction_item' as TranslationKey,
            params: { itemName: item.name as TranslationKey }
        }));
        newChunk.actions = [...otherActions, ...pickUpActions];

        return { narrative, newChunk, toastInfo };
    } else {
        // You searched successfully but were unlucky and found nothing.
        const narrative = t('exploreFoundNothing');
        return { narrative, newChunk };
    }
};

export const generateOfflineNarrative = (
    baseChunk: Chunk,
    narrativeLength: "short" | "medium" | "long",
    world: World,
    playerPosition: { x: number; y: number; },
    t: (key: TranslationKey, replacements?: any) => string
) => {
    const chunk = baseChunk;
    const lang = (Object.keys(translations).find(key => (translations as any)[key].langIdentifier === t('langIdentifier')) || 'en') as Language;
    const templates = getTemplates(lang);
    const biomeTemplateData = templates[chunk.terrain];

    // Fallback for biomes without structured templates (like 'wall')
    if (!biomeTemplateData.descriptionTemplates.short) {
        return chunk.description;
    }

    const templateSet = biomeTemplateData.descriptionTemplates[narrativeLength] || biomeTemplateData.descriptionTemplates.medium;
    let baseTemplate = Array.isArray(templateSet) ? templateSet[Math.floor(Math.random() * templateSet.length)] : templateSet;

    // Fill in the simple placeholders from the biome template
    const adjective = biomeTemplateData.adjectives[Math.floor(Math.random() * biomeTemplateData.adjectives.length)];
    const feature = biomeTemplateData.features[Math.floor(Math.random() * biomeTemplateData.features.length)];
    const smell = biomeTemplateData.smells[Math.floor(Math.random() * biomeTemplateData.smells.length)];
    const sound = biomeTemplateData.sounds[Math.floor(Math.random() * biomeTemplateData.sounds.length)];
    const sky = biomeTemplateData.sky ? biomeTemplateData.sky[Math.floor(Math.random() * biomeTemplateData.sky.length)] : '';

    let populatedTemplate = baseTemplate
        .replace(/\[adjective\]/g, adjective)
        .replace(/\[feature\]/g, feature)
        .replace(/\[smell\]/g, smell)
        .replace(/\[sound\]/g, sound)
        .replace(/\[sky\]/g, sky);

    // Generate complex, logic-based parts
    const sensoryDetailsParts: string[] = [];
    if (chunk.explorability < 3) sensoryDetailsParts.push(t('offline_explorability_low'));
    if (chunk.dangerLevel > 8) sensoryDetailsParts.push(t('offline_danger_high'));
    if (chunk.magicAffinity > 7) sensoryDetailsParts.push(t('offline_magic_high'));
    if (chunk.temperature && chunk.temperature >= 9) sensoryDetailsParts.push(t('sensoryFeedback_hot'));
    if (chunk.temperature && chunk.temperature <= 2) sensoryDetailsParts.push(t('sensoryFeedback_cold'));
    if (chunk.moisture && chunk.moisture >= 8) sensoryDetailsParts.push(t('offline_moisture_high'));
    if (chunk.lightLevel && chunk.lightLevel <= -5) sensoryDetailsParts.push(t('sensoryFeedback_dark'));
    if (chunk.humanPresence > 5) sensoryDetailsParts.push(t('offline_human_presence'));
    if (chunk.predatorPresence > 7) sensoryDetailsParts.push(t('offline_predator_presence'));
    
    const sensory_details = sensoryDetailsParts.join(' ');

    const entityDetailsParts: string[] = [];
    if (chunk.items.length > 0) {
        const itemsHere = chunk.items.map(i => `${i.quantity} ${t(i.name as TranslationKey)}`).join(', ');
        entityDetailsParts.push(t('offlineNarrativeItems', { items: itemsHere }));
    }
    if (chunk.enemy) entityDetailsParts.push(t('offlineNarrativeEnemy', { enemy: t(chunk.enemy.type as TranslationKey) }));
    if (chunk.NPCs.length > 0) entityDetailsParts.push(t('offlineNarrativeNPC', { npc: t(chunk.NPCs[0].name as TranslationKey) }));
    if (chunk.structures.length > 0) entityDetailsParts.push(t('offlineNarrativeStructure', { structure: t(chunk.structures[0].name as TranslationKey) }));
    const entity_report = entityDetailsParts.join(' ');

    let surrounding_peek = '';
    if (narrativeLength !== 'short') {
        const surroundingPeekParts: string[] = [];
        const directions = [{ x: 0, y: 1, dir: 'North' }, { x: 0, y: -1, dir: 'South' }, { x: 1, y: 0, dir: 'East' }, { x: -1, y: 0, dir: 'West' }];
        for (const dir of directions) {
            const key = `${playerPosition.x + dir.x},${playerPosition.y + dir.y}`;
            const adjacentChunk = world[key];
            if (adjacentChunk && adjacentChunk.explored && ((chunk.lastVisited - adjacentChunk.lastVisited) < 50)) {
                if(adjacentChunk.enemy) {
                    surroundingPeekParts.push(t('surrounding_peek_enemy', { direction: t(`direction${dir.dir}` as TranslationKey), enemy: t(adjacentChunk.enemy.type as TranslationKey) }));
                } else if (adjacentChunk.structures.length > 0) {
                    surroundingPeekParts.push(t('surrounding_peek_structure', { direction: t(`direction${dir.dir}` as TranslationKey), structure: t(adjacentChunk.structures[0].name as TranslationKey) }));
                }
            }
        }
        if (surroundingPeekParts.length > 0) {
            surrounding_peek = t('offlineNarrativeSurroundings') + ' ' + surroundingPeekParts.join('. ');
        }
    }

    // Replace placeholders and clean up
    let finalNarrative = populatedTemplate
        .replace('{sensory_details}', sensory_details)
        .replace('{entity_report}', entity_report)
        .replace('{surrounding_peek}', surrounding_peek)
        .replace(/\s{2,}/g, ' ') // Condense multiple spaces
        .replace(/ \./g, '.')    // Clean up space before periods
        .replace(/ ,/g, ',')     // Clean up space before commas
        .trim();

    return finalNarrative;
};

export const generateOfflineActionNarrative = (
    actionType: 'attack' | 'useSkill' | 'useItem',
    result: any,
    chunk: Chunk,
    t: (key: TranslationKey, replacements?: any) => string
): string => {
    let narrativeParts: string[] = [];
    const sensoryFeedbackParts: string[] = [];

    if (chunk.temperature && chunk.temperature >= 9) sensoryFeedbackParts.push(t('sensoryFeedback_hot'));
    if (chunk.temperature && chunk.temperature <= 2) sensoryFeedbackParts.push(t('sensoryFeedback_cold'));
    if (chunk.lightLevel && chunk.lightLevel <= -5) sensoryFeedbackParts.push(t('sensoryFeedback_dark'));
    if (chunk.moisture && chunk.moisture >= 8) sensoryFeedbackParts.push(t('sensoryFeedback_rain'));
    
    const sensory_feedback = sensoryFeedbackParts.join(' ');
    
    let templateKey: TranslationKey = 'exploreAction'; // Fallback
    const replacements: any = { sensory_feedback };
    
    switch (actionType) {
        case 'attack':
            const { successLevel, playerDamage, enemyDamage, enemyDefeated, fled, enemyType } = result;
            const enemyName = t(enemyType as TranslationKey);

            if (successLevel === 'CriticalSuccess') {
                templateKey = 'actionNarrative_attack_critSuccess';
                replacements.attack_description = t('attackNarrative_critSuccess', { enemyType: enemyName });
            } else if (successLevel === 'Success' || successLevel === 'GreatSuccess') {
                templateKey = 'actionNarrative_attack_success';
                replacements.attack_description = t('attackNarrative_success', { enemyType: enemyName });
            } else if (successLevel === 'Failure') {
                templateKey = 'actionNarrative_attack_fail';
                replacements.attack_description = t('attackNarrative_fail', { enemyType: enemyName });
            } else if (successLevel === 'CriticalFailure') {
                templateKey = 'actionNarrative_attack_critFail';
                replacements.attack_description = t('attackNarrative_critFail', { enemyType: enemyName });
            }

            replacements.damage_report = t('attackDamageDealt', { damage: playerDamage });
            
            if (enemyDefeated) replacements.enemy_reaction = t('enemyDefeatedNarrative', { enemyType: enemyName });
            else if (fled) replacements.enemy_reaction = t('enemyFledNarrative', { enemyType: enemyName });
            else if (enemyDamage > 0) replacements.enemy_reaction = t('enemyRetaliationNarrative', { enemyType: enemyName, damage: enemyDamage });
            else replacements.enemy_reaction = t('enemyPreparesNarrative', { enemyType: enemyName });
            
            break;
        
        case 'useItem': {
            const { itemName, target, wasUsed, effectDescription, wasTamed, itemConsumed } = result;
            const translatedItemName = t(itemName as TranslationKey);

            if (target === 'player') {
                if(wasUsed) return t('itemUsePlayerSuccessNarrative', { item: translatedItemName, effect: effectDescription, sensory_feedback });
                else return t('itemUsePlayerFailNarrative', { item: translatedItemName, sensory_feedback });
            } else {
                const translatedTarget = t(target as TranslationKey);
                if(itemConsumed) {
                    if(wasTamed) return t('itemTameSuccessNarrative', { item: translatedItemName, target: translatedTarget, sensory_feedback });
                    else return t('itemTameFailNarrative', { item: translatedItemName, target: translatedTarget, sensory_feedback });
                }
            }
            break;
        }

        case 'useSkill': {
            const { skill, successLevel, backfireDamage, healedAmount, finalDamage, siphonedAmount, enemy } = result as { skill: Skill, successLevel: SuccessLevel, backfireDamage?: number, healedAmount?: number, finalDamage?: number, siphonedAmount?: number, enemy: Chunk['enemy'] };
            const skillName = t(skill.name as TranslationKey);
            const enemyName = enemy ? t(enemy.type as TranslationKey) : '';

            if (successLevel === 'CriticalFailure') {
                return t('skillCritFailNarrative', { skillName, damage: backfireDamage, sensory_feedback });
            } else if (successLevel === 'Failure') {
                return t('skillFailNarrative', { skillName, sensory_feedback });
            } else {
                if (skill.effect.type === 'HEAL') {
                    return t('skillHealSuccessNarrative', { skillName, amount: healedAmount, sensory_feedback });
                } else if (skill.effect.type === 'DAMAGE' && enemy) {
                    let text = t('skillDamageSuccessNarrative', { skillName, enemy: enemyName, damage: finalDamage, sensory_feedback });
                    if (siphonedAmount) text += ' ' + t('skillSiphonNarrative', { amount: siphonedAmount });
                    if (!result.enemy) text += ' ' + t('enemyDefeatedNarrative', { enemyType: enemyName });
                    return text;
                }
            }
            break;
        }
    }
    
    // Fallback if templateKey wasn't set correctly
    if (templateKey === 'exploreAction') return "An action occurred.";

    return t(templateKey, replacements);
}
