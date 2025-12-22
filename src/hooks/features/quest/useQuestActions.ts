/**
 * Quest & Achievement Actions Hook - Pure Write/Dispatch
 *
 * @remarks
 * **Responsibility:**
 * - Provide methods to evaluate quests/achievements
 * - Trigger unlocks and state mutations
 * - Return side effects for game loop to apply
 *
 * **Pattern:** Manager hook (useCallback only, stateless).
 * This is ONLY imported by action handlers/buttons that WRITE state.
 *
 * **Why separated:**
 * Action buttons import this. Display-only components never import it.
 * Zero performance impact on read-only UI.
 */

'use client';

import { useCallback } from 'react';
import type { GameState } from '@/core/domain/gamestate';
import type { SideEffect } from '@/core/entities/side-effects';
import {
    evaluateAllActiveQuests,
    evaluateAllAchievements,
} from '@/core/usecases/quest-usecase';
import { createEmptyStatistics } from '@/core/engines/statistics/schemas';
import type { QuestActionResult } from './quest-types';

/**
 * Hook for quest/achievement evaluation and state mutations.
 *
 * @remarks
 * **Responsibility:**
 * - Build a complete GameState from legacy state pieces
 * - Call usecases to evaluate quests/achievements
 * - Return effects for game loop to apply
 *
 * **No Side Effects:**
 * This hook RETURNS effects but doesn't apply them.
 * The game loop (parent component) is responsible for dispatch.
 *
 * **Error Handling:**
 * Catches exceptions and logs. Returns safe fallback.
 *
 * @returns Object with action methods
 */
export function useQuestActions() {
    /**
     * Build a GameState object from legacy game state pieces.
     *
     * @remarks
     * Temporary bridge to support quest system while rest of code
     * uses legacy state structure. Once fully migrated, remove this.
     *
     * @param state - Legacy state object
     * @returns Partial GameState for quest/achievement evaluation
     */
    const buildGameStateForEvaluation = useCallback(
        (state: {
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
        },
        []
    );

    /**
     * Evaluate all active quests and return completions/effects.
     *
     * @remarks
     * Calls usecase with built GameState.
     * Returns effects for game loop to apply.
     *
     * @param state - Current game state
     * @returns { newState, effects } Updated state and side effects
     */
    const evaluateQuests = useCallback(
        (state: any): QuestActionResult => {
            try {
                const gameState = buildGameStateForEvaluation(state);
                const result = evaluateAllActiveQuests(gameState);
                return result;
            } catch (err) {
                console.warn('[QuestActions] Failed to evaluate quests:', err);
                return {
                    newState: state,
                    effects: [] as SideEffect[],
                };
            }
        },
        [buildGameStateForEvaluation]
    );

    /**
     * Evaluate all achievements and return unlocks/effects.
     *
     * @remarks
     * Separate from quests - achievements may depend on quest completions.
     *
     * @param state - Current game state
     * @returns { newState, effects } Updated state and side effects
     */
    const evaluateAchievements = useCallback(
        (state: any): QuestActionResult => {
            try {
                const gameState = buildGameStateForEvaluation(state);
                const result = evaluateAllAchievements(gameState);
                return result;
            } catch (err) {
                console.warn('[QuestActions] Failed to evaluate achievements:', err);
                return {
                    newState: state,
                    effects: [] as SideEffect[],
                };
            }
        },
        [buildGameStateForEvaluation]
    );

    /**
     * Evaluate quests AND achievements in sequence.
     *
     * @remarks
     * Quests first, then achievements (since achievements may unlock from quests).
     * Returns combined effects.
     *
     * @param state - Current game state
     * @returns { newState, effects } Updated state and all cascading effects
     */
    const evaluateQuestsAndAchievements = useCallback(
        (state: any): QuestActionResult => {
            try {
                const gameState = buildGameStateForEvaluation(state);

                // 1. Evaluate quests
                const questResult = evaluateAllActiveQuests(gameState);

                // 2. Evaluate achievements with updated state
                const achResult = evaluateAllAchievements(questResult.newState);

                // 3. Combine effects
                const allEffects = [...questResult.effects, ...achResult.effects];

                return {
                    newState: achResult.newState,
                    effects: allEffects,
                };
            } catch (err) {
                console.warn('[QuestActions] Failed to evaluate quests and achievements:', err);
                return {
                    newState: state,
                    effects: [] as SideEffect[],
                };
            }
        },
        [buildGameStateForEvaluation]
    );

    return {
        buildGameStateForEvaluation,
        evaluateQuests,
        evaluateAchievements,
        evaluateQuestsAndAchievements,
    };
}
