
import {z} from 'genkit';
import { TranslatableStringSchema, LootDropSchema, SpawnConditionsSchema } from './base';

export const StructureDefinitionSchema = z.object({
    name: TranslatableStringSchema.describe("The name of the structure, either a key or a multilingual object."),
    description: TranslatableStringSchema.describe("The description of the structure, either a key or a multilingual object."),
    emoji: z.string().describe("An emoji representing the structure."),
    providesShelter: z.boolean().optional(),
    buildable: z.boolean().optional(),
    buildCost: z.array(z.object({ name: z.string(), quantity: z.number() })).optional(),
    restEffect: z.object({ hp: z.number(), stamina: z.number(), mana: z.number().optional() }).optional(),
    heatValue: z.number().optional(),
    loot: z.array(LootDropSchema).optional().describe("A list of items this structure might contain."),
    conditions: SpawnConditionsSchema.optional().describe("The conditions under which this structure will spawn."),
});

export type StructureDefinition = z.infer<typeof StructureDefinitionSchema>;
