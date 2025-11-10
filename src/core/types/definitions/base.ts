
import {z} from 'genkit';

/**
 * Defines a multilingual string object.
 * @property {string} en - The English translation.
 * @property {string} vi - The Vietnamese translation.
 */
export const MultilingualTextSchema = z.object({
  en: z.string(),
  vi: z.string(),
});
export type MultilingualText = z.infer<typeof MultilingualTextSchema>;

/**
 * A schema that can be either a translation key (string) or a translation object with params.
 * This provides flexibility for static UI text vs. dynamic game data with variables.
 */
/**
 * A schema that can be either a direct translation key (string),
 * a translation object with a key and optional parameters,
 * or a direct multilingual object with 'en' and 'vi' properties.
 * This provides flexibility for static UI text versus dynamic game data with variables.
 */
export const TranslatableStringSchema = z.union([
    z.string().describe("A direct translation key (e.g., 'item_name_healing_herb')."),
    z.object({
        key: z.string().describe("The translation key."),
        params: z.record(z.union([z.string(), z.number()])).optional().describe("Parameters to be interpolated into the translated string."),
    }).describe("A translation object with a key and optional parameters for dynamic text."),
    z.object({
        en: z.string().describe("The English translation."),
        vi: z.string().describe("The Vietnamese translation."),
    }).describe("A direct multilingual object for text that doesn't require a translation key lookup."),
]);
export type TranslatableString = z.infer<typeof TranslatableStringSchema>;

/**
 * A schema for defining a numerical range for environmental conditions, e.g., `{ min: 5, max: 8 }`.
 * This is used to specify acceptable bounds for various environmental factors.
 */
const ConditionRangeSchema = z.object({
    min: z.number().optional().describe("The minimum value for the condition (inclusive)."),
    max: z.number().optional().describe("The maximum value for the condition (inclusive).")
}).describe("A numerical range with optional minimum and maximum bounds.");

/**
 * Defines the environmental and contextual conditions under which an entity (item, creature, structure) can spawn or an event can occur.
 * All conditions are optional, allowing for flexible and partial condition sets.
 */
export const SpawnConditionsSchema = z.object({
  chance: z.number().optional().describe("The base probability (0.0 to 1.0) of the entity spawning or event occurring, before other modifiers."),
  vegetationDensity: ConditionRangeSchema.optional().describe("Required range for the chunk's vegetation density (0-100)."),
  moisture: ConditionRangeSchema.optional().describe("Required range for the chunk's moisture level (0-100)."),
  elevation: ConditionRangeSchema.optional().describe("Required range for the chunk's elevation (e.g., 0-255)."),
  dangerLevel: ConditionRangeSchema.optional().describe("Required range for the chunk's danger level (0-100)."),
  magicAffinity: ConditionRangeSchema.optional().describe("Required range for the chunk's magic affinity (0-100)."),
  humanPresence: ConditionRangeSchema.optional().describe("Required range for the chunk's human presence (0-100). Lower values might indicate wilderness."),
  predatorPresence: ConditionRangeSchema.optional().describe("Required range for the chunk's predator presence (0-100)."),
  lightLevel: ConditionRangeSchema.optional().describe("Required range for the chunk's light level (0-100), affecting day/night spawns."),
  temperature: ConditionRangeSchema.optional().describe("Required range for the chunk's temperature (e.g., -20 to 40 Celsius)."),
  soilType: z.array(z.string()).optional().describe("An array of acceptable soil types for spawning (e.g., ['fertile', 'rocky'])."),
  timeOfDay: z.enum(['day', 'night']).optional().describe("Specifies if spawning should occur during 'day' or 'night'."),
  visibility: ConditionRangeSchema.optional().describe("Required range for the chunk's visibility (0-100)."),
  humidity: ConditionRangeSchema.optional().describe("Required range for the chunk's humidity (0-100)."),
}).describe("A set of environmental and contextual conditions that must be met for spawning or event triggers.");
export type SpawnConditions = z.infer<typeof SpawnConditionsSchema>;


/**
 * Defines the combat and utility attributes that can be applied to a player character or an item.
 * These attributes directly influence gameplay mechanics such as damage, defense, and action speed.
 * All attributes are optional, allowing for partial attribute objects (e.g., an item only boosting physicalAttack).
 */
export const PlayerAttributesSchema = z.object({
  physicalAttack: z.number().optional().describe("The amount of damage dealt by physical attacks. Increases offensive capability."),
  magicalAttack: z.number().optional().describe("The amount of damage dealt by magical attacks. Increases magical offensive capability."),
  physicalDefense: z.number().optional().describe("Reduces incoming physical damage. Increases physical survivability."),
  magicalDefense: z.number().optional().describe("Reduces incoming magical damage. Increases magical survivability."),
  critChance: z.number().optional().describe("The percentage chance (0-100) to deal critical damage, which is typically higher damage."),
  attackSpeed: z.number().optional().describe("The speed of attacks (e.g., attacks per second or turns between attacks). Higher values mean faster attacks."),
  cooldownReduction: z.number().optional().describe("Reduces the cooldown duration of skills or abilities (%). Higher values mean skills can be used more frequently."),
}).describe("Defines various combat and utility attributes for a player or item, influencing their effectiveness in combat and other interactions.");
export type PlayerAttributes = z.infer<typeof PlayerAttributesSchema>;

/**
 * Defines the loot dropped by an entity (e.g., a creature, a harvestable node, or a destructible structure).
 * This schema specifies what items can be obtained and under what conditions.
 */
export const LootDropSchema = z.object({
  name: z.string().describe("The unique ID of the item definition to drop (e.g., 'healingHerb')."),
  chance: z.number().min(0).max(1).describe("The probability (0.0 to 1.0) of this specific item dropping."),
  quantity: z.object({
    min: z.number().int().min(1).describe("The minimum number of items to drop."),
    max: z.number().int().min(1).describe("The maximum number of items to drop."),
  }).describe("The range of quantities for the item that can be dropped."),
}).describe("Defines a single item that can be dropped as loot, including its quantity and drop chance.");
export type LootDrop = z.infer<typeof LootDropSchema>;

/**
 * Defines the visual representation of an item or biome, either as a simple emoji string
 * or as an image object with a URL. This schema is reused across different game entities
 * to maintain consistency in visual representation.
 */
export const EmojiSchema = z.union([
  z.string(),
  z.object({
    type: z.literal('image'),
    url: z.string()
  })
]).describe("A single emoji, SVG filename, or image object representing the entity. Used for visual representation in UI.");
export type Emoji = z.infer<typeof EmojiSchema>;
