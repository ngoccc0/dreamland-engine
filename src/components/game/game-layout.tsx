"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense, lazy, useMemo } from "react";
import { MinimapMemoized as Minimap } from "@/components/game/minimap";
import { StatusPopup } from "@/components/game/status-popup";
// Lazy load heavy popup components (only load when opened)
const InventoryPopup = lazy(() => import("@/components/game/inventory-popup").then(m => ({ default: m.InventoryPopup })));
const FullMapPopup = lazy(() => import("@/components/game/full-map-popup").then(m => ({ default: m.FullMapPopup })));
const CraftingPopup = lazy(() => import("@/components/game/crafting-popup").then(m => ({ default: m.CraftingPopup })));
const BuildingPopup = lazy(() => import("@/components/game/building-popup").then(m => ({ default: m.BuildingPopup })));
const TutorialPopup = lazy(() => import("@/components/game/tutorial-popup").then(m => ({ default: m.TutorialPopup })));
const FusionPopup = lazy(() => import("@/components/game/fusion-popup").then(m => ({ default: m.FusionPopup })));
const PwaInstallPopup = lazy(() => import("@/components/game/pwa-install-popup").then(m => ({ default: m.PwaInstallPopup })));
const SettingsPopup = lazy(() => import("@/components/game/settings-popup").then(m => ({ default: m.SettingsPopup })));
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

import HudIconHealth from "@/components/game/hud-icon-health";
import HudIconStamina from "@/components/game/hud-icon-stamina";
import HudIconMana from "@/components/game/hud-icon-mana";
import HudIconHunger from "@/components/game/hud-icon-hunger";
import HudIconTemperature, { getWeatherEmoji } from "@/components/game/hud-icon-temperature";
import { GameClockWidget } from "@/components/game/game-clock-widget";
import { VisualEffectsLayer } from "@/components/game/visual-effects-layer";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import useKeyboardBindings from "@/hooks/use-keyboard-bindings";
import { useGameEngine } from "@/hooks/use-game-engine";
import { useIdleWarning } from "@/hooks/useIdleWarning";
import { useAudio } from "@/lib/audio/useAudio";
import { AudioActionType } from "@/lib/definitions/audio-events";
import type { Structure, Action, NarrativeEntry } from "@/lib/game/types";
import { cn, getTranslatedText } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

import { Backpack, Shield, Cpu, Hammer, WandSparkles, Home, BedDouble, LifeBuoy, FlaskConical, Settings, Loader2, Menu, LogOut, Minus, Plus } from "./icons";
import { IconRenderer } from "@/components/ui/icon-renderer";
import { GameNarrativePanel } from "@/components/game/game-narrative-panel";
import { resolveItemDef } from '@/lib/game/item-utils';
import { logger } from "@/lib/logger";


interface GameLayoutProps {
    gameSlot: number;
}

