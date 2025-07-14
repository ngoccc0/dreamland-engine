/**
 * @fileOverview An AI agent for generating game world concepts by distributing tasks across multiple AI models.
 * @description This file defines a sophisticated, parallelized AI workflow for world creation.
 * It splits the generation process into four distinct, concurrent tasks to leverage the strengths
 * of different AI models, increase speed, and improve reliability with a fallback mechanism.
 */
import Handlebars from 'handlebars';
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Terrain, Skill } from '@/lib/game/types';
import { GeneratedItemSchema, SkillSchema, NarrativeConceptArraySchema, StructureSchema, allTerrains as allTerrainsSchema, TranslatableStringSchema } from '@/ai/schemas';
import { ItemCategorySchema } from '@/lib/game/definitions';
import { skillDefinitions } from '@/lib/game/skills';
import { getEmojiForItem, getTranslatedText } from '@/lib/utils';
import { db } from '@/lib/firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { logger } from '@/lib/logger';


const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;


// == INPUT SCHEMA ==
/**
 * @typedef {object} GenerateWorldSetupInput
 * @description The input schema for the world generation flow.
 * @property {string} userInput - The user's initial idea, prompt, or description for the game world.
 * @property {string} language - The language code for the generated content (e.g., 'en', 'vi').
 */
