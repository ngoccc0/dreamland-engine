/**
 * @overview
 * Hook to add audio feedback to button clicks.
 * Provides a handler that plays UI_BUTTON_CLICK sound and calls the original handler.
 * Useful for converting native HTML buttons or non-Button component interactions to have audio.
 */

import { useCallback } from 'react';
import { useAudio } from '@/lib/audio/useAudio';
import { AudioActionType } from '@/lib/definitions/audio-events';

/**
 * Hook to wrap button click handlers with audio feedback.
 * @param handler - Original click handler function
 * @returns Wrapped handler that plays sound before calling original
 */
export function useButtonAudio<T extends any[]>(
    handler?: (...args: T) => void
): (...args: T) => void {
    const audio = useAudio();

    return useCallback(
        (...args: T) => {
            // Play click sound
            try {
                audio.playSfxForAction?.(AudioActionType.UI_BUTTON_CLICK);
            } catch { }

            // Call original handler if provided
            if (handler) {
                try {
                    handler(...args);
                } catch (error) {
                    // Silently handle button audio errors
                }
            }
        },
        [audio, handler]
    );
}
