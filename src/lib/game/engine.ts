import type { Chunk, Region, SoilType, SpawnConditions, Terrain, World, WorldProfile, Season } from "./types";
import { seasonConfig, templates, worldConfig } from "./config";

// --- ENTITY SPAWNING LOGIC ---

// Helper function to check if a chunk meets the spawn conditions for an entity
const checkConditions = (conditions: SpawnConditions, chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy'>): boolean => {
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


// Helper function to select entities based on rules
const selectEntities = <T>(
    possibleEntities: { data: T; conditions: SpawnConditions }[],
    chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy'>,
    maxCount: number = 1
): T[] => {
    const validEntities = possibleEntities.filter(entity => checkConditions(entity.conditions, chunk));
    
    const selected = [];
    // Shuffle valid entities to add more randomness
    const shuffled = [...validEntities].sort(() => 0.5 - Math.random());
    
    for (const entity of shuffled) {
        if (selected.length >= maxCount) break;
        if (Math.random() < (entity.conditions.chance ?? 1.0)) {
            selected.push(entity.data);
        }
    }
    return selected;
};

const selectEnemy = (
    possibleEntities: { data: { type: string; hp: number; damage: number }; conditions: SpawnConditions }[],
    chunk: Omit<Chunk, 'description' | 'actions' | 'items' | 'NPCs' | 'enemy'>
): { type: string; hp: number; damage: number } | null => {
    const validEntities = possibleEntities.filter(entity => checkConditions(entity.conditions, chunk));
    for (const entity of validEntities.sort(() => 0.5 - Math.random())) { // Shuffle to randomize check order
        if (Math.random() < (entity.conditions.chance ?? 1.0)) {
            return entity.data;
        }
    }
    return null;
}

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
    return validTerrainsArray.length > 0 ? validTerrainsArray : Object.keys(worldConfig) as Terrain[];
};

// This is the core "factory" function for building a new region of the world.
export const generateRegion = (
    startPos: { x: number; y: number }, 
    terrain: Terrain, 
    currentWorld: World, 
    currentRegions: { [id: number]: Region }, 
    currentRegionCounter: number,
    worldProfile: WorldProfile,
    currentSeason: Season
) => {
    const newWorld = { ...currentWorld };
    const newRegions = { ...currentRegions };
    let newRegionCounter = currentRegionCounter;

    const template = templates[terrain];
    const biomeDef = worldConfig[terrain];
    
    const size = Math.floor(Math.random() * (biomeDef.maxSize - biomeDef.minSize + 1)) + biomeDef.minSize;
    
    const regionCells: { x: number, y: number }[] = [];
    const visited = new Set<string>([`${startPos.x},${startPos.y}`]);
    const generationQueue: {x: number, y: number}[] = [startPos];
    regionCells.push(startPos);
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

    const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

    for (const pos of regionCells) {
        const posKey = `${pos.x},${pos.y}`;

        const baseDescriptionTemplate = template.descriptionTemplates[Math.floor(Math.random() * template.descriptionTemplates.length)];
        const adjective = template.adjectives[Math.floor(Math.random() * template.adjectives.length)];
        const feature = template.features[Math.floor(Math.random() * template.features.length)];
        const baseDescription = baseDescriptionTemplate.replace('[adjective]', adjective).replace('[feature]', feature);
        
        const seasonMods = seasonConfig[currentSeason];
        
        const vegetationDensity = getRandomInRange(biomeDef.defaultValueRanges.vegetationDensity);
        const moisture = getRandomInRange(biomeDef.defaultValueRanges.moisture);
        const elevation = getRandomInRange(biomeDef.defaultValueRanges.elevation);
        const dangerLevel = getRandomInRange(biomeDef.defaultValueRanges.dangerLevel);
        const magicAffinity = getRandomInRange(biomeDef.defaultValueRanges.magicAffinity);
        const humanPresence = getRandomInRange(biomeDef.defaultValueRanges.humanPresence);
        const predatorPresence = getRandomInRange(biomeDef.defaultValueRanges.predatorPresence);
        
        const temperature = clamp(getRandomInRange({min: 4, max: 7}) + seasonMods.temperatureMod + worldProfile.tempBias, 0, 10);
        const finalMoisture = clamp(moisture + seasonMods.moistureMod + worldProfile.moistureBias, 0, 10);
        const windLevel = clamp(getRandomInRange({min: 2, max: 8}) + seasonMods.windMod, 0, 10);
        const sunExposure = clamp(worldProfile.sunIntensity - (vegetationDensity / 2) + seasonMods.sunExposureMod, 0, 10);
        const lightLevel = clamp(sunExposure, terrain === 'cave' ? 0 : 1, 10); // Caves are dark
        const explorability = clamp(10 - (vegetationDensity / 2) - (dangerLevel / 2), 0, 10);
        const soilType = biomeDef.soilType[Math.floor(Math.random() * biomeDef.soilType.length)];

        const tempChunkData = {
            x: pos.x, y: pos.y, terrain, explored: false, regionId,
            travelCost: biomeDef.travelCost, vegetationDensity, moisture: finalMoisture,
            elevation, lightLevel, dangerLevel, magicAffinity, humanPresence, explorability,
            soilType, sunExposure, windLevel, temperature, predatorPresence,
        };

        const spawnedNPCs = selectEntities(template.NPCs, tempChunkData, 1);
        const spawnedItems = selectEntities(template.items, tempChunkData, 3);
        const spawnedEnemy = selectEnemy(template.enemies, tempChunkData);

        let finalDescription = baseDescription;
        if (tempChunkData.moisture > 8) finalDescription += " Không khí đặc quánh hơi ẩm.";
        if (tempChunkData.windLevel > 8) finalDescription += " Một cơn gió mạnh rít qua bên tai bạn.";
        if (tempChunkData.temperature < 3) finalDescription += " Một cái lạnh buốt thấu xương.";
        if (tempChunkData.dangerLevel > 8) finalDescription += " Bạn có cảm giác bất an ở nơi này.";
        if (tempChunkData.humanPresence > 5) finalDescription += " Dường như có dấu vết của người khác ở đây.";
        if (spawnedEnemy) finalDescription += ` Bạn cảm thấy sự hiện diện của một ${spawnedEnemy.type} nguy hiểm gần đây.`;

        const actions = [];
        if (spawnedEnemy) {
            actions.push({ id: 1, text: `Quan sát ${spawnedEnemy.type}` });
        } else if (spawnedNPCs.length > 0) {
            actions.push({ id: 1, text: `Nói chuyện với ${spawnedNPCs[0]}` });
        }
        actions.push({ id: 2, text: 'Khám phá khu vực' });
        if (spawnedItems.length > 0) {
             actions.push({ id: 3, text: `Nhặt ${spawnedItems[0].name}` });
        }

        newWorld[posKey] = {
            ...tempChunkData,
            NPCs: spawnedNPCs,
            items: spawnedItems,
            enemy: spawnedEnemy,
            description: finalDescription,
            actions: actions,
        };
    }
    return { newWorld, newRegions, newRegionCounter };
};
