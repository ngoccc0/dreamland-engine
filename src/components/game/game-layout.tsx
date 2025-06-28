
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
type Terrain = "forest" | "grassland" | "desert";

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
}

interface World {
    [key: string]: Chunk;
}

interface PlayerStatus {
    hp: number;
    mana: number;
    items: string[];
    quests: string[];
}

interface Region {
    terrain: Terrain;
    cells: { x: number; y: number }[];
}


// --- WORLD CONFIGURATION ---
// This object acts as the "rulebook" for the procedural world generation.
// It defines the properties and constraints for each type of terrain (biome).
const worldConfig = {
    terrainTypes: {
        // Defines rules for the 'forest' biome.
        forest: { 
            minSize: 5,     // A forest region will have at least 5 chunks.
            maxSize: 10,    // A forest region will have at most 10 chunks.
            probability: 0.5, // Likelihood of this biome being chosen.
            adjacent: ['grassland'] as Terrain[] // A forest can only be next to a grassland.
        },
        // Defines rules for the 'grassland' biome.
        grassland: { 
            minSize: 2, 
            maxSize: 4, 
            probability: 0.4, 
            adjacent: ['forest', 'desert'] as Terrain[] // Grassland acts as a buffer between forests and deserts.
        },
        // Defines rules for the 'desert' biome.
        desert: { 
            minSize: 2, 
            maxSize: 5, 
            probability: 0.1, 
            adjacent: ['grassland'] as Terrain[] // A desert can only be next to a grassland.
        }
    }
};


// --- CONTENT TEMPLATES ---
// This object provides the "content" for each chunk based on its terrain type.
// While `worldConfig` defines the structure, `templates` defines what you see and interact with.
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
    // based on the `adjacent` rules in `worldConfig`. This ensures the world map is logical.
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
            return Object.keys(worldConfig.terrainTypes) as Terrain[];
        }
    
        const validTerrains: Terrain[] = [];
        for (const terrain in worldConfig.terrainTypes) {
            const terrainKey = terrain as Terrain;
            const adjacentRules = worldConfig.terrainTypes[terrainKey].adjacent;
            let canBePlaced = true;
            for(const adj of adjacentTerrains) {
                if(!adjacentRules.includes(adj)) {
                    canBePlaced = false;
                    break;
                }
            }
            if (canBePlaced) {
                validTerrains.push(terrainKey);
            }
        }
        return validTerrains.length ? validTerrains : Object.keys(worldConfig.terrainTypes) as Terrain[];
    }, []);

    // This is the core "factory" function for building a new region of the world.
    const generateRegion = useCallback((startPos: { x: number; y: number }, terrain: Terrain, currentWorld: World, currentRegions: { [id: number]: Region }, currentRegionCounter: number) => {
        const newWorld = { ...currentWorld };
        const newRegions = { ...currentRegions };
        let newRegionCounter = currentRegionCounter;

        const template = templates[terrain]; // Get the content template
        const config = worldConfig.terrainTypes[terrain]; // Get the rules
        
        // 1. Determine the size of the new region randomly based on min/max size rules.
        const size = Math.floor(Math.random() * (config.maxSize - config.minSize + 1)) + config.minSize;
        
        // 2. Use a queue-based algorithm (like Breadth-First Search) to create a connected cluster of cells ("chunks").
        const cells: { x: number, y: number }[] = [{ x: startPos.x, y: startPos.y }];
        const queue: { x: number, y: number }[] = [{ x: startPos.x, y: startPos.y }];
        const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];

        while (cells.length < size && queue.length > 0) {
            const current = queue.shift()!;
            for (const dir of directions.sort(() => Math.random() - 0.5)) {
                if (cells.length >= size) break;
                const newPos = { x: current.x + dir.x, y: current.y + dir.y };
                const newPosKey = `${newPos.x},${newPos.y}`;
                // Only add a new cell if it doesn't already exist.
                if (!newWorld[newPosKey] && !cells.some(c => c.x === newPos.x && c.y === newPos.y)) {
                    cells.push(newPos);
                    queue.push(newPos);
                }
            }
        }

        const regionId = newRegionCounter++;
        newRegions[regionId] = { terrain, cells };

        // 3. For each cell in the newly created region, fill it with content using the `templates`.
        for (const pos of cells) {
            const posKey = `${pos.x},${pos.y}`;

            // Randomly pick description, adjectives, features, NPCs, items, and enemies.
            const descriptionTemplate = template.descriptionTemplates[Math.floor(Math.random() * template.descriptionTemplates.length)];
            const adjective = template.adjectives[Math.floor(Math.random() * template.adjectives.length)];
            const feature = template.features[Math.floor(Math.random() * template.features.length)];
            const description = descriptionTemplate.replace('[adjective]', adjective).replace('[feature]', feature);
            
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
            
            // Create the final chunk object and add it to the world.
            newWorld[posKey] = {
                x: pos.x, y: pos.y,
                terrain,
                description,
                NPCs: [npc],
                items: [item],
                explored: false,
                enemy: enemy,
                actions: [
                    { id: 1, text: enemy ? `Quan sát ${enemy.type}` : `Nói chuyện với ${npc}` },
                    { id: 2, text: 'Khám phá khu vực' },
                    { id: 3, text: `Nhặt ${item.name}` }
                ],
                regionId
            };
        }
        return { newWorld, newRegions, newRegionCounter };
    }, []);

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
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

                // If the player moves to a chunk that doesn't exist yet...
                if (!newWorld[newPosKey]) {
                    // ...determine which biomes can be placed there...
                    const validTerrains = getValidAdjacentTerrains(newPos, currentWorld);
                    // ...create a weighted list of those biomes...
                    const terrainProbs = validTerrains.map(t => [t, worldConfig.terrainTypes[t].probability] as [Terrain, number]);
                    // ...randomly pick one...
                    const newTerrain = weightedRandom(terrainProbs);
                    
                    // ...and generate a whole new region of that type.
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

    

    