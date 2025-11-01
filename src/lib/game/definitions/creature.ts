import { z } from 'zod';
import { TranslatableStringSchema, LootDropSchema } from './base';

// The main schema for defining a creature/entity in the world.
// This can be an animal, a monster, a plant, a rock formation, etc.
/**
 * The main schema for defining a creature or entity in the world.
 * This can represent various interactive elements such as animals, monsters,
 * plants, or even static resource formations like rocks.
 */
export const CreatureDefinitionSchema = z.object({
  /**
   * Unique identifier for the creature, e.g., 'wolf', 'oakTree'.
   * This is optional for template entries but recommended for distinct definitions.
   */
  id: z.string().optional().describe("Unique identifier for the creature, e.g., 'wolf'. Optional for templates."),
  name: TranslatableStringSchema.optional().describe("The name of the creature, either a translation key or a multilingual object. This is displayed to the player."),
  description: TranslatableStringSchema.optional().describe("The creature's description, either a translation key or a multilingual object. Provides lore and details."),
  emoji: z.string().describe("A single emoji, SVG filename, or image name representing the creature in the UI."),

  // --- Core Stats ---
  hp: z.number().describe("Health points of the creature. For non-combat entities like trees or mineral veins, this represents their harvesting durability."),
  damage: z.number().describe("Base damage dealt by the creature in combat. Set to 0 for non-aggressive or passive entities."),

  // --- Behavior ---
  behavior: z.enum(['aggressive', 'passive', 'defensive', 'territorial', 'immobile', 'ambush'])
    .describe("Defines how the creature behaves in the world. 'immobile' is used for static resources like trees or mineral veins that cannot move."),
  size: z.enum(['small', 'medium', 'large']).describe("The physical size of the creature, influencing interactions and visual representation."),
  diet: z.array(z.string()).optional().describe("A list of item IDs this creature consumes. This can influence its behavior, potential for taming, or resource drops."),
  satiation: z.number().optional().describe("The creature's starting hunger level. Relevant for creatures with hunger mechanics."),
  maxSatiation: z.number().optional().describe("The maximum satiation level at which the creature is considered full. Used in hunger mechanics."),

  // --- Interaction & Drops ---
  loot: z.array(LootDropSchema).optional().describe("A list of items this creature drops upon being defeated or destroyed. Each entry specifies an item and its drop chance/quantity."),
  harvestable: z.object({
      difficulty: z.number().describe("A general difficulty score for harvesting this resource. Higher values mean it's harder to harvest."),
      requiredTool: z.string().describe("The ID of the tool item required to successfully harvest this resource (e.g., 'axe', 'pickaxe')."),
      loot: z.array(LootDropSchema).describe("A list of items obtained when this resource is successfully harvested."),
  }).optional().describe("Defines if this creature is a harvestable resource node (e.g., a tree for wood, a rock for ore). If present, this creature acts as a resource."),
  
  // --- Sensory Details ---
  senseEffect: z.object({
      keywords: z.array(z.string()).describe("Keywords for sensory descriptions (e.g., 'growling', 'rustling leaves') used during gameplay or by AI for narrative generation."),
  }).optional().describe("Describes the sensory effects associated with the creature, contributing to immersive descriptions."),
  // --- Legacy field to be removed ---
  type: z.string().optional().describe("LEGACY: This field is deprecated and will be removed in future versions. Use `id` for unique identification."),
});

export type CreatureDefinition = z.infer<typeof CreatureDefinitionSchema>;
