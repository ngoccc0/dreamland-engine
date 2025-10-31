
'use server';

/**
 * An AI agent for suggesting creative keywords.
 *
 * This flow takes a user's initial idea and suggests related keywords
 * to help them expand their concept for world creation. It includes fallback logic
 * to try multiple AI models for increased reliability.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Input: The user's current idea and the desired language.
const SuggestKeywordsInputSchema = z.object({
  userInput: z.string().describe("The user's current idea or keywords for a game world."),
  language: z.string().describe("The language for the generated keywords (e.g., 'en', 'vi')."),
});
export type SuggestKeywordsInput = z.infer<typeof SuggestKeywordsInputSchema>;

// Output: An array of suggested keywords.
const SuggestKeywordsOutputSchema = z.object({
  keywords: z.array(z.string()).describe("An array of 5-7 suggested keywords or short, evocative phrases to help them expand their idea."),
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

// Define the prompt with input and output schemas.
const keywordSuggestionPrompt = ai.definePrompt({
  name: 'keywordSuggestionPrompt',
  input: { schema: SuggestKeywordsInputSchema },
  output: { schema: SuggestKeywordsOutputSchema },
  prompt: `You are a creative brainstorming assistant helping a user design a game world. All keywords you generate MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

Based on the user's input below, suggest 5-7 related keywords or short, evocative phrases to help them expand their world concept.
The suggestions should be creative, interesting, and varied.

User's Idea: {{{userInput}}}

Return the keywords in the required JSON format.`,
});


const suggestKeywordsFlow = ai.defineFlow(
  {
    name: 'suggestKeywordsFlow',
    inputSchema: SuggestKeywordsInputSchema,
    outputSchema: SuggestKeywordsOutputSchema,
  },
  async (input) => {
    // This flow needs a fast model. Let's try a few and use the first one that works.
    const modelsToTry = [
      'googleai/gemini-2.0-flash',
      'deepseek/deepseek-chat',
      'openai/gpt-4o',
    ];

    let lastError: any;
    
    for (const modelName of modelsToTry) {
      try {
        // Call the defined prompt and override the model for each attempt.
        const { output } = await keywordSuggestionPrompt(input, { model: modelName });
        
        if (output) {
            return output;
        }

      } catch (e: any) {
        lastError = e;
        console.warn(`Model '${modelName}' failed for keyword suggestion. Trying next... Error: ${e.message}`);
      }
    }

    // If all models failed, throw the last recorded error.
    console.error("All models failed for keyword suggestion.");
    throw lastError || new Error("All models for keyword suggestion failed to generate a response.");
  }
);
