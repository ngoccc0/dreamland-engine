
'use server';
/**
 * @fileOverview An AI agent for providing helpful hints for active quests.
 *
 * This flow is called from the UI to give the player a gentle nudge.
 *
 * - provideQuestHint - The main function called from the UI.
 * - ProvideQuestHintInput - The Zod schema for the input data.
 * - ProvideQuestHintOutput - The Zod schema for the output data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ProvideQuestHintInputSchema, ProvideQuestHintOutputSchema } from '@/ai/schemas';

// --- INPUT/OUTPUT TYPES ---
export type ProvideQuestHintInput = z.infer<typeof ProvideQuestHintInputSchema>;
export type ProvideQuestHintOutput = z.infer<typeof ProvideQuestHintOutputSchema>;


// --- The Exported Function ---
export async function provideQuestHint(input: ProvideQuestHintInput): Promise<ProvideQuestHintOutput> {
    return provideQuestHintFlow(input);
}


// --- The Genkit Prompt and Flow ---
const provideQuestHintPrompt = ai.definePrompt({
    name: 'provideQuestHintPrompt',
    input: { schema: ProvideQuestHintInputSchema },
    output: { schema: ProvideQuestHintOutputSchema },
    prompt: `You are a helpful but mysterious game guide. The player is asking for a hint for the following quest:

"{{{questText}}}"

Your task is to provide a short, one or two-sentence hint. The hint should be helpful but not a complete spoiler. It should point the player in the right direction.

**Examples (for your reference, do not copy directly):**
- Quest: "Defeat the Goblin leader." -> Hint: "The Goblin leader is likely hiding in the deepest part of their cave, surrounded by guards."
- Quest: "Find the Sunstone." -> Hint: "Legends say the Sunstone was lost in a place where the sun never shines."
- Quest: "Craft a Healing Potion." -> Hint: "Look for healing herbs in forested areas; they often grow near water sources."

**Language Requirement:**
The hint MUST be in the language corresponding to this code: {{language}}.

**Task:**
Generate one (1) hint in the required JSON format.
`,
});

const provideQuestHintFlow = ai.defineFlow(
    {
        name: 'provideQuestHintFlow',
        inputSchema: ProvideQuestHintInputSchema,
        outputSchema: ProvideQuestHintOutputSchema,
    },
    async (input) => {
        const { output } = await provideQuestHintPrompt(input);
        if (!output) {
            throw new Error("AI failed to generate a hint.");
        }
        return output;
    }
);
