import { z } from 'genkit';
import { BaseGameEntitySchema } from './base';
import { SenseEffectSchema } from './item';

/**
 * @fileoverview Defines the schema for game structures.
 */

export const StructureSchema = BaseGameEntitySchema.extend({
    providesShelter: z.boolean().optional(),
    buildable: z.boolean().optional(),
    buildCost: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
    })).optional(),
    restEffect: z.object({
        hp: z.number(),
        stamina: z.number(),
    }).optional(),
    heatValue: z.number().optional(),
    dropTable: z.array(z.object({
        name: z.string(),
        chance: z.number().min(0).max(1),
        quantity: z.object({ min: z.number(), max: z.number() })
    })).optional().describe("Loot table for this structure when destroyed or harvested."),
    senseEffect: SenseEffectSchema.optional(),
    requiredTool: z.string().optional().describe("The name of the tool required to harvest/interact with this structure."),
    harvestActionName: z.string().optional().describe("The verb for the harvest action, e.g., 'Chop', 'Mine'"),
});
