import { z } from 'genkit';
import { PlayerItemSchema, PlayerAttributesSchema } from './item';
import { PetSchema } from './creature';
import { SkillSchema } from './skill';

/**
 * @fileoverview Defines the schema for the player's status and profile.
 */

export const PlayerBehaviorProfileSchema = z.object({
    moves: z.number().default(0),
    attacks: z.number().default(0),
    crafts: z.number().default(0),
    customActions: z.number().default(0),
});

export const PlayerStatusSchema = z.object({
    hp: z.number(),
    mana: z.number(),
    stamina: z.number().describe("Player's stamina, used for physical actions."),
    bodyTemperature: z.number().optional().default(37),
    items: z.array(PlayerItemSchema).describe("Player's inventory with item names, quantities, and tiers."),
    equipment: z.object({ 
        weapon: PlayerItemSchema.nullable().optional(), 
        armor: PlayerItemSchema.nullable().optional(), 
        accessory: PlayerItemSchema.nullable().optional() 
    }).optional().default({ weapon: null, armor: null, accessory: null }).describe("The player's equipped items."),
    quests: z.array(z.string()),
    questsCompleted: z.number().optional().default(0).describe("The total number of quests the player has completed."),
    skills: z.array(SkillSchema).describe("The skills the player knows."),
    attributes: PlayerAttributesSchema.describe("Player's combat attributes."),
    pets: z.array(PetSchema).optional().describe("A list of the player's tamed companions."),
    persona: z.enum(['none', 'explorer', 'warrior', 'artisan']).optional().default('none').describe("The player's determined playstyle, which may grant subtle bonuses."),
    unlockProgress: z.object({
        kills: z.number(),
        damageSpells: z.number(),
        moves: z.number(),
    }).describe("Tracks player actions to unlock new skills."),
    journal: z.record(z.string()).optional().describe("A record of daily journal entries written by the AI, indexed by day number."),
    dailyActionLog: z.array(z.string()).optional().describe("A log of player actions taken during the current day, used for journaling."),
    questHints: z.record(z.string()).optional().describe("A map of quest texts to their AI-generated hints."),
    lastRestTurn: z.number().optional().default(0).describe("The turn number when the player last rested."),
});
