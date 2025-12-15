import { z } from 'zod';
import type { Chunk, PlayerStatus, Season } from '@/core/types/game';
import { MultilingualTextSchema } from './base';
import type { SuccessLevel } from '@/lib/utils/dice';

/**
 * Defines the effects that can occur as a result of a random event's outcome.
 * These effects directly modify the player's status, inventory, or the game world.
 */
const EventEffectsSchema = z.object({
  hpChange: z.number().optional().describe("Change in player's health points. Can be positive (heal) or negative (damage)."),
  staminaChange: z.number().optional().describe("Change in player's stamina. Affects actions and movement."),
  manaChange: z.number().optional().describe("Change in player's mana. Affects magical abilities."),
  items: z.array(z.object({
    name: z.string().describe("The ID of the item to add or remove."),
    quantity: z.number().describe("The quantity of the item. Positive to add, negative to remove."),
  })).optional().describe("An array of items to be added to or removed from the player's inventory."),
  spawnEnemy: z.object({
    type: z.string().describe("The type/ID of the enemy to spawn."),
    hp: z.number().describe("The health points of the spawned enemy."),
    damage: z.number().describe("The damage output of the spawned enemy."),
  }).optional().describe("Defines an enemy to be spawned as an event effect."),
  unlockRecipe: z.string().optional().describe("The ID of a crafting recipe to unlock for the player."),
}).describe("A collection of effects that modify game state based on an event outcome.");

/**
 * Defines a single possible outcome for an event, tied to a specific success level.
 * Each outcome includes a description and a set of effects.
 */
const EventOutcomeSchema = z.object({
  description: z.union([z.string(), MultilingualTextSchema]).describe("The event's outcome description, either a translation key or a direct multilingual object. This is displayed to the player."),
  effects: EventEffectsSchema.describe("The effects that are applied when this outcome occurs."),
}).describe("A single possible result of a random event, including its description and game state changes.");
export type EventOutcome = z.infer<typeof EventOutcomeSchema>;


/**
 * The main schema for defining a random event that can occur in the game world.
 * Events are dynamic occurrences that can impact the player and the environment.
 */
export const RandomEventDefinitionSchema = z.object({
  id: z.string().describe("Unique identifier for the event (e.g., 'forest_ambush', 'healing_spring')."),
  name: z.union([z.string(), MultilingualTextSchema]).describe("The display name of the event, either a translation key or a multilingual object. This is shown to the player when the event triggers."),
  theme: z.string().describe("The theme or category of the event (e.g., 'Normal', 'Magic', 'Combat'). Used for filtering or specific game logic."),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("The perceived difficulty of the event, influencing player choices and outcomes."),
  chance: z.number().min(0).max(1).optional().describe("The base probability (0.0 to 1.0) of this event triggering if its `canTrigger` conditions are met."),
  /**
   * A function to check if this event can trigger in the current game context.
   * This function has access to live game state (chunk, player status, season).
   * Modders would typically contribute these functions to the core game logic or a mod loader.
   * @param chunk - The current chunk data where the event might trigger.
   * @param playerStatus - The current status of the player.
   * @param season - The current season in the game world.
   * @returns `true` if the event can trigger, `false` otherwise.
   */
  canTrigger: z.function()
    .args(z.custom<Chunk>(), z.custom<PlayerStatus>(), z.custom<Season>())
    .returns(z.boolean())
    .describe("A function to check if this event can trigger in the current context. It evaluates against live game state."),
  outcomes: z.record(z.custom<SuccessLevel>(), EventOutcomeSchema)
    .describe("A map of possible outcomes, where each key corresponds to a {@link SuccessLevel} (e.g., 'CRITICAL_SUCCESS', 'FAILURE') from a dice roll or other resolution mechanism."),
});

export type RandomEventDefinition = z.infer<typeof RandomEventDefinitionSchema>;
