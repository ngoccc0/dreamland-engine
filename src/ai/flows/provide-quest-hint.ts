/**
 * An AI agent for providing helpful hints for active quests.
 *
 * This flow is called from UI to give player a gentle nudge.
 *
 * - provideQuestHint - The main function called from UI.
 * - ProvideQuestHintInput - The Zod schema for input data.
 * - ProvideQuestHintOutput - The Zod schema for output data.
 */

import { getAi } from '@/ai/genkit';
import Handlebars from 'handlebars';
import { z } from 'genkit';
import { ProvideQuestHintInputSchema, ProvideQuestHintOutputSchema } from '@/ai/schemas';

// --- INPUT/OUTPUT TYPES ---
export type ProvideQuestHintInput = z.infer<typeof ProvideQuestHintInputSchema>;
export type ProvideQuestHintOutput = z.infer<typeof ProvideQuestHintOutputSchema>;


// --- The Exported Function ---
export async function provideQuestHint(input: ProvideQuestHintInput): Promise<ProvideQuestHintOutput> {
    return provideQuestHintFlowRef(input);
}


// --- Lazy initialization for flow ---
let provideQuestHintFlowRef: any = null;

async function initProvideQuestHintFlow() {
    if (provideQuestHintFlowRef) return;

    const ai = await getAi();

    // --- The Genkit Prompt and Flow ---
    const promptText = `You are a helpful but mysterious game guide. Your entire response MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

The player is asking for a hint for the following quest:
"{{{questText}}}"

Your task is to provide a short, one or two-sentence hint. The hint should be helpful but not a complete spoiler. It should point to player in the right direction.

**Examples (for your reference, do not copy directly):**
- Quest: "Defeat the Goblin leader." -> Hint: "The Goblin leader is likely hiding in the deepest part of their cave, surrounded by guards."
- Quest: "Find the Sunstone." -> Hint: "Legends say the Sunstone was lost in a place where the sun never shines."
- Quest: "Craft a Healing Potion." -> Hint: "Look for healing herbs in forested areas; they often grow near water sources."

**Task:**
Generate one (1) hint in the required JSON format.
`;

    provideQuestHintFlowRef = ai.defineFlow(
        {
            name: 'provideQuestHintFlow',
            inputSchema: ProvideQuestHintInputSchema,
            outputSchema: ProvideQuestHintOutputSchema,
        },
        async (input) => {
            try {
                // Render the prompt template with Handlebars so we pass a fully
                // rendered text to Gemini. Storyteller voices are different
                // prompt templates, not different providers.
                const template = Handlebars.compile(promptText);
                const renderedPrompt = template(input as any);

                const result = await ai.generate([
                    { text: renderedPrompt, custom: {} }
                ]);

                if (result?.output) return result.output as ProvideQuestHintOutput;
                // If no structured output exists, try to coerce / validate.
                throw new Error('AI returned no structured output for quest hint');
            } catch (error: any) {
                console.error('AI failed to generate a hint (Gemini):', error);
                throw error;
            }
        }
    );
}
// NOTE: This function is defined but not currently exported or used.
// Kept as reference for future quest hint implementation.
// async function provideQuestHintFlow(input: ProvideQuestHintInput): Promise<ProvideQuestHintOutput> {
//     await initProvideQuestHintFlow();
//     return provideQuestHintFlowRef(input);
// }
