
'use server';
/**
 * @fileOverview An AI agent for dynamically generating new crafting recipes during gameplay.
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
import { z } from 'genkit';
import { GeneratedItemSchema, RecipeSchema, RecipeResultSchema, type Recipe } from '@/ai/schemas';
import { getEmojiForItem } from '@/lib/utils';

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
const generateRecipePrompt = ai.definePrompt({
    name: 'generateNewRecipePrompt',
    input: { schema: GenerateNewRecipeInputSchema },
    output: { schema: AI_RecipeSchema },
    prompt: `You are a master artisan and game designer. Your task is to invent a new, logical, and thematically appropriate crafting recipe for a text-based adventure game. The entire response (names, descriptions) MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Rules:**
1.  The recipe must be **new**. It cannot be one of these existing recipes: {{json existingRecipes}}.
2.  The recipe must be **logical**. The ingredients should plausibly create the resulting item. (e.g., 'Wood' + 'Stone' -> 'Axe', not 'Wood' + 'Flower' -> 'Sword').
3.  Use **only the items provided** in the catalog below as ingredients or results.
4.  The recipe should have between 2 and 4 ingredients.
5.  If the result is a new item not in the catalog, invent a plausible name and description for it. **Do NOT** invent an emoji for the result item.

**Available Item Catalog (Your Palette):**
{{json customItemCatalog}}

**Task:**
Generate one (1) new crafting recipe in the required JSON format.
`,
});

const generateNewRecipeFlow = ai.defineFlow(
    {
        name: 'generateNewRecipeFlow',
        inputSchema: GenerateNewRecipeInputSchema,
        outputSchema: RecipeSchema,
    },
    async (input) => {
        const { output: aiRecipe } = await generateRecipePrompt(input);
        if (!aiRecipe) {
            throw new Error("AI failed to generate a new recipe.");
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

        return finalRecipe;
    }
);
