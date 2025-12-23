import { useControlsStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';

/**
 * Custom Hook: useControlsData
 *
 * @remarks
 * Aggregates all controls state into a single subscription.
 * Uses `useShallow` to prevent re-renders when unrelated states change.
 *
 * **Benefits:**
 * - Single subscription instead of 2 individual ones
 * - Cleaner component code
 * - Better performance via shallow comparison
 *
 * **Returns:**
 * - Selected action ID
 * - Joystick visibility flag
 * - Re-renders ONLY when these fields change
 *
 * @example
 * ```tsx
 * const controls = useControlsData();
 * if (controls.showJoystick) { ... }
 * ```
 *
 * @returns Object with controls state
 */
export function useControlsData() {
    return useControlsStore(
        useShallow((state) => ({
            selectedActionId: state.selectedActionId,
            showJoystick: state.showJoystick,
        }))
    );
}
