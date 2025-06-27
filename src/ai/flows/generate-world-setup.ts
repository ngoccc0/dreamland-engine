'use server';

/**
 * @fileOverview An AI agent for generating multiple, distinct game world concepts from a user's prompt.
 *
 * This file defines the AI workflow for world creation. It includes:
 * 1. Schemas: Strict definitions for what the AI receives and returns.
 * 2. The AI Prompt: Detailed instructions for the AI model.
 * 3. The Genkit Flow: The wrapper that connects the schemas and prompt into a callable function.
 *
 * - generateWorldSetup - The main function for the application to use.
 * - GenerateWorldSetupInput - The type definition for the input.
 * - GenerateWorldSetupOutput - The type definition for the structured output (an array of 3 concepts).
 * - WorldConcept - The type definition for a single world concept.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// == STEP 1: DEFINE THE INPUT SCHEMA ==
const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;


// == STEP 2: DEFINE THE OUTPUT SCHEMA(S) ==
// We first define the schema for a single, complete world idea.
const WorldConceptSchema = z.object({
  worldName: z.string().describe('A cool and fitting name for this world.'),
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  startingBiome: z.enum(["forest", "grassland", "desert"]).describe('The primary biome for the starting area. Must be one of: forest, grassland, desert.'),
  playerInventory: z.array(z.string()).describe('A list of 2-3 starting items for the player, fitting the world theme.'),
  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});
export type WorldConcept = z.infer<typeof WorldConceptSchema>;

// Now, we define the final output schema. We instruct the AI to return an object
// containing an array of exactly THREE distinct world concepts.
const GenerateWorldSetupOutputSchema = z.object({
    concepts: z.array(WorldConceptSchema).length(3).describe("An array of three distinct and creative world concepts based on the user's input."),
});
export type GenerateWorldSetupOutput = z.infer<typeof GenerateWorldSetupOutputSchema>;


/**
 * This is the primary function that the application's frontend will call.
 * @param input The user's idea for a world.
 * @returns A promise that resolves to an object containing three generated world concepts.
 */
export async function generateWorldSetup(input: GenerateWorldSetupInput): Promise<GenerateWorldSetupOutput> {
  return generateWorldSetupFlow(input);
}


// == STEP 3: DEFINE THE AI PROMPT ==
// This prompt is updated to explicitly ask for THREE different variations.
const worldSetupPrompt = ai.definePrompt({
  name: 'worldSetupPrompt',
  input: {
    schema: GenerateWorldSetupInputSchema,
  },
  output: {
    schema: GenerateWorldSetupOutputSchema,
  },
  prompt: `You are a creative and brilliant Game Master, designing a new text-based adventure game.
A player has provided you with an idea. Your task is to take their input, expand upon it, and generate THREE DISTINCT AND VARIED concepts for a compelling starting point. Each concept should be a unique take on the user's idea.

If their input is vague or short, be highly imaginative and create three very different interpretations.

Player's Idea: {{{userInput}}}

For EACH of the three concepts, generate the following:
1.  **World Name:** A cool, evocative name for the world.
2.  **Initial Narrative:** A rich, descriptive opening paragraph.
3.  **Starting Biome:** The biome where the player begins (forest, grassland, or desert).
4.  **Player Inventory:** 2 or 3 thematically appropriate starting items.
5.  **Initial Quests:** One or two simple starting quests.

Provide the response in the required JSON format, as an object with a 'concepts' array containing the three generated world concepts.
`,
});

// == STEP 4: DEFINE THE GENKIT FLOW ==
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async input => {
    // 1. Call the AI prompt with the user's input.
    const {output} = await worldSetupPrompt(input);

    // 2. The 'output' is guaranteed to match the GenerateWorldSetupOutputSchema.
    return output!;
  }
);
