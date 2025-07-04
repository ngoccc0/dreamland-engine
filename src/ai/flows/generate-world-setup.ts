
'use server';

/**
 * @fileOverview An AI agent for generating game world concepts by distributing tasks across multiple AI models.
 *
 * This file defines a sophisticated, parallelized AI workflow for world creation.
 * It splits the generation process into three distinct, concurrent tasks to leverage the strengths
 * of different AI models, increase speed, and improve reliability with a fallback mechanism.
 *
 * 1.  **Task A (Item Catalog Generation):** Uses powerful models to generate a rich, thematic
 *     catalog of in-game items (name, description, category). Code then assigns a logical emoji.
 *
 * 2.  **Task B (World Name Generation):** Runs in parallel. Uses a fast model (Gemini Flash) to quickly brainstorm creative world names.
 *
 * 3.  **Task C (Narrative Concept Generation):** Runs in parallel. Uses another distinct model (Deepseek) to generate
 *     the starting points for the story (descriptions, quests), adding stylistic variety.
 *
 * The results from all three tasks are then combined, and player inventory/skills are added programmatically to
 * create the final, ready-to-play world concepts.
 *
 * - generateWorldSetup - The main function for the application to use.
 * - GenerateWorldSetupInput - The type definition for the input.
 * - GenerateWorldSetupOutput - The type definition for the final structured output.
 */

import Handlebars from 'handlebars';
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Terrain, Skill } from '@/lib/game/types';
import { GeneratedItemSchema, SkillSchema, NarrativeConceptArraySchema, ItemCategorySchema } from '@/ai/schemas';
import { skillDefinitions } from '@/lib/game/skills';
import { getEmojiForItem } from '@/lib/utils';

const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;


// == INPUT SCHEMA ==
const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;


// == INTERMEDIATE & FINAL OUTPUT SCHEMAS ==

// -- New, simplified schema for the AI's creative output for items --
const AIGeneratedItemCreativeSchema = z.object({
  name: z.string().describe("A unique and thematic name for the item."),
  description: z.string().describe("A flavorful, one-sentence description of the item."),
  category: ItemCategorySchema,
  spawnBiomes: z.array(z.string()).min(1).describe("An array of one or more biomes (e.g., 'forest', 'desert') where this item can be found. Choose from: forest, grassland, desert, swamp, mountain, cave, jungle, volcanic."),
});

// -- Task A Output: The AI now generates a simpler structure. --
const ItemCatalogCreativeOutputSchema = z.object({
    customItemCatalog: z.array(AIGeneratedItemCreativeSchema).min(5).max(10).describe("A shared catalog of 5-10 unique, thematic items invented for this specific game world theme."),
});


// -- Task B Output: World Names --
const WorldNamesOutputSchema = z.object({
    worldNames: z.array(z.string()).length(3).describe("An array of three distinct and creative world names based on the user's input."),
});

