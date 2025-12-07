/**
 * OVERVIEW: Frame-limiting utility for controlling animation frame rates.
 *
 * Provides FPS (frames-per-second) throttling based on user settings.
 * Respects both target FPS and VSync toggle from localStorage.
 *
 * Formula:
 * - `frameTime = 1000 / fpsTarget` (ms per frame)
 * - Skip animation frame if elapsed time < frameTime
 * - VSync enabled (1): Disables frame-limiting, use native refresh rate
 * - VSync disabled (0): Apply FPS cap
 *
 * Usage:
 * ```ts
 * const frameLimiter = createFrameLimiter();
 * let rafId: number;
 *
 * const animate = (timestamp: number) => {
 *   if (frameLimiter.shouldSkipFrame(timestamp)) {
 *     rafId = requestAnimationFrame(animate);
 *     return;
 *   }
 *
 *   // Perform animation logic
 *   updateScene();
 *
 *   rafId = requestAnimationFrame(animate);
 * };
 *
 * rafId = requestAnimationFrame(animate);
 * ```
 */

export interface FrameLimiter {
    /**
     * Check if current frame should be skipped based on FPS target.
     * Returns true if frame should be skipped, false if frame should execute.
     * @param currentTimestamp Current RAF timestamp in milliseconds
     */
    shouldSkipFrame(currentTimestamp: number): boolean;

    /**
     * Reset limiter state (useful for pauses or resuming).
     */
    reset(): void;

    /**
     * Get current FPS target.
     */
    getFpsTarget(): number;
}

/**
 * Creates a frame limiter instance that respects settings from localStorage.
 * Reads dl_fps_target (30-120) and dl_vsync (0/1) on creation.
 * @returns FrameLimiter instance
 */
export function createFrameLimiter(): FrameLimiter {
    let lastFrameTime = 0;

    // Read settings from localStorage
    const readSettings = () => {
        const vSyncStr = typeof localStorage !== 'undefined' ? localStorage.getItem('dl_vsync') : null;
        const fpsStr = typeof localStorage !== 'undefined' ? localStorage.getItem('dl_fps_target') : null;

        const vSyncEnabled = vSyncStr === '1';
        const fpsTarget = Math.max(30, Math.min(120, parseInt(fpsStr || '60', 10) || 60));

        return { vSyncEnabled, fpsTarget };
    };

    return {
        shouldSkipFrame(currentTimestamp: number): boolean {
            const { vSyncEnabled, fpsTarget } = readSettings();

            // If VSync is enabled, never skip frames
            if (vSyncEnabled) {
                lastFrameTime = currentTimestamp;
                return false;
            }

            // Calculate frame time required (ms per frame)
            // 60 FPS = 16.67ms per frame, 120 FPS = 8.33ms per frame, etc.
            const frameTime = 1000 / fpsTarget;
            const elapsed = currentTimestamp - lastFrameTime;

            // Skip frame if not enough time has elapsed
            if (elapsed < frameTime) {
                return true; // Skip this frame
            }

            // Update last frame time and allow frame to execute
            lastFrameTime = currentTimestamp;
            return false;
        },

        reset(): void {
            lastFrameTime = 0;
        },

        getFpsTarget(): number {
            const { fpsTarget } = readSettings();
            return fpsTarget;
        },
    };
}
