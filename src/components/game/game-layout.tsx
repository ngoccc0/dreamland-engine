"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Minimap } from "@/components/game/minimap";
import { Controls } from "@/components/game/controls";
import { StatusPopup } from "@/components/game/status-popup";
import { InventoryPopup } from "@/components/game/inventory-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Shield, Cpu } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorldConcept } from "@/ai/flows/generate-world-setup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/language-context";

// Import AI flow
import { generateNarrative, type GenerateNarrativeInput } from "@/ai/flows/generate-narrative-flow";

// Import modularized game engine components
import { generateRegion, getValidAdjacentTerrains, weightedRandom } from '@/lib/game/engine';
import { worldConfig } from '@/lib/game/config';
import type { World, PlayerStatus, NarrativeEntry, MapCell, Chunk, Season, Terrain, WorldProfile, Region } from '@/lib/game/types';


interface GameLayoutProps {
    worldSetup: WorldConcept;
}

export default function GameLayout({ worldSetup }: GameLayoutProps) {
    const { t, language } = useLanguage();
    
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
    
    // --- State for AI vs. Rule-based mode ---
    const [isOnlineMode, setIsOnlineMode] = useState(false);


    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => [...prev, { id: narrativeIdCounter.current++, text, type }]);
    }, []);
    
    // --- Component Effects and Handlers ---
    
    useEffect(() => {
        // Initialize the game world
        addNarrativeEntry(worldSetup.initialNarrative, 'narrative');
        const startPos = { x: 0, y: 0 };
        const startingTerrain = worldSetup.startingBiome as Terrain;
        
        // Generate the very first region of the game.
        const { newWorld, newRegions, newRegionCounter } = generateRegion(
            startPos, 
            startingTerrain, 
            {}, 
            {}, 
            0,
            worldProfile,
            currentSeason
        );
        
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

    const ensureChunkExists = useCallback((pos: {x: number, y: number}, currentWorld: World) => {
        const newPosKey = `${pos.x},${pos.y}`;
        if (currentWorld[newPosKey]) {
            return { ...currentWorld }; // Return a copy
        }
    
        const validTerrains = getValidAdjacentTerrains(pos, currentWorld);
        const terrainProbs = validTerrains.map(t => [t, worldConfig[t].spreadWeight] as [Terrain, number]);
        const newTerrain = weightedRandom(terrainProbs);
        
        const result = generateRegion(
            pos, 
            newTerrain, 
            currentWorld, 
            regions, 
            regionCounter,
            worldProfile,
            currentSeason
        );
        
        setRegions(result.newRegions);
        setRegionCounter(result.newRegionCounter);
        return result.newWorld;
    }, [regionCounter, regions, worldProfile, currentSeason]);


    const handleOnlineNarrative = useCallback(async (action: string, fullWorldState: World) => {
        setIsLoading(true);
        const currentChunk = fullWorldState[`${playerPosition.x},${playerPosition.y}`];
        if (!currentChunk) {
            setIsLoading(false);
            return;
        }

        try {
            const input: GenerateNarrativeInput = {
                worldName: worldSetup.worldName,
                playerAction: action,
                playerStatus: playerStats,
                // Pass only the necessary fields to the AI
                currentChunk: {
                    x: currentChunk.x,
                    y: currentChunk.y,
                    terrain: currentChunk.terrain,
                    description: currentChunk.description,
                    NPCs: currentChunk.NPCs,
                    items: currentChunk.items,
                    explored: currentChunk.explored,
                    enemy: currentChunk.enemy,
                    vegetationDensity: currentChunk.vegetationDensity,
                    moisture: currentChunk.moisture,
                    elevation: currentChunk.elevation,
                    lightLevel: currentChunk.lightLevel,
                    dangerLevel: currentChunk.dangerLevel,
                    magicAffinity: currentChunk.magicAffinity,
                    humanPresence: currentChunk.humanPresence,
                    predatorPresence: currentChunk.predatorPresence,
                },
                recentNarrative: narrativeLog.slice(-5).map(e => e.text),
                language,
            };

            const result = await generateNarrative(input);
            addNarrativeEntry(result.narrative, 'narrative');
            if(result.systemMessage) {
                addNarrativeEntry(result.systemMessage, 'system');
            }

            // Apply updates from AI
            if (result.updatedChunk) {
                setWorld(prev => {
                    const newWorld = { ...prev };
                    const key = `${currentChunk.x},${currentChunk.y}`;
                    newWorld[key] = { ...newWorld[key], ...result.updatedChunk };
                    return newWorld;
                });
            }
            if (result.updatedPlayerStatus) {
                setPlayerStats(prev => ({ ...prev, ...result.updatedPlayerStatus }));
            }

        } catch (error) {
            console.error("AI narrative generation failed:", error);
            toast({ title: t('error'), description: "AI storyteller failed. Switched to offline mode.", variant: "destructive" });
            setIsOnlineMode(false); // Fallback to offline mode
        } finally {
            setIsLoading(false);
        }
    }, [playerStats, playerPosition, worldSetup.worldName, narrativeLog, language, toast, t, addNarrativeEntry]);
    
    const handleMove = (direction: "north" | "south" | "east" | "west") => {
        let newPos = { ...playerPosition };
        let dirKey: 'directionNorth' | 'directionSouth' | 'directionEast' | 'directionWest' = 'directionNorth';
        if (direction === 'north') { newPos.y++; dirKey = 'directionNorth'; }
        else if (direction === 'south') { newPos.y--; dirKey = 'directionSouth'; }
        else if (direction === 'east') { newPos.x++; dirKey = 'directionEast'; }
        else if (direction === 'west') { newPos.x--; dirKey = 'directionWest'; }

        addNarrativeEntry(t('wentDirection', { direction: t(dirKey) }), 'action');

        const worldWithChunk = ensureChunkExists(newPos, world);
        const newWorld = { ...worldWithChunk };
        const newPosKey = `${newPos.x},${newPos.y}`;
        newWorld[newPosKey] = { ...newWorld[newPosKey], explored: true };

        setWorld(newWorld);
        setPlayerPosition(newPos);

        if (isOnlineMode) {
            handleOnlineNarrative(`move ${direction}`, newWorld);
        } else {
            addNarrativeEntry(newWorld[newPosKey].description, 'narrative');
        }
    };

    const handleAction = (actionId: number) => {
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!chunk) return;
    
        const actionText = chunk.actions.find(a => a.id === actionId)?.text || "unknown action";
        addNarrativeEntry(actionText, 'action');

        if (isOnlineMode) {
            handleOnlineNarrative(actionText, world);
            return;
        }
        
        // --- OFFLINE LOGIC ---
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
            const newChunk = {...chunk, items: chunk.items.slice(1)};
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

        const actionText = `Attack ${currentChunk.enemy.type}`;
        addNarrativeEntry(actionText, 'action');

        if (isOnlineMode) {
            handleOnlineNarrative(actionText, world);
            return;
        }

        // --- OFFLINE LOGIC ---
        const updatedEnemy = { ...currentChunk.enemy };
        const playerDamage = 20; 
        const enemyDamage = updatedEnemy.damage || 10;

        updatedEnemy.hp -= playerDamage;
        addNarrativeEntry(t('attackEnemy', { enemyType: updatedEnemy.type, playerDamage }), 'narrative');

        let updatedChunk: Chunk;

        if (updatedEnemy.hp <= 0) {
            addNarrativeEntry(t('enemyDefeated', { enemyType: updatedEnemy.type }), 'system');
            updatedChunk = { ...currentChunk, enemy: null };
            updatedChunk.actions = updatedChunk.actions.filter(a => a.id !== 1);
            if (updatedChunk.NPCs.length > 0) {
                updatedChunk.actions.unshift({ id: 1, text: `Nói chuyện với ${updatedChunk.NPCs[0]}` });
            }
        } else {
            addNarrativeEntry(t('enemyHpLeft', { enemyType: updatedEnemy.type, hp: updatedEnemy.hp }), 'narrative');
            setPlayerStats(prev => {
                const newHp = prev.hp - enemyDamage;
                addNarrativeEntry(t('enemyRetaliates', { enemyType: updatedEnemy.type, enemyDamage }), 'narrative');
                if (newHp <= 0) {
                    addNarrativeEntry(t('youFell'), 'system');
                }
                return { ...prev, hp: newHp };
            });
            updatedChunk = { ...currentChunk, enemy: updatedEnemy };
        }
        
        setWorld(prev => ({ ...prev, [key]: updatedChunk }));
    };

    const handleCustomAction = (text: string) => {
        if (!text.trim()) return;
        addNarrativeEntry(text, 'action');
        setInputValue("");
        
        if(isOnlineMode) {
            handleOnlineNarrative(text, world);
            return;
        }

        // --- OFFLINE LOGIC ---
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

                if (chunk && chunk.explored) { 
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
                                    <Cpu className="h-4 w-4 animate-pulse" />
                                    <p>AI is thinking...</p>
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
                        <div className="flex items-center justify-center space-x-3 mt-4 p-2 bg-black/10 rounded-md">
                            <Label htmlFor="ai-mode" className="text-sm font-medium cursor-pointer text-foreground/80">{t('aiStoryteller')}</Label>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Switch id="ai-mode" checked={isOnlineMode} onCheckedChange={setIsOnlineMode} disabled={isLoading}/>
                                </TooltipTrigger>
                                <TooltipContent align="center" side="bottom">
                                    <p className="max-w-[250px] text-sm text-muted-foreground">{t('aiStorytellerDesc')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
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
                                        <Button variant="secondary" className="w-full justify-center" onClick={() => handleAction(action.id)} disabled={isLoading}>
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
