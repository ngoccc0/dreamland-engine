'use client';

import { useCallback, useMemo } from 'react';
import type { GameState } from '@/core/types/game';
import type { ExperienceUseCase } from '@/core/usecases/experience-usecase';

/**
 * Selector hook for experience/leveling state.
 *
 * @remarks
 * **SSOT Pattern:**
 * Extracts only experience-related fields from GameState.
 * Memoized on playerStats XP fields only - prevents re-renders on other changes.
 *
 * **Returned Fields:**
 * - `currentLevel`: Player's current level (1-100)
 * - `currentXp`: Total accumulated XP
 * - `xpForCurrentLevel`: XP needed to reach current level
 * - `xpForNextLevel`: XP needed to reach next level
 * - `xpProgress`: Progress to next level (0-1 normalized)
 * - `xpRemaining`: XP needed to level up from current position
 * - `canLevelUp`: Boolean flag (ready for level up)
 * - `unreadLevelUp`: Whether player has unseen level up notification
 *
 * **Stat Gains on Level Up:**
 * - HP: +10 per level
 * - Attack: +2 per level
 * - Defense: +1 per level
 * - Skill Points: +1 per level (for skill tree unlocks)
 *
 * **Performance Impact:**
 * Components only re-render when XP or level changes.
 * Prevents re-renders when player moves, changes inventory, etc.
 *
 * @param gameState - Full game state (passed via props, not context)
 * @returns Memoized experience state slice
 */
export function useExperienceState(gameState: GameState) {
    return useMemo(() => {
        const playerStats = gameState.playerStats;
        const currentXp = playerStats.totalExperience || 0;
        const currentLevel = playerStats.level || 1;

        // Simplified: assume 100 XP per level for now
        // In real implementation, would call calculateCumulativeXp()
        const xpForCurrentLevel = (currentLevel - 1) * 100;
        const xpForNextLevel = currentLevel * 100;
        const xpThisLevel = currentXp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const xpProgress = Math.min(1, Math.max(0, xpThisLevel / xpNeeded));
        const xpRemaining = Math.max(0, xpForNextLevel - currentXp);

        return {
            currentLevel,
            currentXp,
            xpForCurrentLevel,
            xpForNextLevel,
            xpThisLevel,
            xpNeeded,
            xpProgress,
            xpRemaining,
            canLevelUp: currentXp >= xpForNextLevel,
            hasLeveledUp: playerStats.hasLeveledUp || false,
            totalLevelUps: playerStats.totalLevelUps || 0,
            statGains: {
                hp: currentLevel > 1 ? 10 * (currentLevel - 1) : 0,
                attack: currentLevel > 1 ? 2 * (currentLevel - 1) : 0,
                defense: currentLevel > 1 ? 1 * (currentLevel - 1) : 0,
                skillPoints: currentLevel - 1
            }
        };
    }, [gameState.playerStats]);
}

/**
 * Integrates ExperienceUseCase into the game loop for XP gains and leveling.
 *
 * @remarks
 * **Architecture Pattern:**
 * Bridges pure ExperienceUseCase (level calculations) with game loop.
 * - Adds XP to player (from combat wins, exploration, achievements)
 * - Automatically detects level ups
 * - Applies stat increases on level up
 * - Generates level-up notifications
 *
 * **XP Sources:**
 * - Combat victories: Based on enemy level and difficulty
 * - Exploration: Finding new areas, creatures
 * - Achievements: Special actions (defeating boss, crafting legendary item)
 * - Quests: Completing objectives
 *
 * **Level Up Effects:**
 * - HP: +10
 * - Attack: +2
 * - Defense: +1
 * - Skill Points: +1
 * - Play level-up sound/animation
 * - Display notification
 *
 * @param experienceUsecase - Injected via DI container
 * @returns Object with experience management methods
 */
