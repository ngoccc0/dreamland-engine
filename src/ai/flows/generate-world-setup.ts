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
import type { Terrain } from '@/lib/game/types';

const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave"];

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

const GeneratedItemSchema = z.object({
    name: z.string().describe("A unique and thematic name for the item."),
    description: z.string().describe("A flavorful, one-sentence description of the item."),
    tier: z.number().int().min(1).max(6).describe("The tier of the item, from 1 (common) to 6 (legendary)."),
    effects: z.array(z.object({
        type: z.enum(['HEAL', 'RESTORE_STAMINA']).describe("The type of effect the item has."),
        amount: z.number().describe("The numerical power of the effect (e.g., the amount of HP to heal).")
    })).describe("An array of effects the item provides. Can be empty for non-consumable items."),
    baseQuantity: z.object({
        min: z.number().int().min(1),
        max: z.number().int().min(1)
    }).describe("The typical quantity range this item is found in."),
    spawnBiomes: z.array(z.enum(allTerrains)).min(1).describe("An array of one or more biomes where this item can naturally be found."),
});

const WorldConceptSchema = z.object({
  worldName: z.string().describe('A cool and fitting name for this world.'),
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  startingBiome: z.enum(allTerrains).describe('The primary biome for the starting area.'),
  
  // The full catalog of unique items for this world.
  customItemCatalog: z.array(GeneratedItemSchema).min(5).max(7).describe("A catalog of 5-7 unique, thematic items invented for this specific world. These items will be found by the player as they explore."),
  
  // The player's starting inventory, which should be a subset of the catalog.
  playerInventory: z.array(z.object({
    name: z.string().describe("The name of the item, which MUST match an item from the customItemCatalog."),
    quantity: z.number().int().min(1),
  })).min(2).max(3).describe('A list of 2-3 starting items for the player, chosen from the customItemCatalog you just generated.'),

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
A player has provided you with an idea. Your task is to take their input, expand upon it, and generate THREE DISTINCT AND VARIED concepts for a compelling game world. Each concept should be a unique take on the user's idea.

If their input is vague or short, be highly imaginative and create three very different interpretations.

Player's Idea: {{{userInput}}}

For EACH of the three concepts, you must generate the following:
1.  **World Name:** A cool, evocative name for the world.
2.  **Initial Narrative:** A rich, descriptive opening paragraph.
3.  **Starting Biome:** The biome where the player begins (forest, grassland, desert, swamp, mountain, or cave).
4.  **Custom Item Catalog:** This is the most important step. You must INVENT a catalog of 5 to 7 unique, thematically appropriate items that will be found throughout this world. For each item in the catalog, you must define:
    *   **name**: A creative and unique name.
    *   **description**: A one-sentence flavorful description.
    *   **tier**: A tier from 1 (common) to 6 (legendary).
    *   **effects**: An array of one or more effects, like healing HP or restoring stamina. This can be an empty array \`[]\` for items that are not consumable. Example: \`[{ "type": "HEAL", "amount": 25 }]\`.
    *   **baseQuantity**: The typical quantity range this item is found in (e.g., min 1, max 3).
    *   **spawnBiomes**: An array of one or more biome names where this item can be found (e.g., ["forest", "swamp"]).
5.  **Player Inventory:** After creating the item catalog, select 2-3 items from that catalog to give to the player as their starting equipment. You only need to provide the item's name and a starting quantity.
6.  **Initial Quests:** One or two simple starting quests.

Provide the response in the required JSON format, as an object with a 'concepts' array containing the three generated world concepts.
ALL TEXT in the response (worldName, initialNarrative, item names, item descriptions, initialQuests) MUST be in the language corresponding to this code: {{language}}.
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
