'use client';

import { useCallback } from 'react';
import type { GameState } from '@/core/domain/gamestate';
import type { SideEffect } from '@/core/entities/side-effects';
import { evaluateAllActiveQuests } from '@/core/usecases/quest-usecase';
import { evaluateAllAchievements } from '@/core/usecases/achievement-usecase';
import { createEmptyStatistics } from '@/core/engines/statistics/schemas';

/**
 * Hook for integrating Statistics Engine with quest system
 *
 * @remarks
 * Provides methods to evaluate quests and achievements based on current game state.
 * This hook bridges the gap between legacy action handlers and the new quest system.
 *
 * **Responsibility:**
 * - Build GameState object from legacy state pieces
 * - Evaluate quest progress
 * - Trigger achievement unlocks
 * - Return cascading effects (quest completion, achievement unlock)
 *
 * @returns Object with quest evaluation methods
 */
export function useQuestIntegration() {
    /**
     * Build a GameState object from legacy game state pieces
     *
     * @remarks
     * This is a temporary bridge to support the quest system while
     * the rest of the codebase still uses the legacy state structure.
     * Once fully migrated, this will be unnecessary.
     *
     * @param state - Object with game state pieces
     * @returns Partial GameState for quest/achievement evaluation
     */
    const buildGameStateForEvaluation = useCallback((state: {
        playerId?: string;
        timestamp?: Date;
        turnCount?: number;
        currentChunkX?: number;
        currentChunkY?: number;
        activeQuests?: any[];
        unlockedAchievements?: any[];
        statistics?: any;
    }): GameState => {
        return {
            version: 1,
            playerId: state.playerId || 'unknown',
            timestamp: state.timestamp || new Date(),
            turnCount: state.turnCount || 0,
            currentChunkX: state.currentChunkX || 0,
            currentChunkY: state.currentChunkY || 0,
            player: {
                id: state.playerId || 'unknown',
                hp: 100,
                maxHp: 100,
                stamina: 100,
                maxStamina: 100,
                experience: 0,
                level: 1,
                inventory: [],
                equipment: {},
                attributes: {},
                position: { x: 0, y: 0 },
                health_history: [],
            },
            world: {
                seed: 0,
                currentBiome: 'forest',
                discoveredBiomes: [],
                discoveredLocations: {},
                weather: { type: 'clear', intensity: 0, remainingTurns: 0 },
                timeOfDay: 12,
                dayCount: 1,
                explorationProgress: 0,
            },
            narrative: {
                lastText: '',
                history: [],
                currentMood: '',
                context: {},
            },
            creatures: {},
            activeQuests: state.activeQuests || [],
            unlockedAchievements: state.unlockedAchievements || [],
            statistics: state.statistics || createEmptyStatistics(),
            enabledMods: [],
        };
    }, []);

    /**
     * Evaluate all active quests and return any completions/effects
     *
     * @param state - Game state object
     * @returns { newState, effects } Updated state and side effects
     */
    const evaluateQuests = useCallback((state: any) => {
        try {
            const gameState = buildGameStateForEvaluation(state);
            const result = evaluateAllActiveQuests(gameState);
            return result;
        } catch (err) {
            console.warn('[QuestIntegration] Failed to evaluate quests:', err);
            return {
                newState: state,
                effects: [] as SideEffect[]
            };
        }
    }, [buildGameStateForEvaluation]);

    /**
     * Evaluate all achievements and return any unlocks/effects
     *
     * @param state - Game state object
     * @returns { newState, effects } Updated state and side effects
     */
    const evaluateAchievements = useCallback((state: any) => {
        try {
            const gameState = buildGameStateForEvaluation(state);
            const result = evaluateAllAchievements(gameState);
            return result;
        } catch (err) {
            console.warn('[QuestIntegration] Failed to evaluate achievements:', err);
            return {
                newState: state,
                effects: [] as SideEffect[]
            };
        }
    }, [buildGameStateForEvaluation]);

    /**
     * Evaluate both quests and achievements in sequence
     * (achievements may unlock from quest completion)
     *
     * @param state - Game state object
     * @returns { newState, effects } Updated state and all cascading effects
     */
    const evaluateQuestsAndAchievements = useCallback((state: any) => {
        try {
            const gameState = buildGameStateForEvaluation(state);

            // 1. Evaluate quests
            const questResult = evaluateAllActiveQuests(gameState);

            // 2. Evaluate achievements (with updated state from quest completions)
            const achResult = evaluateAllAchievements(questResult.newState);

            // 3. Combine effects
            const allEffects = [...questResult.effects, ...achResult.effects];

            return {
                newState: achResult.newState,
                effects: allEffects
            };
        } catch (err) {
            console.warn('[QuestIntegration] Failed to evaluate quests and achievements:', err);
            return {
                newState: state,
                effects: [] as SideEffect[]
            };
        }
    }, [buildGameStateForEvaluation]);

    return {
        buildGameStateForEvaluation,
        evaluateQuests,
        evaluateAchievements,
        evaluateQuestsAndAchievements
    };
}
