/**
 * Auto-Save Service
 *
 * Provides automatic game state persistence at configurable intervals.
 * Saves player progress every 5 minutes during gameplay.
 *
 * @remarks
 * Features:
 * - 5-minute auto-save interval (configurable)
 * - Saves to IndexedDB (with localStorage fallback)
 * - Silently handles save errors
 * - Can be manually triggered
 * - Tracks last save time for display
 *
 * @example
 * const autoSave = new AutoSaveService(gameStateRepository);
 * autoSave.startAutoSave(slotId, getGameState);
 * // Game now saves every 5 minutes
 *
 * // Stop auto-save when leaving game
 * autoSave.stopAutoSave();
 */

import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState } from '@/core/types/game';

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
    /** Interval in milliseconds (default: 300000 = 5 minutes) */
    interval: number;
    /** Whether to log save operations to console (dev only) */
    debug: boolean;
    /** Whether to show toast notifications on save */
    showNotifications: boolean;
}

/**
 * Auto-save service for persisting game state
 */
export class AutoSaveService {
    private gameStateRepository: IGameStateRepository;
    private autoSaveIntervalId: NodeJS.Timeout | null = null;
    private lastSaveTime: Date | null = null;
    private lastSaveError: Error | null = null;
    private saveInProgress = false;

    constructor(gameStateRepository: IGameStateRepository) {
        this.gameStateRepository = gameStateRepository;
    }

    /**
     * Start automatic saving at specified interval
     *
     * @param slotId - Save slot identifier (slot_0, slot_1, etc.)
     * @param getGameStateFn - Function that returns current game state
     * @param config - Optional configuration
     *
     * @remarks
     * Saves every 5 minutes by default. The provided function is called each
     * save cycle to get the latest game state.
     *
     * @example
     * autoSave.startAutoSave('slot_0', () => gameState, {
     *   interval: 300000, // 5 minutes
     *   debug: false
     * });
     */
    startAutoSave(
        slotId: string,
        getGameStateFn: () => GameState | undefined,
        config: Partial<AutoSaveConfig> = {}
    ): void {
        // Stop any existing auto-save
        this.stopAutoSave();

        const finalConfig: AutoSaveConfig = {
            interval: config.interval ?? 300000, // 5 minutes default
            debug: config.debug ?? false,
            showNotifications: config.showNotifications ?? false
        };

        if (finalConfig.debug) {
            console.log(
                `[AutoSave] Starting auto-save interval: ${finalConfig.interval}ms`
            );
        }

        // Initial save immediately
        this.performSave(slotId, getGameStateFn, finalConfig);

        // Set up recurring saves
        this.autoSaveIntervalId = setInterval(
            () => this.performSave(slotId, getGameStateFn, finalConfig),
            finalConfig.interval
        );
    }

    /**
     * Stop automatic saving
     *
     * @remarks
     * Clears the auto-save interval. Call this when player exits the game
     * or switches to a different save slot.
     *
     * @example
     * // When closing game
     * autoSave.stopAutoSave();
     */
    stopAutoSave(): void {
        if (this.autoSaveIntervalId !== null) {
            clearInterval(this.autoSaveIntervalId);
            this.autoSaveIntervalId = null;
        }
    }

    /**
     * Manually trigger a save (in addition to auto-saves)
     *
     * @param slotId - Save slot identifier
     * @param gameState - Game state to save
     *
     * @remarks
     * Can be called on player action (e.g., after major quest completion).
     * Will complete before returning.
     *
     * @example
     * // Player completes a dungeon
     * await autoSave.manualSave('slot_0', updatedGameState);
     */
    async manualSave(slotId: string, gameState: GameState): Promise<void> {
        if (this.saveInProgress) {
            return; // Skip if already saving
        }

        this.saveInProgress = true;
        try {
            await this.gameStateRepository.save(slotId, gameState);
            this.lastSaveTime = new Date();
            this.lastSaveError = null;
        } catch (error) {
            this.lastSaveError = error instanceof Error ? error : new Error(String(error));
        } finally {
            this.saveInProgress = false;
        }
    }