// -- Task C Output: Narrative Concepts --
const NarrativeConceptsOutputSchema = z.object({
    narrativeConcepts: NarrativeConceptArraySchema.describe("An array of three distinct narrative starting points, including descriptions and quests."),
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
1.  The "customItemCatalog" array in your JSON output MUST contain between 5 and 10 items.
2.  For each item, you MUST define only the following fields: 'name', 'description', 'category', and 'spawnBiomes'.
3.  The 'category' must be one of the allowed values: 'Weapon', 'Material', 'Energy Source', 'Food', 'Data', 'Tool', 'Equipment', 'Support', 'Magic', 'Fusion'.
4.  The 'spawnBiomes' must be an array of biome names from this list: forest, grassland, desert, swamp, mountain, cave, jungle, volcanic.
5.  DO NOT include 'tier', 'effects', 'baseQuantity', or any other fields.`;

// -- Template for Task B: World Name Generation --
const worldNamesPromptTemplate = `You are a creative brainstorming assistant. ALL TEXT in your response MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a strict requirement.

Based on the user's idea, generate **three (3) distinct and creative world names.**

**User's Idea:** {{{userInput}}}

Provide the response as a single JSON object containing the 'worldNames' array.`;


// -- Template for Task C: Narrative Concept Generation --
const narrativeConceptsPromptTemplate = `You are a creative Game Master. ALL TEXT in your response (initial narrative, quests, etc.) MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a non-negotiable, strict requirement.

Based on the user's idea, you need to generate **three (3) distinct starting concepts for a game.**

**User's Idea:** {{{userInput}}}

For EACH of the three concepts, create the specific narrative details:
1.  **initialNarrative:** A rich, descriptive opening paragraph.
2.  **initialQuests:** One or two simple starting quests.

**Critical Rules:**
- **DO NOT** create world names, player items, a starting biome, an item catalog, or starting skills.

Provide the response as a single JSON object containing the 'narrativeConcepts' array.`;


// == THE GENKIT FLOW (Orchestration with Parallel Tasks and Fallback Logic) ==
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async (input) => {
    
    console.log('--- STARTING WORLD GENERATION ---');
    console.log('User Input:', input.userInput);
    console.log('Language:', input.language);
    
    // --- Step 1: Define three independent AI tasks to run in parallel ---
    
    // Task A: Generate the item catalog.
    const itemCatalogTask = (async () => {
        const template = Handlebars.compile(itemCatalogPromptTemplate);
        const renderedPrompt = template(input);
        const modelsToTry = ['openai/gpt-4-turbo', 'googleai/gemini-1.5-pro', 'deepseek/deepseek-chat', 'googleai/gemini-2.0-flash'];
        const errorLogs: string[] = [];

        for (const modelName of modelsToTry) {
            try {
                console.log(`[Task A] Attempting item catalog generation with model: ${modelName}`);
                const result = await ai.generate({
                    model: modelName,
                    prompt: renderedPrompt,
                    output: { schema: ItemCatalogCreativeOutputSchema },
                });
                console.log(`[Task A] SUCCESS with ${modelName}. Raw AI Output:`, result.output);
                return result;
            } catch (error: any) {
                const errorMessage = `Model ${modelName} failed. Reason: ${error.message || error}`;
                console.warn(errorMessage);
                errorLogs.push(errorMessage);
            }
        }
        
        const detailedError = `All AI models failed for item catalog generation. \n\nThis is often due to an invalid API key, insufficient balance on a paid account (like OpenAI or Deepseek), or network problems. Please check your .env file and billing settings for your AI providers. \n\nIndividual model errors:\n- ${errorLogs.join('\n- ')}`;
        throw new Error(detailedError);
    })();
    
    // Task B: Generate world names.
    const worldNamesTask = (async () => {
        const modelName = 'googleai/gemini-2.0-flash';
        console.log(`[Task B] Attempting world name generation with model: ${modelName}`);
        const template = Handlebars.compile(worldNamesPromptTemplate);
        const renderedPrompt = template(input);
        const result = await ai.generate({
            model: modelName,
            prompt: renderedPrompt,
            output: { schema: WorldNamesOutputSchema },
        });
        console.log(`[Task B] SUCCESS with ${modelName}. Raw AI Output:`, result.output);
        return result;
    })();

    // Task C: Generate narrative concepts.
    const narrativeConceptsTask = (async () => {
        const template = Handlebars.compile(narrativeConceptsPromptTemplate);
        const renderedPrompt = template(input);
        const modelsToTry = ['deepseek/deepseek-chat', 'googleai/gemini-2.0-flash'];
        const errorLogs: string[] = [];
        
        for (const modelName of modelsToTry) {
            try {
                console.log(`[Task C] Attempting narrative concepts generation with model: ${modelName}`);
                const result = await ai.generate({
                    model: modelName,
                    prompt: renderedPrompt,
                    output: { schema: NarrativeConceptsOutputSchema },
                });
                console.log(`[Task C] SUCCESS with ${modelName}. Raw AI Output:`, result.output);
                return result;
            } catch (error: any) {
                 const errorMessage = `Model ${modelName} failed for narrative concepts. Reason: ${error.message || error}`;
                console.warn(errorMessage);
                errorLogs.push(errorMessage);
            }
        }
        
        const detailedError = `All AI models failed for narrative concepts generation. \n\nIndividual model errors:\n- ${errorLogs.join('\n- ')}`;
        throw new Error(detailedError);
    })();
    
    // --- Step 2: Run all tasks in parallel and wait for them to complete ---
    const [itemCatalogResult, worldNamesResult, narrativeConceptsResult] = await Promise.all([
        itemCatalogTask,
        worldNamesTask,
        narrativeConceptsTask,
    ]);

    console.log('--- AI TASKS COMPLETE. PROCESSING AND COMBINING RESULTS... ---');
    
    // --- Step 3: Process the AI results and combine them ---
    const creativeItems = itemCatalogResult.output?.customItemCatalog;
    if (!creativeItems || creativeItems.length === 0) {
        throw new Error("Failed to generate a valid item catalog from the AI.");
    }

    // Programmatically add logical fields to the creative items generated by the AI.
    const allTerrains: Terrain[] = ["forest", "grassland", "desert", "swamp", "mountain", "cave", "jungle", "volcanic"];
    const customItemCatalog = creativeItems.map(item => {
        const validBiomes = item.spawnBiomes.filter(b => allTerrains.includes(b as Terrain)) as Terrain[];
        if (validBiomes.length === 0) {
            validBiomes.push('forest'); // Add a fallback biome if the AI provides an invalid one
        }

        return {
            ...item,
            tier: getRandomInRange({ min: 1, max: 3 }),
            effects: [], // Start with no effects for AI-generated items
            baseQuantity: { min: 1, max: getRandomInRange({ min: 1, max: 5 }) },
            spawnBiomes: validBiomes,
            growthConditions: undefined,
            subCategory: undefined,
            emoji: getEmojiForItem(item.name, item.category),
        };
    });
    
    const worldNames = worldNamesResult.output?.worldNames;
    if (!worldNames || worldNames.length !== 3) {
        throw new Error("Failed to generate valid world names from the AI.");
    }

    const narrativeConcepts = narrativeConceptsResult.output?.narrativeConcepts;
    if (!narrativeConcepts || narrativeConcepts.length !== 3) {
        throw new Error("Failed to generate valid narrative concepts from the AI.");
    }
    
    // --- Step 4: Combine the results and programmatically create inventory & skills ---
    const tier1Skills = skillDefinitions.filter(s => s.tier === 1);
    const tier2Skills = skillDefinitions.filter(s => s.tier === 2);
    const availableBiomes: Terrain[] = ['forest', 'grassland', 'desert', 'swamp', 'mountain']; // Basic biomes for starting
    
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
        
        // Programmatically select a starting biome
        const selectedBiome = availableBiomes[Math.floor(Math.random() * availableBiomes.length)];

        return {
            worldName: name,
            initialNarrative: concept.initialNarrative,
            startingBiome: selectedBiome,
            playerInventory: playerInventory,
            initialQuests: concept.initialQuests,
            startingSkill: selectedSkill,
        };
    });

    const finalOutput: GenerateWorldSetupOutput = {
        customItemCatalog,
        concepts: finalConcepts as any, // Cast to bypass strict type check for biome
    };
    
    console.log('--- FINAL WORLD SETUP DATA ---', finalOutput);

    return finalOutput;
  }
);
