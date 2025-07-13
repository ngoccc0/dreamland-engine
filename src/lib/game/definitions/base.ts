import {z} from 'genkit';

// Defines a range for environmental conditions, e.g., moisture: { min: 5, max: 8 }.
const ConditionRangeSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional()
});

// Defines the environmental conditions under which an entity (item, creature) can spawn.
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


// Defines the combat attributes that can be applied to a player or an item.
export const PlayerAttributesSchema = z.object({
    physicalAttack: z.number().optional().describe("Player's base physical damage."),
    magicalAttack: z.number().optional().describe("Player's base magical damage."),
    physicalDefense: z.number().optional().describe("Player's physical damage reduction."),
    magicalDefense: z.number().optional().describe("Player's magical damage reduction."),
    critChance: z.number().optional().describe("Player's chance to land a critical hit (percentage)."),
    attackSpeed: z.number().optional().describe("Player's attack speed modifier."),
    cooldownReduction: z.number().optional().describe("Player's cooldown reduction (percentage)."),
});

// Defines the category of an item. This helps with organization and game logic.
export const ItemCategorySchema = z.enum([
    'Weapon', 'Armor', 'Accessory',
    'Material', 'Energy Source',
    'Food', 'Consumable', 'Potion',
    'Data', 'Tool', 'Utility',
    'Magic', 'Fusion', 'Misc'
]).describe("The primary category of the item.");
export type ItemCategory = z.infer<typeof ItemCategorySchema>;


// Defines a multilingual string object.
export const MultilingualTextSchema = z.object({
  en: z.string(),
  vi: z.string(),
});
export type MultilingualText = z.infer<typeof MultilingualTextSchema>;

// A schema that can be either a translation key (string) or a direct multilingual object.
export const TranslatableStringSchema = z.union([z.string(), MultilingualTextSchema]);


// Defines the loot dropped by an entity (creature, harvestable node, etc.).
export const LootDropSchema = z.object({
  name: z.string().describe("The unique ID of the item to drop."),
  chance: z.number().min(0).max(1).describe("The probability of this item dropping (0 to 1)."),
  quantity: z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1),
  }).describe("The range of quantities that can drop."),
});
export type LootDrop = z.infer<typeof LootDropSchema>;
