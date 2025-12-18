import { useCallback } from 'react';
import { useAudio } from '@/lib/audio/useAudio';
import { AudioActionType } from '@/core/data/audio-events';

/**
 * Button audio feedback hook - wraps click handlers with UI sound effects.
 *
 * @remarks
 * Automatically plays UI button click sound before executing the original handler.
 * Useful for adding audio feedback to any interactive element without modifying components.
 *
 * **Error Handling:**
 * Silently catches audio errors and handler errors. Ensures UI doesn't break
 * if audio system fails or handler throws.
 *
 * **Generic Type:**
 * Preserves handler argument types (can pass handlers with any signature).
 *
 * @param handler - Original click/interaction handler (optional)
 * @returns Wrapped handler function with same signature
 *
 * @example
 * // Wrap existing handler with audio
 * const handleClick = useButtonAudio(() => {
 *   console.log('Button clicked!');
 * });
 * 
 * // Use with elements
 * <button onClick={handleClick}>Click me</button>
 * // Plays sound on click, then logs message
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
                } catch (_error) {
                    // Silently handle button audio errors
                }
            }
        },
        [audio, handler]
    );
}
