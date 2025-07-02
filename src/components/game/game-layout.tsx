
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Minimap } from "@/components/game/minimap";
import { StatusPopup } from "@/components/game/status-popup";
import { InventoryPopup } from "@/components/game/inventory-popup";
import { FullMapPopup } from "@/components/game/full-map-popup";
import { CraftingPopup } from "@/components/game/crafting-popup";
import { BuildingPopup } from "@/components/game/building-popup";
import { TutorialPopup } from "@/components/game/tutorial-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Backpack, Shield, Cpu, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hammer, WandSparkles, Home, BedDouble, Thermometer, LifeBuoy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import { SwordIcon } from "@/components/game/icons";
import { useGameEngine } from "@/hooks/use-game-engine";
import type { MapCell, ItemDefinition, GeneratedItem, WorldConcept, PlayerItem } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import type { GameState } from "@/lib/game/types";


interface GameLayoutProps {
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog'> & { playerInventory: PlayerItem[] };
    initialGameState?: GameState;
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
}

export default function GameLayout(props: GameLayoutProps) {
    const { t } = useLanguage();
    
    const {
        world,
        recipes,
        buildableStructures,
        playerStats,
        playerPosition,
        narrativeLog,
        isLoading,
        finalWorldSetup,
        customItemDefinitions,
        handleMove,
        handleAttack,
        handleAction,
        handleCustomAction,
        handleCraft,
        handleBuild,
        handleItemUsed,
        handleUseSkill,
        handleRest,
    } = useGameEngine(props);

    const [isStatusOpen, setStatusOpen] = useState(false);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isCraftingOpen, setCraftingOpen] = useState(false);
    const [isBuildingOpen, setBuildingOpen] = useState(false);
    const [isFullMapOpen, setIsFullMapOpen] = useState(false);
    const [isTutorialOpen, setTutorialOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    
    const pageEndRef = useRef<HTMLDivElement>(null);
    const desktopButtonSize = "h-[60px] w-[60px]";
    
    useEffect(() => {
        const timer = setTimeout(() => {
            pageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
    }, [narrativeLog]);

    const generateMapGrid = useCallback((): MapCell[][] => {
        const radius = 2; // 5x5 grid
        const size = radius * 2 + 1;
        const grid: MapCell[][] = [];

        for (let gy = 0; gy < size; gy++) {
            const row: MapCell[] = [];
            for (let gx = 0; gx < size; gx++) {
                const wx = playerPosition.x - radius + gx;
                const wy = playerPosition.y + radius - gy;
                const chunkKey = `${wx},${wy}`;
                const chunk = world[chunkKey];
    
                if (chunk && chunk.explored) { 
                    row.push({
                        biome: chunk.terrain,
                        hasNpc: chunk.NPCs.length > 0,
                        enemyEmoji: chunk.enemy?.emoji,
                        itemEmoji: chunk.items.length > 0 ? chunk.items[0].emoji : undefined,
                        structureEmoji: chunk.structures?.length > 0 ? chunk.structures[0].emoji : undefined,
                    });
                } else {
                    row.push({
                        biome: 'empty',
                        hasNpc: false,
                    });
                }
            }
            grid.push(row);
        }
        
        const center = radius;
        if(grid[center]?.[center]) {
            grid[center][center].hasPlayer = true;
        }
        
        return grid;
    }, [world, playerPosition.x, playerPosition.y]);
    
    const currentChunk = world[`${playerPosition.x},${playerPosition.y}`];
    const restingPlace = currentChunk?.structures?.find(s => s.restEffect);

    if (!finalWorldSetup) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background">
                <p className="text-foreground text-destructive">Error: Game data is missing or corrupted.</p>
            </div>
        );
    }
    
    const onCustomActionSubmit = () => {
        handleCustomAction(inputValue);
        setInputValue("");
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row min-h-dvh bg-background text-foreground font-body">
                {/* Left Panel: Narrative */}
                <div className="w-full md:w-[70%] flex flex-col">
                    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10 flex justify-between items-center">
                        <h1 className="text-2xl font-bold font-headline">{finalWorldSetup.worldName}</h1>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setTutorialOpen(true)}>
                                    <LifeBuoy />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{t('tutorialTitle')}</p>
                            </TooltipContent>
                        </Tooltip>
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
                         <div className="flex justify-center items-center gap-4 mb-4">
                            <h3 
                                className="text-lg font-headline font-semibold text-center text-foreground/80 cursor-pointer hover:text-accent transition-colors"
                                onClick={() => setIsFullMapOpen(true)}
                            >
                                {t('minimap')}
                            </h3>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-default">
                                        <Thermometer className="h-4 w-4 text-orange-500" />
                                        <span>{t('environmentTemperature', { temp: currentChunk?.temperature?.toFixed(0) || 'N/A' })}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('environmentTempTooltip')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <Minimap grid={generateMapGrid()} playerPosition={playerPosition} />
                    </div>
                    
                    {/* UNIFIED CONTROLS SECTION */}
                    <div className="flex flex-col items-center gap-4 w-full">
                        <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('moveAndAttack')}</h3>
                        
                        {/* Mobile Layout */}
                        <div className="md:hidden w-full grid grid-cols-2 justify-center items-start gap-4">
                            <div className="flex flex-col gap-2 justify-center">
                                <Button variant="outline" onClick={() => setStatusOpen(true)} className="w-full justify-start text-xs px-2 h-10">
                                    <Shield className="mr-2 h-4 w-4 shrink-0"/> <span>{t('status')}</span>
                                </Button>
                                <Button variant="outline" onClick={() => setInventoryOpen(true)} className="w-full justify-start text-xs px-2 h-10">
                                    <Backpack className="mr-2 h-4 w-4 shrink-0"/> <span>{t('inventory')}</span>
                                </Button>
                                <Button variant="outline" onClick={() => setCraftingOpen(true)} className="w-full justify-start text-xs px-2 h-10">
                                    <Hammer className="mr-2 h-4 w-4 shrink-0"/> <span>{t('crafting')}</span>
                                </Button>
                                 <Button variant="outline" onClick={() => setBuildingOpen(true)} className="w-full justify-start text-xs px-2 h-10">
                                    <Home className="mr-2 h-4 w-4 shrink-0"/> <span>{t('building')}</span>
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 grid-rows-3 gap-1 place-items-center h-full">
                                <div className="col-start-2 row-start-1">
                                    <Button variant="accent" className="h-10 w-10 p-0" onClick={() => handleMove("north")} aria-label={t('moveNorthTooltip')}>
                                        <ArrowUp />
                                    </Button>
                                </div>
                                <div className="col-start-1 row-start-2">
                                    <Button variant="accent" className="h-10 w-10 p-0" onClick={() => handleMove("west")} aria-label={t('moveWestTooltip')}>
                                        <ArrowLeft />
                                    </Button>
                                </div>
                                <div className="col-start-2 row-start-2">
                                    <Button variant="destructive" className="h-10 w-10 p-0" onClick={handleAttack} aria-label={t('attackTooltip')}>
                                        <SwordIcon />
                                    </Button>
                                </div>
                                <div className="col-start-3 row-start-2">
                                    <Button variant="accent" className="h-10 w-10 p-0" onClick={() => handleMove("east")} aria-label={t('moveEastTooltip')}>
                                        <ArrowRight />
                                    </Button>
                                </div>
                                <div className="col-start-2 row-start-3">
                                    <Button variant="accent" className="h-10 w-10 p-0" onClick={() => handleMove("south")} aria-label={t('moveSouthTooltip')}>
                                        <ArrowDown />
                                    </Button>
                                </div>
                            </div>
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

                             <div className="col-start-1 row-start-3 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className={desktopButtonSize} onClick={() => setCraftingOpen(true)} aria-label="Crafting">
                                    <Hammer />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('craftingTooltip')}</p></TooltipContent>
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

                            <div className="col-start-3 row-start-3 flex justify-center items-center">
                                <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" className={desktopButtonSize} onClick={() => setBuildingOpen(true)} aria-label="Building">
                                    <Home />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('buildingTooltip')}</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                    
                    <Separator className="flex-shrink-0" />
                    
                    <div className="space-y-4 flex-grow flex flex-col">
                        <div className="flex flex-col space-y-2">
                             <h2 className="font-headline text-lg font-semibold text-center text-foreground/80 flex-shrink-0">{t('skills')}</h2>
                             <div className="grid grid-cols-2 gap-2">
                                {playerStats.skills?.map((skill) => (
                                     <Tooltip key={skill.name}>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="secondary" 
                                                className="w-full justify-center text-xs" 
                                                onClick={() => handleUseSkill(skill.name)} 
                                                disabled={isLoading || playerStats.mana < skill.manaCost}
                                            >
                                                <WandSparkles className="mr-2 h-3 w-3" />
                                                {skill.name} ({skill.manaCost} MP)
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{skill.description}</p>
                                            <p className="text-muted-foreground">{t('manaCost')}: {skill.manaCost}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                             </div>
                        </div>
                        
                        {restingPlace && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <h2 className="font-headline text-lg font-semibold text-center text-foreground/80 flex-shrink-0">{t('structureActions')}</h2>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="secondary" className="w-full justify-center" onClick={handleRest} disabled={isLoading}>
                                                <BedDouble className="mr-2 h-4 w-4" />
                                                {t('rest')}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{t('restTooltip', { shelterName: restingPlace.name, hp: restingPlace.restEffect!.hp, stamina: restingPlace.restEffect!.stamina })}</p></TooltipContent>
                                    </Tooltip>
                                </div>
                            </>
                        )}
                        
                        <Separator/>
                        
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
                                onKeyDown={(e) => e.key === 'Enter' && onCustomActionSubmit()}
                                disabled={isLoading}
                            />
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="accent" onClick={onCustomActionSubmit} disabled={isLoading}>{t('submit')}</Button>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('submitTooltip')}</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </aside>
                
                <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} />
                <InventoryPopup 
                    open={isInventoryOpen} 
                    onOpenChange={setInventoryOpen} 
                    items={playerStats.items} 
                    itemDefinitions={customItemDefinitions}
                    enemy={currentChunk?.enemy || null}
                    onUseItem={handleItemUsed}
                />
                <CraftingPopup open={isCraftingOpen} onOpenChange={setCraftingOpen} playerItems={playerStats.items} recipes={recipes} onCraft={handleCraft} />
                <BuildingPopup open={isBuildingOpen} onOpenChange={setBuildingOpen} playerItems={playerStats.items} buildableStructures={buildableStructures} onBuild={handleBuild} />
                <FullMapPopup open={isFullMapOpen} onOpenChange={setIsFullMapOpen} world={world} playerPosition={playerPosition} />
                <TutorialPopup open={isTutorialOpen} onOpenChange={setTutorialOpen} />
            </div>
        </TooltipProvider>
    );
}
