
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Minimap, type MapCell } from "@/components/game/minimap";
import { Controls } from "@/components/game/controls";
import { StatusPopup } from "@/components/game/status-popup";
import { InventoryPopup } from "@/components/game/inventory-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorldConcept } from "@/ai/flows/generate-world-setup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";

// --- START OF GAME ENGINE LOGIC ---

// --- Data Types and Interfaces ---
type Terrain = "forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave";
type SoilType = 'loamy' | 'clay' | 'sandy' | 'rocky';

// 1. WorldProfile: Global settings for the world, affecting all biomes.
interface WorldProfile {
    climateBase: 'temperate' | 'arid' | 'tropical';
    magicLevel: number; // 0-10, how magical the world is
    mutationFactor: number; // 0-10, chance for strange things to happen
    sunIntensity: number; // 0-10, base sunlight level
    weatherTypesAllowed: ('clear' | 'rain' | 'fog' | 'snow')[];
    moistureBias: number; // -5 to +5, global moisture offset
    tempBias: number; // -5 to +5, global temperature offset
}

// 2. Season: Global modifiers based on the time of year.
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface SeasonModifiers {
    temperatureMod: number;
    moistureMod: number;
    sunExposureMod: number;
    windMod: number;
    eventChance: number; // Base chance for seasonal events
}

const seasonConfig: Record<Season, SeasonModifiers> = {
    spring: { temperatureMod: 0, moistureMod: 2, sunExposureMod: 1, windMod: 1, eventChance: 0.3 },
    summer: { temperatureMod: 3, moistureMod: -1, sunExposureMod: 3, windMod: 0, eventChance: 0.1 },
    autumn: { temperatureMod: -1, moistureMod: 1, sunExposureMod: -1, windMod: 2, eventChance: 0.4 },
    winter: { temperatureMod: -4, moistureMod: -2, sunExposureMod: -3, windMod: 3, eventChance: 0.2 },
};

// This represents the detailed properties of a single tile/chunk in the world.
interface Chunk {
    x: number;
    y: number;
    terrain: Terrain;
    description: string;
    NPCs: string[];
    items: { name: string; description: string }[];
    explored: boolean;
    enemy: { type: string; hp: number; damage: number } | null;
    actions: { id: number; text: string }[];
    regionId: number;

    // --- Detailed Tile Attributes ---
    travelCost: number;          // How many turns/energy it costs to cross this tile.
    vegetationDensity: number;   // 0-10, density of plants, affects visibility.
    moisture: number;            // 0-10, affects fungi, swamps, slipperiness.
    elevation: number;           // 0-10, height, creates slopes, hills.
    lightLevel: number;          // 0-10, affects visibility, enemy spawning.
    dangerLevel: number;         // 0-10, probability of traps, enemies.
    magicAffinity: number;       // 0-10, presence of magical energy.
    humanPresence: number;       // 0-10, signs of human activity (camps, ruins).
    explorability: number;       // 0-10, ease of exploration.
    soilType: SoilType;          // Type of ground, affects what can grow.
    sunExposure: number;         // 0-10, how much direct sunlight the tile gets.
    windLevel: number;           // 0-10, strength of the wind.
    temperature: number;         // 0-10, ambient temperature.
    predatorPresence: number;    // 0-10, likelihood of predator encounters.
}

// Represents the entire game world as a collection of chunks.
interface World {
    [key: string]: Chunk;
}

// Represents the player's current status.
interface PlayerStatus {
    hp: number;
    mana: number;
    items: string[];
    quests: string[];
}

// Represents a contiguous region of a single biome.
interface Region {
    terrain: Terrain;
    cells: { x: number; y: number }[];
}


// --- WORLD CONFIGURATION (BIOME DEFINITIONS) ---
// This object acts as the "rulebook" for the procedural world generation.
// It defines the physical properties, constraints, and valid value ranges for each biome.
interface BiomeDefinition {
    minSize: number;
    maxSize: number;
    travelCost: number;
    spreadWeight: number;
    allowedNeighbors: Terrain[];
    // Defines the valid range for each attribute in this biome
    defaultValueRanges: {
        vegetationDensity: { min: number; max: number };
        moisture: { min: number; max: number };
        elevation: { min: number; max: number };
        dangerLevel: { min: number; max: number };
        magicAffinity: { min: number; max: number };
        humanPresence: { min: number; max: number };
        predatorPresence: { min: number; max: number };
    };
    soilType: SoilType[]; // Can now have multiple valid soil types
}


