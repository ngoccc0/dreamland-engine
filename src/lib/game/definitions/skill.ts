import { z } from 'genkit';
import { BaseGameEntitySchema } from './base';

/**
 * @fileoverview Defines the schema for player skills.
 */

export const SkillSchema = BaseGameEntitySchema.extend({
    tier: z.number().int().min(1).max(5).describe("The tier of the skill, from 1 (basic) to higher tiers (advanced)."),
    manaCost: z.number().describe("The amount of mana required to use the skill."),
    effect: z.object({
        type: z.enum(['HEAL', 'DAMAGE', 'TELEPORT']).describe("The type of effect."),
        amount: z.number().describe("The amount of healing, damage, or teleport distance."),
        target: z.enum(['SELF', 'ENEMY']).describe("Who the skill affects."),
        healRatio: z.number().optional().describe("For damaging skills, the percentage of damage dealt that is returned as health to the caster."),
    }),
    unlockCondition: z.object({
        type: z.enum(['kills', 'damageSpells', 'moves']),
        count: z.number(),
    }).optional(),
});
