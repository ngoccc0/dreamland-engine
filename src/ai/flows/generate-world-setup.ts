'use server';

/**
 * @fileOverview An AI agent for generating a complete game world setup from a user's prompt.
 *
 * This file defines the entire AI workflow for world creation. It includes:
 * 1. Input/Output Schemas: Strict definitions for what data the AI receives and what it must return.
 * 2. The AI Prompt: The detailed instructions given to the AI model.
 * 3. The Genkit Flow: The wrapper that connects the schemas and the prompt into a callable function.
 *
 * - generateWorldSetup - The main function exported for the application to use.
 * - GenerateWorldSetupInput - The type definition for the input.
 * - GenerateWorldSetupOutput - The type definition for the structured output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// == STEP 1: DEFINE THE INPUT SCHEMA ==
// This schema acts as a contract for the data we send TO the AI.
// It ensures that any call to this flow provides a 'userInput' string.
// The .describe() method gives the AI model context about what this field represents.
const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;


// == STEP 2: DEFINE THE OUTPUT SCHEMA ==
// This is the most critical part for getting reliable, structured data FROM the AI.
// We define the exact shape of the JSON object we want back.
// Genkit uses this schema to instruct the AI model to format its response correctly.
const GenerateWorldSetupOutputSchema = z.object({
  worldName: z.string().describe('A cool and fitting name for this world.'),
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  // z.enum forces the AI to choose from a predefined list of options.
  startingBiome: z.enum(["forest", "grassland", "desert"]).describe('The primary biome for the starting area. Must be one of: forest, grassland, desert.'),
  // z.array(z.string()) tells the AI to return a list of strings.
  playerInventory: z.array(z.string()).describe('A list of 2-3 starting items for the player, fitting the world theme.'),
  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});
export type GenerateWorldSetupOutput = z.infer<typeof GenerateWorldSetupOutputSchema>;


/**
 * This is the primary function that the application's frontend will call.
 * It acts as a clean, simple wrapper around the underlying Genkit flow.
 * @param input The user's idea for a world.
 * @returns A promise that resolves to a structured object containing the generated world details.
 */
export async function generateWorldSetup(input: GenerateWorldSetupInput): Promise<GenerateWorldSetupOutput> {
  return generateWorldSetupFlow(input);
}


// == STEP 3: DEFINE THE AI PROMPT ==
// This is where we instruct the AI on its task.
const worldSetupPrompt = ai.definePrompt({
  name: 'worldSetupPrompt',
  // We connect the schemas defined above to this prompt.
  input: {
    schema: GenerateWorldSetupInputSchema,
  },
  output: {
    schema: GenerateWorldSetupOutputSchema,
  },
  // The prompt text itself. It's a template with placeholders for input.
  prompt: `You are a creative and brilliant Game Master, designing a new text-based adventure game.
A player has provided you with an idea. Your task is to take their input, expand upon it, and create a complete and compelling starting point for their adventure.
If their input is vague or short, be imaginative and fill in the details to create a rich experience.

Player's Idea: {{{userInput}}}

Based on this, generate the following:
1.  **World Name:** A cool, evocative name for the world.
2.  **Initial Narrative:** A rich, descriptive opening paragraph that sets the scene and immerses the player in the world. This will be the very first thing they read.
3.  **Starting Biome:** The biome where the player begins. Choose from the allowed options: forest, grassland, desert.
4.  **Player Inventory:** 2 or 3 thematically appropriate starting items.
5.  **Initial Quests:** One or two simple quests to get the player started.

Provide the response in the required JSON format.
`,
});

// == STEP 4: DEFINE THE GENKIT FLOW ==
// A flow orchestrates AI calls and other logic. In this simple case,
// the flow just calls our prompt and returns the result.
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async input => {
    // 1. Call the AI prompt with the user's input.
    const {output} = await worldSetupPrompt(input);

    // 2. The 'output' is guaranteed by Genkit and the AI model to match
    //    the GenerateWorldSetupOutputSchema. The '!' asserts that it's not null.
    return output!;
  }
);
