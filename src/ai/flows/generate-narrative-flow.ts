'use server';
/**
 * @fileOverview The AI Storyteller flow.
 *
 * This file defines the Genkit flow responsible for generating dynamic, context-aware narratives
 * for the game. It acts as an AI Game Master, taking the current game state and player action
 * to produce a rich, evolving story.
 *
 * - generateNarrative - The main function called by the game layout.
 * - GenerateNarrativeInput - The Zod schema for the input data.
 * - GenerateNarrativeOutput - The Zod schema for the structured AI response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schemas that mirror the game's data structures from `src/lib/game/types.ts`.
// It's important to keep these in sync with the actual types.

const PlayerStatusSchema = z.object({
    hp: z.number(),
    mana: z.number(),
    items: z.array(z.string()),
    quests: z.array(z.string()),
});

const ChunkSchema = z.object({
    x: z.number(),
    y: z.number(),
    terrain: z.enum(["forest", "grassland", "desert", "swamp", "mountain", "cave"]),
    description: z.string(),
    NPCs: z.array(z.string()),
    items: z.array(z.object({ name: z.string(), description: z.string() })),
    explored: z.boolean(),
    enemy: z.object({ type: z.string(), hp: z.number(), damage: z.number() }).nullable(),
    // We only need a subset of the full chunk attributes for the AI's context.
    vegetationDensity: z.number(),
    moisture: z.number(),
    elevation: z.number(),
    lightLevel: z.number(),
    dangerLevel: z.number(),
    magicAffinity: z.number(),
    humanPresence: z.number(),
    predatorPresence: z.number(),
});

// == STEP 1: DEFINE THE INPUT SCHEMA ==
const GenerateNarrativeInputSchema = z.object({
  worldName: z.string().describe("The name of the game world."),
  playerAction: z.string().describe("The action the player just performed. E.g., 'move north', 'attack wolf', 'explore area'."),
  playerStatus: PlayerStatusSchema.describe("The player's current status (HP, items, etc.)."),
  currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is currently on."),
  recentNarrative: z.array(z.string()).describe("The last few entries from the narrative log to provide conversational context."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});
export type GenerateNarrativeInput = z.infer<typeof GenerateNarrativeInputSchema>;


// == STEP 2: DEFINE THE OUTPUT SCHEMA ==
const GenerateNarrativeOutputSchema = z.object({
  narrative: z.string().describe("The main narrative description of what happens next. This should be engaging and based on the player's action and the environment. It should be 2-4 sentences long."),
  updatedChunk: z.object({
    // The AI can suggest changes to the current chunk.
    description: z.string().optional().describe("A new base description for the chunk if something significant changes."),
    items: z.array(z.object({ name: z.string(), description: z.string() })).optional().describe("The new list of items in the chunk. Used to add or remove items."),
    NPCs: z.array(z.string()).optional().describe("The new list of NPCs in the chunk."),
    enemy: z.object({ type: z.string(), hp: z.number(), damage: z.number() }).nullable().optional().describe("The state of the enemy in the chunk. Set to null if the enemy is defeated or flees."),
  }).optional().describe("Optional: Changes to the current game chunk based on the action's outcome."),
  updatedPlayerStatus: z.object({
    // The AI can suggest changes to the player's status.
    items: z.array(z.string()).optional().describe("The player's new inventory. Used when the player picks up or uses an item."),
    quests: z.array(z.string()).optional().describe("The player's new quest list."),
    hp: z.number().optional().describe("The player's new HP, if they took damage or healed."),
  }).optional().describe("Optional: Changes to the player's status."),
  systemMessage: z.string().optional().describe("An optional, short system message for important events (e.g., 'Item added to inventory', 'Quest updated')."),
});
export type GenerateNarrativeOutput = z.infer<typeof GenerateNarrativeOutputSchema>;


/**
 * The main function to be called from the frontend.
 * @param input The current game state and player action.
 * @returns A promise that resolves to the AI-generated narrative and state changes.
 */
export async function generateNarrative(input: GenerateNarrativeInput): Promise<GenerateNarrativeOutput> {
  return generateNarrativeFlow(input);
}


// == STEP 3: DEFINE THE AI PROMPT ==
const narrativePrompt = ai.definePrompt({
    name: 'narrativePrompt',
    input: { schema: GenerateNarrativeInputSchema },
    output: { schema: GenerateNarrativeOutputSchema },
    prompt: `You are the Game Master for a text-based adventure game called '{{worldName}}'.
Your role is to be a dynamic and creative storyteller. You will receive the player's current status, details about their environment (the current chunk), their most recent action, and the last few narrative lines.

Based on this context, you must generate a compelling narrative that describes the outcome of the player's action.

**Your Goal:**
- Write an engaging, descriptive narrative (2-4 sentences) that brings the world to life.
- Logically determine the consequences of the player's action.
- If the action changes the environment or the player's status, reflect those changes in the 'updatedChunk' and 'updatedPlayerStatus' fields.
- Be creative! If a player explores, maybe they find something unexpected. If they attack, describe the fight.
- Use the provided chunk attributes (dangerLevel, magicAffinity, etc.) to influence the tone and events. A high dangerLevel might mean the action has a negative consequence. High magicAffinity could lead to strange phenomena.

**Context:**
- Player's Action: {{{playerAction}}}
- Player's Status: {{json playerStatus}}
- Current Environment (Chunk): {{json currentChunk}}
- Recent Events: {{json recentNarrative}}

**Task:**
Generate the response in the required JSON format.
ALL TEXT in the response MUST be in the language corresponding to this code: {{language}}.
Do not just repeat the chunk description. Build upon it based on the player's action.
For example, if playerAction is "explore area", don't just say "You explore". Describe what they find or see. "As you search the dense undergrowth, you uncover a moss-covered stone marker with faint, unreadable runes."
If the player attacks an enemy, describe the blow and update the enemy's HP in 'updatedChunk'. Do not describe the enemy's counter-attack; the game engine will handle that separately if the enemy survives.
If the player picks up an item, add it to the player's inventory in 'updatedPlayerStatus' and remove it from the chunk's items in 'updatedChunk'.
`
});


// == STEP 4: DEFINE THE GENKIT FLOW ==
const generateNarrativeFlow = ai.defineFlow(
  {
    name: 'generateNarrativeFlow',
    inputSchema: GenerateNarrativeInputSchema,
    outputSchema: GenerateNarrativeOutputSchema,
  },
  async (input) => {
    const {output} = await narrativePrompt(input);
    return output!;
  }
);
