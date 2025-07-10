import { z } from 'genkit';

/**
 * @fileoverview Defines the base schema for all game entities.
 * This provides a common set of properties like name, description, and emoji
 * that are inherited by items, creatures, structures, etc.
 */

export const BaseGameEntitySchema = z.object({
  name: z.string().describe("The unique identifier and display name for the entity."),
  description: z.string().describe("A flavorful, in-game description of the entity."),
  emoji: z.string().describe("A single emoji character used to represent the entity in the UI."),
});
