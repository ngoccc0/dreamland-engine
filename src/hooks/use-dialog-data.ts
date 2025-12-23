import { useUIStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';

/**
 * Custom Hook: useDialogData
 *
 * @remarks
 * Aggregates all dialog visibility states into a single subscription.
 * Uses `useShallow` to prevent re-renders when unrelated dialog states change.
 *
 * **Benefits:**
 * - Single subscription instead of 13 individual ones
 * - Cleaner component code
 * - Better performance via shallow comparison
 *
 * **Returns:**
 * - Dialog visibility states (13 fields)
 * - Re-renders ONLY when any of these fields change
 *
 * @example
 * ```tsx
 * const dialogs = useDialogData();
 * if (dialogs.isStatusOpen) { ... }
 * ```
 *
 * @returns Object with all dialog visibility states
 */
export function useDialogData() {
    return useUIStore(
        useShallow((state) => ({
            isStatusOpen: state.dialogs.statusOpen,
            isInventoryOpen: state.dialogs.inventoryOpen,
            isCraftingOpen: state.dialogs.craftingOpen,
            isBuildingOpen: state.dialogs.buildingOpen,
            isFusionOpen: state.dialogs.fusionOpen,
            isFullMapOpen: state.dialogs.mapOpen,
            isTutorialOpen: state.dialogs.skillsOpen,
            isSettingsOpen: state.dialogs.settingsOpen,
            isCookingOpen: state.dialogs.cookingOpen,
            showInstallPopup: state.ephemeral.installPopupOpen,
            isAvailableActionsOpen: state.ephemeral.availableActionsOpen,
            isCustomDialogOpen: state.ephemeral.customDialogOpen,
            isPickupDialogOpen: state.ephemeral.pickupDialogOpen,
        }))
    );
}
