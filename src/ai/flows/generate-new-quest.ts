
'use server';
/**
 * @fileOverview An AI agent for dynamically generating new quests after one is completed.
 *
 * This flow is called by the narrative flow to inject new objectives,
 * keeping the player engaged.
 *
 * - generateNewQuest - The main function called by other flows.
 * - GenerateNewQuestInput - The Zod schema for the input data.
 * - GenerateNewQuestOutput - The Zod schema for the output data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateNewQuestInputSchema, GenerateNewQuestOutputSchema } from '@/ai/schemas';

// --- INPUT/OUTPUT TYPES ---
export type GenerateNewQuestInput = z.infer<typeof GenerateNewQuestInputSchema>;
export type GenerateNewQuestOutput = z.infer<typeof GenerateNewQuestOutputSchema>;


// --- The Exported Function ---
export async function generateNewQuest(input: GenerateNewQuestInput): Promise<GenerateNewQuestOutput> {
    return generateNewQuestFlow(input);
}

// --- The Genkit Prompt and Flow ---
const generateQuestPrompt = ai.definePrompt({
    name: 'generateNewQuestPrompt',
    input: { schema: GenerateNewQuestInputSchema },
    output: { schema: GenerateNewQuestOutputSchema },
    prompt: `You are a creative quest designer for the text-based RPG '{{worldName}}'.
Your task is to create a single, new quest for the player based on their current situation and playstyle.

**Rules:**
1.  The quest must be **new**. It cannot be one of these: {{json existingQuests}}.
2.  The quest must be **relevant** to the player's current environment, items, or nearby enemies.
3.  The quest text should be a **short, clear objective**.

**Player's Current Situation:**
- Playstyle Persona: '{{playerStatus.persona}}'
- Environment: A {{currentChunk.terrain}} area. Description: {{currentChunk.description}}
- Nearby Enemy: {{#if currentChunk.enemy}}{{currentChunk.enemy.type}}{{else}}None{{/if}}
- Player Items: {{json playerStatus.items}}

**Quest Generation Guidelines:**
- **Tailor to Persona:** The quest should match the player's persona ('{{playerStatus.persona}}').
  - **warrior:** A combat-focused quest (e.g., "Hunt the great bear," "Clear the goblin camp").
  - **explorer:** An exploration or discovery quest (e.g., "Find the source of the river," "Map the ancient ruins to the east").
  - **artisan:** A gathering or crafting quest (e.g., "Gather 10 Iron Ore," "Craft a Reinforced Shield").
  - **none:** A general-purpose quest suitable for any player, like finding an NPC or a specific location.

**Language:**
The entire response (quest text) MUST be in the language corresponding to this code: {{language}}.

**Task:**
Generate one (1) new quest in the required JSON format that fits the player's persona and current situation.
`,
});

const generateNewQuestFlow = ai.defineFlow(
    {
        name: 'generateNewQuestFlow',
        inputSchema: GenerateNewQuestInputSchema,
        outputSchema: GenerateNewQuestOutputSchema,
    },
    async (input) => {
        const { output } = await generateQuestPrompt(input);
        if (!output) {
            throw new Error("AI failed to generate a new quest.");
        }
        return output;
    }
);
