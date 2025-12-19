/**
 * Achievement Runtime State Schema
 *
 * @remarks
 * **Similar to Quest System:** Static template (text, UI) vs runtime state (completion).
 *
 * **Key Difference:** Achievements are auto-evaluated based on statistics.
 * They don't require explicit player action (unlike quests which player accepts).
 */

import { z } from 'zod';
import { QuestCriteriaSchema } from './quest';

/**
 * Runtime achievement state (saved to GameState)
 */
export const AchievementRuntimeStateSchema = z.object({
    achievementId: z.string().describe('Reference to achievement template'),
    unlockedAt: z.coerce.date().optional().describe('When achievement was unlocked'),
    isUnlocked: z.boolean().default(false).describe('Whether achievement is completed'),
});

export type AchievementRuntimeState = z.infer<
    typeof AchievementRuntimeStateSchema
>;

/**
 * Complete achievement template (static, not saved)
 */
export const AchievementTemplateSchema = z.object({
    id: z.string().describe('Unique achievement ID'),
    title: z.string().describe('Achievement title'),
    description: z.string().describe('Achievement description'),
    category: z
        .enum(['combat', 'gathering', 'crafting', 'exploration', 'legendary'])
        .default('legendary')
        .describe('Achievement category'),
    criteria: QuestCriteriaSchema.describe('Completion criteria (shares quest schema)'),
    reward: z.object({
        title: z.string().optional().describe('Character title to grant'),
        badge: z.string().optional().describe('Badge/icon to display'),
        xp: z.number().int().min(0).default(0),
    }),
    hidden: z.boolean().default(false).optional().describe('Hidden until progress starts'),
    rarity: z
        .enum(['common', 'uncommon', 'rare', 'legendary', 'mythic'])
        .default('rare')
        .describe('Achievement rarity tier'),
});

export type AchievementTemplate = z.infer<typeof AchievementTemplateSchema>;
