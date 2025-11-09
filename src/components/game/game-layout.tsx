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
import BottomActionBar from "@/components/game/bottom-action-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { HudIconProgress } from "@/components/game/hud-icon-progress";
import HudIconHealth from "@/components/game/hud-icon-health";
import HudIconStamina from "@/components/game/hud-icon-stamina";
import HudIconMana from "@/components/game/hud-icon-mana";
import HudIconHunger from "@/components/game/hud-icon-hunger";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import useKeyboardBindings from "@/hooks/use-keyboard-bindings";
import { useGameEngine } from "@/hooks/use-game-engine";
import type { Structure, Action, NarrativeEntry } from "@/lib/game/types";
import { cn, getTranslatedText } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import { Backpack, Shield, Cpu, Hammer, WandSparkles, Home, BedDouble, Thermometer, LifeBuoy, FlaskConical, Settings, Heart, Zap, Footprints, Loader2, Menu, LogOut, Beef } from "./icons";
import { IconRenderer } from "@/components/ui/icon-renderer";
import { resolveItemDef } from '@/lib/game/item-utils';
import { logger } from "@/lib/logger";


interface GameLayoutProps {
    gameSlot: number;
}

export default function GameLayout(props: GameLayoutProps) {
    // Guard: If gameSlot is not a valid number, show error and do not render game logic
    if (typeof props.gameSlot !== 'number' || isNaN(props.gameSlot) || props.gameSlot < 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-600">
                <h2>Invalid or missing game slot.</h2>
                <p>Please return to the main menu and select a valid save slot.</p>
            </div>
        );
    }
    const { t, language } = useLanguage();
    const { settings } = useSettings();
    const [isDesktop, setIsDesktop] = useState(false);
    const [showNarrativeDesktop, setShowNarrativeDesktop] = useState(true);
    // Dev-only: track mount/unmount counts to help diagnose unexpected remounts
    if (process.env.NODE_ENV !== 'production') {
         
        const g = globalThis as any;
        if (!g.__gameLayoutMountCount) g.__gameLayoutMountCount = 0;
    }
    
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
    biomeDefinitions,
        isLoaded,
        handleMove,
        handleAttack,
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
        narrativeContainerRef,
    } = useGameEngine(props);

    // increment mount counter for GameLayout and expose to window for quick checks
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') return;
         
        const g = globalThis as any;
        g.__gameLayoutMountCount = (g.__gameLayoutMountCount || 0) + 1;
        // also expose on window for console inspection
        try { (window as any).__GAME_LAYOUT_MOUNT_COUNT = g.__gameLayoutMountCount; } catch {}
        logger.debug('[GameLayout] mounted - count', { count: g.__gameLayoutMountCount });
        return () => {
            g.__gameLayoutMountCount = Math.max(0, (g.__gameLayoutMountCount || 1) - 1);
            try { (window as any).__GAME_LAYOUT_MOUNT_COUNT = g.__gameLayoutMountCount; } catch {}
            logger.debug('[GameLayout] unmounted - count', { count: g.__gameLayoutMountCount });
        };
    }, []);

    // Track whether we are on a desktop-sized viewport so we can render the desktop layout
    useEffect(() => {
        const onResize = () => setIsDesktop(typeof window !== 'undefined' && window.innerWidth >= 1024);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    

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
    const [isAvailableActionsOpen, setAvailableActionsOpen] = useState(false);
    const [isCustomDialogOpen, setCustomDialogOpen] = useState(false);
    const [customDialogValue, setCustomDialogValue] = useState("");
    const [isPickupDialogOpen, setPickupDialogOpen] = useState(false);
    const [selectedPickupIds, setSelectedPickupIds] = useState<number[]>([]);
    
    const customActionInputRef = useRef<HTMLInputElement>(null);

    const focusCustomActionInput = useCallback(() => {
        setTimeout(() => {
                        try {
                            const el = customActionInputRef.current as (HTMLInputElement | null);
                            if (!el) return;
                            const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
                            // Respect user setting for preventing control-panel scrolling
                            const prevent = settings?.controlsPreventScroll ?? true;
                            if (isDesktop && prevent) {
                                // @ts-ignore - some TS DOM libs may not include the options overload
                                el.focus?.({ preventScroll: true });
                            } else {
                                el.focus?.();
                            }
                        } catch {
                            try { customActionInputRef.current?.focus(); } catch {}
                        }
        }, 0);
            }, [settings]);

    // Use centralized keyboard bindings hook for all global key handling
    useKeyboardBindings({
        handlers: {
            move: (dir: 'north' | 'south' | 'west' | 'east') => handleMove(dir),
            attack: () => handleAttack(),
            openInventory: () => setInventoryOpen(true),
            openStatus: () => setStatusOpen(true),
            openMap: () => setIsFullMapOpen(true),
            customAction: () => setCustomDialogOpen(true),
            pickUp: () => { setPickupDialogOpen(true); setSelectedPickupIds([]); },
            hotkey: (index: number) => {
                // Prefer skills mapped to hotkeys (leftmost skills). If missing, fall back to available actions.
                try {
                    const idx = index - 1;
                    const skill = playerStats?.skills?.[idx];
                    if (skill) {
                        const skillName = getTranslatedText(skill.name, language, t);
                        handleUseSkill(skillName);
                        return;
                    }

                    // If no skill in that slot, attempt to trigger the corresponding available action
                    const action = otherActions[idx] || pickUpActions[idx];
                    if (action) {
                        handleAction(action.id);
                        return;
                    }
                } catch (e) {
                    logger.debug('[GameLayout] hotkey handler error', e);
                }
            }
        },
        popupOpen: isSettingsOpen || isFullMapOpen || isInventoryOpen || isStatusOpen || isCraftingOpen || isBuildingOpen || isFusionOpen || isTutorialOpen,
        focusCustomActionInput: focusCustomActionInput,
        enabled: true,
        movementWhileTyping: true,
    });

    const handleActionClick = (actionId: number) => {
        handleAction(actionId);
        focusCustomActionInput();
    };

    const onCustomActionSubmit = () => {
        if (inputValue.trim()) {
            handleCustomAction(inputValue);
            setInputValue("");
        }
        focusCustomActionInput();
    };
    const onCustomDialogSubmit = () => {
        const v = customDialogValue.trim();
        if (v) {
            handleCustomAction(v);
            setCustomDialogValue("");
        }
        setCustomDialogOpen(false);
        focusCustomActionInput();
    };
    
    useEffect(() => {
        const promptShown = localStorage.getItem('pwaInstallPromptShown');
        if (!promptShown) {
            setShowInstallPopup(true);
            localStorage.setItem('pwaInstallPromptShown', 'true');
        }
    }, []);

    const generateMapGrid = useCallback(() => {
        if (!isLoaded || !finalWorldSetup) {
            logger.warn(`[GameLayout] Grid generation SKIPPED. isLoaded: ${isLoaded} | finalWorldSetup exists: ${!!finalWorldSetup}`);
            return [];
        }
        
        // Calculate visibility grid size (3x3 around player)
        const visibilityRadius = 1; // 3x3 grid for direct visibility
        // Calculate total grid size (5x5 for minimap display, but with visibility rules)
        const displayRadius = 2; // 5x5 grid for display
        const size = displayRadius * 2 + 1;
        const grid = Array.from({ length: size }, () => Array(size).fill(null));

        for (let gy = 0; gy < size; gy++) {
            for (let gx = 0; gx < size; gx++) {
                const wx = playerPosition.x - displayRadius + gx;
                const wy = playerPosition.y + displayRadius - gy;
                const chunkKey = `${wx},${wy}`;
                
                // Check if this chunk is within the 3x3 visibility radius
                const chunk = world[chunkKey];
                if (chunk) {
                    const distanceFromPlayer = Math.max(
                        Math.abs(wx - playerPosition.x),
                        Math.abs(wy - playerPosition.y)
                    );
                    
                    // Mark chunks within visibility radius as explored
                    if (distanceFromPlayer <= visibilityRadius) {
                        chunk.explored = true;
                        chunk.lastVisited = turn;
                    }
                }

                grid[gy][gx] = chunk;
            }
        }
        return grid;
    }, [world, playerPosition.x, playerPosition.y, finalWorldSetup, isLoaded, turn]);
    
    const restingPlace = currentChunk?.structures?.find((s: Structure) => s.restEffect);
    
    if (!isLoaded || !finalWorldSetup || !currentChunk) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background text-foreground">
                <div className="flex flex-col items-center gap-2 mt-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="mt-2">{t('loadingAdventure')}</p>
                </div>
            </div>
        );
    }
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCustomActionSubmit();
        }
    };
    
    const worldNameText = getTranslatedText(finalWorldSetup.worldName, language, t);

    // Stat display helpers for HUD numeric labels
    const hpVal = Number(playerStats.hp ?? 0);
    const hpMax = Number(playerStats.maxHp ?? 100);
    const hpPct = hpMax > 0 ? hpVal / hpMax : 0;

    const manaVal = Number(playerStats.mana ?? 0);
    const manaMax = Number(playerStats.maxMana ?? 50);
    const manaPct = manaMax > 0 ? manaVal / manaMax : 0;

    const stamVal = Number(playerStats.stamina ?? 0);
    const stamMax = Number(playerStats.maxStamina ?? 100);
    const stamPct = stamMax > 0 ? stamVal / stamMax : 0;

    const hungerVal = Number(playerStats.hunger ?? 0);
    const hungerMax = Number(playerStats.maxHunger ?? 100);
    // `playerStats.hunger` is a fullness-like value (higher means more full),
    // so the HUD percent should directly reflect hungerVal / hungerMax.
    const hungerPct = hungerMax > 0 ? Math.max(0, Math.min(1, hungerVal / hungerMax)) : 0;

    const statColorClass = (pct: number) => pct <= 0.3 ? 'text-destructive' : pct <= 0.6 ? 'text-amber-500' : 'text-foreground';

    // Consolidated main actions trigger: single button that opens a dropdown with the full action set.
    const mainActions = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-2" aria-label={t('mainActions') || 'Main actions'}>
                    {t('mainActions') || 'Actions'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
                <div className="grid grid-cols-1 gap-2 p-2">
                    <Button variant="ghost" className="justify-start" onClick={() => { setStatusOpen(true); focusCustomActionInput(); }}>{t('statusShort') || 'Status'}</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { setInventoryOpen(true); focusCustomActionInput(); }}>{t('inventoryShort') || 'Inventory'}</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { setCraftingOpen(true); focusCustomActionInput(); }}>{t('craftingShort') || 'Craft'}</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { setBuildingOpen(true); focusCustomActionInput(); }}>{t('buildingShort') || 'Build'}</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { setFusionOpen(true); focusCustomActionInput(); }}>{t('fusionShort') || 'Fuse'}</Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    // Pickup action grouping: collect pick-up actions to present in a single dialog
    const pickUpActions = (currentChunk?.actions || []).filter((a: Action) => a.textKey === 'pickUpAction_item');
    const otherActions = (currentChunk?.actions || []).filter((a: Action) => a.textKey !== 'pickUpAction_item');

    // Helpers for the pickup dialog selection
    const togglePickupSelection = (id: number) => {
        setSelectedPickupIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const handlePickupConfirm = () => {
        if (!selectedPickupIds || selectedPickupIds.length === 0) {
            setPickupDialogOpen(false);
            return;
        }

        // Execute each selected pick-up action using the existing action handler
        selectedPickupIds.forEach((actionId) => {
            try {
                handleAction(actionId);
            } catch (e) {
                logger.error('Pickup action failed for id', { actionId, error: e });
            }
        });

        // Reset dialog state and focus input
        setSelectedPickupIds([]);
        setPickupDialogOpen(false);
        focusCustomActionInput();
    };


    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row md:h-dvh bg-background text-foreground font-body" style={{ ['--aside-w' as any]: 'min(462px,36vw)' }}>
                {/* Left Panel: Narrative */}
                <div className={`${isDesktop && !showNarrativeDesktop ? 'md:hidden' : ''} w-full md:flex-1 flex flex-col md:overflow-hidden md:pb-16`}>
                    <header className="p-4 border-b flex-shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3 w-full md:max-w-3xl">
                            <h1 className="text-2xl font-bold font-headline">{worldNameText}</h1>
                            {/* On desktop (non-legacy layout), show main actions next to the world title as inline icon buttons */}
                            {isDesktop && !settings?.useLegacyLayout && (
                                <div className="ml-6 hidden md:flex md:items-center md:flex-1 gap-2">
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button aria-label={t('statusShort') || 'Status'} variant="outline" size="icon" onClick={() => { setStatusOpen(true); focusCustomActionInput(); }}><Shield /></Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('statusShort') || 'Status'}</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button aria-label={t('inventoryShort') || 'Inventory'} variant="outline" size="icon" onClick={() => { setInventoryOpen(true); focusCustomActionInput(); }}><Backpack /></Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('inventoryShort') || 'Inventory'}</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button aria-label={t('craftingShort') || 'Craft'} variant="outline" size="icon" onClick={() => { setCraftingOpen(true); focusCustomActionInput(); }}><Hammer /></Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('craftingShort') || 'Craft'}</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button aria-label={t('buildingShort') || 'Build'} variant="outline" size="icon" onClick={() => { setBuildingOpen(true); focusCustomActionInput(); }}><Home /></Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('buildingShort') || 'Build'}</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button aria-label={t('fusionShort') || 'Fuse'} variant="outline" size="icon" onClick={() => { setFusionOpen(true); focusCustomActionInput(); }}><FlaskConical /></Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('fusionShort') || 'Fuse'}</p></TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Desktop-only toggle for narrative visibility */}
                            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setShowNarrativeDesktop(s => !s)} aria-label={showNarrativeDesktop ? (t('hideNarrative') || 'Hide narrative') : (t('showNarrative') || 'Show narrative')}>
                                {showNarrativeDesktop ? 'Hide' : 'Show'}
                            </Button>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={t('openMenu') || 'Open menu'}>
                                    <Menu />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setTutorialOpen(true); focusCustomActionInput(); }}>
                                    <LifeBuoy className="mr-2 h-4 w-4" />
                                    <span>{t('tutorialTitle')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSettingsOpen(true); focusCustomActionInput(); }}>
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
                        </div>
                    </header>

                    <main ref={narrativeContainerRef} className="flex-grow p-4 md:p-6 overflow-y-auto max-h-[50dvh] md:max-h-full hide-scrollbar">
                        <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto">
                            {(() => {
                                // Defensive render-time dedupe: ensure we never render multiple elements with the same key.
                                // If duplicates exist in state due to a transient race, keep the last occurrence (most recent)
                                // and log the condition to aid debugging.
                                const map = new Map(narrativeLog.map((e: NarrativeEntry) => [e.id, e]));
                                const deduped = Array.from(map.values());
                                if (deduped.length !== narrativeLog.length) {
                                     
                                    console.warn('[GameLayout] narrativeLog contained duplicate ids; rendering deduped list.');
                                }
                                return deduped.map((entry: NarrativeEntry) => (
                                    <p key={entry.id} id={entry.id} className={cn("animate-in fade-in duration-500 whitespace-pre-line",
                                        (String(entry.type) === 'action' || String(entry.type) === 'monologue') ? 'italic text-muted-foreground' : '',
                                        entry.type === 'system' ? 'font-semibold text-accent' : ''
                                    )}>
                                        {getTranslatedText(entry.text, language, t)}
                                    </p>
                                ));
                            })()}
                            {isLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground italic mt-4">
                                    <Cpu className="h-4 w-4 animate-pulse" />
                                    <p>AI is thinking...</p>
                                </div>
                            )}
