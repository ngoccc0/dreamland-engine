/**
 * Quest Runtime State Schema
 *
 * @remarks
 * **Architecture:** Static data (title, description, text) lives in quest-templates.ts.
 * This schema only stores RUNTIME STATE that changes during gameplay.
 *
 * **Saved to GameState:** Yes. Persisted with save file.
 *
 * **Fields:**
 * - `questId`: Reference to template (never changes)
 * - `status`: Active/completed/abandoned
 * - `startedAt`: When player accepted quest
 * - `completedAt`: When quest was finished (optional)
 * - `progress`: Quest-specific tracking (e.g., kills count)
 *
 * **Why not save template?**
 * Template is 1KB+ of text (title, description, dialog, rewards).
 * On load, merge template + runtime state to reconstruct full quest object.
 */

import { z } from 'zod';

/**
 * Quest evaluation criteria
 * Used to determine when a quest is complete
 */
export const QuestCriteriaSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('KILL_CREATURE'),
        params: z.object({
            creatureType: z.string().describe('Type of creature to kill'),
            count: z.number().int().positive().describe('How many to kill'),
            biome: z.string().optional().describe('Specific biome (optional)'),
            weapon: z.string().optional().describe('Specific weapon (optional)'),
        }),
    }),
    z.object({
        type: z.literal('GATHER_ITEM'),
        params: z.object({
            itemId: z.string().describe('Item to gather'),
            count: z.number().int().positive().describe('How many to gather'),
            biome: z.string().optional().describe('Specific biome (optional)'),
            tool: z.string().optional().describe('Specific tool (optional)'),
        }),
    }),
    z.object({
        type: z.literal('CRAFT_ITEM'),
        params: z.object({
            itemId: z.string().describe('Item to craft'),
            count: z.number().int().positive().describe('How many to craft'),
            recipeId: z.string().optional().describe('Specific recipe variant'),
        }),
    }),
    z.object({
        type: z.literal('TRAVEL_DISTANCE'),
        params: z.object({
            distance: z.number().positive().describe('Distance to travel'),
            biome: z.string().optional().describe('Specific biome (optional)'),
        }),
    }),
    z.object({
        type: z.literal('CUSTOM'),
        params: z.record(z.unknown()).describe('Custom parameters'),
    }),
]);

export type QuestCriteria = z.infer<typeof QuestCriteriaSchema>;

/**
 * Runtime quest state (saved to GameState)
 */
export const QuestRuntimeStateSchema = z.object({
    questId: z.string().describe('Reference to quest template'),
    status: z
        .enum(['active', 'completed', 'abandoned', 'failed'])
        .default('active')
        .describe('Quest completion status'),
    startedAt: z.coerce.date().describe('When player accepted this quest'),
    completedAt: z.coerce.date().optional().describe('When quest was completed'),
    progress: z
        .record(z.number())
        .default({})
        .describe('Quest-specific progress (e.g., { kills: 7 })'),
});

export type QuestRuntimeState = z.infer<typeof QuestRuntimeStateSchema>;

/**
 * Complete quest template (static, not saved)
 */
export const QuestTemplateSchema = z.object({
    id: z.string().describe('Unique quest ID'),
    title: z.string().describe('Quest title'),
    description: z.string().describe('Full quest description'),
    giver: z.string().optional().describe('NPC ID who gives quest'),
    type: z
        .enum(['simple', 'legendary', 'chain'])
        .default('simple')
        .describe('Quest complexity type'),
    criteria: QuestCriteriaSchema.describe('Quest completion criteria'),
    rewards: z.object({
        xp: z.number().int().min(0).default(0),
        items: z.array(z.string()).default([]).describe('Item IDs to grant'),
        achievements: z.array(z.string()).default([]).describe('Achievement IDs to unlock'),
    }),
    prerequisites: z
        .array(z.string())
        .default([])
        .optional()
        .describe('Quest IDs that must be completed first'),
    repeatable: z.boolean().default(false).describe('Can be done multiple times'),
});

export type QuestTemplate = z.infer<typeof QuestTemplateSchema>;