    /**
     * Get time elapsed since last save
     *
     * @returns String describing time since last save, or null if never saved
     *
     * @example
     * const elapsed = autoSave.getTimeSinceLastSave();
     * // "2 minutes ago" or "Just now" or null
     */
    getTimeSinceLastSave(): string | null {
        if (!this.lastSaveTime) {
            return null;
        }

        const now = new Date();
        const diff = now.getTime() - this.lastSaveTime.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) {
            return 'Just now';
        }
        if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    /**
     * Check if there was an error in the last save
     *
     * @returns Error object if last save failed, null otherwise
     *
     * @remarks
     * Used to detect and display save errors to player.
     *
     * @example
     * if (autoSave.getLastError()) {
     *   console.error('Save failed:', autoSave.getLastError());
     * }
     */
    getLastError(): Error | null {
        return this.lastSaveError;
    }

    /**
     * Get last save timestamp
     *
     * @returns Date of last successful save, or null if never saved
     */
    getLastSaveTime(): Date | null {
        return this.lastSaveTime;
    }

    /**
     * Check if a save is currently in progress
     *
     * @returns true if save operation is ongoing
     */
    isSaveInProgress(): boolean {
        return this.saveInProgress;
    }

    /**
     * Perform a single save operation
     *
     * @remarks
     * Internal method called by auto-save interval or manual triggers.
     * Handles error silently to avoid interrupting gameplay.
     */
    private async performSave(
        slotId: string,
        getGameStateFn: () => GameState | undefined,
        config: AutoSaveConfig
    ): Promise<void> {
        if (this.saveInProgress) {
            return; // Skip if already saving
        }

        this.saveInProgress = true;
        try {
            const gameState = getGameStateFn();
            if (!gameState) {
                return; // Skip if no game state
            }
            await this.gameStateRepository.save(slotId, gameState);
            this.lastSaveTime = new Date();
            this.lastSaveError = null;

            if (config.debug) {
                console.log(`[AutoSave] Save completed at ${this.lastSaveTime.toISOString()}`);
            }
        } catch (error) {
            this.lastSaveError = error instanceof Error ? error : new Error(String(error));

            if (config.debug) {
                console.error('[AutoSave] Save failed:', this.lastSaveError);
            }
        } finally {
            this.saveInProgress = false;
        }
    }
}

/**
 * Global auto-save service instance
 *
 * @remarks
 * Created once at app startup, persists throughout game session.
 */
let autoSaveServiceInstance: AutoSaveService | null = null;

/**
 * Get or create the global auto-save service
 *
 * @param gameStateRepository - Game state repository for persistence
 * @returns Singleton AutoSaveService instance
 *
 * @example
 * const autoSave = getAutoSaveService(repository);
 * autoSave.startAutoSave('slot_0', getGameState);
 */
export function getAutoSaveService(
    gameStateRepository: IGameStateRepository
): AutoSaveService {
    if (!autoSaveServiceInstance) {
        autoSaveServiceInstance = new AutoSaveService(gameStateRepository);
    }
    return autoSaveServiceInstance;
}

/**
 * Reset auto-save service (testing only)
 *
 * @remarks
 * Clears the singleton instance. Used in tests to ensure clean state.
 */
export function resetAutoSaveService(): void {
    if (autoSaveServiceInstance) {
        autoSaveServiceInstance.stopAutoSave();
    }
    autoSaveServiceInstance = null;
}

/**
 * Stop the global auto-save service
 *
 * @remarks
 * Call when player logs out or session ends.
 */
export function stopAutoSaveService(): void {
    if (autoSaveServiceInstance) {
        autoSaveServiceInstance.stopAutoSave();
    }
}
