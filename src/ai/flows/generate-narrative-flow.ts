'use server';
/**
 * @fileOverview The AI Storyteller flow.
 *
 * This file defines the Genkit flow responsible for generating dynamic, context-aware narratives
 * for the game. It acts as an AI Game Master, taking the current game state and player action
 * to produce a rich, evolving story.
 *
 * - generateNarrative - The main function called by the game layout.
 * - GenerateNarrativeInput - The Zod schema for the input data.
 * - GenerateNarrativeOutput - The Zod schema for the structured AI response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schemas that mirror the game's data structures from `src/lib/game/types.ts`.
// It's important to keep these in sync with the actual types.

const PlayerAttributesSchema = z.object({
    physicalAttack: z.number().describe("Player's base physical damage."),
    magicalAttack: z.number().describe("Player's base magical damage."),
    critChance: z.number().describe("Player's chance to land a critical hit (percentage)."),
    attackSpeed: z.number().describe("Player's attack speed modifier."),
    cooldownReduction: z.number().describe("Player's cooldown reduction (percentage)."),
});

const PlayerItemSchema = z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    tier: z.number(),
});

const PlayerStatusSchema = z.object({
    hp: z.number(),
    mana: z.number(),
    stamina: z.number().describe("Player's stamina, used for physical actions."),
    items: z.array(PlayerItemSchema).describe("Player's inventory with item names, quantities, and tiers."),
    quests: z.array(z.string()),
    attributes: PlayerAttributesSchema.describe("Player's combat attributes."),
});

const EnemySchema = z.object({
    type: z.string(),
    hp: z.number(),
    damage: z.number(),
    behavior: z.enum(['aggressive', 'passive']),
    diet: z.array(z.string()).describe("A list of food items or creature types this enemy eats, influencing its behavior and potential for taming."),
    satiation: z.number().describe("The creature's current hunger level. When it reaches maxSatiation, it is full."),
    maxSatiation: z.number().describe("The satiation level at which the creature is considered full and may try to reproduce."),
});

const ChunkItemSchema = z.object({
    name: z.string(),
    description: z.string(),
    quantity: z.number().int(),
    tier: z.number(),
});

const ChunkSchema = z.object({
    x: z.number(),
    y: z.number(),
    terrain: z.enum(["forest", "grassland", "desert", "swamp", "mountain", "cave"]),
    description: z.string(),
    NPCs: z.array(z.string()),
    items: z.array(ChunkItemSchema).describe("Items present in the chunk, with quantities and tiers."),
    explored: z.boolean(),
    enemy: EnemySchema.nullable(),
    // We only need a subset of the full chunk attributes for the AI's context.
    vegetationDensity: z.number(),
    moisture: z.number(),
    elevation: z.number(),
    lightLevel: z.number(),
    dangerLevel: z.number(),
    magicAffinity: z.number(),
    humanPresence: z.number(),
    predatorPresence: z.number(),
});

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
const GenerateNarrativeOutputSchema = z.object({
  narrative: z.string().describe("The main narrative description of what happens next. This should be engaging and based on the player's action and the environment. It should be 2-4 sentences long."),
  updatedChunk: z.object({
    // The AI can suggest changes to the current chunk.
    description: z.string().optional().describe("A new base description for the chunk if something significant changes."),
    items: z.array(ChunkItemSchema).optional().describe("The new list of items in the chunk. Used to add or remove items. If an item's quantity is depleted, it should be removed from this list."),
    NPCs: z.array(z.string()).optional().describe("The new list of NPCs in the chunk."),
    enemy: EnemySchema.nullable().optional().describe("The state of the enemy in the chunk. Set to null if the enemy is defeated or flees."),
  }).optional().describe("Optional: Changes to the current game chunk based on the action's outcome."),
  updatedPlayerStatus: z.object({
    // The AI can suggest changes to the player's status.
    items: z.array(PlayerItemSchema).optional().describe("The player's new inventory, reflecting any items picked up or used. If an item is picked up, its quantity should be incremented or a new entry added."),
    quests: z.array(z.string()).optional().describe("The player's new quest list."),
    hp: z.number().optional().describe("The player's new HP, if they took damage or healed."),
    mana: z.number().optional().describe("The player's new Mana, if they cast a spell."),
    stamina: z.number().optional().describe("The player's new Stamina, if they performed a physical action."),
  }).optional().describe("Optional: Changes to the player's status."),
  systemMessage: z.string().optional().describe("An optional, short system message for important events (e.g., 'Item added to inventory', 'Quest updated')."),
});
export type GenerateNarrativeOutput = z.infer<typeof GenerateNarrativeOutputSchema>;


/**
 * The main function to be called from the frontend.
 * @param input The current game state and player action.
 * @returns A promise that resolves to the AI-generated narrative and state changes.
 */
export async function generateNarrative(input: GenerateNarrativeInput): Promise<GenerateNarrativeOutput> {
  return generateNarrativeFlow(input);
}


