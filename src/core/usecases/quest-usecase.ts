/**
 * Quest Usecase - Quest System Orchestration
 *
 * @remarks
 * **Responsibility:** Manage quest lifecycle and side effects.
 *
 * **Actions:**
 * - `startQuest`: Player accepts a quest
 * - `evaluateQuestProgress`: Check if quest is complete
 * - `completeQuest`: Mark quest as done, grant rewards
 * - `abandonQuest`: Cancel a quest
 * - `evaluateAllActiveQuests`: Bulk evaluation for auto-completion
 *
 * **Pattern:** Pure function returning `{ newState, effects[] }`
 *
 * **Return Type:**
 * ```typescript
 * {
 *   newState: GameState,        // Updated state with quest changes
 *   effects: SideEffect[]       // Audio, UI, rewards to execute
 * }
 * ```
 */

import { GameState } from '@/core/domain/gamestate';
import { QuestRuntimeState, QuestTemplate } from '@/core/domain/quest';
import { SideEffect } from '@/core/entities/side-effects';
import { getQuestTemplate } from '@/core/data/quests/quest-templates';
import { evaluateCriteria, getCriteriaProgress } from '@/core/rules/criteria-rule';

/**
 * Start a quest (player accepts it)
 *
 * @param questId - ID of quest to start
 * @param state - Current game state
 * @returns New state with quest added, plus side effects (sound, UI)
 */
export function startQuest(
    questId: string,
    state: GameState
): { newState: GameState; effects: SideEffect[] } {
    const template = getQuestTemplate(questId);
    if (!template) {
        throw new Error(`[QuestUsecase] Quest template not found: ${questId}`);
    }

    // Check if already active
    if (state.activeQuests.some(q => q.questId === questId)) {
        return {
            newState: state,
            effects: [],
        };
    }

    // Create runtime state
    const runtimeState: QuestRuntimeState = {
        questId,
        status: 'active',
        startedAt: new Date(),
        progress: {},
    };

    return {
        newState: {
            ...state,
            activeQuests: [...state.activeQuests, runtimeState],
        },
        effects: [
            {
                type: 'playAudio',
                sound: 'quest_accepted',
            },
            {
                type: 'showNotification',
                message: `${template.title}: ${template.description}`,
                duration: 4000,
            },
        ],
    };
}

/**
 * Evaluate a single active quest
 *
 * @param questId - ID of quest to evaluate
 * @param state - Current game state
 * @returns Evaluation result with completion percentage
 */
export function evaluateQuestProgress(
    questId: string,
    state: GameState
): {
    isCompleted: boolean;
    progress: number;
    template?: QuestTemplate;
} {
    const runtimeState = state.activeQuests.find(q => q.questId === questId);
    if (!runtimeState) {
        return { isCompleted: false, progress: 0 };
    }

    const template = getQuestTemplate(questId);
    if (!template) {
        return { isCompleted: false, progress: 0 };
    }

    const criteriaProgress = getCriteriaProgress(template.criteria, state.statistics);
    const isCompleted = evaluateCriteria(template.criteria, state.statistics);

    return {
        isCompleted,
        progress: Math.min(criteriaProgress, 1),
        template,
    };
}

/**
 * Complete a quest and grant rewards
 *
 * @param questId - ID of quest to complete
 * @param state - Current game state
 * @returns New state with quest marked complete + reward effects
 */