const worldConfig: Record<Terrain, BiomeDefinition> = {
    forest: {
        minSize: 5, maxSize: 10, travelCost: 4, spreadWeight: 0.6,
        allowedNeighbors: ['grassland', 'mountain', 'swamp'],
        defaultValueRanges: {
            vegetationDensity: { min: 7, max: 10 }, moisture: { min: 5, max: 8 }, elevation: { min: 1, max: 4 },
            dangerLevel: { min: 4, max: 7 }, magicAffinity: { min: 3, max: 6 }, humanPresence: { min: 0, max: 3 },
            predatorPresence: { min: 5, max: 8 },
        },
        soilType: ['loamy'],
    },
    grassland: {
        minSize: 8, maxSize: 15, travelCost: 1, spreadWeight: 0.8,
        allowedNeighbors: ['forest', 'desert', 'swamp'],
        defaultValueRanges: {
            vegetationDensity: { min: 2, max: 5 }, moisture: { min: 2, max: 5 }, elevation: { min: 0, max: 2 },
            dangerLevel: { min: 1, max: 4 }, magicAffinity: { min: 0, max: 2 }, humanPresence: { min: 2, max: 6 },
            predatorPresence: { min: 2, max: 5 },
        },
        soilType: ['loamy', 'sandy'],
    },
    desert: {
        minSize: 6, maxSize: 12, travelCost: 3, spreadWeight: 0.4,
        allowedNeighbors: ['grassland', 'mountain'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 1 }, moisture: { min: 0, max: 1 }, elevation: { min: 0, max: 3 },
            dangerLevel: { min: 5, max: 8 }, magicAffinity: { min: 1, max: 4 }, humanPresence: { min: 0, max: 2 },
            predatorPresence: { min: 6, max: 9 },
        },
        soilType: ['sandy'],
    },
    swamp: {
        minSize: 4, maxSize: 8, travelCost: 5, spreadWeight: 0.2,
        allowedNeighbors: ['forest', 'grassland'],
        defaultValueRanges: {
            vegetationDensity: { min: 5, max: 8 }, moisture: { min: 8, max: 10 }, elevation: { min: 0, max: 1 },
            dangerLevel: { min: 7, max: 10 }, magicAffinity: { min: 4, max: 7 }, humanPresence: { min: 0, max: 1 },
            predatorPresence: { min: 7, max: 10 },
        },
        soilType: ['clay'],
    },
    mountain: {
        minSize: 3, maxSize: 7, travelCost: 6, spreadWeight: 0.1,
        allowedNeighbors: ['forest', 'desert'],
        defaultValueRanges: {
            vegetationDensity: { min: 1, max: 4 }, moisture: { min: 2, max: 5 }, elevation: { min: 6, max: 10 },
            dangerLevel: { min: 6, max: 9 }, magicAffinity: { min: 2, max: 5 }, humanPresence: { min: 1, max: 4 },
            predatorPresence: { min: 4, max: 7 },
        },
        soilType: ['rocky'],
    },
    cave: {
        minSize: 10, maxSize: 20, travelCost: 7, spreadWeight: 0.05,
        allowedNeighbors: ['mountain'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 2 }, moisture: { min: 6, max: 9 }, elevation: { min: -10, max: -1 },
            dangerLevel: { min: 8, max: 10 }, magicAffinity: { min: 5, max: 8 }, humanPresence: { min: 0, max: 3 },
            predatorPresence: { min: 8, max: 10 },
        },
        soilType: ['rocky'],
    }
};


