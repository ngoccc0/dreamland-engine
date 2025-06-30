'use server';
/**
 * @fileOverview The AI Storyteller flow.
 *
 * This file defines the Genkit flow responsible for generating dynamic, context-aware narratives
 * for the game. It acts as an AI Game Master, taking the current game state and player action
 * to produce a rich, evolving story. It uses tools to perform reliable game state calculations.
 *
 * - generateNarrative - The main function called by the game layout.
 * - GenerateNarrativeInput - The Zod schema for the input data.
 * - GenerateNarrativeOutput - The Zod schema for the structured AI response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PlayerStatusSchema, EnemySchema, ChunkSchema, ChunkItemSchema, PlayerItemSchema } from '@/ai/schemas';
import { playerAttackTool, takeItemTool, useItemTool } from '@/ai/tools/game-actions';

// == STEP 1: DEFINE THE INPUT SCHEMA ==
const GenerateNarrativeInputSchema = z.object({
  worldName: z.string().describe("The name of the game world."),
  playerAction: z.string().describe("The action the player just performed. E.g., 'move north', 'attack wolf', 'explore area', 'pick up Healing Herb'."),
  playerStatus: PlayerStatusSchema.describe("The player's current status (HP, items, etc.)."),
  currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is currently on."),
  recentNarrative: z.array(z.string()).describe("The last few entries from the narrative log to provide conversational context."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});
export type GenerateNarrativeInput = z.infer<typeof GenerateNarrativeInputSchema>;


// == STEP 2: DEFINE THE OUTPUT SCHEMA ==
// This is the final, combined output from both the AI and the tools.
const GenerateNarrativeOutputSchema = z.object({
  narrative: z.string().describe("The main narrative description of what happens next."),
  updatedChunk: z.object({
    description: z.string().optional(),
    items: z.array(ChunkItemSchema).optional(),
    NPCs: z.array(z.string()).optional(),
    enemy: EnemySchema.nullable().optional(),
  }).optional().describe("Optional: Changes to the current game chunk based on the action's outcome."),
  updatedPlayerStatus: z.object({
    items: z.array(PlayerItemSchema).optional(),
    quests: z.array(z.string()).optional(),
    hp: z.number().optional(),
    mana: z.number().optional(),
    stamina: z.number().optional(),
  }).optional().describe("Optional: Changes to the player's status."),
  systemMessage: z.string().optional().describe("An optional, short system message for important events."),
});
export type GenerateNarrativeOutput = z.infer<typeof GenerateNarrativeOutputSchema>;


// == STEP 3: DEFINE THE AI PROMPT ==
// This is a simpler output schema for what we expect from the AI's text generation.
// The state changes will come from the tools.
const AINarrativeResponseSchema = z.object({
    narrative: z.string().describe("The main narrative description of what happens next. This should be engaging and based on the player's action and the tool's result. It should be 2-4 sentences long."),
    systemMessage: z.string().optional().describe("An optional, short system message for important events (e.g., 'Item added to inventory', 'Quest updated')."),
});

const narrativePrompt = ai.definePrompt({
    name: 'narrativePrompt',
    input: { schema: GenerateNarrativeInputSchema },
    output: { schema: AINarrativeResponseSchema },
    tools: [playerAttackTool, takeItemTool, useItemTool],
    prompt: `You are the Game Master for a text-based adventure game called '{{worldName}}'.
Your role is to be a dynamic and creative storyteller. You will receive the player's action and the game state. Your primary job is to call the correct tool to execute the action, and then use the tool's result to write a compelling narrative.

**Your Primary Rules:**
1.  **Use Tools for Actions:** You MUST use the provided tools to handle game logic.
    *   If the player's action is to attack, call the \`playerAttack\` tool with the current player and enemy status.
    *   If the player's action is to take an item (e.g., "pick up Healing Herb"), find the item in the chunk's item list and call the \`takeItem\` tool.
    *   If the player's action is to use an item (e.g., "use Potion"), call the \`useItem\` tool.
    *   For simple exploration or observation, you do not need to call a tool.
2.  **Narrate the Results:** After the tool provides a result, your job is to craft a story around it. DO NOT invent outcomes or numbers. If the tool says the player took 10 damage, narrate that. If it says an enemy was defeated, describe its dramatic demise.
3.  **Be a Storyteller:** Write an engaging, descriptive narrative (2-4 sentences) that brings the world to life.
4.  **Language and Translation:** Your entire response MUST be in the language corresponding to this code: {{language}}. The context you receive is primarily in Vietnamese. You MUST translate these names and concepts into the target language before using them in your narrative. For example, if the input shows an enemy "Sói", refer to it as "Wolf" in your English response.

**Context:**
- Player's Action: {{{playerAction}}}
- Player's Status: {{json playerStatus}}
- Current Environment (Chunk): {{json currentChunk}}
- Recent Events: {{json recentNarrative}}

**Task:**
1.  Analyze the player's action and call the appropriate tool.
2.  Based on the tool's output, generate the narrative and an optional system message in the required JSON format.
`,
});

// == STEP 4: DEFINE THE MAIN ORCHESTRATION FUNCTION ==
/**
 * The main function to be called from the frontend. This function orchestrates
 * the call to the AI, executes tools, and combines the results.
 * @param input The current game state and player action.
 * @returns A promise that resolves to the AI-generated narrative and state changes.
 */
export async function generateNarrative(input: GenerateNarrativeInput): Promise<GenerateNarrativeOutput> {
  const llmResponse = await narrativePrompt(input);
  
  // The llmResponse contains the final narrative text, and also the trace of tool calls.
  const toolCalls = llmResponse.usage?.toolCalls;

  const finalOutput: GenerateNarrativeOutput = {
    narrative: llmResponse.output?.narrative || 'An unexpected silence fills the air.',
    systemMessage: llmResponse.output?.systemMessage,
  };

  if (toolCalls && toolCalls.length > 0) {
      // For simplicity, we'll process the first tool call.
      const toolCall = toolCalls[0];
      const toolOutput = toolCall.output;

      if (toolCall.tool === 'playerAttack') {
          const result = toolOutput as z.infer<typeof playerAttackTool.outputSchema>;
          finalOutput.updatedPlayerStatus = { hp: result.finalPlayerHp };
          const newEnemyState = { ...input.currentChunk.enemy!, hp: result.finalEnemyHp };
          finalOutput.updatedChunk = { enemy: result.enemyDefeated ? null : newEnemyState };
      } else if (toolCall.tool === 'takeItem') {
          const result = toolOutput as z.infer<typeof takeItemTool.outputSchema>;
          finalOutput.updatedPlayerStatus = { items: result.updatedPlayerInventory };
          finalOutput.updatedChunk = { items: result.updatedChunkItems };
      } else if (toolCall.tool === 'useItem') {
          const result = toolOutput as z.infer<typeof useItemTool.outputSchema>;
          if (result.wasUsed) {
            finalOutput.updatedPlayerStatus = result.updatedPlayerStatus;
          }
      }
  }

  return finalOutput;
}
