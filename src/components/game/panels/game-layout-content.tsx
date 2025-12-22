"use client";

import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingJoystick } from "./game-layout-controls";
import { GameLayoutNarrative } from "./game-layout-narrative";
import { GameLayoutHud } from "./game-layout-hud";
import { GameLayoutControls } from "./game-layout-controls";
import { GameLayoutDialogs } from "./game-layout-dialogs";
import type { GameLayoutContentProps } from "./game-layout.types";

/**
 * Dumb Component: GameLayoutContent
 *
 * @remarks
 * Pure JSX component that renders the game layout structure.
 * All logic is passed as props from parent (GameLayout Smart container).
 * This component is ONLY responsible for rendering the UI structure.
 *
 * **Wrapped in React.memo** for granular re-renders only when props change.
 */
export const GameLayoutContent = React.memo(function GameLayoutContent({
    // Game state
    playerStats,
    currentChunk,
    gameTime,
    isDesktop,
    weatherZones,
    grid,
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
    world,
    recipes,
    buildableStructures,
    customItemDefinitions,
    biomeDefinitions,
    pickUpActions,
    otherActions,
    selectedPickupIds,
    turn,
    
    // UI state
    isStatusOpen,
    isInventoryOpen,
    isCraftingOpen,
    isBuildingOpen,
    isFusionOpen,
    isFullMapOpen,
    isTutorialOpen,
    isSettingsOpen,
    showNarrativeDesktop,
    showInstallPopup,
    isAvailableActionsOpen,
    isCustomDialogOpen,
    isPickupDialogOpen,
    customDialogValue,
    isCookingOpen,
    
    // Language & settings
    language,
    t,
    settings,
    
    // Context action
    contextAction,
    
    // Handlers
    onMove,
    onInteract,
    onMapSizeChange,
    onToggleNarrativeDesktop,
    onOpenTutorial,
    onOpenSettings,
    onReturnToMenu,
    onOpenStatus,
    onOpenInventory,
    onOpenCrafting,
    onOpenBuilding,
    onOpenFusion,
    onOpenCooking,
    onStatusOpenChange,
    onInventoryOpenChange,
    onCraftingOpenChange,
    onBuildingOpenChange,
    onFusionOpenChange,
    onFullMapOpenChange,
    onTutorialOpenChange,
    onSettingsOpenChange,
    onInstallPopupOpenChange,
    onAvailableActionsOpenChange,
    onCustomDialogOpenChange,
    onPickupDialogOpenChange,
    onCookingOpenChange,
    onUseSkill,
    onActionClick,
    onOpenPickup,
    onOpenAvailableActions,
    onOpenCustomDialog,
    onCustomDialogSubmit,
    onTogglePickupSelection,
    onPickupConfirm,
    onEquipItem,
    onUnequipItem,
    onDropItem,
    onItemUsed,
    onCraft,
    onBuild,
    onFuse,
    onCustomDialogValueChange,
    
    // Props
    gameSlot,
}: GameLayoutContentProps) {
    const getTranslatedText = (text: any, lang: string, translator: any) => 
        text?.translations?.[lang] ?? text?.en ?? text ?? "";

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
                            if (dir) onMove(dir);
                        }}
                        onInteract={onInteract}
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
                    onToggleNarrativeDesktop={onToggleNarrativeDesktop}
                    onOpenTutorial={onOpenTutorial}
                    onOpenSettings={onOpenSettings}
                    onReturnToMenu={onReturnToMenu}
                    onOpenStatus={onOpenStatus}
                    onOpenInventory={onOpenInventory}
                    onOpenCrafting={onOpenCrafting}
                    onOpenBuilding={onOpenBuilding}
                    onOpenFusion={onOpenFusion}
                    onOpenCooking={onOpenCooking}
                />

                {/* HUD Panel */}
                <GameLayoutHud
                    playerStats={playerStats}
                    currentChunk={currentChunk}
                    gameTime={gameTime}
                    isDesktop={isDesktop}
                    weatherZones={weatherZones}
                    grid={grid}
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
                    onMapSizeChange={onMapSizeChange}
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
                    onMove={onMove}
                    onInteract={onInteract}
                    onUseSkill={onUseSkill}
                    onActionClick={onActionClick}
                    onOpenPickup={onOpenPickup}
                    onOpenAvailableActions={onOpenAvailableActions}
                    onOpenCustomDialog={onOpenCustomDialog}
                    onOpenStatus={onOpenStatus}
                    onOpenInventory={onOpenInventory}
                    onOpenCrafting={onOpenCrafting}
                    onOpenBuilding={onOpenBuilding}
                    onOpenFusion={onOpenFusion}
                    onOpenCooking={onOpenCooking}
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
                    onStatusOpenChange={onStatusOpenChange}
                    onInventoryOpenChange={onInventoryOpenChange}
                    onCraftingOpenChange={onCraftingOpenChange}
                    onBuildingOpenChange={onBuildingOpenChange}
                    onFusionOpenChange={onFusionOpenChange}
                    onFullMapOpenChange={onFullMapOpenChange}
                    onTutorialOpenChange={onTutorialOpenChange}
                    onSettingsOpenChange={onSettingsOpenChange}
                    onInstallPopupOpenChange={onInstallPopupOpenChange}
                    onAvailableActionsOpenChange={onAvailableActionsOpenChange}
                    onCustomDialogOpenChange={onCustomDialogOpenChange}
                    onPickupDialogOpenChange={onPickupDialogOpenChange}
                    onCookingOpenChange={onCookingOpenChange}
                    playerStats={playerStats}
                    currentChunk={currentChunk}
                    world={world}
                    pickUpActions={pickUpActions}
                    otherActions={otherActions}
                    selectedPickupIds={selectedPickupIds}
                    customDialogValue={customDialogValue}
                    isLoading={isLoading}
                    onToggleStatus={onOpenStatus}
                    onToggleInventory={onOpenInventory}
                    onToggleCrafting={onOpenCrafting}
                    onToggleMap={() => {}}
                    onActionClick={onActionClick}
                    onCustomDialogSubmit={onCustomDialogSubmit}
                    onTogglePickupSelection={onTogglePickupSelection}
                    onPickupConfirm={onPickupConfirm}
                    onEquipItem={onEquipItem}
                    onUnequipItem={onUnequipItem}
                    onDropItem={onDropItem}
                    onItemUsed={onItemUsed}
                    onCraft={onCraft}
                    onBuild={onBuild}
                    onFuse={onFuse}
                    onToggleBuilding={onBuildingOpenChange}
                    onToggleFusion={onFusionOpenChange}
                    onToggleTutorial={onTutorialOpenChange}
                    onToggleSettings={onSettingsOpenChange}
                    onReturnToMenu={onReturnToMenu}
                    onCustomDialogValueChange={onCustomDialogValueChange}
                    gameSlot={gameSlot}
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
});

GameLayoutContent.displayName = "GameLayoutContent";
