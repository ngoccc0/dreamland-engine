/**
 * useAutoSave Hook
 *
 * React hook for managing auto-save functionality within the game loop.
 * Integrates AutoSaveService with React lifecycle and game state.
 *
 * @remarks
 * Handles:
 * - Auto-save initialization on game start
 * - Auto-save cleanup on game end
 * - Manual save triggers
 * - Save status display
 * - Error handling
 *
 * @example
 * const { startAutoSave, stopAutoSave, lastSaveTime } = useAutoSave();
 * useEffect(() => {
 *   startAutoSave('slot_0', () => gameState);
 * }, []);
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getAutoSaveService, resetAutoSaveService } from '@/infrastructure/persistence/auto-save.service';
import { createGameStateRepository, type IGameStateRepository } from '@/infrastructure/persistence';
import type { GameState } from '@/core/types/game';

/**
 * Auto-save hook configuration
 */
export interface UseAutoSaveOptions {
    /** Auto-save interval in milliseconds (default: 300000 = 5 minutes) */
    interval?: number;
    /** Whether to show save notifications */
    showNotifications?: boolean;
    /** Debug mode - log saves to console */
    debug?: boolean;
    /** Save slot ID (slot_0, slot_1, etc.) */
    slotId?: string;
}

/**
 * Hook for auto-save functionality
 *
 * @param options - Configuration options
 * @returns Object with auto-save controls and status
 *
 * @example
 * const { startAutoSave, stopAutoSave, isSaving, lastSaveTime } = useAutoSave({
 *   interval: 300000,
 *   debug: false
 * });
 *
 * useEffect(() => {
 *   startAutoSave(() => gameState);
 * }, [gameState, startAutoSave]);
 */
export function useAutoSave(options: UseAutoSaveOptions = {}) {
    const autoSaveRef = useRef<ReturnType<typeof getAutoSaveService> | null>(null);
    const gameStateRepoRef = useRef<IGameStateRepository | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
    const [lastError, setLastError] = useState<Error | null>(null);
    const saveCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Initialize auto-save service
     *
     * @remarks
     * Uses createGameStateRepository factory to create an appropriate repository
     * instance. Called once on mount to set up monitoring and persistence.
     */
    const initializeAutoSave = useCallback(() => {
        try {
            // Get or create repository and service using factory
            if (!gameStateRepoRef.current) {
                gameStateRepoRef.current = createGameStateRepository({
                    userId: null,
                    preferOffline: true,
                });
            }
            if (!autoSaveRef.current) {
                autoSaveRef.current = getAutoSaveService(gameStateRepoRef.current);
            }
        } catch (error) {
            console.error('[useAutoSave] Initialization failed:', error);
            setLastError(
                error instanceof Error ? error : new Error('Failed to initialize auto-save')
            );
        }
    }, []);

    /**
     * Start auto-save with the provided game state getter
     *
     * @param getGameStateFn - Function that returns current game state
     * @param slotId - Save slot ID (defaults to options.slotId or 'slot_0')
     *
     * @remarks
     * Call this when starting a game session. The provided function is called
     * every save interval to get the latest state.
     *
     * @example
     * startAutoSave(() => gameState, 'slot_0');
     */
    const startAutoSave = useCallback(
        (getGameStateFn?: () => GameState, slotId?: string) => {
            initializeAutoSave();

            if (!autoSaveRef.current) {
                console.error('[useAutoSave] Service not initialized');
                return;
            }

            const finalSlotId = slotId ?? options.slotId ?? 'slot_0';
            const wrappedGetState = getGameStateFn ?? (() => ({} as GameState));

            try {
                autoSaveRef.current.startAutoSave(finalSlotId, wrappedGetState, {
                    interval: options.interval ?? 300000,
                    showNotifications: options.showNotifications ?? false,
                    debug: options.debug ?? false
                });

                // Set up periodic UI updates
                if (saveCheckIntervalRef.current) {
                    clearInterval(saveCheckIntervalRef.current);
                }

                saveCheckIntervalRef.current = setInterval(() => {
                    if (autoSaveRef.current) {
                        setIsSaving(autoSaveRef.current.isSaveInProgress());
                        const timeStr = autoSaveRef.current.getTimeSinceLastSave();
                        setLastSaveTime(timeStr);
                        setLastError(autoSaveRef.current.getLastError());
                    }
                }, 1000); // Update UI every second
            } catch (error) {
                console.error('[useAutoSave] Failed to start:', error);
                setLastError(
                    error instanceof Error ? error : new Error('Failed to start auto-save')
                );
            }
        },
        [options, initializeAutoSave]
    );

    /**
     * Stop auto-save
     *
     * @remarks
     * Call when ending game session or switching slots.
     * Clears the save interval.
     *
     * @example
     * stopAutoSave();
     */
    const stopAutoSave = useCallback(() => {
        if (autoSaveRef.current) {
            autoSaveRef.current.stopAutoSave();
        }

        if (saveCheckIntervalRef.current) {
            clearInterval(saveCheckIntervalRef.current);
            saveCheckIntervalRef.current = null;
        }

        setIsSaving(false);
    }, []);

    /**
     * Manually save game state (in addition to auto-saves)
     *
     * @param gameState - Game state to save
     * @param slotId - Save slot ID (defaults to options.slotId)
     *
     * @remarks
     * Can be called on important events (quest completion, boss defeat, etc.).
     * This save is in addition to automatic saves.
     *
     * @example
     * await manualSave(gameState, 'slot_0');
     */
    const manualSave = useCallback(
        async (gameState: GameState, slotId?: string) => {
            initializeAutoSave();

            if (!autoSaveRef.current) {
                throw new Error('Auto-save service not initialized');
            }

            const finalSlotId = slotId ?? options.slotId ?? 'slot_0';

            try {
                setIsSaving(true);
                if (gameStateRepoRef.current) {
                    await gameStateRepoRef.current.save(finalSlotId, gameState);
                }
                setLastError(null);

                // Update UI
                const timeStr = autoSaveRef.current.getTimeSinceLastSave();
                setLastSaveTime(timeStr);
            } catch (error) {
                const err =
                    error instanceof Error ? error : new Error('Failed to save manually');
                setLastError(err);
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        [options, initializeAutoSave]
    );

    /**
     * Clear last error
     */
    const clearError = useCallback(() => {
        setLastError(null);
    }, []);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            stopAutoSave();
            resetAutoSaveService();
        };
    }, [stopAutoSave]);

    return {
        startAutoSave,
        stopAutoSave,
        manualSave,
        isSaving,
        lastSaveTime,
        lastError,
        clearError
    };
}

/**
 * Hook for tracking auto-save status
 *
 * @remarks
 * Lighter-weight hook if you only need status display.
 * Use in UI components to show "Last saved 2 minutes ago"
 *
 * @example
 * const { lastSaveTime, isSaving } = useAutoSaveStatus();
 * return <span>{isSaving ? 'Saving...' : `Saved: ${lastSaveTime}`}</span>;
 */
export function useAutoSaveStatus() {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);

    useEffect(() => {
        // Set up periodic checks
        const interval = setInterval(() => {
            try {
                const repo = createGameStateRepository({
                    userId: null,
                    preferOffline: true,
                });
                const service = getAutoSaveService(repo);
                setIsSaving(service.isSaveInProgress());
                const timeStr = service.getTimeSinceLastSave();
                setLastSaveTime(timeStr);
            } catch (error) {
                // Silently ignore errors
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return {
        isSaving,
        lastSaveTime
    };
}
