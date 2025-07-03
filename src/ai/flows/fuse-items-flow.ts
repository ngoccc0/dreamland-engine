
'use server';
/**
 * @fileOverview An AI agent for dynamically fusing items based on player experimentation.
 *
 * This flow acts as a master alchemist or forge, taking a set of input items
 * and environmental context to decide on a logical, creative, or sometimes chaotic outcome.
 *
 * - fuseItems - The main function called by the game engine.
 * - FuseItemsInput - The Zod schema for the input data.
 * - FuseItemsOutput - The Zod schema for the structured output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FuseItemsInputSchema, FuseItemsOutputSchema } from '@/ai/schemas';


export type FuseItemsInput = z.infer<typeof FuseItemsInputSchema>;
export type FuseItemsOutput = z.infer<typeof FuseItemsOutputSchema>;


// --- The Exported Function ---
export async function fuseItems(input: FuseItemsInput): Promise<FuseItemsOutput> {
  return fuseItemsFlow(input);
}


// --- The Genkit Prompt and Flow ---
const fuseItemsPrompt = ai.definePrompt({
    name: 'fuseItemsPrompt',
    input: { schema: FuseItemsInputSchema },
    output: { schema: FuseItemsOutputSchema },
    prompt: `You are the Spirit of the Forge, an ancient entity that governs the laws of alchemy and creation in this world. A player is attempting to fuse items. Your entire response MUST be in the language specified by '{{language}}'. This is a critical and non-negotiable instruction.

**Fusion Rules:**
1.  **Tool Requirement:** A fusion attempt MUST include at least one item with the category 'Tool'. If no tool is present, you must fail the fusion. Set the 'outcome' to 'totalLoss' and explain this rule in the narrative (e.g., "You need a tool to properly work the materials.").
2.  **Success:** If the fusion seems logical and creative, create a **new Result Item**. Its tier should be slightly higher than the average tier of the ingredients. The item's category MUST be 'Fusion'. Set the 'outcome' to 'success'.
3.  **Failure (Degradation):** If the fusion is illogical or the environmental modifiers are unfavorable, it fails by **degrading**.
    - You MUST create a **new, lower-tier item**.
    - Its tier MUST be exactly **one less than the lowest tier** of the provided ingredients.
    - The item should be a lesser, broken, or warped version of one of the ingredients (e.g., 'Sharp Rock' and 'Sturdy Branch' might degrade into just 'Small Pebbles').
    - Set the 'outcome' to 'degraded'.
4.  **Failure (Total Loss):** If the **lowest tier of any ingredient is 1**, and the fusion fails, it results in **Total Loss**. The items are destroyed. Do not create a new item. Set the 'outcome' to 'totalLoss'.

**Player's Attempt:**
- Items (with categories): {{json itemsToFuse}}
- Persona: {{playerPersona}}
- Location: A {{environmentalContext.biome}} during a {{environmentalContext.weather}}.

**Guiding Forces (Pre-calculated by the world):**
- Success Bonus: {{environmentalModifiers.successChanceBonus}}% (Higher is better)
- Chaos Factor: {{environmentalModifiers.chaosFactor}}/10 (Higher means more unexpected results)

**Your Task:**
1.  Check for a 'Tool'. If none, set outcome to 'totalLoss' and write the narrative.
2.  Otherwise, decide the outcome: 'success', 'degraded', or 'totalLoss' based on the rules and guiding forces.
3.  Craft a narrative explaining what happened.
4.  Generate the \`resultItem\` if the outcome is 'success' or 'degraded'.
5.  Respond in the required JSON format with the correct 'outcome'.
`,
});

const fuseItemsFlow = ai.defineFlow(
    {
        name: 'fuseItemsFlow',
        inputSchema: FuseItemsInputSchema,
        outputSchema: FuseItemsOutputSchema,
    },
    async (input) => {
        const { output } = await fuseItemsPrompt(input);
        if (!output) {
            throw new Error("AI failed to determine fusion outcome.");
        }
        return output;
    }
);
