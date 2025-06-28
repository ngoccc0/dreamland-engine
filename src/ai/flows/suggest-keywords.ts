'use server';

/**
 * @fileOverview An AI agent for suggesting creative keywords.
 *
 * This flow takes a user's initial idea and suggests related keywords
 * to help them expand their concept for world creation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input: The user's current idea and the desired language.
const SuggestKeywordsInputSchema = z.object({
  userInput: z.string().describe("The user's current idea or keywords for a game world."),
  language: z.string().describe("The language for the generated keywords (e.g., 'en' for English, 'vi' for Vietnamese)."),
});
export type SuggestKeywordsInput = z.infer<typeof SuggestKeywordsInputSchema>;

// Output: An array of suggested keywords.
const SuggestKeywordsOutputSchema = z.object({
  keywords: z.array(z.string()).describe("An array of 5-7 suggested keywords or short, evocative phrases to help the user expand their idea."),
});
export type SuggestKeywordsOutput = z.infer<typeof SuggestKeywordsOutputSchema>;


/**
 * Calls the AI to get keyword suggestions.
 * @param input The user's current world idea and language.
 * @returns A promise that resolves to an object containing suggested keywords.
 */
export async function suggestKeywords(input: SuggestKeywordsInput): Promise<SuggestKeywordsOutput> {
  return suggestKeywordsFlow(input);
}


const keywordSuggestionPrompt = ai.definePrompt({
  name: 'keywordSuggestionPrompt',
  input: {
    schema: SuggestKeywordsInputSchema,
  },
  output: {
    schema: SuggestKeywordsOutputSchema,
  },
  prompt: `You are a creative brainstorming assistant helping a user design a game world.
Based on the user's input below, suggest 5-7 related keywords or short, evocative phrases to help them expand their world concept.
The suggestions should be creative, interesting, and varied.

User's Idea: {{{userInput}}}

Return the keywords in the required JSON format. The keywords must be in the language corresponding to this code: {{language}}.`,
});


const suggestKeywordsFlow = ai.defineFlow(
  {
    name: 'suggestKeywordsFlow',
    inputSchema: SuggestKeywordsInputSchema,
    outputSchema: SuggestKeywordsOutputSchema,
  },
  async (input) => {
    const {output} = await keywordSuggestionPrompt(input);
    return output!;
  }
);
