/**
 * An AI agent for dynamically generating a new item after a quest is completed.
 *
 * This flow is called by the narrative flow to inject new content into the world,
 * keeping the item pool fresh and surprising. The AI is responsible for the creative
 * aspects (name, description, category), while code handles assigning an emoji.
 *
 * - generateNewItem - The main function called by other flows.
 * - GenerateNewItemInput - The Zod schema for the input data.
 * - GenerateNewItemOutput - The Zod schema for the output data (which is just a single item).
 */

import { ai } from '@/ai/genkit';
import { generateCompat as aiGenerate } from '@/ai/client';
import { z } from 'genkit';
import { GeneratedItemSchema, GenerateNewItemInputSchema } from '@/ai/schemas';
import { getEmojiForItem } from '@/lib/utils';
import { setDoc, doc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore'
import { getDb } from '@/lib/firebase-config';

// --- INPUT/OUTPUT SCHEMAS ---

export type GenerateNewItemInput = z.infer<typeof GenerateNewItemInputSchema>;

// The output is just a single new item.
export type GenerateNewItemOutput = z.infer<typeof GeneratedItemSchema>;


// --- The Exported Function ---
export async function generateNewItem(input: GenerateNewItemInput): Promise<GenerateNewItemOutput> {
    return generateNewItemFlow(input);
}


// --- The Genkit Prompt and Flow ---

// This schema defines what the AI needs to generate. It omits the emoji.
const AI_GeneratedItemSchema = GeneratedItemSchema.omit({ emoji: true });


const promptText = `You are a creative game designer for the text-based RPG '{{worldName}}'.
Your task is to invent a new item for the player. Your entire response (item name, description, etc.) MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Rules:**
1.  The item must be **new**. Its name cannot be one of these: {{json existingItemNames}}.
2.  The item must be **thematically consistent** with the world name '{{worldName}}'.
3.  The item's utility should be **subtly tailored** to the player's current playstyle persona ('{{playerPersona}}').
    - **warrior:** A new weapon, armor piece, or combat-related material.
    - **explorer:** A new tool, a piece of survival gear, or a unique food item.
    - **artisan:** A rare new material, a unique energy source, or a special tool for crafting.
    - **none:** A general-purpose item that could be useful for any player.
4.  You MUST define all required fields for the item: name, description, category, tier, effects, baseQuantity, and spawnBiomes.
**Task:**
Generate one (1) new item in the required JSON format.
`;

const generateNewItemFlow = ai.defineFlow(
    {
        name: 'generateNewItemFlow',
        inputSchema: GenerateNewItemInputSchema,
        outputSchema: GeneratedItemSchema,
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
                // Use compatibility adapter to support older callsites that pass an options object
                llmResponse = await aiGenerate({
                    model: model,
                    prompt: promptText,
                    input: input,
                    output: { schema: AI_GeneratedItemSchema },
                });
                if (llmResponse?.output) break;
            } catch (error: any) {
                lastError = error;
                // Continue to next model
            }
        }

        const itemWithoutEmoji = llmResponse?.output;

        if (!itemWithoutEmoji) {
            throw lastError || new Error("AI failed to generate a new item.");
        }

        // Add the emoji using code logic
        const emoji = getEmojiForItem(itemWithoutEmoji.name, itemWithoutEmoji.category);

        const finalItem = {
            ...itemWithoutEmoji,
            emoji,
        };

        // Save the new item to Firestore for persistence across games (lazy DB)
        try {
            const db = await getDb();
            if (db) {
                await setDoc(doc(db, "world-catalog", "items", "generated", finalItem.name), finalItem);
                console.log(`[generateNewItemFlow] Successfully saved new item '${finalItem.name}' to Firestore.`);
            }
        } catch (error: any) {
            console.error("Failed to save new item to Firestore:", error);
            // non-fatal
        }

        return finalItem;
    }
);
