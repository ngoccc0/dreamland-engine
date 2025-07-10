import { z } from 'genkit';
import { BaseGameEntitySchema } from './base';
import { allTerrains } from '../types';

/**
 * @fileoverview Defines the schemas for items and their properties.
 */

export const SenseEffectSchema = z.object({
    smell: z.string().optional(),
    sound: z.string().optional(),
    visibility: z.string().optional(),
    keywords: z.array(z.string()).optional().describe("A list of descriptive keywords for sensory perception by AI or other systems (e.g., 'rotting', 'glowing', 'loud')."),
}).describe("Sensory effects the item emits, which can attract or repel creatures.");

export const ItemCategorySchema = z.enum([
    'Weapon', 
    'Tool', 
    'Food', 
    'Material', 
    'Support', 
    'Equipment', 
    'Magic', 
    'Data', 
    'Fusion',
    'Energy Source',
]).describe("The category of the item.");

export const ItemEffectSchema = z.object({
    type: z.enum(['HEAL', 'RESTORE_STAMINA']),
    amount: z.number(),
});

const ConditionRangeSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional()
});

export const SpawnConditionsSchema = z.object({
  chance: z.number().optional(),
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
}).describe("A set of environmental conditions.");


export const PlayerAttributesSchema = z.object({
    physicalAttack: z.number().default(0).describe("Player's base physical damage."),
    magicalAttack: z.number().default(0).describe("Player's base magical damage."),
    critChance: z.number().default(0).describe("Player's chance to land a critical hit (percentage)."),
    attackSpeed: z.number().default(0).describe("Player's attack speed modifier."),
    cooldownReduction: z.number().default(0).describe("Player's cooldown reduction (percentage)."),
});


export const ItemDefinitionSchema = BaseGameEntitySchema.extend({
    category: ItemCategorySchema,
    subCategory: z.string().optional().describe("A more specific category, e.g., 'Meat' for Food, or 'Shield' for Equipment."),
    tier: z.number().int().min(1).max(6),
    tags: z.array(z.string()).optional().describe("Tags for filtering or applying special logic (e.g., 'plant_matter', 'mineral')."),
    effects: z.array(ItemEffectSchema).optional().default([]),
    stackable: z.number().int().optional().describe("The maximum number of this item that can be held in a single inventory stack."),
    equipmentSlot: z.enum(['weapon', 'armor', 'accessory']).optional(),
    attributes: PlayerAttributesSchema.partial().optional(),
    
    // Core functional properties
    function: z.string().optional().describe("A general description of the item's primary purpose or function."),
    weight: z.number().optional().describe("How much the item weighs, affecting inventory capacity."),
    durability: z.object({
        decayType: z.enum(['usage', 'time']).describe("How durability decreases: per use or over time."),
        max: z.number().describe("Maximum durability points."),
        decayRate: z.number().describe("Amount of durability lost per decay event."),
    }).optional(),

    // Relational and sensory properties
    senseEffect: SenseEffectSchema.optional(),
    relationship: z.object({
        substituteFor: z.string().optional().describe("The name of another item that this item can be a substitute for in crafting (e.g., 'Cành Cây Chắc Chắn' can substitute for 'Lõi Gỗ')."),
        tier: z.number().int().min(1).max(3).optional().describe("The effectiveness tier of the substitution (1=best, 3=worst). A higher tier number may result in a lower crafting success chance."),
    }).optional(),

    // Spawning properties
    baseQuantity: z.object({ min: z.number(), max: z.number() }).describe("Default quantity when spawned or dropped."),
    naturalSpawn: z.array(z.object({
        enabled: z.boolean().optional().default(true),
        biome: z.enum(allTerrains),
        chance: z.number().min(0).max(1),
        conditions: SpawnConditionsSchema.optional()
    })).optional().describe("List of biomes where this item can spawn naturally."),
    droppedBy: z.array(z.object({
        creature: z.string(),
        chance: z.number().min(0).max(1),
    })).optional().describe("A list of creatures that can drop this item and their respective chances."),
});

export const GeneratedItemSchema = ItemDefinitionSchema;

export const PlayerItemSchema = z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    tier: z.number(),
    emoji: z.string(),
});

export const ChunkItemSchema = z.object({
    name: z.string(),
    description: z.string(),
    quantity: z.number().int(),
    tier: z.number(),
    emoji: z.string(),
});
