"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Loader2 } from "./icons";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/context/language-context";
import { useSettings } from "@/context/settings-context";
import useKeyboardBindings from "@/hooks/use-keyboard-bindings";
import { useGameEngine } from "@/hooks/use-game-engine";
import { useIdleWarning } from "@/hooks/useIdleWarning";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useDialogToggles } from "@/hooks/use-dialog-toggles";
import { useMinimapGrid } from "@/hooks/use-minimap-grid";
import { useContextAction } from "@/hooks/use-context-action";
import { useUIStore } from "@/store";
import { AudioActionType } from "@/core/data/audio-events";
import type { Structure, Action } from "@/lib/game/types";
import { getTranslatedText } from "@/lib/utils";
import { logger } from "@/lib/logger";

import { GameLayoutContent } from "./game-layout-content";
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

    // Idle warning hook
    useIdleWarning({
        pauseGameIdleProgression: settings?.pauseGameIdleProgression,
        idleWarningThresholdMs: settings?.idleWarningThresholdMs,
    });

    // Layout detection for mobile/desktop/landscape
    const { isDesktop } = useResponsiveLayout();

    // Dialog toggles with audio feedback
    const {
        handleStatusToggle,
        handleInventoryToggle,
        handleCraftingToggle,
        handleMapToggle,
        handleTutorialToggle,
        handleSettingsToggle,
        handleBuildingToggle,
        handleFusionToggle,
    } = useDialogToggles();

    // UI state from store
    const {
        dialogs: {
            statusOpen: isStatusOpen,
            inventoryOpen: isInventoryOpen,
            craftingOpen: isCraftingOpen,
            buildingOpen: isBuildingOpen,
            fusionOpen: isFusionOpen,
            mapOpen: isFullMapOpen,
            skillsOpen: isTutorialOpen,
            settingsOpen: isSettingsOpen,
        },
        openDialog,
        closeDialog,
        setShowNarrativePanel,
        showNarrativePanel: showNarrativeDesktop,
    } = useUIStore();

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
    const visualMoveToRef = useRef<{ x: number; y: number } | null>(visualMoveTo);
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

    // ===== POPUP STATE & DIALOG MANAGEMENT =====
    const [showInstallPopup, setShowInstallPopup] = useState(false);
    const [isAvailableActionsOpen, setAvailableActionsOpen] = useState(false);
    const [isCustomDialogOpen, setCustomDialogOpen] = useState(false);
    const [customDialogValue, setCustomDialogValue] = useState("");
    const [isPickupDialogOpen, setPickupDialogOpen] = useState(false);
    const [selectedPickupIds, setSelectedPickupIds] = useState<number[]>([]);
    const [isCookingOpen, setCookingOpen] = useState(false);

    // ===== COOKING TOGGLE (Local state) =====
    const handleCookingToggle = useCallback(() => {
        setCookingOpen((prev) => !prev);
    }, []);

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
    const { gridToPass } = useMinimapGrid({
        world,
        playerPosition,
        visualPlayerPosition,
        isAnimatingMove,
        visualMoveTo,
        turn,
        finalWorldSetup,
        isLoaded,
        minimapViewportSize: (settings?.minimapViewportSize as 5 | 7 | 9) || 5,
        animationRefs: {
            isAnimatingMoveRef,
            visualMoveToRef,
            visualPlayerPositionRef,
            turnRef,
            holdCenterUntilRef,
            animationStartTimeRef,
        },
    });

    // ===== CONTEXT SENSITIVE ACTION =====
    const contextAction = useContextAction({
        currentChunk,
        pickUpActions,
        otherActions,
        language,
        t,
        getTranslatedText,
        handleAttack,
        handleRest,
        handleActionClick,
    });

    // Update context action to use dialog handler
    const contextActionWithDialog: ContextAction =
        contextAction.type === 'pickup'
            ? {
                ...contextAction,
                handler: () => {
                    setPickupDialogOpen(true);
                    setSelectedPickupIds([]);
                },
            }
            : contextAction;

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
        <GameLayoutContent
            gameSlot={props.gameSlot}
            // Game state
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
            narrativeLog={narrativeLog}
            isLoading={isLoading}
            isGameOver={isGameOver}
            finalWorldSetup={finalWorldSetup}
            world={world}
            recipes={recipes}
            buildableStructures={buildableStructures}
            customItemDefinitions={customItemDefinitions}
            biomeDefinitions={biomeDefinitions}
            pickUpActions={pickUpActions}
            otherActions={otherActions}
            selectedPickupIds={selectedPickupIds}
            turn={turn}
            // UI state
            isStatusOpen={isStatusOpen}
            isInventoryOpen={isInventoryOpen}
            isCraftingOpen={isCraftingOpen}
            isBuildingOpen={isBuildingOpen}
            isFusionOpen={isFusionOpen}
            isFullMapOpen={isFullMapOpen}
            isTutorialOpen={isTutorialOpen}
            isSettingsOpen={isSettingsOpen}
            showNarrativeDesktop={showNarrativeDesktop}
            showInstallPopup={showInstallPopup}
            isAvailableActionsOpen={isAvailableActionsOpen}
            isCustomDialogOpen={isCustomDialogOpen}
            isPickupDialogOpen={isPickupDialogOpen}
            customDialogValue={customDialogValue}
            isCookingOpen={isCookingOpen}
            // Language & settings
            language={language}
            t={t}
            settings={settings}
            // Context action
            contextAction={contextActionWithDialog}
            // Handlers
            onMove={handleMove}
            onInteract={() => {
                contextActionWithDialog.handler();
                if (typeof window !== "undefined" && navigator.vibrate) {
                    navigator.vibrate(20);
                }
            }}
            onMapSizeChange={(size) => setSettings({ ...settings, minimapViewportSize: size })}
            onToggleNarrativeDesktop={setShowNarrativePanel}
            onOpenTutorial={handleTutorialToggle}
            onOpenSettings={handleSettingsToggle}
            onReturnToMenu={handleReturnToMenu}
            onOpenStatus={handleStatusToggle}
            onOpenInventory={handleInventoryToggle}
            onOpenCrafting={handleCraftingToggle}
            onOpenBuilding={handleBuildingToggle}
            onOpenFusion={handleFusionToggle}
            onOpenCooking={handleCookingToggle}
            onStatusOpenChange={(open) => {
                if (open) openDialog("statusOpen");
                else closeDialog("statusOpen");
            }}
            onInventoryOpenChange={(open) => {
                if (open) openDialog("inventoryOpen");
                else closeDialog("inventoryOpen");
            }}
            onCraftingOpenChange={(open) => {
                if (open) openDialog("craftingOpen");
                else closeDialog("craftingOpen");
            }}
            onBuildingOpenChange={(open) => {
                if (open) openDialog("buildingOpen");
                else closeDialog("buildingOpen");
            }}
            onFusionOpenChange={(open) => {
                if (open) openDialog("fusionOpen");
                else closeDialog("fusionOpen");
            }}
            onFullMapOpenChange={(open) => {
                if (open) openDialog("mapOpen");
                else closeDialog("mapOpen");
            }}
            onTutorialOpenChange={(open) => {
                if (open) openDialog("skillsOpen");
                else closeDialog("skillsOpen");
            }}
            onSettingsOpenChange={(open) => {
                if (open) openDialog("settingsOpen");
                else closeDialog("settingsOpen");
            }}
            onInstallPopupOpenChange={setShowInstallPopup}
            onAvailableActionsOpenChange={setAvailableActionsOpen}
            onCustomDialogOpenChange={setCustomDialogOpen}
            onPickupDialogOpenChange={setPickupDialogOpen}
            onCookingOpenChange={setCookingOpen}
            onUseSkill={handleUseSkill}
            onActionClick={handleActionClick}
            onOpenPickup={() => {
                setPickupDialogOpen(true);
                setSelectedPickupIds([]);
            }}
            onOpenAvailableActions={() => setAvailableActionsOpen(true)}
            onOpenCustomDialog={() => setCustomDialogOpen(true)}
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
            onCustomDialogValueChange={setCustomDialogValue}
        />
    );
}
