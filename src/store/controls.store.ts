/**
 * @file src/store/controls.store.ts
 * @description Zustand store for controls input state
 *
 * @remarks
 * Manages controls-specific state:
 * - Selected action (which button is highlighted)
 * - Joystick visibility (mobile vs desktop)
 * - Input mode (keyboard, touch, gamepad)
 *
 * Allows ControlsSection to manage input state independently.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type InputMode = 'keyboard' | 'touch' | 'gamepad';

interface ControlsStoreState {
  // Selected action in action bar
  selectedActionId: string | null;
  
  // Joystick visibility
  showJoystick: boolean;
  joystickPosition: { x: number; y: number } | null;
  
  // Input mode detection
  inputMode: InputMode;
  
  // Control methods
  setSelectedAction: (actionId: string | null) => void;
  setShowJoystick: (show: boolean) => void;
  setJoystickPosition: (pos: { x: number; y: number } | null) => void;
  setInputMode: (mode: InputMode) => void;
}

/**
 * Controls Store - Input state management
 *
 * @remarks
 * ControlsSection subscribes to this store to track which action is selected
 * and whether joystick should be visible.
 */
export const useControlsStore = create<ControlsStoreState>()(
  devtools(
    (set) => ({
      selectedActionId: null,
      showJoystick: false,
      joystickPosition: null,
      inputMode: 'keyboard',
      
      setSelectedAction: (actionId) =>
        set(() => ({
          selectedActionId: actionId,
        })),
      
      setShowJoystick: (show) =>
        set(() => ({
          showJoystick: show,
        })),
      
      setJoystickPosition: (pos) =>
        set(() => ({
          joystickPosition: pos,
        })),
      
      setInputMode: (mode) =>
        set(() => ({
          inputMode: mode,
        })),
    }),
    { name: 'ControlsStore' }
  )
);

// Atomic selectors
export const selectSelectedAction = (state: ControlsStoreState) => state.selectedActionId;
export const selectShowJoystick = (state: ControlsStoreState) => state.showJoystick;
export const selectInputMode = (state: ControlsStoreState) => state.inputMode;