// --- CONTENT TEMPLATES ---
// This object provides the "content" (descriptions, NPCs, items, enemies) for each chunk.
// The physical properties are now defined in worldConfig.
const templates: Record<Terrain, any> = {
    forest: {
        descriptionTemplates: [
            'Bạn đang ở trong một khu rừng [adjective]. Những cây [feature] cao vút che khuất ánh mặt trời.',
            'Một khu rừng [adjective] bao quanh bạn. Tiếng lá xào xạc dưới chân khi bạn di chuyển giữa những cây [feature].',
            'Không khí trong khu rừng [feature] này thật ẩm ướt. Cảm giác [adjective] và có phần bí ẩn.',
        ],
        adjectives: ['rậm rạp', 'u ám', 'cổ xưa', 'yên tĩnh'],
        features: ['sồi', 'thông', 'dương xỉ', 'nấm phát quang'],
        NPCs: ['thợ săn bí ẩn', 'linh hồn cây'],
        items: [
            { name: 'Thảo dược', description: 'Một loại cây thuốc có khả năng chữa lành vết thương nhỏ.' },
            { name: 'Nấm phát quang', description: 'Một loại nấm phát ra ánh sáng xanh dịu, có thể dùng để soi đường.' },
            { name: 'Mũi tên cũ', description: 'Một mũi tên có vẻ đã được sử dụng, cắm trên một thân cây.' },
        ],
        enemies: [
            { type: 'Sói', hp: 30, damage: 10, chance: 0.5 },
            { type: 'Nhện khổng lồ', hp: 40, damage: 15, chance: 0.3 },
        ],
    },
    grassland: {
        descriptionTemplates: [
            'Một đồng cỏ [adjective] trải dài đến tận chân trời. Những ngọn đồi [feature] nhấp nhô nhẹ nhàng.',
            'Bạn đang đứng giữa một thảo nguyên [adjective]. Gió thổi qua làm những ngọn cỏ [feature] lay động như sóng.',
            'Đồng cỏ [feature] này thật thanh bình, không khí trong lành và [adjective].',
        ],
        adjectives: ['xanh mướt', 'bạt ngàn', 'khô cằn', 'lộng gió'],
        features: ['hoa dại', 'cỏ cao', 'đá tảng', 'lối mòn'],
        NPCs: ['người du mục', 'nông dân'],
        items: [
            { name: 'Hoa dại', description: 'Một bông hoa đẹp, có thể có giá trị với ai đó.' },
            { name: 'Lúa mì', description: 'Một bó lúa mì chín vàng.' },
        ],
        enemies: [
            { type: 'Thỏ hoang hung dữ', hp: 20, damage: 5, chance: 0.4 },
            { type: 'Cáo gian xảo', hp: 25, damage: 8, chance: 0.2 },
        ],
    },
    desert: {
        descriptionTemplates: [
            'Cát, cát và cát. Một sa mạc [adjective] bao la. Những [feature] là cảnh tượng duy nhất phá vỡ sự đơn điệu.',
            'Cái nóng của sa mạc [adjective] thật khắc nghiệt. Bạn thấy một [feature] ở phía xa, có thể là ảo ảnh.',
            'Bạn đang đi qua một vùng sa mạc [feature], dấu chân của bạn nhanh chóng bị gió xóa đi.',
        ],
        adjectives: ['nóng bỏng', 'khô cằn', 'vô tận', 'lặng im'],
        features: ['cồn cát', 'ốc đảo', 'xương rồng khổng lồ', 'bộ xương cũ'],
        NPCs: ['thương nhân lạc đà', 'nhà thám hiểm'],
        items: [
            { name: 'Bình nước', description: 'Một bình nước quý giá, gần như còn đầy.' },
            { name: 'Mảnh gốm cổ', description: 'Một mảnh gốm vỡ có hoa văn kỳ lạ.' },
        ],
        enemies: [
            { type: 'Rắn đuôi chuông', hp: 30, damage: 15, chance: 0.5 },
            { type: 'Bọ cạp khổng lồ', hp: 50, damage: 10, chance: 0.3 },
        ],
    },
    swamp: {
        descriptionTemplates: [
            'Bạn đang lội qua một đầm lầy [adjective]. Nước bùn [feature] ngập đến đầu gối.',
            'Không khí đặc quánh mùi cây cỏ mục rữa. Những cây [feature] mọc lên từ làn nước tù đọng.',
            'Một sự im lặng [adjective] bao trùm, chỉ thỉnh thoảng bị phá vỡ bởi tiếng côn trùng vo ve.',
        ],
        adjectives: ['hôi thối', 'âm u', 'chết chóc'],
        features: ['đước', 'dây leo', 'khí độc'],
        NPCs: ['ẩn sĩ', 'sinh vật đầm lầy'],
        items: [
            { name: 'Rễ cây hiếm', description: 'Một loại rễ cây chỉ mọc ở vùng nước độc, có giá trị cao.' },
            { name: 'Rêu phát sáng', description: 'Một loại rêu có thể dùng để đánh dấu đường đi.' },
        ],
        enemies: [
            { type: 'Đỉa khổng lồ', hp: 40, damage: 5, chance: 0.6 },
            { type: 'Ma trơi', hp: 25, damage: 20, chance: 0.2 },
        ],
    },
    mountain: {
        descriptionTemplates: [
            'Bạn đang leo lên một sườn núi [adjective]. Gió [feature] thổi mạnh và lạnh buốt.',
            'Con đường mòn [feature] cheo leo dẫn lên đỉnh núi. Không khí loãng dần.',
            'Từ trên cao, bạn có thể nhìn thấy cả một vùng đất rộng lớn. Cảnh tượng thật [adjective].',
        ],
        adjectives: ['hiểm trở', 'lộng gió', 'hùng vĩ'],
        features: ['vách đá', 'tuyết phủ', 'hang động'],
        NPCs: ['thợ mỏ già', 'người cưỡi griffon'],
        items: [
            { name: 'Quặng sắt', description: 'Một mỏm đá chứa quặng sắt có thể rèn thành vũ khí.' },
            { name: 'Lông đại bàng', description: 'Một chiếc lông vũ lớn và đẹp, rơi ra từ một sinh vật bay lượn trên đỉnh núi.' },
        ],
        enemies: [
            { type: 'Dê núi hung hãn', hp: 50, damage: 15, chance: 0.4 },
            { type: 'Người đá (Stone Golem)', hp: 80, damage: 10, chance: 0.2 },
        ],
    },
    cave: {
        descriptionTemplates: [
            'Bên trong hang động tối [adjective] và ẩm ướt. Tiếng bước chân của bạn vang vọng.',
            'Những khối [feature] lấp lánh dưới ánh sáng yếu ớt lọt vào từ bên ngoài.',
            'Bạn cảm thấy một luồng gió [adjective] thổi ra từ một hành lang sâu hơn trong hang.',
        ],
        adjectives: ['sâu thẳm', 'lạnh lẽo', 'bí ẩn'],
        features: ['thạch nhũ', 'tinh thể', 'dòng sông ngầm'],
        NPCs: ['nhà thám hiểm bị lạc', 'bộ lạc goblin'],
        items: [
            { name: 'Mảnh tinh thể', description: 'Một mảnh tinh thể phát ra ánh sáng yếu ớt.' },
            { name: 'Bản đồ cổ', description: 'Một tấm bản đồ da cũ kỹ, có vẻ chỉ đường đến một nơi bí mật.' },
        ],
        enemies: [
            { type: 'Dơi khổng lồ', hp: 25, damage: 10, chance: 0.7 },
            { type: 'Nhện hang', hp: 45, damage: 15, chance: 0.4 },
        ],
    },
};


