'use client';

import { useCallback, useMemo } from 'react';
import type { GameState } from '@/core/domain/gamestate';
import type { SideEffect } from '@/core/entities/side-effects';
import type { QuestRuntimeState } from '@/core/domain/quest';
import type { AchievementRuntimeState } from '@/core/domain/achievement';
import { evaluateAllActiveQuests } from '@/core/usecases/quest-usecase';
import { evaluateAllAchievements } from '@/core/usecases/achievement-usecase';
import { createEmptyStatistics } from '@/core/engines/statistics/schemas';
import { QUEST_TEMPLATES, getQuestTemplate } from '@/core/data/quests/quest-templates';
import { ACHIEVEMENT_TEMPLATES, getAchievementTemplate } from '@/core/data/quests/achievement-templates';
import { getCriteriaProgress } from '@/core/rules/criteria-rule';

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
/**
 * Merged quest display object (template + runtime state)
 * 
 * @remarks
 * Used by UI components to display quest information with both
 * static template data (title, description) and runtime data (progress).
 */
export interface QuestDisplay {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'abandoned' | 'failed';
    progress: number; // 0.0 to 1.0+ (can exceed 1.0)
    criteria: any;
    rewards: any;
    startedAt: Date;
}

/**
 * Merged achievement display object (template + runtime state)
 * 
 * @remarks
 * Used by UI components to display achievement information.
 */
export interface AchievementDisplay {
    id: string;
    title: string;
    description: string;
    category: string;
    criteria: any;
    rarity: string;
    reward: any;
    progress: number;
    unlockedAt?: Date;
}

/**
 * Hook for managing quest and achievement state for UI display
 *
 * @remarks
 * **Responsibility:**
 * - Merge quest/achievement templates with runtime state
 * - Calculate progress percentages
 * - Provide sorted/filtered lists for UI display
 *
 * **Pattern:**
 * Templates are immutable and never change.
 * Runtime state (progress, completion) comes from GameState.
 * This hook merges them into display objects for React components.
 *
 * @returns Object with active quests, achievements, and helpers
 * 
 * @example
 * const { activeQuests, unlockedAchievements } = useQuestState(activeQuestsRuntimeState, unlockedAchievementsRuntimeState, statistics);
 * 
 * activeQuests.forEach(quest => {
 *   console.log(quest.title); // { en: 'Hunt Goblins', vi: 'Săn Goblin' }
 *   console.log(quest.progress); // 0.7 (70% complete)
 * });
 */
export function useQuestState(
    activeQuestsRuntime: QuestRuntimeState[] = [],
    unlockedAchievementsRuntime: AchievementRuntimeState[] = [],
    statistics: any = null
) {
    /**
     * Build display objects for active quests
     */
    const activeQuests = useMemo(() => {
        return activeQuestsRuntime.map((runtimeState): QuestDisplay | null => {
            const template = getQuestTemplate(runtimeState.questId);
            if (!template) return null;

            // Calculate progress based on criteria
            const progress = getCriteriaProgress(template.criteria, statistics || {});

            return {
                id: runtimeState.questId,
                title: template.title,
                description: template.description,
                status: (runtimeState.status || 'active') as any,
                progress,
                criteria: template.criteria,
                rewards: template.rewards,
                startedAt: runtimeState.startedAt || new Date(),
            };
        }).filter((q): q is QuestDisplay => q !== null);
    }, [activeQuestsRuntime, statistics]);

    /**
     * Build display objects for unlocked achievements
     */
    const unlockedAchievements = useMemo(() => {
        return unlockedAchievementsRuntime.map((runtimeState): AchievementDisplay | null => {
            const template = getAchievementTemplate(runtimeState.achievementId);
            if (!template) return null;

            // Calculate progress for display
            const progress = getCriteriaProgress(template.criteria, statistics || {});

            return {
                id: runtimeState.achievementId,
                title: template.title,
                description: template.description,
                category: template.category,
                criteria: template.criteria,
                rarity: template.rarity,
                reward: template.reward,
                progress: Math.min(1.0, progress), // Clamp to 1.0 for display
                unlockedAt: runtimeState.unlockedAt || new Date(),
            };
        }).filter((a): a is AchievementDisplay => a !== null);
    }, [unlockedAchievementsRuntime, statistics]);

    /**
     * Get a single quest by ID with merged data
     */
    const getQuestDisplay = useCallback((questId: string): QuestDisplay | null => {
        const runtimeState = activeQuestsRuntime.find(q => q.questId === questId);
        if (!runtimeState) return null;

        const template = getQuestTemplate(questId);
        if (!template) return null;

        const progress = getCriteriaProgress(template.criteria, statistics || {});

        return {
            id: questId,
            title: template.title,
            description: template.description,
            status: (runtimeState.status || 'active') as any,
            progress,
            criteria: template.criteria,
            rewards: template.rewards,
            startedAt: runtimeState.startedAt || new Date(),
        };
    }, [activeQuestsRuntime, statistics]);

    /**
     * Get a single achievement by ID with merged data
     */
    const getAchievementDisplay = useCallback((achievementId: string): AchievementDisplay | null => {
        const runtimeState = unlockedAchievementsRuntime.find(a => a.achievementId === achievementId);
        if (!runtimeState) return null;

        const template = getAchievementTemplate(achievementId);
        if (!template) return null;

        const progress = getCriteriaProgress(template.criteria, statistics || {});

        return {
            id: achievementId,
            title: template.title,
            description: template.description,
            category: template.category,
            criteria: template.criteria,
            rarity: template.rarity,
            reward: template.reward,
            progress: Math.min(1.0, progress),
            unlockedAt: runtimeState.unlockedAt || new Date(),
        };
    }, [unlockedAchievementsRuntime, statistics]);

    /**
     * Get all available quest templates (for quest selection/accepting)
     */
    const allQuests = useMemo(() => {
        return Object.values(QUEST_TEMPLATES).map((template): QuestDisplay => ({
            id: template.id,
            title: template.title,
            description: template.description,
            status: 'active',
            progress: 0,
            criteria: template.criteria,
            rewards: template.rewards,
            startedAt: new Date(),
        }));
    }, []);

    /**
     * Get all available achievement templates
     */
    const allAchievements = useMemo(() => {
        return Object.values(ACHIEVEMENT_TEMPLATES).map((template): AchievementDisplay => ({
            id: template.id,
            title: template.title,
            description: template.description,
            category: template.category,
            criteria: template.criteria,
            rarity: template.rarity,
            reward: template.reward,
            progress: getCriteriaProgress(template.criteria, statistics || {}),
        }));
    }, [statistics]);

    /**
     * Get quests sorted by progress (most complete first)
     */
    const questsSortedByProgress = useMemo(() => {
        return [...activeQuests].sort((a, b) => b.progress - a.progress);
    }, [activeQuests]);

    /**
     * Get achievements sorted by progress
     */
    const achievementsSortedByProgress = useMemo(() => {
        return [...unlockedAchievements].sort((a, b) => b.progress - a.progress);
    }, [unlockedAchievements]);

    return {
        // Active state
        activeQuests,
        unlockedAchievements,

        // All templates
        allQuests,
        allAchievements,

        // Sorted views
        questsSortedByProgress,
        achievementsSortedByProgress,

        // Getters
        getQuestDisplay,
        getAchievementDisplay,

        // Counters
        activeQuestCount: activeQuests.length,
        unlockedAchievementCount: unlockedAchievements.length,
    };
}