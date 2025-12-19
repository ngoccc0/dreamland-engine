'use client';

/**
 * useActionTracker Hook - Manage player action history in React
 *
 * @remarks
 * **Purpose:** React integration for the ActionTrackerEngine.
 * Manages action history state and provides callbacks to record actions.
 *
 * **Design:**
 * - useCallback memoizes action recording to prevent unnecessary re-renders
 * - State stored in parent (useGameState) for persistence
 * - Pure functions (ActionTrackerEngine) called without dependencies
 *
 * **Usage:**
 * ```typescript
 * const { recordAction, recordCombatAction, getActionHistory } = useActionTracker(
 *   actionHistory,
 *   setActionHistory
 * );
 *
 * recordCombatAction({
 *   id: generateId(),
 *   timestamp: Date.now(),
 *   targetCreatureId: creatureId,
 *   targetCreatureType: 'goblin',
 *   damageDealt: 15,
 * });
 * ```
 */

import { useCallback } from 'react';
import {
  ActionTrackerEngine,
  PlayerAction,
  ActionHistory,
  CombatAction,
  HarvestingAction,
  CraftingAction,
  ItemUsageAction,
  SkillUsageAction,
  MovementAction,
  ExplorationAction,
  FarmingAction,
} from '@/core/engines/action-tracker';

interface UseActionTrackerOptions {
  /**
   * Automatically archive actions older than N
   * (set to 0 or undefined to disable)
   */
  autoArchiveThreshold?: number;
}

/**
 * Hook for managing player action history
 *
 * @param actionHistory - Current action history state
 * @param setActionHistory - State setter
 * @param options - Configuration options
 * @returns Object with action recording functions and queries
 *
 * @remarks
 * All returned functions are memoized to prevent unnecessary re-renders.
 * Action recording is synchronous (no async/await).
 */
export function useActionTracker(
  actionHistory: ActionHistory,
  setActionHistory: (history: ActionHistory) => void,
  options: UseActionTrackerOptions = {}
) {
  const { autoArchiveThreshold = 1000 } = options;

  /**
   * Generic action recording (base case)
   */
  const recordAction = useCallback(
    (action: PlayerAction) => {
      let newHistory = ActionTrackerEngine.recordAction(actionHistory, action);

      // Auto-archive if history gets too large
      if (
        autoArchiveThreshold > 0 &&
        newHistory.totalActionCount > autoArchiveThreshold
      ) {
        newHistory = ActionTrackerEngine.archiveOldActions(
          newHistory,
          Math.floor(autoArchiveThreshold * 0.75) // Keep 75% of threshold
        );
      }

      setActionHistory(newHistory);
    },
    [actionHistory, setActionHistory, autoArchiveThreshold]
  );

  /**
   * Record a combat action (player attacks creature)
   */
  const recordCombatAction = useCallback(
    (action: Omit<CombatAction, 'type'>) => {
      recordAction({ ...action, type: 'COMBAT' } as CombatAction);
    },
    [recordAction]
  );

  /**
   * Record a harvesting action (player gathers item)
   */
  const recordHarvestingAction = useCallback(
    (action: Omit<HarvestingAction, 'type'>) => {
      recordAction({ ...action, type: 'HARVESTING' } as HarvestingAction);
    },
    [recordAction]
  );

  /**
   * Record a crafting action (player combines items)
   */
  const recordCraftingAction = useCallback(
    (action: Omit<CraftingAction, 'type'>) => {
      recordAction({ ...action, type: 'CRAFTING' } as CraftingAction);
    },
    [recordAction]
  );

  /**
   * Record an item usage action (consume/equip)
   */
  const recordItemUsageAction = useCallback(
    (action: Omit<ItemUsageAction, 'type'>) => {
      recordAction({ ...action, type: 'ITEM_USAGE' } as ItemUsageAction);
    },
    [recordAction]
  );

  /**
   * Record a skill usage action (cast spell/ability)
   */
  const recordSkillUsageAction = useCallback(
    (action: Omit<SkillUsageAction, 'type'>) => {
      recordAction({ ...action, type: 'SKILL_USAGE' } as SkillUsageAction);
    },
    [recordAction]
  );

  /**
   * Record a movement action (player moves between chunks)
   */
  const recordMovementAction = useCallback(
    (action: Omit<MovementAction, 'type'>) => {
      recordAction({ ...action, type: 'MOVEMENT' } as MovementAction);
    },
    [recordAction]
  );

  /**
   * Record an exploration action (discover landmark/NPC)
   */
  const recordExplorationAction = useCallback(
    (action: Omit<ExplorationAction, 'type'>) => {
      recordAction({ ...action, type: 'EXPLORATION' } as ExplorationAction);
    },
    [recordAction]
  );

  /**
   * Record a farming action (till/plant/water/harvest crop)
   */
  const recordFarmingAction = useCallback(
    (action: Omit<FarmingAction, 'type'>) => {
      recordAction({ ...action, type: 'FARMING' } as FarmingAction);
    },
    [recordAction]
  );

  /**
   * Query: Get action history (read-only)
   */
  const getActionHistory = useCallback(() => actionHistory, [actionHistory]);

  /**
   * Query: Count actions by type
   */
  const countActions = useCallback(
    (type: PlayerAction['type']) => {
      return ActionTrackerEngine.countByType(actionHistory, type);
    },
    [actionHistory]
  );

  /**
   * Query: Count actions matching custom filter
   */
  const countActionsMatching = useCallback(
    (predicate: (action: PlayerAction) => boolean) => {
      return ActionTrackerEngine.countByFilter(actionHistory, predicate);
    },
    [actionHistory]
  );

  /**
   * Query: Get recent actions
   */
  const getRecentActions = useCallback(
    (count: number) => {
      return ActionTrackerEngine.getRecent(actionHistory, count);
    },
    [actionHistory]
  );

  /**
   * Query: Get total damage dealt
   */
  const getTotalDamageDealt = useCallback(
    (creatureType?: string) => {
      return ActionTrackerEngine.getTotalDamageDealt(actionHistory, creatureType);
    },
    [actionHistory]
  );

  /**
   * Query: Get total items harvested
   */
  const getTotalItemsHarvested = useCallback(
    (itemName?: string) => {
      return ActionTrackerEngine.getTotalItemsHarvested(actionHistory, itemName);
    },
    [actionHistory]
  );

  /**
   * Query: Get total items crafted
   */
  const getTotalItemsCrafted = useCallback(
    (recipeId?: string) => {
      return ActionTrackerEngine.getTotalItemsCrafted(actionHistory, recipeId);
    },
    [actionHistory]
  );

  return {
    // Recording functions
    recordAction,
    recordCombatAction,
    recordHarvestingAction,
    recordCraftingAction,
    recordItemUsageAction,
    recordSkillUsageAction,
    recordMovementAction,
    recordExplorationAction,
    recordFarmingAction,
    // Query functions
    getActionHistory,
    countActions,
    countActionsMatching,
    getRecentActions,
    getTotalDamageDealt,
    getTotalItemsHarvested,
    getTotalItemsCrafted,
  };
}
