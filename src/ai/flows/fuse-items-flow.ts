
'use server';
/**
 * @fileOverview An AI agent for dynamically fusing items based on player experimentation.
 *
 * This flow acts as a master alchemist or forge. The core logic (rules for success,
 * failure, degradation) is handled in TypeScript. The AI's role is purely creative:
 * to narrate the outcome determined by the code and invent the resulting item.
 *
 * - fuseItems - The main function called by the game engine.
 * - FuseItemsInput - The Zod schema for the input data.
 * - FuseItemsOutput - The Zod schema for the structured output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FuseItemsInputSchema, FuseItemsOutputSchema, GeneratedItemSchema } from '@/ai/schemas';
import { clamp } from '@/lib/utils';

export type FuseItemsInput = z.infer<typeof FuseItemsInputSchema>;
export type FuseItemsOutput = z.infer<typeof FuseItemsOutputSchema>;


// --- The Exported Function ---
export async function fuseItems(input: FuseItemsInput): Promise<FuseItemsOutput> {
  return fuseItemsFlow(input);
}


// --- New schema for the prompt's specific input needs ---
const FuseItemsPromptInputSchema = FuseItemsInputSchema.extend({
    determinedOutcome: z.enum(['success', 'degraded', 'totalLoss']),
    degradedItemTier: z.number().optional(), // The exact tier for the new degraded item
});


// --- The Genkit Prompt and Flow ---
const fuseItemsPrompt = ai.definePrompt({
    name: 'fuseItemsPrompt',
    input: { schema: FuseItemsPromptInputSchema },
    output: { schema: FuseItemsOutputSchema },
    prompt: `You are the Spirit of the Forge, an ancient entity that governs the laws of alchemy and creation in this world. A player is attempting to fuse items. Your entire response MUST be in the language specified by '{{language}}'. This is a critical instruction.

The outcome has already been decided by the laws of the world. Your task is to narrate this outcome creatively and, if necessary, invent the resulting item.

**Player's Attempt:**
- Items: {{json itemsToFuse}}
- Player's Persona: {{playerPersona}}
- Location: A {{environmentalContext.biome}} during a {{environmentalContext.weather}}.

**The World's Verdict:**
- Outcome: '{{determinedOutcome}}'
- Chaos Factor: {{environmentalModifiers.chaosFactor}}/10 (Higher means more unexpected results. Use this for creative flavor.)

**Your Task:**
1.  **Narrate:** Write an engaging narrative that describes the fusion process and reflects the 'determinedOutcome'.
2.  **Generate Item (if needed):**
    - If 'determinedOutcome' is 'success': Create a **new, interesting item**. Its tier should be slightly higher than the average tier of the ingredients. Its category MUST be 'Fusion'.
    - If 'determinedOutcome' is 'degraded': Create a **new, lesser item**. It MUST have a tier of **{{degradedItemTier}}**. It should be a broken, warped, or simplified version of one of the ingredients (e.g., 'Sharp Rock' and 'Sturdy Branch' might degrade into 'Small Pebbles').
    - If 'determinedOutcome' is 'totalLoss': **Do not** create a new item. Your narrative should describe the items being destroyed.
3.  **Respond:** Provide the response in the required JSON format. Ensure the 'outcome' field matches the provided 'determinedOutcome'.
`,
});

const fuseItemsFlow = ai.defineFlow(
    {
        name: 'fuseItemsFlow',
        inputSchema: FuseItemsInputSchema,
        outputSchema: FuseItemsOutputSchema,
    },
    async (input) => {
        // --- LOGIC MOVED FROM PROMPT TO CODE ---

        // 1. Check for a 'Tool' item.
        const hasTool = input.itemsToFuse.some(item => {
            const def = input.customItemDefinitions[item.name];
            return def?.category === 'Tool';
        });

        if (!hasTool) {
            // If no tool, return a hardcoded failure response without calling the AI.
            const narrative = input.language === 'vi' 
                ? 'Bạn cần một công cụ để có thể gia công và kết hợp các vật liệu đúng cách. Thử nghiệm của bạn thất bại.'
                : 'You need a tool to properly work and combine the materials. Your attempt fails.';
            return {
                outcome: 'totalLoss',
                narrative: narrative,
            };
        }

        // 2. Calculate success chance.
        const baseChance = 50; // 50% base success chance
        const finalChance = clamp(baseChance + input.environmentalModifiers.successChanceBonus, 5, 95);
        const roll = Math.random() * 100;
        const isSuccess = roll < finalChance;
        
        // 3. Determine the final outcome.
        let determinedOutcome: 'success' | 'degraded' | 'totalLoss';
        let degradedItemTier: number | undefined = undefined;

        if (isSuccess) {
            determinedOutcome = 'success';
        } else {
            const lowestTier = Math.min(...input.itemsToFuse.map(i => i.tier));
            if (lowestTier <= 1) {
                // If any ingredient is Tier 1 and it fails, it's total loss.
                determinedOutcome = 'totalLoss';
            } else {
                // Otherwise, it degrades.
                determinedOutcome = 'degraded';
                degradedItemTier = lowestTier - 1;
            }
        }
        
        // 4. Call the AI with the determined outcome for creative narration.
        const promptInput = {
            ...input,
            determinedOutcome,
            degradedItemTier,
        };
        
        const { output } = await fuseItemsPrompt(promptInput);

        if (!output) {
            throw new Error("AI failed to determine fusion outcome.");
        }
        return output;
    }
);
