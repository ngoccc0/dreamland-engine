'use client';

import { useCallback, useMemo } from 'react';
import type { QuestTemplate, QuestRuntimeState } from '@/core/domain/quest';
import type { AchievementTemplate, AchievementRuntimeState } from '@/core/domain/achievement';
import { QUEST_TEMPLATES, getQuestTemplate } from '@/core/data/quests/quest-templates';
import { ACHIEVEMENT_TEMPLATES, getAchievementTemplate } from '@/core/data/quests/achievement-templates';
import { getCriteriaProgress } from '@/core/rules/criteria-rule';

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
