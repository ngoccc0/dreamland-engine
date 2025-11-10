'use server';
/**
 * An AI agent for dynamically fusing items based on player experimentation.
 *
 * This flow acts as a master alchemist. The core logic (rules for success,
 * failure, degradation, and the resulting item's tier/category) is handled in TypeScript.
 * The AI's role is purely creative: to narrate the outcome and invent the name,
 * and description for the resulting item. It also handles rare "reality glitch" events
 * where items from other worlds can be created.
 *
 * @export fuseItems - The main function called by the game engine.
 * @export FuseItemsInput - The Zod schema for the input data.
 * @export FuseItemsOutput - The Zod schema for the structured output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { FuseItemsInputSchema, FuseItemsOutputSchema, GeneratedItemSchema, PlayerItemSchema } from '@/ai/schemas';
import { clamp, getEmojiForItem, getTranslatedText } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { GeneratedItem } from '@/core/types/game';
import { resolveItemDef } from '@/lib/game/item-utils';

// --- The Exported Function ---

/**
 * Orchestrates the item fusion process. It determines the outcome logically and then
 * calls an AI flow to generate the creative narrative and item details.
 * @param {FuseItemsInput} input - The input containing items to fuse, player status, and environmental context.
 * @returns {Promise<FuseItemsOutput>} A promise that resolves to the fusion result, including narrative and a potential new item.
 */
// Types for flow input and output
export type ItemToFuse = z.infer<typeof PlayerItemSchema>;
export type FuseItemsInput = z.infer<typeof FuseItemsInputSchema>;
export type FuseItemsOutput = z.infer<typeof FuseItemsOutputSchema>;

export async function fuseItems(input: FuseItemsInput): Promise<FuseItemsOutput> {
  logger.info('Starting fuseItems flow');
  const result = await fuseItemsFlow(input);
  return result;
}

// --- New schema for the prompt's specific input needs ---
type FuseItemsPromptInput = z.infer<typeof FuseItemsInputSchema> & {
    determinedOutcome: 'success' | 'degraded' | 'totalLoss' | 'realityGlitch';
    glitchItem?: GeneratedItem;
};

// --- New schema for the AI's creative output ---
const AIPartialItemSchema = GeneratedItemSchema.pick({
    name: true,
    description: true,
    effects: true,
});

const AIPromptOutputSchema = z.object({
    outcome: z.enum(['success', 'degraded', 'totalLoss', 'realityGlitch']),
    narrative: z.string(),
    resultItem: AIPartialItemSchema.optional(),
});

// --- The Genkit Prompt and Flow ---
const fuseItemsPromptText = `You are the Spirit of the Forge, an ancient entity that governs the laws of alchemy and creation in this world. A player is attempting to fuse items. Your entire response MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

The outcome has already been decided by the laws of the world. Your task is to narrate this outcome creatively and, if necessary, invent the resulting item's creative properties.

**Player's Attempt:**
- Items: {{json itemsToFuse}}
- Player's Persona: {{playerPersona}}
- Location: A {{environmentalContext.biome}} during a {{environmentalContext.weather}}.

**The World's Verdict:**
- Outcome: '{{determinedOutcome}}'
- Chaos Factor: {{environmentalContext.chaosFactor}}/100 (Higher means more unexpected results. Use this for creative flavor.)
{{#if glitchItem}}
- **REALITY GLITCH!** The fusion has torn a hole in reality and pulled an object from another world:
  - Glitch Item: {{json glitchItem}}
{{/if}}

**Your Task:**
1.  **Narrate Creatively:** Write an engaging, multi-sensory narrative. Describe the sights (flashes of light, smoke), sounds (crackling, hissing, booming), and smells (ozone, sulfur, strange aromas) of the fusion process. The narrative MUST reflect the 'determinedOutcome' and the environment.
    - **Success:** Describe a powerful, harmonious combination.
    - **Degraded:** Describe a sputtering, unstable process that results in something lesser.
    - **Total Loss:** Describe a volatile or catastrophic failure where the items are utterly destroyed.
    - **Reality Glitch:** This is a spectacular event! Describe the fusion process becoming unstable, reality distorting, and the '{{glitchItem.name}}' materializing from a tear in spacetime. The narrative must be EPIC.
2.  **Invent an Item (if needed):**
    - If 'determinedOutcome' is 'success': Invent a **new, interesting item** that could result from this fusion. Provide its name, description, and any special effects.
    - If 'determinedOutcome' is 'degraded': Invent a **new, lesser item**. It should be a broken, warped, or simplified version of one of the ingredients (e.g., 'Sharp Rock' and 'Sturdy Branch' might degrade into 'Small Pebbles'). Provide its name, description, and any (likely negative) effects.
    - If 'determinedOutcome' is 'totalLoss' or 'realityGlitch': **Do not** invent a new item. The resultItem will be the glitchItem or nothing.
3.  **Respond:** Provide your response in the required JSON format. Ensure the 'outcome' field matches the provided 'determinedOutcome'.
`;

