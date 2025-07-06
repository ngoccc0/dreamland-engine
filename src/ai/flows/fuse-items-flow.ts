
'use server';
/**
 * @fileOverview An AI agent for dynamically fusing items based on player experimentation.
 *
 * This flow acts as a master alchemist or forge. The core logic (rules for success,
 * failure, degradation, and the resulting item's tier/category) is handled in TypeScript.
 * The AI's role is purely creative: to narrate the outcome and invent the name,
 * and description for the resulting item.
 *
 * - fuseItems - The main function called by the game engine.
 * - FuseItemsInput - The Zod schema for the input data.
 * - FuseItemsOutput - The Zod schema for the structured output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FuseItemsInputSchema, FuseItemsOutputSchema, GeneratedItemSchema } from '@/ai/schemas';
import { clamp, getEmojiForItem } from '@/lib/utils';

export type FuseItemsInput = z.infer<typeof FuseItemsInputSchema>;
export type FuseItemsOutput = z.infer<typeof FuseItemsOutputSchema>;

// --- The Exported Function ---
export async function fuseItems(input: FuseItemsInput): Promise<FuseItemsOutput> {
  return fuseItemsFlow(input);
}


// --- New schema for the prompt's specific input needs ---
const FuseItemsPromptInputSchema = FuseItemsInputSchema.extend({
    determinedOutcome: z.enum(['success', 'degraded', 'totalLoss']),
});


// --- New schema for the AI's creative output ---
// The AI only needs to generate the creative parts of an item.
const AIPartialItemSchema = GeneratedItemSchema.pick({
    name: true,
    description: true,
    effects: true,
});

// The AI's full response schema.
const AIPromptOutputSchema = z.object({
  outcome: z.enum(['success', 'degraded', 'totalLoss']),
  narrative: z.string(),
  resultItem: AIPartialItemSchema.optional(),
});


// --- The Genkit Prompt and Flow ---
const fuseItemsPromptText = `You are the Spirit of the Forge, an ancient entity that governs the laws of alchemy and creation in this world. A player is attempting to fuse items. Your entire response MUST be in the language specified by '{{language}}'. This is a critical instruction.

The outcome has already been decided by the laws of the world. Your task is to narrate this outcome creatively and, if necessary, invent the resulting item's creative properties.

**Player's Attempt:**
- Items: {{json itemsToFuse}}
- Player's Persona: {{playerPersona}}
- Location: A {{environmentalContext.biome}} during a {{environmentalContext.weather}}.

**The World's Verdict:**
- Outcome: '{{determinedOutcome}}'
- Chaos Factor: {{environmentalModifiers.chaosFactor}}/10 (Higher means more unexpected results. Use this for creative flavor.)

**Your Task:**
1.  **Narrate:** Write an engaging narrative that describes the fusion process and reflects the 'determinedOutcome'.
2.  **Invent an Item (if needed):**
    - If the 'determinedOutcome' is 'success': Invent a **new, interesting item** that could result from this fusion. Provide its name, description, and any special effects. The game will handle its power level (tier).
    - If the 'determinedOutcome' is 'degraded': Invent a **new, lesser item**. It should be a broken, warped, or simplified version of one of the ingredients (e.g., 'Sharp Rock' and 'Sturdy Branch' might degrade into 'Small Pebbles'). Provide its name, description, and any (likely negative) effects.
    - If the 'determinedOutcome' is 'totalLoss': **Do not** invent a new item. Your narrative should describe the items being destroyed completely.
3.  **Respond:** Provide your response in the required JSON format. Ensure the 'outcome' field matches the provided 'determinedOutcome'.
`;

const fuseItemsFlow = ai.defineFlow(
    {
        name: 'fuseItemsFlow',
        inputSchema: FuseItemsInputSchema,
        outputSchema: FuseItemsOutputSchema,
    },
    async (input) => {
        // --- LOGIC MOVED FROM PROMPT TO CODE ---

        // 1. Check for a 'Tool' item. This is a hard rule.
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

        // 2. Calculate success chance and determine outcome.
        const baseChance = 50; // 50% base success chance
        let bonus = input.environmentalModifiers.successChanceBonus;
        if (input.playerPersona === 'artisan') {
            bonus += 10; // Artisan gets a 10% bonus
        }
        const finalChance = clamp(baseChance + bonus, 5, 95);
        const roll = Math.random() * 100;
        
        // 3. Determine the final outcome and the resulting item tier.
        let determinedOutcome: 'success' | 'degraded' | 'totalLoss';
        let finalTier: number | undefined = undefined;

        if (roll < finalChance) { // SUCCESS
            determinedOutcome = 'success';
            const avgTier = input.itemsToFuse.reduce((sum, item) => sum + item.tier, 0) / input.itemsToFuse.length;
            const randomMultiplier = Math.random() * (1.5 - 0.75) + 0.75; // Random between 75% and 150%
            finalTier = clamp(Math.round(avgTier * randomMultiplier), 1, 6);
        } else { // FAILURE
            const lowestTier = Math.min(...input.itemsToFuse.map(i => i.tier));
            if (roll > 95 || lowestTier <= 1) {
                // Critical failure (roll > 95) or failing with junk items (Tier 1) results in total loss.
                determinedOutcome = 'totalLoss';
            } else {
                // Otherwise, it degrades.
                determinedOutcome = 'degraded';
                finalTier = clamp(lowestTier - 1, 1, 6); // Degraded item is one tier lower, but not less than 1.
            }
        }
        
        // 4. Call the AI with the determined outcome for creative narration and item invention.
        const promptInput = {
            ...input,
            determinedOutcome,
        };
        
        const modelsToTry = [
            'openai/gpt-4o',
            'googleai/gemini-1.5-pro',
            'deepseek/deepseek-chat',
            'googleai/gemini-2.0-flash',
        ];
        
        let llmResponse;
        let lastError;

        for (const model of modelsToTry) {
            try {
                llmResponse = await ai.generate({
                    model: model,
                    prompt: fuseItemsPromptText,
                    input: promptInput,
                    output: { schema: AIPromptOutputSchema },
                });
                break; // Success
            } catch (error) {
                lastError = error;
                console.warn(`[fuseItemsFlow] Model '${model}' failed. Trying next... Error: ${error}`);
            }
        }
        
        if (!llmResponse) {
            console.error("All AI models failed for item fusion.", lastError);
            throw lastError || new Error("AI failed to generate a fusion narrative.");
        }

        const aiOutput = llmResponse.output;

        if (!aiOutput) {
            throw new Error("The ethereal currents of possibility did not align, leaving the outcome shrouded in mystery.");
        }

        // 5. Construct the final, structured output, combining AI creativity with code-driven logic.
        const finalOutput: FuseItemsOutput = {
            outcome: aiOutput.outcome,
            narrative: aiOutput.narrative,
        };

        if (aiOutput.resultItem && finalTier) {
            finalOutput.resultItem = {
                ...aiOutput.resultItem,
                // --- LOGIC HANDLED BY CODE, NOT AI ---
                category: 'Fusion', // All fused items belong to the 'Fusion' category.
                tier: finalTier,
                emoji: getEmojiForItem(aiOutput.resultItem.name, 'Fusion'),
                spawnBiomes: [], // Fusion items don't spawn naturally.
                baseQuantity: { min: 1, max: 1 }, // Fusion always produces 1 item.
            };
        }

        return finalOutput;
    }
);
