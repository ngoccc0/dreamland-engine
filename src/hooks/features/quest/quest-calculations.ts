/**
 * Quest & Achievement Calculation Utilities
 *
 * @remarks
 * Pure, memoizable functions for quest/achievement computations.
 * These are extracted to allow unit testing without React hooks.
 *
 * **Pattern:** All functions are pure (no side effects, no React dependencies).
 * Components/hooks can import these and wrap with useMemo as needed.
 */

import type { QuestRuntimeState } from '@/core/domain/quest';
import type { AchievementRuntimeState } from '@/core/domain/achievement';
import { getQuestTemplate } from '@/core/data/quests/quest-templates';
import { getAchievementTemplate } from '@/core/data/quests/achievement-templates';
import { getCriteriaProgress } from '@/core/rules/criteria-rule';
import type { QuestDisplay, AchievementDisplay } from './quest-types';

/**
 * Build a single quest display object from template + runtime state.
 *
 * @remarks
 * Pure function - safe to call in useMemo without dependency re-tracking.
 *
 * @param runtimeState - Runtime state from game
 * @param statistics - Player statistics for progress calculation
 * @returns QuestDisplay | null if template not found
 */
export function calculateQuestDisplay(
    runtimeState: QuestRuntimeState,
    statistics: any = null
): QuestDisplay | null {
    const template = getQuestTemplate(runtimeState.questId);
    if (!template) return null;

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
}

/**
 * Build a single achievement display object from template + runtime state.
 *
 * @remarks
 * Pure function - safe to call in useMemo without dependency re-tracking.
 *
 * @param runtimeState - Runtime state from game
 * @param statistics - Player statistics for progress calculation
 * @returns AchievementDisplay | null if template not found
 */
export function calculateAchievementDisplay(
    runtimeState: AchievementRuntimeState,
    statistics: any = null
): AchievementDisplay | null {
    const template = getAchievementTemplate(runtimeState.achievementId);
    if (!template) return null;

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
}

/**
 * Sort quests by progress (highest first).
 *
 * @remarks
 * Pure function for sorting, extracted to avoid re-creating in every render.
 *
 * @param quests - Array of QuestDisplay
 * @returns Sorted array (highest progress first)
 */
export function sortQuestsByProgress(quests: QuestDisplay[]): QuestDisplay[] {
    return [...quests].sort((a, b) => b.progress - a.progress);
}

/**
 * Sort achievements by progress (highest first).
 *
 * @remarks
 * Pure function for sorting, extracted to avoid re-creating in every render.
 *
 * @param achievements - Array of AchievementDisplay
 * @returns Sorted array (highest progress first)
 */
export function sortAchievementsByProgress(achievements: AchievementDisplay[]): AchievementDisplay[] {
    return [...achievements].sort((a, b) => b.progress - a.progress);
}

/**
 * Convert all quest templates to display objects.
 *
 * @remarks
 * Pure function - creates display list from static templates.
 *
 * @param statistics - Player statistics (for progress display)
 * @returns Array of QuestDisplay for all available quests
 */
export function getAllQuestsAsDisplay(statistics: any = null): QuestDisplay[] {
    const QUEST_TEMPLATES = require('@/core/data/quests/quest-templates').QUEST_TEMPLATES;
    return Object.values(QUEST_TEMPLATES).map((template: any): QuestDisplay => ({
        id: template.id,
        title: template.title,
        description: template.description,
        status: 'active',
        progress: 0,
        criteria: template.criteria,
        rewards: template.rewards,
        startedAt: new Date(),
    }));
}

/**
 * Convert all achievement templates to display objects.
 *
 * @remarks
 * Pure function - creates display list from static templates.
 *
 * @param statistics - Player statistics (for progress display)
 * @returns Array of AchievementDisplay for all available achievements
 */
export function getAllAchievementsAsDisplay(statistics: any = null): AchievementDisplay[] {
    const ACHIEVEMENT_TEMPLATES = require('@/core/data/quests/achievement-templates').ACHIEVEMENT_TEMPLATES;
    return Object.values(ACHIEVEMENT_TEMPLATES).map((template: any): AchievementDisplay => ({
        id: template.id,
        title: template.title,
        description: template.description,
        category: template.category,
        criteria: template.criteria,
        rarity: template.rarity,
        reward: template.reward,
        progress: getCriteriaProgress(template.criteria, statistics || {}),
    }));
}
