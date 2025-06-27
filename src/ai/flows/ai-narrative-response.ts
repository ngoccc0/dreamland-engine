'use server';

/**
 * @fileOverview AI-driven narrative response flow.
 *
 * - aiNarrativeResponse - A function that processes player actions and generates narrative responses.
 * - AiNarrativeResponseInput - The input type for the aiNarrativeResponse function.
 * - AiNarrativeResponseOutput - The return type for the aiNarrativeResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiNarrativeResponseInputSchema = z.object({
  playerAction: z.string().describe('The action performed by the player.'),
  chunkDescription: z.string().describe('The current chunk description.'),
  inventory: z.array(z.string()).describe('The list of items in the player\'s inventory.'),
  playerStats: z.object({
    hp: z.number().describe('The player\'s current health points.'),
    mana: z.number().describe('The player\'s current mana points.'),
    quests: z.array(z.string()).describe('The list of active quests.'),
  }).describe('The player\'s current stats.'),
});
export type AiNarrativeResponseInput = z.infer<typeof AiNarrativeResponseInputSchema>;

const AiNarrativeResponseOutputSchema = z.object({
  narrativeResponse: z.string().describe('The AI-generated narrative response to the player\'s action.'),
  questUpdates: z.array(z.string()).describe('Any updates to the player\'s quests.'),
  newChunkDescription: z.string().describe('A new description of the current chunk, if it has changed.'),
});
export type AiNarrativeResponseOutput = z.infer<typeof AiNarrativeResponseOutputSchema>;

export async function aiNarrativeResponse(input: AiNarrativeResponseInput): Promise<AiNarrativeResponseOutput> {
  return aiNarrativeResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiNarrativeResponsePrompt',
  input: {schema: AiNarrativeResponseInputSchema},
  output: {schema: AiNarrativeResponseOutputSchema},
  prompt: `You are a dungeon master, driving the story forward based on the player\'s actions and the current game state.

Player Action: {{{playerAction}}}
Current Chunk Description: {{{chunkDescription}}}
Player Inventory: {{#each inventory}}{{{this}}}, {{/each}}
Player Stats: HP: {{{playerStats.hp}}}, Mana: {{{playerStats.mana}}}, Quests: {{#each playerStats.quests}}{{{this}}}, {{/each}}

Based on the player\'s action, the current chunk description, the player\'s inventory, and the player\'s stats, generate a narrative response that drives the story forward. Consider updating quests or changing the chunk description based on the player\'s actions. Return questUpdates if any quests have been updated and newChunkDescription if the chunk description has been updated. Otherwise, they should return empty strings.

Narrative Response:`,
});

const aiNarrativeResponseFlow = ai.defineFlow(
  {
    name: 'aiNarrativeResponseFlow',
    inputSchema: AiNarrativeResponseInputSchema,
    outputSchema: AiNarrativeResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
