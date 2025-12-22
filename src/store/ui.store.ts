/**
 * @file src/store/ui.store.ts
 * @description Zustand store for UI State - Dialog visibility, panels, ephemeral states
 * 
 * @remarks
 * Manages all UI state that doesn't affect game logic:
 * - Dialog/popup visibility (inventory, crafting, status, etc.)
 * - Ephemeral states (install popup, action menu, custom dialog)
 * - Selection states (pickup items, selected inventory items)
 * - Panel visibility
 * - Context menu position
 * 
 * **Architecture Decision:**
 * ALL UI state (including ephemeral) is managed here, not in component local state.
 * This enables GameLayout to be a pure Dumb/Layout component with zero useState.
 * DialogSection will subscribe to these states directly.
 * 
 * This store separates UI concerns from game logic, enabling components
 * to control their own visibility without prop drilling.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DialogState {
  inventoryOpen: boolean;
  statusOpen: boolean;
  craftingOpen: boolean;
  buildingOpen: boolean;
  cookingOpen: boolean;
  fusionOpen: boolean;
  skillsOpen: boolean;
  questsOpen: boolean;
  mapOpen: boolean;
  settingsOpen: boolean;
}

/**
 * Ephemeral UI state - temporary dialogs that don't persist across sessions
 */
export interface EphemeralUIState {
  // PWA install prompt
  installPopupOpen: boolean;

  // Context action menu (position-based)
  // TODO: Phase 3 - Implement context menu feature
  // Currently unused. Set via setAvailableActionsOpen when user right-clicks on game world.
  // When implemented, will show action menu (Attack, Talk, Inspect, etc.) at this position.
  // Remove if context menu is not planned for Phase 3.
  availableActionsOpen: boolean;
  availableActionsPosition: { x: number; y: number } | null;

  // Custom dynamic dialog (for multi-purpose prompts)
  customDialogOpen: boolean;
  customDialogValue: string;

  // Pickup dialog (multi-select items)
  pickupDialogOpen: boolean;
  selectedPickupIds: number[];
}

interface UIStoreState {
  // Persistent dialog states
  dialogs: DialogState;

  // Dialog control methods
  toggleDialog: (dialogName: keyof DialogState) => void;
  openDialog: (dialogName: keyof DialogState) => void;
  closeDialog: (dialogName: keyof DialogState) => void;
  closeAllDialogs: () => void;

  // Ephemeral UI states
  ephemeral: EphemeralUIState;

  // Ephemeral state control methods
  setInstallPopupOpen: (open: boolean) => void;
  setAvailableActionsOpen: (open: boolean, position?: { x: number; y: number } | null) => void;
  setCustomDialogOpen: (open: boolean, value?: string) => void;
  setCustomDialogValue: (value: string) => void;
  setPickupDialogOpen: (open: boolean) => void;
  setSelectedPickupIds: (ids: number[]) => void;
  addPickupId: (id: number) => void;
  removePickupId: (id: number) => void;
  togglePickupId: (id: number) => void;
  clearPickupIds: () => void;

  // Selection/Active states
  selectedItemId: string | null;
  setSelectedItemId: (itemId: string | null) => void;

  // Layout preferences
  showNarrativePanel: boolean;
  setShowNarrativePanel: (show: boolean) => void;
}

/**
 * Zustand UI Store
 * 
 * @remarks
 * Provides centralized UI state management for:
 * - Persistent dialogs (inventory, crafting, status, etc.)
 * - Ephemeral dialogs (install popup, action menu, custom dialog, pickup)
 * - Selection states (items, pickup ids)
 * - Panel visibility
 * - Context menu position
 * 
 * **Design Principle:** Single source of truth for all UI state.
 * GameLayout is a pure Dumb Layout component with ZERO useState.
 * All UI state flows through this store.
 */
