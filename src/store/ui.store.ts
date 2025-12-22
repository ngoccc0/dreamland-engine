/**
 * @file src/store/ui.store.ts
 * @description Zustand store for UI State - Dialog visibility, panels, etc.
 * 
 * @remarks
 * Manages all UI state that doesn't affect game logic:
 * - Dialog/popup visibility (inventory, crafting, status, etc.)
 * - Panel states (open/closed)
 * - Selected items/tabs
 * - Mobile layout preferences
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

interface UIStoreState {
  // Dialog states
  dialogs: DialogState;
  
  // Dialog control methods
  toggleDialog: (dialogName: keyof DialogState) => void;
  openDialog: (dialogName: keyof DialogState) => void;
  closeDialog: (dialogName: keyof DialogState) => void;
  closeAllDialogs: () => void;
  
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
 * - Dialog visibility (inventory, crafting, status, etc.)
 * - Selection states (selected items, active tabs)
 * - Panel visibility
 * - Mobile layout preferences
 * 
 * Example:
 * ```tsx
 * function InventoryButton() {
 *   const { dialogs, toggleDialog } = useUIStore();
 *   return (
 *     <button onClick={() => toggleDialog('inventoryOpen')}>
 *       Inventory {dialogs.inventoryOpen && '(open)'}
 *     </button>
 *   );
 * }
 * ```
 */
export const useUIStore = create<UIStoreState>()(
  devtools(
    (set) => ({
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

      // Selection states
      selectedItemId: null,
      setSelectedItemId: (itemId: string | null) =>
        set({ selectedItemId: itemId }),

      // Panel visibility
      showNarrativePanel: true,
      setShowNarrativePanel: (show: boolean) =>
        set({ showNarrativePanel: show }),
    }),
    { name: 'ui-store' }
  )
);

export default useUIStore;
