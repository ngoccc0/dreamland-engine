/**
 * Represents an icon that can be either an emoji string or an external image.
 * This allows for flexible visual representation of game entities.
 */
export type Icon = string | { type: 'image'; url: string };

/**
 * Represents an enemy entity in the game world.
 * This interface is designed for extensibility and modding, allowing for diverse enemy types.
 *
 * @property type - The enemy's type or name (translatable). Some code expects a string key,
 *                   other parts of the engine accept a {@link TranslatableString}.
 * @property hp - The enemy's hit points. When this reaches 0, the enemy is defeated.
 * @property damage - The base damage dealt by the enemy in combat.
 * @property behavior - The AI behavior pattern of the enemy (e.g., 'aggressive', 'passive').
 * @property size - The size category of the enemy ('small', 'medium', 'large'), influencing interactions and visuals.
 * @property diet - A list of item IDs this creature eats, influencing its behavior and potential for taming.
 * @property satiation - Current satiation level. Relevant for creatures with hunger mechanics.
 * @property maxSatiation - Maximum satiation level. The creature is considered full at this level.
 * @property emoji - Emoji representation for UI, providing a quick visual cue.
 * @property harvestable - Optional: harvesting information (loot, required tools) if the enemy can be harvested after defeat.
 * @property senseEffect - Optional: special senses or detection effects. Keywords should be descriptive cues, e.g., "smell:foul", "sound:rumbling".
 * @example
 * ```typescript
 * const goblin: Enemy = {
 *   type: { en: "Goblin", vi: "Yêu tinh" },
 *   hp: 30,
 *   damage: 5,
 *   behavior: "aggressive",
 *   size: "small",
 *   diet: ["berries", "meat"],
 *   satiation: 10,
 *   maxSatiation: 20,
 *   emoji: "👹",
 *   senseEffect: { keywords: ["smell:foul", "sound:raspy breathing"] }
 * };
 * ```
 */
export interface Enemy {
    type?: string | TranslatableString;
    hp: number;
    damage: number;
    behavior: 'aggressive' | 'passive' | 'defensive' | 'territorial' | 'immobile' | 'ambush';
    /** Broad feeding category used by simulation engines (optional) */
    trophic?: 'herbivore' | 'carnivore' | 'omnivore';
    /** Optional numeric trophic level (1 = producer, >1 = higher-level consumer) */
    trophicLevel?: number;
    /** Optional search/influence radius used by AI (in tiles). When absent, engines may use sensible defaults (carnivores default to 2 for a 5x5 area). */
    trophicRange?: number;
    /** Optional tags describing feeding/foraging categories, e.g. ['plant','nectarivore'] */
    trophicTags?: string[];
    /** Optional amount of food consumed per eat action (arbitrary units) */
    feedingRate?: number;
    /** Optional chance (0-1) to attempt to eat when hungry */
    eatChance?: number;
    /** Optional preference map for foods (id/tag => weight) */
    foodPreferences?: Record<string, number>;
    size: 'small' | 'medium' | 'large';
    diet: string[];
    satiation: number;
    maxSatiation: number;
    emoji: Icon;
    harvestable?: {
        difficulty: number;
        requiredTool: string;
        loot: LootDrop[];
    };
    senseEffect?: { keywords?: string[]; range?: number; type?: string };
    // Mod extension fields can be added here
}


import type { TranslatableString } from '@/core/types/i18n';

// Re-export TranslatableString and TranslationObject from core to synchronize types across the project.
export type { TranslatableString, TranslationObject } from '@/core/types/i18n';

/**
 * Supported language codes for localization within the game.
 */
export type Language = 'en' | 'vi';
import { z } from 'zod';

import type {
    ItemEffect,
    WeatherDefinition,
    RandomEventDefinition,
    CreatureDefinition,
    LootDrop,
    SpawnConditions,
    PlayerAttributes,
    ItemCategory,
    MultilingualText,
    RecipeIngredient,
    ItemDefinition,
    BiomeDefinition,
    Recipe,
    StructureDefinition,
    Emoji
} from "@/core/types/definitions";
/**
 * OVERVIEW: Represents the serializable state of the game world.
 * This type is used for saving/loading game progress and for modding.
 * Includes terrain chunks, creatures, structures, weather, and vegetation state.
 * 
 * @property chunks - 2D grid of terrain chunks, keyed by "x,y" coordinate
 * @property gameTime - Absolute ticks elapsed since world creation
 * @property seed - Deterministic world seed for reproducible generation
 * @property version - World format version for migrations
 */
