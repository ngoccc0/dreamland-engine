/**
 * Achievement Usecase - Achievement System Orchestration
 *
 * @remarks
 * **Key Difference from Quests:** Achievements are auto-evaluated.
 * They don't require player action (no "accept" step).
 *
 * **Lifecycle:**
 * 1. Player statistics update
 * 2. `evaluateAllAchievements()` is called
 * 3. For each template, check if criteria satisfied
 * 4. If satisfied and not yet unlocked → auto-unlock with effects
 *
 * **Reuses:** Same `evaluateCriteria` as quest system (DRY principle)
 */

import { GameState } from '@/core/domain/gamestate';
import { AchievementRuntimeState, AchievementTemplate } from '@/core/domain/achievement';
import { SideEffect } from '@/core/entities/side-effects';
import { ACHIEVEMENT_TEMPLATES } from '@/core/data/quests/achievement-templates';
import { evaluateCriteria } from '@/core/rules/criteria-rule';

/**
 * Check if achievement is unlocked
 *
 * @param achievementId - Achievement ID
 * @param state - Current game state
 * @returns true if achievement is unlocked
 */
export function isAchievementUnlocked(
    achievementId: string,
    state: GameState
): boolean {
    return state.unlockedAchievements.some(
        a => a.achievementId === achievementId && a.isUnlocked
    );
}

/**
 * Unlock an achievement and return side effects
 *
 * @param achievementId - Achievement ID
 * @param state - Current game state
 * @returns New state with achievement unlocked, plus side effects
 */
export function unlockAchievement(
    achievementId: string,
    state: GameState
): { newState: GameState; effects: SideEffect[] } {
    // Guard: Check if already unlocked
    if (isAchievementUnlocked(achievementId, state)) {
        return {
            newState: state,
            effects: [],
        };
    }

    const template = ACHIEVEMENT_TEMPLATES[achievementId];
    if (!template) {
        throw new Error(`[AchievementUsecase] Achievement template not found: ${achievementId}`);
    }

    // Create or update runtime state
    const runtimeState: AchievementRuntimeState = {
        achievementId,
        isUnlocked: true,
        unlockedAt: new Date(),
    };

    // Remove old entry and add new one
    const newAchievements = state.unlockedAchievements.filter(
        a => a.achievementId !== achievementId
    );
    newAchievements.push(runtimeState);

    // Build reward effects
    const effects: SideEffect[] = [];

    // Grant XP
    if (template.reward.xp > 0) {
        effects.push({
            type: 'addExperience',
            amount: template.reward.xp,
            type_: 'achievement',
        });
    }

    // Unlock title as content
    if (template.reward.title) {
        effects.push({
            type: 'unlockContent',
            contentType: 'title',
            contentId: template.reward.title,
        });
    }

    // UI notification (more prominent than quest notifications)
    effects.push({
        type: 'showNotification',
        message: `🏆 ${template.title} - ${template.description}`,
        duration: 4000,
    });

    // Sound effect (achievement-specific sound)
    effects.push({
        type: 'playAudio',
        sound: 'achievement_unlocked',
        volume: 0.9,
    });

    return {
        newState: {
            ...state,
            unlockedAchievements: newAchievements,
        },
        effects,
    };
}

/**
 * Evaluate all achievements and auto-unlock when criteria met
 *
 * @param state - Current game state
 * @returns Array of effects from newly unlocked achievements
 *
 * @remarks
 * Called after player statistics are updated.
 * Checks all templates; only returns effects for newly unlocked achievements.
 */
export function evaluateAllAchievements(state: GameState): {
    newState: GameState;
    effects: SideEffect[];
} {
    const allEffects: SideEffect[] = [];
    let newState = state;

    for (const [achievementId, template] of Object.entries(ACHIEVEMENT_TEMPLATES)) {
        // Skip if already unlocked
        if (isAchievementUnlocked(achievementId, newState)) {
            continue;
        }

        // Evaluate criteria
        const isSatisfied = evaluateCriteria(template.criteria, newState.statistics);

        if (isSatisfied) {
            const result = unlockAchievement(achievementId, newState);
            newState = result.newState;
            allEffects.push(...result.effects);
        }
    }

    return {
        newState,
        effects: allEffects,
    };
}

/**
 * Get all unlocked achievements with templates merged
 *
 * @param state - Current game state
 * @returns List of unlocked achievement objects
 */
export function getUnlockedAchievements(
    state: GameState
): Array<AchievementRuntimeState & { template: AchievementTemplate }> {
    return state.unlockedAchievements
        .filter(a => a.isUnlocked)
        .map(runtimeState => {
            const template = ACHIEVEMENT_TEMPLATES[runtimeState.achievementId];
            if (!template) {
                // Skip if template missing
                return null;
            }

            return {
                ...runtimeState,
                template,
            };
        })
        .filter((a): a is NonNullable<typeof a> => a !== null);
}

/**
 * Get achievement statistics
 *
 * @param state - Current game state
 * @returns Stats object with counts
 */
export function getAchievementStats(state: GameState): {
    unlockedCount: number;
    totalCount: number;
    percentComplete: number;
} {
    const unlockedCount = state.unlockedAchievements.filter(a => a.isUnlocked).length;
    const totalCount = Object.keys(ACHIEVEMENT_TEMPLATES).length;

    return {
        unlockedCount,
        totalCount,
        percentComplete: totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0,
    };
}

/**
 * Get achievements by category
 *
 * @param state - Current game state
 * @param category - Achievement category filter
 * @returns Filtered list of achievements
 */
export function getAchievementsByCategory(
    state: GameState,
    category: AchievementTemplate['category']
): AchievementTemplate[] {
    return Object.values(ACHIEVEMENT_TEMPLATES).filter(a => a.category === category);
}
