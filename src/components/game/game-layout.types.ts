/**
 * Shared type definitions for game-layout components.
 *
 * @remarks
 * This file contains all prop interfaces and type definitions used across
 * game-layout.tsx and its sub-components to maintain consistency and reduce duplication.
 *
 * @packageDocumentation
 */

import type { ReactNode } from 'react';
import type { Action, NarrativeEntry } from '@/lib/game/types';
import type { TranslationKey } from '@/lib/core/i18n';

/**
 * Direction type for movement input.
 */
export type Direction = 'north' | 'south' | 'east' | 'west';

/**
 * Context-sensitive action configuration.
 */
export interface ContextAction {
    type: 'attack' | 'pickup' | 'rest' | 'interact' | 'explore';
    label: string;
    handler: () => void;
    icon?: ReactNode;
}

/**
 * Props for GameLayoutNarrative component.
 */
export interface GameLayoutNarrativeProps {
    narrativeLog: NarrativeEntry[];
    worldName: string;
    isDesktop: boolean;
    isLoading: boolean;
    showNarrativeDesktop: boolean;
    onToggleNarrativeDesktop: (show: boolean) => void;
    onOpenTutorial: () => void;
    onOpenSettings: () => void;
    onReturnToMenu: () => void;
    onOpenStatus: () => void;
    onOpenInventory: () => void;
    onOpenCrafting: () => void;
    onOpenBuilding: () => void;
    onOpenFusion: () => void;
    language?: string;
    t?: (key: TranslationKey, params?: Record<string, any>) => string;
}

/**
 * Props for GameLayoutHud component.
 */
export interface GameLayoutHudProps {
    playerStats: any;
    currentChunk: any;
    gameTime: number;
    isDesktop: boolean;
    weatherZones: Record<string, any>;
    grid: any[][];
    playerPosition: { x: number; y: number };
    visualPlayerPosition: { x: number; y: number };
    isAnimatingMove: boolean;
    visualMoveFrom: { x: number; y: number } | null;
    visualMoveTo: { x: number; y: number } | null;
    visualJustLanded: boolean;
    turn: number;
    biomeDefinitions: any;
    settings: any;
    language?: string;
    t?: (key: TranslationKey, params?: Record<string, any>) => string;
    onMapSizeChange: (size: 5 | 7 | 9) => void;
}

/**
 * Props for GameLayoutControls component.
 */
export interface GameLayoutControlsProps {
    isDesktop: boolean;
    isLoading: boolean;
    playerStats: any; // PlayerStats type
    contextAction: ContextAction;
    pickUpActions: Action[];
    otherActions: Action[];
    language: string;
    t: (key: TranslationKey, params?: Record<string, any>) => string;
    onMove: (direction: Direction) => void;
    onInteract: () => void;
    onUseSkill: (skillName: string) => void;
    onActionClick: (actionId: number) => void;
    onOpenPickup: () => void;
    onOpenAvailableActions: () => void;
    onOpenCustomDialog: () => void;
    onOpenStatus: () => void;
    onOpenInventory: () => void;
    onOpenCrafting: () => void;
    onOpenBuilding: () => void;
    onOpenFusion: () => void;
}

/**
 * Props for GameLayoutDialogs component.
 */
export interface GameLayoutDialogsProps {
    // Dialog visibility state
    isStatusOpen: boolean;
    isInventoryOpen: boolean;
    isCraftingOpen: boolean;
    isBuildingOpen: boolean;
    isFusionOpen: boolean;
    isFullMapOpen: boolean;
    isTutorialOpen: boolean;
    isSettingsOpen: boolean;
    showInstallPopup: boolean;
    isAvailableActionsOpen: boolean;
    isCustomDialogOpen: boolean;
    isPickupDialogOpen: boolean;

    // Dialog state handlers
    onStatusOpenChange: (open: boolean) => void;
    onInventoryOpenChange: (open: boolean) => void;
    onCraftingOpenChange: (open: boolean) => void;
    onBuildingOpenChange: (open: boolean) => void;
    onFusionOpenChange: (open: boolean) => void;
    onFullMapOpenChange: (open: boolean) => void;
    onTutorialOpenChange: (open: boolean) => void;
    onSettingsOpenChange: (open: boolean) => void;
    onInstallPopupOpenChange: (open: boolean) => void;
    onAvailableActionsOpenChange: (open: boolean) => void;
    onCustomDialogOpenChange: (open: boolean) => void;
    onPickupDialogOpenChange: (open: boolean) => void;

    // Data
    playerStats: any;
    currentChunk: any;
    world: Record<string, any>;
    pickUpActions: Action[];
    otherActions: Action[];
    selectedPickupIds: number[];
    inputValue?: string;
    customDialogValue: string;
    isLoading: boolean;

    // Handlers (using any to avoid strict type mismatches with game engine)
    onToggleInventory: any;
    onToggleCrafting: any;
    onToggleStatus: any;
    onToggleMap: any;
    onToggleBuilding: any;
    onToggleFusion: any;
    onToggleTutorial: any;
    onToggleSettings: any;
    onActionClick: any;
    onCustomDialogSubmit: any;
    onTogglePickupSelection: any;
    onPickupConfirm: any;
    onItemUsed: any;
    onEquipItem: any;
    onUnequipItem: any;
    onDropItem: any;
    onCraft: any;
    onBuild: any;
    onFuse: any;
    onReturnToMenu: any;
    onCustomDialogValueChange: any;

    // Other props
    gameSlot: number;
    language: string;
    t: (key: TranslationKey, params?: Record<string, any>) => string;
    recipes?: Record<string, any>;
    buildableStructures?: Record<string, any>;
    customItemDefinitions?: Record<string, any>;
    finalWorldSetup?: any;
    biomeDefinitions?: any;
}

/**
 * Main GameLayout component props.
 */
export interface GameLayoutProps {
    gameSlot: number;
}