const fuseItemsFlow = ai.defineFlow(
    {
        name: 'fuseItemsFlow',
        inputSchema: FuseItemsInputSchema,
        outputSchema: FuseItemsOutputSchema,
    },
    async (input: FuseItemsInput): Promise<FuseItemsOutput> => {
        const typedInput = input;
        logger.info('Executing fuseItemsFlow with input', { items: typedInput.itemsToFuse.map((i: ItemToFuse) => getTranslatedText(i.name, 'en')), persona: typedInput.playerPersona });

        const hasTool = typedInput.itemsToFuse.some((item: ItemToFuse) => {
            const def = resolveItemDef(getTranslatedText(item.name, 'en'), typedInput.customItemDefinitions);
            return def?.category === 'Tool';
        });

        if (!hasTool) {
            logger.warn('Fuse attempt failed: No tool provided.');
            const narrative = input.language === 'vi' 
                ? 'Bạn cần một công cụ để có thể gia công và kết hợp các vật liệu đúng cách. Thử nghiệm của bạn thất bại.'
                : 'You need a tool to properly work and combine the materials. Your attempt fails.';
            return {
                outcome: 'totalLoss',
                narrative: narrative,
            } as FuseItemsOutput;
        }

        const baseChance = 50;
        let bonus = typedInput.environmentalModifiers.successChanceBonus;
        if (typedInput.playerPersona === 'artisan') bonus += 10;
        const finalChance = clamp(baseChance + bonus, 5, 95);
        const roll = Math.random() * 100;
        
        logger.debug('Fusion chance calculation', { baseChance, bonus, finalChance, roll });

        let determinedOutcome: 'success' | 'degraded' | 'totalLoss' | 'realityGlitch';
        let finalTier: number | undefined = undefined;
        let glitchItem: GeneratedItem | undefined = undefined;

        if (roll < finalChance) {
            if (roll < 5 && input.environmentalModifiers.chaosFactor > 80) { // Critical success under high chaos
                determinedOutcome = 'realityGlitch';
                const unspawnableItems = input.fullItemCatalog.filter((item: GeneratedItem) => item.spawnEnabled === false);
                if (unspawnableItems.length > 0) {
                    glitchItem = unspawnableItems[Math.floor(Math.random() * unspawnableItems.length)];
                    finalTier = glitchItem?.tier;
                } else {
                    determinedOutcome = 'success'; // Fallback if no glitch items available
                }
            } else {
                determinedOutcome = 'success';
            }
            if (determinedOutcome === 'success') {
                const avgTier = input.itemsToFuse.reduce((sum: number, item: ItemToFuse) => sum + item.tier, 0) / input.itemsToFuse.length;
                const randomMultiplier = Math.random() * (1.5 - 0.75) + 0.75;
                finalTier = clamp(Math.round(avgTier * randomMultiplier), 1, 6);
            }
        } else {
            const lowestTier = Math.min(...input.itemsToFuse.map((i: ItemToFuse) => i.tier));
            if (roll > 95 || lowestTier <= 1) {
                determinedOutcome = 'totalLoss';
            } else {
                determinedOutcome = 'degraded';
                finalTier = clamp(lowestTier - 1, 1, 6);
            }
        }
        
        logger.info('Fusion outcome determined', { outcome: determinedOutcome, tier: finalTier, glitchItem: glitchItem?.name ? getTranslatedText(glitchItem.name, 'en') : 'None' });

        const promptInput: FuseItemsPromptInput = {
            ...input,
            determinedOutcome,
            glitchItem,
        };
        
        const { output: aiOutput } = await ai.generate({
            prompt: [
                {
                    text: fuseItemsPromptText,
                    custom: {
                        model: 'openai/gpt-4o-mini',
                        input: promptInput,
                        output: { schema: AIPromptOutputSchema }
                    }
                }
            ]
        });

        if (!aiOutput) {
            logger.error("AI model returned an empty or invalid output for fusion.");
            throw new Error("The ethereal currents of possibility did not align, leaving the outcome shrouded in mystery.");
        }
        
        logger.debug('AI fusion output received', { aiOutput });

        const finalOutput: FuseItemsOutput = {
            outcome: aiOutput.outcome,
            narrative: aiOutput.narrative,
        };

        if (glitchItem) {
            finalOutput.resultItem = glitchItem;
        } else if (aiOutput.resultItem && finalTier) {
            finalOutput.resultItem = {
                ...aiOutput.resultItem,
                category: 'Fusion',
                tier: finalTier,
                emoji: getEmojiForItem(getTranslatedText(aiOutput.resultItem.name, 'en'), 'Fusion'),
                spawnEnabled: false,
                baseQuantity: { min: 1, max: 1 },
            } as GeneratedItem;
            logger.info('New fused item created', { item: finalOutput.resultItem ? getTranslatedText(finalOutput.resultItem.name, 'en') : 'None' });
        }

        return finalOutput;
    }
);
