/**
 * @fileOverview Centralized Zod schemas for AI flows and tools.
 *
 * This file acts as an "adapter" or "port" for the AI layer. It imports the
 * core game definitions from `src/lib/game/definitions` and exports them for use
 * by Genkit flows and tools. This ensures the AI operates on the same a
 * single source of truth as the game engine itself.
 */

import {z} from 'genkit';
import { 
    ItemDefinitionSchema,
    ItemCategorySchema, 
    ItemEffectSchema, 
    PlayerAttributesSchema, 
    SpawnConditionsSchema,
    RecipeSchema,
    RecipeResultSchema,
    RecipeIngredientSchema,
    StructureSchema,
    MultilingualTextSchema,
    CreatureDefinitionSchema,
    allTerrains,
} from '@/lib/game/definitions';

// --- Re-exporting core schemas for AI use ---
export { 
    ItemDefinitionSchema,
    ItemCategorySchema,
    ItemEffectSchema, 
    PlayerAttributesSchema, 
    SpawnConditionsSchema,
    RecipeSchema,
    RecipeResultSchema,
    RecipeIngredientSchema,
    StructureSchema,
    CreatureDefinitionSchema
};
export type { Recipe }

// === Schemas tailored for specific AI inputs/outputs ===

// --- Player & World State Schemas (used as input for AI) ---

export const PlayerItemSchema = z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    tier: z.number(),
    emoji: z.string(),
});

export const PetSchema = z.object({
    type: z.string().describe("The type of creature, e.g., 'Sói'."),
    name: z.string().optional().describe("A custom name given by the player."),
    level: z.number().describe("The pet's level."),
});
export type Pet = z.infer<typeof PetSchema>;

export const SkillSchema = z.object({
    name: z.string().describe("The name of the skill."),
    description: z.string().describe("A brief description of what the skill does."),
    tier: z.number().describe("The tier of the skill, from 1 (basic) to higher tiers (advanced)."),
    manaCost: z.number().describe("The amount of mana required to use the skill."),
    effect: z.object({
        type: z.enum(['HEAL', 'DAMAGE', 'TELEPORT']).describe("The type of effect."),
        amount: z.number().describe("The amount of healing or damage."),
        target: z.enum(['SELF', 'ENEMY']).describe("Who the skill affects."),
        healRatio: z.number().optional().describe("For damaging skills, the percentage of damage dealt that is returned as health to the caster."),
    }),
    unlockCondition: z.object({
        type: z.enum(['kills', 'damageSpells', 'moves']),
        count: z.number(),
    }).optional(),
});

export const PlayerStatusSchema = z.object({
    hp: z.number(),
    mana: z.number(),
    stamina: z.number().describe("Player's stamina, used for physical actions."),
    items: z.array(PlayerItemSchema).describe("Player's inventory with item names, quantities, and tiers."),
    equipment: z.object({ 
        weapon: PlayerItemSchema.nullable().optional(), 
        armor: PlayerItemSchema.nullable().optional(), 
        accessory: PlayerItemSchema.nullable().optional() 
    }).optional().describe("The player's equipped items."),
    quests: z.array(z.string()),
    questsCompleted: z.number().optional().default(0).describe("The total number of quests the player has completed."),
    skills: z.array(SkillSchema).describe("The skills the player knows."),
    attributes: PlayerAttributesSchema.describe("Player's combat attributes."),
    pets: z.array(PetSchema).optional().describe("A list of the player's tamed companions."),
    persona: z.enum(['none', 'explorer', 'warrior', 'artisan']).optional().default('none').describe("The player's determined playstyle, which may grant subtle bonuses."),
    unlockProgress: z.object({
        kills: z.number(),
        damageSpells: z.number(),
        moves: z.number(),
    }).describe("Tracks player actions to unlock new skills."),
    journal: z.record(z.string()).optional().describe("A record of daily journal entries written by the AI, indexed by day number."),
    dailyActionLog: z.array(z.string()).optional().describe("A log of player actions taken during the current day, used for journaling."),
    questHints: z.record(z.string()).optional().describe("A map of quest texts to their AI-generated hints."),
    language: z.enum(['en', 'vi']).optional().describe("The player's current language preference."),
});

export const EnemySchema = CreatureDefinitionSchema.pick({
    type: true, emoji: true, hp: true, damage: true, behavior: true, size: true, diet: true, satiation: true, maxSatiation: true
});

export const ChunkItemSchema = z.object({
    name: z.string(),
    description: z.string(),
    quantity: z.number().int(),
    tier: z.number(),
    emoji: z.string(),
});

export const NpcSchema = z.object({
    name: z.string().describe("The full name of the NPC."),
    description: z.string().describe("A brief physical and personality description of the NPC."),
    dialogueSeed: z.string().describe("A sentence that captures their personality and current mood, to be used by the AI as a basis for generating dialogue. E.g., 'A grizzled hunter, tired but watchful, who speaks in short, clipped sentences.'"),
});
export type Npc = z.infer<typeof NpcSchema>;


