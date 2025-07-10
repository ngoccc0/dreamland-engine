
import { z } from 'zod';
import type { Chunk, PlayerStatus, Season } from '../types';
import { MultilingualTextSchema, LootDropSchema } from './base';
import type { SuccessLevel } from '../dice';

// Defines the effects of a random event's outcome.
const EventEffectsSchema = z.object({
  hpChange: z.number().optional(),
  staminaChange: z.number().optional(),
  manaChange: z.number().optional(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
  })).optional(),
  spawnEnemy: z.object({
    type: z.string(),
    hp: z.number(),
    damage: z.number(),
  }).optional(),
  unlockRecipe: z.string().optional(),
});

// Defines a single possible outcome for an event, tied to a success level.
const EventOutcomeSchema = z.object({
  description: MultilingualTextSchema,
  effects: EventEffectsSchema,
});
export type EventOutcome = z.infer<typeof EventOutcomeSchema>;


// The main schema for defining a random event.
export const RandomEventDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the event."),
  name: MultilingualTextSchema.describe("The display name of the event."),
  theme: z.string().describe("The theme of the event (e.g., 'Normal', 'Magic'). Affects spawn checks."),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  chance: z.number().min(0).max(1).optional().describe("Base chance of this event triggering if conditions are met."),
  // The condition check is a function because it's complex and needs access to live game state.
  // Modders would contribute these functions to the core game logic or a mod loader.
  canTrigger: z.function()
    .args(z.custom<Chunk>(), z.custom<PlayerStatus>(), z.custom<Season>())
    .returns(z.boolean())
    .describe("A function to check if this event can trigger in the current context."),
  outcomes: z.record(z.custom<SuccessLevel>(), EventOutcomeSchema)
    .describe("A map of outcomes based on the result of a dice roll."),
});

export type RandomEventDefinition = z.infer<typeof RandomEventDefinitionSchema>;
