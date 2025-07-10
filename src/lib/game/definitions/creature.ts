import { z } from 'genkit';
import { BaseGameEntitySchema } from './base';
import { SenseEffectSchema, SpawnConditionsSchema, LootDropSchema } from './item';

/**
 * @fileoverview Defines schemas for all living entities (creatures).
 * This uses a discriminated union to handle different types of creatures like
 * animals and plants within a unified structure.
 */

// --- BASE CREATURE ---
// A common schema for all living things, inheriting basic properties.
export const CreatureDefinitionSchema = BaseGameEntitySchema.extend({
    tier: z.number().int().min(1).max(6).describe("The tier of the creature, indicating its general power or rarity."),
    creatureType: z.enum(["animal", "plant", "mineral"]).describe("The fundamental type of the creature."),
    tags: z.array(z.string()).optional().describe("A list of tags for filtering or applying special logic (e.g., 'tamable', 'flying')."),
    size: z.enum(['tiny', 'small', 'medium', 'large', 'massive']).describe("The physical size of the creature."),
    behavior: z.enum(['aggressive', 'passive', 'defensive', 'territorial', 'immobile', 'ambush']).describe("The creature's typical behavior towards the player."),
    hp: z.number().describe("The creature's maximum health points. For plants/minerals, this represents its durability."),
    damage: z.number().describe("The base damage the creature deals in combat. 0 for non-aggressive entities."),
    diet: z.array(z.string()).describe("A list of item or creature names this creature consumes, influencing ecosystem behavior."),
    dropTable: z.array(LootDropSchema).optional().describe("Loot table for this creature upon defeat or harvest."),
    harvestable: z.boolean().optional().describe("If true, this creature can be harvested with a tool instead of attacked."),
    harvestTool: z.string().optional().describe("The type of tool required for harvesting (e.g., 'Axe', 'Pickaxe')."),
    senseEffect: SenseEffectSchema.optional(),
});

// The schema for an NPC in the world.
export const NpcSchema = BaseGameEntitySchema.extend({
    dialogueSeed: z.string().describe("A sentence that captures their personality and current mood, to be used by the AI as a basis for generating dialogue. E.g., 'A grizzled hunter, tired but watchful, who speaks in short, clipped sentences.'"),
});

// The schema for a pet companion.
export const PetSchema = z.object({
    name: z.string().describe("The name of the creature species, e.g., 'Sói'."),
    customName: z.string().optional().describe("A custom name given by the player."),
    level: z.number().describe("The pet's level."),
});

// The schema for an enemy instance in a chunk. This is based on the CreatureDefinition.
export const EnemySchema = CreatureDefinitionSchema.extend({
     satiation: z.number().describe("The creature's current hunger level. When it reaches maxSatiation, it is full."),
     maxSatiation: z.number().describe("The satiation level at which the creature is considered full."),
});
