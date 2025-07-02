
'use server';
/**
 * @fileOverview An AI agent for dynamically generating a new item after a quest is completed.
 *
 * This flow is called by the narrative flow to inject new content into the world,
 * keeping the item pool fresh and surprising.
 *
 * - generateNewItem - The main function called by other flows.
 * - GenerateNewItemInput - The Zod schema for the input data.
 * - GenerateNewItemOutput - The Zod schema for the output data (which is just a single item).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GeneratedItemSchema, GenerateNewItemInputSchema } from '@/ai/schemas';

// --- INPUT/OUTPUT SCHEMAS ---

export type GenerateNewItemInput = z.infer<typeof GenerateNewItemInputSchema>;

// The output is just a single new item.
export type GenerateNewItemOutput = z.infer<typeof GeneratedItemSchema>;


// --- The Exported Function ---
export async function generateNewItem(input: GenerateNewItemInput): Promise<GenerateNewItemOutput> {
    return generateNewItemFlow(input);
}


// --- The Genkit Prompt and Flow ---
const generateItemPrompt = ai.definePrompt({
    name: 'generateNewItemPrompt',
    input: { schema: GenerateNewItemInputSchema },
    output: { schema: GeneratedItemSchema },
    prompt: `You are a creative game designer for the text-based RPG '{{worldName}}'.
Your task is to invent one (1) single new item for the player. The entire response (item name, description, etc.) MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Rules:**
1.  The item must be **new**. Its name cannot be one of these: {{json existingItemNames}}.
2.  The item must be **thematically consistent** with the world name '{{worldName}}'.
3.  The item's utility should be **subtly tailored** to the player's current playstyle persona ('{{playerPersona}}').
    - **warrior:** A new weapon, armor piece, or combat-related material.
    - **explorer:** A new tool, a piece of survival gear, or a unique food item.
    - **artisan:** A rare new material, a unique energy source, or a special tool for crafting.
    - **none:** A general-purpose item that could be useful for any player.
4.  You MUST define all required fields for the item: name, description, emoji, category, tier, effects, baseQuantity, and spawnBiomes.

**Task:**
Generate one (1) new item in the required JSON format.
`,
});

const generateNewItemFlow = ai.defineFlow(
    {
        name: 'generateNewItemFlow',
        inputSchema: GenerateNewItemInputSchema,
        outputSchema: GeneratedItemSchema,
    },
    async (input) => {
        const { output } = await generateItemPrompt(input);
        if (!output) {
            throw new Error("AI failed to generate a new item.");
        }
        return output;
    }
);
