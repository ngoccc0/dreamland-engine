
import {z} from 'genkit';
import { TranslatableStringSchema, LootDropSchema, SpawnConditionsSchema } from './base';

/**
 * Defines a structure that can exist in the game world, such as a building,
 * a natural formation, or a player-built construction.
 */
export const StructureDefinitionSchema = z.object({
    name: TranslatableStringSchema.describe("The name of the structure, either a translation key or a multilingual object. This is displayed to the player."),
    description: TranslatableStringSchema.describe("The description of the structure, either a translation key or a multilingual object. Provides details about its purpose or appearance."),
    emoji: z.string().describe("An emoji, SVG filename, or image name representing the structure in the UI."),
    providesShelter: z.boolean().optional().describe("Indicates if this structure offers shelter from environmental hazards (e.g., weather)."),
    buildable: z.boolean().optional().describe("If `true`, this structure can be constructed by the player."),
    buildCost: z.array(z.object({ 
      name: z.string().describe("The ID of the item required for building."), 
      quantity: z.number().describe("The quantity of the item required.") 
    })).optional().describe("An array of items and their quantities required to build this structure."),
    restEffect: z.object({ 
      hp: z.number().describe("Health points restored per rest cycle."), 
      stamina: z.number().describe("Stamina restored per rest cycle."), 
      mana: z.number().optional().describe("Mana restored per rest cycle, if applicable.") 
    }).optional().describe("Defines the effects on player stats when resting in this structure."),
    heatValue: z.number().optional().describe("The amount of heat this structure provides, useful in cold environments."),
    loot: z.array(LootDropSchema).optional().describe("A list of items this structure might contain when discovered or destroyed."),
    conditions: SpawnConditionsSchema.optional().describe("The conditions under which this structure will naturally spawn in the world."),
}).describe("A complete definition for a structure in the game world.");

export type StructureDefinition = z.infer<typeof StructureDefinitionSchema>;