export interface WorldDefinition {
  [key: string]: any;  // Allow dynamic chunk access by "x,y" key
  chunks?: Record<string, any>;  // Optional explicit chunks map
  gameTime?: number;  // Ticks elapsed
  seed?: number;  // Reproducibility
  version?: 1;  // Format version
}

/**
 * Represents the serializable status of the player character.
 * This interface is vital for saving/loading player progress and for modding,
 * enabling external tools to understand and modify player attributes and inventory.
 * It should be implemented by the `Character` entity class.
 * @see {@link Character} in `src/core/entities/character.ts`
 */
export interface PlayerStatusDefinition {
    /** The current health points of the player. */
    hp: number;
    /** The current stamina points of the player, used for actions and movement. */
    stamina: number;
    /** The maximum stamina points the player can have. */
    maxStamina: number;
    /** The current hunger level of the player. */
    hunger?: number;
    /** Counter for tracking hunger decay intervals. */
    hungerTickCounter?: number;
    /** Counter for tracking HP regeneration intervals. */
    hpRegenTickCounter?: number;
    /** Counter for tracking stamina regeneration intervals. */
    staminaRegenTickCounter?: number;
    /** Counter for tracking mana regeneration intervals. */
    manaRegenTickCounter?: number;
    /** The current mana points of the player, used for magical abilities. */
    mana?: number;
    /** A list of items currently in the player's inventory. */
    items: { name: TranslatableString; quantity: number; tier: number; emoji: Icon }[];
    /** A list of quest IDs the player is currently undertaking or has completed. */
    quests: string[];
    /** A list of skills the player has acquired. */
    skills: Skill[];
    /** The player's chosen persona, influencing certain game interactions. */
    persona: PlayerPersona;
    /** Optional: A list of pets accompanying the player. */
    pets?: Pet[];
    /**
     * Tracks player progress towards unlocking various game features.
     * Some older data and tests include a "moves" counter; it's kept optional for
     * compatibility while downstream data is migrated to the canonical shape.
     */
    unlockProgress: {
        /** Number of enemies killed by the player. */
        kills: number;
        /** Number of damage-dealing spells cast by the player. */
        damageSpells: number;
        /** Optional: Number of moves made by the player (legacy field). */
        moves?: number
    };
    /**
     * Optional: Player-level convenience fields that appear in some presets/tests.
     * Migrate to a structured `playerLevel` where possible. Keep the legacy numeric
     * field as optional for backwards compatibility; the engine will coerce when needed.
     */
    playerLevel?: {
        /** The player's current experience level. */
        level: number;
        /** The player's current experience points. */
        experience: number
    } | number;
    /** Optional: The number of quests completed by the player. */
    questsCompleted?: number;
    /**
     * The player's equipped items, mapped by equipment slot.
     * The equipment map can hold different shapes depending on mods; kept as a loose
     * record for compatibility during migration.
     */
    equipment: Record<EquipmentSlot, any>;
    /**
     * The player's core attributes (e.g., strength, intelligence).
     * Attributes may be a partial map in some data files; kept permissive here.
     */
    attributes: Record<string, number>;
    /** Optional: A log of daily actions performed by the player. */
    dailyActionLog?: string[];
    /** Optional: A record of quest hints provided to the player. */
    questHints?: Record<string, string>;
    /** Allows for other dynamic fields used by code or mods. */
    [key: string]: any;
}

// Temporary aliases for backward compatibility until definitions are consolidated.
/** @deprecated Use {@link WorldDefinition} directly. */
export type World = WorldDefinition;
/** @deprecated Use {@link PlayerStatusDefinition} directly. */
export type PlayerStatus = PlayerStatusDefinition;
/**
 * Represents a key used for translation lookup.
 * @deprecated Use `TranslatableString` from `@/core/types/i18n` or `MultilingualText` from `./definitions/base` instead.
 */
export type TranslationKey = string;

// Re-export for easier access elsewhere
export type {
    ItemEffect,
    WeatherDefinition,
    RandomEventDefinition,
    CreatureDefinition,
    LootDrop,
    SpawnConditions,
    PlayerAttributes,
    ItemCategory,
    MultilingualText,
    RecipeIngredient,
};
export { TranslatableStringSchema } from "./definitions";

// --- TERRAIN TYPES ---
/**
 * Represents different types of soil that can exist in the game world.
 * Each soil type can have unique properties affecting plant growth, resource generation, etc.
 */