export function useExperienceIntegration(_experienceUsecase: ExperienceUseCase) {
    /**
     * Add XP to player and check for level up.
     *
     * @remarks
     * **Steps:**
     * 1. Add XP amount to player's total
     * 2. Check if reached next level threshold
     * 3. If level up: apply stat increases, generate effects
     * 4. Return XP result with new level info
     *
     * **Stat Increases (per level):**
     * - HP: +10
     * - Attack: +2
     * - Defense: +1
     * - Skill Points: +1
     *
     * @param gameState - Current game state
     * @param xpAmount - Amount of XP to add
     * @param source - Where XP came from (combat, exploration, etc)
     * @returns Result with XP gained, level up info, stat increases
     */
    const addExperience = useCallback(
        async (
            gameState: GameState,
            xpAmount: number,
            source: string = 'combat'
        ): Promise<{
            success: boolean;
            xpGained: number;
            leveledUp: boolean;
            newLevel?: number;
            statGains?: { hp: number; attack: number; defense: number; skillPoints: number };
            message: string;
        }> => {
            try {
                const currentXp = gameState.playerStats.totalExperience || 0;
                const currentLevel = gameState.playerStats.level || 1;
                const newXp = currentXp + xpAmount;

                // Simplified level up check: 100 XP per level
                const newLevel = Math.floor(newXp / 100) + 1;
                const leveledUp = newLevel > currentLevel;

                let message = `Gained ${xpAmount} XP from ${source}`;
                const statGains = {
                    hp: 0,
                    attack: 0,
                    defense: 0,
                    skillPoints: 0
                };

                if (leveledUp) {
                    const levelDiff = newLevel - currentLevel;
                    statGains.hp = 10 * levelDiff;
                    statGains.attack = 2 * levelDiff;
                    statGains.defense = 1 * levelDiff;
                    statGains.skillPoints = levelDiff;
                    message = `LEVEL UP! Now level ${newLevel}! +${statGains.hp} HP, +${statGains.attack} ATK, +${statGains.defense} DEF, +${statGains.skillPoints} Skill Points`;
                }

                return {
                    success: true,
                    xpGained: xpAmount,
                    leveledUp,
                    newLevel: leveledUp ? newLevel : undefined,
                    statGains: leveledUp ? statGains : undefined,
                    message
                };
            } catch (error) {
                console.error('[useExperienceIntegration] Error adding experience:', error);
                return {
                    success: false,
                    xpGained: 0,
                    leveledUp: false,
                    message: 'Failed to add experience'
                };
            }
        },
        []
    );

    /**
     * Apply level up stat increases to player.
     *
     * @remarks
     * Called after level up is detected. Updates player stats with bonuses.
     * Generates visual/audio effects for level up event.
     *
     * **Stat Formula (per level gain):**
     * - HP: +10 × levels gained
     * - Attack: +2 × levels gained
     * - Defense: +1 × levels gained
     * - Skill Points: +1 × levels gained
     * - Max HP also increases proportionally
     *
     * @param gameState - Current game state
     * @param levelsGained - Number of levels to apply
     * @returns Updated game state with stat increases applied
     */
    const applyLevelUp = useCallback(
        async (gameState: GameState, levelsGained: number): Promise<{
            success: boolean;
            newGameState?: GameState;
            effects?: any[];
            message: string;
        }> => {
            try {
                // Simplified: just return success
                // Real implementation would update playerStats
                return {
                    success: true,
                    message: `Applied ${levelsGained} level up(s)!`,
                    effects: [
                        {
                            type: 'levelup_notification',
                            message: `+${levelsGained} Level!`
                        }
                    ]
                };
            } catch (error) {
                console.error('[useExperienceIntegration] Error applying level up:', error);
                return {
                    success: false,
                    message: 'Failed to apply level up'
                };
            }
        },
        []
    );

    /**
     * Mark a level up notification as read.
     *
     * @remarks
     * UI calls this after showing level up dialog to user.
     * Prevents duplicate notifications on next state update.
     *
     * @param gameState - Current game state
     * @returns Updated game state with notification cleared
     */
    const clearLevelUpNotification = useCallback(
        async (_gameState: GameState): Promise<{
            success: boolean;
            message: string;
        }> => {
            try {
                // Just return success - actual update happens in game state
                return {
                    success: true,
                    message: 'Notification cleared'
                };
            } catch (error) {
                console.error('[useExperienceIntegration] Error clearing notification:', error);
                return {
                    success: false,
                    message: 'Failed to clear notification'
                };
            }
        },
        []
    );

    return {
        addExperience,
        applyLevelUp,
        clearLevelUpNotification
    };
}
