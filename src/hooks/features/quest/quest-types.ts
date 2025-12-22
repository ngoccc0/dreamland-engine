/**
 * Quest & Achievement Display Types - Shared Across Selectors/Actions/Calculations
 *
 * @remarks
 * Centralized types to avoid circular dependencies between hooks.
 * Use this file to export interfaces shared by:
 * - useQuestSelectors (Read)
 * - useQuestActions (Write)
 * - useQuestCalculations (Math)
 */

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
 * Result returned from quest/achievement selectors
 */
export interface QuestSelectorResult {
    activeQuests: QuestDisplay[];
    unlockedAchievements: AchievementDisplay[];
    allQuests: QuestDisplay[];
    allAchievements: AchievementDisplay[];
    questsSortedByProgress: QuestDisplay[];
    achievementsSortedByProgress: AchievementDisplay[];
    getQuestDisplay: (questId: string) => QuestDisplay | null;
    getAchievementDisplay: (achievementId: string) => AchievementDisplay | null;
    activeQuestCount: number;
    unlockedAchievementCount: number;
}

/**
 * Result returned from quest/achievement actions (evaluate/unlock)
 */
export interface QuestActionResult {
    newState: any;
    effects: any[];
}