export type SoilType = 'rocky' | 'sandy' | 'fertile' | 'clay' | 'loamy' | 'volcanic' | 'peaty' | 'silty' | 'chalky' | 'tilled';
/** Zod enum schema for {@link SoilType}. */
export const SoilTypeEnum = z.enum(['rocky', 'sandy', 'fertile', 'clay', 'loamy', 'volcanic', 'peaty', 'silty', 'chalky', 'tilled']);

/**
 * Represents the craftability calculation result for a recipe.
 * Provides a score and lists of missing/available ingredients.
 */
export interface CraftabilityInfo {
    /** Percentage of available ingredients (0-1), indicating how close the player is to crafting. */
    score: number;
    /** Names of ingredients that the player currently lacks. */
    missingIngredients: string[];
    /** Names of ingredients that the player currently possesses. */
    availableIngredients: string[];
}

/**
 * Defines the comprehensive outcome of a crafting attempt.
 */
export interface CraftingOutcome {
    /** Indicates if the recipe can be crafted with current resources and tools. */
    canCraft: boolean;
    /** The probability (0-1) of successful crafting, if applicable. */
    chance: number;
    /** Indicates if the player possesses the required tool for crafting. */
    hasRequiredTool: boolean;
    /** A list of ingredients that will be consumed upon successful crafting. */
    ingredientsToConsume: { name: string; quantity: number }[];
    /**
     * A detailed breakdown of each ingredient requirement, including what was used,
     * if it was a substitute, and if enough quantity was available.
     */
    resolvedIngredients: {
        /** The original recipe ingredient requirement. */
        requirement: RecipeIngredient;
        /** The item actually used (could be a substitute). */
        usedItem: { name: TranslatableString, tier: number };
        /** True if a substitute item was used for this ingredient. */
        isSubstitute: boolean;
        /** True if the player has enough of this ingredient (or its substitute). */
        hasEnough: boolean;
        /** The quantity of this ingredient (or its substitute) the player currently has. */
        playerQuantity: number;
    }[];
    /** Optional: Detailed craftability information. */
    craftability?: CraftabilityInfo;
}


/**
 * A comprehensive list of all supported terrain types in the game world.
 * This array is used for type checking and defining valid terrain values.
 */
export const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave", "jungle", "volcanic", "wall", "floptropica", "tundra", "beach", "mesa", "mushroom_forest", "ocean", "city", "space_station", "underwater"];


// Core types are re-exported from definitions module for convenience.
export type { ItemDefinition, BiomeDefinition, Recipe, StructureDefinition } from './definitions';

/**
 * Represents a contiguous region of a single biome in the game world.
 * Regions are fundamental units for world generation and management.
 */
export interface Region {
    /** The terrain type of this region. */
    terrain: Terrain;
    /** An array of coordinates (x, y) representing the cells belonging to this region. */
    cells: { x: number; y: number }[];
}

/**
 * Defines the various terrain types that can exist in the game world.
 */
export type Terrain = "forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave" | "jungle" | "volcanic" | "wall" | "floptropica" | "tundra" | "beach" | "mesa" | "mushroom_forest" | "ocean" | "city" | "space_station" | "underwater";
/**
 * Defines the different seasons in the game world, influencing environment and gameplay.
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
/**
 * Defines the player's chosen persona, influencing dialogue, quests, and certain game mechanics.
 */
export type PlayerPersona = 'none' | 'explorer' | 'warrior' | 'artisan';
/**
 * Defines the available game modes.
 */
export type GameMode = 'ai' | 'offline';
/**
 * Defines the types of dice that can be used in game mechanics.
 */
export type DiceType = 'd20' | 'd12' | '2d6';
/**
 * Defines the AI models available for narrative generation or other AI-driven features.
 */
export type AiModel = 'balanced' | 'creative' | 'fast' | 'quality';

/**
 * Defines the available equipment slots for player items.
 */
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
/**
 * Defines the supported font families for the game's user interface.
 */
export type FontFamily = 'literata' | 'inter' | 'source_code_pro';
/**
 * Defines the supported font sizes for the game's user interface.
 */
export type FontSize = 'sm' | 'base' | 'lg';
/**
 * Defines the available UI themes.
 */
export type Theme = 'light' | 'dark';

/**
 * Represents a numerical range with optional minimum and maximum bounds.
 * Used for defining conditions or attribute ranges.
 */
export type ConditionRange = {
    min?: number;
    max?: number;
};

/**
 * Defines a comprehensive set of conditions that can be used to trigger events,
 * spawn entities, or unlock features.
 */
