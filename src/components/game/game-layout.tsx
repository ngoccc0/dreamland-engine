"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Minimap, type MapCell } from "@/components/game/minimap";
import { Controls } from "@/components/game/controls";
import { StatusPopup } from "@/components/game/status-popup";
import { InventoryPopup } from "@/components/game/inventory-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenerateWorldSetupOutput } from "@/ai/flows/generate-world-setup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- START OF GAME ENGINE LOGIC ---

type Terrain = "forest" | "grassland" | "desert";

interface Chunk {
    x: number;
    y: number;
    terrain: Terrain;
    description: string;
    NPCs: string[];
    items: string[];
    explored: boolean;
    enemy: { type: string; hp: number } | null;
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

const worldConfig = {
    terrainTypes: {
        forest: { minSize: 5, maxSize: 10, probability: 0.5, adjacent: ['grassland'] as Terrain[] },
        grassland: { minSize: 2, maxSize: 4, probability: 0.4, adjacent: ['forest', 'desert'] as Terrain[] },
        desert: { minSize: 2, maxSize: 5, probability: 0.1, adjacent: ['grassland'] as Terrain[] }
    }
};

const templates: Record<Terrain, any> = {
    forest: {
        image: 'forest',
        descriptionTemplate: 'Bạn đứng trong một [adjective] rừng [feature], trải rộng khắp vùng.',
        NPCs: ['thợ săn', 'sói'],
        items: ['kiếm rỉ', 'thảo dược'],
        adjectives: ['rậm rạp', 'u ám'],
        features: ['sồi cổ thụ', 'thông cao'],
        enemy: { type: 'sói', hp: 50 }
    },
    grassland: {
        image: 'grassland',
        descriptionTemplate: 'Bạn đứng trên một [adjective] đồng cỏ [feature], nối rừng và sa mạc.',
        NPCs: ['nông dân', 'thỏ hoang'],
        items: ['lúa mì', 'cỏ khô'],
        adjectives: ['xanh mướt', 'bạt ngàn'],
        features: ['thảo nguyên', 'đồi cỏ'],
        enemy: { type: 'thỏ hoang', hp: 20 }
    },
    desert: {
        image: 'desert',
        descriptionTemplate: 'Bạn đứng trong một [adjective] sa mạc [feature], trải dài vô tận.',
        NPCs: ['thương nhân', 'rắn độc'],
        items: ['nước'],
        adjectives: ['nóng bỏng', 'khô cằn'],
        features: ['cồn cát', 'ốc đảo'],
        enemy: { type: 'rắn độc', hp: 30 }
    }
};

type NarrativeEntry = {
    id: number;
    text: string;
    type: 'narrative' | 'action' | 'system';
}

// --- END OF GAME ENGINE LOGIC ---

interface GameLayoutProps {
    worldSetup: GenerateWorldSetupOutput;
}

export default function GameLayout({ worldSetup }: GameLayoutProps) {
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
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>([
      { id: 0, text: worldSetup.initialNarrative, type: 'narrative' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const narrativeIdCounter = useRef(1);

    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => [...prev, { id: narrativeIdCounter.current++, text, type }]);
    }, []);

    // --- Game Engine Functions adapted for React State ---

    const weightedRandom = (options: [Terrain, number][]): Terrain => {
        const total = options.reduce((sum, [, prob]) => sum + prob, 0);
        const r = Math.random() * total;
        let current = 0;
        for (const [option, prob] of options) {
            current += prob;
            if (r <= current) return option;
        }
        return options[0][0];
    }
    
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

    const generateRegion = useCallback((startPos: { x: number; y: number }, terrain: Terrain, currentWorld: World, currentRegions: { [id: number]: Region }, currentRegionCounter: number) => {
        const newWorld = { ...currentWorld };
        const newRegions = { ...currentRegions };
        let newRegionCounter = currentRegionCounter;

        const template = templates[terrain];
        const config = worldConfig.terrainTypes[terrain];
        const size = Math.floor(Math.random() * (config.maxSize - config.minSize + 1)) + config.minSize;
        
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

        for (const pos of cells) {
            const posKey = `${pos.x},${pos.y}`;
            const npc = template.NPCs[Math.floor(Math.random() * template.NPCs.length)];
            const item = template.items[Math.floor(Math.random() * template.items.length)];
            const isEnemy = ['sói', 'rắn độc', 'thỏ hoang'].includes(npc);

            newWorld[posKey] = {
                x: pos.x, y: pos.y,
                terrain,
                description: template.descriptionTemplate.replace('[adjective]', template.adjectives[Math.floor(Math.random() * template.adjectives.length)])
                    .replace('[feature]', template.features[Math.floor(Math.random() * template.features.length)]),
                NPCs: [npc],
                items: [item],
                explored: false,
                enemy: isEnemy ? { ...template.enemy } : null,
                actions: [
                    { id: 1, text: isEnemy ? `Quan sát ${npc}` : `Nói chuyện với ${npc}` },
                    { id: 2, text: 'Khám phá khu vực' },
                    { id: 3, text: `Nhặt ${item}` }
                ],
                regionId
            };
        }
        return { newWorld, newRegions, newRegionCounter };
    }, []);

    // --- Component Effects and Handlers ---
    
    useEffect(() => {
        // Initialize the game world
        const startPos = { x: 0, y: 0 };
        const startingTerrain = worldSetup.startingBiome as Terrain;
        const { newWorld, newRegions, newRegionCounter } = generateRegion(startPos, startingTerrain, {}, {}, 0);
        
        const startKey = `${startPos.x},${startPos.y}`;
        newWorld[startKey].explored = true;

        setWorld(newWorld);
        setRegions(newRegions);
        setRegionCounter(newRegionCounter);
        addNarrativeEntry(newWorld[startKey].description, 'narrative');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [worldSetup.startingBiome, generateRegion]); // Only run on init

    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [narrativeLog]);
    
    const handleMove = (direction: "north" | "south" | "east" | "west") => {
        setPlayerPosition(currentPosition => {
            let newPos = { ...currentPosition };
            if (direction === 'north') newPos.y++;
            else if (direction === 'south') newPos.y--;
            else if (direction === 'east') newPos.x++;
            else if (direction === 'west') newPos.x--;

            setWorld(currentWorld => {
                let newWorld = { ...currentWorld };
                const newPosKey = `${newPos.x},${newPos.y}`;

                if (!newWorld[newPosKey]) {
                    const validTerrains = getValidAdjacentTerrains(newPos, currentWorld);
                    const terrainProbs = validTerrains.map(t => [t, worldConfig.terrainTypes[t].probability] as [Terrain, number]);
                    const newTerrain = weightedRandom(terrainProbs);
                    
                    const result = generateRegion(newPos, newTerrain, currentWorld, regions, regionCounter);
                    newWorld = result.newWorld;
                    setRegions(result.newRegions);
                    setRegionCounter(result.newRegionCounter);
                }
                
                newWorld[newPosKey] = { ...newWorld[newPosKey], explored: true };
                addNarrativeEntry(`Bạn đi về phía ${direction}.`, 'action');
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
            addNarrativeEntry(`Bạn quan sát ${chunk.NPCs[0]}. Nó trông hung dữ!`, 'narrative');
        } else if (actionId === 1) {
            addNarrativeEntry(`Bạn nói chuyện với ${chunk.NPCs[0]}. Họ kể về một kho báu gần đây.`, 'narrative');
            setPlayerStats(prev => {
                const newQuests = [...prev.quests, 'Tìm kho báu'];
                return { ...prev, quests: [...new Set(newQuests)] };
            });
            addNarrativeEntry("Nhiệm vụ đã được cập nhật.", "system");
        } else if (actionId === 2) {
            addNarrativeEntry('Bạn khám phá khu vực, thấy một dấu vết lạ.', 'narrative');
        } else if (actionId === 3) {
            const item = chunk.items[0];
            addNarrativeEntry(`Bạn nhặt được ${item}!`, 'narrative');
            setPlayerStats(prev => ({ ...prev, items: [...prev.items, item] }));
        }
    }

    const handleAttack = () => {
        const key = `${playerPosition.x},${playerPosition.y}`;
        let chunk = world[key];
        if (!chunk || !chunk.enemy) return;

        const enemy = chunk.enemy;
        const playerDamage = 20;
        const enemyDamage = 10;
        
        enemy.hp -= playerDamage;
        addNarrativeEntry(`Bạn tấn công ${enemy.type}, gây ${playerDamage} sát thương.`, 'action');
    
        if (enemy.hp <= 0) {
            addNarrativeEntry(`Bạn đã hạ gục ${enemy.type}!`, 'system');
            setWorld(prev => ({ ...prev, [key]: { ...prev[key], enemy: null } }));
        } else {
            addNarrativeEntry(`${enemy.type} còn ${enemy.hp} HP.`, 'narrative');
            setPlayerStats(prev => {
                const newHp = prev.hp - enemyDamage;
                addNarrativeEntry(`${enemy.type} phản đòn, bạn mất ${enemyDamage} HP.`, 'narrative');
                if (newHp <= 0) {
                    addNarrativeEntry('Bạn đã ngã xuống!', 'system');
                    // Game over logic could go here
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
        const terrain = chunk.terrain;
        
        const responses: Record<string, string> = {
            'kiểm tra cây': terrain === 'forest' ? 'Bạn kiểm tra cây, tìm thấy một quả táo!' : 'Chỉ có cát hoặc cỏ ở đây!',
            'đào đất': terrain === 'desert' ? 'Bạn đào đất, thấy một đồng xu!' : 'Đất cứng hoặc cỏ quá, không đào được!',
            'gặt cỏ': terrain === 'grassland' ? 'Bạn gặt cỏ, thu được cỏ khô!' : 'Không có cỏ để gặt!',
            'nhìn xung quanh': 'Bạn nhìn quanh, thấy một con đường mờ mịt.'
        };

        const response = responses[text.toLowerCase()] || 'Hành động không được nhận diện. Thử lại!';
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
                        hasPlayer: false, // will be set later
                    };
                }
            }
        }
        
        const center = radius;
        grid[center][center].hasPlayer = true;
        
        return grid;
    }, [world, playerPosition]);
    
    const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];

    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row h-dvh bg-background text-foreground font-body">
                {/* Left Panel: Narrative */}
                <div className="w-full md:w-[70%] h-full flex flex-col">
                    <header className="p-4 border-b">
                        <h1 className="text-2xl font-bold font-headline">{worldSetup.worldName}</h1>
                    </header>

                    <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
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
                    </ScrollArea>
                </div>

                {/* Right Panel: Controls & Actions */}
                <div className="w-full md:w-[30%] bg-card border-l flex flex-col p-4 md:p-6 gap-6 overflow-y-auto">
                    <Minimap grid={generateMapGrid()} />
                    
                    <div className="grid grid-cols-2 gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => setStatusOpen(true)} className="w-full justify-center">
                                    <Shield className="h-4 w-4 md:mr-2"/>
                                    <span className="hidden md:inline">Trạng thái</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Xem máu, năng lượng và nhiệm vụ.</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => setInventoryOpen(true)} className="w-full justify-center">
                                    <BookOpen className="h-4 w-4 md:mr-2"/>
                                    <span className="hidden md:inline">Túi đồ</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Kiểm tra các vật phẩm bạn đang mang.</p></TooltipContent>
                        </Tooltip>
                    </div>

                    <Controls onMove={handleMove} onAttack={handleAttack} />
                    
                    <Separator />
                    
                    <div className="space-y-4 flex-grow flex flex-col">
                        <h2 className="font-headline text-lg font-semibold text-center text-foreground/80">Hành động có sẵn</h2>
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
                        <div className="flex flex-col gap-2 mt-auto">
                            <Input 
                                placeholder="Hành động tùy chỉnh..." 
                                className="flex-grow"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomAction(inputValue)}
                                disabled={isLoading}
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" onClick={() => handleCustomAction(inputValue)} disabled={isLoading}>Gửi</Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Gửi hành động tùy chỉnh của bạn.</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>
                
                <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} quests={playerStats.quests} />
                <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={playerStats.items} />
            </div>
        </TooltipProvider>
    );
}
