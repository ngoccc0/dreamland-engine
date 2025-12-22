/**
 * Quest & Achievement Selectors Hook - Pure Read-Only
 *
 * @remarks
 * **Responsibility:**
 * - Read quest/achievement state from props or store
 * - Compute display data via memoization
 * - Return selectors for UI to read
 *
 * **Pattern:** Pure selector hook (useMemo only, no useState/side effects).
 * This ensures minimal bundle size when component imports this hook.
 *
 * **Why separated:**
 * UI components that ONLY display quests (no mutations) import this.
 * Never pulls in the "write" logic (useQuestActions) by accident.
 */

'use client';

import { useMemo, useCallback } from 'react';
import type { QuestRuntimeState } from '@/core/domain/quest';
import type { AchievementRuntimeState } from '@/core/domain/achievement';
import {
    calculateQuestDisplay,
    calculateAchievementDisplay,
    sortQuestsByProgress,
    sortAchievementsByProgress,
    getAllQuestsAsDisplay,
    getAllAchievementsAsDisplay,
} from './quest-calculations';
import type { QuestSelectorResult, QuestDisplay, AchievementDisplay } from './quest-types';

/**
 * Hook for selecting and computing quest/achievement display data.
 *
 * @remarks
 * **Memoization Strategy:**
 * - activeQuests memo on activeQuestsRuntime + statistics
 * - unlockedAchievements memo on unlockedAchievementsRuntime + statistics
 * - Sorted views memo on computed data
 * - getters are useCallback to prevent object allocation
 *
 * **Zero Side Effects:**
 * This hook only reads and computes. No mutations, no effects.
 *
 * @param activeQuestsRuntime - Array of active quest runtime states
 * @param unlockedAchievementsRuntime - Array of unlocked achievement states
 * @param statistics - Player statistics for progress calculation
 * @returns Object with selectors and helper functions
 */
export function useQuestSelectors(
    activeQuestsRuntime: QuestRuntimeState[] = [],
    unlockedAchievementsRuntime: AchievementRuntimeState[] = [],
    statistics: any = null
): QuestSelectorResult {
    /**
     * Build display objects for active quests.
     */
    const activeQuests = useMemo(() => {
        return activeQuestsRuntime
            .map((runtimeState) => calculateQuestDisplay(runtimeState, statistics))
            .filter((q): q is QuestDisplay => q !== null);
    }, [activeQuestsRuntime, statistics]);

    /**
     * Build display objects for unlocked achievements.
     */
    const unlockedAchievements = useMemo(() => {
        return unlockedAchievementsRuntime
            .map((runtimeState) => calculateAchievementDisplay(runtimeState, statistics))
            .filter((a): a is AchievementDisplay => a !== null);
    }, [unlockedAchievementsRuntime, statistics]);

    /**
     * Get all available quest templates.
     */
    const allQuests = useMemo(() => getAllQuestsAsDisplay(statistics), [statistics]);

    /**
     * Get all available achievement templates.
     */
    const allAchievements = useMemo(() => getAllAchievementsAsDisplay(statistics), [statistics]);

    /**
     * Get quests sorted by progress (highest first).
     */
    const questsSortedByProgress = useMemo(
        () => sortQuestsByProgress(activeQuests),
        [activeQuests]
    );

    /**
     * Get achievements sorted by progress (highest first).
     */
    const achievementsSortedByProgress = useMemo(
        () => sortAchievementsByProgress(unlockedAchievements),
        [unlockedAchievements]
    );

    /**
     * Get a single quest by ID.
     */
    const getQuestDisplay = useCallback(
        (questId: string) => {
            const runtimeState = activeQuestsRuntime.find((q) => q.questId === questId);
            if (!runtimeState) return null;
            return calculateQuestDisplay(runtimeState, statistics);
        },
        [activeQuestsRuntime, statistics]
    );

    /**
     * Get a single achievement by ID.
     */
    const getAchievementDisplay = useCallback(
        (achievementId: string) => {
            const runtimeState = unlockedAchievementsRuntime.find(
                (a) => a.achievementId === achievementId
            );
            if (!runtimeState) return null;
            return calculateAchievementDisplay(runtimeState, statistics);
        },
        [unlockedAchievementsRuntime, statistics]
    );

    return {
        activeQuests,
        unlockedAchievements,
        allQuests,
        allAchievements,
        questsSortedByProgress,
        achievementsSortedByProgress,
        getQuestDisplay,
        getAchievementDisplay,
        activeQuestCount: activeQuests.length,
        unlockedAchievementCount: unlockedAchievements.length,
    };
}
