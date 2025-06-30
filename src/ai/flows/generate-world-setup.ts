'use server';

/**
 * @fileOverview An AI agent for generating multiple, distinct game world concepts from a user's prompt.
 *
 * This file defines the AI workflow for world creation. It is now a two-step process
 * to improve quality and allow for a larger number of generated items.
 * 1. Generate a large catalog of items and three world names.
 * 2. Generate the narrative details for three concepts based on the items and names.
 *
 * - generateWorldSetup - The main function for the application to use.
 * - GenerateWorldSetupInput - The type definition for the input.
 * - GenerateWorldSetupOutput - The type definition for the final structured output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Terrain } from '@/lib/game/types';
import Handlebars from 'handlebars';

const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave"];

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

// -- Step 1 Output Schema: Items and Names --
const ItemsAndNamesOutputSchema = z.object({
    customItemCatalog: z.array(GeneratedItemSchema).min(20).max(30).describe("A shared catalog of 20-30 unique, thematic items invented for this specific game world theme."),
    worldNames: z.array(z.string()).length(3).describe("An array of three distinct and creative world names based on the user's input."),
});

// -- Step 2 Output Schema: Concept Details --
const ConceptDetailsSchema = z.object({
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  startingBiome: z.enum(allTerrains).describe('The primary biome for the starting area.'),
  playerInventory: z.array(z.object({
    name: z.string().describe("The name of the item, which MUST match an item from the provided customItemCatalog."),
    quantity: z.number().int().min(1),
  })).min(2).max(3).describe('A list of 2-3 starting items for the player, chosen from the provided customItemCatalog.'),
  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});
const ConceptDetailsArraySchema = z.array(ConceptDetailsSchema).length(3);

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

// -- Prompt for Step 1: Items & Names --
const itemsAndNamesPrompt = ai.definePrompt({
    name: 'generateItemsAndNamesPrompt',
    input: { schema: GenerateWorldSetupInputSchema },
    output: { schema: ItemsAndNamesOutputSchema },
    prompt: `You are a creative world-building assistant. Based on the user's idea, your task is to generate TWO things:
1.  **A list of three (3) cool and evocative world names.**
2.  **A large, shared catalog of 20 to 30 unique, thematically appropriate items** that could be found in this world.

**User's Idea:** {{{userInput}}}

For each item, define all required fields: name, description, tier, effects, baseQuantity, spawnBiomes, and optional growthConditions.

Provide the response in the required JSON format. ALL TEXT in the response MUST be in the language corresponding to this code: {{language}}.`,
});

// -- Prompt for Step 2: Concept Details --
const conceptDetailsPrompt = ai.definePrompt({
    name: 'generateConceptDetailsPrompt',
    input: { schema: z.object({
        userInput: z.string(),
        language: z.string(),
        worldNames: z.array(z.string()),
        customItemCatalog: z.array(GeneratedItemSchema),
    })},
    output: { schema: ConceptDetailsArraySchema },
    prompt: `You are a creative Game Master. A world concept has been started, and now you need to flesh it out.
You have been given a user's idea, three world names, and a specific catalog of items.

**User's Idea:** {{{userInput}}}

**Provided World Names:**
{{#each worldNames}}
- {{{this}}}
{{/each}}

**Provided Item Catalog (for reference and for player inventory):**
{{json customItemCatalog}}

**Your Task:**
For EACH of the three world names provided, create the specific narrative details. You MUST generate an array of exactly three objects. For EACH object, create:
1.  **initialNarrative:** A rich, descriptive opening paragraph for that world.
2.  **startingBiome:** The biome where the player begins (forest, grassland, desert, swamp, mountain, or cave).
3.  **playerInventory:** Select 2-3 items *FROM THE PROVIDED ITEM CATALOG* to give to the player.
4.  **initialQuests:** One or two simple starting quests.

Provide the response as a JSON array of three objects. ALL TEXT in the response MUST be in the language corresponding to this code: {{language}}.`,
});


// == THE GENKIT FLOW (Sequential orchestration) ==
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async (input) => {
    // --- Step 1: Generate Items and World Names ---
    const itemsAndNamesTemplate = Handlebars.compile(itemsAndNamesPrompt.prompt as string);
    const itemsAndNamesFinalPrompt = itemsAndNamesTemplate(input);

    const itemsAndNamesResult = await Promise.any([
        ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: itemsAndNamesFinalPrompt,
            output: { schema: ItemsAndNamesOutputSchema },
        }),
        ai.generate({
            model: 'genkitx-openai/gpt-3.5-turbo',
            prompt: itemsAndNamesFinalPrompt,
            output: { schema: ItemsAndNamesOutputSchema },
        }),
    ]);

    const itemsAndNames = itemsAndNamesResult.output;
    if (!itemsAndNames) {
        throw new Error("Failed to generate items and names in the first step.");
    }
    
    // --- Step 2: Generate Narrative Details using results from Step 1 ---
    const conceptDetailsInput = {
        ...input,
        worldNames: itemsAndNames.worldNames,
        customItemCatalog: itemsAndNames.customItemCatalog,
    };
    const conceptDetailsTemplate = Handlebars.compile(conceptDetailsPrompt.prompt as string);
    const conceptDetailsFinalPrompt = conceptDetailsTemplate(conceptDetailsInput);

    const conceptDetailsResult = await Promise.any([
       ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: conceptDetailsFinalPrompt,
            output: { schema: ConceptDetailsArraySchema },
        }),
        ai.generate({
            model: 'genkitx-openai/gpt-3.5-turbo',
            prompt: conceptDetailsFinalPrompt,
            output: { schema: ConceptDetailsArraySchema },
        }),
    ]);
    
    const conceptDetails = conceptDetailsResult.output;
    if (!conceptDetails) {
        throw new Error("Failed to generate concept details in the second step.");
    }

    // --- Step 3: Combine the results into the final output structure ---
    const finalOutput: GenerateWorldSetupOutput = {
        customItemCatalog: itemsAndNames.customItemCatalog,
        concepts: itemsAndNames.worldNames.map((name, index) => {
            const details = conceptDetails[index];
            if (!details) {
                throw new Error(`Mismatch in concept details length. Expected 3, got ${conceptDetails.length}`);
            }
            return {
                worldName: name,
                initialNarrative: details.initialNarrative,
                startingBiome: details.startingBiome,
                playerInventory: details.playerInventory,
                initialQuests: details.initialQuests,
            };
        }),
    };

    return finalOutput;
  }
);
