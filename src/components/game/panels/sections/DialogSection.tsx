'use client';

import React, { useMemo } from 'react';
import { GameLayoutDialogs } from '../game-layout-dialogs';
import { useUIStore } from '@/store';
import type { GameLayoutDialogsProps } from '../game-layout.types';

/**
 * DialogSection Smart Container
 *
 * @remarks
 * **Purpose:**
 * Smart Container managing all game dialogs with independent re-rendering.
 * Subscribes to useUIStore for dialog visibility states.
 *
 * **Responsibilities:**
 * - Centralize all dialog/popup rendering
 * - Subscribe to dialog visibility states from store
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
 * GameLayout → DialogSection → subscribes to useUIStore → renders GameLayoutDialogs
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
export function DialogSection(props: GameLayoutDialogsProps) {
  // Subscribe to dialog visibility states - only re-render when these change
  const isStatusOpen = useUIStore((state) => state.dialogs.statusOpen);
  const isInventoryOpen = useUIStore((state) => state.dialogs.inventoryOpen);
  const isCraftingOpen = useUIStore((state) => state.dialogs.craftingOpen);
  const isBuildingOpen = useUIStore((state) => state.dialogs.buildingOpen);
  const isFusionOpen = useUIStore((state) => state.dialogs.fusionOpen);
  const isFullMapOpen = useUIStore((state) => state.dialogs.mapOpen);
  const isTutorialOpen = useUIStore((state) => state.dialogs.skillsOpen);
  const isSettingsOpen = useUIStore((state) => state.dialogs.settingsOpen);
  const showInstallPopup = useUIStore((state) => state.ephemeral.installPopupOpen);
  const isAvailableActionsOpen = useUIStore((state) => state.ephemeral.availableActionsOpen);
  const isCustomDialogOpen = useUIStore((state) => state.ephemeral.customDialogOpen);
  const isPickupDialogOpen = useUIStore((state) => state.ephemeral.pickupDialogOpen);
  const isCookingOpen = useUIStore((state) => state.dialogs.cookingOpen);

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
}
