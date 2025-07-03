
'use server';

/**
 * @fileOverview An AI agent for generating game world concepts by distributing tasks across multiple AI models.
 *
 * This file defines a sophisticated, parallelized AI workflow for world creation.
 * It splits the generation process into two distinct, concurrent tasks to leverage the strengths
 * of different AI models, increase speed, and improve reliability with a fallback mechanism.
 *
 * 1.  **Task A (Item Catalog Generation):** The most complex creative task. It uses a fallback chain of the
 *     most powerful available models (OpenAI GPT-4, Gemini 1.5 Pro, Deepseek) to generate a rich,
 *     thematic catalog of in-game items. This ensures the highest quality output for the most critical data.
 *
 * 2.  **Task B (Concepts & Names):** This task runs in parallel to Task A. It uses a fast and cost-effective
 *     model (Gemini Flash) to generate world names and narrative starting points (descriptions, biomes, quests).
 *
 * The results from both tasks are then combined, and player inventory/skills are added programmatically to
 * create the final, ready-to-play world concepts.
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

// -- Task A Output: The most complex part, just the items. --
const ItemCatalogOutputSchema = z.object({
    customItemCatalog: z.array(GeneratedItemSchema).min(5).max(10).describe("A shared catalog of 5-10 unique, thematic items invented for this specific game world theme."),
});

// -- Task B Output: Names and narrative concepts combined. --
const ConceptsAndNamesOutputSchema = z.object({
    worldNames: z.array(z.string()).length(3).describe("An array of three distinct and creative world names based on the user's input."),
    narrativeConcepts: NarrativeConceptArraySchema.describe("An array of three distinct narrative starting points, including descriptions, biomes, and quests."),
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

// -- Template for Task A: Item Catalog Generation --
const itemCatalogPromptTemplate = `You are a creative world-building assistant specializing in game item design. ALL TEXT in your response MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

Based on the user's idea, your task is to generate **a small, initial catalog of EXACTLY 5 to 10 unique, thematically appropriate items** that could be found in this world.

**User's Idea:** {{{userInput}}}

**Rules:**
1.  The "customItemCatalog" array in your JSON output MUST contain between 5 and 10 items. This is a strict rule.
2.  For each item, you MUST define all required fields: name, description, emoji, category, tier, effects, baseQuantity, and spawnBiomes. You may optionally define growthConditions.
3.  For the 'category' field, use one of these exact values: 'Weapon', 'Material', 'Energy Source', 'Food', 'Data', 'Tool', 'Equipment', 'Support', 'Magic', 'Fusion'.
4. For 'Food' category items, please also provide a 'subCategory' field, such as 'Meat', 'Fruit', or 'Vegetable'.
5.  The theme of the items should strongly reflect the user's input.`;

// -- Template for Task B: Narrative Concepts & World Names --
const conceptsAndNamesPromptTemplate = `You are a creative Game Master. ALL TEXT in your response (world names, initial narrative, etc.) MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a non-negotiable, strict requirement.

Based on the user's idea, you need to generate TWO things:
1.  **Three (3) distinct and creative world names.**
2.  **Three (3) distinct starting concepts for a game.**

**User's Idea:** {{{userInput}}}

For EACH of the three concepts, create the specific narrative details:
1.  **initialNarrative:** A rich, descriptive opening paragraph.
2.  **startingBiome:** The biome where the player begins (forest, grassland, desert, swamp, mountain, or cave).
3.  **initialQuests:** One or two simple starting quests.

**Critical Rules:**
- **DO NOT** create player items, an item catalog, or starting skills. These will be handled by other processes.

Provide the response as a single JSON object containing both the 'worldNames' array and the 'narrativeConcepts' array.`;


// == THE GENKIT FLOW (Orchestration with Parallel Tasks and Fallback Logic) ==
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async (input) => {
    
    // --- Step 1: Define two independent AI tasks to run in parallel ---
    
    // Task A: Generate the item catalog. This is complex, so we use a fallback chain of powerful models.
    const itemCatalogTask = (async () => {
        const modelsToTry = ['openai/gpt-4-turbo', 'googleai/gemini-1.5-pro', 'deepseek/deepseek-chat', 'googleai/gemini-2.0-flash'];
        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting item catalog generation with model: ${modelName}`);
                const result = await ai.generate({
                    model: modelName,
                    prompt: itemCatalogPromptTemplate,
                    input: input,
                    output: { schema: ItemCatalogOutputSchema },
                });
                console.log(`Successfully generated item catalog with ${modelName}.`);
                return result;
            } catch (error) {
                console.warn(`Model ${modelName} failed for item catalog generation. Trying next model.`, error);
            }
        }
        throw new Error('All models failed for item catalog generation.');
    })();
    
    // Task B: Generate narrative concepts and world names. Use a fast, cost-effective model.
    const conceptsAndNamesTask = ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: conceptsAndNamesPromptTemplate,
        input: input,
        output: { schema: ConceptsAndNamesOutputSchema },
    });
    
    // --- Step 2: Run both tasks in parallel and wait for them to complete ---
    const [itemCatalogResult, conceptsAndNamesResult] = await Promise.all([
        itemCatalogTask,
        conceptsAndNamesTask,
    ]);
    
    const customItemCatalog = itemCatalogResult.output?.customItemCatalog;
    if (!customItemCatalog || customItemCatalog.length === 0) {
        throw new Error("Failed to generate a valid item catalog from the AI.");
    }
    
    const conceptsAndNames = conceptsAndNamesResult.output;
    if (!conceptsAndNames || !conceptsAndNames.worldNames || !conceptsAndNames.narrativeConcepts || conceptsAndNames.narrativeConcepts.length !== 3) {
        throw new Error("Failed to generate valid concepts and names from the AI.");
    }
    
    // --- Step 3: Combine the results and programmatically create inventory & skills ---
    const { worldNames, narrativeConcepts } = conceptsAndNames;
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

    
