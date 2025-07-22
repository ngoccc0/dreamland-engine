'use server';

import { getTranslatedText } from "@/lib/utils";
// ai/flows/generate-narrative-flow.ts
/**
 * @fileOverview Luồng Kể Chuyện AI cho Dreamland Engine.
 *
 * File này định nghĩa luồng Genkit chịu trách nhiệm tạo ra các câu chuyện động, nhận biết ngữ cảnh
 * cho game. Nó hoạt động như một AI Game Master, lấy trạng thái game hiện tại và hành động của người chơi
 * để tạo ra một câu chuyện phong phú, luôn phát triển. Nó sử dụng các công cụ để thực hiện các phép tính
 * trạng thái game đáng tin cậy, bắt đầu nhiệm vụ mới từ NPC và xử lý việc hoàn thành nhiệm vụ.
 *
 * - `generateNarrative`: Hàm chính được gọi từ giao diện người dùng game.
 * - `GenerateNarrativeInput`: Zod schema cho dữ liệu đầu vào.
 * - `GenerateNarrativeOutput`: Zod schema cho phản hồi AI có cấu trúc.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { PlayerStatusSchema, EnemySchema, ChunkSchema, ChunkItemSchema, PlayerItemSchema, ItemDefinitionSchema, GeneratedItemSchema, NpcSchema, TranslatableStringSchema } from '@/ai/schemas';
import type { TranslatableString } from '@/lib/game/types';
import { LanguageEnum as Language } from '@/lib/i18n'; // Import Language enum

// SỬA: Import các schema đã đặt tên và các tool từ game-actions.ts
import { 
  playerAttackTool, PlayerAttackOutputSchema, 
  takeItemTool, TakeItemOutputSchema, 
  useItemTool, UseItemOutputSchema, 
  tameEnemyTool, TameEnemyOutputSchema, 
  useSkillTool, UseSkillOutputSchema, 
  completeQuestTool, CompleteQuestInputSchema, CompleteQuestOutputSchema, 
  startQuestTool, StartQuestOutputSchema 
} from '@/ai/tools/game-actions';

import { generateNewQuest } from './generate-new-quest';
import { generateLegendaryQuest } from './generate-legendary-quest-flow';
import { generateNewItem } from './generate-new-item';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import type { AiModel, NarrativeLength } from '@/lib/game/types';


// == STEP 1: DEFINE THE INPUT SCHEMA ==

/**
 * @description Schema định nghĩa cấp độ thành công của một lần tung xúc xắc.
 */
const SuccessLevelSchema = z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']);

/**
 * @description Schema định nghĩa đầu vào cho luồng `generateNarrative`.
 * @property {z.string} worldName - Tên của thế giới game.
 * @property {z.string} playerAction - Hành động người chơi vừa thực hiện.
 * @property {PlayerStatusSchema} playerStatus - Trạng thái hiện tại của người chơi.
 * @property {ChunkSchema} currentChunk - Các thuộc tính chi tiết của ô bản đồ hiện tại của người chơi.
 * @property {z.array} [surroundingChunks] - Lưới 3x3 các chunk xung quanh người chơi để cung cấp ngữ cảnh môi trường.
 * @property {z.array} recentNarrative - Một vài mục nhập gần đây từ nhật ký kể chuyện để cung cấp ngữ cảnh trò chuyện.
 * @property {z.string} language - Ngôn ngữ cho nội dung được tạo ('en' hoặc 'vi').
 * @property {z.number} diceRoll - Kết quả của lần tung xúc xắc.
 * @property {z.string} diceType - Loại xúc xắc được sử dụng (ví dụ: 'd20', '2d6').
 * @property {z.string} diceRange - Phạm vi có thể có của lần tung xúc xắc (ví dụ: '1-20', '2-12').
 * @property {SuccessLevelSchema} successLevel - Kết quả phân loại của lần tung xúc xắc.
 * @property {z.record} [customItemDefinitions] - Map các định nghĩa vật phẩm do AI tạo cho phiên chơi hiện tại.
 * @property {z.enum} aiModel - Ưu tiên mô hình AI để tạo nội dung.
 * @property {z.enum} narrativeLength - Độ dài mong muốn cho phản hồi kể chuyện.
 */