const GenerateWorldSetupInputSchema = z.object({
  userInput: z.string().describe("The user's initial idea, prompt, or description for the game world."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});
export type GenerateWorldSetupInput = z.infer<typeof GenerateWorldSetupInputSchema>;


// == INTERMEDIATE & FINAL OUTPUT SCHEMAS ==

// -- New, simplified schema for the AI's creative output for items --
const AIGeneratedItemCreativeSchema = z.object({
  name: TranslatableStringSchema.describe("A unique and thematic name for the item."),
  description: TranslatableStringSchema.describe("A flavorful, one-sentence description of the item."),
  category: ItemCategorySchema,
  spawnBiomes: z.array(z.string()).min(1).describe(`An array of one or more biomes where this item can be found. Choose from: ${allTerrainsSchema.join(', ')}.`),
});

// -- Task A Output: The AI now generates a simpler structure. --
const ItemCatalogCreativeOutputSchema = z.object({
    customItemCatalog: z.array(AIGeneratedItemCreativeSchema).min(5).max(10).describe("A shared catalog of 5-10 unique, thematic items invented for this specific game world theme."),
});


// -- Task B Output: World Names --
const WorldNamesOutputSchema = z.object({
    worldNames: z.array(TranslatableStringSchema).length(3).describe("An array of three distinct and creative world names based on the user's input."),
});

// -- Task C Output: Narrative Concepts --
const NarrativeConceptsOutputSchema = z.object({
    narrativeConcepts: NarrativeConceptArraySchema.describe("An array of three distinct narrative starting points, including descriptions and quests."),
});

// -- New schema for AI's creative output for structures --
const AIGeneratedStructureCreativeSchema = z.object({
    name: TranslatableStringSchema.describe("A unique and thematic name for the structure."),
    description: TranslatableStringSchema.describe("A flavorful, one-sentence description of the structure."),
    emoji: z.string().describe("A single emoji that represents the structure."),
});
const StructureCatalogCreativeOutputSchema = z.object({
    customStructures: z.array(AIGeneratedStructureCreativeSchema).min(2).max(4).describe("A catalog of 2-4 unique structures or landmarks invented for this world."),
});


// -- Final Combined Output Schema (for the frontend) --
export const WorldConceptSchema = z.object({
  worldName: TranslatableStringSchema,
  initialNarrative: TranslatableStringSchema,
  startingBiome: z.custom<Terrain>(), // Using custom to avoid z.enum with a const
  playerInventory: z.array(z.object({ name: z.string(), quantity: z.number().int().min(1) })),
  initialQuests: z.array(TranslatableStringSchema),
  startingSkill: SkillSchema,
  customStructures: z.array(StructureSchema), // Pass the generated structures with each concept
});
export type WorldConcept = z.infer<typeof WorldConceptSchema>;

export const GenerateWorldSetupOutputSchema = z.object({
    customItemCatalog: z.array(GeneratedItemSchema),
    customStructures: z.array(StructureSchema),
    concepts: z.array(WorldConceptSchema).length(3),
});
export type GenerateWorldSetupOutput = z.infer<typeof GenerateWorldSetupOutputSchema>;


/**
 * @description This is the primary function that the application's frontend will call.
 * It orchestrates a complex, multi-model AI workflow to generate rich game world concepts.
 * @param {GenerateWorldSetupInput} input - The user's prompt and language preference.
 * @returns {Promise<GenerateWorldSetupOutput>} A promise resolving to the final structured output for the frontend.
 */
export async function generateWorldSetup(input: GenerateWorldSetupInput): Promise<GenerateWorldSetupOutput> {
  logger.info('Starting generateWorldSetup flow');
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
3.  The 'category' must be one of the allowed values: {{json validCategories}}.
4.  The 'spawnBiomes' must be an array of biome names from this list: ${allTerrainsSchema.join(', ')}.
5.  DO NOT create items that are already on this list: {{json existingItemNames}}.
6.  DO NOT include 'tier', 'effects', 'baseQuantity', or any other fields.`;

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
- **DO NOT** create world names, player items, a starting biome, an item catalog, custom structures, or starting skills.

Provide the response as a single JSON object containing the 'narrativeConcepts' array.`;

// -- New Template for Task D: Structure Catalog Generation --
const structureCatalogPromptTemplate = `You are a creative world-building assistant specializing in architectural and landmark design. ALL TEXT in your response MUST be in the language specified by the code '{{language}}'.

Based on the user's idea, generate **a small catalog of 2 to 4 unique, thematically appropriate structures or landmarks** that could be found in this world.

**User's Idea:** {{{userInput}}}

**Rules:**
1.  The "customStructures" array in your JSON output MUST contain between 2 and 4 structures.
2.  For each structure, you MUST define only 'name', 'description', and 'emoji'.
3.  DO NOT include fields like 'buildable', 'providesShelter', 'buildCost', etc. These will be handled by the game logic.`;


/**
 * @description The core Genkit flow that orchestrates parallel AI tasks for world generation.
 * It combines the results from item, name, narrative, and structure generation into a coherent output.
 */
const generateWorldSetupFlow = ai.defineFlow(
  {
    name: 'generateWorldSetupFlow',
    inputSchema: GenerateWorldSetupInputSchema,
    outputSchema: GenerateWorldSetupOutputSchema,
  },
  async (input) => {

    logger.info('--- STARTING WORLD GENERATION ---', { userInput: input.userInput, language: input.language });
    
    // --- Step 1: Define four independent AI tasks to run in parallel ---
    
    // Get existing item names ONLY from the static, code-based definitions.
    const itemNamesList = Object.keys(staticItemDefinitions);

    // Task A: Generate the item catalog.
    const itemCatalogTask = (async () => {
        const template = Handlebars.compile(itemCatalogPromptTemplate);
        const promptInput = { ...input, existingItemNames: itemNamesList, validCategories: ItemCategorySchema.options };
        const renderedPrompt = template(promptInput);

        const modelsToTry = ['openai/gpt-4o', 'googleai/gemini-1.5-pro', 'deepseek/deepseek-chat', 'googleai/gemini-2.0-flash'];
        const errorLogs: string[] = [];

        for (const modelName of modelsToTry) {
            try {
                logger.debug(`[Task A] Attempting item catalog generation with model: ${modelName}`, { prompt: renderedPrompt });
                const result = await ai.generate({
                    model: modelName,
                    prompt: renderedPrompt,
                    output: { schema: ItemCatalogCreativeOutputSchema },
                });
                logger.info(`[Task A] SUCCESS with ${modelName}.`);
                logger.debug(`[Task A] Parsed AI output from ${modelName}:`, result.output);
                return result;
            } catch (error: any) {
                const errorMessage = `Model ${modelName} failed. Reason: ${error.message || error}`;
                logger.warn(`[Task A] ${errorMessage}`);
                errorLogs.push(errorMessage);
            }
        }
        
        const detailedError = `All AI models failed for item catalog generation. \n\nThis is often due to an invalid API key, insufficient balance on a paid account (like OpenAI or Deepseek), or network problems. Please check your .env file and billing settings for your AI providers. \n\nIndividual model errors:\n- ${errorLogs.join('\n- ')}`;
        logger.error(detailedError);
        throw new Error(detailedError);
    })();
    
    // Task B: Generate world names.
    const worldNamesTask = (async () => {
        const template = Handlebars.compile(worldNamesPromptTemplate);
        const renderedPrompt = template(input);
        const modelsToTry = ['googleai/gemini-2.0-flash', 'deepseek/deepseek-chat'];
        for (const modelName of modelsToTry) {
            try {
                logger.debug(`[Task B] Attempting world name generation with model: ${modelName}`, { prompt: renderedPrompt });
                const result = await ai.generate({
                    model: modelName,
                    prompt: renderedPrompt,
                    output: { schema: WorldNamesOutputSchema },
                });
                logger.info(`[Task B] SUCCESS with ${modelName}.`);
                return result;
            } catch (error: any) {
                logger.warn(`[Task B] Model ${modelName} failed. Reason: ${error.message || error}. Trying next...`);
            }
        }
        logger.error("All models failed for world name generation.");
        throw new Error("All models failed for world name generation.");
    })();

    // Task C: Generate narrative concepts.
    const narrativeConceptsTask = (async () => {
        const template = Handlebars.compile(narrativeConceptsPromptTemplate);
        const renderedPrompt = template(input);
        const modelsToTry = ['deepseek/deepseek-chat', 'googleai/gemini-2.0-flash', 'openai/gpt-4o'];
        for (const modelName of modelsToTry) {
            try {
                logger.debug(`[Task C] Attempting narrative concepts generation with model: ${modelName}`, { prompt: renderedPrompt });
                const result = await ai.generate({
                    model: modelName,
                    prompt: renderedPrompt,
                    output: { schema: NarrativeConceptsOutputSchema },
                });
                logger.info(`[Task C] SUCCESS with ${modelName}.`);
                return result;
            } catch (error: any) {
                logger.warn(`[Task C] Model ${modelName} failed. Reason: ${error.message || error}. Trying next...`);
            }
        }
        logger.error("All models failed for narrative concepts generation.");
        throw new Error("All models failed for narrative concepts generation.");
    })();
    
    // Task D: Generate custom structures.
    const structureCatalogTask = (async () => {
        const template = Handlebars.compile(structureCatalogPromptTemplate);
        const renderedPrompt = template(input);
        const modelsToTry = ['openai/gpt-4o', 'googleai/gemini-1.5-pro'];
        for (const modelName of modelsToTry) {
            try {
                logger.debug(`[Task D] Attempting structure catalog generation with model: ${modelName}`, { prompt: renderedPrompt });
                const result = await ai.generate({
                    model: modelName,
                    prompt: renderedPrompt,
                    output: { schema: StructureCatalogCreativeOutputSchema },
                });
                logger.info(`[Task D] SUCCESS with ${modelName}.`);
                return result;
            } catch (error: any) {
                logger.warn(`[Task D] Model ${modelName} failed. Reason: ${error.message || error}. Trying next...`);
            }
        }
        logger.warn("[Task D] All models failed. Proceeding without custom structures.");
        // Return a valid empty structure to prevent crashes
        return { output: { customStructures: [] } };
    })();


    // --- Step 2: Run all tasks in parallel and wait for them to complete ---
    const [itemCatalogResult, worldNamesResult, narrativeConceptsResult, structureCatalogResult] = await Promise.all([
        itemCatalogTask,
        worldNamesTask,
        narrativeConceptsTask,
        structureCatalogTask,
    ]);

    logger.info('--- AI TASKS COMPLETE. PROCESSING AND COMBINING RESULTS... ---');
    
    // --- Step 3: Process the AI results and combine them ---
    const creativeItems = itemCatalogResult.output?.customItemCatalog;
    if (!creativeItems || creativeItems.length === 0) {
        logger.error("Failed to generate a valid item catalog from the AI.");
        throw new Error("Failed to generate a valid item catalog from the AI.");
    }

    // Programmatically add logical fields to the creative items generated by the AI.
    const allTerrainsList: Terrain[] = ["forest", "grassland", "desert", "swamp", "mountain", "cave", "jungle", "volcanic", "tundra", "beach", "mesa", "mushroom_forest", "ocean"];
    const customItemCatalog = creativeItems.map(item => {
        const validBiomes = item.spawnBiomes.filter(b => allTerrainsList.includes(b as Terrain)) as Terrain[];
        if (validBiomes.length === 0) {
            validBiomes.push('forest'); // Add a fallback biome if the AI provides an invalid one
        }

        const itemName = typeof item.name === 'string' ? item.name : getTranslatedText(item.name, 'en');

        return {
            ...item,
            id: itemName.toLowerCase().replace(/\s+/g, '_'),
            tier: getRandomInRange({ min: 1, max: 3 }),
            effects: [], // Start with no effects for AI-generated items
            baseQuantity: { min: 1, max: getRandomInRange({ min: 1, max: 5 }) },
            spawnBiomes: validBiomes,
            spawnEnabled: true,
            growthConditions: undefined,
            subCategory: undefined,
            emoji: getEmojiForItem(itemName, item.category),
        };
    });
    
    const worldNames = worldNamesResult.output?.worldNames;
    if (!worldNames || worldNames.length !== 3) {
        logger.error("Failed to generate valid world names from the AI.");
        throw new Error("Failed to generate valid world names from the AI.");
    }

    const narrativeConcepts = narrativeConceptsResult.output?.narrativeConcepts;
    if (!narrativeConcepts || narrativeConcepts.length !== 3) {
        logger.error("Failed to generate valid narrative concepts from the AI.");
        throw new Error("Failed to generate valid narrative concepts from the AI.");
    }
    
    const creativeStructures = structureCatalogResult.output?.customStructures || [];
    const customStructures = creativeStructures.map(struct => ({
        ...struct,
        providesShelter: Math.random() > 0.6, // 40% chance of providing shelter
        buildable: false, // AI-generated structures aren't buildable by default
        buildCost: [],
        restEffect: undefined,
        heatValue: 0,
    }));

    // --- Step 4: Combine the results and programmatically create inventory & skills ---
    const tier1Skills = skillDefinitions.filter(s => s.tier === 1);
    const tier2Skills = skillDefinitions.filter(s => s.tier === 2);
    const availableBiomes: Terrain[] = ['forest', 'grassland', 'desert', 'swamp', 'mountain', 'beach']; // Basic biomes for starting
    
    const finalConcepts = worldNames.map((name, index) => {
        const concept = narrativeConcepts[index];
        
        // Programmatically select starting inventory
        const lowTierItems = customItemCatalog.filter(item => item.tier <= 2);
        const shuffledItems = [...lowTierItems].sort(() => 0.5 - Math.random());
        const numItemsToTake = getRandomInRange({ min: 2, max: 3 });
        const startingItems = shuffledItems.slice(0, numItemsToTake);
        
        const playerInventory = startingItems.map(item => ({
            name: getTranslatedText(item.name, 'en'), // Use english name as key
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
            customStructures: customStructures,
        };
    });

    const finalOutput: GenerateWorldSetupOutput = {
        customItemCatalog,
        customStructures: customStructures,
        concepts: finalConcepts,
    };
    
    logger.info('--- FINAL WORLD SETUP DATA ---', finalOutput);

    return finalOutput;
  }
);