export type ConditionType = {
    vegetationDensity?: ConditionRange;
    moisture?: ConditionRange;
    elevation?: ConditionRange;
    dangerLevel?: ConditionRange;
    magicAffinity?: ConditionRange;
    humanPresence?: ConditionRange;
    predatorPresence?: ConditionRange;
    lightLevel?: ConditionRange;
    temperature?: ConditionRange;
    soilType?: string[];
    timeOfDay?: 'day' | 'night';
    visibility?: ConditionRange;
    humidity?: ConditionRange;
    playerHealth?: ConditionRange;
    playerStamina?: ConditionRange;
    requiredEntities?: {
        enemyType?: string;
        itemType?: string;
    };
};

/**
 * Defines the various types of narrative templates used for generating game text.
 */
export type NarrativeTemplateType = 'Opening' | 'EnvironmentDetail' | 'SensoryDetail' | 'EntityReport' | 'SurroundingPeek' | 'Closing' | 'Filler';
/**
 * Defines the different lengths for generated narrative text.
 */
export type NarrativeLength = 'short' | 'medium' | 'long' | 'detailed';
/**
 * Defines various mood tags that can be associated with narrative templates or game states.
 * These tags help in generating contextually appropriate and emotionally resonant text.
 */
export type MoodTag = 'Danger' | 'Peaceful' | 'Magic' | 'Foreboding' | 'Resourceful' | 'Lush' | 'Gloomy' | 'Dark' | 'Serene' | 'Vibrant' | 'Mysterious' | 'Desolate' | 'Threatening' | 'Wet' | 'Arid' | 'Wild' | 'Ethereal' | 'Civilized' | 'Historic' | 'Hot' | 'Cold' | 'Harsh' | 'Rugged' | 'Elevated' | 'Confined' | 'Smoldering' | 'Vast' | 'Structured' | 'Barren' | 'Abandoned';

/**
 * Represents a single narrative template used by the AI to generate dynamic text.
 */
export type NarrativeTemplate = {
    /** Unique identifier for the narrative template. */
    id: string;
    /** The type of narrative this template generates. */
    type: NarrativeTemplateType;
    /** An array of mood tags associated with this template. */
    mood: MoodTag[];
    /** The typical length of the narrative generated by this template. */
    length: NarrativeLength;
    /** Optional conditions that must be met for this template to be used. */
    conditions?: ConditionType;
    /** A weighting factor indicating how likely this template is to be chosen. */
    weight: number;
    /** The actual template string, which may contain placeholders. */
    template: string;
};

/**
 * Represents a category of adjectives or descriptive words for biomes.
 */
export type BiomeAdjectiveCategory = {
    [key: string]: string[];
};

/**
 * Defines the data structure for biome templates, used in procedural generation.
 */
export type BiomeTemplateData = {
    /** The terrain type this template applies to. */
    terrain: string;
    /** Narrative templates for generating descriptions of this biome. */
    descriptionTemplates: NarrativeTemplate[];
    /** Adjectives associated with this biome. */
    adjectives: BiomeAdjectiveCategory;
    /** Features associated with this biome. */
    features: BiomeAdjectiveCategory;
    /** Smells associated with this biome. */
    smells: BiomeAdjectiveCategory;
    /** Sounds associated with this biome. */
    sounds: BiomeAdjectiveCategory;
    /** Optional: Sky descriptions for this biome. */
    sky?: BiomeAdjectiveCategory;
    /** Optional: Visual representation of the biome. */
    emoji?: Emoji;
};

/**
 * A collection of game templates, typically indexed by terrain type.
 */
export type GameTemplates = {
    [key: string]: BiomeTemplateData;
};

// --- WEATHER SYSTEM TYPES ---
/**
 * Represents the current state of weather, based on a {@link WeatherDefinition}.
 */
export type WeatherState = WeatherDefinition;

/**
 * Defines a weather zone within the world, tracking its current weather and forecast.
 */
export interface WeatherZone {
    /** Unique identifier for the weather zone. */
    id: string;
    /** The terrain type associated with this weather zone. */
    terrain: Terrain;
    /** The current weather state in this zone. */
    currentWeather: WeatherState;
    /** The game tick at which the weather in this zone is scheduled to change next. */
    nextChangeTime: number;
}

// --- WORLD & GAME STATE TYPES ---
/**
 * Represents a generated item, which is an instance of an {@link ItemDefinition}.
 */
export type GeneratedItem = ItemDefinition;

/**
 * Defines the overall profile and global settings for a generated world.
 * These settings influence various aspects of world generation and gameplay.
 */
