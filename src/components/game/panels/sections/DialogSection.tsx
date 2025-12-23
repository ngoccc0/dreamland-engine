'use client';

import React, { useMemo } from 'react';
import { GameLayoutDialogs } from '../game-layout-dialogs';
import { useDialogData } from '@/hooks/use-dialog-data';
import type { GameLayoutDialogsProps } from '../game-layout.types';

/**
 * DialogSection Smart Container (Memoized)
 *
 * @remarks
 * **Purpose:**
 * Smart Container managing all game dialogs with independent re-rendering.
 * Subscribes to useDialogData hook for all dialog visibility states.
 * Memoized to prevent parent prop changes triggering re-render.
 *
 * **Responsibilities:**
 * - Centralize all dialog/popup rendering
 * - Subscribe to dialog visibility states from store via useDialogData
 * - Handle dialog open/close callbacks
 * - Lazy-load heavy dialog components for performance
 *
 * **Managed Dialogs:**
 * - Status (character info & equipment)
 * - Inventory (items management)
 * - Crafting (recipe selection & crafting)
 * - Building (structure placement)
 * - Fusion (item combining)
 * - Map (full world map)
 * - Tutorial (skills & help)
 * - Settings (user preferences)
 * - Custom (dynamic dialogs)
 * - Pickup (multi-item selection)
 * - Cooking (food preparation)
 * - Install (PWA prompt)
 * - Available Actions (context menu)
 *
 * **Data Flow:**
 * GameLayout → DialogSection → useDialogData → renders GameLayoutDialogs
 *
 * **Re-render Optimization:**
 * Only re-renders when dialog visibility states change.
 * Does NOT re-render on:
 * - Player HP/hunger/energy changes
 * - Position updates
 * - Inventory changes (unless inventory dialog open)
 *
 * @param props - GameLayout dialog handlers and data
 * @returns React component rendering all game dialogs
 */
export const DialogSection = React.memo(function DialogSection(props: GameLayoutDialogsProps) {
    // Subscribe to all dialog visibility states via useDialogData
    // Single subscription with useShallow instead of 13 individual ones
    const {
        isStatusOpen,
        isInventoryOpen,
        isCraftingOpen,
        isBuildingOpen,
        isFusionOpen,
        isFullMapOpen,
        isTutorialOpen,
        isSettingsOpen,
        showInstallPopup,
        isAvailableActionsOpen,
        isCustomDialogOpen,
        isPickupDialogOpen,
        isCookingOpen,
    } = useDialogData();

    // Memoize dialog handlers to maintain stability
    const memoizedHandlers = useMemo(
        () => ({
            onStatusOpenChange: props.onStatusOpenChange,
            onInventoryOpenChange: props.onInventoryOpenChange,
            onCraftingOpenChange: props.onCraftingOpenChange,
            onBuildingOpenChange: props.onBuildingOpenChange,
            onFusionOpenChange: props.onFusionOpenChange,
            onFullMapOpenChange: props.onFullMapOpenChange,
            onTutorialOpenChange: props.onTutorialOpenChange,
            onSettingsOpenChange: props.onSettingsOpenChange,
            onInstallPopupOpenChange: props.onInstallPopupOpenChange,
            onAvailableActionsOpenChange: props.onAvailableActionsOpenChange,
            onCustomDialogOpenChange: props.onCustomDialogOpenChange,
            onPickupDialogOpenChange: props.onPickupDialogOpenChange,
            onCookingOpenChange: props.onCookingOpenChange,
            onToggleStatus: props.onToggleStatus,
            onToggleInventory: props.onToggleInventory,
            onToggleCrafting: props.onToggleCrafting,
            onToggleMap: props.onToggleMap,
            onActionClick: props.onActionClick,
            onCustomDialogSubmit: props.onCustomDialogSubmit,
            onTogglePickupSelection: props.onTogglePickupSelection,
            onPickupConfirm: props.onPickupConfirm,
            onEquipItem: props.onEquipItem,
            onUnequipItem: props.onUnequipItem,
            onDropItem: props.onDropItem,
            onItemUsed: props.onItemUsed,
            onCraft: props.onCraft,
            onBuild: props.onBuild,
            onFuse: props.onFuse,
            onToggleTutorial: props.onToggleTutorial,
            onToggleSettings: props.onToggleSettings,
            onToggleFusion: props.onToggleFusion,
            onToggleBuilding: props.onToggleBuilding,
            onReturnToMenu: props.onReturnToMenu,
            onCustomDialogValueChange: props.onCustomDialogValueChange,
        }),
        [
            props.onStatusOpenChange,
            props.onInventoryOpenChange,
            props.onCraftingOpenChange,
            props.onBuildingOpenChange,
            props.onFusionOpenChange,
            props.onFullMapOpenChange,
            props.onTutorialOpenChange,
            props.onSettingsOpenChange,
            props.onInstallPopupOpenChange,
            props.onAvailableActionsOpenChange,
            props.onCustomDialogOpenChange,
            props.onPickupDialogOpenChange,
            props.onCookingOpenChange,
            props.onToggleStatus,
            props.onToggleInventory,
            props.onToggleCrafting,
            props.onToggleMap,
            props.onActionClick,
            props.onCustomDialogSubmit,
            props.onTogglePickupSelection,
            props.onPickupConfirm,
            props.onEquipItem,
            props.onUnequipItem,
            props.onDropItem,
            props.onItemUsed,
            props.onCraft,
            props.onBuild,
            props.onFuse,
            props.onToggleTutorial,
            props.onToggleSettings,
            props.onToggleFusion,
            props.onToggleBuilding,
            props.onReturnToMenu,
            props.onCustomDialogValueChange,
        ]
    );

    return (
        <GameLayoutDialogs
            {...props}
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
            {...memoizedHandlers}
        />
    );
});