type NarrativeEntry = {
    id: number;
    text: string;
    type: 'narrative' | 'action' | 'system';
}

// --- END OF GAME ENGINE LOGIC ---

interface GameLayoutProps {
    worldSetup: WorldConcept;
}

export default function GameLayout({ worldSetup }: GameLayoutProps) {
    const { t } = useLanguage();
    
    // --- State for Global World Settings ---
    const [worldProfile, setWorldProfile] = useState<WorldProfile>({
        climateBase: 'temperate',
        magicLevel: 5,
        mutationFactor: 2,
        sunIntensity: 7,
        weatherTypesAllowed: ['clear', 'rain', 'fog'],
        moistureBias: 0,
        tempBias: 0,
    });
    const [currentSeason, setCurrentSeason] = useState<Season>('spring');

    // --- State for Game Progression ---
    const [world, setWorld] = useState<World>({});
    const [regions, setRegions] = useState<{ [id: number]: Region }>({});
    const [regionCounter, setRegionCounter] = useState(0);
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
    const [playerStats, setPlayerStats] = useState<PlayerStatus>({
        hp: 100,
        mana: 50,
        items: worldSetup.playerInventory,
        quests: worldSetup.initialQuests
    });
    
    const [isStatusOpen, setStatusOpen] = useState(false);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>([]);
    const [inputValue, setInputValue] = useState("");
    const { toast } = useToast();
    const narrativeIdCounter = useRef(1);
    const pageEndRef = useRef<HTMLDivElement>(null);

    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => [...prev, { id: narrativeIdCounter.current++, text, type }]);
    }, []);

    // --- Game Engine Functions adapted for React State ---

    // Selects a random terrain type based on weighted probabilities from worldConfig.
    const weightedRandom = (options: [Terrain, number][]): Terrain => {
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
    // based on the `allowedNeighbors` rules in `worldConfig`. This ensures the world map is logical.
    const getValidAdjacentTerrains = useCallback((pos: { x: number; y: number }, currentWorld: World): Terrain[] => {
        const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
        const adjacentTerrains = new Set<Terrain>();
        for (const dir of directions) {
            const neighborKey = `${pos.x + dir.x},${pos.y + dir.y}`;
            if (currentWorld[neighborKey]) {
                adjacentTerrains.add(currentWorld[neighborKey].terrain);
            }
        }
    
        if (adjacentTerrains.size === 0) {
            // If there are no neighbors, any terrain is valid.
            return Object.keys(worldConfig) as Terrain[];
        }
    
        const validTerrains: Terrain[] = [];
        for (const terrain in worldConfig) {
            const terrainKey = terrain as Terrain;
            const config = worldConfig[terrainKey];
            
            let canBePlaced = true;
            for(const adj of adjacentTerrains) {
                if(!config.allowedNeighbors.includes(adj)) {
                    canBePlaced = false;
                    break;
                }
                const neighborConfig = worldConfig[adj];
                 if(!neighborConfig.allowedNeighbors.includes(terrainKey)) {
                    canBePlaced = false;
                    break;
                }
            }

            if (canBePlaced) {
                validTerrains.push(terrainKey);
            }
        }
        return validTerrains.length > 0 ? validTerrains : Object.keys(worldConfig) as Terrain[];
    }, []);

    // This is the core "factory" function for building a new region of the world.
    const generateRegion = useCallback((startPos: { x: number; y: number }, terrain: Terrain, currentWorld: World, currentRegions: { [id: number]: Region }, currentRegionCounter: number) => {
        const newWorld = { ...currentWorld };
        const newRegions = { ...currentRegions };
        let newRegionCounter = currentRegionCounter;

        const template = templates[terrain];
        const biomeDef = worldConfig[terrain];
        
        const size = Math.floor(Math.random() * (biomeDef.maxSize - biomeDef.minSize + 1)) + biomeDef.minSize;
        
        const cells: { x: number, y: number }[] = [{ x: startPos.x, y: startPos.y }];
        const queue: { x: number, y: number }[] = [{ x: startPos.x, y: startPos.y }];
        const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];

        while (cells.length < size && queue.length > 0) {
            const current = queue.shift()!;
            for (const dir of directions.sort(() => Math.random() - 0.5)) {
                if (cells.length >= size) break;
                const newPos = { x: current.x + dir.x, y: current.y + dir.y };
                const newPosKey = `${newPos.x},${newPos.y}`;
                if (!newWorld[newPosKey] && !cells.some(c => c.x === newPos.x && c.y === newPos.y)) {
                    cells.push(newPos);
                    queue.push(newPos);
                }
            }
        }

        const regionId = newRegionCounter++;
        newRegions[regionId] = { terrain, cells };

        // Helper function to get random value from a range definition
        const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

        for (const pos of cells) {
            const posKey = `${pos.x},${pos.y}`;

            const baseDescriptionTemplate = template.descriptionTemplates[Math.floor(Math.random() * template.descriptionTemplates.length)];
            const adjective = template.adjectives[Math.floor(Math.random() * template.adjectives.length)];
            const feature = template.features[Math.floor(Math.random() * template.features.length)];
            const baseDescription = baseDescriptionTemplate.replace('[adjective]', adjective).replace('[feature]', feature);
            
            const npc = template.NPCs[Math.floor(Math.random() * template.NPCs.length)];
            const item = template.items[Math.floor(Math.random() * template.items.length)];
            
            let enemy = null;
            if (template.enemies && template.enemies.length > 0) {
                for (const enemyType of template.enemies) {
                    if (Math.random() < enemyType.chance) {
                        enemy = { ...enemyType };
                        break; 
                    }
                }
            }
            
            // --- NEW: Dynamic Chunk Attribute Calculation ---
            const seasonMods = seasonConfig[currentSeason];
            
            // 1. Get base values from biome definition ranges
            const vegetationDensity = getRandomInRange(biomeDef.defaultValueRanges.vegetationDensity);
            const moisture = getRandomInRange(biomeDef.defaultValueRanges.moisture);
            const elevation = getRandomInRange(biomeDef.defaultValueRanges.elevation);
            const dangerLevel = getRandomInRange(biomeDef.defaultValueRanges.dangerLevel);
            const magicAffinity = getRandomInRange(biomeDef.defaultValueRanges.magicAffinity);
            const humanPresence = getRandomInRange(biomeDef.defaultValueRanges.humanPresence);
            const predatorPresence = getRandomInRange(biomeDef.defaultValueRanges.predatorPresence);
            
            // 2. Derive other values and apply modifiers
            const temperature = clamp(getRandomInRange({min: 4, max: 7}) + seasonMods.temperatureMod + worldProfile.tempBias, 0, 10);
            const finalMoisture = clamp(moisture + seasonMods.moistureMod + worldProfile.moistureBias, 0, 10);
            const windLevel = clamp(getRandomInRange({min: 2, max: 8}) + seasonMods.windMod, 0, 10);
            const sunExposure = clamp(worldProfile.sunIntensity - (vegetationDensity / 2) + seasonMods.sunExposureMod, 0, 10);
            const lightLevel = clamp(sunExposure, 1, 10); // Simple light = sun exposure for now
            const explorability = clamp(10 - (vegetationDensity / 2) - (dangerLevel / 2), 0, 10);
            const soilType = biomeDef.soilType[Math.floor(Math.random() * biomeDef.soilType.length)];

            // Create the chunk object with the calculated attributes
            const newChunk: Omit<Chunk, 'description' | 'actions'> = {
                x: pos.x, y: pos.y, terrain, explored: false, regionId,
                NPCs: [npc], items: [item], enemy,
                travelCost: biomeDef.travelCost,
                vegetationDensity,
                moisture: finalMoisture,
                elevation,
                lightLevel,
                dangerLevel,
                magicAffinity,
                humanPresence,
                explorability,
                soilType,
                sunExposure,
                windLevel,
                temperature,
                predatorPresence,
            };

            // Generate dynamic description based on the new attributes
            let finalDescription = baseDescription;
            if (newChunk.moisture > 8) finalDescription += " Không khí đặc quánh hơi ẩm.";
            if (newChunk.windLevel > 8) finalDescription += " Một cơn gió mạnh rít qua bên tai bạn.";
            if (newChunk.temperature < 3) finalDescription += " Một cái lạnh buốt thấu xương.";
            if (newChunk.dangerLevel > 8) finalDescription += " Bạn có cảm giác bất an ở nơi này.";
            if (newChunk.humanPresence > 5) finalDescription += " Dường như có dấu vết của người khác ở đây.";

            // Add the final chunk to the world
            newWorld[posKey] = {
                ...newChunk,
                description: finalDescription,
                actions: [
                    { id: 1, text: enemy ? `Quan sát ${enemy.type}` : `Nói chuyện với ${npc}` },
                    { id: 2, text: 'Khám phá khu vực' },
                    { id: 3, text: `Nhặt ${item.name}` }
                ],
            };
        }
        return { newWorld, newRegions, newRegionCounter };
    }, [currentSeason, worldProfile]);

    // --- Component Effects and Handlers ---
    
    useEffect(() => {
        // Initialize the game world
        addNarrativeEntry(worldSetup.initialNarrative, 'narrative');
        const startPos = { x: 0, y: 0 };
        const startingTerrain = worldSetup.startingBiome as Terrain;
        
        // Generate the very first region of the game.
        const { newWorld, newRegions, newRegionCounter } = generateRegion(startPos, startingTerrain, {}, {}, 0);
        
        const startKey = `${startPos.x},${startPos.y}`;
        newWorld[startKey].explored = true;

        setWorld(newWorld);
        setRegions(newRegions);
        setRegionCounter(newRegionCounter);
        addNarrativeEntry(newWorld[startKey].description, 'narrative');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [worldSetup]); // Only run on init

    useEffect(() => {
        // Scroll to the bottom of the page to show the latest narrative entry
        pageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [narrativeLog]);
    
    const handleMove = (direction: "north" | "south" | "east" | "west") => {
        setPlayerPosition(currentPosition => {
            let newPos = { ...currentPosition };
            let dirKey: 'directionNorth' | 'directionSouth' | 'directionEast' | 'directionWest' = 'directionNorth';
            if (direction === 'north') { newPos.y++; dirKey = 'directionNorth'; }
            else if (direction === 'south') { newPos.y--; dirKey = 'directionSouth'; }
            else if (direction === 'east') { newPos.x++; dirKey = 'directionEast'; }
            else if (direction === 'west') { newPos.x--; dirKey = 'directionWest'; }

            setWorld(currentWorld => {
                let newWorld = { ...currentWorld };
                const newPosKey = `${newPos.x},${newPos.y}`;

                if (!newWorld[newPosKey]) {
                    const validTerrains = getValidAdjacentTerrains(newPos, currentWorld);
                    const terrainProbs = validTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
                    const newTerrain = weightedRandom(terrainProbs);
                    
                    const result = generateRegion(newPos, newTerrain, currentWorld, regions, regionCounter);
                    newWorld = result.newWorld;
                    setRegions(result.newRegions);
                    setRegionCounter(result.newRegionCounter);
                }
                
                newWorld[newPosKey] = { ...newWorld[newPosKey], explored: true };
                addNarrativeEntry(t('wentDirection', { direction: t(dirKey) }), 'action');
                addNarrativeEntry(newWorld[newPosKey].description, 'narrative');
                return newWorld;
            });
            return newPos;
        });
    };

    const handleAction = (actionId: number) => {
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!chunk) return;
    
        if (actionId === 1 && chunk.enemy) {
            addNarrativeEntry(t('observeEnemy', { npc: chunk.enemy.type }), 'narrative');
        } else if (actionId === 1) {
            addNarrativeEntry(t('talkToNpc', { npc: chunk.NPCs[0] }), 'narrative');
            setPlayerStats(prev => {
                const newQuests = [...prev.quests, 'Tìm kho báu'];
                return { ...prev, quests: [...new Set(newQuests)] };
            });
            addNarrativeEntry(t('questUpdated'), "system");
        } else if (actionId === 2) {
            addNarrativeEntry(t('exploreArea'), 'narrative');
        } else if (actionId === 3) {
            const item = chunk.items[0];
            addNarrativeEntry(t('pickupItem', { item: item.name }), 'narrative');
            addNarrativeEntry(`(${item.description})`, 'system');
            setPlayerStats(prev => ({ ...prev, items: [...new Set([...prev.items, item.name])] }));
        }
    }

    const handleAttack = () => {
        const key = `${playerPosition.x},${playerPosition.y}`;
        let chunk = world[key];
        if (!chunk || !chunk.enemy) return;

        const enemy = chunk.enemy;
        const playerDamage = 20;
        const enemyDamage = enemy.damage || 10;
        
        enemy.hp -= playerDamage;
        addNarrativeEntry(t('attackEnemy', { enemyType: enemy.type, playerDamage }), 'action');
    
        if (enemy.hp <= 0) {
            addNarrativeEntry(t('enemyDefeated', { enemyType: enemy.type }), 'system');
            setWorld(prev => ({ ...prev, [key]: { ...prev[key], enemy: null } }));
        } else {
            addNarrativeEntry(t('enemyHpLeft', { enemyType: enemy.type, hp: enemy.hp }), 'narrative');
            setPlayerStats(prev => {
                const newHp = prev.hp - enemyDamage;
                addNarrativeEntry(t('enemyRetaliates', { enemyType: enemy.type, enemyDamage }), 'narrative');
                if (newHp <= 0) {
                    addNarrativeEntry(t('youFell'), 'system');
                }
                return { ...prev, hp: newHp };
            });
        }
    };

    const handleCustomAction = (text: string) => {
        if (!text.trim()) return;
        addNarrativeEntry(text, 'action');
        setInputValue("");
        
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!chunk) return;
        const terrain = chunk.terrain;
        
        const responses: Record<string, () => string> = {
            'kiểm tra cây': () => terrain === 'forest' ? t('customActionResponses.checkTree') : t('customActionResponses.noTree'),
            'đào đất': () => terrain === 'desert' ? t('customActionResponses.dig') : t('customActionResponses.groundTooHard'),
            'gặt cỏ': () => terrain === 'grassland' ? t('customActionResponses.reapGrass') : t('customActionResponses.noGrass'),
            'nhìn xung quanh': () => t('customActionResponses.lookAround')
        };

        const responseFunc = responses[text.toLowerCase()];
        const response = responseFunc ? responseFunc() : t('customActionResponses.actionFailed');
        addNarrativeEntry(response, 'narrative');
        
        if (text.toLowerCase() === 'gặt cỏ' && terrain === 'grassland') {
            setPlayerStats(prev => ({...prev, items: [...prev.items, 'cỏ khô']}));
        }
    }

    const generateMapGrid = useCallback((): MapCell[][] => {
        const radius = 2;
        const size = radius * 2 + 1;
        const grid: MapCell[][] = Array(size).fill(null).map(() => 
            Array(size).fill({ biome: 'empty', hasEnemy: false, hasPlayer: false })
        );

        for (let gy = 0; gy < size; gy++) {
            for (let gx = 0; gx < size; gx++) {
                const wx = playerPosition.x - radius + gx;
                const wy = playerPosition.y + radius - gy;
                const chunkKey = `${wx},${wy}`;
                const chunk = world[chunkKey];

                if (chunk) {
                    grid[gy][gx] = {
                        biome: chunk.terrain,
                        hasEnemy: !!chunk.enemy,
                        hasPlayer: false,
                    };
                }
            }
        }
        
        const center = radius;
        if(grid[center]?.[center]) {
            grid[center][center].hasPlayer = true;
        }
        
        return grid;
    }, [world, playerPosition]);
    
    const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];

    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row min-h-dvh bg-background text-foreground font-body">
                {/* Left Panel: Narrative */}
                <div className="w-full md:w-[70%] flex flex-col">
                    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                        <h1 className="text-2xl font-bold font-headline">{worldSetup.worldName}</h1>
                    </header>

                    <main className="flex-grow p-4 md:p-6">
                        <div className="prose prose-stone dark:prose-invert max-w-none">
                            {narrativeLog.map((entry) => (
                                <p key={entry.id} className={`animate-in fade-in duration-500 ${entry.type === 'action' ? 'italic text-accent-foreground/80' : ''} ${entry.type === 'system' ? 'font-semibold text-accent' : ''}`}>
                                    {entry.text}
                                </p>
                            ))}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground italic mt-4">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <p>Thinking...</p>
                                </div>
                            )}
                        </div>
                         <div ref={pageEndRef} />
                    </main>
                </div>

                {/* Right Panel: Controls & Actions */}
                <aside className="w-full md:w-[30%] bg-card border-l p-4 md:p-6 md:sticky md:top-0 md:h-dvh md:overflow-y-auto">
                    <div className="flex flex-col gap-6">
                        <Minimap grid={generateMapGrid()} />
                        
                        <div className="grid grid-cols-2 gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={() => setStatusOpen(true)} className="w-full justify-center">
                                        <Shield className="h-4 w-4 md:mr-2"/>
                                        <span className="hidden md:inline">{t('status')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('statusTooltip')}</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={() => setInventoryOpen(true)} className="w-full justify-center">
                                        <BookOpen className="h-4 w-4 md:mr-2"/>
                                        <span className="hidden md:inline">{t('inventory')}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('inventoryTooltip')}</p></TooltipContent>
                            </Tooltip>
                        </div>

                        <Controls onMove={handleMove} onAttack={handleAttack} />
                        
                        <Separator />
                        
                        <div className="space-y-4">
                            <h2 className="font-headline text-lg font-semibold text-center text-foreground/80">{t('availableActions')}</h2>
                            <div className="space-y-2">
                                {currentChunk?.actions.map(action => (
                                    <Tooltip key={action.id}>
                                        <TooltipTrigger asChild>
                                            <Button variant="secondary" className="w-full justify-center" onClick={() => handleAction(action.id)}>
                                                {action.text}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{action.text}</p></TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Input 
                                    placeholder={t('customActionPlaceholder')}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCustomAction(inputValue)}
                                    disabled={isLoading}
                                />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="accent" onClick={() => handleCustomAction(inputValue)} disabled={isLoading}>{t('submit')}</Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('submitTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </aside>
                
                <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} quests={playerStats.quests} />
                <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={playerStats.items} />
            </div>
        </TooltipProvider>
    );
}
