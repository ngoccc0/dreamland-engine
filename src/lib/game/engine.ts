import type { Chunk, ChunkItem, Region, SoilType, SpawnConditions, Terrain, World, WorldProfile, Season, ItemDefinition, GeneratedItem, WeatherState, PlayerItem, Recipe, RecipeIngredient, Structure, Language, Npc } from "./types";
import { seasonConfig, worldConfig } from "./world-config";
import { getTemplates } from "./templates";
import { itemDefinitions as staticItemDefinitions } from "./items";
import { weatherPresets } from "./weatherPresets";
import { translations } from "../i18n";
import type { TranslationKey } from "../i18n";

// --- HELPER FUNCTIONS ---
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);
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
export const checkConditions = (conditions: SpawnConditions, chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures'>): boolean => {
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
    chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures'>,
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
    chunkData: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'explored' | 'structures' | 'terrain'> & { terrain: Terrain },
    worldProfile: WorldProfile,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
    customStructures: Structure[],
    language: Language
) {
    const t = (key: TranslationKey, replacements?: { [key: string]: string | number }): string => {
        let text = (translations[language] as any)[key] || (translations.en as any)[key] || key;
        if (replacements && typeof text === 'string') {
            for (const [replaceKey, value] of Object.entries(replacements)) {
                text = text.replace(`{${replaceKey}}`, String(value));
            }
        }
        return text;
    };

    const templates = getTemplates(language);
    const template = templates[chunkData.terrain];

    // Description
    const baseDescriptionTemplate = template.descriptionTemplates[Math.floor(Math.random() * template.descriptionTemplates.length)];
    const adjective = template.adjectives[Math.floor(Math.random() * template.adjectives.length)];
    const feature = template.features[Math.floor(Math.random() * template.features.length)];
    const smell = template.smells[Math.floor(Math.random() * template.smells.length)];
    const sound = template.sounds[Math.floor(Math.random() * template.sounds.length)];

    let finalDescription = baseDescriptionTemplate
        .replace('[adjective]', adjective)
        .replace('[feature]', feature)
        .replace('[smell]', smell)
        .replace('[sound]', sound);
    
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

    // More description based on calculated values and spawned entities
    if (chunkData.moisture > 8) finalDescription += ` ${t('descMoistureHigh')}`;
    if (chunkData.windLevel && chunkData.windLevel > 8) finalDescription += ` ${t('descWindHigh')}`;
    if (chunkData.temperature && chunkData.temperature < 3) finalDescription += ` ${t('descTempCold')}`;
    if (chunkData.dangerLevel > 8) finalDescription += ` ${t('descDangerHigh')}`;
    if (chunkData.humanPresence > 5) finalDescription += ` ${t('descHumanPresence')}`;
    if (spawnedEnemy) {
        finalDescription += ` ${t('descEnemySensed', { enemyType: t(spawnedEnemy.type as TranslationKey) })}`;
    }
    if (spawnedStructures.length > 0) {
        finalDescription += ` ${t('descStructureSighted')} ${t(spawnedStructures[0].description as TranslationKey).toLowerCase()}`;
    }

    // Actions
    const actions = [];
    let actionIdCounter = 1;

    if (spawnedEnemy) {
        actions.push({ id: actionIdCounter++, text: `${t('observeAction')} ${t(spawnedEnemy.type as TranslationKey)}` });
    }
    if (spawnedNPCs.length > 0) {
        actions.push({ id: actionIdCounter++, text: `${t('talkToAction')} ${t(spawnedNPCs[0].name as TranslationKey)}` });
    }

    actions.push({ id: actionIdCounter++, text: t('exploreAction') });

    if (spawnedItems.length > 0) {
         actions.push({ id: actionIdCounter++, text: `${t('pickUpAction')} ${t(spawnedItems[0].name as TranslationKey)}` });
    }
    
    // Add generic survival actions
    actions.push({ id: actionIdCounter++, text: t('forageForFoodAction') });
    actions.push({ id: actionIdCounter++, text: t('searchForMaterialsAction') });
    actions.push({ id: actionIdCounter++, text: t('listenToSurroundingsAction') });

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
            { vegetationDensity, moisture: baseMoisture, dangerLevel: baseTemperature },
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
export const calculateCraftingOutcome = (playerItems: PlayerItem[], recipe: Recipe): { canCraft: boolean, chance: number, ingredientsToConsume: {name: string, quantity: number}[] } => {
    const ingredientsToConsume: {name: string, quantity: number}[] = [];
    const tempPlayerItems = new Map(playerItems.map(item => [item.name, item.quantity]));
    let canCraft = true;
    let worstTier = 1;

    const getPossibleItemsForIngredient = (ingredient: RecipeIngredient): { name: string, tier: 1 | 2 | 3}[] => {
        const options = [{ name: ingredient.name, tier: 1 as const }];
        if (ingredient.alternatives) {
            options.push(...ingredient.alternatives);
        }
        return options.sort((a, b) => (a.tier || 1) - (b.tier || 1)); // Best tier first
    };

    for (const ing of recipe.ingredients) {
        let foundItemForIngredient: { name: string, tier: number } | null = null;
        const possibleItems = getPossibleItemsForIngredient(ing);
        
        for (const possibleItem of possibleItems) {
            if ((tempPlayerItems.get(possibleItem.name) || 0) >= ing.quantity) {
                foundItemForIngredient = possibleItem;
                break;
            }
        }

        if (foundItemForIngredient) {
            worstTier = Math.max(worstTier, foundItemForIngredient.tier);
            const existing = ingredientsToConsume.find(i => i.name === foundItemForIngredient!.name);
            if (existing) {
                existing.quantity += ing.quantity;
            } else {
                ingredientsToConsume.push({ name: foundItemForIngredient.name, quantity: ing.quantity });
            }
            tempPlayerItems.set(foundItemForIngredient.name, tempPlayerItems.get(foundItemForIngredient.name)! - ing.quantity);
        } else {
            canCraft = false;
            break;
        }
    }

    if (!canCraft) {
        return { canCraft: false, chance: 0, ingredientsToConsume: [] };
    }

    let chance = 100;
    if (worstTier === 2) chance = 50;
    if (worstTier === 3) chance = 10;
    
    return { canCraft: true, chance, ingredientsToConsume };
};