export interface WorldProfile {
    /** The base climate type of the world, influencing temperature and moisture patterns. */
    climateBase: 'temperate' | 'arid' | 'tropical';
    /** The overall magic level of the world, affecting magic-related events and resources. */
    magicLevel: number;
    /** A factor influencing the mutation rate of creatures or items. */
    mutationFactor: number;
    /** The intensity of sunlight, affecting light levels and plant growth. */
    sunIntensity: number;
    /** A list of allowed weather types for this world. */
    weatherTypesAllowed: ('clear' | 'rain' | 'fog' | 'snow')[];
    /** A bias applied to moisture levels during world generation. */
    moistureBias: number;
    /** A bias applied to temperature during world generation. */
    tempBias: number;
    /**
     * The overall resource density multiplier for the world.
     *
     * This value is used as a direct multiplier in world/chunk generation and
     * spawn probability calculations. Historically this field was a 0..100
     * percentage and used additively; it now behaves multiplicatively to allow
     * intuitive scaling of abundance without producing large negative bonuses.
     *
     * Typical usage and ranges:
     * - 0.5 : Sparse world (50% of baseline spawn/quantity)
     * - 1.0 : Baseline / neutral
     * - 1.5 : Resource-rich world (150% of baseline spawn/quantity)
     *
     * Implementation notes:
     * - Applied directly to per-entity spawnChance (spawnChance *= resourceDensity)
     *   and to chunk-level item-count scaling in `generateChunkContent`.
     * - Values outside the suggested range are allowed but may be clamped or
     *   soft-capped by generation code to avoid runaway behaviour.
     *
     * @example
     * // Neutral world
     * worldProfile.resourceDensity = 1.0;
     *
     * // Sparse world
     * worldProfile.resourceDensity = 0.6;
     */
    resourceDensity: number;
    /** The thematic style of the game world. */
    theme: GameTheme;
    /**
     * A soft multiplier applied to spawn checks and initial generation counts.
     * Values >1 increase spawn frequency/amount, values <1 decrease. This value
     * is passed through a softcap function in generation code to avoid runaway effects.
     */
    spawnMultiplier?: number;
}

/**
 * Defines modifiers applied to environmental factors based on the current season.
 */
export interface SeasonModifiers {
    /** Modifier for temperature. */
    temperatureMod: number;
    /** Modifier for moisture. */
    moistureMod: number;
    /** Modifier for sun exposure. */
    sunExposureMod: number;
    /** Modifier for wind. */
    windMod: number;
    /** Modifier for the chance of random events occurring. */
    eventChance: number;
}

/**
 * Defines the thematic style of the game.
 */
export type GameTheme = 'Normal' | 'Magic' | 'Horror' | 'SciFi';

/**
 * Defines the player's game settings, including gameplay preferences and UI customization.
 */
export interface GameSettings {
    /** The current game mode (e.g., 'ai' for AI-driven narrative, 'offline' for local play). */
    gameMode: GameMode;
    /** The type of dice used for random rolls in game mechanics. */
    diceType: DiceType;
    /** The AI model preference for narrative generation. */
    aiModel: AiModel;
    /** The preferred length for generated narrative text. */
    narrativeLength: NarrativeLength;
    /** The chosen font family for the game's UI. */
    fontFamily: FontFamily;
    /** The chosen font size for the game's UI. */
    fontSize: FontSize;
    /** The active UI theme. */
    theme: Theme;
    /** When true, the player will automatically pick up items when entering a tile containing items. */
    autoPickup?: boolean;
    /** Optional: A bundle of active mods. */
    mods: ModBundle | null;
    /** When true, the UI uses the legacy (mobile-oriented) layout: bottom action bar is shown even on desktop. */
    useLegacyLayout?: boolean;
    /**
     * When true, focusing controls input on desktop will attempt to prevent the
     * browser from auto-scrolling the controls panel into view. Users can toggle
     * this behavior from the Settings UI.
     */
    controlsPreventScroll?: boolean;
    /**
     * Minimap viewport size: 5 (5x5 grid), 7 (7x7 grid), or 9 (9x9 grid).
     * Default is 5. The preload grid is always larger (7x7 or 9x9) to prevent blank tiles during pan.
     */
    minimapViewportSize?: 5 | 7 | 9;
    /** When true, disables automatic time progression when player is idle/backgrounded. Game time pauses. Default false. */
    pauseGameIdleProgression?: boolean;
    /** Warning threshold before idle progression kicks in (milliseconds). Default 4 * 60_000 (4 min, warning 1min before 5min idle). */
    idleWarningThresholdMs?: number;
    /** Real-world duration per game tick (milliseconds). Default 5 * 60_000 (5 minutes). */
    tickRealDurationMs?: number;
    /** Maximum number of ticks to catch-up after idle resume. Prevents extreme jumps. Default 96 (~8 hours at 5min/tick). */
    maxCatchupTicks?: number;
    /** How many in-game minutes each tick represents. Default 15 (each tick = 15 in-game minutes). */
    tickGameDurationMinutes?: number;
}

