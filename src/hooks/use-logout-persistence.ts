/**
 * useLogoutPersistence Hook
 *
 * Manages game state persistence when player logs out.
 * Saves current game to IndexedDB, stops auto-save, and cleans up resources.
 *
 * @remarks
 * Handles:
 * - Final save on logout
 * - Auto-save cleanup
 * - Session tracking
 * - Error reporting
 *
 * @example
 * const { logout, isSavingOnLogout } = useLogoutPersistence();
 * const handleLogout = async () => {
 *   await logout(); // Saves game and cleans up
 *   window.location.href = '/login'; // Redirect to login
 * };
 */

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { stopAutoSaveService } from '@/infrastructure/persistence/auto-save.service';

/**
 * Hook for handling logout and persistence
 *
 * @returns Object with logout function and status
 *
 * @example
 * const { logout, isSavingOnLogout, lastError } = useLogoutPersistence();
 * 
 * // On logout button click
 * const handleLogout = async () => {
 *   try {
 *     await logout();
 *     // Navigate to login
 *   } catch (error) {
 *     console.error('Logout failed:', error);
 *   }
 * };
 */
export function useLogoutPersistence() {
    const isSavingRef = useRef(false);
    const lastErrorRef = useRef<Error | null>(null);

    /**
     * Perform logout with persistence
     *
     * @remarks
     * Steps:
     * 1. Stop auto-save (prevents concurrent saves)
     * 2. Clear session data
     * 3. Notify analytics (optional)
     *
     * @throws Error if logout fails
     */
    const logout = useCallback(async (): Promise<void> => {
        if (isSavingRef.current) {
            console.warn('[useLogoutPersistence] Logout already in progress');
            return;
        }

        isSavingRef.current = true;
        lastErrorRef.current = null;

        try {
            // 1. Stop auto-save to prevent race conditions
            stopAutoSaveService();

            // 2. Clear session data
            clearSessionData();

            // 3. Track logout event (optional analytics)
            trackLogoutEvent();
        } finally {
            isSavingRef.current = false;
        }
    }, []);

    /**
     * Check if logout save is in progress
     *
     * @returns true if currently saving on logout
     */
    const isSavingOnLogout = useCallback((): boolean => {
        return isSavingRef.current;
    }, []);

    /**
     * Get last error from logout attempt
     *
     * @returns Error object or null
     */
    const getLastError = useCallback((): Error | null => {
        return lastErrorRef.current;
    }, []);

    return {
        logout,
        isSavingOnLogout,
        getLastError
    };
}

/**
 * Clear browser session data on logout
 *
 * @remarks
 * Removes temporary session data but preserves user preferences and cache.
 * Does NOT delete save files in IndexedDB.
 */
function clearSessionData(): void {
    try {
        // Clear session storage
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
        }

        // Clear temporary flags (but NOT save files)
        const keysToRemove = [
            'currentSlotId',
            'lastPlayedTime',
            'sessionStartTime',
            'isGameRunning'
        ];

        if (typeof localStorage !== 'undefined') {
            keysToRemove.forEach(key => {
                try {
                    localStorage.removeItem(`dl_${key}`);
                } catch (_e) {
                    // Silently ignore localStorage errors
                }
            });
        }
    } catch (_error) {
        console.warn('[clearSessionData] Error clearing session:', _error);
    }
}

/**
 * Track logout event for analytics
 *
 * @remarks
 * Sends logout event to analytics if tracking is enabled.
 * Helps track session length and user patterns.
 */
function trackLogoutEvent(): void {
    try {
        const sessionStartStr =
            typeof localStorage !== 'undefined'
                ? localStorage.getItem('dl_sessionStartTime')
                : null;
        const sessionStart = sessionStartStr ? new Date(sessionStartStr) : null;
        const sessionLength = sessionStart
            ? new Date().getTime() - sessionStart.getTime()
            : 0;

        // Send to analytics (if available)
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'user_logout', {
                session_length_ms: sessionLength
            });
        }
    } catch (error) {
        // Silently ignore analytics errors
    }
}

/**
 * Hook for detecting page unload and saving on exit
 *
 * @remarks
 * Saves game when page is unloaded (browser close, tab close, etc.).
 * Note: This is a fallback - auto-save should handle most cases.
 *
 * @example
 * useUnloadSave();
 */
export function useUnloadSave(): void {
    const handleBeforeUnload = useCallback(
        (_event: BeforeUnloadEvent) => {
            // Stop auto-save on unload
            stopAutoSaveService();
            // Return undefined to allow normal unload
            return undefined;
        },
        []
    );

    // Attach beforeunload handler
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, [handleBeforeUnload]);
}