export const GenerateNarrativeInputSchema = z.object({
  worldName: z.string().describe("The name of the game world."),
  playerAction: z.string().describe("The action the player just performed. E.g., 'move north', 'attack wolf', 'explore area', 'pick up Healing Herb', 'use Heal', 'give wolf fang to hunter'."),
  playerStatus: PlayerStatusSchema.describe("The player's current status (HP, items, skills, etc.)."),
  currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is currently on. This includes dynamic weather effects and rich NPC data."),
  surroundingChunks: z.array(ChunkSchema).optional().describe("A 3x3 grid of chunks around the player for environmental context, especially for long narratives."),
  recentNarrative: z.array(z.string()).describe("The last few entries from the narrative log to provide conversational context."),
  language: z.nativeEnum(Language).describe("The language for the generated content (e.g., 'en', 'vi')."),
  diceRoll: z.number().describe("The result of the dice roll."),
  diceType: z.string().describe("The type of dice used (e.g., 'd20', '2d6')."),
  diceRange: z.string().describe("The possible range of the dice roll (e.g., '1-20', '2-12')."),
  successLevel: SuccessLevelSchema.describe("The categorized outcome of the dice roll."),
  customItemDefinitions: z.record(ItemDefinitionSchema).optional().describe("A map of AI-generated item definitions for the current game session."),
  aiModel: z.enum(['balanced', 'creative', 'fast', 'quality']).describe("The AI model preference for generation."),
  narrativeLength: z.enum(['short', 'medium', 'long']).describe("The desired length for the narrative response."),
});
/**
 * @typedef {z.infer<typeof GenerateNarrativeInputSchema>} GenerateNarrativeInput
 */
export type GenerateNarrativeInput = z.infer<typeof GenerateNarrativeInputSchema>;


// == STEP 2: DEFINE THE OUTPUT SCHEMA ==

/**
 * @description Schema định nghĩa đầu ra cuối cùng, kết hợp từ AI và các công cụ.
 * @property {z.string} narrative - Mô tả kể chuyện chính về những gì xảy ra tiếp theo.
 * @property {z.object} [updatedChunk] - Thay đổi tùy chọn đối với chunk game hiện tại dựa trên kết quả hành động.
 * @property {z.object} [updatedPlayerStatus] - Thay đổi tùy chọn đối với trạng thái của người chơi.
 * @property {z.string} [systemMessage] - Một thông báo hệ thống ngắn, tùy chọn cho các sự kiện quan trọng.
 * @property {GeneratedItemSchema} [newlyGeneratedItem] - Một vật phẩm mới được tạo ra để thêm lặng lẽ vào danh mục vật phẩm chính của thế giới.
 */
