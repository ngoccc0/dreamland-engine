'use client';

import { useMemo } from 'react';
import { useQuestState } from '@/hooks/use-quest-integration';
import { useLanguage } from '@/context/language-context';

interface QuestTrackerProps {
    /**
     * Array of active quest runtime states
     */
    activeQuests?: any[];

    /**
     * Current player statistics (for progress calculation)
     */
    statistics?: any;

    /**
     * Optional CSS class for styling
     */
    className?: string;

    /**
     * Optional callback when quest is clicked
     */
    onQuestSelected?: (questId: string) => void;
}

/**
 * Quest Tracker Component - Displays active quests with progress bars
 *
 * @remarks
 * **Purpose:** Show player's active quests in a compact UI element (HUD, sidebar, etc.)
 *
 * **Display:**
 * - Quest title and description
 * - Progress bar (0-100%)
 * - Completion status
 * - XP/reward hint
 *
 * **Styling:** Uses Tailwind CSS classes for consistent appearance.
 * Responsive design works on mobile and desktop.
 *
 * @example
 * <QuestTracker
 *   activeQuests={gameState.activeQuests}
 *   statistics={gameState.statistics}
 *   onQuestSelected={(questId) => console.log('Selected:', questId)}
 * />
 */
export function QuestTracker({
    activeQuests = [],
    statistics = null,
    className = '',
    onQuestSelected
}: QuestTrackerProps) {
    const { t } = useLanguage();


    // Get quest display objects with merged template + runtime data
    const { questsSortedByProgress, activeQuestCount } = useQuestState(
        activeQuests,
        [],
        statistics
    );

    // Limit to top 3 quests for HUD display
    const displayedQuests = useMemo(() => {
        return questsSortedByProgress.slice(0, 3);
    }, [questsSortedByProgress]);

    if (activeQuestCount === 0) {
        return (
            <div className={`px-4 py-3 text-center text-gray-500 text-sm ${className}`}>
                {t('noActiveQuests')}
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('activeQuests')} ({activeQuestCount})
                </h3>
            </div>

            {/* Quest List */}
            <div className="space-y-2 px-3">
                {displayedQuests.map((quest) => {
                    const progressPercent = Math.min(100, Math.round(quest.progress * 100));
                    const isComplete = quest.progress >= 1.0;

                    return (
                        <div
                            key={quest.id}
                            className="cursor-pointer rounded-lg bg-gray-50 dark:bg-gray-800 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => onQuestSelected?.(quest.id)}
                        >
                            {/* Quest Title */}
                            <div className="flex items-start justify-between mb-1">
                                <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate flex-1">
                                    {quest.title}
                                </h4>
                                {isComplete && (
                                    <span className="ml-2 text-xs font-bold text-green-600 dark:text-green-400">
                                        ✓
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                {quest.description}
                            </p>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${isComplete
                                            ? 'bg-green-500'
                                            : progressPercent < 33
                                                ? 'bg-yellow-500'
                                                : progressPercent < 66
                                                    ? 'bg-blue-500'
                                                    : 'bg-purple-500'
                                        }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            {/* Progress Text */}
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {progressPercent}%
                                </span>
                                {quest.rewards && quest.rewards.xp && (
                                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                                        +{quest.rewards.xp} XP
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer: Show more indicator */}
            {activeQuestCount > 3 && (
                <div className="px-4 py-2 text-center text-xs text-gray-500 border-t border-gray-300 dark:border-gray-700">
                    +{activeQuestCount - 3} {t('moreQuests')}
                </div>
            )}
        </div>
    );
}

/**
 * Achievement Display Component - Shows recent/highlighted achievement unlocks
 *
 * @remarks
 * Compact achievement badge display for notifications or status panel.
 * Shows icon, title, and completion status.
 */
export function AchievementBadge({
    achievementId,
    unlockedAchievements = [],
    statistics = null,
    className = '',
}: {
    achievementId: string;
    unlockedAchievements?: any[];
    statistics?: any;
    className?: string;
}) {
    const { getAchievementDisplay } = useQuestState(
        [],
        unlockedAchievements,
        statistics
    );

    const achievement = getAchievementDisplay(achievementId);
    if (!achievement) return null;

    const rarityColors: Record<string, string> = {
        common: 'bg-gray-100 border-gray-300',
        rare: 'bg-blue-100 border-blue-300',
        epic: 'bg-purple-100 border-purple-300',
        legendary: 'bg-yellow-100 border-yellow-300',
        mythic: 'bg-red-100 border-red-300',
    };

    const textColors: Record<string, string> = {
        common: 'text-gray-900',
        rare: 'text-blue-900',
        epic: 'text-purple-900',
        legendary: 'text-yellow-900',
        mythic: 'text-red-900',
    };

    const bgClass = rarityColors[achievement.rarity] || rarityColors.common;
    const textClass = textColors[achievement.rarity] || textColors.common;

    return (
        <div
            className={`rounded-lg border-2 p-3 ${bgClass} ${className}`}
        >
            <div className="flex items-center gap-3">
                {/* Icon/Badge */}
                <div className="text-2xl flex-shrink-0">
                    {achievement.reward?.badge || '🏆'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold ${textClass}`}>
                        {achievement.title}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                        {achievement.description}
                    </p>
                </div>
            </div>
        </div>
    );
}




