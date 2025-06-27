'use server';

/**
 * @fileOverview An AI agent for generating a complete game world setup from a user's prompt.
 *
 * - generateWorldSetup - A function that takes a user's idea and creates a world.
 * - GenerateWorldSetupInput - The input type for the generateWorldSetup function.
 * - GenerateWorldSetupOutput - The return type for the generateWorldSetup function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;

const GenerateWorldSetupOutputSchema = z.object({
  worldName: z.string().describe('A cool and fitting name for this world.'),
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  startingBiome: z.enum(["forest", "grassland", "desert"]).describe('The primary biome for the starting area. Must be one of: forest, grassland, desert.'),
  playerInventory: z.array(z.string()).describe('A list of 2-3 starting items for the player, fitting the world theme.'),
  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});
export type GenerateWorldSetupOutput = z.infer<typeof GenerateWorldSetupOutputSchema>;


export async function generateWorldSetup(input: GenerateWorldSetupInput): Promise<GenerateWorldSetupOutput> {
  return generateWorldSetupFlow(input);
}

const worldSetupPrompt = ai.definePrompt({
  name: 'worldSetupPrompt',
  input: {
    schema: GenerateWorldSetupInputSchema,
  },
  output: {
    schema: GenerateWorldSetupOutputSchema,
  },
  prompt: `You are a creative and brilliant Game Master, designing a new text-based adventure game world.
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

const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async input => {
    const {output} = await worldSetupPrompt(input);
    return output!;
  }
);
