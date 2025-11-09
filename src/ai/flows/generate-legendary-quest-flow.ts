
'use server';
/**
 * An AI agent for dynamically generating the first step of a new legendary quest.
 *
 * This flow is called periodically to inject a grand, multi-step objective into the game,
 * providing a long-term goal for the player.
 *
 * - generateLegendaryQuest - The main function called by other flows.
 * - GenerateLegendaryQuestInput - The Zod schema for the input data.
 * - GenerateLegendaryQuestOutput - The Zod schema for the output data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateNewQuestInputSchema, GenerateNewQuestOutputSchema } from '@/ai/schemas';

// --- INPUT/OUTPUT TYPES ---
export type GenerateLegendaryQuestInput = z.infer<typeof GenerateNewQuestInputSchema>;
export type GenerateLegendaryQuestOutput = z.infer<typeof GenerateNewQuestOutputSchema>;


// --- The Exported Function ---
export async function generateLegendaryQuest(input: GenerateLegendaryQuestInput): Promise<GenerateLegendaryQuestOutput> {
    return generateLegendaryQuestFlow(input);
}


// --- The Genkit Prompt and Flow ---
const promptText = `You are an epic storyteller and quest designer for the text-based RPG '{{worldName}}'.
Your task is to design a new, **Legendary Quest**. This quest should be a multi-step epic, but you will only generate the **very first objective**. Your entire response (quest text, etc.) MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Rules:**
1.  The quest must feel **grand and epic**. Examples: "Slay a dragon," "Find a lost city," "Forge a mythical weapon."
2.  You must **only return the first, simple step**. For example, if the quest is to slay a dragon, the first step could be "Find the ancient map rumored to show the dragon's location" or "Talk to the old hermit who knows about dragons."
3.  The quest text should be a **short, clear objective** and must be prefixed with "[Huyền thoại] " for Vietnamese or "[Legendary] " for English.
4.  The quest must be **new**. It cannot be one of these: {{json existingQuests}}.
5.  **Tailor the quest** to the player's playstyle persona ('{{playerStatus.persona}}').
    - **warrior:** A quest about a legendary monster or a powerful weapon.
    - **explorer:** A quest about a lost city, a hidden artifact, or a mythical location.
    - **artisan:** A quest to find materials for and craft a masterpiece item.
    - **none:** A general-purpose epic quest.

**Player's Current Situation:**
- Playstyle Persona: '{{playerStatus.persona}}'
- Environment: A {{currentChunk.terrain}} area.

**Task:**
Generate the first step of one (1) new Legendary Quest in the required JSON format.
`;

const generateLegendaryQuestFlow = ai.defineFlow(
    {
        name: 'generateLegendaryQuestFlow',
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
                const { output } = await ai.generate([
                    {
                        text: "You are a game's quest designer. Generate challenging and engaging legendary quests based on the player's status and game world."
                    },
                    {
                        text: promptText,
                        custom: input
                    }
                ]);
                if (output) return output;
            } catch (error: any) {
                lastError = error;
                console.warn(`[generateLegendaryQuest] Model '${model}' failed. Trying next...`);
            }
        }
        
        console.error("All AI models failed for legendary quest generation.", lastError);
        throw lastError || new Error("AI failed to generate a legendary quest.");
    }
);
