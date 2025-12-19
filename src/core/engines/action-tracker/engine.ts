/**
 * Action Tracker Engine - Records and manages player action history
 *
 * @remarks
 * **Purpose:** Centralized repository for all player actions, enabling:
 * - Quest criteria evaluation (e.g., "kill 5 goblins")
 * - Statistics tracking (total kills, items gathered, etc.)
 * - Achievement detection (trigger on action patterns)
 * - Replay/analytics (action history playback)
 *
 * **Design Principles:**
 * - Immutable: Actions are appended, never modified
 * - Pure: No side effects, all functions are pure
 * - Efficient: O(1) append, O(n) queries (n = action count)
 * - Type-safe: Discriminated union ensures exhaustiveness
 *
 * **Usage:**
 * ```typescript
 * let history = createEmptyActionHistory();
 * history = ActionTrackerEngine.recordAction(history, combatAction);
 * const kills = ActionTrackerEngine.countByType(history, 'COMBAT');
 * const specificKills = ActionTrackerEngine.countByFilter(history, 
 *   action => action.type === 'COMBAT' && action.targetCreatureType === 'goblin'
 * );
 * ```
 */

import {
  PlayerAction,
  ActionHistory,
  CombatAction,
  HarvestingAction,
  CraftingAction,
  createEmptyActionHistory,
} from './schemas';

/**
 * Action Tracker Engine - Records and queries player actions
 */
export class ActionTrackerEngine {
  /**
   * Record a new action in history
   *
   * @param history - Current action history
   * @param action - New action to record
   * @returns Updated history with action appended
   *
   * @remarks
   * - Preserves existing actions
   * - Updates metadata (lastActionId, totalActionCount)
   * - Action is added EXACTLY as provided (no filtering/validation here)
   */
  static recordAction(
    history: ActionHistory,
    action: PlayerAction
  ): ActionHistory {
    return {
      ...history,
      actions: [...history.actions, action],
      lastActionId: action.id,
      totalActionCount: history.totalActionCount + 1,
    };
  }

  /**
   * Record multiple actions atomically
   *
   * @param history - Current action history
   * @param actions - Array of actions to record
   * @returns Updated history with all actions appended
   */
  static recordActions(
    history: ActionHistory,
    actions: PlayerAction[]
  ): ActionHistory {
    if (actions.length === 0) return history;

    return {
      ...history,
      actions: [...history.actions, ...actions],
      lastActionId: actions[actions.length - 1].id,
      totalActionCount: history.totalActionCount + actions.length,
    };
  }

  /**
   * Count actions by type
   *
   * @param history - Action history to query
   * @param type - Action type to count
   * @returns Number of actions matching type
   *
   * @remarks
   * **Complexity:** O(n) where n = total actions
   * For large histories, consider filtering by date range first
   */
  static countByType(
    history: ActionHistory,
    type: PlayerAction['type']
  ): number {
    return history.actions.filter(a => a.type === type).length;
  }

  /**
   * Count actions matching a custom filter
   *
   * @param history - Action history to query
   * @param predicate - Test function (returns true to count)
   * @returns Number of matching actions
   *
   * @remarks
   * **Flexibility:** Can check nested properties and complex conditions
   * **Example:**
   * ```typescript
   * ActionTrackerEngine.countByFilter(history, 
   *   action => action.type === 'COMBAT' && action.targetCreatureType === 'goblin'
   * );
   * ```
   */
  static countByFilter(
    history: ActionHistory,
    predicate: (action: PlayerAction) => boolean
  ): number {
    return history.actions.filter(predicate).length;
  }

  /**
   * Get all actions of a specific type
   *
   * @param history - Action history to query
   * @param type - Action type to filter
   * @returns Array of actions matching type
   */
  static getByType<T extends PlayerAction['type']>(
    history: ActionHistory,
    type: T
  ): Extract<PlayerAction, { type: T }>[] {
    return history.actions.filter(
      (a): a is Extract<PlayerAction, { type: T }> => a.type === type
    );
  }

