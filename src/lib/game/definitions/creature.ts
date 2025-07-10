import { z } from 'genkit';
import { BaseGameEntitySchema } from './base';
import { SenseEffectSchema, SpawnConditionsSchema } from './item';

/**
 * @fileoverview Defines schemas for all living entities (creatures).
 * This uses a discriminated union to handle different types of creatures like
 * animals and plants within a unified structure.
 */

// --- BASE CREATURE ---
// A common schema for all living things, inheriting basic properties.
const CreatureDefinitionSchema = BaseGameEntitySchema.extend({
    tier: z.number().int().min(1).max(6).describe("The tier of the creature, indicating its general power or rarity."),
    tags: z.array(z.string()).optional().describe("A list of tags for filtering or applying special logic (e.g., 'tamable', 'flying')."),
    spawnConditions: z.array(SpawnConditionsSchema).optional().describe("An array of conditions under which this creature can spawn naturally."),
    size: z.enum(['tiny', 'small', 'medium', 'large', 'massive']).describe("The physical size of the creature."),
    dropTable: z.array(z.object({
        name: z.string(),
        chance: z.number().min(0).max(1),
        quantity: z.object({ min: z.number(), max: z.number() })
    })).optional().describe("Loot table for this creature upon defeat."),
    specialTraits: z.array(z.string()).optional().describe("A list of special traits, e.g., 'regenerates', 'poisonous'."),
    senseEffect: SenseEffectSchema.optional(),
});


// --- ANIMAL DEFINITION ---
// Extends Creature for entities that can move, fight, and have behaviors.
const AnimalDefinitionSchema = CreatureDefinitionSchema.extend({
    hp: z.number().describe("The animal's maximum health points."),
    damage: z.number().describe("The base damage the animal deals in combat."),
    behavior: z.enum(['aggressive', 'passive', 'defensive', 'territorial', 'neutral']).describe("The animal's typical behavior towards the player."),
    diet: z.array(z.string()).describe("A list of item or creature names this animal eats, influencing taming and behavior."),
    satiation: z.number().describe("The creature's current hunger level. When it reaches maxSatiation, it is full."),
    maxSatiation: z.number().describe("The satiation level at which the creature is considered full."),
    speed: z.number().optional().describe("The movement speed or initiative of the animal."),
    territoryRange: z.number().optional().describe("The range (in tiles) that a territorial creature will defend."),
    reproduction: z.object({
        cooldown: z.number().describe("Number of turns between reproduction cycles."),
        requireFullSatiation: z.boolean().describe("If both creatures need to be at max satiation to reproduce."),
        sameTileRequired: z.boolean().describe("If two creatures must be on the same tile to reproduce."),
    }).optional(),
});


// --- PLANT DEFINITION ---
// Extends Creature for stationary, harvestable life forms.
const PlantDefinitionSchema = CreatureDefinitionSchema.extend({
    initialStage: z.enum(['seedling', 'young', 'mature', 'withered']).optional().describe("The default stage the plant spawns in."),
    growthRate: z.number().optional().describe("A modifier for how quickly the plant grows."),
    preferredConditions: SpawnConditionsSchema.optional().describe("Specific environmental conditions required for this plant to grow well."),
    maxPerTile: z.number().optional().describe("The maximum number of this plant that can exist on a single tile."),
    harvestableParts: z.array(z.object({
        name: z.string(),
        chance: z.number().min(0).max(1),
        quantity: z.object({ min: z.number(), max: z.number() })
    })).optional().describe("Items that can be harvested from this plant."),
});


// --- DISCRIMINATED UNION ---
// This allows us to have a single LivingCreature type that can be either an Animal or a Plant.
// The creatureType field is the discriminator.
export const LivingCreatureSchema = z.discriminatedUnion("creatureType", [
    AnimalDefinitionSchema.extend({ creatureType: z.literal("animal") }),
    PlantDefinitionSchema.extend({ creatureType: z.literal("plant") }),
]);


// --- LEGACY & CONVENIENCE SCHEMAS ---

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

// The schema for an enemy instance in a chunk. This is based on the AnimalDefinition.
export const EnemySchema = AnimalDefinitionSchema;
