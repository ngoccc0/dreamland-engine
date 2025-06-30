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
 * - GenerateWorldSetupOutput - The type definition for the structured output (a shared item catalog and 3 concepts).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Terrain } from '@/lib/game/types';
import Handlebars from 'handlebars';

const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave"];

// == STEP 1: DEFINE THE INPUT SCHEMA ==
const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
  language: z.string().describe("The language for the generated content (e.g., 'en' for English, 'vi' for Vietnamese)."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;


// == STEP 2: DEFINE THE OUTPUT SCHEMA(S) ==
// Schemas for resource growth conditions
const ConditionRangeSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional()
});

const SpawnConditionsSchema = z.object({
  chance: z.number().optional(),
  vegetationDensity: ConditionRangeSchema.optional(),
  moisture: ConditionRangeSchema.optional(),
  elevation: ConditionRangeSchema.optional(),
  dangerLevel: ConditionRangeSchema.optional(),
  magicAffinity: ConditionRangeSchema.optional(),
  humanPresence: ConditionRangeSchema.optional(),
  predatorPresence: ConditionRangeSchema.optional(),
  lightLevel: ConditionRangeSchema.optional(),
  temperature: ConditionRangeSchema.optional(),
  soilType: z.array(z.string()).optional(),
}).describe("A set of environmental conditions.");


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
    growthConditions: z.object({
      optimal: SpawnConditionsSchema.describe("The ideal conditions for the resource to thrive and reproduce."),
      subOptimal: SpawnConditionsSchema.describe("Conditions where the resource can survive and reproduce slowly."),
    }).optional().describe("For living resources like plants or fungi, define the conditions under which they grow. If not provided, the item will be static."),
});

// Schema for a single world concept. Note it does NOT contain the item catalog.
const WorldConceptSchema = z.object({
  worldName: z.string().describe('A cool and fitting name for this world.'),
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  startingBiome: z.enum(allTerrains).describe('The primary biome for the starting area.'),
  
  // The player's starting inventory, which should be a subset of the shared catalog.
  playerInventory: z.array(z.object({
    name: z.string().describe("The name of the item, which MUST match an item from the shared customItemCatalog."),
    quantity: z.number().int().min(1),
  })).min(2).max(3).describe('A list of 2-3 starting items for the player, chosen from the shared customItemCatalog you generated.'),

  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});

// The final output schema. It contains ONE shared catalog and THREE concepts.
const GenerateWorldSetupOutputSchema = z.object({
    customItemCatalog: z.array(GeneratedItemSchema).min(10).max(15).describe("A shared catalog of 10-15 unique, thematic items invented for this specific game world theme. These items will be used by all concepts."),
    concepts: z.array(WorldConceptSchema).length(3).describe("An array of three distinct and creative world concepts based on the user's input and the shared item catalog."),
});
export type GenerateWorldSetupOutput = z.infer<typeof GenerateWorldSetupOutputSchema>;


/**
 * This is the primary function that the application's frontend will call.
 * It wraps the Genkit flow for easier use.
 * @param input The user's idea for a world and the desired language.
 * @returns A promise that resolves to the structured world generation data.
 */
export async function generateWorldSetup(input: GenerateWorldSetupInput): Promise<GenerateWorldSetupOutput> {
  return generateWorldSetupFlow(input);
}


// == STEP 3: DEFINE THE AI PROMPT TEMPLATE ==
const worldSetupPromptTemplate = `You are a creative and brilliant Game Master, designing a new text-based adventure game.
A player has provided you with an idea. Your task is to generate a rich set of options for them.

Player's Idea: {{{userInput}}}

**Your task is a two-step process:**

**Step 1: Create a Shared Item Catalog**
First, you must INVENT a single, shared catalog of 10 to 15 unique, thematically appropriate items that will be found throughout this world. This catalog will be the foundation for all concepts. For each item in the catalog, you must define:
*   **name**: A creative and unique name.
*   **description**: A one-sentence flavorful description.
*   **tier**: A tier from 1 (common) to 6 (legendary).
*   **effects**: An array of one or more effects, like healing HP or restoring stamina. This can be an empty array \`[]\` for items that are not consumable. Example: \`[{ "type": "HEAL", "amount": 25 }]\`.
*   **baseQuantity**: The typical quantity range this item is found in (e.g., min 1, max 3).
*   **spawnBiomes**: An array of one or more biome names where this item can be found (e.g., ["forest", "swamp"]).
*   **growthConditions (Optional)**: For living resources like plants or fungi, you can define how they reproduce over time. Define 'optimal' and 'subOptimal' conditions using environmental factors like moisture, temperature, and lightLevel. Items in optimal conditions will spread quickly, while those in unsuitable conditions may decay. If you don't provide this, the item will be static and will not reproduce.

**Step 2: Create Three Distinct World Concepts**
After creating the shared item catalog, create THREE DISTINCT AND VARIED concepts for a compelling game world. Each concept should be a unique take on the user's idea. For EACH of the three concepts, you must generate:
1.  **World Name:** A cool, evocative name for the world.
2.  **Initial Narrative:** A rich, descriptive opening paragraph.
3.  **Starting Biome:** The biome where the player begins (forest, grassland, desert, swamp, mountain, or cave).
4.  **Player Inventory:** Select 2-3 items FROM THE SHARED CATALOG you just created to give to the player as their starting equipment. You only need to provide the item's name and a starting quantity.
5.  **Initial Quests:** One or two simple starting quests.

Provide the response in the required JSON format. ALL TEXT in the response (worldName, initialNarrative, item names, item descriptions, initialQuests) MUST be in the language corresponding to this code: {{language}}.
`;


// == STEP 4: DEFINE THE GENKIT FLOW (with parallel execution) ==
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async input => {
    // 1. Compile the Handlebars template
    const template = Handlebars.compile(worldSetupPromptTemplate);
    const finalPrompt = template(input);
    
    // 2. Create two promises, one for each AI model provider
    const geminiPromise = ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: finalPrompt,
        output: { schema: GenerateWorldSetupOutputSchema },
    });
    
    const openaiPromise = ai.generate({
        model: 'genkitx-openai/gpt-3.5-turbo',
        prompt: finalPrompt,
        output: { schema: GenerateWorldSetupOutputSchema },
    });

    // 3. Race the two promises and take the result from whichever finishes first.
    // Promise.any() waits for the first promise to fulfill.
    const firstResult = await Promise.any([geminiPromise, openaiPromise]);
    
    // 4. Return the output from the winning promise.
    return firstResult.output!;
  }
);
