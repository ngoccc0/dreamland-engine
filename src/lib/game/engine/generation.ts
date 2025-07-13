import type { Chunk, ChunkItem, Region, SoilType, SpawnConditions, Terrain, World, WorldProfile, Season, ItemDefinition, GeneratedItem, WeatherState, PlayerItem, Recipe, RecipeIngredient, Structure, Language, Npc, CraftingOutcome, Action, ItemCategory, Skill, WeatherDefinition } from "../types";
import { seasonConfig, worldConfig } from "../world-config";
import { getTemplates } from "../templates";
import { weatherPresets } from "../weatherPresets";
import { translations } from "../../i18n";
import type { TranslationKey } from "../../i18n";
import { clamp } from "../../utils";
import { naturePlusForestEnemies, naturePlusJungleEnemies, naturePlusMountainEnemies, naturePlusSwampEnemies } from "../templates/modded/nature_plus";


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
        return weatherPresets.find(w => w.id === 'clear')!;
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
    possibleEntities: T[] | undefined,
    chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy' | 'regionId' | 'x' | 'y' | 'terrain' | 'explored' | 'structures' | 'lastVisited'>,
    allItemDefinitions: Record<string, ItemDefinition>, // Pass in all definitions
    maxCount: number = 3
): any[] => {
    if (!possibleEntities) {
        return []; // Safety check for undefined arrays
    }
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
        return Object.keys(worldConfig).filter(t => t !== 'wall') as Terrain[];
    }
    
    const allPossibleNeighbors = new Set<Terrain>();
    for (const adjTerrain of adjacentTerrains) {
        const adjConfig = worldConfig[adjTerrain];
        if (adjConfig) {
            adjConfig.allowedNeighbors.forEach(neighbor => allPossibleNeighbors.add(neighbor));
        }
    }

    const validTerrains = [...allPossibleNeighbors].filter(terrain => {
        if (terrain === 'wall') return false;
        const config = worldConfig[terrain];
        if (!config) return false;

        // A potential new terrain is valid if it's allowed to be a neighbor of ALL existing adjacent terrains.
        for(const adjTerrain of adjacentTerrains) {
            const adjConfig = worldConfig[adjTerrain];
            if (!adjConfig.allowedNeighbors.includes(terrain)) {
                return false;
            }
        }
        return true;
    });
    
    return validTerrains.length > 0 ? validTerrains : Object.keys(worldConfig).filter(t => t !== 'wall') as Terrain[];
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
    
    const finalDescription = template.descriptionTemplates.short[0]
        .replace('[adjective]', template.adjectives[Math.floor(Math.random() * template.adjectives.length)])
        .replace('[feature]', template.features[Math.floor(Math.random() * template.features.length)]);
    
    const staticSpawnCandidates = template.items || [];
    const customSpawnCandidates = customItemCatalog
        .filter(item => item.spawnEnabled !== false && item.spawnBiomes && item.spawnBiomes.includes(chunkData.terrain as Terrain))
        .map(item => ({ name: item.name, conditions: { chance: 0.15 } })); 
    
    const allSpawnCandidates = [...staticSpawnCandidates, ...customSpawnCandidates];

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
                    description: t(itemDef.description as TranslationKey),
                    tier: itemDef.tier,
                    quantity: finalQuantity,
                    emoji: itemDef.emoji,
                });
            }
        }
    }
    
    const spawnedNPCs: Npc[] = selectEntities(template.NPCs, chunkData, allItemDefinitions, 1).map(ref => ref.data);

    // Combine base enemies with modded enemies
    let allEnemyCandidates = [...(template.enemies || [])];
    if (chunkData.terrain === 'swamp') allEnemyCandidates = [...allEnemyCandidates, ...naturePlusSwampEnemies];
    if (chunkData.terrain === 'jungle') allEnemyCandidates = [...allEnemyCandidates, ...naturePlusJungleEnemies];
    if (chunkData.terrain === 'forest') allEnemyCandidates = [...allEnemyCandidates, ...naturePlusForestEnemies];
    if (chunkData.terrain === 'mountain') allEnemyCandidates = [...allEnemyCandidates, ...naturePlusMountainEnemies];

    const spawnedEnemies = selectEntities(allEnemyCandidates, chunkData, allItemDefinitions, 1);
    
    let spawnedStructures: Structure[] = [];
    if (Math.random() < 0.05 && customStructures && customStructures.length > 0) { // Reduced chance
        const uniqueStructure = customStructures[Math.floor(Math.random() * customStructures.length)];
        spawnedStructures.push(uniqueStructure);
    } else {
        const spawnedStructureRefs = selectEntities(template.structures, chunkData, allItemDefinitions, 1);
        spawnedStructures = spawnedStructureRefs.map(ref => ref.data);
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
                                    description: t(definition.description as TranslationKey),
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

export const generateRegion = (
    startPos: { x: number; y: number }, 
    terrain: Terrain, 
    currentWorld: World, 
    currentRegions: { [id: number]: Region }, 
    currentRegionCounter: number,
    worldProfile: WorldProfile,
    currentSeason: Season,
    allItemDefinitions: Record<string, ItemDefinition>,
    customItemCatalog: GeneratedItem[],
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

        const vegetationDensity = getRandomInRange(biomeDef.defaultValueRanges.vegetationDensity);
        const baseMoisture = getRandomInRange(biomeDef.defaultValueRanges.moisture);
        const elevation = getRandomInRange(biomeDef.defaultValueRanges.elevation);
        const dangerLevel = getRandomInRange(biomeDef.defaultValueRanges.dangerLevel);
        const magicAffinity = getRandomInRange(biomeDef.defaultValueRanges.magicAffinity);
        const humanPresence = getRandomInRange(biomeDef.defaultValueRanges.humanPresence);
        const predatorPresence = getRandomInRange(biomeDef.defaultValueRanges.predatorPresence);
        const baseTemperature = getRandomInRange(biomeDef.defaultValueRanges.temperature);

        const dependentAttributes = calculateDependentChunkAttributes(
            terrain,
            { vegetationDensity, moisture: baseMoisture, dangerLevel: dangerLevel, temperature: baseTemperature },
            worldProfile,
            currentSeason
        );
        
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
    const key = `${pos.x},${pos.y}`;
    if (currentWorld[key]) {
        return { worldWithChunk: currentWorld, newRegions: currentRegions, newRegionCounter: currentRegionCounter };
    }

    const validTerrains = getValidAdjacentTerrains(pos, currentWorld);
    const terrainWeights = validTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
    const newTerrain = weightedRandom(terrainWeights);

    const { newWorld, newRegions, newRegionCounter } = generateRegion(pos, newTerrain, currentWorld, currentRegions, currentRegionCounter, worldProfile, currentSeason, allItemDefinitions, customItemCatalog, customStructures, language);
    return { worldWithChunk: newWorld, newRegions, newRegionCounter };
}


export const getEffectiveChunk = (baseChunk: Chunk, weatherZones: { [key: string]: WeatherZone }, gameTime: number): Chunk => {
    if (!baseChunk) return baseChunk;

    const effectiveChunk: Chunk = { ...baseChunk };
    
    let structureHeat = effectiveChunk.structures?.reduce((sum, s) => sum + (s.heatValue || 0), 0) || 0;

    if (!weatherZones[effectiveChunk.regionId]) {
        effectiveChunk.temperature = (baseChunk.temperature ?? 15) + structureHeat;
        return effectiveChunk;
    }

    const weatherZone = weatherZones[baseChunk.regionId];
    const weather = weatherZone.currentWeather;
    
    const baseCelsius = (baseChunk.temperature ?? 5) * 4;
    const weatherCelsiusMod = weather.temperature_delta * 2;
    effectiveChunk.temperature = baseCelsius + weatherCelsiusMod + structureHeat;

    effectiveChunk.moisture = clamp(baseChunk.moisture + weather.moisture_delta, 0, 10);
    effectiveChunk.windLevel = clamp((baseChunk.windLevel ?? 3) + weather.wind_delta, 0, 10);
    
    let timeLightMod = 0;
    if (gameTime >= 1320 || gameTime < 300) timeLightMod = -8;
    else if ((gameTime >= 300 && gameTime < 420) || (gameTime >= 1080 && gameTime < 1200)) timeLightMod = -3;
    
    effectiveChunk.lightLevel = clamp(baseChunk.lightLevel + weather.light_delta + timeLightMod, -10, 10);

    return effectiveChunk;
};
