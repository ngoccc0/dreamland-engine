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
import { BookOpen, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorldConcept } from "@/ai/flows/generate-world-setup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";

// Import modularized game engine components
import { generateRegion, getValidAdjacentTerrains, weightedRandom } from '@/lib/game/engine';
import { worldConfig } from '@/lib/game/config';
import type { World, PlayerStatus, NarrativeEntry, MapCell, Chunk, Season, Terrain, WorldProfile, Region } from '@/lib/game/types';


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
                    
                    const result = generateRegion(
                        newPos, 
                        newTerrain, 
                        currentWorld, 
                        regions, 
                        regionCounter,
                        worldProfile,
                        currentSeason
                    );
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
