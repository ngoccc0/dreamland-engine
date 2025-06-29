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
// This defines the "contract" for calling our AI.
// It requires a 'userInput' string and a 'language' string (e.g., 'en', 'vi').
const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
  language: z.string().describe("The language for the generated content (e.g., 'en' for English, 'vi' for Vietnamese)."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;


// == STEP 2: DEFINE THE OUTPUT SCHEMA(S) ==
// We first define the schema for a single, complete world idea.
// This forces the AI to structure its response, making it reliable.
const WorldConceptSchema = z.object({
  worldName: z.string().describe('A cool and fitting name for this world.'),
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  startingBiome: z.enum(["forest", "grassland", "desert", "swamp", "mountain", "cave"]).describe('The primary biome for the starting area. Must be one of: forest, grassland, desert, swamp, mountain, cave.'),
  playerInventory: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    tier: z.number().int().min(1).max(6).describe("The tier of the item, from 1 (common) to 6 (legendary)."),
  })).describe('A list of 2-3 starting items for the player, fitting the world theme, each with a name, quantity, and tier.'),
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
 * It wraps the Genkit flow for easier use.
 * @param input The user's idea for a world and the desired language.
 * @returns A promise that resolves to an object containing three generated world concepts.
 */
export async function generateWorldSetup(input: GenerateWorldSetupInput): Promise<GenerateWorldSetupOutput> {
  return generateWorldSetupFlow(input);
}


// == STEP 3: DEFINE THE AI PROMPT ==
// This is the "brain" of our operation. It's a detailed set of instructions for the AI.
const worldSetupPrompt = ai.definePrompt({
  name: 'worldSetupPrompt',
  input: {
    schema: GenerateWorldSetupInputSchema,
  },
  output: {
    // By providing the output schema, we enable Genkit's structured output feature.
    // The AI will be instructed to respond with a JSON object matching this schema.
    schema: GenerateWorldSetupOutputSchema,
  },
  prompt: `You are a creative and brilliant Game Master, designing a new text-based adventure game.
A player has provided you with an idea. Your task is to take their input, expand upon it, and generate THREE DISTINCT AND VARIED concepts for a compelling starting point. Each concept should be a unique take on the user's idea.

If their input is vague or short, be highly imaginative and create three very different interpretations.

Player's Idea: {{{userInput}}}

For EACH of the three concepts, generate the following:
1.  **World Name:** A cool, evocative name for the world.
2.  **Initial Narrative:** A rich, descriptive opening paragraph.
3.  **Starting Biome:** The biome where the player begins (forest, grassland, desert, swamp, mountain, or cave).
4.  **Player Inventory:** 2 or 3 thematically appropriate starting items, each with a name, a reasonable quantity, and a tier (e.g., { "name": "Health Potion", "quantity": 3, "tier": 1 }). The tier should be between 1 (common) and 6 (legendary), reflecting the item's rarity and power.
5.  **Initial Quests:** One or two simple starting quests.

Provide the response in the required JSON format, as an object with a 'concepts' array containing the three generated world concepts.
ALL TEXT in the response (worldName, initialNarrative, playerInventory, initialQuests) MUST be in the language corresponding to this code: {{language}}.
`,
});

// == STEP 4: DEFINE THE GENKIT FLOW ==
// A flow is a sequence of steps that can be run by Genkit.
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async input => {
    // 1. Call the AI prompt with the user's input and language preference.
    const {output} = await worldSetupPrompt(input);

    // 2. The 'output' is guaranteed by Genkit to match the GenerateWorldSetupOutputSchema.
    // The '!' tells TypeScript we are confident the output will not be null.
    return output!;
  }
);