/**
 * Represents an item found within a chunk, including its quantity and basic properties.
 */
export interface ChunkItem {
    /** The name of the item (translatable). */
    name: TranslatableString;
    /** Optional canonical id for the item (e.g., 'healingHerb'). Prefer using this for logic/lookups. */
    id?: string;
    /** The description of the item (translatable). */
    description: TranslatableString;
    /** The quantity of the item in this chunk. */
    quantity: number;
    /** The tier/rarity of the item. */
    tier: number;
    /** An emoji representing the item for UI. */
    emoji: Icon;
}

/**
 * Represents an item in the player's inventory.
 */
export interface PlayerItem {
    /** The name of the item (translatable). */
    name: TranslatableString;
    /** Optional canonical id for the item (e.g., 'healingHerb'). Prefer using this for logic/lookups. */
    id?: string;
    /** The quantity of the item. */
    quantity: number;
    /** The tier/rarity of the item. */
    tier: number;
    /** An emoji representing the item for UI. */
    emoji: Icon;
}

/**
 * Represents a pet accompanying the player.
 */
export interface Pet {
    /** The type of pet (translatable). */
    type: TranslatableString;
    /** Optional: The specific name given to the pet. */
    name?: string;
    /** The current level of the pet. */
    level: number;
}

/**
 * Represents a Non-Player Character (NPC) in the game world.
 */
export interface Npc {
    /** The name of the NPC (translatable). */
    name: TranslatableString;
    /** The description of the NPC (translatable). */
    description: TranslatableString;
    /** A seed or key for generating the NPC's dialogue (translatable). */
    dialogueSeed: TranslatableString;
    /** Optional: A quest associated with this NPC (translatable). */
    quest?: TranslatableString;
    /** Optional: An item required for a quest given by this NPC. */
    questItem?: { name: string; quantity: number };
    /** Optional: Items rewarded by this NPC upon quest completion. */
    rewardItems?: PlayerItem[];
}

/**
 * Represents a skill that a player can learn and use.
 */
export interface Skill {
    /** The name of the skill (translatable). */
    name: TranslatableString;
    /** The description of the skill (translatable). */
    description: TranslatableString;
    /** The tier or power level of the skill. */
    tier: number;
    /** The mana cost to use this skill. */
    manaCost: number;
    /** The effect of the skill. */
    effect: {
        /** The type of effect (e.g., 'HEAL', 'DAMAGE', 'TELEPORT'). */
        type: 'HEAL' | 'DAMAGE' | 'TELEPORT';
        /** The numerical amount of the effect. */
        amount: number;
        /** The target of the skill's effect. */
        target: 'SELF' | 'ENEMY';
        /** Optional: Ratio of health healed (e.g., 0.5 for 50% of max HP). */
        healRatio?: number;
    };
    /** Optional: Conditions that must be met to unlock this skill. */
    unlockCondition?: {
        /** The type of condition (e.g., 'kills', 'damageSpells'). */
        type: 'kills' | 'damageSpells' | 'moves';
        /** The count required for the condition. */
        count: number;
    };
}

/**
 * Represents a structure in the game world, extending {@link StructureDefinition}.
 */
export interface Structure extends StructureDefinition { }


/**
 * Represents an action that a player can perform in a chunk.
 */
export interface Action {
    /** Unique identifier for the action. */
    id: number;
    /** The translation key for the action's display text. */
    textKey: string;
    /** Optional: Parameters to be interpolated into the action's text. */
    params?: Record<string, string | number>;
}

/**
 * Represents a single chunk (tile) in the game world, containing all its dynamic data.
 */
