/**
 * @fileOverview Shared Zod schemas for AI flows and tools.
 *
 * This file centralizes the data structures used for communication with the AI,
 * ensuring consistency between narrative generation, tools, and game state.
 */

import {z} from 'genkit';

export const ItemCategorySchema = z.enum(['Weapon', 'Material', 'Energy Source', 'Food', 'Data', 'Tool', 'Equipment', 'Support', 'Magic', 'Fusion']).describe("The category of the item.");

export const ItemEffectSchema = z.object({
    type: z.enum(['HEAL', 'RESTORE_STAMINA']),
    amount: z.number(),
});

export const ItemDefinitionSchema = z.object({
    description: z.string(),
    tier: z.number(),
    category: ItemCategorySchema,
    emoji: z.string().describe("A single emoji that represents the item."),
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
    emoji: z.string(),
});

export const PetSchema = z.object({
    type: z.string().describe("The type of creature, e.g., 'Sói'."),
    name: z.string().optional().describe("A custom name given by the player."),
    level: z.number().describe("The pet's level."),
});
export type Pet = z.infer<typeof PetSchema>;

export const SkillSchema = z.object({
    name: z.string().describe("The name of the skill."),
    description: z.string().describe("A brief description of what the skill does."),
    tier: z.number().describe("The tier of the skill, from 1 (basic) to higher tiers (advanced)."),
    manaCost: z.number().describe("The amount of mana required to use the skill."),
    effect: z.object({
        type: z.enum(['HEAL', 'DAMAGE']).describe("The type of effect."),
        amount: z.number().describe("The amount of healing or damage."),
        target: z.enum(['SELF', 'ENEMY']).describe("Who the skill affects."),
    }),
});

export const PlayerStatusSchema = z.object({
    hp: z.number(),
    mana: z.number(),
    stamina: z.number().describe("Player's stamina, used for physical actions."),
    items: z.array(PlayerItemSchema).describe("Player's inventory with item names, quantities, and tiers."),
    quests: z.array(z.string()),
    skills: z.array(SkillSchema).describe("The skills the player knows."),
    attributes: PlayerAttributesSchema.describe("Player's combat attributes."),
    pets: z.array(PetSchema).optional().describe("A list of the player's tamed companions."),
});

export const EnemySchema = z.object({
    type: z.string(),
    emoji: z.string().describe("A single emoji that represents the creature."),
    hp: z.number(),
    damage: z.number(),
    behavior: z.enum(['aggressive', 'passive', 'defensive', 'territorial']),
    size: z.enum(['small', 'medium', 'large']),
    diet: z.array(z.string()).describe("A list of food items or creature types this enemy eats, influencing its behavior and potential for taming."),
    satiation: z.number().describe("The creature's current hunger level. When it reaches maxSatiation, it is full."),
    maxSatiation: z.number().describe("The satiation level at which the creature is considered full and may try to reproduce."),
});

export const ChunkItemSchema = z.object({
    name: z.string(),
    description: z.string(),
    quantity: z.number().int(),
    tier: z.number(),
    emoji: z.string(),
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
    // These detailed attributes are now included for the AI to have full context
    vegetationDensity: z.number(),
    moisture: z.number(),
    elevation: z.number(),
    lightLevel: z.number(),
    dangerLevel: z.number(),
    magicAffinity: z.number(),
    humanPresence: z.number(),
    predatorPresence: z.number(),
    temperature: z.number().optional(), // Now optional to handle dynamic calculation
    windLevel: z.number().optional(),   // Now optional to handle dynamic calculation
});