có                         </div>
                    </main>

                    {/* Desktop horizontal action bar removed - main actions are now inline in the header for desktop non-legacy layout */}

                </div>

                {/* Right Panel: Controls & Actions */}
                <aside className="w-full md:w-[min(462px,36vw)] md:flex-none bg-card border-l pt-4 pb-0 px-4 md:pt-6 md:pb-0 md:px-6 flex flex-col gap-6 min-h-0">
                    {/* Top Section - HUD & Minimap */}
                    <div className="flex-shrink-0 flex flex-col gap-6">
                        {isDesktop && !settings?.useLegacyLayout ? (
                            // Desktop (non-legacy): show map above HUD in the right panel
                            <>
                                {/* Minimap */}
                                <div className="flex flex-col items-center gap-2">
                                    <h3 className="text-lg font-headline font-semibold text-center text-foreground/80 cursor-pointer hover:text-accent transition-colors" onClick={() => { setIsFullMapOpen(true); focusCustomActionInput(); }}>{t('minimap')}</h3>
                                    <div className="flex items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground flex-wrap">
                                        <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1 cursor-default"><Thermometer className="h-4 w-4 text-orange-500" /><span>{t('environmentTemperature', { temp: currentChunk?.temperature?.toFixed(0) || 'N/A' })}</span></div></TooltipTrigger><TooltipContent><p>{t('environmentTempTooltip')}</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1 cursor-default"><Thermometer className="h-4 w-4 text-rose-500" /><span>{t('hudBodyTemp', { temp: playerStats.bodyTemperature.toFixed(1) })}</span></div></TooltipTrigger><TooltipContent><p>{t('bodyTempDesc')}</p></TooltipContent></Tooltip>
                                    </div>
                                    <Minimap grid={generateMapGrid()} playerPosition={playerPosition} turn={turn} biomeDefinitions={biomeDefinitions} />
                                </div>

                                {/* HUD */}
                                <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm justify-items-center">
                                    {/* Health (use new HudIconHealth) */}
                                    <div className="flex flex-col items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <HudIconHealth percent={Math.max(0, Math.min(1, hpPct))} size={40} />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('hudHealth') ?? 'Health'}: {Math.round(playerStats.hp ?? 0)}/{playerStats.maxHp ?? 100}</p></TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs mt-1 ${statColorClass(hpPct)}`}>{Math.round(hpVal)}/{hpMax}</span>
                                    </div>

                                    {/* Mana */}
                                    <div className="flex flex-col items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <HudIconMana percent={Math.max(0, Math.min(1, manaPct))} size={40} />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('hudMana') ?? 'Mana'}: {Math.round(playerStats.mana ?? 0)}/{playerStats.maxMana ?? 50}</p></TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs mt-1 ${statColorClass(manaPct)}`}>{Math.round(manaVal)}/{manaMax}</span>
                                    </div>

                                    {/* Stamina */}
                                    <div className="flex flex-col items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <HudIconStamina percent={Math.max(0, Math.min(1, stamPct))} size={40} className="" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('hudStamina') ?? 'Stamina'}: {Math.round(playerStats.stamina ?? 0)}/{playerStats.maxStamina ?? 100}</p></TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs mt-1 ${statColorClass(stamPct)}`}>{Math.round(stamVal)}/{stamMax}</span>
                                    </div>

                                    {/* Hunger */}
                                    <div className="flex flex-col items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" aria-label={t('hudHunger') ?? 'Hunger'} onClick={() => { setStatusOpen(true); focusCustomActionInput(); }} className="p-0">
                                                    <HudIconHunger percent={Math.max(0, Math.min(1, hungerPct))} size={40} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('hudHunger') ?? 'Hunger'}: {Math.round(playerStats.hunger ?? 0)}/{playerStats.maxHunger ?? 100}</p></TooltipContent>
                                        </Tooltip>
                                        <button onClick={() => { setStatusOpen(true); focusCustomActionInput(); }} className={`text-xs mt-1 ${statColorClass(hungerPct)} focus:outline-none`}>{Math.round(hungerVal)}/{hungerMax}</button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Default (mobile / legacy): HUD then Minimap
                            <>
                                {/* HUD */}
                                <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm justify-items-center">
                                    {/* Health (mobile) */}
                                    <div className="flex flex-col items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <HudIconHealth percent={Math.max(0, Math.min(1, hpPct))} size={40} />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('hudHealth') ?? 'Health'}: {Math.round(playerStats.hp ?? 0)}/{playerStats.maxHp ?? 100}</p></TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs mt-1 ${statColorClass(hpPct)}`}>{Math.round(hpVal)}/{hpMax}</span>
                                    </div>

                                    {/* Mana (mobile) */}
                                    <div className="flex flex-col items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <HudIconMana percent={Math.max(0, Math.min(1, manaPct))} size={40} />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('hudMana') ?? 'Mana'}: {Math.round(playerStats.mana ?? 0)}/{playerStats.maxMana ?? 50}</p></TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs mt-1 ${statColorClass(manaPct)}`}>{Math.round(manaVal)}/{manaMax}</span>
                                    </div>

                                    {/* Stamina (mobile) */}
                                    <div className="flex flex-col items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <HudIconStamina percent={Math.max(0, Math.min(1, stamPct))} size={40} className="" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('hudStamina') ?? 'Stamina'}: {Math.round(playerStats.stamina ?? 0)}/{playerStats.maxStamina ?? 100}</p></TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs mt-1 ${statColorClass(stamPct)}`}>{Math.round(stamVal)}/{stamMax}</span>
                                    </div>

                                    {/* Hunger (mobile) */}
                                    <div className="flex flex-col items-center">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <HudIconHunger percent={Math.max(0, Math.min(1, hungerPct))} size={40} />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{t('hudHunger') ?? 'Hunger'}: {Math.round(playerStats.hunger ?? 0)}/{playerStats.maxHunger ?? 100}</p></TooltipContent>
                                        </Tooltip>
                                        <span className={`text-xs mt-1 ${statColorClass(hungerPct)}`}>{Math.round(hungerVal)}/{hungerMax}</span>
                                    </div>
                                </div>

                                {/* Minimap */}
                                <div className="flex flex-col items-center gap-2">
                                    <h3 className="text-lg font-headline font-semibold text-center text-foreground/80 cursor-pointer hover:text-accent transition-colors" onClick={() => { setIsFullMapOpen(true); focusCustomActionInput(); }}>{t('minimap')}</h3>
                                    <div className="flex items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground flex-wrap">
                                        <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1 cursor-default"><Thermometer className="h-4 w-4 text-orange-500" /><span>{t('environmentTemperature', { temp: currentChunk?.temperature?.toFixed(0) || 'N/A' })}</span></div></TooltipTrigger><TooltipContent><p>{t('environmentTempTooltip')}</p></TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><div className="flex items-center gap-1 cursor-default"><Thermometer className="h-4 w-4 text-rose-500" /><span>{t('hudBodyTemp', { temp: playerStats.bodyTemperature.toFixed(1) })}</span></div></TooltipTrigger><TooltipContent><p>{t('bodyTempDesc')}</p></TooltipContent></Tooltip>
                                    </div>
                                    <Minimap grid={generateMapGrid()} playerPosition={playerPosition} turn={turn} biomeDefinitions={biomeDefinitions} />
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Bottom Section - Actions (desktop shows horizontal bar instead unless legacy layout is enabled) */}
                    <div className="flex flex-col gap-4 flex-grow">
                        {/* Controls (mobile only). On desktop we show the bottom fixed action bar instead. */}
                        <div className="flex items-center justify-between gap-4">
                            {!isDesktop && (
                                <Controls onMove={(dir) => { handleMove(dir); focusCustomActionInput(); }} onAttack={() => { handleAttack(); focusCustomActionInput(); }} />
                            )}
                        </div>

                        {/* Horizontal bottom action bar: skills (left), available actions (center), main actions (right) */}
                        <div className="w-full bg-transparent p-3 flex items-center gap-3 overflow-x-auto md:hidden">
                            {/* Skills (left) */}
                            <div className="flex items-center gap-2">
                                {playerStats.skills?.map((skill: import('@/lib/game/types').Skill) => {
                                    const skillName = getTranslatedText(skill.name, language, t);
                                    return (
                                        <Tooltip key={skillName}>
                                            <TooltipTrigger asChild>
                                                <Button variant="secondary" className="text-xs" onClick={() => { handleUseSkill(skillName); focusCustomActionInput(); }} disabled={isLoading || playerStats.mana < skill.manaCost}>
                                                    <WandSparkles className="h-4 w-4 mr-2" />
                                                    <span className="hidden sm:inline">{skillName}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{getTranslatedText(skill.description, language, t)}</p></TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>

                            {/* Available actions (center) */}
                            <div className="flex-1 flex items-center justify-center gap-2">
                                {pickUpActions.length > 0 && (
                                    <Button variant="accent" onClick={() => { setPickupDialogOpen(true); setSelectedPickupIds([]); }}>{t('pickUpItems') || 'Pick up items'}</Button>
                                )}
                                {otherActions.map((action: Action) => {
                                    const actionText = getTranslatedText({ key: action.textKey, params: action.params }, language, t);
                                    return (
                                        <Tooltip key={action.id}>
                                            <TooltipTrigger asChild>
                                                <Button variant="secondary" className="text-sm" onClick={() => handleActionClick(action.id)} disabled={isLoading}>{actionText}</Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{actionText}</p></TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>

                            {/* Main actions & menu (right) */}
                            <div className="ml-auto flex items-center gap-2">
                                <Button aria-label={t('statusShort') || 'Status'} variant="outline" size="icon" onClick={() => { setStatusOpen(true); focusCustomActionInput(); }}><Shield /></Button>
                                <Button aria-label={t('inventoryShort') || 'Inventory'} variant="outline" size="icon" onClick={() => { setInventoryOpen(true); focusCustomActionInput(); }}><Backpack /></Button>
                                <Button aria-label={t('craftingShort') || 'Crafting'} variant="outline" size="icon" onClick={() => { setCraftingOpen(true); focusCustomActionInput(); }}><Hammer /></Button>
                                <Button aria-label={t('buildingShort') || 'Build'} variant="outline" size="icon" onClick={() => { setBuildingOpen(true); focusCustomActionInput(); }}><Home /></Button>
                                <Button aria-label={t('fusionShort') || 'Fuse'} variant="outline" size="icon" onClick={() => { setFusionOpen(true); focusCustomActionInput(); }}><FlaskConical /></Button>
                                <Button variant="outline" onClick={() => setAvailableActionsOpen(true)}>{t('actions') || 'Actions'}</Button>
                                {/* Custom action removed from the map/HUD column to keep it map+HUD only */}
                            </div>
                        </div>

                        {/* Desktop bottom action bar (fixed) inserted so it doesn't overlap the right HUD/map column. */}
                        <BottomActionBar
                            skills={playerStats.skills}
                            playerStats={playerStats}
                            language={language}
                            t={t}
                            pickUpActions={pickUpActions}
                            otherActions={otherActions}
                            isLoading={isLoading}
                            onUseSkill={(skillName: string) => { handleUseSkill(skillName); focusCustomActionInput(); }}
                            onActionClick={handleActionClick}
                            onOpenPickup={() => { setPickupDialogOpen(true); setSelectedPickupIds([]); }}
                            onOpenAvailableActions={() => setAvailableActionsOpen(true)}
                            onOpenCustomDialog={() => setCustomDialogOpen(true)}
                            onOpenStatus={() => { setStatusOpen(true); focusCustomActionInput(); }}
                            onOpenInventory={() => { setInventoryOpen(true); focusCustomActionInput(); }}
                            onOpenCrafting={() => { setCraftingOpen(true); focusCustomActionInput(); }}
                            onOpenBuilding={() => { setBuildingOpen(true); focusCustomActionInput(); }}
                            onOpenFusion={() => { setFusionOpen(true); focusCustomActionInput(); }}
                        />
                        
                        
                        {/* Contextual and Custom Actions */}
                        {restingPlace && (
                            <><div className="space-y-2">
                                <h2 className="font-headline text-lg font-semibold text-center text-foreground/80">{t('structureActions')}</h2>
                                <Tooltip><TooltipTrigger asChild><Button variant="secondary" className="w-full justify-center" onClick={() => { handleRest(); focusCustomActionInput(); }} disabled={isLoading}><BedDouble className="mr-2 h-4 w-4" />{t('rest')}</Button></TooltipTrigger><TooltipContent><p>{t('restTooltip', { shelterName: getTranslatedText(restingPlace.name, language, t), hp: restingPlace.restEffect!.hp, stamina: restingPlace.restEffect!.stamina })}</p></TooltipContent></Tooltip>
                            </div><Separator /></>
                        )}
                        
                        {/* Available actions (mobile only): hide on desktop since desktop has the fixed bottom bar */}
                        {!isDesktop && (
                            <div className="space-y-2">
                                <h2 className="font-headline text-lg font-semibold text-center text-foreground/80">{t('availableActions')}</h2>
                                {/* External pickup button (opens selection dialog) - only visible when there are items */}
                                {pickUpActions.length > 0 && (
                                    <div className="flex w-full justify-center mb-2">
                                        <Button variant="accent" onClick={() => { setPickupDialogOpen(true); setSelectedPickupIds([]); }}>{t('pickUpItems') || 'Pick up items'}</Button>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    {otherActions.map((action: Action) => {
                                        const actionText = getTranslatedText({ key: action.textKey, params: action.params }, language, t);
                                        return (
                                            <Tooltip key={action.id}>
                                                <TooltipTrigger asChild><Button variant="secondary" className="w-full justify-center" onClick={() => handleActionClick(action.id)} disabled={isLoading}>{actionText}</Button></TooltipTrigger>
                                                <TooltipContent><p>{actionText}</p></TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {/* Custom action input removed from the map/HUD column so the aside only contains map and HUD */}
                    </div>
                </aside>
                {/* Dialog: Available Actions (desktop) */}
                <Dialog open={isAvailableActionsOpen} onOpenChange={setAvailableActionsOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('availableActions') || 'Available Actions'}</DialogTitle>
                            <DialogDescription>{t('availableActionsDesc') || 'Choose an available action.'}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 grid grid-cols-1 gap-2">
                            {currentChunk?.actions.length ? (
                                currentChunk!.actions.map((action: Action) => (
                                    <Button key={action.id} variant="secondary" className="w-full justify-center" onClick={() => { handleActionClick(action.id); setAvailableActionsOpen(false); }}>
                                        {getTranslatedText({ key: action.textKey, params: action.params }, language, t)}
                                    </Button>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('noAvailableActions') || 'No actions available.'}</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Dialog: Custom Action input (desktop) */}
                <Dialog open={isCustomDialogOpen} onOpenChange={setCustomDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('customAction') || 'Custom Action'}</DialogTitle>
                            <DialogDescription>{t('customActionDesc') || 'Type a custom action and submit.'}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                            <Input placeholder={t('customActionPlaceholder') || 'Describe your action...'} value={customDialogValue} onChange={(e) => setCustomDialogValue((e.target as HTMLInputElement).value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onCustomDialogSubmit(); } }} />
                            <div className="flex justify-end mt-3">
                                <Button variant="ghost" onClick={() => setCustomDialogOpen(false)} className="mr-2">{t('cancel') || 'Cancel'}</Button>
                                <Button onClick={onCustomDialogSubmit}>{t('submit') || 'Submit'}</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                
                
                <StatusPopup open={isStatusOpen} onOpenChange={setStatusOpen} stats={playerStats} onRequestHint={handleRequestQuestHint} onUnequipItem={handleUnequipItem} />
                {/* Dialog: Pickup items selection */}
                <Dialog open={isPickupDialogOpen} onOpenChange={setPickupDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('pickUpItems') || 'Pick up items'}</DialogTitle>
                            <DialogDescription>{t('pickUpItemsDesc') || 'Select which items to pick up from this location.'}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 grid grid-cols-1 gap-2">
                            {pickUpActions.length ? (
                                pickUpActions.map((action: Action) => {
                                    // Find the matching item in the chunk by using the same lookup used in handlers
                                    const item = (currentChunk?.items || []).find((i: any) => getTranslatedText(i.name, 'en') === action.params?.itemName) || (currentChunk?.items?.[0] || null);
                                    const itemName = item ? getTranslatedText(item.name, language, t) : getTranslatedText({ key: action.textKey, params: action.params }, language, t);
                                    return (
                                        <div key={action.id} className="flex items-center justify-between gap-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <Checkbox checked={selectedPickupIds.includes(action.id)} onCheckedChange={() => togglePickupSelection(action.id)} />
                                                <div className="flex flex-col text-sm">
                                                    <span className="font-medium flex items-center gap-1">
                                                        <IconRenderer icon={resolveItemDef(getTranslatedText(item.name, 'en'), customItemDefinitions)?.emoji || item.emoji} size={typeof (resolveItemDef(getTranslatedText(item.name, 'en'), customItemDefinitions)?.emoji || item.emoji) === 'object' ? 40 : 25} alt={itemName} />
                                                        {itemName}
                                                    </span>
                                                    {item && <span className="text-xs text-muted-foreground">{t('quantityShort') || 'Qty'}: {item.quantity}</span>}
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('noItemsHere') || 'No items to pick up.'}</p>
                            )}
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button variant="ghost" onClick={() => { setPickupDialogOpen(false); setSelectedPickupIds([]); }} className="mr-2">{t('cancel') || 'Cancel'}</Button>
                            <Button onClick={handlePickupConfirm} disabled={selectedPickupIds.length === 0}>{t('pickUp') || 'Pick up'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={playerStats.items} itemDefinitions={customItemDefinitions} enemy={currentChunk?.enemy || null} onUseItem={handleItemUsed} onEquipItem={handleEquipItem} />
                <CraftingPopup open={isCraftingOpen} onOpenChange={setCraftingOpen} playerItems={playerStats.items} recipes={recipes} onCraft={handleCraft} itemDefinitions={customItemDefinitions} />
                <BuildingPopup open={isBuildingOpen} onOpenChange={setBuildingOpen} playerItems={playerStats.items} buildableStructures={buildableStructures} onBuild={handleBuild} />
                <FusionPopup open={isFusionOpen} onOpenChange={setFusionOpen} playerItems={playerStats.items} itemDefinitions={customItemDefinitions} onFuse={handleFuseItems} isLoading={isLoading} />
                <FullMapPopup open={isFullMapOpen} onOpenChange={setIsFullMapOpen} world={world} playerPosition={playerPosition} turn={turn} />
                <TutorialPopup open={isTutorialOpen} onOpenChange={setTutorialOpen} />
                <SettingsPopup open={isSettingsOpen} onOpenChange={setSettingsOpen} isInGame={true} currentBiome={currentChunk?.terrain ?? null} />
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
