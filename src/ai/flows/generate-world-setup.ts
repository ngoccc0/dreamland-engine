
'use server';

/**
 * @fileOverview An AI agent for generating multiple, distinct game world concepts from a user's prompt.
 *
 * This file defines the AI workflow for world creation. It is now a two-step parallel process
 * that separates task definition from model execution and includes a fallback mechanism for robustness.
 * 1.  **Task A (Items & Names):** Uses a fallback chain (tries OpenAI, then Gemini) to generate a large catalog of
 *     items and three world names. This task is critical and benefits from the best available model.
 * 2.  **Task B (Narrative Concepts):** Simultaneously generates the narrative details for three concepts using the
 *     default, cost-effective model (Gemini Flash).
 * The results are then combined, with player inventory and starting skills being assigned programmatically.
 *
 * - generateWorldSetup - The main function for the application to use.
 * - GenerateWorldSetupInput - The type definition for the input.
 * - GenerateWorldSetupOutput - The type definition for the final structured output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Terrain, Skill } from '@/lib/game/types';
import { GeneratedItemSchema, SkillSchema, NarrativeConceptArraySchema } from '@/ai/schemas';
import { skillDefinitions } from '@/lib/game/skills';

const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;


// == INPUT SCHEMA ==
const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
  language: z.string().describe("The language for the generated content (e.g., 'en' for English, 'vi' for Vietnamese)."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;


// == INTERMEDIATE & FINAL OUTPUT SCHEMAS ==

// -- Task A Output Schema: Items and Names --
const ItemsAndNamesOutputSchema = z.object({
    customItemCatalog: z.array(GeneratedItemSchema).describe("A shared catalog of 20-30 unique, thematic items invented for this specific game world theme."),
    worldNames: z.array(z.string()).length(3).describe("An array of three distinct and creative world names based on the user's input."),
});


// -- Final Combined Output Schema (for the frontend) --
const WorldConceptSchema = z.object({
  worldName: z.string(),
  initialNarrative: z.string(),
  startingBiome: z.custom<Terrain>(), // Using custom to avoid z.enum with a const
  playerInventory: z.array(z.object({ name: z.string(), quantity: z.number().int().min(1) })),
  initialQuests: z.array(z.string()),
  startingSkill: SkillSchema,
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


// == PROMPT TEMPLATES (TASK DEFINITIONS) ==

// -- Template for Task A: Items & Names --
const itemsAndNamesPromptTemplate = `You are a creative world-building assistant. Based on the user's idea, your task is to generate TWO things:
1.  **A list of three (3) cool and evocative world names.**
2.  **A large, shared catalog of 20 to 30 unique, thematically appropriate items** that could be found in this world.

**User's Idea:** {{{userInput}}}

For each item, define all required fields, including a single, representative emoji. For the 'category' field, you MUST use one of these exact values: 'Weapon', 'Material', 'Energy Source', 'Food', 'Data', 'Tool', 'Equipment', 'Support', 'Magic', 'Fusion'.

Provide the response in the required JSON format. ALL TEXT in the response MUST be in the language corresponding to this code: {{language}}.`;

// -- Template for Task B: Narrative Concepts --
const narrativeConceptsPromptTemplate = `You are a creative Game Master. Based on the user's idea, you need to flesh out three distinct starting concepts for a game.

**User's Idea:** {{{userInput}}}

**Your Task:**
For EACH of the three concepts, create the specific narrative details. You MUST generate an array of exactly three objects. For EACH object, create:
1.  **initialNarrative:** A rich, descriptive opening paragraph for a world based on the user's idea.
2.  **startingBiome:** The biome where the player begins (forest, grassland, desert, swamp, mountain, or cave).
3.  **initialQuests:** One or two simple starting quests.

**DO NOT** create world names, player items, or starting skills. These will be handled by other processes.

Provide the response as a JSON array of three objects. ALL TEXT in the response MUST be in the language corresponding to this code: {{language}}.`;


// == THE GENKIT FLOW (Orchestration with Fallback Logic) ==
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async (input) => {
    
    // --- Step 1: Define two independent AI tasks to run in parallel ---
    
    // Task A: Generate Items and World Names with a fallback mechanism.
    // Tries the most powerful model first (OpenAI), then falls back to a strong alternative (Gemini Pro).
    const itemsAndNamesTask = (async () => {
        const modelsToTry = ['openai/gpt-4-turbo', 'googleai/gemini-1.5-pro'];
        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting item/name generation with model: ${modelName}`);
                const result = await ai.generate({
                    model: modelName,
                    prompt: itemsAndNamesPromptTemplate,
                    input: input,
                    output: { schema: ItemsAndNamesOutputSchema },
                });
                console.log(`Successfully generated items/names with ${modelName}.`);
                return result;
            } catch (error) {
                console.warn(`Model ${modelName} failed for item/name generation. Trying next model.`, error);
            }
        }
        // If all models in the list fail, throw an error.
        throw new Error('All specified models failed for item and name generation.');
    })();
    
    // Task B: Generate Narrative Concepts using the default, cost-effective model.
    const narrativeConceptsTask = ai.generate({
        prompt: narrativeConceptsPromptTemplate,
        input: input,
        output: { schema: NarrativeConceptArraySchema },
    });
    
    // --- Step 2: Run both tasks in parallel and wait for them to complete ---
    const [itemsAndNamesResult, narrativeConceptsResult] = await Promise.all([
        itemsAndNamesTask,
        narrativeConceptsTask,
    ]);
    
    const itemsAndNames = itemsAndNamesResult.output;
    if (!itemsAndNames || !itemsAndNames.customItemCatalog || !itemsAndNames.worldNames) {
        throw new Error("Failed to generate valid items and names from the AI.");
    }
    
    const narrativeConcepts = narrativeConceptsResult.output;
    if (!narrativeConcepts || narrativeConcepts.length !== 3) {
        throw new Error("Failed to generate valid narrative concepts from the AI.");
    }
    
    // --- Step 3: Combine the results and programmatically create inventory & skills ---
    const { customItemCatalog, worldNames } = itemsAndNames;
    const tier1Skills = skillDefinitions.filter(s => s.tier === 1);
    const tier2Skills = skillDefinitions.filter(s => s.tier === 2);
    
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

        // Programmatically select starting skill based on tier
        let selectedSkill: Skill;
        if (Math.random() < 0.7 || tier2Skills.length === 0) {
            // 70% chance for Tier 1, or if no Tier 2 skills exist
            selectedSkill = tier1Skills[Math.floor(Math.random() * tier1Skills.length)];
        } else {
            // 30% chance for Tier 2
            selectedSkill = tier2Skills[Math.floor(Math.random() * tier2Skills.length)];
        }

        return {
            worldName: name,
            initialNarrative: concept.initialNarrative,
            startingBiome: concept.startingBiome,
            playerInventory: playerInventory,
            initialQuests: concept.initialQuests,
            startingSkill: selectedSkill,
        };
    });

    const finalOutput: GenerateWorldSetupOutput = {
        customItemCatalog,
        concepts: finalConcepts as any, // Cast to bypass strict type check for biome
    };

    return finalOutput;
  }
);
