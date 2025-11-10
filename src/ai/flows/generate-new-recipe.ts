

'use server';
/**
 * An AI agent for dynamically generating new crafting recipes during gameplay.
 *
 * This flow is called periodically by the game engine to inject new content,
 * keeping the crafting system fresh and surprising for the player. The AI generates the
 * core recipe, and code assigns a logical emoji to the result.
 *
 * - generateNewRecipe - The main function called by the game engine.
 * - GenerateNewRecipeInput - The Zod schema for the input data.
 * - Recipe - The Zod schema for a single recipe output.
 */

import { ai } from '@/ai/genkit';
import { generateCompat as aiGenerate } from '@/ai/client';
import { z } from 'genkit';

import { GeneratedItemSchema, RecipeSchema, RecipeResultSchema } from '@/ai/schemas';
import type { Recipe } from '@/core/types/game';
import { getEmojiForItem } from '@/lib/utils';
import { setDoc, doc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore'
import { db } from '@/lib/firebase-config';

// --- INPUT SCHEMA ---
const GenerateNewRecipeInputSchema = z.object({
    customItemCatalog: z.array(GeneratedItemSchema).describe("A list of ALL available items in the world, including their names, descriptions, and categories. This is the palette of ingredients the AI can use."),
    existingRecipes: z.array(z.string()).describe("A list of the names of recipes that already exist, to avoid generating duplicates."),
    language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});
export type GenerateNewRecipeInput = z.infer<typeof GenerateNewRecipeInputSchema>;


// --- The Exported Function ---
export async function generateNewRecipe(input: GenerateNewRecipeInput): Promise<Recipe> {
    return generateNewRecipeFlow(input);
}


// --- Local schemas for the AI prompt ---
// The AI only generates the name and quantity for the result, not the emoji.
const AI_RecipeResultSchema = RecipeResultSchema.omit({ emoji: true });
const AI_RecipeSchema = RecipeSchema.extend({
  result: AI_RecipeResultSchema
});


// --- The Genkit Prompt and Flow ---
const promptText = `You are a master artisan and game designer. Your task is to invent a new, logical, and thematically appropriate crafting recipe for a text-based adventure game. Your entire response (item names, descriptions, etc.) MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Rules:**
1.  The recipe must be **new**. Its name cannot be one of these existing recipes: {{json existingRecipes}}.
2.  The recipe must be **logical**. The ingredients should plausibly create the resulting item. (e.g., 'Wood' + 'Stone' -> 'Axe', not 'Wood' + 'Flower' -> 'Sword').
3.  Use **only the items provided** in the catalog below as ingredients or results.
4.  The recipe should have between 2 and 4 ingredients.
5.  If the result is a new item not in the catalog, invent a plausible name and description for it.

**Available Item Catalog (Your Palette):**
{{json customItemCatalog}}

**Task:**
Generate one (1) new crafting recipe in the required JSON format.
`;

const generateNewRecipeFlow = ai.defineFlow(
    {
        name: 'generateNewRecipeFlow',
        inputSchema: GenerateNewRecipeInputSchema,
        outputSchema: RecipeSchema,
    },
    async (input) => {
        const modelsToTry = [
            'openai/gpt-4o',
            'googleai/gemini-1.5-pro',
            'deepseek/deepseek-chat',
            'googleai/gemini-2.0-flash',
        ];

        let llmResponse;
        let lastError;

        for (const model of modelsToTry) {
            try {
                llmResponse = await aiGenerate({
                    model: model,
                    prompt: promptText,
                    input: input,
                    output: { schema: AI_RecipeSchema },
                });
                if (llmResponse?.output) break;
            } catch (error: any) {
                lastError = error;
                console.warn(`[generateNewRecipe] Model '${model}' failed. Trying next...`);
            }
        }

        const aiRecipe = llmResponse?.output;

        if (!aiRecipe) {
            console.error("All AI models failed for recipe generation.", lastError);
            throw lastError || new Error("AI failed to generate a new recipe.");
        }

        // Determine the category of the result item to help with emoji selection
        const resultDef = input.customItemCatalog.find(item => item.name === aiRecipe.result.name);
        const category = resultDef?.category || 'Material'; // Default to material if not found

        // Add the emoji using code logic
        const emoji = getEmojiForItem(aiRecipe.result.name, category);
        
        const finalRecipe: Recipe = {
          ...aiRecipe,
          result: {
            ...aiRecipe.result,
            emoji,
          }
        };

        // Save the new recipe to Firestore for persistence across games
        if (db) {
            try {
                await setDoc(doc(db, "world-catalog", "recipes", "generated", finalRecipe.result.name), finalRecipe);
                console.log(`[generateNewRecipeFlow] Successfully saved new recipe '${finalRecipe.result.name}' to Firestore.`);
            } catch (error: any) {
                console.error("Failed to save new recipe to Firestore:", error);
                // We don't throw here, as the game can continue without this save.
            }
        }

        return finalRecipe;
    }
);
