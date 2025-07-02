
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
import {z} from 'genkit';
import { PlayerStatusSchema, EnemySchema, ChunkSchema, ChunkItemSchema, PlayerItemSchema, ItemDefinitionSchema, GeneratedItemSchema } from '@/ai/schemas';
import { playerAttackTool, takeItemTool, useItemTool, tameEnemyTool, useSkillTool, completeQuestTool, startQuestTool } from '@/ai/tools/game-actions';
import { generateNewQuest } from './generate-new-quest';
import { generateNewItem } from './generate-new-item';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';


// == STEP 1: DEFINE THE INPUT SCHEMA ==
const SuccessLevelSchema = z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']);

const GenerateNarrativeInputSchema = z.object({
  worldName: z.string().describe("The name of the game world."),
  playerAction: z.string().describe("The action the player just performed. E.g., 'move north', 'attack wolf', 'explore area', 'pick up Healing Herb', 'use Heal', 'give wolf fang to hunter'."),
  playerStatus: PlayerStatusSchema.describe("The player's current status (HP, items, skills, etc.)."),
  currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is currently on. This includes dynamic weather effects."),
  recentNarrative: z.array(z.string()).describe("The last few entries from the narrative log to provide conversational context."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
  diceRoll: z.number().describe("The result of a d20 dice roll (1-20)."),
  successLevel: SuccessLevelSchema.describe("The categorized outcome of the dice roll."),
  customItemDefinitions: z.record(ItemDefinitionSchema).optional().describe("A map of AI-generated item definitions for the current game session."),
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
    structures: z.array(z.any()).optional(),
  }).optional().describe("Optional: Changes to the current game chunk based on the action's outcome."),
  updatedPlayerStatus: z.object({
    items: z.array(PlayerItemSchema).optional(),
    quests: z.array(z.string()).optional(),
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
    narrative: z.string().describe("The main narrative description of what happens next. This should be engaging and based on the player's action and the tool's result. It should be 2-4 sentences long."),
    systemMessage: z.string().optional().describe("An optional, short system message for important events (e.g., 'Item added to inventory', 'Quest updated', 'Quest Completed!')."),
});

const narrativePrompt = ai.definePrompt({
    name: 'narrativePrompt',
    input: { schema: GenerateNarrativeInputSchema },
    output: { schema: AINarrativeResponseSchema },
    tools: [playerAttackTool, takeItemTool, useItemTool, tameEnemyTool, useSkillTool, completeQuestTool, startQuestTool],
    prompt: `You are the Game Master for a text-based adventure game called '{{worldName}}'. Your role is to be a dynamic and creative storyteller.

**Core Task:**
1.  **Analyze Player Action:** Determine the player's intent based on '{{{playerAction}}}'.
2.  **Prioritize Quests:**
    - If the action completes a quest (e.g., 'give wolf fang to hunter' for quest 'Get wolf fang for hunter'), you MUST use \`completeQuestTool\`.
    - If the action involves an NPC giving a new quest, you MUST use \`startQuestTool\`.
3.  **Use Other Tools:** If no quest action is relevant, use the most appropriate tool (attack, take, use, tame, etc.).
4.  **Narrate the Outcome:** Craft an engaging 2-4 sentence narrative based on the tool's result AND the pre-determined 'successLevel'.

**Critical Rules:**
- **Success Level is Law:** The 'successLevel' ('{{successLevel}}') dictates the outcome. A 'Failure' MUST be narrated as a failure, a 'CriticalSuccess' as a legendary event.
- **NPC Dialogue:** If the player talks to an NPC, generate a short, in-character response. The NPC might offer hints, lore, or a new quest.
- **Incorporate Persona:** Weave the player's persona ('{{playerStatus.persona}}') into the story for flavor.
- **Creature Behavior:** Respect the creature's behavior. If the 'playerAttack' tool returns 'fled: true', your narrative MUST describe the creature running away.
- **Building Actions:** Guide players to use the dedicated 'Build' button for building actions. Do not use a tool for this. For example: 'To build something, it's best to use the dedicated Build menu.'
- **Language:** Your entire response MUST be in the language for this code: {{language}}.

**Context:**
- Player's Action: {{{playerAction}}}
- Dice Roll Outcome: {{diceRoll}} ({{successLevel}})
- Player's Status: {{json playerStatus}}
- Current Environment: {{json currentChunk}}
- Recent Events: {{json recentNarrative}}

**Your Response:** Based on the context and rules, generate the narrative and an optional system message in the required JSON format.
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
  
  const toolCalls = llmResponse.usage?.toolCalls;

  const finalOutput: GenerateNarrativeOutput = {
    narrative: llmResponse.output?.narrative || 'An unexpected silence fills the air.',
    systemMessage: llmResponse.output?.systemMessage,
  };

  if (toolCalls && toolCalls.length > 0) {
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
      } else if (toolCall.tool === 'startQuest') {
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

              const completedQuestText = (toolCall.input as any).questText;
              currentQuests = currentQuests.filter(q => q !== completedQuestText);
              const updatedItemsArray = Array.from(newItemsMap.values());

              finalOutput.updatedPlayerStatus = { 
                  ...finalOutput.updatedPlayerStatus,
                  quests: currentQuests,
                  items: updatedItemsArray,
              };
              
              try {
                  const newQuestResult = await generateNewQuest({
                      worldName: input.worldName,
                      playerStatus: { 
                          ...input.playerStatus, 
                          quests: currentQuests, 
                          items: updatedItemsArray 
                      },
                      currentChunk: input.currentChunk,
                      existingQuests: currentQuests,
                      language: input.language,
                  });

                  if (newQuestResult.newQuest) {
                      const updatedQuestsWithNew = [...currentQuests, newQuestResult.newQuest];
                      finalOutput.updatedPlayerStatus.quests = updatedQuestsWithNew;
                      
                      const existingSystemMessage = finalOutput.systemMessage ? finalOutput.systemMessage + " " : "";
                      finalOutput.systemMessage = existingSystemMessage + `New quest: ${newQuestResult.newQuest}`;
                  }
              } catch (e) {
                  console.error("Failed to generate a new quest after completion:", e);
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