export const ChunkSchema = z.object({
    x: z.number(),
    y: z.number(),
    terrain: z.enum(allTerrains),
    description: z.string(),
    NPCs: z.array(NpcSchema),
    items: z.array(ChunkItemSchema).describe("Items present in the chunk, with quantities and tiers."),
    structures: z.array(StructureSchema).optional().describe("Structures present in the chunk."),
    explored: z.boolean(),
    enemy: EnemySchema.nullable(),
    // These detailed attributes are now included for the AI to have full context
    vegetationDensity: z.number(),
    moisture: z.number(),
    elevation: z.number(),
    lightLevel: z.number(),
    dangerLevel: z.number(),
    magicAffinity: z.number(),
    humanPresence: z.number(),
    predatorPresence: z.number(),
    temperature: z.number().optional(), // Now optional to handle dynamic calculation
    windLevel: z.number().optional(),   // Now optional to handle dynamic calculation
});

// --- Schemas for AI-driven Generation Flows ---

// Output for generate-world-setup flow
export const GeneratedItemSchema = ItemDefinitionSchema;

export const NarrativeConceptSchema = z.object({
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});
export const NarrativeConceptArraySchema = z.array(NarrativeConceptSchema).length(3);


// --- Schemas for AI-driven Gameplay Flows ---

// Input for generate-new-quest flow
export const GenerateNewQuestInputSchema = z.object({
    worldName: z.string().describe("The name of the game world for thematic consistency."),
    playerStatus: PlayerStatusSchema.describe("The player's current status (HP, items, skills, etc.)."),
    currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is on."),
    existingQuests: z.array(z.string()).describe("A list of quests the player already has, to avoid duplicates."),
    language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// Output for generate-new-quest flow
export const GenerateNewQuestOutputSchema = z.object({
    newQuest: z.string().describe("A single, short, and engaging quest objective."),
});

// Input for generate-new-item flow
export const GenerateNewItemInputSchema = z.object({
    existingItemNames: z.array(z.string()).describe("A list of the names of ALL items that already exist in the world, to avoid generating duplicates."),
    worldName: z.string().describe("The name of the game world for thematic consistency."),
    playerPersona: PlayerStatusSchema.shape.persona,
    language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// Input for provide-quest-hint flow
export const ProvideQuestHintInputSchema = z.object({
    questText: z.string().describe("The full text of the quest for which a hint is needed."),
    language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// Output for provide-quest-hint flow
export const ProvideQuestHintOutputSchema = z.object({
    hint: z.string().describe("A single, short, helpful (but not spoiler-heavy) hint for the quest."),
});

// Input for fuse-items flow
const EnvironmentalModifiersSchema = z.object({
  successChanceBonus: z.number().describe("A pre-calculated percentage bonus (e.g., 5 for +5%) to the success chance based on environmental factors like weather or magic affinity."),
  elementalAffinity: z.enum(['none', 'fire', 'water', 'earth', 'air', 'electric', 'ice', 'nature', 'dark', 'light']).describe("A dominant elemental theme suggested by the environment (e.g., 'electric' during a storm)."),
  chaosFactor: z.number().min(0).max(10).describe("A pre-calculated score (0-10) indicating how chaotic or unpredictable the environment is. High values increase the chance of strange outcomes."),
});

export const FuseItemsInputSchema = z.object({
  itemsToFuse: z.array(PlayerItemSchema).min(2).max(3).describe("An array of 2 to 3 items the player wants to fuse."),
  playerPersona: z.enum(['none', 'explorer', 'warrior', 'artisan']).describe("The player's current playstyle, which might influence the outcome."),
  currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is on for narrative context."),
  environmentalContext: z.object({
      biome: z.string(),
      weather: z.string(),
  }).describe("Simple environmental context for narrative flavor."),
  environmentalModifiers: EnvironmentalModifiersSchema.describe("Pre-calculated modifiers that should guide the fusion's outcome."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
  customItemDefinitions: z.record(ItemDefinitionSchema).describe("A map of all item definitions available in the world, for looking up categories."),
});

// Output for fuse-items flow
export const FuseItemsOutputSchema = z.object({
  outcome: z.enum(['success', 'degraded', 'totalLoss']).describe("The outcome of the fusion: 'success' creates a better item, 'degraded' creates a lower-tier item from the ingredients, 'totalLoss' destroys the items when ingredients are tier 1."),
  narrative: z.string().describe("A narrative description of the fusion process and its outcome."),
  resultItem: GeneratedItemSchema.optional().describe("The new item created, either on 'success' or 'degraded' outcome."),
});

// Input for generate-journal-entry flow
export const GenerateJournalEntryInputSchema = z.object({
  dailyActionLog: z.array(z.string()).describe("A list of actions the player took today."),
  playerPersona: PlayerStatusSchema.shape.persona,
  worldName: z.string().describe("The name of the world for thematic context."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// Output for generate-journal-entry flow
export const GenerateJournalEntryOutputSchema = z.object({
  journalEntry: z.string().describe("A reflective, first-person journal entry summarizing the day's events."),
});
