/**
 * @fileOverview Shared Zod schemas for AI flows and tools.
 *
 * This file centralizes the data structures used for communication with the AI,
 * ensuring consistency between narrative generation, tools, and game state.
 */

import {z} from 'genkit';

export const ItemEffectSchema = z.object({
    type: z.enum(['HEAL', 'RESTORE_STAMINA']),
    amount: z.number(),
});

export const ItemDefinitionSchema = z.object({
    description: z.string(),
    tier: z.number(),
    effects: z.array(ItemEffectSchema),
    baseQuantity: z.object({ min: z.number(), max: z.number() }),
});


export const PlayerAttributesSchema = z.object({
    physicalAttack: z.number().describe("Player's base physical damage."),
    magicalAttack: z.number().describe("Player's base magical damage."),
    critChance: z.number().describe("Player's chance to land a critical hit (percentage)."),
    attackSpeed: z.number().describe("Player's attack speed modifier."),
    cooldownReduction: z.number().describe("Player's cooldown reduction (percentage)."),
});

export const PlayerItemSchema = z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    tier: z.number(),
});

export const PlayerStatusSchema = z.object({
    hp: z.number(),
    mana: z.number(),
    stamina: z.number().describe("Player's stamina, used for physical actions."),
    items: z.array(PlayerItemSchema).describe("Player's inventory with item names, quantities, and tiers."),
    quests: z.array(z.string()),
    attributes: PlayerAttributesSchema.describe("Player's combat attributes."),
});

export const EnemySchema = z.object({
    type: z.string(),
    hp: z.number(),
    damage: z.number(),
    behavior: z.enum(['aggressive', 'passive']),
    diet: z.array(z.string()).describe("A list of food items or creature types this enemy eats, influencing its behavior and potential for taming."),
    satiation: z.number().describe("The creature's current hunger level. When it reaches maxSatiation, it is full."),
    maxSatiation: z.number().describe("The satiation level at which the creature is considered full and may try to reproduce."),
});

export const ChunkItemSchema = z.object({
    name: z.string(),
    description: z.string(),
    quantity: z.number().int(),
    tier: z.number(),
});

export const ChunkSchema = z.object({
    x: z.number(),
    y: z.number(),
    terrain: z.enum(["forest", "grassland", "desert", "swamp", "mountain", "cave"]),
    description: z.string(),
    NPCs: z.array(z.string()),
    items: z.array(ChunkItemSchema).describe("Items present in the chunk, with quantities and tiers."),
    explored: z.boolean(),
    enemy: EnemySchema.nullable(),
    vegetationDensity: z.number(),
    moisture: z.number(),
    elevation: z.number(),
    lightLevel: z.number(),
    dangerLevel: z.number(),
    magicAffinity: z.number(),
    humanPresence: z.number(),
    predatorPresence: z.number(),
});
