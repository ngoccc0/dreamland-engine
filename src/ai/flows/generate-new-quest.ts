
'use server';
/**
 * @fileOverview An AI agent for dynamically generating a simple, context-aware new quest.
 *
 * This flow is called periodically to provide players with short-term objectives.
 *
 * - generateNewQuest - The main function called by other flows.
 * - GenerateNewQuestInput - The Zod schema for the input data.
 * - GenerateNewQuestOutput - The Zod schema for the output data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateNewQuestInputSchema, GenerateNewQuestOutputSchema } from '@/ai/schemas';

// --- INPUT/OUTPUT TYPES ---
export type GenerateNewQuestInput = z.infer<typeof GenerateNewQuestInputSchema>;
export type GenerateNewQuestOutput = z.infer<typeof GenerateNewQuestOutputSchema>;


// --- The Exported Function ---
export async function generateNewQuest(input: GenerateNewQuestInput): Promise<GenerateNewQuestOutput> {
    return generateNewQuestFlow(input);
}


// --- The Genkit Prompt and Flow ---
const promptText = `You are a quest designer for the text-based RPG '{{worldName}}'.
Your task is to design a new, simple quest based on the player's situation. Your entire response MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Rules:**
1.  The quest must be **simple and achievable**. Examples: "Craft a torch," "Find 5 Healing Herbs," "Scout the nearby mountain."
2.  The quest must be **new**. It cannot be one of these: {{json existingQuests}}.
3.  **Tailor the quest** to the player's immediate environment and status.
    - If the player is low on health, suggest finding healing items.
    - If they are in a forest, suggest collecting wood or herbs.
    - If there is an enemy nearby, the quest could be to defeat it.
    - If they have materials, suggest crafting a useful tool.

**Player's Current Situation:**
- Status: {{json playerStatus}}
- Environment: A {{currentChunk.terrain}} area with {{json currentChunk.items}} and a potential {{currentChunk.enemy.type}} enemy.

**Task:**
Generate one (1) new quest objective in the required JSON format.
`;

const generateNewQuestFlow = ai.defineFlow(
    {
        name: 'generateNewQuestFlow',
        inputSchema: GenerateNewQuestInputSchema,
        outputSchema: GenerateNewQuestOutputSchema,
    },
    async (input) => {
        const modelsToTry = [
            'openai/gpt-4o',
            'googleai/gemini-1.5-pro',
            'deepseek/deepseek-chat',
            'googleai/gemini-2.0-flash',
        ];

        let lastError;
        for (const model of modelsToTry) {
            try {
                const { output } = await ai.generate({
                    model: model,
                    prompt: promptText,
                    input: input,
                    output: { schema: GenerateNewQuestOutputSchema },
                });
                if (output) return output;
            } catch (error) {
                lastError = error;
                console.warn(`[generateNewQuest] Model '${model}' failed. Trying next...`);
            }
        }
        
        console.error("All AI models failed for new quest generation.", lastError);
        throw lastError || new Error("AI failed to generate a new quest.");
    }
);
