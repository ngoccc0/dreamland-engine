/**
 * OVERVIEW: useTypingAnimation - Word-by-word typing effect hook.
 *
 * Purpose:
 *   Animate narrative text by revealing words one at a time.
 *   Creates immersive "reveal" effect without blocking interaction.
 *
 * Features:
 *   - Word-by-word animation (not character-by-character for performance)
 *   - Configurable speed (150ms/word default = ~8 words/sec = balanced)
 *   - Optional onComplete callback
 *   - Memoized to prevent unnecessary re-renders
 *   - Pausable (enabled prop)
 *   - No external animation library dependencies
 *
 * Performance:
 *   - Uses setInterval (no requestAnimationFrame overhead)
 *   - Minimal re-renders (only update displayedText when word changes)
 *   - Cleanup on unmount/dependency change
 *
 * @module useTypingAnimation
 */

import { useEffect, useState, useCallback, useMemo } from 'react';

export interface UseTypingAnimationOptions {
    /** Delay in milliseconds between words (default: 150ms) */
    delayPerWord?: number;
    /** Callback fired when animation completes */
    onComplete?: () => void;
    /** Enable/disable animation (default: true) */
    enabled?: boolean;
}

/**
 * Hook for word-by-word typing animation.
 *
 * @param text - Text to animate
 * @param options - Animation options
 * @returns Object with {displayedText, isAnimating, progress}
 *
 * @example
 * ```tsx
 * const { displayedText, isAnimating } = useTypingAnimation("The jungle stretches before you.", {
 *   delayPerWord: 150,
 *   onComplete: () => console.log('Animation done!'),
 * });
 *
 * return <p>{displayedText}</p>;
 * ```
 */
/**
 * Typing animation hook - reveals text word-by-word with configurable delay.
 *
 * @remarks
 * Creates a typewriter effect that reveals text progressively.
 * Used for narrative entries, dialogue, and dramatic reveals.
 *
 * **Animation Strategy:**
 * - Splits text into words
 * - Reveals one word per interval (default 150ms)
 * - Recalculates on text/options change
 * - Supports completion callback
 *
 * **Performance:**
 * Memoizes word array to avoid re-splitting on every render.
 * Uses interval cleanup to prevent memory leaks.
 *
 * @param {string} text - Text to animate
 * @param {UseTypingAnimationOptions} options - Animation config (delayPerWord, onComplete, enabled)
 * @returns {Object} displayedWords (current visible words), isAnimating (animation in progress)
 *
 * @example
 * const { displayedWords, isAnimating } = useTypingAnimation(
 *   "The forest grows dark...",
 *   { delayPerWord: 150, onComplete: () => console.log('done') }
 * );
 * return <p>{displayedWords.join(' ')}</p>;
 */
export function useTypingAnimation(text: string, options: UseTypingAnimationOptions = {}) {
    const { delayPerWord = 150, onComplete, enabled = true } = options;

    const [displayedWords, setDisplayedWords] = useState<string[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);

    // Memoize word array to avoid recalculation
    const words = useMemo(() => {
        return text ? text.split(/\s+/) : [];
    }, [text]);

    // Memoize progress calculation
    const progress = useMemo(() => {
        return words.length > 0 ? displayedWords.length / words.length : 0;
    }, [displayedWords.length, words.length]);

    // Animation effect
    useEffect(() => {
        if (!enabled || !text || displayedWords.length >= words.length) {
            if (displayedWords.length >= words.length && displayedWords.length > 0) {
                setIsAnimating(false);
                onComplete?.();
            }
            return;
        }

        setIsAnimating(true);
        let intervalId: NodeJS.Timeout | undefined;

        // Use setTimeout to delay initial animation start
        const timeoutId = setTimeout(() => {
            intervalId = setInterval(() => {
                setDisplayedWords((prev) => {
                    const next = [...prev, words[prev.length]];
                    if (next.length >= words.length) {
                        // Animation complete
                        if (intervalId) clearInterval(intervalId);
                        setIsAnimating(false);
                        onComplete?.();
                    }
                    return next;
                });
            }, delayPerWord);
        }, 0); // Start immediately (no delay before first word)

        return () => {
            clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [enabled, text, words, displayedWords.length, delayPerWord, onComplete]);

    // Reset when text changes
    useEffect(() => {
        setDisplayedWords([]);
    }, [text]);

    const displayedText = displayedWords.join(' ');

    return {
        displayedText,
        isAnimating,
        progress, // 0-1, useful for progress bars
        wordCount: words.length,
        wordIndex: displayedWords.length,
    };
}

/**
 * Hook variant: Fade-in animation (alternative to typing).
 * Useful for less-intensive animations on mobile.
 *
 * @param text - Text to animate
 * @param options - {duration?: number (default 500ms), enabled?: boolean}
 * @returns Object with {displayedText, isAnimating, progress}
 */
/**
 * Fade-in animation hook - reveals entire text at once with fade effect.
 *
 * @remarks
 * Simple fade-in animation (no typing effect). Text appears instantly
 * with CSS fade-in transition over specified duration.
 *
 * **Use Cases:**
 * - Mobile optimized (reduced motion preference)
 * - Narrative entries that should appear quickly
 * - UI text that needs smooth entrance
 *
 * **Performance:**
 * Lower overhead than typing animation. Pure CSS-based fade.
 *
 * @param {string} text - Text to fade in
 * @param {Object} options - Animation config (duration in ms, enabled)
 * @returns {Object} displayedText, isAnimating, progress (0-1)
 *
 * @example
 * const { displayedText, isAnimating } = useFadeInAnimation(
 *   "A shadow moves...",
 *   { duration: 500, enabled: true }
 * );
 */
export function useFadeInAnimation(text: string, options: { duration?: number; enabled?: boolean } = {}) {
    const { duration = 500, enabled = true } = options;
    const [isAnimating, setIsAnimating] = useState(enabled && !!text);

    useEffect(() => {
        if (!enabled || !text) {
            setIsAnimating(false);
            return;
        }

        setIsAnimating(true);
        const timeoutId = setTimeout(() => setIsAnimating(false), duration);

        return () => clearTimeout(timeoutId);
    }, [text, enabled, duration]);

    return {
        displayedText: text,
        isAnimating,
        progress: isAnimating ? 0.5 : 1.0, // Rough estimate
    };
}

/**
 * Hook for "thinking" animation (ellipsis dots).
 * Cycles through ".", "..", "..." states.
 *
 * @param isActive - Whether thinking animation should be active
 * @param options - {cycleMs?: number (default 500ms)}
 * @returns {dots: string, isAnimating: boolean}
 *
 * @example
 * ```tsx
 * const { dots, isAnimating } = useThinkingAnimation(isGenerating, { cycleMs: 600 });
 * return <span>AI thinking{dots}</span>;
 * ```
 */
export function useThinkingAnimation(isActive: boolean, options: { cycleMs?: number } = {}) {
    const { cycleMs = 500 } = options;
    const [dotCount, setDotCount] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setDotCount(0);
            return;
        }

        const intervalId = setInterval(() => {
            setDotCount((prev) => (prev + 1) % 4); // Cycle 0->1->2->3->0
        }, cycleMs / 4);

        return () => clearInterval(intervalId);
    }, [isActive, cycleMs]);

    const dots = '.'.repeat(Math.max(1, dotCount));

    return {
        dots,
        isAnimating: isActive,
        dotCount,
    };
}

export default { useTypingAnimation, useFadeInAnimation, useThinkingAnimation };