// == STEP 3: DEFINE THE AI PROMPT ==
const narrativePrompt = ai.definePrompt({
    name: 'narrativePrompt',
    input: { schema: GenerateNarrativeInputSchema },
    output: { schema: GenerateNarrativeOutputSchema },
    prompt: `You are the Game Master for a text-based adventure game called '{{worldName}}'.
Your role is to be a dynamic and creative storyteller and combat manager. You will receive the player's current status, details about their environment, their most recent action, and conversational context. Based on this, you must generate a compelling narrative and determine the logical outcomes, including changes to the game state.

**Your Primary Rules:**
1.  **Be a Storyteller:** Write an engaging, descriptive narrative (2-4 sentences) that brings the world to life. Do not just repeat the chunk description. Build upon it based on the player's action.
2.  **Be a Rules-Engine:** Logically determine the consequences of the player's action. If the action changes the environment or the player's status, you MUST reflect those changes in the 'updatedChunk' and 'updatedPlayerStatus' fields.
3.  **Item Tiers:** All items have a 'tier' from 1 (common) to 6 (legendary). When creating or modifying items, ensure this tier is present and logical. A simple crafted item should be tier 1. A legendary artifact found in a boss fight could be tier 5 or 6.
4.  **Be Creative:** Use the provided chunk attributes (dangerLevel, magicAffinity, etc.) to influence the tone and events. A high dangerLevel might mean more dangerous outcomes. High magicAffinity could lead to strange phenomena.
5.  **Language and Translation:** Your entire response MUST be in the language corresponding to this code: {{language}}. The input context you receive (like item names, enemy names, descriptions in \`currentChunk\` and \`playerStatus\`) is primarily in Vietnamese. You MUST translate these Vietnamese names and concepts into the target language ({{language}}) before using them in your narrative and state updates. For example, if the input shows an enemy "Sói" and the language is 'en', you must refer to it as "Wolf" in your response. If you create new items, they must also be in the target language.
6.  **Ecosystem Awareness:** The 'diet', 'satiation', and 'maxSatiation' fields for enemies tell you about a creature's state. A hungry creature ('satiation' is low) might be more aggressive or desperate. A full creature might be passive or preparing to reproduce. Use this to color your narrative when relevant.

**Specific Action-Handling:**

*   **Exploration:** If a player explores, describe what they find or see. Instead of "You explore", say "As you search the dense undergrowth, you uncover a moss-covered stone marker with faint, unreadable runes."
*   **Item Interaction (Take All):** If the player picks up an item (e.g., "pick up Healing Herb"), you MUST update the state to move the ENTIRE STACK. For example, if the chunk has an item \`{ "name": "Healing Herb", "description": "...", "quantity": 5, "tier": 1 }\` and the action is "pick up Healing Herb":
    1.  In \`updatedChunk.items\`, REMOVE the 'Healing Herb' entry entirely from the list.
    2.  In \`updatedPlayerStatus.items\`, find 'Healing Herb'. If it exists, increment its quantity by 5. If it doesn't exist, add \`{ "name": "Healing Herb", "quantity": 5, "tier": 1 }\` to the list.
    3.  Generate a system message reflecting the quantity, like "5 Healing Herbs added to inventory."
*   **Item Usage:** If the player uses an item from their inventory (e.g., "use Healing Potion"), you MUST update their status:
    1.  In \`updatedPlayerStatus.items\`, find the item and DECREMENT its quantity by 1.
    2.  If the quantity becomes 0, REMOVE the item from the \`updatedPlayerStatus.items\` list.
    3.  Apply the item's effect (e.g., for a Healing Potion, increase the player's HP in \`updatedPlayerStatus.hp\`).
    4.  The narrative should describe the action and its effect.
*   **Combat:** If the player attacks an enemy, you will handle the **entire combat round**:
    1.  **Player's Attack:** Describe the player's attack. Use the \`playerStatus.attributes.physicalAttack\` value as the damage dealt to the enemy.
    2.  **Update Enemy HP:** Subtract the damage from the enemy's HP and reflect this change in \`updatedChunk.enemy.hp\`.
    3.  **Check for Defeat:** If the enemy's HP is 0 or less, describe its defeat and set \`updatedChunk.enemy\` to \`null\`. The combat round ends.
    4.  **Enemy's Counter-Attack:** If the enemy survives, it **must** retaliate. Describe a creative counter-attack that fits the enemy's type (e.g., a wolf bites, a goblin uses a crude weapon). Use the \`currentChunk.enemy.damage\` value as the damage dealt to the player.
    5.  **Update Player HP:** Subtract the enemy's damage from the player's HP and reflect this change in \`updatedPlayerStatus.hp\`.

**Context:**
- Player's Action: {{{playerAction}}}
- Player's Status: {{json playerStatus}}
- Current Environment (Chunk): {{json currentChunk}}
- Recent Events: {{json recentNarrative}}

**Task:**
Generate the response in the required JSON format based on all the rules above.
`,
});


// == STEP 4: DEFINE THE GENKIT FLOW ==
const generateNarrativeFlow = ai.defineFlow(
  {
    name: 'generateNarrativeFlow',
    inputSchema: GenerateNarrativeInputSchema,
    outputSchema: GenerateNarrativeOutputSchema,
  },
  async (input) => {
    const {output} = await narrativePrompt(input);
    return output!;
  }
);
