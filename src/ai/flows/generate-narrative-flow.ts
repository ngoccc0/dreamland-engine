
'use server';
/**
 * @fileOverview The AI Storyteller flow.
 *
 * This file defines the Genkit flow responsible for generating dynamic, context-aware narratives
 * for the game. It acts as an AI Game Master, taking the current game state and player action
 * to produce a rich, evolving story. It uses tools to perform reliable game state calculations,
 * start new quests from NPCs, and handle quest completion.
 *
 * - generateNarrative - The main function called by the game layout.
 * - GenerateNarrativeInput - The Zod schema for the input data.
 * - GenerateNarrativeOutput - The Zod schema for the structured AI response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { PlayerStatusSchema, EnemySchema, ChunkSchema, ChunkItemSchema, PlayerItemSchema, ItemDefinitionSchema, GeneratedItemSchema, NpcSchema } from '@/ai/schemas';
import { playerAttackTool, takeItemTool, useItemTool, tameEnemyTool, useSkillTool, completeQuestTool, startQuestTool } from '@/ai/tools/game-actions';
import { generateNewQuest } from './generate-new-quest';
import { generateLegendaryQuest } from './generate-legendary-quest-flow';
import { generateNewItem } from './generate-new-item';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import type { AiModel, NarrativeLength } from '@/lib/game/types';


// == STEP 1: DEFINE THE INPUT SCHEMA ==
const SuccessLevelSchema = z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']);

const GenerateNarrativeInputSchema = z.object({
  worldName: z.string().describe("The name of the game world."),
  playerAction: z.string().describe("The action the player just performed. E.g., 'move north', 'attack wolf', 'explore area', 'pick up Healing Herb', 'use Heal', 'give wolf fang to hunter'."),
  playerStatus: PlayerStatusSchema.describe("The player's current status (HP, items, skills, etc.)."),
  currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is currently on. This includes dynamic weather effects and rich NPC data."),
  surroundingChunks: z.array(ChunkSchema).optional().describe("A 3x3 grid of chunks around the player for environmental context, especially for long narratives."),
  recentNarrative: z.array(z.string()).describe("The last few entries from the narrative log to provide conversational context."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
  diceRoll: z.number().describe("The result of the dice roll."),
  diceType: z.string().describe("The type of dice used (e.g., 'd20', '2d6')."),
  diceRange: z.string().describe("The possible range of the dice roll (e.g., '1-20', '2-12')."),
  successLevel: SuccessLevelSchema.describe("The categorized outcome of the dice roll."),
  customItemDefinitions: z.record(ItemDefinitionSchema).optional().describe("A map of AI-generated item definitions for the current game session."),
  aiModel: z.enum(['balanced', 'creative', 'fast', 'quality']).describe("The AI model preference for generation."),
  narrativeLength: z.enum(['short', 'medium', 'long']).describe("The desired length for the narrative response."),
});
export type GenerateNarrativeInput = z.infer<typeof GenerateNarrativeInputSchema>;


// == STEP 2: DEFINE THE OUTPUT SCHEMA ==
// This is the final, combined output from both the AI and the tools.
const GenerateNarrativeOutputSchema = z.object({
  narrative: z.string().describe("The main narrative description of what happens next."),
  updatedChunk: z.object({
    description: z.string().optional(),
    items: z.array(ChunkItemSchema).optional(),
    NPCs: z.array(NpcSchema).optional(),
    enemy: EnemySchema.nullable().optional(),
    structures: z.array(z.any()).optional(),
  }).optional().describe("Optional: Changes to the current game chunk based on the action's outcome."),
  updatedPlayerStatus: z.object({
    items: z.array(PlayerItemSchema).optional(),
    quests: z.array(z.string()).optional(),
    questsCompleted: z.number().optional(),
    hp: z.number().optional(),
    mana: z.number().optional(),
    stamina: z.number().optional(),
    pets: z.array(z.any()).optional(),
  }).optional().describe("Optional: Changes to the player's status."),
  systemMessage: z.string().optional().describe("An optional, short system message for important events."),
  newlyGeneratedItem: GeneratedItemSchema.optional().describe("A newly generated item to be added silently to the world's master item catalog."),
});
export type GenerateNarrativeOutput = z.infer<typeof GenerateNarrativeOutputSchema>;


// == STEP 3: DEFINE THE AI PROMPT ==
// This is a simpler output schema for what we expect from the AI's text generation.
// The state changes will come from the tools.
const AINarrativeResponseSchema = z.object({
    narrative: z.string().describe("The main narrative description of what happens next. This should be engaging and based on the player's action, the tool's result, and the requested narrativeLength ('short': 1-2 sentences, 'medium': 2-4, 'long': 5+)."),
    systemMessage: z.string().optional().describe("An optional, short system message for important events (e.g., 'Item added to inventory', 'Quest updated', 'Quest Completed!')."),
});

const narrativePromptTemplate = `You are the Game Master for a text-based adventure game called '{{worldName}}'. Your role is to be a dynamic and creative storyteller. Your entire response MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Your Primary Role:**
Your main task is to interpret the player's **custom or complex action** and determine what happens next. Simple actions like basic attacks or using a health potion are handled by the game's core rules. You are the creative force for everything else.

**Core Task:**
1.  **Analyze Player's Intent:** Based on '{{{playerAction}}}', understand what the player is trying to achieve. Is it a quest action? A creative interaction? A conversation?
2.  **Handle Quests & NPCs:**
    - If the action completes a quest (e.g., 'give wolf fang to hunter'), you MUST use the \`completeQuestTool\`.
    - If the action involves an NPC giving a new quest, you MUST use the \`startQuestTool\`.
    - When talking to an NPC, use their 'name', 'description', and 'dialogueSeed' to craft a unique, in-character response.
3.  **Interpret Creative Actions:** If the player tries something unique (e.g., "I try to create a distraction," "I examine the strange markings on the wall"), use your creativity to decide the outcome. You can use tools like \`playerAttackTool\` if the action implies a special kind of attack.
4.  **Narrate the Outcome:** Craft an engaging narrative based on your interpretation and the pre-determined 'successLevel'. The length of your narrative MUST adhere to the '{{narrativeLength}}' parameter.

**Critical Rules:**
- **Success Level is Law:** The 'successLevel' ('{{successLevel}}') dictates the outcome. A 'Failure' MUST be narrated as a failure, a 'CriticalSuccess' as a legendary event.
- **Movement Narration:** If the player's action is to move (e.g., 'move north'), your narrative MUST describe the journey to the new location. Mention a specific detail about the environment they are leaving, and a sensory detail (sight, sound, smell) about the new location they are entering, using the 'Current Environment' context. Do not just say "You move north."

**Context:**
- Player's Action: {{{playerAction}}}
- Dice Roll Outcome: {{diceRoll}} (on a {{diceType}} with range {{diceRange}}, resulting in {{successLevel}})
- Player's Status: {{json playerStatus}}
- Current Environment: {{json currentChunk}}
- Surrounding Area (3x3 grid): {{#if surroundingChunks}}{{json surroundingChunks}}{{else}}Not provided.{{/if}}
- Recent Events: {{json recentNarrative}}

**Your Response:** Based on the context and rules, generate the narrative and an optional system message in the required JSON format.
`;

const modelMap: Record<AiModel, string> = {
    balanced: 'googleai/gemini-2.0-flash',
    creative: 'openai/gpt-4o',
    fast: 'deepseek/deepseek-chat',
    quality: 'googleai/gemini-1.5-pro',
};


// == STEP 4: DEFINE THE MAIN ORCHESTRATION FUNCTION ==
/**
 * The main function to be called from the frontend. This function orchestrates
 * the call to the AI, executes tools, and combines the results.
 * @param input The current game state and player action.
 * @returns A promise that resolves to the AI-generated narrative and state changes.
 */
