
'use server';
/**
 * @fileOverview An AI agent for dynamically generating new crafting recipes during gameplay.
 *
 * This flow is called periodically by the game engine to inject new content,
 * keeping the crafting system fresh and surprising for the player.
 *
 * - generateNewRecipe - The main function called by the game engine.
 * - GenerateNewRecipeInput - The Zod schema for the input data.
 * - Recipe - The Zod schema for a single recipe output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GeneratedItemSchema, RecipeSchema, type Recipe } from '@/ai/schemas';

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


// --- The Genkit Prompt and Flow ---
const generateRecipePrompt = ai.definePrompt({
    name: 'generateNewRecipePrompt',
    input: { schema: GenerateNewRecipeInputSchema },
    output: { schema: RecipeSchema },
    model: 'openai/gpt-4o-mini', // Use OpenAI for its creative and structured data capabilities
    prompt: `You are a master artisan and game designer. Your task is to invent a new, logical, and thematically appropriate crafting recipe for a text-based adventure game.

**Rules:**
1.  The recipe must be **new**. It cannot be one of these existing recipes: {{json existingRecipes}}.
2.  The recipe must be **logical**. The ingredients should plausibly create the resulting item. (e.g., 'Wood' + 'Stone' -> 'Axe', not 'Wood' + 'Flower' -> 'Sword').
3.  Use **only the items provided** in the catalog below as ingredients or results.
4.  The recipe should have between 2 and 4 ingredients.
5.  If the result is a new item not in the catalog, invent a plausible name, description, and emoji for it.

**Available Item Catalog (Your Palette):**
{{json customItemCatalog}}

**Language:**
The entire response (names, descriptions) MUST be in the language corresponding to this code: {{language}}.

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
        const { output } = await generateRecipePrompt(input);
        if (!output) {
            throw new Error("AI failed to generate a new recipe.");
        }
        return output;
    }
);
