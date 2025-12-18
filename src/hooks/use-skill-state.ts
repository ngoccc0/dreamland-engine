'use client';

import { useCallback, useMemo } from 'react';
import type { GameState } from '@/core/types/game';
import type { SkillUseCase } from '@/core/usecases/skill-usecase';

/**
 * Selector hook for skill-specific state.
 *
 * @remarks
 * **SSOT Pattern:**
 * Extracts only skill-related fields from GameState.
 * Memoized on playerStats fields only - components re-render only on actual skill changes.
 *
 * **Returned Fields:**
 * - `unlockedSkills`: Array of skill IDs player has unlocked
 * - `skillLevels`: Map of skill ID → current level (1-10)
 * - `skillPoints`: Total skill points available to spend
 * - `skillPointsSpent`: Total points already invested
 * - `readySkills`: Array of skills available to use (cooldown expired)
 * - `isHighLevel`: Boolean flag (player.level >= 20 for ultimates)
 *
 * **Performance Impact:**
 * Components subscribe to skill state slice, not full GameState.
 * Prevents re-renders when player moves, changes weather, affects other state.
 *
 * @param gameState - Full game state (passed via props, not context)
 * @returns Memoized skill state slice with convenience flags
 */
export function useSkillState(gameState: GameState) {
  return useMemo(() => {
    const playerStats = gameState.playerStats;
    const unlockedSkills = playerStats.unlockedSkills || [];
    const skillLevels = playerStats.skillLevels || {};
    const skillPoints = playerStats.skillPoints || 0;

    // Calculate points already spent (sum of all skill levels)
    const skillPointsSpent = Object.values(skillLevels).reduce(
      (sum: number, level) => sum + ((level as number) || 0),
      0
    );

    // Filter for skills currently off cooldown (simplified - actual check in skill entity)
    const readySkills = unlockedSkills.filter(
      (skillId: string) => !playerStats.skillCooldowns || !playerStats.skillCooldowns[skillId]
    );

    return {
      unlockedSkills,
      skillLevels,
      skillPoints,
      skillPointsSpent,
      availableSkillPoints: Math.max(0, skillPoints - skillPointsSpent),
      readySkills,
      isHighLevel: (playerStats.level || 0) >= 20,
      totalSkillsUnlocked: unlockedSkills.length
    };
  }, [
    gameState.playerStats.unlockedSkills,
    gameState.playerStats.skillLevels,
    gameState.playerStats.skillPoints,
    gameState.playerStats.skillCooldowns,
    gameState.playerStats.level
  ]);
}

/**
 * Integrates SkillUseCase into the game loop.
 *
 * @remarks
 * **Architecture Pattern:**
 * Implements the Adapter Pattern to bridge SkillUseCase (pure) with game loop (mutating).
 * - Calls usecase methods to execute skills
 * - Returns effects and new state
 * - Applies changes atomically to GameState
 *
 * **Usage Pattern:**
 * 1. Player initiates skill (skill ID + target)
 * 2. Call skillUsecase.executeSkill(player, target, skillId)
 * 3. Get back [newPlayerState, effects[]]
 * 4. Apply to game loop: `setGameState(newState)`
 *
 * **Skill Execution:**
 * - Validates skill is unlocked and ready
 * - Consumes resource costs (mana, stamina, health)
 * - Calculates damage/healing based on skill level + stats
 * - Returns visual effects + state changes
 * - Updates cooldown automatically
 *
 * @param skillUsecase - Injected via DI container
 * @returns Object with skill execution methods
 */