  /**
   * Get actions within a time window
   *
   * @param history - Action history to query
   * @param startTimestamp - Start time (inclusive)
   * @param endTimestamp - End time (inclusive)
   * @returns Actions within the time range
   *
   * @remarks
   * Useful for: session statistics, hourly/daily summaries, cooldown tracking
   */
  static getByTimeWindow(
    history: ActionHistory,
    startTimestamp: number,
    endTimestamp: number
  ): PlayerAction[] {
    return history.actions.filter(
      a => a.timestamp >= startTimestamp && a.timestamp <= endTimestamp
    );
  }

  /**
   * Get actions by location
   *
   * @param history - Action history to query
   * @param x - Chunk X coordinate
   * @param y - Chunk Y coordinate
   * @returns All actions at that location
   */
  static getByLocation(
    history: ActionHistory,
    x: number,
    y: number
  ): PlayerAction[] {
    return history.actions.filter(
      a => a.playerPosition.x === x && a.playerPosition.y === y
    );
  }

  /**
   * Get recent actions (last N)
   *
   * @param history - Action history to query
   * @param count - Number of recent actions to return
   * @returns Last N actions in chronological order
   */
  static getRecent(history: ActionHistory, count: number): PlayerAction[] {
    return history.actions.slice(Math.max(0, history.actions.length - count));
  }

  /**
   * Sum a numeric property across matching actions
   *
   * @param history - Action history to query
   * @param predicate - Test function
   * @param property - Property name to sum
   * @returns Total value
   *
   * @remarks
   * **Example:** Total damage dealt
   * ```typescript
   * ActionTrackerEngine.sumProperty(history,
   *   action => action.type === 'COMBAT',
   *   action => (action as CombatAction).damageDealt
   * );
   * ```
   */
  static sumProperty(
    history: ActionHistory,
    predicate: (action: PlayerAction) => boolean,
    property: (action: PlayerAction) => number
  ): number {
    return history.actions
      .filter(predicate)
      .reduce((sum, action) => sum + property(action), 0);
  }

  /**
   * Get total damage dealt
   *
   * @param history - Action history to query
   * @param creatureType - Optional: filter by creature type
   * @returns Total damage across all combat actions
   */
  static getTotalDamageDealt(
    history: ActionHistory,
    creatureType?: string
  ): number {
    const combatActions = this.getByType(history, 'COMBAT');
    return combatActions
      .filter(a => !creatureType || a.targetCreatureType === creatureType)
      .reduce((sum, a) => sum + a.damageDealt, 0);
  }

  /**
   * Count items harvested by type
   *
   * @param history - Action history to query
   * @param itemName - Optional: filter by specific item
   * @returns Total items harvested
   */
  static getTotalItemsHarvested(
    history: ActionHistory,
    itemName?: string
  ): number {
    const harvestActions = this.getByType(history, 'HARVESTING');
    return harvestActions
      .filter(a => !itemName || a.itemName === itemName)
      .reduce((sum, a) => sum + a.quantity, 0);
  }

  /**
   * Count items crafted
   *
   * @param history - Action history to query
   * @param recipeId - Optional: filter by recipe
   * @returns Total items created
   */
  static getTotalItemsCrafted(
    history: ActionHistory,
    recipeId?: string
  ): number {
    const craftActions = this.getByType(history, 'CRAFTING');
    return craftActions
      .filter(a => !recipeId || a.recipeId === recipeId)
      .reduce((sum, a) => sum + a.output.quantity, 0);
  }

  /**
   * Archive old actions (for save file optimization)
   *
   * @param history - Action history
   * @param keepLastN - Number of recent actions to keep
   * @returns Trimmed history with only recent actions
   *
   * @remarks
   * Call periodically to prevent unbounded growth
   * Archived actions can be written to separate storage
   */
  static archiveOldActions(
    history: ActionHistory,
    keepLastN: number
  ): ActionHistory {
    if (history.actions.length <= keepLastN) return history;

    const keptActions = history.actions.slice(
      history.actions.length - keepLastN
    );

    return {
      ...history,
      actions: keptActions,
      totalActionCount: history.totalActionCount, // Keep original count
      lastActionId: history.lastActionId,
    };
  }

  /**
   * Clear all actions (for testing or game reset)
   *
   * @param history - Current history
   * @returns Empty action history with counters reset
   */
  static clearHistory(history: ActionHistory): ActionHistory {
    return {
      actions: [],
      lastActionId: '',
      totalActionCount: 0,
    };
  }
}
