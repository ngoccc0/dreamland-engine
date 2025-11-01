/**
 * This file defines the Zod schemas for all item-related types.
 * It acts as the single source of truth for the structure of items,
 * their effects, and their relationships, ensuring type safety and consistency
 * across the game engine and AI flows.
 */
import {z} from 'genkit';
import { PlayerAttributesSchema, SpawnConditionsSchema, TranslatableStringSchema } from './base';
import { allTerrains } from '../types';

/**
 * Defines all possible categories for an item. This categorization system drives multiple game mechanics:
 * - Inventory sorting and filtering logic
 * - Crafting recipe compatibility (e.g., only 'Material' items can be used in crafting)
 * - Equipment slot restrictions (only 'Weapon' items can be equipped in weapon slots)
 * - AI behavior patterns (e.g., enemies prioritize 'Weapon' items for combat)
 * - Player progression systems (certain categories unlock at different game stages)
 *
 * Legacy categories ('Equipment', 'Support') are maintained for backward compatibility
 * during the migration period, but new items should use the standardized categories.
 */
export const ItemCategorySchema = z.enum([
    'Weapon', 'Armor', 'Accessory', 'Tool',
    'Material', 'Energy Source',
    'Food', 'Consumable', 'Potion',
    'Data', 'Utility',
    'Magic', 'Fusion', 'Misc',
    // Legacy categories to support existing data before it's fully migrated.
    'Equipment', 'Support'
]).describe("The primary category of the item that determines its behavioral classification in game systems.");
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

/**
 * Defines the effect an item can have when used. Effects are applied through the Effect Engine
 * and can modify player attributes, status conditions, or trigger world events.
 *
 * Effect processing logic:
 * 1. Effect type determines which attribute or system is affected (e.g., 'health', 'strength')
 * 2. Amount is applied as a direct modifier (positive for buffs, negative for debuffs)
 * 3. Duration specifies how many game turns the effect persists (undefined = instant effect)
 * 4. Effects are stacked with existing player attributes and can be temporary or permanent
 * 5. Multiple effects on the same item are applied sequentially in array order
 *
 * Interdependencies:
 * - Effects interact with PlayerAttributesSchema for stat modifications
 * - Duration effects are managed by the game's time system
 * - Effect types must match those recognized by the Effect Engine
 */
// Effect schema is now extensible: allows extra fields for custom effects via modding
export const ItemEffectSchema = z.object({
    type: z.string().describe("The type of effect the item has. Can be a built-in or custom effect type. Built-in types include 'health', 'strength', 'speed', 'defense', etc."),
    amount: z.number().optional().describe("The numerical value of the effect (e.g., amount of health restored). Positive values buff, negative values debuff. Magnitude affects potency."),
    duration: z.number().optional().describe("Duration of the effect in game turns, if applicable. Undefined means instant effect. Duration effects are tracked by the game's time system."),
}).passthrough();
export type ItemEffect = z.infer<typeof ItemEffectSchema>;


/**
 * Defines the relationship of an item to others, primarily for crafting substitution logic.
 * This enables flexible recipe requirements where similar items can be used interchangeably.
 *
 * Substitution logic:
 * 1. When a recipe requires item X, the system checks if any inventory items have substituteFor: X
 * 2. Quality multiplier affects the crafting result (quality 1 = 100% efficiency, quality 2 = 50% efficiency)
 * 3. Lower quality numbers indicate better substitutes (perfect substitute = 1, poor substitute = higher numbers)
 * 4. Substitution only works one-way (substitute cannot be used as base for other recipes)
 *
 * Interdependencies:
 * - Affects RecipeDefinitionSchema requirements matching
 * - Influences crafting success rates and output quality
 * - Enables modding by allowing new items to substitute for existing ones
 */
export const ItemRelationshipSchema = z.object({
  substituteFor: z.string().optional().describe("The 'base' item ID this item can substitute for in crafting recipes (e.g., 'smallHide' can substitute for 'animalHide'). Only works in recipes requiring the base item."),
  quality: z.number().min(1).optional().describe("The quality of the substitution as an efficiency multiplier. Lower is better (1 = perfect substitute with 100% efficiency, 2 = decent substitute with 50% efficiency)."),
});
export type ItemRelationship = z.infer<typeof ItemRelationshipSchema>;

/**
 * The comprehensive definition of an item, containing all properties that determine its behavior
 * and interactions within the game world. This schema serves as the foundation for item processing
 * across multiple game systems.
 *
 * Key gameplay mechanics and calculations:
 *
 * 1. **Tier System**: Higher tier items have reduced spawn rates (tier * 0.1 multiplier) and
 *    increased crafting complexity. Tier also affects AI valuation and player progression unlocks.
 *
 * 2. **Attribute Integration**: When equipped, attributes are added to player's base stats:
 *    - final_stat = base_player_stat + equipped_item_attributes
 *    - Multiple items in same slot use highest attribute values (no stacking)
 *
 * 3. **Weight & Inventory**: Total carried weight affects movement speed:
 *    - speed_penalty = total_weight / max_capacity
 *    - Over-capacity prevents movement and new item pickup
 *
 * 4. **Stacking Logic**: Items in inventory slots follow stacking rules:
 *    - Same item ID can stack up to stackable limit per slot
 *    - Different slots can hold different stacks of same item
 *    - stackable: 1 means unique items (no stacking)
 *
 * 5. **Spawn Probability**: Combined spawn chance calculation:
 *    - naturalSpawn: biome_chance * world_multiplier * chunk_multiplier
 *    - droppedBy: creature_drop_chance * luck_modifier * tier_modifier
 *    - spawnEnabled: false prevents all natural spawning
 *
 * 6. **Effect Processing**: Applied through Effect Engine when item is used:
 *    - Instant effects: applied immediately to player stats
 *    - Duration effects: tracked by time system, removed after expiration
 *    - Multiple effects processed in array order
 *
 * Interdependencies and data flow:
 * - Category → determines valid equipmentSlot and crafting compatibility
 * - Attributes → modifies PlayerAttributesSchema calculations
 * - Effects → processed by Effect Engine, affects player state
 * - Weight → impacts Inventory capacity calculations
 * - Relationship → enables RecipeDefinitionSchema substitution matching
 * - naturalSpawn/droppedBy → integrated with World Generation and Combat systems
 * - senseEffect → feeds into AI narrative generation
 */
