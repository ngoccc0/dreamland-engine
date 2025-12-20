"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Loader2 } from "./icons";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import useKeyboardBindings from "@/hooks/use-keyboard-bindings";
import { useGameEngine } from "@/hooks/use-game-engine";
import { useIdleWarning } from "@/hooks/useIdleWarning";
import { useAudio } from "@/lib/audio/useAudio";
import { AudioActionType } from "@/core/data/audio-events";
import type { Structure, Action } from "@/lib/game/types";
import { getTranslatedText } from "@/lib/utils";
import { logger } from "@/lib/logger";

import { GameLayoutNarrative } from "./game-layout-narrative";
import { GameLayoutHud } from "./game-layout-hud";
import { GameLayoutControls, FloatingJoystick } from "./game-layout-controls";
import { GameLayoutDialogs } from "./game-layout-dialogs";
import type { GameLayoutProps, ContextAction } from "./game-layout.types";

/**
 * Main game UI layout orchestrator - coordinates all game panels and popups.
 *
 * @remarks
 * This is the top-level game UI orchestrator that:
 * - Initializes useGameEngine hook (handles all game logic)
 * - Manages UI state (popup visibility, layout detection, keyboard bindings)
 * - Renders sub-components: Narrative, HUD, Controls, Dialogs
 * - Implements responsive layout for mobile/desktop/landscape
 * - Shows floating Joystick on mobile devices
 *
 * **Responsive Layout:**
 * - **Mobile Portrait:** Narrative (bottom), HUD/Minimap (top), Joystick (floating)
 * - **Mobile Landscape:** Narrative (left), HUD/Minimap (right), Joystick (floating)
 * - **Desktop:** Narrative (left), HUD/Minimap (right), Action bar (bottom)
 *
 * **State Management:**
 * All UI state is declared here and passed to sub-components via props.
 * Game logic is delegated entirely to useGameEngine hook.
 *
 * @param {GameLayoutProps} props - Configuration with `gameSlot` for save slot selection
 * @returns {React.ReactNode} Complete game UI interface
 */