export interface Chunk {
    /** X-coordinate of the chunk. */
    x: number;
    /** Y-coordinate of the chunk. */
    y: number;
    /** The terrain type of this chunk. */
    terrain: Terrain;
    /** A generated description of the chunk. */
    description: string;
    /** NPCs present in this chunk. */
    NPCs: Npc[];
    /** Items present in this chunk. */
    items: ChunkItem[];
    /** Structures present in this chunk. */
    structures: Structure[];
    /** True if the player has explored this chunk. */
    explored: boolean;
    /** Timestamp of the last visit to this chunk. */
    lastVisited: number;
    /** The enemy present in this chunk, if any. */
    enemy: Enemy | null;
    /** Available actions in this chunk. */
    actions: Action[];
    /** The ID of the region this chunk belongs to. */
    regionId: number;
    /** The cost to travel through this chunk. */
    travelCost: number;
    /** Density of vegetation in this chunk (0-100). */
    vegetationDensity: number;
    /** Moisture level in this chunk (0-100). */
    moisture: number;
    /** Elevation of this chunk. */
    elevation: number;
    /** Ambient light level in this chunk (0-100). */
    lightLevel: number;
    /** Danger level of this chunk (0-100). */
    dangerLevel: number;
    /** Magic affinity of this chunk (0-100). */
    magicAffinity: number;
    /** Human presence level in this chunk (0-100). */
    humanPresence: number;
    /** Explorability of this chunk (0-100). */
    explorability: number;
    /** Soil type of this chunk. */
    soilType: SoilType;
    /** Optional: per-chunk water timer (in ticks) representing recently watered state. */
    waterTimer?: number;
    /** Optional: how well this soil retains water (0-1). Higher retains water longer. */
    waterRetention?: number;
    /** Optional: nutrition value of this chunk (0-100) that affects plant growth and yield. */
    nutrition?: number;
    /** Optional: temporary fertilizer level applied to this chunk (affects growth for N ticks). */
    fertilizerLevel?: number;
    /** Predator presence level in this chunk (0-100). */
    predatorPresence: number;
    /** List of plant instances in this chunk. */
    plants?: Array<{
        definition: CreatureDefinition;
        hp: number;
        maturity: number;
        age: number;
    }>;
    /** Optional: Wind level in this chunk (0-100). */
    windLevel?: number;
    /** Optional: Temperature in this chunk. */
    temperature?: number;
}

/**
 * Tracks player behavior metrics for AI analysis or game statistics.
 */
export interface PlayerBehaviorProfile {
    /** Number of moves made by the player. */
    moves: number;
    /** Number of attacks performed by the player. */
    attacks: number;
    /** Number of crafting operations performed by the player. */
    crafts: number;
    /** Number of custom actions performed by the player. */
    customActions: number;
    /** Optional: Item name (translatable). The profile object is used in multiple places with only counters; keep these fields optional to avoid forcing full item-like shape everywhere. */
    name?: TranslatableString;
    /** Optional: Item description (translatable). */
    description?: TranslatableString;
    /** Optional: Quantity of the item. */
    quantity?: number;
    /** Optional: Item tier/rarity. */
    tier?: number;
    /** Optional: Emoji for UI. */
    emoji?: string;
}

/**
 * Represents a single entry in the narrative log, detailing game events or player actions.
 */
export type NarrativeEntry = {
    /** Unique identifier for the narrative entry. */
    id: string;
    /** The text content of the narrative entry. */
    text: string;
    /** The type of entry (e.g., 'narrative', 'action', 'system'). */
    type: 'narrative' | 'action' | 'system';
    /** The name of the item (translatable). */
    name: TranslatableString;
    /** The quantity of the item. */
    quantity: number;
    /** The tier/rarity of the item. */
    tier: number;
    /** An emoji for UI. */
    emoji: string;
}

/**
 * Defines the initial concept and setup for a new game world.
 */
export interface WorldConcept {
    /** The name of the world (translatable). */
    worldName: TranslatableString;
    /** The initial narrative text presented to the player (translatable). */
    initialNarrative: TranslatableString;
    /** The starting biome for the player. */
    startingBiome: Terrain;
    /** The initial skill granted to the player. */
    startingSkill: Skill;
    /** The initial items in the player's inventory. */
    playerInventory: PlayerItem[];
    /** Initial quests given to the player (translatable). */
    initialQuests: TranslatableString[];
    /** Optional: Custom structures defined for this world. */
    customStructures?: Structure[];
    /** Optional: A catalog of custom items available in this world. */
    customItemCatalog?: GeneratedItem[];
    /** Optional: Pet type (translatable). Some premade-worlds omit these fields (they're not strictly required to start a world). Mark optional to avoid cascade failures. */
    type?: TranslatableString;
    /** Optional: Pet name. */
    name?: string;
    /** Optional: Pet level. */
    level?: number;
}

/**
 * GameState holds the full serializable state of the game for save/load/modding.
 * It uses plain interfaces for world and player data, which are then mapped to entity classes for game logic.
 */