export const useUIStore = create<UIStoreState>()(
  devtools(
    (set) => ({
      // ===== PERSISTENT DIALOGS =====
      // Initial dialog states (all closed)
      dialogs: {
        inventoryOpen: false,
        statusOpen: false,
        craftingOpen: false,
        buildingOpen: false,
        cookingOpen: false,
        fusionOpen: false,
        skillsOpen: false,
        questsOpen: false,
        mapOpen: false,
        settingsOpen: false,
      },

      // Toggle dialog visibility
      toggleDialog: (dialogName: keyof DialogState) =>
        set((state) => ({
          dialogs: {
            ...state.dialogs,
            [dialogName]: !state.dialogs[dialogName],
          },
        })),

      // Open specific dialog
      openDialog: (dialogName: keyof DialogState) =>
        set((state) => ({
          dialogs: {
            ...state.dialogs,
            [dialogName]: true,
          },
        })),

      // Close specific dialog
      closeDialog: (dialogName: keyof DialogState) =>
        set((state) => ({
          dialogs: {
            ...state.dialogs,
            [dialogName]: false,
          },
        })),

      // Close all dialogs at once
      closeAllDialogs: () =>
        set({
          dialogs: {
            inventoryOpen: false,
            statusOpen: false,
            craftingOpen: false,
            buildingOpen: false,
            cookingOpen: false,
            fusionOpen: false,
            skillsOpen: false,
            questsOpen: false,
            mapOpen: false,
            settingsOpen: false,
          },
        }),

      // ===== EPHEMERAL UI STATES =====
      ephemeral: {
        installPopupOpen: false,
        availableActionsOpen: false,
        availableActionsPosition: null,
        customDialogOpen: false,
        customDialogValue: '',
        pickupDialogOpen: false,
        selectedPickupIds: [],
      },

      // Install popup control
      setInstallPopupOpen: (open: boolean) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            installPopupOpen: open,
          },
        })),

      // Available actions menu control (with position for context menu)
      // TODO: Phase 3 - Used by context menu feature when implemented
      // Set position to show action menu at cursor location (right-click on chunk or entity)
      setAvailableActionsOpen: (open: boolean, position?: { x: number; y: number } | null) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            availableActionsOpen: open,
            availableActionsPosition: position ?? null,
          },
        })),

      // Custom dialog control
      setCustomDialogOpen: (open: boolean, value?: string) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            customDialogOpen: open,
            customDialogValue: value ?? state.ephemeral.customDialogValue,
          },
        })),

      setCustomDialogValue: (value: string) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            customDialogValue: value,
          },
        })),

      // Pickup dialog control
      setPickupDialogOpen: (open: boolean) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            pickupDialogOpen: open,
            selectedPickupIds: open ? state.ephemeral.selectedPickupIds : [],
          },
        })),

      setSelectedPickupIds: (ids: number[]) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            selectedPickupIds: ids,
          },
        })),

      addPickupId: (id: number) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            selectedPickupIds: [...state.ephemeral.selectedPickupIds, id],
          },
        })),

      removePickupId: (id: number) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            selectedPickupIds: state.ephemeral.selectedPickupIds.filter((x) => x !== id),
          },
        })),

      togglePickupId: (id: number) =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            selectedPickupIds: state.ephemeral.selectedPickupIds.includes(id)
              ? state.ephemeral.selectedPickupIds.filter((x) => x !== id)
              : [...state.ephemeral.selectedPickupIds, id],
          },
        })),

      clearPickupIds: () =>
        set((state) => ({
          ephemeral: {
            ...state.ephemeral,
            selectedPickupIds: [],
          },
        })),

      // ===== SELECTION STATES =====
      selectedItemId: null,
      setSelectedItemId: (itemId: string | null) =>
        set({ selectedItemId: itemId }),

      // ===== LAYOUT PREFERENCES =====
      showNarrativePanel: true,
      setShowNarrativePanel: (show: boolean) =>
        set({ showNarrativePanel: show }),
    }),
    { name: 'ui-store' }
  )
);

export default useUIStore;

