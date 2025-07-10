/**
 * @fileOverview Shared Zod schemas for AI flows and tools.
 *
 * This file centralizes the data structures used for communication with the AI,
 * ensuring consistency between narrative generation, tools, and game state.
 */

import {z} from 'genkit';
import type { Terrain } from '@/lib/game/types';
import { ItemCategorySchema, ItemEffectSchema, SpawnConditionsSchema, GeneratedItemSchema, PlayerAttributesSchema, PlayerItemSchema, ChunkItemSchema } from '@/lib/game/definitions/item';
import { PetSchema, EnemySchema, NpcSchema } from '@/lib/game/definitions/creature';
import { SkillSchema } from '@/lib/game/definitions/skill';
import { StructureSchema } from '@/lib/game/definitions/structure';

export { ItemCategorySchema, ItemEffectSchema, SpawnConditionsSchema, GeneratedItemSchema, PlayerAttributesSchema, PlayerItemSchema, SkillSchema, PetSchema, EnemySchema, ChunkItemSchema, StructureSchema, NpcSchema };

export const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave", "jungle", "volcanic", "wall", "floptropica", "tundra", "beach", "mesa", "mushroom_forest", "ocean", "city", "space_station", "underwater"];


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

// --- Schemas for World Generation ---

// Schema for Narrative Concepts (part of world generation)
export const NarrativeConceptSchema = z.object({
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});
export const NarrativeConceptArraySchema = z.array(NarrativeConceptSchema).length(3);


// --- Schemas for New Quest Generation ---
export const GenerateNewQuestInputSchema = z.object({
    worldName: z.string().describe("The name of the game world for thematic consistency."),
    playerStatus: PlayerStatusSchema.describe("The player's current status (HP, items, skills, etc.)."),
    currentChunk: ChunkSchema.describe("The detailed attributes of the map tile the player is on."),
    existingQuests: z.array(z.string()).describe("A list of quests the player already has, to avoid duplicates."),
    language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});

export const GenerateNewQuestOutputSchema = z.object({
    newQuest: z.string().describe("A single, short, and engaging quest objective."),
});

// --- Schemas for New Item Generation ---
export const GenerateNewItemInputSchema = z.object({
    existingItemNames: z.array(z.string()).describe("A list of the names of ALL items that already exist in the world, to avoid generating duplicates."),
    worldName: z.string().describe("The name of the game world for thematic consistency."),
    playerPersona: PlayerStatusSchema.shape.persona,
    language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// --- Schemas for Quest Hint ---
export const ProvideQuestHintInputSchema = z.object({
    questText: z.string().describe("The full text of the quest for which a hint is needed."),
    language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});

export const ProvideQuestHintOutputSchema = z.object({
    hint: z.string().describe("A single, short, helpful (but not spoiler-heavy) hint for the quest."),
});

// --- Schemas for Item Fusion ---

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
  customItemDefinitions: z.record(GeneratedItemSchema).describe("A map of all item definitions available in the world, for looking up categories."),
});


export const FuseItemsOutputSchema = z.object({
  outcome: z.enum(['success', 'degraded', 'totalLoss']).describe("The outcome of the fusion: 'success' creates a better item, 'degraded' creates a lower-tier item from the ingredients, 'totalLoss' destroys the items when ingredients are tier 1."),
  narrative: z.string().describe("A narrative description of the fusion process and its outcome."),
  resultItem: GeneratedItemSchema.optional().describe("The new item created, either on 'success' or 'degraded' outcome."),
});

// --- Schemas for Journaling ---
export const GenerateJournalEntryInputSchema = z.object({
  dailyActionLog: z.array(z.string()).describe("A list of actions the player took today."),
  playerPersona: PlayerStatusSchema.shape.persona,
  worldName: z.string().describe("The name of the world for thematic context."),
  language: z.string().describe("The language for the generated content (e.g., 'en', 'vi')."),
});

export const GenerateJournalEntryOutputSchema = z.object({
  journalEntry: z.string().describe("A reflective, first-person journal entry summarizing the day's events."),
});
