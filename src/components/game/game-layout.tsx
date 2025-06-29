"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Minimap } from "@/components/game/minimap";
import { StatusPopup } from "@/components/game/status-popup";
import { InventoryPopup } from "@/components/game/inventory-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Backpack, Shield, Cpu, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import type { WorldConcept } from "@/ai/flows/generate-world-setup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import { SwordIcon } from "@/components/game/icons";

// Import AI flow
import { generateNarrative, type GenerateNarrativeInput } from "@/ai/flows/generate-narrative-flow";

// Import modularized game engine components
import { generateRegion, getValidAdjacentTerrains, weightedRandom } from '@/lib/game/engine';
import { worldConfig } from '@/lib/game/config';
import type { World, PlayerStatus, NarrativeEntry, MapCell, Chunk, Season, WorldProfile, Region, GameState, Terrain } from '@/lib/game/types';


interface GameLayoutProps {
    worldSetup?: WorldConcept;
    initialGameState?: GameState;
}

export default function GameLayout({ worldSetup, initialGameState }: GameLayoutProps) {
    const { t, language } = useLanguage();
    
    // --- State for Global World Settings ---
    const [worldProfile, setWorldProfile] = useState<WorldProfile>(
        initialGameState?.worldProfile || {
            climateBase: 'temperate',
            magicLevel: 5,
            mutationFactor: 2,
            sunIntensity: 7,
            weatherTypesAllowed: ['clear', 'rain', 'fog'],
            moistureBias: 0,
            tempBias: 0,
        }
    );
    const [currentSeason, setCurrentSeason] = useState<Season>(initialGameState?.currentSeason || 'spring');

    // --- State for Game Progression ---
    const [world, setWorld] = useState<World>(initialGameState?.world || {});
    const [regions, setRegions] = useState<{ [id: number]: Region }>(initialGameState?.regions || {});
    const [regionCounter, setRegionCounter] = useState<number>(initialGameState?.regionCounter || 0);
    const [playerPosition, setPlayerPosition] = useState(initialGameState?.playerPosition || { x: 0, y: 0 });
    const [playerStats, setPlayerStats] = useState<PlayerStatus>(
        initialGameState?.playerStats || {
            hp: 100,
            mana: 50,
            stamina: 100,
            items: worldSetup?.playerInventory || [],
            quests: worldSetup?.initialQuests || [],
            attributes: {
                physicalAttack: 10,
                magicalAttack: 5,
                critChance: 5,
                attackSpeed: 1.0,
                cooldownReduction: 0,
            }
        }
    );
    
    const [isStatusOpen, setStatusOpen] = useState(false);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [narrativeLog, setNarrativeLog] = useState<NarrativeEntry[]>(initialGameState?.narrativeLog || []);
    const [inputValue, setInputValue] = useState("");
    const { toast } = useToast();
    const narrativeIdCounter = useRef(1);
    const pageEndRef = useRef<HTMLDivElement>(null);
    const desktopButtonSize = "h-[60px] w-[60px]";
    
    // --- State for AI vs. Rule-based mode ---
    const [isOnline, setIsOnline] = useState(true);

    const finalWorldSetup = worldSetup || initialGameState?.worldSetup;

    // Effect for handling online/offline status
    useEffect(() => {
        if (typeof window === 'undefined' || !navigator) return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => {
            setIsOnline(false);
            toast({
                title: t('offlineModeActive'),
                description: t('offlineToastDesc'),
            });
        };

        // Set initial status
        setIsOnline(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [t, toast]);


    const addNarrativeEntry = useCallback((text: string, type: NarrativeEntry['type']) => {
        setNarrativeLog(prev => {
            const newEntry = { id: narrativeIdCounter.current, text, type };
            narrativeIdCounter.current++;
            return [...prev, newEntry];
        });
    }, []);
    
    // --- Component Effects and Handlers ---
    
    // Initial setup effect
    useEffect(() => {
        // If we are loading a game, the state is already initialized.
        // We just need to set the narrative counter correctly.
        if (initialGameState) {
            if (narrativeLog.length > 0) {
                narrativeIdCounter.current = Math.max(...narrativeLog.map(e => e.id)) + 1;
            }
            return;
        };

        // This part only runs for a NEW game
        if (worldSetup) {
            addNarrativeEntry(worldSetup.initialNarrative, 'narrative');
            const startPos = { x: 0, y: 0 };
            const startingTerrain = worldSetup.startingBiome as Terrain;
            
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
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [worldSetup, initialGameState]); // This effect should only run once on initialization

    // Game state saving effect
    useEffect(() => {
        // Don't save if the world hasn't been generated yet
        if (Object.keys(world).length === 0 || !finalWorldSetup) return;

        const gameState: GameState = {
            worldProfile,
            currentSeason,
            world,
            regions,
            regionCounter,
            playerPosition,
            playerStats,
            narrativeLog,
            worldSetup: finalWorldSetup
        };

        try {
            localStorage.setItem('gameState', JSON.stringify(gameState));
        } catch (error) {
            console.error("Failed to save game state:", error);
            // Optionally, inform the user that saving has failed
        }
    }, [
        worldProfile,
        currentSeason,
        world,
        regions,
        regionCounter,
        playerPosition,
        playerStats,
        narrativeLog,
        finalWorldSetup
    ]);


    useEffect(() => {
        // Scroll to the bottom of the page to show the latest narrative entry
        pageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [narrativeLog]);

    const ensureChunkExists = useCallback((pos: {x: number, y: number}, currentWorld: World) => {
        const newPosKey = `${pos.x},${pos.y}`;
        if (currentWorld[newPosKey]) {
            return { worldWithChunk: { ...currentWorld }, chunk: currentWorld[newPosKey] };
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
        return { worldWithChunk: result.newWorld, chunk: result.newWorld[newPosKey] };
    }, [regionCounter, regions, worldProfile, currentSeason]);


    const handleOnlineNarrative = async (action: string, worldCtx: World, playerPosCtx: {x: number, y: number}, playerStatsCtx: PlayerStatus) => {
        setIsLoading(true);
        const currentChunk = worldCtx[`${playerPosCtx.x},${playerPosCtx.y}`];
        if (!currentChunk || !finalWorldSetup) {
            setIsLoading(false);
            return;
        }

        try {
            const input: GenerateNarrativeInput = {
                worldName: finalWorldSetup.worldName,
                playerAction: action,
                playerStatus: playerStatsCtx,
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
            setWorld(prevWorld => {
                const updatedWorld = { ...prevWorld };
                const key = `${currentChunk.x},${currentChunk.y}`;
                if (result.updatedChunk) {
                    updatedWorld[key] = { ...updatedWorld[key], ...result.updatedChunk };
                }
                return updatedWorld;
            });

            if (result.updatedPlayerStatus) {
                setPlayerStats(prev => ({ ...prev, ...result.updatedPlayerStatus }));
            }

        } catch (error) {
            console.error("AI narrative generation failed:", error);
            toast({ title: t('offlineModeActive'), description: t('offlineToastDesc'), variant: "destructive" });
            setIsOnline(false); // Fallback to offline mode
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleMove = (direction: "north" | "south" | "east" | "west") => {
        let newPos = { ...playerPosition };
        let dirKey: 'directionNorth' | 'directionSouth' | 'directionEast' | 'directionWest' = 'directionNorth';
        if (direction === 'north') { newPos.y++; dirKey = 'directionNorth'; }
        else if (direction === 'south') { newPos.y--; dirKey = 'directionSouth'; }
        else if (direction === 'east') { newPos.x++; dirKey = 'directionEast'; }
        else if (direction === 'west') { newPos.x--; dirKey = 'directionWest'; }

        const { worldWithChunk, chunk: destinationChunk } = ensureChunkExists(newPos, world);
        
        if (!destinationChunk) {
            // This should not happen if ensureChunkExists works correctly
            console.error("Error: Could not find or generate destination chunk.");
            return;
        }

        const travelCost = destinationChunk.travelCost;
        if (playerStats.stamina < travelCost) {
            toast({
                title: "Quá mệt!",
                description: "Bạn không đủ thể lực để di chuyển tới vùng đất này. Hãy nghỉ ngơi.",
                variant: "destructive",
            });
            return;
        }

        const newStamina = playerStats.stamina - travelCost;
        const newPlayerStats = { ...playerStats, stamina: newStamina };
        
        const newWorld = { ...worldWithChunk };
        const newPosKey = `${newPos.x},${newPos.y}`;
        
        if (newWorld[newPosKey]) {
            newWorld[newPosKey] = { ...newWorld[newPosKey], explored: true };
        }

        addNarrativeEntry(t('wentDirection', { direction: t(dirKey) }), 'action');
        setWorld(newWorld);
        setPlayerPosition(newPos);
        setPlayerStats(newPlayerStats);

        if (isOnline) {
            handleOnlineNarrative(`move ${direction}`, newWorld, newPos, newPlayerStats);
        } else {
            if (newWorld[newPosKey]) {
                addNarrativeEntry(newWorld[newPosKey].description, 'narrative');
            }
        }
    };

    const handleAction = (actionId: number) => {
        const chunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!chunk) return;
    
        const actionText = chunk.actions.find(a => a.id === actionId)?.text || "unknown action";
        addNarrativeEntry(actionText, 'action');

        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, playerStats);
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

        if (isOnline) {
            handleOnlineNarrative(actionText, world, playerPosition, playerStats);
            return;
        }

        // --- OFFLINE LOGIC ---
        let updatedWorld = { ...world };
        let updatedChunk = { ...updatedWorld[key] };
        
        if (!updatedChunk.enemy) return; // Should not happen but for type safety

        const updatedEnemy = { ...updatedChunk.enemy };
        const playerDamage = playerStats.attributes.physicalAttack; 
        const enemyDamage = updatedEnemy.damage || 10;

        updatedEnemy.hp -= playerDamage;
        addNarrativeEntry(t('attackEnemy', { enemyType: updatedEnemy.type, playerDamage }), 'narrative');

        if (updatedEnemy.hp <= 0) {
            addNarrativeEntry(t('enemyDefeated', { enemyType: updatedEnemy.type }), 'system');
            updatedChunk = { ...updatedChunk, enemy: null };
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
            updatedChunk = { ...updatedChunk, enemy: updatedEnemy };
        }
        
        updatedWorld[key] = updatedChunk;
        setWorld(updatedWorld);
    };

    const handleCustomAction = (text: string) => {
        if (!text.trim()) return;
        addNarrativeEntry(text, 'action');
        setInputValue("");
        
        if(isOnline) {
            handleOnlineNarrative(text, world, playerPosition, playerStats);
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

    if (!finalWorldSetup) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background">
                <p className="text-foreground text-destructive">Error: Game data is missing or corrupted.</p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row min-h-dvh bg-background text-foreground font-body">
                {/* Left Panel: Narrative */}
                <div className="w-full md:w-[70%] flex flex-col">
                    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                        <h1 className="text-2xl font-bold font-headline">{finalWorldSetup.worldName}</h1>
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
                                    <p>{isOnline ? "AI is thinking..." : "Loading..."}</p>
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
                    
                    {/* UNIFIED CONTROLS SECTION */}
                    <div className="flex flex-col items-center gap-4 w-full">
                        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('moveAndAttack')}</h3>
                        
                        {/* Mobile Layout */}
                        <div className="md:hidden w-full flex flex-col items-center space-y-2">
                            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                                <Button variant="outline" onClick={() => setStatusOpen(true)} className="w-full justify-center">
                                    <Shield className="mr-2"/> <span>{t('status')}</span>
                                </Button>
                                <Button variant="outline" onClick={() => setInventoryOpen(true)} className="w-full justify-center">
                                    <Backpack className="mr-2"/> <span>{t('inventory')}</span>
                                </Button>
                            </div>
                            <Button variant="accent" className="w-full max-w-xs justify-center" onClick={() => handleMove("north")}>
                                <ArrowUp className="mr-2" /> {t('moveUp')}
                            </Button>
                            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                                <Button variant="accent" className="justify-center" onClick={() => handleMove("west")}>
                                    <ArrowLeft className="mr-2" /> {t('moveLeft')}
                                </Button>
                                <Button variant="destructive" onClick={handleAttack} aria-label="Attack">
                                    <SwordIcon />
                                </Button>
                                <Button variant="accent" className="justify-center" onClick={() => handleMove("east")}>
                                    {t('moveRight')} <ArrowRight className="ml-2" />
                                </Button>
                            </div>
                            <Button variant="accent" className="w-full max-w-xs justify-center" onClick={() => handleMove("south")}>
                                <ArrowDown className="mr-2" /> {t('moveDown')}
                            </Button>
                        </div>

                        {/* Desktop Layout (with Tooltips) */}
                        <div className="hidden md:grid grid-cols-3 grid-rows-3 gap-2 w-fit">
                            <div className="col-start-1 row-start-1 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className={desktopButtonSize} onClick={() => setStatusOpen(true)} aria-label="Player Status">
                                    <Shield />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('statusTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-2 row-start-1 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" className={desktopButtonSize} onClick={() => handleMove("north")} aria-label="Move North">
                                    <ArrowUp />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('moveNorthTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-3 row-start-1 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className={desktopButtonSize} onClick={() => setInventoryOpen(true)} aria-label="Inventory">
                                    <Backpack />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('inventoryTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-1 row-start-2 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" className={desktopButtonSize} onClick={() => handleMove("west")} aria-label="Move West">
                                    <ArrowLeft />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('moveWestTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>
                            
                            <div className="col-start-2 row-start-2 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="destructive" className={desktopButtonSize} onClick={handleAttack} aria-label="Attack">
                                    <SwordIcon />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('attackTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-3 row-start-2 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" className={desktopButtonSize} onClick={() => handleMove("east")} aria-label="Move East">
                                    <ArrowRight />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('moveEastTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>

                            <div className="col-start-2 row-start-3 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" className={desktopButtonSize} onClick={() => handleMove("south")} aria-label="Move South">
                                    <ArrowDown />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('moveSouthTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
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
                
                <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} />
                <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={playerStats.items} />
            </div>
        </TooltipProvider>
    );
}