/**
 * Main game UI layout component - orchestrates all in-game panels and popups.
 *
 * @remarks
 * This is the top-level game UI that renders:
 * - **Game Engine**: Orchestrates useGameState, useActionHandlers, useGameEffects
 * - **HUD**: Player stats (health, mana, stamina, hunger, temperature), game clock
 * - **Popups**: Inventory, map, crafting, building, fusion, settings, tutorials
 * - **Overlays**: Narrative panel, visual effects, weather particles, player flight
 * - **Controls**: Keyboard/joystick input, bottom action bar
 * - **Notifications**: Status popups, damage numbers, game-over dialog
 *
 * **Popup Lazy Loading:**
 * Heavy popup components (inventory, map, crafting) are lazy-loaded with Suspense
 * to improve initial page load. They're only loaded when first opened.
 *
 * **State Management:**
 * Manages local UI state (popup visibility, HUD state) while delegating game logic
 * to useGameEngine hook. Input events are routed to action handlers.
 *
 * @param {GameLayoutProps} props - Configuration with `gameSlot` for save slot selection
 * @returns {React.ReactNode} Complete game UI interface
 *
 * @example
 * <Suspense fallback={<LoadingScreen />}>
 *   <GameLayout gameSlot={0} />
 * </Suspense>
 */
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
    const { settings, setSettings } = useSettings();

    // Idle warning hook: shows toast notification when idle threshold approaches
    useIdleWarning({
        pauseGameIdleProgression: settings?.pauseGameIdleProgression,
        idleWarningThresholdMs: settings?.idleWarningThresholdMs,
    });

    const [isDesktop, setIsDesktop] = useState(false);
    const [showNarrativeDesktop, setShowNarrativeDesktop] = useState(true);
    const [minimapSizeNotification, setMinimapSizeNotification] = useState<string>('');
    const minimapSizeNotificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
        visualPlayerPosition,
        isAnimatingMove,
        visualMoveFrom,
        visualMoveTo,
        visualJustLanded,
        narrativeLog,
        isLoading,
        isGameOver,
        finalWorldSetup,
        customItemDefinitions,
        currentChunk,
        gameTime,
        turn,
        biomeDefinitions,
        weatherZones,
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
        handleWaitTick,
        handleDropItem,
        handleReturnToMenu,
    } = useGameEngine(props);

    // Keep a short grace window after visual move animations finish where the
    // minimap and grid generation continue to use the visual position so the
    // UI doesn't snap back if the authoritative playerPosition updates slightly
    // after the animation ends.
    const prevAnimatingRefForLayout = useRef<boolean>(Boolean(isAnimatingMove));
    const holdCenterUntilRef = useRef<number>(0);
    const animationStartTimeRef = useRef<number>(0);

    // Refs to read animation state WITHOUT triggering re-computation
    const isAnimatingMoveRef = useRef(isAnimatingMove);
    const visualMoveToRef = useRef(visualMoveTo);
    const visualPlayerPositionRef = useRef(visualPlayerPosition);
    const turnRef = useRef(turn);

    useEffect(() => {
        isAnimatingMoveRef.current = isAnimatingMove;
        visualMoveToRef.current = visualMoveTo;
        visualPlayerPositionRef.current = visualPlayerPosition;
        turnRef.current = turn;
    }, [isAnimatingMove, visualMoveTo, visualPlayerPosition, turn]);

    useEffect(() => {
        try {
            if (!prevAnimatingRefForLayout.current && isAnimatingMove) {
                // animation just started — delay grid switch for ~50ms to let RAF pan start
                animationStartTimeRef.current = Date.now() + 50;
            }
            if (prevAnimatingRefForLayout.current && !isAnimatingMove) {
                // animation just finished — hold the visual center for a short time
                holdCenterUntilRef.current = Date.now() + 350; // ms
            }
            prevAnimatingRefForLayout.current = Boolean(isAnimatingMove);
        } catch {
            // ignore
        }
    }, [isAnimatingMove]);

    // Cleanup notification timeout on unmount
    useEffect(() => {
        return () => {
            if (minimapSizeNotificationTimeoutRef.current) {
                clearTimeout(minimapSizeNotificationTimeoutRef.current);
            }
        };
    }, []);

    // increment mount counter for GameLayout and expose to window for quick checks
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') return;

        const g = globalThis as any;
        g.__gameLayoutMountCount = (g.__gameLayoutMountCount || 0) + 1;
        // also expose on window for console inspection
        try { (window as any).__GAME_LAYOUT_MOUNT_COUNT = g.__gameLayoutMountCount; } catch { }
        logger.debug('[GameLayout] mounted - count', { count: g.__gameLayoutMountCount });
        return () => {
            g.__gameLayoutMountCount = Math.max(0, (g.__gameLayoutMountCount || 1) - 1);
            try { (window as any).__GAME_LAYOUT_MOUNT_COUNT = g.__gameLayoutMountCount; } catch { }
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
    const audio = useAudio();

    // Toggle handlers for all popups with audio feedback
    const handleCraftingToggle = useCallback(() => {
        setCraftingOpen((prev) => {
            if (prev) {
                audio.playSfxForAction(AudioActionType.UI_CANCEL);
            } else {
                audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            }
            return !prev;
        });
    }, [audio]);

    const handleInventoryToggle = useCallback(() => {
        setInventoryOpen((prev) => {
            if (prev) {
                audio.playSfxForAction(AudioActionType.UI_CANCEL);
            } else {
                audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            }
            return !prev;
        });
    }, [audio]);

    const handleStatusToggle = useCallback(() => {
        setStatusOpen((prev) => {
            if (prev) {
                audio.playSfxForAction(AudioActionType.UI_CANCEL);
            } else {
                audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            }
            return !prev;
        });
    }, [audio]);

    const handleMapToggle = useCallback(() => {
        setIsFullMapOpen((prev) => {
            if (prev) {
                audio.playSfxForAction(AudioActionType.UI_CANCEL);
            } else {
                audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            }
            return !prev;
        });
    }, [audio]);

    // Legacy close handler for Dialog component onOpenChange
    const handleCraftingClose = useCallback((open: boolean) => {
        setCraftingOpen(open);
    }, []);

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
                try { customActionInputRef.current?.focus(); } catch { }
            }
        }, 0);
    }, [settings]);

    // Use centralized keyboard bindings hook for all global key handling
    useKeyboardBindings({
        handlers: {
            move: (dir: 'north' | 'south' | 'west' | 'east') => handleMove(dir),
            attack: () => handleAttack(),
            wait: () => handleWaitTick(),
            openInventory: () => handleInventoryToggle(),
            openStatus: () => handleStatusToggle(),
            openMap: () => handleMapToggle(),
            openCrafting: () => handleCraftingToggle(),
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
                } catch (e: any) {
                    logger.debug('[GameLayout] hotkey handler error', e);
                }
            }
        },
        popupOpen: isSettingsOpen || isBuildingOpen || isFusionOpen || isTutorialOpen,
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
        // Grid size scales with minimap viewport setting
        // 5×5 viewport → displayRadius=2 (5×5 grid), 7×7 viewport → displayRadius=3, 9×9 viewport → displayRadius=4
        const minimapViewportSize = (settings?.minimapViewportSize as 5 | 7 | 9) || 5;
        const displayRadius = Math.floor(minimapViewportSize / 2);
        const size = displayRadius * 2 + 1;
        const grid = Array.from({ length: size }, () => Array(size).fill(null));
        // When a visual move animation is active, prefer the visual position for
        // calculating which chunks to render so the map does not recenter until
        // the avatar lands. Also keep a short grace window after animation where
        // we continue to use the visual position even if isAnimatingMove has ended
        // but the authoritative playerPosition hasn't fully propagated.
        const now = Date.now();
        // Read animation state from Refs (NOT dependencies) to avoid unnecessary recomputation
        const shouldUseVisualCenter = (isAnimatingMoveRef.current && now > animationStartTimeRef.current && (visualMoveToRef.current || visualPlayerPositionRef.current)) || ((visualPlayerPositionRef.current || visualMoveToRef.current) && holdCenterUntilRef.current > now);
        const playerForGrid = shouldUseVisualCenter ? (visualMoveToRef.current || visualPlayerPositionRef.current || playerPosition) : playerPosition;
        // Log which center we used so we can correlate UI updates with state changes
        // debug logging intentionally removed to centralize move tracing into
        // a single start/end sequence log. Keep costly logging out of the
        // hot path to reduce console noise and timing perturbations.

        for (let gy = 0; gy < size; gy++) {
            for (let gx = 0; gx < size; gx++) {
                const wx = playerForGrid.x - displayRadius + gx;
                const wy = playerForGrid.y + displayRadius - gy;
                const chunkKey = `${wx},${wy}`;

                // Check if this chunk is within the 3x3 visibility radius
                const chunk = world[chunkKey];
                if (chunk) {
                    // When a visual move animation is active we used playerForGrid to
                    // determine the grid center; use the same visual position when
                    // computing visibility so tiles explored during animations are
                    // attributed to the visual avatar and not the authoritative
                    // playerPosition (which may lag until the animation completes).
                    const refPos = playerForGrid || playerPosition;
                    const distanceFromPlayer = Math.max(
                        Math.abs(wx - refPos.x),
                        Math.abs(wy - refPos.y)
                    );

                    // Only set explored/lastVisited if we detect the tile within
                    // visibility radius. Do NOT unset explored if it was previously true.
                    if (distanceFromPlayer <= visibilityRadius) {
                        if (!chunk.explored) chunk.explored = true;
                        chunk.lastVisited = turnRef.current;
                    }
                }

                grid[gy][gx] = chunk;
            }
        }
        return grid;
    }, [world, playerPosition.x, playerPosition.y, finalWorldSetup, isLoaded, settings?.minimapViewportSize]);

    // Memoize the generated grid so Minimap doesn't rerender on every parent render
    const memoizedGrid = useMemo(() => generateMapGrid(), [generateMapGrid]);

    // Keep previous grid ref to prevent rerender during animation
    const previousGridRef = useRef(memoizedGrid);
    const gridToPass = isAnimatingMoveRef.current ? previousGridRef.current : memoizedGrid;

    useEffect(() => {
        // Update ref only when animation is NOT active
        if (!isAnimatingMoveRef.current) {
            previousGridRef.current = memoizedGrid;
        }
    }, [memoizedGrid]);

    const restingPlace = currentChunk?.structures?.find((s: Structure) => s.restEffect);
    // Pickup / other action grouping must be declared before any function that closes over them
    const pickUpActions = (currentChunk?.actions || []).filter((a: Action) => a.textKey === 'pickUpAction_item');
    const otherActions = (currentChunk?.actions || []).filter((a: Action) => a.textKey !== 'pickUpAction_item');

    // Determine context-sensitive main action
    const getContextSensitiveAction = () => {
        if (currentChunk?.enemy) {
            return { type: 'attack', label: t('attack') || 'Attack', handler: handleAttack };
        }
        if (pickUpActions.length > 0) {
            return { type: 'pickup', label: t('pickUpItems') || 'Pick Up', handler: () => { setPickupDialogOpen(true); setSelectedPickupIds([]); } };
        }
        if (restingPlace) {
            return { type: 'rest', label: t('rest') || 'Rest', handler: handleRest };
        }
        if (otherActions.length > 0) {
            const action = otherActions[0];
            const actionText = getTranslatedText({ key: action.textKey, params: action.params }, language, t);
            return { type: 'interact', label: actionText, handler: () => handleActionClick(action.id) };
        }
        return { type: 'explore', label: t('explore') || 'Explore', handler: () => { } };
    };

    const contextAction = getContextSensitiveAction();

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

    // Normalize hunger values: some code paths store hunger as 0..1 (fraction) while
    // others use a 0..100 scale. Accept both by detecting fractional values and
    // scaling them to the 0..100 domain expected by the HUD.
    const rawHunger = typeof playerStats.hunger === 'number' ? playerStats.hunger : undefined;
    const hungerMax = Number(playerStats.maxHunger ?? 100);
    let hungerVal = 0;
    if (typeof rawHunger === 'number') {
        // If the value looks like a fractional representation (<= 1.0), scale it to 0..100
        if (rawHunger > 0 && rawHunger <= 1) {
            hungerVal = rawHunger * hungerMax;
        } else {
            hungerVal = rawHunger;
        }
    } else {
        hungerVal = hungerMax; // default to full if undefined
    }
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
                    <Button variant="ghost" className="justify-start" onClick={() => { handleStatusToggle(); focusCustomActionInput(); }}>{t('statusShort') || 'Status'}</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { handleInventoryToggle(); focusCustomActionInput(); }}>{t('inventoryShort') || 'Inventory'}</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { handleCraftingToggle(); focusCustomActionInput(); }}>{t('craftingShort') || 'Craft'}</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { setBuildingOpen(true); focusCustomActionInput(); }}>{t('buildingShort') || 'Build'}</Button>
                    <Button variant="ghost" className="justify-start" onClick={() => { setFusionOpen(true); focusCustomActionInput(); }}>{t('fusionShort') || 'Fuse'}</Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );



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
            } catch (error: any) {
                logger.error('Pickup action failed for id', { actionId, error });
            }
        });

        // Reset dialog state and focus input
        setSelectedPickupIds([]);
        setPickupDialogOpen(false);
        focusCustomActionInput();
    };


    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row md:h-dvh bg-background text-foreground font-body overflow-hidden" style={{ ['--aside-w' as any]: 'min(462px,36vw)' }}>
                {/* Full-screen Low HP heartbeat vignette */}
                {(Number(playerStats.hp ?? 0) / Number(playerStats.maxHp ?? 100)) * 100 < 30 && (
                    <div
                        className="fixed inset-0 pointer-events-none z-[15]"
                        style={{
                            animation: 'heartbeat-vignette 1.5s infinite',
                            background: 'radial-gradient(circle, transparent 60%, rgba(180, 0, 0, 0.4) 100%)',
                        }}
                    />
                )}

                {/* Mobile Layout: Map/HUD on top (fixed), Narrative scrollable below */}
                {/* Desktop Layout: Narrative left (scrollable), Map/HUD right (fixed) */}

                {/* LEFT PANEL: On mobile this is at bottom (scrollable), on desktop it's left (scrollable) */}
                <div className="order-2 md:order-1 w-full md:w-auto md:flex-1 flex flex-col min-h-0 overflow-hidden">
                    <GameNarrativePanel
                        narrativeLog={narrativeLog}
                        worldName={worldNameText}
                        isDesktop={isDesktop}
                        showNarrativeDesktop={showNarrativeDesktop}
                        onToggleNarrativeDesktop={setShowNarrativeDesktop}
                        isLoading={isLoading}
                        t={t}
                        language={language}
                        onOpenTutorial={() => { setTutorialOpen(true); focusCustomActionInput(); }}
                        onOpenSettings={() => { setSettingsOpen(true); focusCustomActionInput(); }}
                        onReturnToMenu={handleReturnToMenu}
                        onOpenStatus={() => { handleStatusToggle(); focusCustomActionInput(); }}
                        onOpenInventory={() => { handleInventoryToggle(); focusCustomActionInput(); }}
                        onOpenCrafting={() => { handleCraftingToggle(); focusCustomActionInput(); }}
                        onOpenBuilding={() => { setBuildingOpen(true); focusCustomActionInput(); }}
                        onOpenFusion={() => { setFusionOpen(true); focusCustomActionInput(); }}
                        animationMode="instant"
                        enableEmphasis={true}
                        maxEntries={50}
                    />
                </div>

                {/* RIGHT PANEL: Map/HUD/Controls (fixed on mobile, scrollable on desktop) */}
                <aside className="order-1 md:order-2 w-full md:w-[min(462px,36vw)] md:flex-none bg-card border-t md:border-t-0 md:border-l h-auto max-h-[55vh] md:max-h-none md:h-full overflow-y-auto md:overflow-y-auto pt-4 pb-4 px-4 md:pt-6 md:pb-0 md:px-6 flex flex-col gap-6 md:min-h-0">
                    {/* Desktop Only: action icons will be displayed inline next to the minimap title */}

                    {/* Top Section - HUD & Minimap */}
                    <div className="flex-shrink-0 flex flex-col gap-4">
                        {/* Minimap */}
                        <div className="flex flex-col items-center gap-2 w-full md:max-w-xs mx-auto">
                            <div className="w-full flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-headline font-semibold text-foreground/80 cursor-pointer hover:text-accent transition-colors" onClick={() => { handleMapToggle(); focusCustomActionInput(); }}>{t('minimap')}</h3>
                                    {/* Icons moved to world title header to avoid duplication */}
                                </div>
                            </div>
                            {/* Temperature Display & Minimap Size Control - Single Row */}
                            <div className="flex flex-row items-center justify-center gap-1 w-full px-2">
                                {/* Weather Emoji - Always Display */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="text-xl cursor-default" title={weatherZones?.[currentChunk?.regionId]?.currentWeather?.id || 'clear'}>
                                            {getWeatherEmoji(weatherZones?.[currentChunk?.regionId]?.currentWeather?.id) || '☀️'}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{weatherZones?.[currentChunk?.regionId]?.currentWeather?.id || 'No weather data'}</p></TooltipContent>
                                </Tooltip>

                                {/* Environment Temperature - Color changing thermometer icon */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center cursor-default">
                                            <HudIconTemperature temp={currentChunk?.temperature || 20} maxTemp={50} hideWeatherEmoji={true} size={32} showNumberBeside={true} isEnvTempColorIcon={true} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('environmentTempTooltip')}</p></TooltipContent>
                                </Tooltip>

                                {/* Body Temperature - Color changing person icon */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center cursor-default">
                                            <HudIconTemperature temp={playerStats.bodyTemperature || 37} maxTemp={40} hideWeatherEmoji={true} size={32} isBodyTempColorIcon={true} showNumberBeside={true} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('bodyTempDesc')}</p></TooltipContent>
                                </Tooltip>

                                {/* Game Clock Widget */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex flex-col items-center cursor-default">
                                            <GameClockWidget gameTime={gameTime || 0} size={48} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Game Time: {String(Math.floor((gameTime || 0) / 60)).padStart(2, '0')}:{String((gameTime || 0) % 60).padStart(2, '0')}</p></TooltipContent>
                                </Tooltip>

                                {/* Minimap Size Control Button - Magnifying Glass */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className="text-xl hover:opacity-80 transition-opacity cursor-pointer relative"
                                            onClick={() => {
                                                const currentSize = (settings?.minimapViewportSize as 5 | 7 | 9) || 5;
                                                const sizes: (5 | 7 | 9)[] = [5, 7, 9];
                                                const currentIndex = sizes.indexOf(currentSize);
                                                const nextIndex = (currentIndex + 1) % sizes.length;
                                                const newSize = sizes[nextIndex];
                                                setSettings({ ...settings, minimapViewportSize: newSize });

                                                // Show notification
                                                if (minimapSizeNotificationTimeoutRef.current) {
                                                    clearTimeout(minimapSizeNotificationTimeoutRef.current);
                                                }
                                                setMinimapSizeNotification(`${newSize}×${newSize}`);
                                                minimapSizeNotificationTimeoutRef.current = setTimeout(() => {
                                                    setMinimapSizeNotification('');
                                                }, 1000);
                                            }}
                                            title="Adjust minimap size"
                                        >
                                            🔍
                                            {minimapSizeNotification && (
                                                <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-foreground text-background text-xs rounded px-2 py-1 whitespace-nowrap font-bold">
                                                    {minimapSizeNotification}
                                                </span>
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Cycle minimap size</p></TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="w-full max-w-full md:max-w-xs relative z-[20]">
                                {/* Visual Effects Layer: Only over minimap - Weather, Status Effects, Damage Popups */}
                                <VisualEffectsLayer
                                    currentHp={Number(playerStats.hp ?? 0)}
                                    maxHp={Number(playerStats.maxHp ?? 100)}
                                    weather={weatherZones?.[currentChunk?.regionId]?.currentWeather?.id || 'CLEAR'}
                                    gameTime={gameTime}
                                    activeEffects={playerStats?.activeEffects || []}
                                />
                                <Minimap grid={gridToPass} playerPosition={playerPosition} visualPlayerPosition={visualPlayerPosition} isAnimatingMove={isAnimatingMove} visualMoveFrom={visualMoveFrom} visualMoveTo={visualMoveTo} visualJustLanded={visualJustLanded} turn={turn} biomeDefinitions={biomeDefinitions} />
                            </div>
                        </div>

                        {/* HUD */}
                        <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-sm justify-items-center">
                            {/* Health */}
                            <div className="flex flex-col items-center p-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <HudIconHealth percent={Math.max(0, Math.min(1, hpPct))} size={isDesktop ? 40 : 48} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('hudHealth') ?? 'Health'}: {Math.round(playerStats.hp ?? 0)}/{playerStats.maxHp ?? 100}</p></TooltipContent>
                                </Tooltip>
                                <span className={`text-xs mt-1 ${statColorClass(hpPct)}`}>{Math.round(hpVal)}/{hpMax}</span>
                            </div>

                            {/* Mana */}
                            <div className="flex flex-col items-center p-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <HudIconMana percent={Math.max(0, Math.min(1, manaPct))} size={isDesktop ? 40 : 48} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('hudMana') ?? 'Mana'}: {Math.round(playerStats.mana ?? 0)}/{playerStats.maxMana ?? 50}</p></TooltipContent>
                                </Tooltip>
                                <span className={`text-xs mt-1 ${statColorClass(manaPct)}`}>{Math.round(manaVal)}/{manaMax}</span>
                            </div>

                            {/* Stamina */}
                            <div className="flex flex-col items-center p-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <HudIconStamina percent={Math.max(0, Math.min(1, stamPct))} size={isDesktop ? 40 : 48} className="" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('hudStamina') ?? 'Stamina'}: {Math.round(playerStats.stamina ?? 0)}/{playerStats.maxStamina ?? 100}</p></TooltipContent>
                                </Tooltip>
                                <span className={`text-xs mt-1 ${statColorClass(stamPct)}`}>{Math.round(stamVal)}/{stamMax}</span>
                            </div>

                            {/* Hunger */}
                            <div className="flex flex-col items-center p-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" aria-label={t('hudHunger') ?? 'Hunger'} onClick={() => { handleStatusToggle(); focusCustomActionInput(); }} className="p-0">
                                            <HudIconHunger percent={Math.max(0, Math.min(1, hungerPct))} size={isDesktop ? 40 : 48} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>{t('hudHunger') ?? 'Hunger'}: {Math.round(playerStats.hunger ?? 0)}/{playerStats.maxHunger ?? 100}</p></TooltipContent>
                                </Tooltip>
                                <button onClick={() => { handleStatusToggle(); focusCustomActionInput(); }} className={`text-xs mt-1 ${statColorClass(hungerPct)} focus:outline-none`}>{Math.round(hungerVal)}/{hungerMax}</button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section - Actions (desktop shows horizontal bar instead unless legacy layout is enabled) */}
                    <div className="flex flex-col gap-4 flex-grow">
                        {/* Controls (mobile only). On desktop we show the bottom fixed action bar instead. */}
                        <div className="flex items-center justify-between gap-4">
                            {!isDesktop && (
                                <Controls onMove={(dir) => { if (dir) handleMove(dir); focusCustomActionInput(); }} onAttack={() => { handleAttack(); focusCustomActionInput(); }} onRest={() => { handleWaitTick(); focusCustomActionInput(); }} />
                            )}
                        </div>

                        {/* Streamlined Mobile Action Bar */}
                        <div className="w-full bg-transparent p-4 flex items-center gap-3 md:hidden">
                            {/* Skills (left) */}
                            <div className="flex items-center gap-2 overflow-x-auto">
                                {playerStats.skills?.map((skill: import('@/lib/game/types').Skill) => {
                                    const skillName = getTranslatedText(skill.name, language, t);
                                    return (
                                        <Tooltip key={skillName}>
                                            <TooltipTrigger asChild>
                                                <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => { handleUseSkill(skillName); focusCustomActionInput(); }} disabled={isLoading || playerStats.mana < skill.manaCost}>
                                                    <WandSparkles className="h-4 w-4 mr-1" />
                                                    <span className="hidden sm:inline">{skillName}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{getTranslatedText(skill.description, language, t)}</p></TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>

                            {/* Context-Sensitive Main Action (center) */}
                            <div className="flex-1 flex justify-center">
                                <Button
                                    variant={contextAction.type === 'attack' ? 'destructive' : 'default'}
                                    className="px-6 py-3 text-base font-semibold"
                                    onClick={() => { contextAction.handler(); focusCustomActionInput(); }}
                                    disabled={isLoading}
                                >
                                    {contextAction.label}
                                </Button>
                            </div>

                            {/* Menu Button (right) */}
                            <div className="flex items-center">
                                <Button variant="outline" size="icon" onClick={() => setAvailableActionsOpen(true)} aria-label="Menu">
                                    <Menu className="h-5 w-5" />
                                </Button>
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
                            onOpenStatus={() => { handleStatusToggle(); focusCustomActionInput(); }}
                            onOpenInventory={() => { handleInventoryToggle(); focusCustomActionInput(); }}
                            onOpenCrafting={() => { handleCraftingToggle(); focusCustomActionInput(); }}
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
                {/* Dialog: Menu (Mobile) */}
                <Dialog open={isAvailableActionsOpen} onOpenChange={setAvailableActionsOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('menu') || 'Menu'}</DialogTitle>
                            <DialogDescription>{t('menuDesc') || 'Access game features and settings.'}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Button variant="outline" className="flex flex-col items-center gap-1 h-16" onClick={() => { handleStatusToggle(); setAvailableActionsOpen(false); focusCustomActionInput(); }}>
                                <Shield className="h-6 w-6" />
                                <span className="text-xs">{t('statusShort') || 'Status'}</span>
                            </Button>
                            <Button variant="outline" className="flex flex-col items-center gap-1 h-16" onClick={() => { handleInventoryToggle(); setAvailableActionsOpen(false); focusCustomActionInput(); }}>
                                <Backpack className="h-6 w-6" />
                                <span className="text-xs">{t('inventoryShort') || 'Inventory'}</span>
                            </Button>
                            <Button variant="outline" className="flex flex-col items-center gap-1 h-16" onClick={() => { handleCraftingToggle(); setAvailableActionsOpen(false); focusCustomActionInput(); }}>
                                <Hammer className="h-6 w-6" />
                                <span className="text-xs">{t('craftingShort') || 'Craft'}</span>
                            </Button>
                            <Button variant="outline" className="flex flex-col items-center gap-1 h-16" onClick={() => { setBuildingOpen(true); setAvailableActionsOpen(false); focusCustomActionInput(); }}>
                                <Home className="h-6 w-6" />
                                <span className="text-xs">{t('buildingShort') || 'Build'}</span>
                            </Button>
                            <Button variant="outline" className="flex flex-col items-center gap-1 h-16" onClick={() => { setFusionOpen(true); setAvailableActionsOpen(false); focusCustomActionInput(); }}>
                                <FlaskConical className="h-6 w-6" />
                                <span className="text-xs">{t('fusionShort') || 'Fuse'}</span>
                            </Button>
                            <Button variant="outline" className="flex flex-col items-center gap-1 h-16" onClick={() => { handleMapToggle(); setAvailableActionsOpen(false); focusCustomActionInput(); }}>
                                <Cpu className="h-6 w-6" />
                                <span className="text-xs">{t('map') || 'Map'}</span>
                            </Button>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 gap-2">
                            <Button variant="ghost" className="justify-start" onClick={() => { setTutorialOpen(true); setAvailableActionsOpen(false); focusCustomActionInput(); }}>
                                <LifeBuoy className="mr-2 h-4 w-4" />
                                <span>{t('tutorialTitle') || 'Tutorial'}</span>
                            </Button>
                            <Button variant="ghost" className="justify-start" onClick={() => { setSettingsOpen(true); setAvailableActionsOpen(false); focusCustomActionInput(); }}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>{t('gameSettings') || 'Settings'}</span>
                            </Button>
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
                {isInventoryOpen && (
                    <Suspense fallback={<div />}>
                        <InventoryPopup open={isInventoryOpen} onOpenChange={setInventoryOpen} items={playerStats.items} itemDefinitions={customItemDefinitions} enemy={currentChunk?.enemy || null} onUseItem={handleItemUsed} onEquipItem={handleEquipItem} onDropItem={handleDropItem} />
                    </Suspense>
                )}
                {isCraftingOpen && (
                    <Suspense fallback={<div />}>
                        <CraftingPopup open={isCraftingOpen} onOpenChange={handleCraftingClose} playerItems={playerStats.items} recipes={recipes} onCraft={handleCraft} itemDefinitions={customItemDefinitions} />
                    </Suspense>
                )}
                {isBuildingOpen && (
                    <Suspense fallback={<div />}>
                        <BuildingPopup open={isBuildingOpen} onOpenChange={setBuildingOpen} playerItems={playerStats.items} buildableStructures={buildableStructures} onBuild={handleBuild} />
                    </Suspense>
                )}
                {isFusionOpen && (
                    <Suspense fallback={<div />}>
                        <FusionPopup open={isFusionOpen} onOpenChange={setFusionOpen} playerItems={playerStats.items} itemDefinitions={customItemDefinitions} onFuse={handleFuseItems} isLoading={isLoading} />
                    </Suspense>
                )}
                {isFullMapOpen && (
                    <Suspense fallback={<div />}>
                        <FullMapPopup open={isFullMapOpen} onOpenChange={setIsFullMapOpen} world={world} playerPosition={playerPosition} turn={turn} />
                    </Suspense>
                )}
                {isTutorialOpen && (
                    <Suspense fallback={<div />}>
                        <TutorialPopup open={isTutorialOpen} onOpenChange={setTutorialOpen} />
                    </Suspense>
                )}
                {isSettingsOpen && (
                    <Suspense fallback={<div />}>
                        <SettingsPopup open={isSettingsOpen} onOpenChange={setSettingsOpen} isInGame={true} currentBiome={currentChunk?.terrain ?? null} />
                    </Suspense>
                )}
                {showInstallPopup && (
                    <Suspense fallback={<div />}>
                        <PwaInstallPopup open={showInstallPopup} onOpenChange={setShowInstallPopup} />
                    </Suspense>
                )}

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
