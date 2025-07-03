
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
    prompt: `You are the Spirit of the Forge, an ancient entity that governs the laws of alchemy and creation in this world. A player is attempting to fuse items. Your response MUST be in the language specified by the code '{{language}}'. This is a critical and non-negotiable instruction.

**Player's Attempt:**
- Items: {{json itemsToFuse}}
- Persona: {{playerPersona}}
- Location: A {{environmentalContext.biome}} during a {{environmentalContext.weather}}.

**Guiding Forces (Pre-calculated by the world):**
- Success Bonus: {{environmentalModifiers.successChanceBonus}}%
- Elemental Affinity: {{environmentalModifiers.elementalAffinity}}
- Chaos Factor: {{environmentalModifiers.chaosFactor}}/10

**Your Task:**
1.  **Decide the Outcome:** Based on the items and the guiding forces, determine if the fusion is a success, a failure, or a backfire. A higher success bonus makes success more likely. A higher chaos factor makes random outcomes or backfires more likely.
2.  **On Success:**
    - Create a **new, logical Result Item**. It should be a creative synthesis of the input items.
    - Its name, description, and tier should reflect its new nature. The tier should generally be slightly higher than the average tier of the ingredients.
    - **Crucially, you MUST set the 'category' of the result item to 'Fusion'.**
    - Craft a narrative describing the successful fusion. Incorporate the environmental context (e.g., "As lightning cracks across the sky, the metals fuse into...").
3.  **On Failure:**
    - Decide the failure type: 'totalLoss', 'randomItem', or 'backfire'.
    - **Total Loss:** The items simply dissolve or break apart. Narrate this.
    - **Random Item:** The chaotic energies create something completely unexpected. Generate a random, often nonsensical, item.
    - **Backfire:** The fusion explodes, dealing a small amount of damage. Narrate this and set 'backfireDamage'.
4.  **Respond in JSON:** Provide the outcome in the required JSON format.
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
