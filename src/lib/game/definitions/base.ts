
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
export const TranslatableStringSchema = z.union([
    z.string(),
    z.object({
        key: z.string(),
        params: z.record(z.union([z.string(), z.number()])).optional(),
    }),
    z.object({
        en: z.string(),
        vi: z.string(),
    })
]);

/**
 * A schema for defining a range for environmental conditions, e.g., `{ min: 5, max: 8 }`.
 */
const ConditionRangeSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional()
});

/**
 * Defines the environmental conditions under which an entity (item, creature) can spawn.
 */
export const SpawnConditionsSchema = z.object({
  chance: z.number().optional().describe("Base spawn chance, 0.0 to 1.0."),
  vegetationDensity: ConditionRangeSchema.optional(),
  moisture: ConditionRangeSchema.optional(),
  elevation: ConditionRangeSchema.optional(),
  dangerLevel: ConditionRangeSchema.optional(),
  magicAffinity: ConditionRangeSchema.optional(),
  humanPresence: ConditionRangeSchema.optional(),
  predatorPresence: ConditionRangeSchema.optional(),
  lightLevel: ConditionRangeSchema.optional(),
  temperature: ConditionRangeSchema.optional(),
  soilType: z.array(z.string()).optional(),
  timeOfDay: z.enum(['day', 'night']).optional(),
  visibility: ConditionRangeSchema.optional(),
  humidity: ConditionRangeSchema.optional(),
}).describe("A set of environmental conditions that must be met for spawning.");
export type SpawnConditions = z.infer<typeof SpawnConditionsSchema>;


/**
 * Defines the combat attributes that can be applied to a player or an item.
 * All attributes are optional and default to 0 if not specified, allowing for flexible item creation.
 */
export const PlayerAttributesSchema = z.object({
  // Make individual attributes optional without defaults so partial attribute
  // objects (e.g., only physicalAttack) are accepted by TypeScript.
  physicalAttack: z.number().optional().describe("Damage dealt by physical attacks."),
  magicalAttack: z.number().optional().describe("Damage dealt by magical attacks."),
  physicalDefense: z.number().optional().describe("Reduces incoming physical damage."),
  magicalDefense: z.number().optional().describe("Reduces incoming magical damage."),
  critChance: z.number().optional().describe("Chance to deal critical damage (%)."),
  attackSpeed: z.number().optional().describe("Speed of attacks (e.g., attacks per second)."),
  cooldownReduction: z.number().optional().describe("Reduces skill cooldowns (%)."),
}).describe("Defines various combat and utility attributes for a player or item.");
export type PlayerAttributes = z.infer<typeof PlayerAttributesSchema>;

/**
 * Defines the loot dropped by an entity (creature, harvestable node, etc.).
 */
export const LootDropSchema = z.object({
  name: z.string().describe("The unique ID of the item to drop."),
  chance: z.number().min(0).max(1).describe("The probability of this item dropping (0 to 1)."),
  quantity: z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1),
  }).describe("The range of quantities that can drop."),
});
export type LootDrop = z.infer<typeof LootDropSchema>;
