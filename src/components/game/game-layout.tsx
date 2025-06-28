
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

// --- ENTITY SPAWNING LOGIC ---
// Helper type for defining spawn conditions for an entity
type SpawnConditions = {
    chance?: number;
    vegetationDensity?: { min?: number, max?: number };
    moisture?: { min?: number, max?: number };
    elevation?: { min?: number, max?: number };
    dangerLevel?: { min?: number, max?: number };
    magicAffinity?: { min?: number, max?: number };
    humanPresence?: { min?: number, max?: number };
    predatorPresence?: { min?: number, max?: number };
    lightLevel?: { min?: number, max?: number };
    temperature?: { min?: number, max?: number };
    soilType?: SoilType[];
};

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


// --- CONTENT TEMPLATES & ENTITY CATALOG ---
// This object provides the "content" (descriptions, NPCs, items, enemies) for each chunk.
const templates: Record<Terrain, any> = {
    forest: {
        descriptionTemplates: [
            'Bạn đang ở trong một khu rừng [adjective]. Những cây [feature] cao vút che khuất ánh mặt trời.',
            'Một khu rừng [adjective] bao quanh bạn. Tiếng lá xào xạc dưới chân khi bạn di chuyển giữa những cây [feature].',
        ],
        adjectives: ['rậm rạp', 'u ám', 'cổ xưa', 'yên tĩnh', 'ma mị'],
        features: ['sồi', 'thông', 'dương xỉ', 'nấm phát quang', 'dây leo chằng chịt'],
        NPCs: [
            { data: 'thợ săn bí ẩn', conditions: { humanPresence: { min: 2 }, chance: 0.1 } },
            { data: 'linh hồn cây', conditions: { magicAffinity: { min: 6 }, chance: 0.05 } },
            { data: 'ẩn sĩ', conditions: { humanPresence: { min: 1, max: 3 }, chance: 0.05 } },
        ],
        items: [
            { data: { name: 'Quả Mọng Ăn Được', description: 'Một loại quả mọng đỏ, có vẻ ngon miệng và an toàn.' }, conditions: { dangerLevel: { max: 4 }, chance: 0.3 } },
            { data: { name: 'Nấm Độc', description: 'Một loại nấm có màu sắc sặc sỡ, tốt nhất không nên ăn.' }, conditions: { dangerLevel: { min: 5 }, moisture: { min: 6 }, chance: 0.25 } },
            { data: { name: 'Thảo Dược Chữa Lành', description: 'Một loại lá cây có mùi thơm dễ chịu, có khả năng chữa lành vết thương nhỏ.' }, conditions: { vegetationDensity: { min: 8 }, chance: 0.2 } },
            { data: { name: 'Cành Cây Chắc Chắn', description: 'Một cành cây thẳng và cứng, có thể dùng làm vũ khí tạm thời.' }, conditions: { chance: 0.4 } },
            { data: { name: 'Mũi Tên Cũ', description: 'Một mũi tên có vẻ đã được sử dụng, cắm trên một thân cây.' }, conditions: { humanPresence: { min: 2 }, chance: 0.1 } },
            { data: { name: 'Hoa Tinh Linh', description: 'Một bông hoa phát ra ánh sáng xanh lam yếu ớt, tỏa ra năng lượng phép thuật.' }, conditions: { magicAffinity: { min: 7 }, chance: 0.1 } },
        ],
        enemies: [
            { data: { type: 'Sói', hp: 30, damage: 10 }, conditions: { predatorPresence: { min: 5 }, chance: 0.4 } },
            { data: { type: 'Nhện khổng lồ', hp: 40, damage: 15 }, conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Heo Rừng', hp: 50, damage: 8 }, conditions: { predatorPresence: { min: 4 }, chance: 0.3 } },
            { data: { type: 'Yêu Tinh Rừng (Goblin)', hp: 25, damage: 8 }, conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.25 } },
            { data: { type: 'Gấu', hp: 80, damage: 20 }, conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 }, chance: 0.1 } },
        ],
    },
    grassland: {
        descriptionTemplates: [
            'Một đồng cỏ [adjective] trải dài đến tận chân trời. Những ngọn đồi [feature] nhấp nhô nhẹ nhàng.',
            'Bạn đang đứng giữa một thảo nguyên [adjective]. Gió thổi qua làm những ngọn cỏ [feature] lay động như sóng.',
        ],
        adjectives: ['xanh mướt', 'bạt ngàn', 'khô cằn', 'lộng gió'],
        features: ['hoa dại', 'cỏ cao', 'đá tảng', 'lối mòn'],
        NPCs: [
            { data: 'người du mục', conditions: { humanPresence: { min: 4 }, chance: 0.15 } },
            { data: 'nông dân', conditions: { humanPresence: { min: 5 }, soilType: ['loamy'], chance: 0.2 } },
            { data: 'đàn ngựa hoang', conditions: { predatorPresence: { max: 4 }, vegetationDensity: { min: 3 }, chance: 0.1 } },
        ],
        items: [
            { data: { name: 'Hoa Dại', description: 'Một bông hoa đẹp, có thể có giá trị với một nhà thảo dược học.' }, conditions: { vegetationDensity: { min: 3 }, chance: 0.4 } },
            { data: { name: 'Lúa Mì', description: 'Một bó lúa mì chín vàng, có thể dùng làm thức ăn.' }, conditions: { soilType: ['loamy'], moisture: { min: 3, max: 6 }, chance: 0.2 } },
            { data: { name: 'Lông Chim Ưng', description: 'Một chiếc lông vũ sắc bén từ một loài chim săn mồi.' }, conditions: { predatorPresence: { min: 3 }, chance: 0.15 } },
            { data: { name: 'Đá Lửa', description: 'Hai hòn đá lửa, có thể dùng để nhóm lửa.' }, conditions: { chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Thỏ hoang hung dữ', hp: 20, damage: 5 }, conditions: { dangerLevel: { min: 2, max: 5 }, chance: 0.3 } },
            { data: { type: 'Cáo gian xảo', hp: 25, damage: 8 }, conditions: { predatorPresence: { min: 3 }, chance: 0.25 } },
            { data: { type: 'Bầy châu chấu', hp: 35, damage: 5 }, conditions: { temperature: { min: 7 }, moisture: { max: 3 }, chance: 0.15 } },
            { data: { type: 'Linh cẩu', hp: 40, damage: 12 }, conditions: { predatorPresence: { min: 5 }, chance: 0.2 } },
        ],
    },
    desert: {
        descriptionTemplates: [
            'Cát, cát và cát. Một sa mạc [adjective] bao la. Những [feature] là cảnh tượng duy nhất phá vỡ sự đơn điệu.',
            'Cái nóng của sa mạc [adjective] thật khắc nghiệt. Bạn thấy một [feature] ở phía xa, có thể là ảo ảnh.',
        ],
        adjectives: ['nóng bỏng', 'khô cằn', 'vô tận', 'lặng im'],
        features: ['cồn cát', 'ốc đảo', 'xương rồng khổng lồ', 'bộ xương cũ'],
        NPCs: [
            { data: 'thương nhân lạc đà', conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
            { data: 'nhà thám hiểm lạc lối', conditions: { humanPresence: { min: 1, max: 2 }, dangerLevel: { min: 6 }, chance: 0.05 } },
        ],
        items: [
            { data: { name: 'Bình Nước Cũ', description: 'Một bình nước quý giá, gần như còn đầy.' }, conditions: { humanPresence: { min: 1 }, chance: 0.15 } },
            { data: { name: 'Mảnh Gốm Cổ', description: 'Một mảnh gốm vỡ có hoa văn kỳ lạ, có thể là của một nền văn minh đã mất.' }, conditions: { chance: 0.1 } },
            { data: { name: 'Hoa Xương Rồng', description: 'Một bông hoa hiếm hoi nở trên sa mạc, có thể chứa nước.' }, conditions: { vegetationDensity: { min: 1 }, chance: 0.2 } },
            { data: { name: 'Xương Động Vật', description: 'Một bộ xương lớn bị tẩy trắng bởi ánh mặt trời.' }, conditions: { chance: 0.3 } },
        ],
        enemies: [
            { data: { type: 'Rắn đuôi chuông', hp: 30, damage: 15 }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Bọ cạp khổng lồ', hp: 50, damage: 10 }, conditions: { dangerLevel: { min: 7 }, chance: 0.35 } },
            { data: { type: 'Kền kền', hp: 25, damage: 8 }, conditions: { predatorPresence: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Linh hồn cát', hp: 60, damage: 12 }, conditions: { magicAffinity: { min: 5 }, windLevel: { min: 6 }, chance: 0.1 } },
        ],
    },
    swamp: {
        descriptionTemplates: [
            'Bạn đang lội qua một đầm lầy [adjective]. Nước bùn [feature] ngập đến đầu gối.',
            'Không khí đặc quánh mùi cây cỏ mục rữa. Những cây [feature] mọc lên từ làn nước tù đọng.',
        ],
        adjectives: ['hôi thối', 'âm u', 'chết chóc', 'sương giăng'],
        features: ['đước', 'dây leo', 'khí độc', 'bong bóng bùn'],
        NPCs: [
            { data: 'ẩn sĩ', conditions: { humanPresence: { min: 1, max: 2 }, magicAffinity: { min: 5 }, chance: 0.05 } },
            { data: 'thợ săn cá sấu', conditions: { humanPresence: { min: 2 }, predatorPresence: { min: 8 }, chance: 0.1 } },
        ],
        items: [
            { data: { name: 'Rễ Cây Hiếm', description: 'Một loại rễ cây chỉ mọc ở vùng nước độc, có giá trị cao trong giả kim thuật.' }, conditions: { magicAffinity: { min: 6 }, chance: 0.15 } },
            { data: { name: 'Rêu Phát Sáng', description: 'Một loại rêu có thể dùng để đánh dấu đường đi hoặc làm thuốc.' }, conditions: { lightLevel: { max: 3 }, chance: 0.3 } },
            { data: { name: 'Trứng Bò Sát', description: 'Một ổ trứng lạ, có lớp vỏ dai và dày.' }, conditions: { predatorPresence: { min: 7 }, chance: 0.2 } },
            { data: { name: 'Nấm Đầm Lầy', description: 'Một loại nấm ăn được nhưng có vị hơi tanh.' }, conditions: { moisture: { min: 9 }, chance: 0.25 } },
        ],
        enemies: [
            { data: { type: 'Đỉa khổng lồ', hp: 40, damage: 5 }, conditions: { moisture: { min: 9 }, chance: 0.4 } },
            { data: { type: 'Ma trơi', hp: 25, damage: 20 }, conditions: { magicAffinity: { min: 7 }, lightLevel: { max: 2 }, chance: 0.2 } },
            { data: { type: 'Cá sấu', hp: 70, damage: 25 }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 8 }, chance: 0.25 } },
            { data: { type: 'Muỗi khổng lồ', hp: 15, damage: 5 }, conditions: { chance: 0.5 } },
        ],
    },
    mountain: {
        descriptionTemplates: [
            'Bạn đang leo lên một sườn núi [adjective]. Gió [feature] thổi mạnh và lạnh buốt.',
            'Con đường mòn [feature] cheo leo dẫn lên đỉnh núi. Không khí loãng dần.',
        ],
        adjectives: ['hiểm trở', 'lộng gió', 'hùng vĩ', 'tuyết phủ'],
        features: ['vách đá', 'tuyết', 'hang động', 'dòng sông băng'],
        NPCs: [
            { data: 'thợ mỏ già', conditions: { humanPresence: { min: 3 }, elevation: { min: 7 }, chance: 0.15 } },
            { data: 'người cưỡi griffon', conditions: { magicAffinity: { min: 6 }, elevation: { min: 9 }, chance: 0.05 } },
            { data: 'nhà sư khổ hạnh', conditions: { elevation: { min: 8 }, chance: 0.05 } },
        ],
        items: [
            { data: { name: 'Quặng Sắt', description: 'Một mỏm đá chứa quặng sắt có thể rèn thành vũ khí.' }, conditions: { soilType: ['rocky'], chance: 0.25 } },
            { data: { name: 'Lông Đại Bàng', description: 'Một chiếc lông vũ lớn và đẹp, rơi ra từ một sinh vật bay lượn trên đỉnh núi.' }, conditions: { elevation: { min: 8 }, chance: 0.15 } },
            { data: { name: 'Pha Lê Núi', description: 'Một tinh thể trong suốt, lạnh toát khi chạm vào.' }, conditions: { magicAffinity: { min: 5 }, elevation: { min: 7 }, chance: 0.1 } },
            { data: { name: 'Cây Thuốc Núi', description: 'Một loại thảo dược quý hiếm chỉ mọc ở nơi cao.' }, conditions: { vegetationDensity: { min: 2 }, elevation: { min: 6 }, chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Dê núi hung hãn', hp: 50, damage: 15 }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
            { data: { type: 'Người đá (Stone Golem)', hp: 80, damage: 10 }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
            { data: { type: 'Harpie', hp: 45, damage: 18 }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
            { data: { type: 'Báo tuyết', hp: 60, damage: 20 }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
        ],
    },
    cave: {
        descriptionTemplates: [
            'Bên trong hang động tối [adjective] và ẩm ướt. Tiếng bước chân của bạn vang vọng.',
            'Những khối [feature] lấp lánh dưới ánh sáng yếu ớt lọt vào từ bên ngoài.',
        ],
        adjectives: ['sâu thẳm', 'lạnh lẽo', 'bí ẩn', 'chằng chịt'],
        features: ['thạch nhũ', 'tinh thể', 'dòng sông ngầm', 'tranh vẽ cổ'],
        NPCs: [
            { data: 'nhà thám hiểm bị lạc', conditions: { humanPresence: { min: 2, max: 3 }, chance: 0.1 } },
            { data: 'bộ lạc goblin', conditions: { humanPresence: { min: 4 }, dangerLevel: { min: 8 }, chance: 0.2 } },
            { data: 'sinh vật bóng tối', conditions: { lightLevel: { max: 1 }, magicAffinity: { min: 7 }, chance: 0.05 } },
        ],
        items: [
            { data: { name: 'Mảnh Tinh Thể', description: 'Một mảnh tinh thể phát ra ánh sáng yếu ớt, có thể soi đường.' }, conditions: { magicAffinity: { min: 6 }, chance: 0.3 } },
            { data: { name: 'Bản Đồ Cổ', description: 'Một tấm bản đồ da cũ kỹ, có vẻ chỉ đường đến một nơi bí mật trong hang.' }, conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
            { data: { name: 'Xương Cổ', description: 'Một bộ xương của một sinh vật lạ chưa từng thấy.' }, conditions: { dangerLevel: { min: 7 }, chance: 0.2 } },
            { data: { name: 'Mỏ Vàng', description: 'Những vệt vàng lấp lánh trên vách đá.' }, conditions: { elevation: { min: -8 }, chance: 0.05 } },
        ],
        enemies: [
            { data: { type: 'Dơi khổng lồ', hp: 25, damage: 10 }, conditions: { lightLevel: { max: 3 }, chance: 0.5 } },
            { data: { type: 'Nhện hang', hp: 45, damage: 15 }, conditions: { dangerLevel: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Slime', hp: 30, damage: 8 }, conditions: { moisture: { min: 8 }, chance: 0.3 } },
            { data: { type: 'Sâu Bò Khổng Lồ', hp: 100, damage: 20 }, conditions: { dangerLevel: { min: 9 }, chance: 0.15 } },
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
                // Check if the potential new terrain allows the existing neighbor
                if(!config.allowedNeighbors.includes(adj)) {
                    canBePlaced = false;
                    break;
                }
                // Check if the existing neighbor allows the potential new terrain
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
        // If no terrains are perfectly compatible, fall back to a less strict check (optional, but prevents getting stuck)
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

        // Generate the shape of the region first
        const regionCells: { x: number, y: number }[] = [];
        const visited = new Set<string>([`${startPos.x},${startPos.y}`]);
        const generationQueue: {x: number, y: number}[] = [startPos];
        regionCells.push(startPos);

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

        // Helper function to get random value from a range definition
        const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

        // Now, populate each cell in the region with details
        for (const pos of regionCells) {
            const posKey = `${pos.x},${pos.y}`;

            const baseDescriptionTemplate = template.descriptionTemplates[Math.floor(Math.random() * template.descriptionTemplates.length)];
            const adjective = template.adjectives[Math.floor(Math.random() * template.adjectives.length)];
            const feature = template.features[Math.floor(Math.random() * template.features.length)];
            const baseDescription = baseDescriptionTemplate.replace('[adjective]', adjective).replace('[feature]', feature);
            
            // --- Dynamic Chunk Attribute Calculation ---
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
            const lightLevel = clamp(sunExposure, terrain === 'cave' ? 0 : 1, 10); // Caves are dark
            const explorability = clamp(10 - (vegetationDensity / 2) - (dangerLevel / 2), 0, 10);
            const soilType = biomeDef.soilType[Math.floor(Math.random() * biomeDef.soilType.length)];

            // Create the temporary chunk object with the calculated attributes to pass to entity selection
            const tempChunkData = {
                x: pos.x, y: pos.y, terrain, explored: false, regionId,
                travelCost: biomeDef.travelCost, vegetationDensity, moisture: finalMoisture,
                elevation, lightLevel, dangerLevel, magicAffinity, humanPresence, explorability,
                soilType, sunExposure, windLevel, temperature, predatorPresence,
            };

            // --- Rule-based entity spawning ---
            const spawnedNPCs = selectEntities(template.NPCs, tempChunkData, 1);
            const spawnedItems = selectEntities(template.items, tempChunkData, 3); // spawn up to 3 items
            const spawnedEnemy = selectEnemy(template.enemies, tempChunkData);

            // Generate dynamic description based on the new attributes
            let finalDescription = baseDescription;
            if (tempChunkData.moisture > 8) finalDescription += " Không khí đặc quánh hơi ẩm.";
            if (tempChunkData.windLevel > 8) finalDescription += " Một cơn gió mạnh rít qua bên tai bạn.";
            if (tempChunkData.temperature < 3) finalDescription += " Một cái lạnh buốt thấu xương.";
            if (tempChunkData.dangerLevel > 8) finalDescription += " Bạn có cảm giác bất an ở nơi này.";
            if (tempChunkData.humanPresence > 5) finalDescription += " Dường như có dấu vết của người khác ở đây.";
            if (spawnedEnemy) finalDescription += ` Bạn cảm thấy sự hiện diện của một ${spawnedEnemy.type} nguy hiểm gần đây.`;

            // Build actions based on spawned entities
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

            // Add the final chunk to the world
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
        if (newWorld[startKey]) {
            newWorld[startKey].explored = true;
            addNarrativeEntry(newWorld[startKey].description, 'narrative');
        }

        setWorld(newWorld);
        setRegions(newRegions);
        setRegionCounter(newRegionCounter);
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
        } else if (actionId === 1 && chunk.NPCs.length > 0) {
            addNarrativeEntry(t('talkToNpc', { npc: chunk.NPCs[0] }), 'narrative');
            setPlayerStats(prev => {
                const newQuests = [...prev.quests, 'Tìm kho báu'];
                return { ...prev, quests: [...new Set(newQuests)] };
            });
            addNarrativeEntry(t('questUpdated'), "system");
        } else if (actionId === 2) {
            addNarrativeEntry(t('exploreArea'), 'narrative');
        } else if (actionId === 3 && chunk.items.length > 0) {
            const item = chunk.items[0];
            addNarrativeEntry(t('pickupItem', { item: item.name }), 'narrative');
            addNarrativeEntry(`(${item.description})`, 'system');
            setPlayerStats(prev => ({ ...prev, items: [...new Set([...prev.items, item.name])] }));
            // Remove the item from the chunk and update the world state
            const newChunk = {...chunk, items: chunk.items.slice(1)};
            // Rebuild actions for the updated chunk
             newChunk.actions = newChunk.actions.filter(a => a.id !== 3);
             if (newChunk.items.length > 0) {
                 newChunk.actions.push({ id: 3, text: `Nhặt ${newChunk.items[0].name}` });
             }
            setWorld(prev => ({...prev, [`${playerPosition.x},${playerPosition.y}`]: newChunk}));
        }
    }

    const handleAttack = () => {
        const key = `${playerPosition.x},${playerPosition.y}`;
        const currentChunk = world[key];
        if (!currentChunk || !currentChunk.enemy) {
            addNarrativeEntry("Không có gì để tấn công ở đây.", 'system');
            return;
        }

        // --- Prevent state mutation by creating copies ---
        const updatedEnemy = { ...currentChunk.enemy };
        const playerDamage = 20; // Example damage
        const enemyDamage = updatedEnemy.damage || 10;

        // Player attacks enemy
        updatedEnemy.hp -= playerDamage;
        addNarrativeEntry(t('attackEnemy', { enemyType: updatedEnemy.type, playerDamage }), 'action');

        let updatedChunk: Chunk;

        if (updatedEnemy.hp <= 0) {
            // Enemy is defeated
            addNarrativeEntry(t('enemyDefeated', { enemyType: updatedEnemy.type }), 'system');
            
            // Create a new chunk state without the enemy
            updatedChunk = { ...currentChunk, enemy: null };
            
            // Rebuild actions for the new chunk state
            updatedChunk.actions = updatedChunk.actions.filter(a => a.id !== 1); // Remove "Observe" action
            if (updatedChunk.NPCs.length > 0) {
                updatedChunk.actions.unshift({ id: 1, text: `Nói chuyện với ${updatedChunk.NPCs[0]}` });
            }
        } else {
            // Enemy survives and retaliates
            addNarrativeEntry(t('enemyHpLeft', { enemyType: updatedEnemy.type, hp: updatedEnemy.hp }), 'narrative');
            
            // Player takes damage
            setPlayerStats(prev => {
                const newHp = prev.hp - enemyDamage;
                addNarrativeEntry(t('enemyRetaliates', { enemyType: updatedEnemy.type, enemyDamage }), 'narrative');
                if (newHp <= 0) {
                    addNarrativeEntry(t('youFell'), 'system');
                    // TODO: Implement game over logic
                }
                return { ...prev, hp: newHp };
            });

            // Create a new chunk state with the updated enemy HP
            updatedChunk = { ...currentChunk, enemy: updatedEnemy };
        }
        
        // --- Commit the updated chunk state to the world ---
        setWorld(prev => ({ ...prev, [key]: updatedChunk }));
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
            setPlayerStats(prev => ({...prev, items: [...new Set([...prev.items, 'cỏ khô'])]}));
            addNarrativeEntry('Bạn đã thêm cỏ khô vào túi đồ.', 'system');
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

                if (chunk && chunk.explored) { // Only show explored chunks
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

                    <main className="flex-grow p-4 md:p-6 overflow-y-auto">
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
                <aside className="w-full md:w-[30%] bg-card border-l p-4 md:p-6 flex flex-col gap-6">
                    <div className="flex-shrink-0">
                        <Minimap grid={generateMapGrid()} />
                    </div>
                    
                    <div className="flex-shrink-0 grid grid-cols-2 gap-2">
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

                    <div className="flex-shrink-0">
                        <Controls onMove={handleMove} onAttack={handleAttack} />
                    </div>
                    
                    <Separator className="flex-shrink-0" />
                    
                    <div className="space-y-4 flex-grow flex flex-col">
                        <h2 className="font-headline text-lg font-semibold text-center text-foreground/80 flex-shrink-0">{t('availableActions')}</h2>
                        <div className="space-y-2 overflow-y-auto flex-grow">
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
                        <div className="flex flex-col gap-2 mt-4 flex-shrink-0">
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
                </aside>
                
                <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} quests={playerStats.quests} />
                <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={playerStats.items} />
            </div>
        </TooltipProvider>
    );
}

    