export const ItemDefinitionSchema = z.object({
  id: z.string().optional().describe("Unique identifier for the item, e.g., 'healingHerb'. If not provided, the key from the record will be used. This ID is used for internal lookup and referencing."),
  name: TranslatableStringSchema.describe("The name of the item, either a translation key or a multilingual object. This is what the player sees in-game."),
  description: TranslatableStringSchema.describe("The item's description, either a translation key or a multilingual object. Provides lore and functional details to the player."),
  tier: z.number().describe("The rarity or power level of the item. Higher tiers generally mean more valuable or potent items, affecting drop rates and crafting difficulty."),
  category: ItemCategorySchema.describe("The primary category of the item, influencing inventory sorting, crafting recipes, and general game logic."),
  subCategory: z.string().optional().describe("A more specific category like 'Meat', 'Fruit', 'Potion'. Used for finer-grained filtering and game mechanics."),
  emoji: z.string().describe("A single emoji, SVG filename, or image name representing the item. Used for visual representation in UI."),
  effects: z.array(ItemEffectSchema).describe("An array of effects the item provides when used. These effects directly impact player attributes, status, or the game world."),
  baseQuantity: z.object({ min: z.number(), max: z.number() }).describe("The base quantity range (min and max) of this item that typically spawns or is found. This is scaled by world and chunk multipliers."),
  /**
   * Optional growth conditions for natural items (e.g., plants).
   * This field is used to determine where and how an item can naturally grow or be cultivated.
   * The shape of `growthConditions` can vary across different recipes and mod data,
   * so it accepts an open record to remain compatible and avoid frequent schema churn.
   */
  growthConditions: z.record(z.any()).optional(),
  equipmentSlot: z.enum(['weapon', 'armor', 'accessory']).optional().describe("If the item is equippable, this specifies which equipment slot it occupies (e.g., 'weapon', 'armor', 'accessory')."),
  attributes: PlayerAttributesSchema.optional().describe("The combat or character attributes this item provides when equipped. These are added to the player's base stats."),
  relationship: ItemRelationshipSchema.optional().describe("Defines how this item relates to others, primarily for crafting substitutions. Allows for flexible recipe requirements."),
  weight: z.number().optional().describe("The weight of a single item unit. Affects player inventory capacity and movement speed."),
  stackable: z.number().int().optional().describe("The maximum number of this item that can be held in one inventory slot. Items with `stackable: 1` are unique per slot."),
  senseEffect: z.object({
    visual: TranslatableStringSchema.optional().describe("How the item looks, affecting player perception and descriptions."),
    auditory: TranslatableStringSchema.optional().describe("How the item sounds when interacted with or present, contributing to environmental immersion."),
    tactile: TranslatableStringSchema.optional().describe("How the item feels to the touch, adding to sensory detail."),
    olfactory: TranslatableStringSchema.optional().describe("How the item smells, if applicable, for richer descriptions."),
    taste: TranslatableStringSchema.optional().describe("How the item tastes, if applicable, for consumable items."),
    keywords: z.array(z.string()).optional().describe("Keywords for sensory descriptions, used by AI for generating richer narratives."),
  }).optional().describe("Descriptions of the item's sensory effects (sight, sound, touch, smell, taste, etc.). These are used to generate immersive descriptions and AI narratives."),
  naturalSpawn: z.array(z.object({
      biome: z.string().describe("The biome where this item can naturally spawn. Ideally, this should be of type Terrain, but string allows for modded biomes."),
      chance: z.number().describe("The probability (0-1) of this item spawning in the specified biome."),
      conditions: SpawnConditionsSchema.optional().describe("Additional conditions that must be met for the item to spawn in this biome."),
  })).optional().describe("Defines the conditions under which this item can naturally appear in the world, based on biome and chance."),
  droppedBy: z.array(z.object({
      creature: z.string().describe("The ID of the creature that can drop this item."),
      chance: z.number().describe("The probability (0-1) of this item being dropped by the specified creature."),
  })).optional().describe("Specifies which creatures can drop this item and with what probability, linking items to the enemy ecosystem."),
  function: z.string().optional().describe("A brief description of the item's primary purpose or function in the game. This is a high-level summary for quick understanding."),
  spawnBiomes: z.array(z.enum(allTerrains)).optional().describe("An array of one or more biomes where this item can naturally be found. This is a simplified way to define general spawn locations."),
  spawnEnabled: z.boolean().optional().default(true).describe("Whether this item can spawn naturally in the world. Defaults to `true`. Set to `false` for crafted-only items, quest items, or items that should not appear randomly."),
});
export type ItemDefinition = z.infer<typeof ItemDefinitionSchema>;