export async function generateNarrative(input: GenerateNarrativeInput): Promise<GenerateNarrativeOutput> {
    const preferredModel = modelMap[input.aiModel] || modelMap.balanced;
    
    // Fallback chain, starting with the preferred model.
    const modelsToTry = [
        preferredModel,
        'googleai/gemini-2.0-flash',
        'deepseek/deepseek-chat',
        'openai/gpt-4o',
        'googleai/gemini-1.5-pro',
    ];
    const uniqueModelsToTry = [...new Set(modelsToTry)];
    
    let llmResponse;
    let lastError: any;

    for (const model of uniqueModelsToTry) {
        try {
            console.log(`[generateNarrative] Attempting generation with model: ${model}`);
            llmResponse = await ai.generate({
                model: model,
                prompt: narrativePromptTemplate,
                input: input,
                output: { schema: AINarrativeResponseSchema },
                tools: [playerAttackTool, takeItemTool, useItemTool, tameEnemyTool, useSkillTool, completeQuestTool, startQuestTool],
            });
            console.log(`[generateNarrative] SUCCESS with ${model}.`);
            break; // Exit loop on success
        } catch (error) {
            lastError = error;
            console.warn(`[generateNarrative] Model '${model}' failed. Trying next... Error: ${error.message}`);
        }
    }
  
    if (!llmResponse) {
      console.error("All AI models failed for narrative generation.", lastError);
      throw lastError || new Error("All models for narrative generation failed to generate a response.");
    }
  
  const toolCalls = llmResponse.usage?.toolCalls;

  const finalOutput: GenerateNarrativeOutput = {
    narrative: llmResponse.output?.narrative || 'An unexpected silence fills the air.',
    systemMessage: llmResponse.output?.systemMessage,
  };

  if (toolCalls && toolCalls.length > 0) {
      // Logic for chaining multiple tool calls (e.g., completeQuest then startQuest)
      if (toolCalls.length > 1) {
          const completedQuestCall = toolCalls.find(call => call.tool === 'completeQuest');
          const startQuestCall = toolCalls.find(call => call.tool === 'startQuest');

          if (completedQuestCall && startQuestCall) {
              const completedQuestText = (completedQuestCall.input as any).questText;
              const newQuestText = (startQuestCall.input as any).questText;

              let currentQuests = input.playerStatus.quests || [];
              currentQuests = currentQuests.filter(q => q !== completedQuestText);
              currentQuests.push(newQuestText);
              
              finalOutput.updatedPlayerStatus = { 
                  ...finalOutput.updatedPlayerStatus,
                  quests: currentQuests,
              };
              // Note: questsCompleted counter is handled with single quest completions below.
          }
      }


      const toolCall = toolCalls[0];
      const toolOutput = toolCall.output;

      if (toolCall.tool === 'playerAttack') {
          const result = toolOutput as z.infer<typeof playerAttackTool.outputSchema>;
          finalOutput.updatedPlayerStatus = { hp: result.finalPlayerHp };
          
          const shouldRemoveEnemy = result.enemyDefeated || result.fled;
          const newEnemyState = shouldRemoveEnemy ? null : { ...input.currentChunk.enemy!, hp: result.finalEnemyHp };
          finalOutput.updatedChunk = { enemy: newEnemyState };

          if (result.lootDrops && result.lootDrops.length > 0) {
            const currentItems = finalOutput.updatedChunk?.items || input.currentChunk.items || [];
            const newItemsMap = new Map<string, ChunkItemSchema>();
            currentItems.forEach(item => newItemsMap.set(item.name, { ...item }));
            result.lootDrops.forEach(droppedItem => {
                const existingItem = newItemsMap.get(droppedItem.name);
                if (existingItem) {
                    existingItem.quantity += droppedItem.quantity;
                } else {
                    newItemsMap.set(droppedItem.name, droppedItem);
                }
            });
            finalOutput.updatedChunk = { ...finalOutput.updatedChunk, items: Array.from(newItemsMap.values()) };
          }

      } else if (toolCall.tool === 'takeItem') {
          const result = toolOutput as z.infer<typeof takeItemTool.outputSchema>;
          finalOutput.updatedPlayerStatus = { items: result.updatedPlayerInventory };
          finalOutput.updatedChunk = { items: result.updatedChunkItems };
      } else if (toolCall.tool === 'useItem') {
          const result = toolOutput as z.infer<typeof useItemTool.outputSchema>;
          if (result.wasUsed) {
            finalOutput.updatedPlayerStatus = result.updatedPlayerStatus;
          }
      } else if (toolCall.tool === 'tameEnemy') {
          const result = toolOutput as z.infer<typeof tameEnemyTool.outputSchema>;
          finalOutput.updatedPlayerStatus = result.updatedPlayerStatus;
          finalOutput.updatedChunk = { enemy: result.updatedEnemy }; 
      } else if (toolCall.tool === 'useSkill') {
          const result = toolOutput as z.infer<typeof useSkillTool.outputSchema>;
          finalOutput.updatedPlayerStatus = result.updatedPlayerStatus;
          finalOutput.updatedChunk = { enemy: result.updatedEnemy };
      } else if (toolCall.tool === 'startQuest' && toolCalls.length === 1) { // Only handle if it's not part of a chain
          const result = toolOutput as z.infer<typeof startQuestTool.outputSchema>;
          const currentQuests = finalOutput.updatedPlayerStatus?.quests || input.playerStatus.quests || [];
          if (!currentQuests.includes(result.questStarted)) {
              finalOutput.updatedPlayerStatus = { 
                  ...finalOutput.updatedPlayerStatus,
                  quests: [...currentQuests, result.questStarted],
              };
          }
      } else if (toolCall.tool === 'completeQuest') {
          const result = toolOutput as z.infer<typeof completeQuestTool.outputSchema>;
          if (result.isCompleted) {
              let currentQuests = input.playerStatus.quests || [];
              const currentItems = input.playerStatus.items || [];
              const newItemsMap = new Map<string, PlayerItemSchema>();
              
              currentItems.forEach(item => newItemsMap.set(item.name, { ...item }));
              
              result.rewardItems?.forEach(rewardItem => {
                  const existingItem = newItemsMap.get(rewardItem.name);
                  if (existingItem) {
                      existingItem.quantity += rewardItem.quantity;
                  } else {
                      newItemsMap.set(rewardItem.name, rewardItem);
                  }
              });

              const completedQuestText = (toolCall.input as z.infer<typeof completeQuestTool.inputSchema>).questText;
              currentQuests = currentQuests.filter(q => q !== completedQuestText);
              const updatedItemsArray = Array.from(newItemsMap.values());
              const newQuestsCompletedCount = (input.playerStatus.questsCompleted || 0) + 1;

              finalOutput.updatedPlayerStatus = { 
                  ...finalOutput.updatedPlayerStatus,
                  quests: currentQuests,
                  items: updatedItemsArray,
                  questsCompleted: newQuestsCompletedCount,
              };
              
              // Only generate a new quest if we are NOT chaining from a legendary one
              if (!toolCalls.some(call => call.tool === 'startQuest')) {
                  try {
                      // Decide whether to generate a legendary quest or a normal one.
                      let newQuestResult;
                      const isLegendaryTime = newQuestsCompletedCount > 0 && newQuestsCompletedCount % 3 === 0;

                      if (isLegendaryTime) {
                          newQuestResult = await generateLegendaryQuest({
                              worldName: input.worldName,
                              playerStatus: { ...input.playerStatus, quests: currentQuests, items: updatedItemsArray },
                              currentChunk: input.currentChunk,
                              existingQuests: currentQuests,
                              language: input.language,
                          });
                      } else {
                          newQuestResult = await generateNewQuest({
                              worldName: input.worldName,
                              playerStatus: { ...input.playerStatus, quests: currentQuests, items: updatedItemsArray },
                              currentChunk: input.currentChunk,
                              existingQuests: currentQuests,
                              language: input.language,
                          });
                      }

                      if (newQuestResult.newQuest) {
                          const updatedQuestsWithNew = [...currentQuests, newQuestResult.newQuest];
                          finalOutput.updatedPlayerStatus.quests = updatedQuestsWithNew;
                          
                          const existingSystemMessage = finalOutput.systemMessage ? finalOutput.systemMessage + " " : "";
                          finalOutput.systemMessage = existingSystemMessage + `New quest: ${newQuestResult.newQuest}`;
                      }
                  } catch (e) {
                      console.error("Failed to generate a new quest after completion:", e);
                  }
              }

              // Silently generate a new item for the world
              try {
                  const allCurrentItemNames = [
                      ...Object.keys(staticItemDefinitions),
                      ...Object.keys(input.customItemDefinitions || {})
                  ];
                  
                  const newItem = await generateNewItem({
                      existingItemNames: allCurrentItemNames,
                      worldName: input.worldName,
                      playerPersona: input.playerStatus.persona,
                      language: input.language,
                  });
                  
                  if (newItem && !allCurrentItemNames.includes(newItem.name)) {
                      finalOutput.newlyGeneratedItem = newItem;
                  }
              } catch (e) {
                  console.error("Failed to generate new item after quest completion:", e);
                  // Fail silently as requested.
              }
          }
      }
  }

  return finalOutput;
}