export function completeQuest(
    questId: string,
    state: GameState
): { newState: GameState; effects: SideEffect[] } {
    const runtimeState = state.activeQuests.find(q => q.questId === questId);
    if (!runtimeState) {
        throw new Error(`[QuestUsecase] Quest not found: ${questId}`);
    }

    const template = getQuestTemplate(questId);
    if (!template) {
        throw new Error(`[QuestUsecase] Quest template not found: ${questId}`);
    }

    // Guard: Ensure quest completion criteria are met
    if (!evaluateCriteria(template.criteria, state.statistics)) {
        throw new Error(`[QuestUsecase] Quest criteria not met: ${questId}`);
    }

    // Update runtime state
    const completedQuest: QuestRuntimeState = {
        ...runtimeState,
        status: 'completed',
        completedAt: new Date(),
    };

    // Build reward effects
    const effects: SideEffect[] = [];

    // Grant XP
    if (template.rewards.xp > 0) {
        effects.push({
            type: 'addExperience',
            amount: template.rewards.xp,
            type_: 'quest',
        });
    }

    // Grant items
    if (template.rewards.items.length > 0) {
        effects.push({
            type: 'grantLoot',
            items: template.rewards.items.map(itemId => ({ id: itemId, quantity: 1 })),
            source: `quest_${questId}`,
        });
    }

    // Unlock achievements
    for (const achievementId of template.rewards.achievements) {
        effects.push({
            type: 'completeAchievement',
            achievementId,
        });
    }

    // UI notification
    effects.push({
        type: 'showNotification',
        message: `${template.title} - COMPLETE! Rewards: ${template.rewards.xp} XP${template.rewards.items.length > 0 ? ` + ${template.rewards.items.length} item(s)` : ''
            }`,
        duration: 5000,
    });

    // Sound effect
    effects.push({
        type: 'playAudio',
        sound: 'quest_complete',
        volume: 0.8,
    });

    return {
        newState: {
            ...state,
            activeQuests: state.activeQuests.map(q =>
                q.questId === questId ? completedQuest : q
            ),
        },
        effects,
    };
}

/**
 * Abandon a quest
 *
 * @param questId - ID of quest to abandon
 * @param state - Current game state
 * @returns New state with quest removed
 */
export function abandonQuest(
    questId: string,
    state: GameState
): { newState: GameState; effects: SideEffect[] } {
    const runtimeState = state.activeQuests.find(q => q.questId === questId);
    if (!runtimeState) {
        return {
            newState: state,
            effects: [],
        };
    }

    const template = getQuestTemplate(questId);

    return {
        newState: {
            ...state,
            activeQuests: state.activeQuests.filter(q => q.questId !== questId),
        },
        effects: [
            {
                type: 'showNotification',
                message: `${template?.title || 'Quest'} - Abandoned`,
                duration: 3000,
            },
        ],
    };
}

/**
 * Evaluate all active quests and auto-complete if criteria met
 *
 * @param state - Current game state
 * @returns Array of effects from all completed quests
 *
 * @remarks
 * Called after player statistics are updated.
 * Returns all completion effects; caller must merge into state.
 */
export function evaluateAllActiveQuests(state: GameState): {
    newState: GameState;
    effects: SideEffect[];
} {
    const allEffects: SideEffect[] = [];
    let newState = state;

    for (const quest of state.activeQuests) {
        const evalResult = evaluateQuestProgress(quest.questId, newState);

        if (evalResult.isCompleted && quest.status === 'active') {
            const result = completeQuest(quest.questId, newState);
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
 * Get all active quests with template data merged
 *
 * @param state - Current game state
 * @returns List of complete quest objects (template + runtime)
 */
export function getActiveQuestsWithTemplates(
    state: GameState
): Array<QuestRuntimeState & { template: QuestTemplate; progress: number }> {
    return state.activeQuests
        .filter(q => q.status === 'active')
        .map(runtimeState => {
            const template = getQuestTemplate(runtimeState.questId);
            if (!template) {
                // Skip if template missing
                return null;
            }

            const progress = getCriteriaProgress(template.criteria, state.statistics);

            return {
                ...runtimeState,
                template,
                progress: Math.min(progress, 1),
            } as QuestRuntimeState & { template: QuestTemplate; progress: number };
        })
        .filter((q): q is NonNullable<typeof q> => q !== null);
}

/**
 * Get completed quests
 *
 * @param state - Current game state
 * @returns List of completed quest IDs
 */
export function getCompletedQuests(state: GameState): string[] {
    return state.activeQuests
        .filter(q => q.status === 'completed')
        .map(q => q.questId);
}
