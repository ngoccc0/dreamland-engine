
'use server';
/**
 * @fileOverview The AI Storyteller flow.
 *
 * This file defines the Genkit flow responsible for generating dynamic, context-aware narratives
 * for the game. It acts as an AI Game Master, taking the current game state and player action
 * to produce a rich, evolving story. It uses tools to perform reliable game state calculations
 * and now also checks for quest completion.
 *
 * - generateNarrative - The main function called by the game layout.
 * - GenerateNarrativeInput - The Zod schema for the input data.
 * - GenerateNarrativeOutput - The Zod schema for the structured AI response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PlayerStatusSchema, EnemySchema, ChunkSchema, ChunkItemSchema, PlayerItemSchema, ItemDefinitionSchema } from '@/ai/schemas';
import { playerAttackTool, takeItemTool, useItemTool, tameEnemyTool, useSkillTool, completeQuestTool } from '@/ai/tools/game-actions';

// == STEP 1: DEFINE THE INPUT SCHEMA ==
const SuccessLevelSchema = z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']);

const GenerateNarrativeInputSchema = z.object({
  worldName: z.string().describe("The name of the game world."),
  playerAction: z.string().describe("The action the player just performed. E.g., 'move north', 'attack wolf', 'explore area', 'pick up Healing Herb', 'use Heal', 'give wolf fang to hunter'."),
  playerStatus: PlayerStatusSchema.describe("The player's current status (HP, items, skills, etc.)."),
  currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is currently on. This includes dynamic weather effects."),
  recentNarrative: z.array(z.string()).describe("The last few entries from the narrative log to provide conversational context."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
  customItemDefinitions: z.record(ItemDefinitionSchema).optional().describe("An optional map of AI-generated item definitions specific to this game world."),
  diceRoll: z.number().describe("The result of a d20 dice roll (1-20)."),
  successLevel: SuccessLevelSchema.describe("The categorized outcome of the dice roll."),
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
    tools: [playerAttackTool, takeItemTool, useItemTool, tameEnemyTool, useSkillTool, completeQuestTool],
    prompt: `You are the Game Master for a text-based adventure game called '{{worldName}}'.
Your role is to be a dynamic and creative storyteller. You will receive the player's action, the result of a d20 dice roll, and the game state. Your primary job is to call the correct tool to execute the action (if necessary), and then use the tool's result AND the dice roll outcome to write a compelling narrative.

**Dice Rolls & Success Levels:**
All player actions are accompanied by a d20 roll, categorized into a success level. Your narrative MUST strictly follow this outcome.
- **CriticalFailure (Roll: 1):** The action fails spectacularly, backfires, or has a negative, unintended consequence.
- **Failure (Roll: 2-8):** The action simply fails. No progress is made.
- **Success (Roll: 9-16):** The action succeeds as expected. This is the normal outcome.
- **GreatSuccess (Roll: 17-19):** The action succeeds with an extra bonus, flair, or positive detail.
- **CriticalSuccess (Roll: 20):** An amazing, legendary outcome. The action succeeds beyond all expectations, providing a significant advantage or revealing something new.

**Player Persona:** The player has developed a persona based on their actions: '{{playerStatus.persona}}'.
- If 'explorer', their movements are efficient and perceptive.
- If 'warrior', their attacks are practiced and powerful.
- If 'artisan', their hands are skilled in crafting.
- If 'none', they are a jack-of-all-trades.
Incorporate this into your narrative for subtle flavor. For example, 'As a seasoned explorer, you quickly find the easiest path.' or 'Your warrior instincts take over as you launch a precise strike.'

**Your Primary Rules:**
1.  **Quest-Awareness (IMPORTANT FIRST STEP):** Before anything else, review the player's active quests: '{{json playerStatus.quests}}'. If you believe the player's action ('{{{playerAction}}}') directly fulfills the requirements of one of these quests (e.g., giving a specific item to an NPC, defeating a target), you MUST call the 'completeQuest' tool. The tool will handle giving a reward. Your narrative should then describe the quest completion based on the tool's output.
2.  **Respect the Dice:** The 'successLevel' is the absolute source of truth for the outcome. If the level is 'Failure', you MUST narrate a failure, even if a tool is called. If the level is 'CriticalSuccess', narrate a legendary outcome.
3.  **Use Tools for Logic:** You MUST use the provided tools to handle game logic.
    *   If the player's action is to attack, call the 'playerAttack' tool. The tool calculates the base damage. **Your narration should then modify this based on the 'successLevel'**. A 'Success' is normal damage. A 'GreatSuccess' might be a well-aimed shot that does a bit more. A 'Failure' could be a complete miss. If the tool reports that the enemy was defeated and returns 'lootDrops', your narrative MUST describe the player finding these items on the creature's body. If the tool returns a 'combatLog', you should incorporate that information into your narrative (e.g., 'The heavy rain made your swing clumsy...').
    *   If the player's action is to take an item, or use an item on themselves, call the appropriate tool. A 'Failure' might mean the player fumbles and drops the item, so the tool action doesn't complete.
    *   If the player's action is to use an item ON a creature (e.g. 'give meat to wolf', 'use food on creature'), you MUST call the 'tameEnemy' tool. The tool will determine if the creature can be tamed. Your narration should reflect the outcome.
    *   **If the player's action is to use or cast a skill (e.g. 'use Heal', 'cast Fireball'), you MUST call the 'useSkill' tool.** The tool now incorporates the 'successLevel' to determine the outcome (fizzle, success, critical hit) and handles all state changes (mana, HP, etc.). Your job is simply to narrate the factual 'log' that the tool returns.
    *   **Building Actions:** If the player tries to build something (e.g., 'build campfire'), do not use a tool. Instead, gently guide them in your narrative to use the dedicated "Build" button in the game interface. For example: 'To build something, it's best to use the dedicated Build menu.'
    *   For simple exploration or observation, you do not need to call a tool, but the 'successLevel' still dictates what the player finds. A 'Failure' might mean they see nothing, while a 'CriticalSuccess' could reveal a hidden passage.
4.  **Narrate the Results:** Combine the dice outcome and any tool results to craft a story. DO NOT invent outcomes or numbers that contradict the dice or tools. If a tool provides a 'combatLog', a taming 'log', or a skill usage 'log', use it.
5.  **Respect Creature Behavior:** Creatures now have distinct personalities. Your narration MUST reflect their behavior as described by the tool's output.
    *   **aggressive:** These creatures attack on sight, often driven by hunger.
    *   **defensive:** These creatures (like boars) won't attack first, but will fight back fiercely if attacked.
    *   **territorial:** These creatures (like spiders or bears) will attack anyone who threatens their space.
    *   **passive:** These creatures (like rabbits or bats) will attempt to flee when attacked. If the 'playerAttack' tool returns 'fled: true', your narrative MUST describe the creature running away instead of fighting.
6.  **Be a Storyteller:** Write an engaging, descriptive narrative (2-4 sentences) that brings the world to life.
7.  **Language and Translation:** Your entire response MUST be in the language corresponding to this code: {{language}}.

**Context:**
- Player's Action: {{{playerAction}}}
- Dice Roll: {{diceRoll}} ({{successLevel}})
- Player's Status: {{json playerStatus}}
- Current Environment (Chunk): {{json currentChunk}}
- Recent Events: {{json recentNarrative}}
- Custom Item Definitions: {{json customItemDefinitions}}

**Task:**
1.  Analyze the player's action and active quests to see if a quest is completed. If so, call 'completeQuest'.
2.  If no quest is completed, analyze the action and the 'successLevel'.
3.  If the action involves game logic (attack, use item, tame, use skill), call the appropriate tool.
4.  Based on the tool's output AND the dice roll 'successLevel', generate the narrative and an optional system message in the required JSON format.
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
          
          // If creature fled OR was defeated, it is removed from the chunk.
          const shouldRemoveEnemy = result.enemyDefeated || result.fled;
          const newEnemyState = shouldRemoveEnemy ? null : { ...input.currentChunk.enemy!, hp: result.finalEnemyHp };
          finalOutput.updatedChunk = { enemy: newEnemyState };

          // Handle loot drops by adding them to the chunk's items
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
          finalOutput.updatedChunk = { enemy: result.updatedEnemy }; // This will be null if tamed
      } else if (toolCall.tool === 'useSkill') {
          const result = toolOutput as z.infer<typeof useSkillTool.outputSchema>;
          finalOutput.updatedPlayerStatus = result.updatedPlayerStatus;
          finalOutput.updatedChunk = { enemy: result.updatedEnemy };
      } else if (toolCall.tool === 'completeQuest') {
          const result = toolOutput as z.infer<typeof completeQuestTool.outputSchema>;
          if (result.isCompleted) {
              const currentQuests = input.playerStatus.quests || [];
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

              finalOutput.updatedPlayerStatus = { 
                  ...finalOutput.updatedPlayerStatus,
                  quests: currentQuests.filter(q => q !== (toolCall.input as any).questText),
                  items: Array.from(newItemsMap.values()),
              };
          }
      }
  }

  return finalOutput;
}