export interface GameState {
    /** The overall profile and global settings for the world. */
    worldProfile: WorldProfile;
    /** The current season in the game world. */
    currentSeason: Season;
    /**
     * Serializable world state for save/load/modding.
     * See {@link GameWorld} entity for game logic.
     */
    world: WorldDefinition;
    /** A record of regions in the world, indexed by their ID. */
    regions: { [id: number]: Region };
    /** A record of all available crafting recipes, indexed by their ID. */
    recipes: Record<string, Recipe>;
    /** A record of all buildable structures, indexed by their ID. */
    buildableStructures: Record<string, Structure>;
    /** A counter for generating unique region IDs. */
    regionCounter: number;
    /** The current position of the player in the world. */
    playerPosition: { x: number; y: number };
    /** The player's behavior profile, tracking various actions. */
    playerBehaviorProfile: PlayerBehaviorProfile;
    /**
     * Serializable player state for save/load/modding.
     * See {@link Character} entity for game logic.
     */
    playerStats: PlayerStatusDefinition;
    /** A chronological log of narrative entries and game events. */
    narrativeLog: NarrativeEntry[];
    /** The initial setup and concept for the world. */
    worldSetup: WorldConcept;
    /** A record of custom item definitions, indexed by their ID. */
    customItemDefinitions: Record<string, ItemDefinition>;
    /** A catalog of custom-generated items. */
    customItemCatalog: GeneratedItem[];
    /** A list of custom structure definitions. */
    customStructures: StructureDefinition[];
    /** A record of active weather zones in the world. */
    weatherZones: { [zoneId: string]: WeatherZone };
    /** The total game time elapsed in ticks. */
    gameTime: number;
    /** The current day in the game. */
    day: number;
    /** The current turn within the day. */
    turn: number;
}

/**
 * Represents a random event, extending {@link RandomEventDefinition}.
 */
export type RandomEvent = RandomEventDefinition;

/**
 * Defines a bundle of modifications that can be applied to the game.
 * This allows for extending game content with new items, recipes, biomes, etc.
 */
export interface ModBundle {
    /** Unique identifier for the mod bundle. */
    id: string;
    /** Optional: A record of custom item definitions provided by the mod. */
    items?: Record<string, ItemDefinition>;
    /** Optional: A record of custom crafting recipes provided by the mod. */
    recipes?: Record<string, Recipe>;
    /** Optional: A record of custom structure definitions provided by the mod. */
    structures?: Record<string, StructureDefinition>;
    /** Optional: A record of custom creature definitions provided by the mod. */
    creatures?: Record<string, CreatureDefinition>;
    /** Optional: A record of custom biome definitions provided by the mod. */
    biomes?: Record<string, BiomeDefinition>;
    /** Optional: A record of custom random event definitions provided by the mod. */
    events?: Record<string, RandomEventDefinition>;
    /** Optional: A record of custom weather definitions provided by the mod. */
    weather?: Record<string, WeatherDefinition>;
}

/**
 * Defines an enemy spawn configuration, linking a creature definition with spawn conditions.
 */
export interface EnemySpawn {
    /** The creature definition for the enemy to be spawned. */
    data: CreatureDefinition;
    /** The conditions under which this enemy will spawn. */
    conditions: SpawnConditions;
}

/**
 * Defines the experience curve for player leveling.
 * Each entry specifies a level range and the experience increase rate for that range.
 */
export const ExpCurve = [
    { level: 20, increase: 0.25 }, // Levels 1-20: 25% increase
    { level: 60, increase: 0.15 }, // Levels 21-60: 15% increase
    { level: 100, increase: 0.05 }, // Levels 61-100: 5% increase
];

/**
 * Defines the comprehensive outcome of a crafting attempt.
 */
export interface CraftingOutcome {
    /** Indicates if the recipe can be crafted with current resources and tools. */
    canCraft: boolean;
    /** The probability (0-1) of successful crafting, if applicable. */
    chance: number;
    /** Indicates if the player possesses the required tool for crafting. */
    hasRequiredTool: boolean;
    /** A list of ingredients that will be consumed upon successful crafting. */
    ingredientsToConsume: { name: string; quantity: number }[];
    /**
     * A detailed breakdown of each ingredient requirement, including what was used,
     * if it was a substitute, and if enough quantity was available.
     */
    resolvedIngredients: {
        /** The original recipe ingredient requirement. */
        requirement: RecipeIngredient;
        /** The item actually used (could be a substitute). */
        usedItem: { name: TranslatableString, tier: number };
        /** True if a substitute item was used for this ingredient. */
        isSubstitute: boolean;
        /** True if the player has enough of this ingredient (or its substitute). */
        hasEnough: boolean;
        /** The quantity of this ingredient (or its substitute) the player currently has. */
        playerQuantity: number;
    }[];
    /** Optional: Detailed craftability information. */
    craftability?: CraftabilityInfo;
}