export default function GameLayout(props: GameLayoutProps) {
    // Guard: validate game slot parameter
    if (typeof props.gameSlot !== "number" || isNaN(props.gameSlot) || props.gameSlot < 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-600">
                <h2>Invalid or missing game slot.</h2>
                <p>Please return to the main menu and select a valid save slot.</p>
            </div>
        );
    }

    const { t, language } = useLanguage();
    const { settings, setSettings } = useSettings();
    const audio = useAudio();

    // Idle warning hook
    useIdleWarning({
        pauseGameIdleProgression: settings?.pauseGameIdleProgression,
        idleWarningThresholdMs: settings?.idleWarningThresholdMs,
    });

    // ===== LAYOUT DETECTION (Mobile / Desktop / Landscape) =====
    const [isDesktop, setIsDesktop] = useState(false);
    const [showNarrativeDesktop, setShowNarrativeDesktop] = useState(true);

    useEffect(() => {
        const checkLayout = () => {
            if (typeof window === "undefined") return;
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Desktop: width >= 1024 OR landscape mode (width > height)
            const isLandscape = width > height && width > 480;
            const isLargeScreen = width >= 1024;
            setIsDesktop(isLargeScreen || isLandscape);
        };

        checkLayout();
        window.addEventListener("resize", checkLayout);
        window.addEventListener("orientationchange", checkLayout);
        return () => {
            window.removeEventListener("resize", checkLayout);
            window.removeEventListener("orientationchange", checkLayout);
        };
    }, []);

    // ===== GAME ENGINE =====
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
        handleEquipItem,
        handleUnequipItem,
        handleWaitTick,
        handleDropItem,
        handleReturnToMenu,
    } = useGameEngine(props);

    // ===== ANIMATION TRACKING REFS =====
    const prevAnimatingRefForLayout = useRef<boolean>(Boolean(isAnimatingMove));
    const holdCenterUntilRef = useRef<number>(0);
    const animationStartTimeRef = useRef<number>(0);
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
                animationStartTimeRef.current = Date.now() + 50;
            }
            if (prevAnimatingRefForLayout.current && !isAnimatingMove) {
                holdCenterUntilRef.current = Date.now() + 350;
            }
            prevAnimatingRefForLayout.current = Boolean(isAnimatingMove);
        } catch { }
    }, [isAnimatingMove]);

    // ===== POPUP STATE =====
    const [isStatusOpen, setStatusOpen] = useState(false);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [isCraftingOpen, setCraftingOpen] = useState(false);
    const [isBuildingOpen, setBuildingOpen] = useState(false);
    const [isFusionOpen, setFusionOpen] = useState(false);
    const [isFullMapOpen, setIsFullMapOpen] = useState(false);
    const [isTutorialOpen, setTutorialOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [showInstallPopup, setShowInstallPopup] = useState(false);
    const [isAvailableActionsOpen, setAvailableActionsOpen] = useState(false);
    const [isCustomDialogOpen, setCustomDialogOpen] = useState(false);
    const [customDialogValue, setCustomDialogValue] = useState("");
    const [isPickupDialogOpen, setPickupDialogOpen] = useState(false);
    const [selectedPickupIds, setSelectedPickupIds] = useState<number[]>([]);
    const [isCookingOpen, setCookingOpen] = useState(false);

    // ===== TOGGLE HANDLERS WITH AUDIO FEEDBACK =====
    const handleStatusToggle = useCallback(() => {
        setStatusOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    const handleInventoryToggle = useCallback(() => {
        setInventoryOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    const handleCraftingToggle = useCallback(() => {
        setCraftingOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    const handleCookingToggle = useCallback(() => {
        setCookingOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    const handleMapToggle = useCallback(() => {
        setIsFullMapOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    const handleTutorialToggle = useCallback(() => {
        setTutorialOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    const handleSettingsToggle = useCallback(() => {
        setSettingsOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    const handleBuildingToggle = useCallback(() => {
        setBuildingOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    const handleFusionToggle = useCallback(() => {
        setFusionOpen((prev) => {
            if (prev) audio.playSfxForAction(AudioActionType.UI_CANCEL);
            else audio.playSfxForAction(AudioActionType.UI_CONFIRM);
            return !prev;
        });
    }, [audio]);

    // ===== KEYBOARD BINDINGS =====
    const handleActionClick = useCallback(
        (actionId: number) => {
            handleAction(actionId);
        },
        [handleAction]
    );

    const pickUpActions = (currentChunk?.actions || []).filter(
        (a: Action) => a.textKey === "pickUpAction_item"
    );
    const otherActions = (currentChunk?.actions || []).filter(
        (a: Action) => a.textKey !== "pickUpAction_item"
    );

    useKeyboardBindings({
        handlers: {
            move: (dir: "north" | "south" | "west" | "east") => handleMove(dir),
            attack: () => handleAttack(),
            wait: () => handleWaitTick(),
            openInventory: () => handleInventoryToggle(),
            openStatus: () => handleStatusToggle(),
            openMap: () => handleMapToggle(),
            openCrafting: () => handleCraftingToggle(),
            customAction: () => setCustomDialogOpen(true),
            pickUp: () => {
                setPickupDialogOpen(true);
                setSelectedPickupIds([]);
            },
            hotkey: (index: number) => {
                try {
                    const idx = index - 1;
                    const skill = playerStats?.skills?.[idx];
                    if (skill) {
                        const skillName = getTranslatedText(skill.name, language, t);
                        handleUseSkill(skillName);
                        return;
                    }
                    const action = otherActions[idx] || pickUpActions[idx];
                    if (action) {
                        handleAction(action.id);
                    }
                } catch (e: any) {
                    logger.debug("[GameLayout] hotkey error", e);
                }
            },
        },
        popupOpen: isSettingsOpen || isBuildingOpen || isFusionOpen || isTutorialOpen,
        focusCustomActionInput: () => { },
        enabled: true,
        movementWhileTyping: true,
    });

    // ===== MINIMAP GRID GENERATION =====
    const generateMapGrid = useCallback(() => {
        if (!isLoaded || !finalWorldSetup) return [];

        const visibilityRadius = 1;
        const minimapViewportSize = (settings?.minimapViewportSize as 5 | 7 | 9) || 5;
        const displayRadius = Math.floor(minimapViewportSize / 2);
        const size = displayRadius * 2 + 1;
        const grid = Array.from({ length: size }, () => Array(size).fill(null));

        const now = Date.now();
        const shouldUseVisualCenter =
            (isAnimatingMoveRef.current &&
                now > animationStartTimeRef.current &&
                (visualMoveToRef.current || visualPlayerPositionRef.current)) ||
            ((visualPlayerPositionRef.current || visualMoveToRef.current) &&
                holdCenterUntilRef.current > now);
        const playerForGrid = shouldUseVisualCenter
            ? visualMoveToRef.current || visualPlayerPositionRef.current || playerPosition
            : playerPosition;

        for (let gy = 0; gy < size; gy++) {
            for (let gx = 0; gx < size; gx++) {
                const wx = playerForGrid.x - displayRadius + gx;
                const wy = playerForGrid.y + displayRadius - gy;
                const chunkKey = `${wx},${wy}`;
                const chunk = world[chunkKey];

                if (chunk) {
                    const refPos = playerForGrid || playerPosition;
                    const distanceFromPlayer = Math.max(
                        Math.abs(wx - refPos.x),
                        Math.abs(wy - refPos.y)
                    );

                    if (distanceFromPlayer <= visibilityRadius) {
                        if (!chunk.explored) chunk.explored = true;
                        chunk.lastVisited = turnRef.current;
                    }
                }

                grid[gy][gx] = chunk;
            }
        }
        return grid;
    }, [
        world,
        playerPosition.x,
        playerPosition.y,
        finalWorldSetup,
        isLoaded,
        settings?.minimapViewportSize,
    ]);

    const memoizedGrid = useMemo(() => generateMapGrid(), [generateMapGrid]);
    const previousGridRef = useRef(memoizedGrid);
    const gridToPass = isAnimatingMoveRef.current ? previousGridRef.current : memoizedGrid;

    useEffect(() => {
        if (!isAnimatingMoveRef.current) {
            previousGridRef.current = memoizedGrid;
        }
    }, [memoizedGrid]);

    // ===== CONTEXT SENSITIVE ACTION =====
    const restingPlace = currentChunk?.structures?.find((s: Structure) => s.restEffect);

    const getContextSensitiveAction = useCallback((): ContextAction => {
        if (currentChunk?.enemy) {
            return {
                type: "attack",
                label: t("attack") || "Attack",
                handler: handleAttack,
                icon: "⚔️",
            };
        }
        if (pickUpActions.length > 0) {
            return {
                type: "pickup",
                label: t("pickUpItems") || "Pick Up",
                handler: () => {
                    setPickupDialogOpen(true);
                    setSelectedPickupIds([]);
                },
                icon: "🎒",
            };
        }
        if (restingPlace) {
            return {
                type: "rest",
                label: t("rest") || "Rest",
                handler: handleRest,
                icon: "🛌",
            };
        }
        if (otherActions.length > 0) {
            const action = otherActions[0];
            const actionText = getTranslatedText(
                { key: action.textKey, params: action.params },
                language,
                t
            );
            return {
                type: "interact",
                label: actionText,
                handler: () => handleActionClick(action.id),
                icon: "💬",
            };
        }
        return {
            type: "explore",
            label: t("explore") || "Explore",
            handler: () => { },
            icon: "🔍",
        };
    }, [
        currentChunk?.enemy,
        pickUpActions.length,
        restingPlace,
        otherActions.length,
        t,
        handleAttack,
        handleRest,
        handleActionClick,
        language,
    ]);

    const contextAction = getContextSensitiveAction();

    // ===== LOADING STATE =====
    if (!isLoaded || !finalWorldSetup || !currentChunk) {
        return (
            <div className="flex items-center justify-center min-h-dvh bg-background text-foreground">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="mt-2">{t("loadingAdventure")}</p>
                </div>
            </div>
        );
    }

    // ===== RENDER =====
    return (
        <TooltipProvider>
            <div className="flex flex-col md:flex-row h-dvh bg-background text-foreground font-body overflow-hidden relative">
                {/* HP Vignette */}
                {(Number(playerStats.hp ?? 0) / Number(playerStats.maxHp ?? 100)) * 100 < 30 && (
                    <div
                        className="fixed inset-0 pointer-events-none z-[15]"
                        style={{
                            animation: "heartbeat-vignette 1.5s infinite",
                            background: "radial-gradient(circle, transparent 60%, rgba(180, 0, 0, 0.4) 100%)",
                        }}
                    />
                )}

                {/* Floating Joystick (Mobile only) */}
                {!isDesktop && !isGameOver && (
                    <FloatingJoystick
                        onMove={(dir) => {
                            if (dir) handleMove(dir);
                        }}
                        onInteract={() => {
                            contextAction.handler();
                            if (typeof window !== "undefined" && navigator.vibrate) {
                                navigator.vibrate(20);
                            }
                        }}
                        interactIcon={contextAction.icon}
                        size={140}
                    />
                )}

                {/* Narrative Panel */}
                <GameLayoutNarrative
                    narrativeLog={narrativeLog}
                    worldName={getTranslatedText(finalWorldSetup.worldName, language, t)}
                    isDesktop={isDesktop}
                    isLoading={isLoading}
                    showNarrativeDesktop={showNarrativeDesktop}
                    onToggleNarrativeDesktop={setShowNarrativeDesktop}
                    onOpenTutorial={handleTutorialToggle}
                    onOpenSettings={handleSettingsToggle}
                    onReturnToMenu={handleReturnToMenu}
                    onOpenStatus={handleStatusToggle}
                    onOpenInventory={handleInventoryToggle}
                    onOpenCrafting={handleCraftingToggle}
                    onOpenBuilding={handleBuildingToggle}
                    onOpenFusion={handleFusionToggle}
                    onOpenCooking={handleCookingToggle}
                />

                {/* HUD Panel */}
                <GameLayoutHud
                    playerStats={playerStats}
                    currentChunk={currentChunk}
                    gameTime={gameTime}
                    isDesktop={isDesktop}
                    weatherZones={weatherZones}
                    grid={gridToPass}
                    playerPosition={playerPosition}
                    visualPlayerPosition={visualPlayerPosition}
                    isAnimatingMove={isAnimatingMove}
                    visualMoveFrom={visualMoveFrom}
                    visualMoveTo={visualMoveTo}
                    visualJustLanded={visualJustLanded}
                    turn={turn}
                    biomeDefinitions={biomeDefinitions}
                    settings={settings}
                    language={language}
                    t={t}
                    onMapSizeChange={(size) => setSettings({ ...settings, minimapViewportSize: size })}
                />

                {/* Controls */}
                <GameLayoutControls
                    isDesktop={isDesktop}
                    isLoading={isLoading}
                    playerStats={playerStats}
                    contextAction={contextAction}
                    pickUpActions={pickUpActions}
                    otherActions={otherActions}
                    language={language}
                    t={t}
                    onMove={handleMove}
                    onInteract={() => {
                        contextAction.handler();
                        if (typeof window !== "undefined" && navigator.vibrate) {
                            navigator.vibrate(20);
                        }
                    }}
                    onUseSkill={handleUseSkill}
                    onActionClick={handleActionClick}
                    onOpenPickup={() => {
                        setPickupDialogOpen(true);
                        setSelectedPickupIds([]);
                    }}
                    onOpenAvailableActions={() => setAvailableActionsOpen(true)}
                    onOpenCustomDialog={() => setCustomDialogOpen(true)}
                    onOpenStatus={handleStatusToggle}
                    onOpenInventory={handleInventoryToggle}
                    onOpenCrafting={handleCraftingToggle}
                    onOpenBuilding={handleBuildingToggle}
                    onOpenFusion={handleFusionToggle}
                    onOpenCooking={handleCookingToggle}
                />

                {/* Dialogs */}
                <GameLayoutDialogs
                    isStatusOpen={isStatusOpen}
                    isInventoryOpen={isInventoryOpen}
                    isCraftingOpen={isCraftingOpen}
                    isBuildingOpen={isBuildingOpen}
                    isFusionOpen={isFusionOpen}
                    isFullMapOpen={isFullMapOpen}
                    isTutorialOpen={isTutorialOpen}
                    isSettingsOpen={isSettingsOpen}
                    showInstallPopup={showInstallPopup}
                    isAvailableActionsOpen={isAvailableActionsOpen}
                    isCustomDialogOpen={isCustomDialogOpen}
                    isPickupDialogOpen={isPickupDialogOpen}
                    isCookingOpen={isCookingOpen}
                    onStatusOpenChange={setStatusOpen}
                    onInventoryOpenChange={setInventoryOpen}
                    onCraftingOpenChange={setCraftingOpen}
                    onBuildingOpenChange={setBuildingOpen}
                    onFusionOpenChange={setFusionOpen}
                    onFullMapOpenChange={setIsFullMapOpen}
                    onTutorialOpenChange={setTutorialOpen}
                    onSettingsOpenChange={setSettingsOpen}
                    onInstallPopupOpenChange={setShowInstallPopup}
                    onAvailableActionsOpenChange={setAvailableActionsOpen}
                    onCustomDialogOpenChange={setCustomDialogOpen}
                    onPickupDialogOpenChange={setPickupDialogOpen}
                    onCookingOpenChange={setCookingOpen}
                    playerStats={playerStats}
                    currentChunk={currentChunk}
                    world={world}
                    pickUpActions={pickUpActions}
                    otherActions={otherActions}
                    selectedPickupIds={selectedPickupIds}
                    customDialogValue={customDialogValue}
                    isLoading={isLoading}
                    onToggleStatus={handleStatusToggle}
                    onToggleInventory={handleInventoryToggle}
                    onToggleCrafting={handleCraftingToggle}
                    onToggleMap={handleMapToggle}
                    onActionClick={handleActionClick}
                    onCustomDialogSubmit={() => {
                        if (customDialogValue.trim()) {
                            handleCustomAction(customDialogValue);
                            setCustomDialogValue("");
                        }
                        setCustomDialogOpen(false);
                    }}
                    onTogglePickupSelection={(id: number) => {
                        setSelectedPickupIds((prev) =>
                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                        );
                    }}
                    onPickupConfirm={() => {
                        if (selectedPickupIds.length === 0) {
                            setPickupDialogOpen(false);
                            return;
                        }
                        selectedPickupIds.forEach((actionId) => {
                            try {
                                handleAction(actionId);
                            } catch (error: any) {
                                logger.error("Pickup failed", { actionId, error });
                            }
                        });
                        setSelectedPickupIds([]);
                        setPickupDialogOpen(false);
                    }}
                    onEquipItem={handleEquipItem}
                    onUnequipItem={handleUnequipItem}
                    onDropItem={handleDropItem}
                    onItemUsed={handleItemUsed}
                    onCraft={handleCraft}
                    onBuild={handleBuild}
                    onFuse={handleFuseItems}
                    onToggleBuilding={handleBuildingToggle}
                    onToggleFusion={handleFusionToggle}
                    onToggleTutorial={handleTutorialToggle}
                    onToggleSettings={handleSettingsToggle}
                    onReturnToMenu={handleReturnToMenu}
                    onCustomDialogValueChange={setCustomDialogValue}
                    gameSlot={props.gameSlot}
                    language={language}
                    t={t}
                    recipes={recipes}
                    buildableStructures={buildableStructures}
                    customItemDefinitions={customItemDefinitions}
                    finalWorldSetup={finalWorldSetup}
                    biomeDefinitions={biomeDefinitions}
                />
            </div>
        </TooltipProvider>
    );
}
