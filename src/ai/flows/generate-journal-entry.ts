/**
 * An AI agent for writing daily journal entries from the player's perspective.
 *
 * This flow is called at the start of each new day to summarize the previous day's events.
 * It takes a log of actions and crafts a reflective, first-person narrative.
 *
 * - generateJournalEntry - The main function called by the game engine.
 * - GenerateJournalEntryInput - The Zod schema for the input data.
 * - GenerateJournalEntryOutput - The Zod schema for the output data.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import { GenerateJournalEntryInputSchema, GenerateJournalEntryOutputSchema } from '@/ai/schemas';

// --- INPUT/OUTPUT TYPES ---
export type GenerateJournalEntryInput = z.infer<typeof GenerateJournalEntryInputSchema>;
export type GenerateJournalEntryOutput = z.infer<typeof GenerateJournalEntryOutputSchema>;


// --- The Exported Function ---
export async function generateJournalEntry(input: GenerateJournalEntryInput): Promise<GenerateJournalEntryOutput> {
    return generateJournalEntryFlow(input);
}


// --- The Genkit Prompt and Flow ---
const promptText = `You are the player character in the text-based RPG '{{worldName}}'. Your current playstyle persona is '{{playerPersona}}'. It's the end of the day, and you are writing in your journal.

Your task is to write a short, reflective, first-person journal entry summarizing the day's events. The entry should be engaging and capture the feeling of the day. Your entire response MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Here is a log of what you did today:**
{{json dailyActionLog}}

**Guidelines:**
- Write in the first person ("I explored...", "I fought...").
- Don't just list the actions. Weave them into a narrative.
- Reflect on your successes, failures, and discoveries.
- Keep the entry to a few paragraphs.

**Task:**
Generate one (1) journal entry in the required JSON format.
`;

const generateJournalEntryFlow = ai.defineFlow(
    {
        name: 'generateJournalEntryFlow',
        inputSchema: GenerateJournalEntryInputSchema,
        outputSchema: GenerateJournalEntryOutputSchema,
    },
    async (input) => {
        const modelsToTry = [
            'openai/gpt-4',
            'googleai/gemini-1.5-pro',
            'deepseek/deepseek-chat',
            'googleai/gemini-2.0-flash',
        ];

        let lastError;
        for (const model of modelsToTry) {
            try {
                const { output } = await ai.generate([
                    {
                        text: promptText,
                        custom: input
                    }
                ]);
                
                if (output && output.journalEntry) return { journalEntry: output.journalEntry };
            } catch (error: any) {
                lastError = error;
                console.warn(`[generateJournalEntry] Model '${model}' failed. Trying next...`);
                continue;
            }
        }
        
        console.error("All AI models failed for journal entry generation.", lastError);
        throw lastError || new Error("AI failed to generate a journal entry.");
    }
);
