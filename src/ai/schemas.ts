/**
 * @fileOverview Shared Zod schemas for AI flows and tools.
 *
 * This file centralizes the data structures used for communication with the AI,
 * ensuring consistency between narrative generation, tools, and game state.
 * It IMPORTS schemas from the core game definitions in `src/lib/game/definitions`.
 */

import {z} from 'genkit';
import { allTerrains } from '@/lib/game/types';
import { 
    ItemCategorySchema, 
    ItemEffectSchema, 
    PlayerAttributesSchema, 
    SpawnConditionsSchema,
    ItemDefinitionSchema as CoreItemDefinitionSchema // Renaming to avoid conflict
} from '@/lib/game/definitions';


export { ItemCategorySchema, ItemEffectSchema, PlayerAttributesSchema, SpawnConditionsSchema };

// We define a separate ItemDefinitionSchema here for AI-specific needs,
// but it REUSES the core schemas (ItemCategory, PlayerAttributes, etc.)
export const ItemDefinitionSchema = CoreItemDefinitionSchema;

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

export const EnemySchema = z.object({
    type: z.string(),
    emoji: z.string().describe("A single emoji that represents the creature."),
    hp: z.number(),
    damage: z.number(),
    behavior: z.enum(['aggressive', 'passive', 'defensive', 'territorial']),
    size: z.enum(['small', 'medium', 'large']),
    diet: z.array(z.string()).describe("A list of food items or creature types this enemy eats, influencing its behavior and potential for taming."),
    satiation: z.number().describe("The creature's current hunger level. When it reaches maxSatiation, it is full."),
    maxSatiation: z.number().describe("The satiation level at which the creature is considered full and may try to reproduce."),
});

export const ChunkItemSchema = z.object({
    name: z.string(),
    description: z.string(),
    quantity: z.number().int(),
    tier: z.number(),
    emoji: z.string(),
});

export const StructureSchema = z.object({
    name: z.string().describe("The name of the structure."),
    description: z.string().describe("A description of the structure."),
    emoji: z.string().describe("An emoji representing the structure."),
});
export type Structure = z.infer<typeof StructureSchema>;

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

// --- Schemas for World Generation ---

export const GeneratedItemSchema = z.object({
    name: z.string().describe("A unique and thematic name for the item."),
    description: z.string().describe("A flavorful, one-sentence description of the item."),
    emoji: z.string().describe("A single emoji that represents the item."),
    category: ItemCategorySchema,
    subCategory: z.string().optional().describe("A more specific category like 'Meat', 'Fruit', 'Potion'."),
    tier: z.number().int().min(1).max(6).describe("The tier of the item, from 1 (common) to 6 (legendary)."),
    effects: z.array(ItemEffectSchema).describe("An array of effects the item provides. Can be empty for non-consumable items."),
    baseQuantity: z.object({
        min: z.number().int().min(1),
        max: z.number().int().min(1)
    }).describe("The typical quantity range this item is found in."),
    spawnBiomes: z.array(z.enum(allTerrains)).min(1).optional().describe("An array of one or more biomes where this item can naturally be found."),
    growthConditions: z.object({
      optimal: SpawnConditionsSchema.describe("The ideal conditions for the resource to thrive and reproduce."),
      subOptimal: SpawnConditionsSchema.describe("Conditions where the resource can survive and reproduce slowly."),
    }).optional().describe("For living resources like plants or fungi, define the conditions under which they grow. If not provided, the item will be static."),
    equipmentSlot: z.enum(['weapon', 'armor', 'accessory']).optional().describe("If the item is equippable, which slot it goes into."),
    attributes: PlayerAttributesSchema.optional().describe("The combat attributes this item provides when equipped."),
});

// Schema for Narrative Concepts (part of world generation)
export const NarrativeConceptSchema = z.object({
  initialNarrative: z.string().describe('A detailed, engaging opening narrative to start the game. This should set the scene for the player.'),
  initialQuests: z.array(z.string()).describe('A list of 1-2 starting quests for the player to begin their adventure.'),
});
export const NarrativeConceptArraySchema = z.array(NarrativeConceptSchema).length(3);


// --- Schemas for Crafting Recipes ---
export const RecipeIngredientSchema = z.object({
  name: z.string().describe("The name of the ingredient item."),
  quantity: z.number().int().min(1).describe("The required quantity of this ingredient."),
  alternatives: z.array(z.object({
    name: z.string(),
    tier: z.number().int().min(1).max(3).describe("The effectiveness tier of the alternative (1=best, 3=worst).")
  })).optional().describe("An optional list of substitute ingredients and their effectiveness tier."),
});

export const RecipeResultSchema = z.object({
    name: z.string().describe("The name of the crafted item."),
    quantity: z.number().int().min(1).describe("The quantity of the item produced."),
    emoji: z.string().describe("A single emoji representing the crafted item."),
});

export const RecipeSchema = z.object({
    result: RecipeResultSchema,
    ingredients: z.array(RecipeIngredientSchema).min(1).max(5).describe("A list of 1 to 5 ingredients required for the recipe."),
    description: z.string().describe("A brief, flavorful description of what this recipe creates."),
    requiredTool: z.string().optional().describe("The name of the tool item required to be in the player's inventory to perform this craft."),
});
export type Recipe = z.infer<typeof RecipeSchema>;


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
  customItemDefinitions: z.record(ItemDefinitionSchema).describe("A map of all item definitions available in the world, for looking up categories."),
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