const GenerateNarrativeOutputSchema = z.object({
  narrative: z.string().describe("The main narrative description of what happens next."),
  updatedChunk: z.object({
    description: z.string().optional(),
    items: z.array(z.lazy(() => ChunkItemSchema)).optional(),
    NPCs: z.array(z.lazy(() => NpcSchema)).optional(),
    enemy: z.lazy(() => EnemySchema).nullable().optional(),
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
/**
 * @typedef {z.infer<typeof GenerateNarrativeOutputSchema>} GenerateNarrativeOutput
 */
export type GenerateNarrativeOutput = z.infer<typeof GenerateNarrativeOutputSchema>;


// == STEP 3: DEFINE THE AI PROMPT ==

/**
 * @description Schema đầu ra đơn giản hơn cho những gì chúng ta mong đợi từ việc tạo văn bản của AI.
 * Các thay đổi trạng thái sẽ đến từ các công cụ.
 * @property {z.string} narrative - Mô tả kể chuyện chính về những gì xảy ra tiếp theo.
 * @property {z.string} [systemMessage] - Một thông báo hệ thống ngắn, tùy chọn cho các sự kiện quan trọng.
 */
const AINarrativeResponseSchema = z.object({
    narrative: z.string().describe("The main narrative description of what happens next. This should be engaging and based on the player's action, the tool's result, and the requested narrativeLength ('short': 1-2 sentences, 'medium': 2-4, 'long': 5+)."),
    systemMessage: z.string().optional().describe("An optional, short system message for important events (e.g., 'Item added to inventory', 'Quest updated', 'Quest Completed!')."),
});

/**
 * @description Template cho lời nhắc (prompt) AI, hướng dẫn AI cách tạo ra câu chuyện.
 * Sử dụng các biến Mustache để chèn dữ liệu ngữ cảnh.
 */
const narrativePromptTemplate = `You are the Game Master for a text-based adventure game called '{{worldName}}'. Your role is to be a dynamic, multi-sensory, and creative storyteller. Your entire response MUST be in the language specified by the code '{{language}}' (e.g., 'en' for English, 'vi' for Vietnamese). This is a critical and non-negotiable instruction.

**Your Primary Role:**
Your main task is to interpret the player's action and craft a rich narrative based on the game's state. Simple mechanical outcomes are handled by tools; your job is to breathe life into those results.

**Core Task & Critical Rules:**
1.  **Analyze Player's Intent:** Based on '{{{playerAction}}}', understand what the player is trying to achieve.
2.  **Use Tools When Necessary:** For specific game state changes like attacking or taking items, you must use the provided tools. Your narrative should then reflect the tool's output.
3.  **Success Level is Law:** The 'successLevel' ('{{successLevel}}') dictates the outcome. A 'Failure' MUST be narrated as a failure, a 'CriticalSuccess' as a legendary event.
4.  **Narrative Length:** The length of your narrative MUST adhere to the '{{narrativeLength}}' parameter ('short': 1-2 sentences, 'medium': 2-4, 'long': 5+).

**--- DYNAMIC NARRATION GUIDELINES (VERY IMPORTANT) ---**
You MUST use the detailed 'Current Environment' context to make your descriptions vivid and dynamic. Do NOT just state the numbers; describe what they FEEL like.

-   **Movement & Exploration:** When the player moves to a new area or explores, your opening description is paramount. Weave in these elements:
    -   **Temperature & Wind (\`temperature\`, \`windLevel\`):** Is it a "biting cold," a "gentle breeze," a "stifling heat," or a "howling gale"?
    -   **Light & Moisture (\`lightLevel\`, \`moisture\`):** Is the area "bathed in bright sunlight," "shrouded in an eerie gloom," "damp and humid," or "arid and dusty"?
    -   **Vegetation & Terrain (\`vegetationDensity\`, \`explorability\`):** Describe the environment. Is it an "impenetrably dense jungle where every step is a struggle" (low explorability), or "wide-open plains easy to traverse" (high explorability)?
    -   **Presence & Danger (\`dangerLevel\`, \`humanPresence\`, \`predatorPresence\`):** Create atmosphere. Does the place feel "ominously silent" (high danger), or can you see "the faint remnants of an old campfire" (human presence)? Does it feel "teeming with unseen predators"?
    -   **Magic (\`magicAffinity\`):** Is there a "faint hum of magical energy in the air," or does it feel "strangely mundane and inert"?

**Context for Your Narration:**
-   **Player's Action:** {{{playerAction}}}
-   **Dice Roll Outcome:** {{diceRoll}} (on a {{diceType}} with range {{diceRange}}, resulting in {{successLevel}})
-   **Player's Status:** {{json playerStatus}}
-   **Current Environment:** {{json currentChunk}}
-   **Surrounding Area (3x3 grid):** {{#if surroundingChunks}}{{json surroundingChunks}}{{else}}Not provided.{{/if}}
-   **Recent Events:** {{json recentNarrative}}

**Your Response:** Based on ALL the context and rules above, especially the Dynamic Narration Guidelines, generate the narrative and an optional system message in the required JSON format.
`;

/**
 * @description Map các ưu tiên mô hình AI với các ID mô hình thực tế.
 */
const modelMap: Record<AiModel, string> = {
    balanced: 'googleai/gemini-2.0-flash',
    creative: 'openai/gpt-4o',
    fast: 'deepseek/deepseek-chat',
    quality: 'googleai/gemini-1.5-pro',
};


// == STEP 4: DEFINE THE MAIN ORCHESTRATION FUNCTION ==
/**
 * Hàm chính được gọi từ giao diện người dùng (frontend). Hàm này điều phối
 * việc gọi AI, thực thi các công cụ (tools) và kết hợp các kết quả.
 * @param {GenerateNarrativeInput} input - Trạng thái game hiện tại và hành động của người chơi.
 * @returns {Promise<GenerateNarrativeOutput>} - Một Promise giải quyết thành câu chuyện do AI tạo ra và các thay đổi trạng thái.
 */
export async function generateNarrative(input: GenerateNarrativeInput): Promise<GenerateNarrativeOutput> {
    const preferredModel = modelMap[input.aiModel] || modelMap.balanced;
    
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
                prompt: [{
                    text: "You are a narrative generator for an open-world game. Generate engaging and contextual narrative responses to player actions.",
                    custom: {
                        tools: [playerAttackTool, takeItemTool, useItemTool, tameEnemyTool, useSkillTool, completeQuestTool, startQuestTool]
                    }
                },
                {
                    text: narrativePromptTemplate,
                    custom: input
                }],
                tools: [playerAttackTool, takeItemTool, useItemTool, tameEnemyTool, useSkillTool, completeQuestTool, startQuestTool],
            });
            console.log(`[generateNarrative] SUCCESS with ${model}.`);
            break; 
        } catch (error: any) {
            lastError = error;
            console.warn(`[generateNarrative] Model '${model}' failed. Trying next... Error: ${error.message}`);
        }
    }
  
    if (!llmResponse) {
      console.error("All AI models failed for narrative generation.", lastError);
      throw lastError || new Error("All models for narrative generation failed to generate a response.");
    }

  const finalOutput: GenerateNarrativeOutput = {
    narrative: llmResponse.output?.narrative || 'An unexpected silence fills the air.',
    systemMessage: llmResponse.output?.systemMessage,
  };

  const toolCalls: Array<{ tool: string; input: any; output: any }> = (llmResponse as any).metadata?.toolCalls || [];

  if (toolCalls && toolCalls.length > 0) {
      if (toolCalls.length > 1) {
          const completedQuestCall = toolCalls.find((call) => call.tool === 'completeQuest');
          const startQuestCall = toolCalls.find((call) => call.tool === 'startQuest');

          if (completedQuestCall && startQuestCall) {
              const completedQuestText = (completedQuestCall.input as z.infer<typeof CompleteQuestInputSchema>).questText;
              const newQuestText = (startQuestCall.output as z.infer<typeof StartQuestOutputSchema>).questStarted;

              let currentQuests = input.playerStatus.quests || [];
              currentQuests = currentQuests.filter(q => q !== completedQuestText);
              if (!currentQuests.includes(newQuestText)) {
                currentQuests.push(newQuestText);
              }
              
              finalOutput.updatedPlayerStatus = { 
                  ...finalOutput.updatedPlayerStatus,
                  quests: currentQuests,
              };
          }
      }

      const toolCall = toolCalls[0];
      const toolOutput = toolCall.output;

      if (toolCall.tool === 'playerAttack') {
          const result = toolOutput as z.infer<typeof PlayerAttackOutputSchema>;
          finalOutput.updatedPlayerStatus = { hp: result.finalPlayerHp };
          
          const shouldRemoveEnemy = result.enemyDefeated || result.fled;
          const newEnemyState = shouldRemoveEnemy ? null : (input.currentChunk.enemy ? { ...input.currentChunk.enemy, hp: result.finalEnemyHp } : null);
          finalOutput.updatedChunk = { enemy: newEnemyState };

          if (result.lootDrops && result.lootDrops.length > 0) {
            const currentItems = finalOutput.updatedChunk?.items || input.currentChunk.items || [];
            const newItemsMap = new Map<string, z.infer<typeof ChunkItemSchema>>(); 
            // Sử dụng getTranslatedText để lấy tên item, nhận cả key dịch và inline translation
            currentItems.forEach(item => {
                const itemName = getTranslatedText(item.name, Language.en) || getTranslatedText(item.name, Language.vi) || '';
                newItemsMap.set(itemName, { ...item });
            });
            result.lootDrops?.forEach((droppedItem) => {
                const itemName = getTranslatedText(droppedItem.name, Language.en) || getTranslatedText(droppedItem.name, Language.vi) || '';
                const existingItem = newItemsMap.get(itemName);
                if (existingItem) {
                    existingItem.quantity += droppedItem.quantity;
                } else {
                    newItemsMap.set(itemName, droppedItem as z.infer<typeof ChunkItemSchema>);
                }
            });
            finalOutput.updatedChunk = { ...finalOutput.updatedChunk, items: Array.from(newItemsMap.values()) };
          }

      } else if (toolCall.tool === 'takeItem') {
          const result = toolOutput as z.infer<typeof TakeItemOutputSchema>;
          finalOutput.updatedPlayerStatus = { items: result.updatedPlayerInventory };
          finalOutput.updatedChunk = { items: result.updatedChunkItems };
      } else if (toolCall.tool === 'useItem') {
          const result = toolOutput as z.infer<typeof UseItemOutputSchema>;
          if (result.wasUsed) {
            finalOutput.updatedPlayerStatus = result.updatedPlayerStatus;
          }
      } else if (toolCall.tool === 'tameEnemy') {
          const result = toolOutput as z.infer<typeof TameEnemyOutputSchema>;
          finalOutput.updatedPlayerStatus = result.updatedPlayerStatus;
          finalOutput.updatedChunk = { enemy: result.updatedEnemy }; 
      } else if (toolCall.tool === 'useSkill') {
          const result = toolOutput as z.infer<typeof UseSkillOutputSchema>;
          finalOutput.updatedPlayerStatus = result.updatedPlayerStatus;
          finalOutput.updatedChunk = { enemy: result.updatedEnemy };
      } else if (toolCall.tool === 'startQuest' && toolCalls.length === 1) {
          const result = toolOutput as z.infer<typeof StartQuestOutputSchema>;
          const currentQuests = finalOutput.updatedPlayerStatus?.quests || input.playerStatus.quests || [];
          if (!currentQuests.includes(result.questStarted)) {
              finalOutput.updatedPlayerStatus = { 
                  ...finalOutput.updatedPlayerStatus,
                  quests: [...currentQuests, result.questStarted],
              };
          }
      } else if (toolCall.tool === 'completeQuest') {
          const result = toolOutput as z.infer<typeof CompleteQuestOutputSchema>;
          if (result.isCompleted) {
              let currentQuests = input.playerStatus.quests || [];
              const currentItems = input.playerStatus.items || [];
              const newItemsMap = new Map<string, z.infer<typeof PlayerItemSchema>>();
              
              currentItems.forEach(item => {
                const itemName = getTranslatedText(item.name, Language.en) || getTranslatedText(item.name, Language.vi) || '';
                newItemsMap.set(itemName, { ...item });
              });
              
              result.rewardItems?.forEach((rewardItem) => {
                  const rewardItemName = getTranslatedText(rewardItem.name, Language.en) || getTranslatedText(rewardItem.name, Language.vi) || '';
                  const existingItem = newItemsMap.get(rewardItemName);
                  if (existingItem) {
                      existingItem.quantity += rewardItem.quantity;
                  } else {
                      newItemsMap.set(rewardItemName, rewardItem);
                  }
              });

              const completedQuestText = (toolCall.input as z.infer<typeof CompleteQuestInputSchema>).questText;
              currentQuests = currentQuests.filter(q => q !== completedQuestText);
              const updatedItemsArray = Array.from(newItemsMap.values());
              const newQuestsCompletedCount = (input.playerStatus.questsCompleted || 0) + 1;

              finalOutput.updatedPlayerStatus = { 
                  ...finalOutput.updatedPlayerStatus,
                  quests: currentQuests,
                  items: updatedItemsArray,
                  questsCompleted: newQuestsCompletedCount,
              };
              
              if (!toolCalls.some((call) => call.tool === 'startQuest')) { 
                  try {
                      let newQuestResult;
                      const isLegendaryTime = newQuestsCompletedCount > 0 && newQuestsCompletedCount % 3 === 0;

                      if (isLegendaryTime) {
                          newQuestResult = await generateLegendaryQuest({
                              worldName: input.worldName,
                              playerStatus: { ...input.playerStatus, quests: currentQuests, items: updatedItemsArray },
                              currentChunk: input.currentChunk,
                              existingQuests: currentQuests,
                              language: input.language as "en" | "vi", 
                          });
                      } else {
                          newQuestResult = await generateNewQuest({
                              worldName: input.worldName,
                              playerStatus: { ...input.playerStatus, quests: currentQuests, items: updatedItemsArray },
                              currentChunk: input.currentChunk,
                              existingQuests: currentQuests,
                              language: input.language as "en" | "vi", 
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

              try {
                  const allCurrentItemNames = [
                      ...Object.keys(staticItemDefinitions),
                      ...Object.keys(input.customItemDefinitions || {})
                  ];
                  
                  const newItem = await generateNewItem({
                      existingItemNames: allCurrentItemNames,
                      worldName: input.worldName,
                      playerPersona: input.playerStatus.persona,
                      language: input.language as "en" | "vi", 
                  });
                  
                  const newIndeedItemName = getTranslatedText(newItem.name, Language.en) || getTranslatedText(newItem.name, Language.vi) || '';
                  if (newItem && !allCurrentItemNames.includes(newIndeedItemName)) {
                      finalOutput.newlyGeneratedItem = newItem;
                  }
              } catch (e) {
                  console.error("Failed to generate new item after quest completion:", e);
              }
          }
      }
  }

  return finalOutput;
}
