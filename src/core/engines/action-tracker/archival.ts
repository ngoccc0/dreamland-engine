/**
 * Action History Archival - Clean up stale action records
 *
 * OVERVIEW: Implements maintenance operations for action history to prevent
 * unbounded memory growth from accumulating actions over long play sessions.
 *
 * ## Problem Solved
 *
 * **Edge Case:** Action history never cleared
 * - Player plays for 1000 hours
 * - Records ~1 action per second = 3.6M actions
 * - Each action ~200 bytes JSON = ~720 MB in memory
 * - Result: Memory leak, performance degradation, save file bloat
 *
 * **Solution:** Archival + cleanup strategy
 * - Keep recent actions hot (7 days in-game)
 * - Archive old actions (player can query history)
 * - Delete very old actions (>30 days)
 *
 * ## Archival Strategy
 *
 * Three-tier storage:
 *
 * 1. **Hot Tier (0-7 days):** In ActionHistory.actions array
 *    - Fast access for quests/achievements
 *    - Memory usage: ~1-5 MB typical play
 *
 * 2. **Cold Tier (7-30 days):** Separately archived (future: IndexedDB)
 *    - Slower access (not in main loop)
 *    - Used for analytics/player history
 *
 * 3. **Deleted (>30 days):** Removed permanently
 *    - Maintains bounded storage
 *    - Player can't query
 *
 * ## Usage
 *
 * Call periodically (e.g., on save):
 * ```typescript
 * let history = actionHistory;
 * if (shouldArchive) {
 *   history = ActionArchivalEngine.archiveOldActions(
 *     history,
 *     gameTime,     // Current game time (in ticks)
 *     7 * 24 * 60   // Archive threshold: 7 game days
 *   );
 * }
 * ```
 */

import { ActionHistory, PlayerAction } from './schemas';

/**
 * Configuration for action archival
 */
export interface ArchivalConfig {
    /** Time threshold (game ticks) to archive actions. Actions older kept in hot storage */
    hotsearchThresholdTicks: number;
    /** Time threshold (game ticks) before permanently deleting. E.g., 30 days = 30 * 24 * 60 ticks */
    deleteThresholdTicks: number;
    /** Maximum size (bytes) to allow before forcing archival. E.g., 50 MB = 50 * 1024 * 1024 */
    maxHistorySizeBytes: number;
}

/**
 * Default configuration: Keep 7 days hot, 30 days archived, max 50 MB
 */
export const DEFAULT_ARCHIVAL_CONFIG: ArchivalConfig = {
    hotsearchThresholdTicks: 7 * 24 * 60,       // 7 game days in ticks
    deleteThresholdTicks: 30 * 24 * 60,         // 30 game days in ticks
    maxHistorySizeBytes: 50 * 1024 * 1024,      // 50 MB
};

/**
 * ActionArchivalEngine: Maintains action history size
 */
export class ActionArchivalEngine {
    /**
     * archiveOldActions
     *
     * Remove actions older than archivalThreshold from hot storage.
     * Maintains bounded memory usage.
     *
     * @remarks
     * **Algorithm:**
     * 1. Calculate cutoff timestamp: currentGameTime - hotsearchThresholdTicks
     * 2. Keep only actions with timestamp >= cutoff
     * 3. Return new history with filtered actions
     * 4. Lost actions are discarded (simple implementation, no archival file yet)
     *
     * **Complexity:** O(n) where n = total actions
     * **Safety:** Immutable - original history unchanged
     *
     * **Future Enhancement:** Could save discarded actions to IndexedDB before deleting
     *
     * @param history - Current action history (unmodified)
     * @param currentGameTime - Current game time in ticks
     * @param config - Archival configuration (thresholds, limits)
     * @returns New ActionHistory with old actions removed
     *
     * @example
     * const history = actionHistory;
     * const gameTime = 1000000; // Ticks elapsed
     * const archival = DEFAULT_ARCHIVAL_CONFIG;
     *
     * const cleaned = ActionArchivalEngine.archiveOldActions(history, gameTime, archival);
     * // Result: history.actions.length reduced, keeping only recent 7 days
     *
     * @example
     * // Call periodically to prevent memory bloat
     * if (gameState.turn % 1440 === 0) { // Every 24 game hours
     *   actionHistory = ActionArchivalEngine.archiveOldActions(
     *     actionHistory,
     *     gameState.gameTime,
     *     DEFAULT_ARCHIVAL_CONFIG
     *   );
     * }
     */
    static archiveOldActions(
        history: ActionHistory,
        currentGameTime: number,
        config: ArchivalConfig = DEFAULT_ARCHIVAL_CONFIG
    ): ActionHistory {
        const cutoffTime = currentGameTime - config.hotsearchThresholdTicks;

        // Filter: keep only actions newer than cutoff
        const recentActions = history.actions.filter(
            (action) => action.timestamp >= cutoffTime
        );

        // If all actions were removed, return empty history
        if (recentActions.length === 0) {
            return {
                actions: [],
                lastActionId: history.lastActionId,
                totalActionCount: history.totalActionCount,
                // Note: totalActionCount kept unchanged to preserve analytics
                // (player still earned those action even if history is cleared)
            };
        }

        return {
            actions: recentActions,
            lastActionId: history.lastActionId, // Preserve last action ID even if archival
            totalActionCount: history.totalActionCount, // Preserve total count
        };
    }

