'use server';

/**
 * @fileOverview An AI agent for generating multiple, distinct game world concepts from a user's prompt.
 *
 * This file defines the AI workflow for world creation. It is now a two-step parallel process
 * to improve quality, allow for a larger number of generated items, and reduce wait times.
 * 1. Task A (Gemini): Generate a large catalog of items and three world names.
 * 2. Task B (OpenAI): Simultaneously generate the narrative details for three concepts.
 * The results are then combined, with player inventory being assigned programmatically.
 *
 * - generateWorldSetup - The main function for the application to use.
 * - GenerateWorldSetupInput - The type definition for the input.
 * - GenerateWorldSetupOutput - The type definition for the final structured output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Terrain } from '@/lib/game/types';
import Handlebars from 'handlebars';
import { ItemCategorySchema } from '@/ai/schemas';

const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave"];
const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;


// == INPUT SCHEMA ==
const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
  language: z.string().describe("The language for the generated content (e.g., 'en' for English, 'vi' for Vietnamese)."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;


// == INTERMEDIATE & FINAL OUTPUT SCHEMAS ==

// -- Item Schemas --
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
    category: ItemCategorySchema,
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

// -- Task A Output Schema: Items and Names --
const ItemsAndNamesOutputSchema = z.object({
    customItemCatalog: z.array(GeneratedItemSchema).min(20).max(30).describe("A shared catalog of 20-30 unique, thematic items invented for this specific game world theme."),
    worldNames: z.array(z.string()).length(3).describe("An array of three distinct and creative world names based on the user's input."),
});

// -- Task B Output Schema: Narrative Concepts --
const NarrativeConceptSchema = z.object({
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  startingBiome: z.enum(allTerrains).describe('The primary biome for the starting area.'),
  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});
const NarrativeConceptArraySchema = z.array(NarrativeConceptSchema).length(3);


// -- Final Combined Output Schema (for the frontend) --
const WorldConceptSchema = z.object({
  worldName: z.string(),
  initialNarrative: z.string(),
  startingBiome: z.enum(allTerrains),
  playerInventory: z.array(z.object({ name: z.string(), quantity: z.number().int().min(1) })),
  initialQuests: z.array(z.string()),
});
const GenerateWorldSetupOutputSchema = z.object({
    customItemCatalog: z.array(GeneratedItemSchema),
    concepts: z.array(WorldConceptSchema).length(3),
});
export type GenerateWorldSetupOutput = z.infer<typeof GenerateWorldSetupOutputSchema>;


/**
 * This is the primary function that the application's frontend will call.
 */
export async function generateWorldSetup(input: GenerateWorldSetupInput): Promise<GenerateWorldSetupOutput> {
  return generateWorldSetupFlow(input);
}


// == PROMPTS ==

// -- Prompt for Task A: Items & Names --
const itemsAndNamesPrompt = ai.definePrompt({
    name: 'generateItemsAndNamesPrompt',
    input: { schema: GenerateWorldSetupInputSchema },
    output: { schema: ItemsAndNamesOutputSchema },
    prompt: `You are a creative world-building assistant. Based on the user's idea, your task is to generate TWO things:
1.  **A list of three (3) cool and evocative world names.**
2.  **A large, shared catalog of 20 to 30 unique, thematically appropriate items** that could be found in this world.

**User's Idea:** {{{userInput}}}

For each item, define all required fields. For the 'category' field, you MUST use one of these exact values: 'Weapon', 'Tool', 'Consumable', 'Material', 'QuestItem', 'Misc'.

Provide the response in the required JSON format. ALL TEXT in the response MUST be in the language corresponding to this code: {{language}}.`,
});

// -- Prompt for Task B: Narrative Concepts --
const narrativeConceptsPrompt = ai.definePrompt({
    name: 'generateNarrativeConceptsPrompt',
    input: { schema: GenerateWorldSetupInputSchema },
    output: { schema: NarrativeConceptArraySchema },
    prompt: `You are a creative Game Master. Based on the user's idea, you need to flesh out three distinct starting concepts for a game.

**User's Idea:** {{{userInput}}}

**Your Task:**
For EACH of the three concepts, create the specific narrative details. You MUST generate an array of exactly three objects. For EACH object, create:
1.  **initialNarrative:** A rich, descriptive opening paragraph for a world based on the user's idea.
2.  **startingBiome:** The biome where the player begins (forest, grassland, desert, swamp, mountain, or cave).
3.  **initialQuests:** One or two simple starting quests.

**DO NOT** create world names or player items. This will be handled by another process.

Provide the response as a JSON array of three objects. ALL TEXT in the response MUST be in the language corresponding to this code: {{language}}.`,
});


// == THE GENKIT FLOW (Parallel orchestration) ==
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async (input) => {
    // --- Step 1: Compile prompts ---
    const itemsAndNamesTemplate = Handlebars.compile(itemsAndNamesPrompt.prompt as string);
    const itemsAndNamesFinalPrompt = itemsAndNamesTemplate(input);

    const narrativeConceptsTemplate = Handlebars.compile(narrativeConceptsPrompt.prompt as string);
    const narrativeConceptsFinalPrompt = narrativeConceptsTemplate(input);

    // --- Step 2: Define two independent AI tasks to run in parallel ---
    
    // Task A: Generate Items and World Names (using Gemini)
    const itemsAndNamesTask = ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: itemsAndNamesFinalPrompt,
        output: { schema: ItemsAndNamesOutputSchema },
    });
    
    // Task B: Generate Narrative Concepts (using OpenAI)
    const narrativeConceptsTask = ai.generate({
        model: 'genkitx-openai/gpt-3.5-turbo',
        prompt: narrativeConceptsFinalPrompt,
        output: { schema: NarrativeConceptArraySchema },
    });
    
    // --- Step 3: Run both tasks in parallel and wait for them to complete ---
    const [itemsAndNamesResult, narrativeConceptsResult] = await Promise.all([
        itemsAndNamesTask,
        narrativeConceptsTask,
    ]);
    
    const itemsAndNames = itemsAndNamesResult.output;
    if (!itemsAndNames || !itemsAndNames.customItemCatalog || !itemsAndNames.worldNames) {
        throw new Error("Failed to generate valid items and names.");
    }
    
    const narrativeConcepts = narrativeConceptsResult.output;
    if (!narrativeConcepts || narrativeConcepts.length !== 3) {
        throw new Error("Failed to generate valid narrative concepts.");
    }
    
    // --- Step 4: Combine the results and programmatically create inventory ---
    const { customItemCatalog, worldNames } = itemsAndNames;
    
    const finalConcepts = worldNames.map((name, index) => {
        const concept = narrativeConcepts[index];
        
        // Programmatically select starting inventory
        const lowTierItems = customItemCatalog.filter(item => item.tier <= 2);
        const shuffledItems = [...lowTierItems].sort(() => 0.5 - Math.random());
        const numItemsToTake = getRandomInRange({ min: 2, max: 3 });
        const startingItems = shuffledItems.slice(0, numItemsToTake);
        
        const playerInventory = startingItems.map(item => ({
            name: item.name,
            quantity: getRandomInRange(item.baseQuantity)
        }));

        return {
            worldName: name,
            initialNarrative: concept.initialNarrative,
            startingBiome: concept.startingBiome,
            playerInventory: playerInventory,
            initialQuests: concept.initialQuests,
        };
    });

    const finalOutput: GenerateWorldSetupOutput = {
        customItemCatalog,
        concepts: finalConcepts,
    };

    return finalOutput;
  }
);
