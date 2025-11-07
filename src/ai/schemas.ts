/**
 * Centralized Zod schemas for AI flows and tools.
 *
 * This file acts as an "adapter" or "port" for the AI layer. It imports the
 * core game definition    la    language: z.nativeEnum(SupportedLanguages).describe("The language for the generated content (e.g., 'en', 'vi')"),guage: z.enum(['en', 'vi']).describe("The language for the generated content (e.g., 'en', 'vi')"), from `src/lib/game/definitions` and exports them for use
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
    StructureDefinitionSchema, // Use correct name without alias
    CreatureDefinitionSchema,
    TranslatableStringSchema
} from '@/lib/game/definitions';

import { LanguageEnum as Language } from '@/lib/i18n'; // Correct import and alias to Language
import type { TranslatableString } from '@/lib/game/types';
import { allTerrains, SoilTypeEnum } from '@/lib/game/types'; // Import allTerrains and SoilTypeEnum
// Re-export the canonical terrain list so AI flows can import it from this adapter
export { allTerrains };

export const PlayerLevelSchema = z.object({
  level: z.number().int().min(1).max(100).default(1).describe("The player's current level."),
  experience: z.number().int().min(0).default(0).describe("The player's current experience points."),
});
export type PlayerLevel = z.infer<typeof PlayerLevelSchema>;

// Define supported languages
export const SupportedLanguages = {
    en: 'en',
    vi: 'vi'
} as const;

// Define terrain types (already defined in types.ts, re-exporting for consistency)
export type Terrain = typeof allTerrains[number];
export const terrainTypes = allTerrains; // Use the array from types.ts

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
    StructureDefinitionSchema,
    CreatureDefinitionSchema,
    TranslatableStringSchema
    // RecipeUnlockConditionSchema removed from here
};
export type Recipe = z.infer<typeof RecipeSchema>;

export const RecipeUnlockConditionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("playerLevel"), level: z.number().int().min(1).max(100).describe("The required player level.") }),
  z.object({ type: z.literal("questCompletion"), questId: z.string().describe("The ID of the quest that must be completed.") }),
  z.object({ type: z.literal("actionRepetition"), action: z.string().describe("The action to repeat."), count: z.number().int().min(1).describe("The number of times the action must be repeated.") }),
  z.object({ type: z.literal("itemPossession"), itemId: z.string().describe("The ID of the item that must be in the player's inventory.") }),
  z.object({ type: z.literal("locationDiscovery"), locationId: z.string().describe("The ID of the location that must be discovered.") }),
  z.object({ type: z.literal("enemyDefeat"), enemyType: z.string().describe("The type of enemy that must be defeated."), count: z.number().int().min(1).describe("The number of enemies that must be defeated.") }),
  z.object({ type: z.literal("playerStatThreshold"), stat: z.enum(["hp", "mana", "stamina", "strength", "intelligence", "dexterity", "luck"]).describe("The stat to check."), threshold: z.number().describe("The required stat value.") }),
  z.object({ type: z.literal("purchaseFromVendor"), vendorId: z.string().describe("The ID of the vendor that the recipe must be purchased from.") }),
  z.object({ type: z.literal("puzzleSolving"), puzzleId: z.string().describe("The ID of the puzzle that must be solved.") }),
  z.object({ type: z.literal("timeCycle"), time: z.enum(["day", "night"]).describe("The required time of day.") }),
  z.object({ type: z.literal("itemDisintegration"), itemId: z.string().describe("The ID of the item that must be disintegrated.") }),
  z.object({ type: z.literal("professionTier"), profession: z.string().describe("The profession to check."), tier: z.number().int().min(1).describe("The required profession tier.") }),
]);
export type RecipeUnlockCondition = z.infer<typeof RecipeUnlockConditionSchema>;

// === Schemas tailored for specific AI inputs/outputs ===

// --- Player & World State Schemas (used as input for AI) ---

export const IconSchema = z.union([
    z.string(),
    z.object({
        type: z.literal('image'),
        url: z.string(),
    }),
]);

export const PlayerItemSchema = z.object({
    name: z.custom<TranslatableString>(),
    quantity: z.number().int().min(1),
    tier: z.number(),
    emoji: IconSchema,
});

export const PetSchema = z.object({
    type: z.custom<TranslatableString>().describe("The type of creature, e.g., 'Sói'."),
    name: z.string().optional().describe("A custom name given by the player."),
    level: z.number().describe("The pet's level."),
});
export type Pet = z.infer<typeof PetSchema>;

export const SkillSchema = z.object({
    name: z.custom<TranslatableString>(),
    description: z.custom<TranslatableString>().describe("A brief description of what the skill does."),
    tier: z.number().describe("The tier of the skill, from 1 (basic) to higher tiers (advanced)."),
    manaCost: z.number().describe("The amount of mana required to use the skill."),
    effect: z.object({
        type: z.enum(['HEAL', 'DAMAGE', 'TELEPORT']).describe("The type of effect."),
        amount: z.number().describe("The amount of healing or damage."),
        target: z.enum(['SELF', 'ENEMY']).describe("Who the skill affects."),
        healRatio: z.number().optional().describe("The player's level and experience points."),
    }),
    unlockCondition: z.object({
        type: z.enum(['kills', 'damageSpells', 'moves']),
        count: z.number(),
    }).optional(),
});

export const PlayerStatusSchema = z.object({
    hp: z.number(),
    // Mana may be omitted in some legacy data; keep optional to avoid
    // breaking lots of saved fixtures during migration.
    mana: z.number().optional(),
    stamina: z.number().describe("Player's stamina, used for physical actions."),
    hunger: z.number().optional().describe("Player's hunger level."),
    items: z.array(PlayerItemSchema).describe("Player's inventory with item names, quantities and tiers."),
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
    // 'moves' can be absent in some sources; default to 0 to make flows safer
    // during the types migration.
    unlockProgress: z.object({
        kills: z.number(),
        damageSpells: z.number(),
        moves: z.number().optional().default(0),
    }).describe("Tracks player actions to unlock new skills."),
    journal: z.record(z.string()).optional().describe("A record of daily journal entries written by the AI, indexed by day number."),
    dailyActionLog: z.array(z.string()).optional().describe("A log of player actions taken during the current day, used for journaling."),
    questHints: z.record(z.string()).optional().describe("A map of quest texts to their AI-generated hints."),
    language: z.enum(['en', 'vi']).optional().describe("The player's current language preference."),
    // playerLevel may be missing from some presets/tests; make optional for
    // compatibility with existing data.
    playerLevel: PlayerLevelSchema.optional().describe("The player's level and experience points."),
});

export const EnemySchema = CreatureDefinitionSchema.pick({
    type: true, emoji: true, hp: true, damage: true, behavior: true, size: true, diet: true, satiation: true, maxSatiation: true
});

export const ChunkItemSchema = z.object({
    name: z.custom<TranslatableString>(),
    description: z.custom<TranslatableString>(),
    quantity: z.number().int(),
    tier: z.number(),
    emoji: IconSchema,
});

export const NpcSchema = z.object({
    name: z.custom<TranslatableString>(),
    description: z.custom<TranslatableString>().describe("A brief physical and personality description of the NPC."),
    dialogueSeed: z.custom<TranslatableString>().describe("A sentence that captures their personality and current mood, to be used by the AI as a basis for generating dialogue. E.g., 'A grizzled hunter, tired but watchful, who speaks in short, clipped sentences.'"),
});
export type Npc = z.infer<typeof NpcSchema>;


export const ChunkSchema = z.object({
    x: z.number(),
    y: z.number(),
    terrain: z.enum(allTerrains),
    description: z.string(),
    NPCs: z.array(NpcSchema),
    items: z.array(ChunkItemSchema).describe("Items present in the chunk, with quantities and tiers."),
    structures: z.array(StructureDefinitionSchema).optional().describe("Structures present in the chunk."),
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
    soilType: SoilTypeEnum.describe("The type of soil in the chunk."),
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
    language: z.nativeEnum(Language).describe("The language for the generated content (e.g., 'en', 'vi')."),
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
    language: z.nativeEnum(Language).describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// Input for provide-quest-hint flow
export const ProvideQuestHintInputSchema = z.object({
    questText: z.string().describe("The full text of the quest for which a hint is needed."),
    language: z.nativeEnum(Language).describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// Output for provide-quest-hint flow
export const ProvideQuestHintOutputSchema = z.object({
    hint: z.string().describe("A single, short, helpful (but not spoiler-heavy) hint for the quest."),
    language: z.nativeEnum(Language).describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// Input for fuse-items flow
const EnvironmentalModifiersSchema = z.object({
  successChanceBonus: z.number().describe("A pre-calculated percentage bonus (e.g., 5 for +5%) to the success chance based on environmental factors like weather or magic affinity."),
  elementalAffinity: z.enum(['none', 'fire', 'water', 'earth', 'air', 'electric', 'ice', 'nature', 'dark', 'light']).describe("A dominant elemental theme suggested by the environment (e.g., 'electric' during a storm)."),
  chaosFactor: z.number().min(0).max(100).describe("A pre-calculated score (0-100) indicating how chaotic or unpredictable the environment is. High values increase the chance of strange outcomes."),
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
  language: z.nativeEnum(Language).describe("The language for the generated content (e.g., 'en', 'vi')."),
  customItemDefinitions: z.record(ItemDefinitionSchema).describe("A map of all item definitions available in the world, for looking up categories."),
  fullItemCatalog: z.array(GeneratedItemSchema).describe("The entire catalog of all possible items in the game, including those not normally spawnable, for rare events."),
});

// Output for fuse-items flow
export const FuseItemsOutputSchema = z.object({
  outcome: z.enum(['success', 'degraded', 'totalLoss', 'realityGlitch']).describe("The outcome of the fusion: 'success' creates a better item, 'degraded' creates a lower-tier item, totalLoss' creates an item from another world."),
  narrative: z.string().describe("A narrative description of the fusion process and its outcome."),
  resultItem: GeneratedItemSchema.optional().describe("The new item created, either on 'success', 'degraded', or 'realityGlitch' outcome."),
});

// Input for generate-journal-entry flow
export const GenerateJournalEntryInputSchema = z.object({
    dailyActionLog: z.array(z.string()).describe("A list of actions the player took today."),
    playerPersona: PlayerStatusSchema.shape.persona,
    worldName: z.string().describe("The name of the world for thematic context."),
    language: z.nativeEnum(Language).describe("The language for the generated content (e.g., 'en', 'vi')."),
});

// Output for generate-journal-entry flow
export const GenerateJournalEntryOutputSchema = z.object({
    journalEntry: z.string().describe("A reflective, first-person journal entry summarizing the day's events."),
});