    /**
     * cleanupIfNeeded
     *
     * Conditionally trigger cleanup based on history size or age.
     * Useful for save-time maintenance.
     *
     * @remarks
     * **When to call:**
     * - After saving game state
     * - On long rest/camp action
     * - Periodically (e.g., every 24 game hours)
     *
     * **Check performed:**
     * 1. If history size > maxHistorySizeBytes, archive immediately
     * 2. Else if any action > deleteThresholdTicks, archive
     * 3. Else return unchanged history
     *
     * @param history - Current action history
     * @param currentGameTime - Current game time in ticks
     * @param config - Archival configuration
     * @returns Same history if cleanup not needed, else archived version
     *
     * @example
     * // Save game with auto-cleanup
     * gameState.actionHistory = ActionArchivalEngine.cleanupIfNeeded(
     *   gameState.actionHistory,
     *   gameState.gameTime
     * );
     * await saveGameState(gameState);
     */
    static cleanupIfNeeded(
        history: ActionHistory,
        currentGameTime: number,
        config: ArchivalConfig = DEFAULT_ARCHIVAL_CONFIG
    ): ActionHistory {
        // Rough size estimate (each action ~200 bytes JSON + overhead)
        const estimatedSize = history.actions.length * 200;

        // Trigger cleanup if too large or if oldest action exceeds delete threshold
        const shouldCleanup =
            estimatedSize > config.maxHistorySizeBytes ||
            (history.actions.length > 0 &&
                currentGameTime - history.actions[0].timestamp > config.deleteThresholdTicks);

        if (shouldCleanup) {
            return this.archiveOldActions(history, currentGameTime, config);
        }

        return history;
    }

    /**
     * getOldestActionTime
     *
     * Find timestamp of oldest recorded action.
     * Useful for monitoring history age.
     *
     * @remarks
     * **Uses:**
     * - Check if cleanup is needed
     * - Display player stats ("Your earliest recorded action: 45 days ago")
     * - Debug memory issues
     *
     * @param history - Action history to query
     * @returns Timestamp of oldest action, or null if history empty
     *
     * @example
     * const oldest = ActionArchivalEngine.getOldestActionTime(history);
     * const age = currentGameTime - oldest;
     * console.log(`History age: ${age} ticks (${age / (24 * 60)} game days)`);
     */
    static getOldestActionTime(history: ActionHistory): number | null {
        if (history.actions.length === 0) return null;
        return history.actions[0].timestamp;
    }

    /**
     * getHistoryStats
     *
     * Return summary statistics about action history.
     * For monitoring/debugging.
     *
     * @remarks
     * **Returned stats:**
     * - totalActions: Total count (including archived)
     * - hotActions: Current in-memory count
     * - oldestActionTime: Earliest action timestamp (or null)
     * - newestActionTime: Latest action timestamp (or null)
     * - estimatedMemoryBytes: Rough memory usage
     *
     * @param history - Action history to analyze
     * @returns Statistics object
     *
     * @example
     * const stats = ActionArchivalEngine.getHistoryStats(history);
     * console.log(`Hot: ${stats.hotActions}/${stats.totalActions}, Age: ${stats.ageGameDays} days`);
     */
    static getHistoryStats(history: ActionHistory): {
        totalActions: number;
        hotActions: number;
        oldestActionTime: number | null;
        newestActionTime: number | null;
        estimatedMemoryBytes: number;
    } {
        const oldestTime = this.getOldestActionTime(history);
        const newestTime =
            history.actions.length > 0
                ? history.actions[history.actions.length - 1].timestamp
                : null;

        return {
            totalActions: history.totalActionCount,
            hotActions: history.actions.length,
            oldestActionTime: oldestTime,
            newestActionTime: newestTime,
            estimatedMemoryBytes: history.actions.length * 200,
        };
    }
}
