
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Minimap } from "@/components/game/minimap";
import { StatusPopup } from "@/components/game/status-popup";
import { InventoryPopup } from "@/components/game/inventory-popup";
import { FullMapPopup } from "@/components/game/full-map-popup";
import { CraftingPopup } from "@/components/game/crafting-popup";
import { BuildingPopup } from "@/components/game/building-popup";
import { TutorialPopup } from "@/components/game/tutorial-popup";
import { FusionPopup } from "@/components/game/fusion-popup";
import { PwaInstallPopup } from "@/components/game/pwa-install-popup";
import { SettingsPopup } from "@/components/game/settings-popup";
import { Controls } from "@/components/game/controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/context/language-context";
import { useGameEngine } from "@/hooks/use-game-engine";
import type { ItemDefinition, GeneratedItem, WorldConcept, PlayerItem, GameState, Structure, Chunk, EquipmentSlot, Action } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import { Backpack, Shield, Cpu, Hammer, WandSparkles, Home, BedDouble, Thermometer, LifeBuoy, FlaskConical, Settings, Heart, Zap, Footprints, Loader2, Menu, LogOut } from "./icons";


interface GameLayoutProps {
    gameSlot: number;
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog' | 'customStructures'> & { playerInventory: PlayerItem[] };
    initialGameState?: GameState;
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
    customStructures?: Structure[];
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
        isGameOver,
        finalWorldSetup,
        customItemDefinitions,
        currentChunk,
        turn,
        handleMove,
        handleAction,
        handleCustomAction,
        handleCraft,
        handleBuild,
        handleItemUsed,
        handleUseSkill,
        handleRest,
        handleFuseItems,
        handleRequestQuestHint,
        handleEquipItem,
        handleUnequipItem,
        handleReturnToMenu,
        handleHarvest,
        handleAttack,
    } = useGameEngine(props);

    const [isStatusOpen, setStatusOpen] = useState(false);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isCraftingOpen, setCraftingOpen] = useState(false);
    const [isBuildingOpen, setBuildingOpen] = useState(false);
    const [isFusionOpen, setFusionOpen] = useState(false);
    const [isFullMapOpen, setIsFullMapOpen] = useState(false);
    const [isTutorialOpen, setTutorialOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [showInstallPopup, setShowInstallPopup] = useState(false);
    const [inputValue, setInputValue] = useState("");
    
    const pageEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            pageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
        return () => clearTimeout(timer);
    }, [narrativeLog]);

    useEffect(() => {
        const promptShown = localStorage.getItem('pwaInstallPromptShown');
        if (!promptShown && props.worldSetup) {
            setShowInstallPopup(true);
            localStorage.setItem('pwaInstallPromptShown', 'true');
        }
    }, [props.worldSetup]);

    const generateMapGrid = useCallback((): (Chunk | null)[][] => {
        if (!finalWorldSetup) return [];
        const radius = 2; // 5x5 grid
        const size = radius * 2 + 1;
        const grid: (Chunk | null)[][] = [];

        for (let gy = 0; gy < size; gy++) {
            const row: (Chunk | null)[] = [];
            for (let gx = 0; gx < size; gx++) {
                const wx = playerPosition.x - radius + gx;
                const wy = playerPosition.y + radius - gy;
                const chunkKey = `${wx},${wy}`;
                const chunk = world[chunkKey];
    
                if (chunk) { 
                    row.push(chunk);
                } else {
                    row.push(null);
                }
            }
            grid.push(row);
        }
        return grid;
    }, [world, playerPosition.x, playerPosition.y, finalWorldSetup]);
    
    const restingPlace = currentChunk?.structures?.find(s => s.restEffect);

    if (!finalWorldSetup || !currentChunk) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background text-foreground">
                 <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p>{t('loadingAdventure')}</p>
                </div>
            </div>
        );
    }
    
    const onCustomActionSubmit = () => {
        if (inputValue.trim()) {
            handleCustomAction(inputValue);
            setInputValue("");
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCustomActionSubmit();
        }
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row h-dvh bg-background text-foreground font-body">
                {/* Left Panel: Narrative */}
                <div className="w-full md:flex-1 flex flex-col h-full overflow-hidden">
                    <header className="p-4 border-b flex-shrink-0 flex justify-between items-center">
                        <h1 className="text-2xl font-bold font-headline">{t(finalWorldSetup.worldName as TranslationKey)}</h1>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setTutorialOpen(true)}>
                                    <LifeBuoy className="mr-2 h-4 w-4" />
                                    <span>{t('tutorialTitle')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>{t('gameSettings')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleReturnToMenu}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>{t('returnToMenu')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>

                    <main className="flex-grow p-4 md:p-6 overflow-y-auto">
                        <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto">
                            {narrativeLog.map((entry) => (
                                <p key={entry.id} className={cn("animate-in fade-in duration-500 whitespace-pre-line",
                                    entry.type === 'action' ? 'italic text-muted-foreground' : '',
                                    entry.type === 'system' ? 'font-semibold text-accent' : ''
                                )}>
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
                <aside className="w-full md:w-[420px] md:flex-shrink-0 bg-card border-l p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
                    {/* Top fixed section */}
                    <div className="flex-shrink-0 flex flex-col gap-6">
                        {/* HUD */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                <div className="space-y-1">
                                    <label className="flex items-center gap-1.5 text-muted-foreground"><Heart /> {t('hudHealth')}</label>
                                    <Progress value={playerStats.hp} className="h-2" indicatorClassName="bg-destructive" />
                                </div>
                                <div className="space-y-1">
                                    <label className="flex items-center gap-1.5 text-muted-foreground"><Zap /> {t('hudMana')}</label>
                                    <Progress value={(playerStats.mana / 50) * 100} className="h-2" indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-600" />
                                </div>
                                <div className="space-y-1">
                                    <label className="flex items-center gap-1.5 text-muted-foreground"><Footprints /> {t('hudStamina')}</label>
                                    <Progress value={playerStats.stamina} className="h-2" indicatorClassName="bg-gradient-to-r from-yellow-400 to-orange-500" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{playerStats.hp} / 100</span>
                                <span>{playerStats.mana} / 50</span>
                                <span>{playerStats.stamina.toFixed(0)} / 100</span>
                            </div>
                        </div>

                        {/* Minimap */}
                        <div>
                            <div className="flex flex-col items-center gap-2 mb-4">
                                <h3 className="text-lg font-headline font-semibold text-center text-foreground/80 cursor-pointer hover:text-accent transition-colors" onClick={() => setIsFullMapOpen(true)}>{t('minimap')}</h3>
                                <div className="flex items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground flex-wrap">
                                    <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1 cursor-default"><Thermometer className="h-4 w-4 text-orange-500" /><span>{t('environmentTemperature', { temp: currentChunk?.temperature?.toFixed(0) || 'N/A' })}</span></div></TooltipTrigger><TooltipContent><p>{t('environmentTempTooltip')}</p></TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1 cursor-default"><Thermometer className="h-4 w-4 text-rose-500" /><span>{t('hudBodyTemp', { temp: playerStats.bodyTemperature.toFixed(1) })}</span></div></TooltipTrigger><TooltipContent><p>{t('bodyTempDesc')}</p></TooltipContent></Tooltip>
                                </div>
                            </div>
                            <Minimap grid={generateMapGrid()} playerPosition={playerPosition} turn={turn} />
                        </div>
                    </div>
                    
                    {/* Scrollable Section */}
                    <div className="flex-grow flex flex-col gap-4 overflow-y-auto -mr-2 pr-2">
                        {/* Controls and Skills */}
                        <div className="flex flex-col md:flex-row md:justify-around md:items-start md:gap-x-6 gap-y-4">
                            <Controls onMove={handleMove} onAttack={handleAttack} />
                             <div className="flex flex-col space-y-2 w-full md:max-w-xs">
                                <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('skills')}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {playerStats.skills?.map((skill) => (
                                        <Tooltip key={skill.name}>
                                            <TooltipTrigger asChild>
                                                <Button variant="secondary" className="w-full justify-center text-xs" onClick={() => handleUseSkill(skill.name)} disabled={isLoading || playerStats.mana < skill.manaCost}>
                                                    <WandSparkles className="mr-2 h-3 w-3" />
                                                    {t(skill.name as TranslationKey)} ({skill.manaCost} MP)
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t(skill.description as TranslationKey)}</p><p className="text-muted-foreground">{t('manaCost')}: {skill.manaCost}</p></TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Action Buttons */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-headline font-semibold text-center text-foreground/80">{t('mainActions')}</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-14 w-full" onClick={() => setStatusOpen(true)}><Shield /></Button></TooltipTrigger><TooltipContent><p>{t('statusTooltip')}</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-14 w-full" onClick={() => setInventoryOpen(true)}><Backpack /></Button></TooltipTrigger><TooltipContent><p>{t('inventoryTooltip')}</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-14 w-full" onClick={() => setCraftingOpen(true)}><Hammer /></Button></TooltipTrigger><TooltipContent><p>{t('craftingTooltip')}</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-14 w-full" onClick={() => setBuildingOpen(true)}><Home /></Button></TooltipTrigger><TooltipContent><p>{t('buildingTooltip')}</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" className="h-14 w-full" onClick={() => setFusionOpen(true)}><FlaskConical /></Button></TooltipTrigger><TooltipContent><p>{t('fusionTooltip')}</p></TooltipContent></Tooltip>
                            </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Contextual and Custom Actions */}
                        {restingPlace && (
                            <><div className="space-y-2">
                                <h2 className="font-headline text-lg font-semibold text-center text-foreground/80">{t('structureActions')}</h2>
                                <Tooltip><TooltipTrigger asChild><Button variant="secondary" className="w-full justify-center" onClick={handleRest} disabled={isLoading}><BedDouble className="mr-2 h-4 w-4" />{t('rest')}</Button></TooltipTrigger><TooltipContent><p>{t('restTooltip', { shelterName: t(restingPlace.name as TranslationKey), hp: restingPlace.restEffect!.hp, stamina: restingPlace.restEffect!.stamina })}</p></TooltipContent></Tooltip>
                            </div><Separator /></>
                        )}
                        
                        <div className="space-y-2">
                            <h2 className="font-headline text-lg font-semibold text-center text-foreground/80">{t('availableActions')}</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {currentChunk?.actions.map(action => {
                                    const actionText = t(action.textKey, action.params as any);
                                    return (
                                        <Tooltip key={action.id}>
                                            <TooltipTrigger asChild><Button variant="secondary" className="w-full justify-center" onClick={() => handleAction(action.id)} disabled={isLoading}>{actionText}</Button></TooltipTrigger>
                                            <TooltipContent><p>{actionText}</p></TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 mt-auto pt-4">
                            <Input placeholder={t('customActionPlaceholder')} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} disabled={isLoading} />
                            <Tooltip><TooltipTrigger asChild><Button variant="accent" onClick={onCustomActionSubmit} disabled={isLoading}>{t('submit')}</Button></TooltipTrigger><TooltipContent><p>{t('submitTooltip')}</p></TooltipContent></Tooltip>
                        </div>
                    </div>
                </aside>
                
                <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} onRequestHint={handleRequestQuestHint} onUnequipItem={handleUnequipItem} />
                <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={playerStats.items} itemDefinitions={customItemDefinitions} enemy={currentChunk?.enemy || null} onUseItem={handleItemUsed} onEquipItem={handleEquipItem} />
                <CraftingPopup open={isCraftingOpen} onOpenChange={setCraftingOpen} playerItems={playerStats.items} recipes={recipes} onCraft={handleCraft} itemDefinitions={customItemDefinitions} />
                <BuildingPopup open={isBuildingOpen} onOpenChange={setBuildingOpen} playerItems={playerStats.items} buildableStructures={buildableStructures} onBuild={handleBuild} />
                <FusionPopup open={isFusionOpen} onOpenChange={setFusionOpen} playerItems={playerStats.items} itemDefinitions={customItemDefinitions} onFuse={handleFuseItems} isLoading={isLoading} />
                <FullMapPopup open={isFullMapOpen} onOpenChange={setIsFullMapOpen} world={world} playerPosition={playerPosition} turn={turn} />
                <TutorialPopup open={isTutorialOpen} onOpenChange={setTutorialOpen} />
                <SettingsPopup open={isSettingsOpen} onOpenChange={setSettingsOpen} isInGame={true} />
                <PwaInstallPopup open={showInstallPopup} onOpenChange={setShowInstallPopup} />
                
                <AlertDialog open={isGameOver}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>{t('gameOverTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('gameOverDesc')}
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={() => {
                                localStorage.removeItem(`gameState_${props.gameSlot}`);
                                window.location.reload();
                            }}>
                                {t('startNewAdventure')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}

