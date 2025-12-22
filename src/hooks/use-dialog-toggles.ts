/**
 * @file src/hooks/use-dialog-toggles.ts
 * @description Hook for dialog toggle handlers with audio feedback
 * 
 * @remarks
 * Provides memoized callbacks for toggling UI dialogs with audio feedback.
 * Reduces boilerplate in GameLayout component and isolates audio SFX logic.
 */

import { useCallback } from 'react';
import { useAudio } from '@/lib/audio/useAudio';
import { AudioActionType } from '@/core/data/audio-events';
import { useUIStore } from '@/store';

interface DialogToggles {
  handleStatusToggle: () => void;
  handleInventoryToggle: () => void;
  handleCraftingToggle: () => void;
  handleMapToggle: () => void;
  handleTutorialToggle: () => void;
  handleSettingsToggle: () => void;
  handleBuildingToggle: () => void;
  handleFusionToggle: () => void;
}

/**
 * Hook for dialog toggle handlers with audio feedback
 * 
 * @remarks
 * Combines useUIStore dialog methods with audio playback.
 * Each toggle plays a confirm/cancel sound based on dialog state.
 * 
 * @returns DialogToggles object with memoized toggle handlers
 * 
 * @example
 * ```tsx
 * const { handleInventoryToggle } = useDialogToggles();
 * return <button onClick={handleInventoryToggle}>Inventory</button>;
 * ```
 */
export function useDialogToggles(): DialogToggles {
  const audio = useAudio();
  const {
    dialogs,
    toggleDialog,
  } = useUIStore();

  const handleStatusToggle = useCallback(() => {
    toggleDialog('statusOpen');
    audio.playSfxForAction(
      dialogs.statusOpen ? AudioActionType.UI_CANCEL : AudioActionType.UI_CONFIRM
    );
  }, [dialogs.statusOpen, toggleDialog, audio]);

  const handleInventoryToggle = useCallback(() => {
    toggleDialog('inventoryOpen');
    audio.playSfxForAction(
      dialogs.inventoryOpen ? AudioActionType.UI_CANCEL : AudioActionType.UI_CONFIRM
    );
  }, [dialogs.inventoryOpen, toggleDialog, audio]);

  const handleCraftingToggle = useCallback(() => {
    toggleDialog('craftingOpen');
    audio.playSfxForAction(
      dialogs.craftingOpen ? AudioActionType.UI_CANCEL : AudioActionType.UI_CONFIRM
    );
  }, [dialogs.craftingOpen, toggleDialog, audio]);

  const handleMapToggle = useCallback(() => {
    toggleDialog('mapOpen');
    audio.playSfxForAction(
      dialogs.mapOpen ? AudioActionType.UI_CANCEL : AudioActionType.UI_CONFIRM
    );
  }, [dialogs.mapOpen, toggleDialog, audio]);

  const handleTutorialToggle = useCallback(() => {
    toggleDialog('skillsOpen');
    audio.playSfxForAction(
      dialogs.skillsOpen ? AudioActionType.UI_CANCEL : AudioActionType.UI_CONFIRM
    );
  }, [dialogs.skillsOpen, toggleDialog, audio]);

  const handleSettingsToggle = useCallback(() => {
    toggleDialog('settingsOpen');
    audio.playSfxForAction(
      dialogs.settingsOpen ? AudioActionType.UI_CANCEL : AudioActionType.UI_CONFIRM
    );
  }, [dialogs.settingsOpen, toggleDialog, audio]);

  const handleBuildingToggle = useCallback(() => {
    toggleDialog('buildingOpen');
    audio.playSfxForAction(
      dialogs.buildingOpen ? AudioActionType.UI_CANCEL : AudioActionType.UI_CONFIRM
    );
  }, [dialogs.buildingOpen, toggleDialog, audio]);

  const handleFusionToggle = useCallback(() => {
    toggleDialog('fusionOpen');
    audio.playSfxForAction(
      dialogs.fusionOpen ? AudioActionType.UI_CANCEL : AudioActionType.UI_CONFIRM
    );
  }, [dialogs.fusionOpen, toggleDialog, audio]);

  return {
    handleStatusToggle,
    handleInventoryToggle,
    handleCraftingToggle,
    handleMapToggle,
    handleTutorialToggle,
    handleSettingsToggle,
    handleBuildingToggle,
    handleFusionToggle,
  };
}

export default useDialogToggles;