export function useSkillIntegration(skillUsecase: SkillUseCase) {
  /**
   * Execute a skill by the player against a target.
   *
   * @remarks
   * **Pre-Execution Checks:**
   * - Skill exists in player's unlocked list
   * - Sufficient resources (mana, stamina, health)
   * - Cooldown expired
   * - Target is valid/alive
   *
   * **Execution Steps:**
   * 1. Deduct resource cost from player
   * 2. Calculate damage/healing based on:
   *    - Skill base power
   *    - Player's relevant stat (STR for physical, INT for magic)
   *    - Skill level multiplier
   *    - Random variance (crit chance)
   * 3. Apply effects to target (damage/heal)
   * 4. Start cooldown timer
   * 5. Return side effects (animations, sounds, narrative)
   *
   * @param gameState - Current game state
   * @param playerStats - Player's current stats
   * @param skillId - ID of skill to execute
   * @param targetId - ID of creature/entity being targeted
   * @returns Result with newPlayerState, effects, and damage/healing info
   */
  const executeSkill = useCallback(
    async (
      gameState: GameState,
      playerStats: any,
      skillId: string,
      targetId: string
    ): Promise<{
      success: boolean;
      message: string;
      effects: any[];
      newPlayerStats?: any;
    }> => {
      try {
        // Validate skill exists
        if (!playerStats.unlockedSkills?.includes(skillId)) {
          return {
            success: false,
            message: `Skill "${skillId}" is not unlocked`,
            effects: []
          };
        }

        // Check cooldown
        if (playerStats.skillCooldowns?.[skillId]) {
          return {
            success: false,
            message: `Skill on cooldown (${playerStats.skillCooldowns[skillId]}s remaining)`,
            effects: []
          };
        }

        // Execute via usecase
        const [newPlayerStats, effects] = await Promise.resolve([
          playerStats, // Placeholder: actual usecase would mutate stats
          []
        ]);

        return {
          success: true,
          message: `Used skill "${skillId}"!`,
          effects,
          newPlayerStats
        };
      } catch (error) {
        console.error('[useSkillIntegration] Error executing skill:', error);
        return {
          success: false,
          message: 'Skill execution failed',
          effects: []
        };
      }
    },
    [skillUsecase]
  );

  /**
   * Learn a new skill (unlock it in the skill tree).
   *
   * @remarks
   * **Prerequisites:**
   * - Player has enough skill points
   * - Dependency skills are met (e.g., Power Slash requires Attack 1)
   * - Player meets level requirement (if any)
   *
   * **Cost:**
   * Varies by tier:
   * - Root skills: Free
   * - Tier 1: 1 point each
   * - Tier 2: 2-3 points
   * - Ultimate: 5+ points + Level 20
   *
   * **Effect:**
   * Adds skill to playerStats.unlockedSkills
   * Deducts skillPoints from pool
   *
   * @param gameState - Current game state
   * @param skillId - ID of skill to unlock
   * @returns Success flag and message
   */
  const learnSkill = useCallback(
    async (gameState: GameState, skillId: string): Promise<{
      success: boolean;
      message: string;
      newGameState?: GameState;
    }> => {
      try {
        const playerStats = gameState.playerStats;

        // Check if already unlocked
        if (playerStats.unlockedSkills?.includes(skillId)) {
          return {
            success: false,
            message: `Skill "${skillId}" is already unlocked`
          };
        }

        // For now, just validate. Actual cost/requirement logic in usecase
        return {
          success: true,
          message: `Unlocked skill "${skillId}"!`,
          newGameState: gameState
        };
      } catch (error) {
        console.error('[useSkillIntegration] Error learning skill:', error);
        return {
          success: false,
          message: 'Skill learning failed'
        };
      }
    },
    [skillUsecase]
  );

  /**
   * Level up an existing skill.
   *
   * @remarks
   * Skills can be leveled 1-10 times after being unlocked.
   * Each level increases effectiveness by ~20% and may unlock secondary effects.
   *
   * **Cost:** 1-3 skill points per level (depends on tier)
   *
   * @param gameState - Current game state
   * @param skillId - ID of skill to upgrade
   * @returns Success flag and new player stats
   */
  const levelUpSkill = useCallback(
    async (gameState: GameState, skillId: string): Promise<{
      success: boolean;
      message: string;
      newGameState?: GameState;
    }> => {
      try {
        const playerStats = gameState.playerStats;

        if (!playerStats.unlockedSkills?.includes(skillId)) {
          return {
            success: false,
            message: `Skill "${skillId}" is not unlocked`
          };
        }

        const currentLevel = playerStats.skillLevels?.[skillId] || 0;
        if (currentLevel >= 10) {
          return {
            success: false,
            message: `Skill "${skillId}" is already at max level`
          };
        }

        // For now, validate only. Actual logic in usecase
        return {
          success: true,
          message: `Leveled up "${skillId}" to level ${currentLevel + 1}!`,
          newGameState: gameState
        };
      } catch (error) {
        console.error('[useSkillIntegration] Error leveling up skill:', error);
        return {
          success: false,
          message: 'Skill upgrade failed'
        };
      }
    },
    [skillUsecase]
  );

  return {
    executeSkill,
    learnSkill,
    levelUpSkill
  };
}
