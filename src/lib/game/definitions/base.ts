import {z} from 'genkit';

/**
 * @description A schema for defining a range for environmental conditions, e.g., `{ min: 5, max: 8 }`.
 */
const ConditionRangeSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional()
});

/**
 * @description Defines the environmental conditions under which an entity (item, creature) can spawn.
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
 * @description Defines the combat attributes that can be applied to a player or an item.
 * All attributes are optional and default to 0 if not specified.
 */
export const PlayerAttributesSchema = z.object({
    physicalAttack: z.number().optional().default(0),
    magicalAttack: z.number().optional().default(0),
    physicalDefense: z.number().optional().default(0),
    magicalDefense: z.number().optional().default(0),
    critChance: z.number().optional().default(0),
    attackSpeed: z.number().optional().default(0),
    cooldownReduction: z.number().optional().default(0),
});
export type PlayerAttributes = z.infer<typeof PlayerAttributesSchema>;

/**
 * @description Defines the category of an item. This helps with organization and game logic.
 */
export const ItemCategorySchema = z.enum([
    'Weapon', 'Armor', 'Accessory',
    'Material', 'Energy Source',
    'Food', 'Consumable', 'Potion',
    'Data', 'Tool', 'Utility',
    'Magic', 'Fusion', 'Misc',
    'Equipment', 'Support'
]).describe("The primary category of the item.");
export type ItemCategory = z.infer<typeof ItemCategorySchema>;


/**
 * @description Defines a multilingual string object.
 */
export const MultilingualTextSchema = z.object({
  en: z.string(),
  vi: z.string(),
});
export type MultilingualText = z.infer<typeof MultilingualTextSchema>;

/**
 * @description A schema that can be either a translation key (string) or a direct multilingual object.
 */
export const TranslatableStringSchema = z.union([z.string(), MultilingualTextSchema]);


/**
 * @description Defines the loot dropped by an entity (creature, harvestable node, etc.).
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
