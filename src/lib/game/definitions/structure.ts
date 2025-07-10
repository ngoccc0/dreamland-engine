import {z} from 'zod';
import type { TranslationKey } from '@/lib/i18n';

export const StructureDefinitionSchema = z.object({
    name: z.object({ en: z.string(), vi: z.string() }).describe("The multilingual name of the structure."),
    description: z.object({ en: z.string(), vi: z.string() }).describe("The multilingual description of the structure."),
    emoji: z.string().describe("An emoji representing the structure."),
    providesShelter: z.boolean().optional(),
    buildable: z.boolean().optional(),
    buildCost: z.array(z.object({ name: z.string(), quantity: z.number() })).optional(),
    restEffect: z.object({ hp: z.number(), stamina: z.number() }).optional(),
    heatValue: z.number().optional(),
});

export type StructureDefinition = z.infer<typeof StructureDefinitionSchema>;
```