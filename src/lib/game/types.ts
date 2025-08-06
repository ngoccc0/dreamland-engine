/**
 * Represents an enemy entity in the game world.
 * This interface is designed for extensibility and modding.
 *
 * @property type - The enemy's type or name (translatable).
 * @property hp - The enemy's hit points.
 * @property damage - The base damage dealt by the enemy.
 * @property behavior - The AI behavior pattern of the enemy.
 * @property size - The size category of the enemy.
 * @property diet - The enemy's diet (for ecosystem simulation).
 * @property satiation - Current satiation level.
 * @property maxSatiation - Maximum satiation level.
 * @property emoji - Emoji representation for UI.
 * @property harvestable - Optional: harvesting info (loot, requirements).
 * @property senseEffect - Optional: special senses or detection effects. Keywords should be descriptive cues, e.g., "smell:foul", "sound:rumbling".
 * @example
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
 * }
 */
export interface Enemy {
  type: TranslatableString;
  hp: number;
  damage: number;
  behavior: 'aggressive' | 'passive' | 'defensive' | 'territorial' | 'immobile' | 'ambush';
  size: 'small' | 'medium' | 'large';
  diet: string[];
  satiation: number;
  maxSatiation: number;
  emoji: string;
  harvestable?: {
    difficulty: number;
    requiredTool: string;
    loot: LootDrop[];
  };
  /**
   * Sensory cues for AI/narrative. Use descriptive keywords, e.g., "smell:foul", "sound:rumbling".
   */
  senseEffect?: { keywords: string[] };
  // Mod extension fields can be added here
}


import type { TranslatableString } from '@/core/types/i18n';

// Re-export TranslatableString và TranslationObject từ core để đồng bộ type toàn dự án
export type { TranslatableString, TranslationObject } from '@/core/types/i18n';

/**
 * Supported language codes.
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
    StructureDefinition
} from "./definitions";
// WorldDefinition and PlayerStatusDefinition are defined in ../definitions/world-definitions, but not found. Define them here for now.
export type WorldDefinition = Record<string, any>; // TODO: Replace with real type
export type PlayerStatusDefinition = Record<string, any>; // TODO: Replace with real type

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

// Re-export core types
// Already exported below
// Already exported above

// --- TERRAIN TYPES ---
export type SoilType = 'rocky' | 'sandy' | 'fertile' | 'clay' | 'loamy' | 'volcanic' | 'peaty' | 'silty' | 'chalky';
export const SoilTypeEnum = z.enum(['rocky', 'sandy', 'fertile', 'clay', 'loamy', 'volcanic', 'peaty', 'silty', 'chalky']);

/**
 * Represents the craftability calculation result for a recipe.
 * @property score - Percentage of available ingredients (0-1)
 * @property missingIngredients - Names of missing ingredients
 * @property availableIngredients - Names of available ingredients
 */
export interface CraftabilityInfo {
  score: number;
  missingIngredients: string[];
  availableIngredients: string[];
}

export interface CraftingOutcome {
  canCraft: boolean;
  chance: number;
  hasRequiredTool: boolean;
  ingredientsToConsume: { name: string; quantity: number }[];
  resolvedIngredients: {
    requirement: RecipeIngredient;
    usedItem: { name: TranslatableString, tier: number };
    isSubstitute: boolean;
    hasEnough: boolean;
    playerQuantity: number;
  }[];
  craftability?: CraftabilityInfo;
}


/**
 * @description The supported terrain types in the game world.
 */
export const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave", "jungle", "volcanic", "wall", "floptropica", "tundra", "beach", "mesa", "mushroom_forest", "ocean", "city", "space_station", "underwater"];


// Core types are re-exported from definitions module
export type { ItemDefinition, BiomeDefinition, Recipe, StructureDefinition } from './definitions';

/**
 * @description Represents a contiguous region of a single biome in the game world.
 */
export interface Region {
    terrain: Terrain;
    cells: { x: number; y: number }[];
}

export type Terrain = "forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave" | "jungle" | "volcanic" | "wall" | "floptropica" | "tundra" | "beach" | "mesa" | "mushroom_forest" | "ocean" | "city" | "space_station" | "underwater";
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type PlayerPersona = 'none' | 'explorer' | 'warrior' | 'artisan';
export type GameMode = 'ai' | 'offline';
export type DiceType = 'd20' | 'd12' | '2d6';
export type AiModel = 'balanced' | 'creative' | 'fast' | 'quality';

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type FontFamily = 'literata' | 'inter' | 'source_code_pro';
export type FontSize = 'sm' | 'base' | 'lg';
export type Theme = 'light' | 'dark';

export type ConditionRange = {
    min?: number;
    max?: number;
};

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

export type NarrativeTemplateType = 'Opening' | 'EnvironmentDetail' | 'SensoryDetail' | 'EntityReport' | 'SurroundingPeek' | 'Closing' | 'Filler';
export type NarrativeLength = 'short' | 'medium' | 'long' | 'detailed';
export type MoodTag = 'Danger' | 'Peaceful' | 'Magic' | 'Foreboding' | 'Resourceful' | 'Lush' | 'Gloomy' | 'Dark' | 'Serene' | 'Vibrant' | 'Mysterious' | 'Desolate' | 'Threatening' | 'Wet' | 'Arid' | 'Wild' | 'Ethereal' | 'Civilized' | 'Historic' | 'Hot' | 'Cold' | 'Harsh' | 'Rugged' | 'Elevated' | 'Confined' | 'Smoldering' | 'Vast' | 'Structured' | 'Barren' | 'Abandoned';

export type NarrativeTemplate = {
    id: string;
    type: NarrativeTemplateType;
    mood: MoodTag[];
    length: NarrativeLength;
    conditions?: ConditionType;
    weight: number;
    template: string;
};

export type BiomeAdjectiveCategory = {
    [key: string]: string[];
};

export type BiomeTemplateData = {
    terrain: string;
    descriptionTemplates: NarrativeTemplate[];
    adjectives: BiomeAdjectiveCategory;
    features: BiomeAdjectiveCategory;
    smells: BiomeAdjectiveCategory;
    sounds: BiomeAdjectiveCategory;
    sky?: BiomeAdjectiveCategory;
};

export type GameTemplates = {
    [key: string]: BiomeTemplateData;
};

// --- WEATHER SYSTEM TYPES ---
export type WeatherState = WeatherDefinition;

export interface WeatherZone {
  id: string; 
  terrain: Terrain;
  currentWeather: WeatherState;
  nextChangeTime: number; 
}

// --- WORLD & GAME STATE TYPES ---
export type GeneratedItem = ItemDefinition;

export interface WorldProfile {
    climateBase: 'temperate' | 'arid' | 'tropical';
    magicLevel: number; 
    mutationFactor: number; 
    sunIntensity: number; 
    weatherTypesAllowed: ('clear' | 'rain' | 'fog' | 'snow')[];
    moistureBias: number; 
    tempBias: number; 
    resourceDensity: number; 
    theme: GameTheme;
}

export interface SeasonModifiers {
    temperatureMod: number;
    moistureMod: number;
    sunExposureMod: number;
    windMod: number;
    eventChance: number; 
}

export type GameTheme = 'Normal' | 'Magic' | 'Horror' | 'SciFi';

export interface GameSettings {
  gameMode: GameMode;
  diceType: DiceType;
  aiModel: AiModel;
  narrativeLength: NarrativeLength;
  fontFamily: FontFamily;
  fontSize: FontSize;
  theme: Theme;
  mods: ModBundle | null;
}

export interface ChunkItem {
    name: TranslatableString;
    description: TranslatableString; 
    quantity: number;
    tier: number;
    emoji: string;
}

export interface PlayerItem {
    name: TranslatableString;
    quantity: number;
    tier: number;
    emoji: string;
}

export interface Pet {
    type: TranslatableString;
    name?: string;
    level: number;
}

export interface Npc {
    name: TranslatableString;
    description: TranslatableString;
    dialogueSeed: TranslatableString;
    quest?: TranslatableString;
    questItem?: { name: string; quantity: number };
    rewardItems?: PlayerItem[];
}

export interface Skill {
    name: TranslatableString;
    description: TranslatableString;
    tier: number;
    manaCost: number;
    effect: {
        type: 'HEAL' | 'DAMAGE' | 'TELEPORT';
        amount: number;
        target: 'SELF' | 'ENEMY';
        healRatio?: number;
    };
    unlockCondition?: {
        type: 'kills' | 'damageSpells' | 'moves';
        count: number;
    };
}

export interface Structure extends StructureDefinition {}


export interface Action {
  id: number;
  textKey: string;
  params?: Record<string, string | number>;
}

export interface Chunk {
    x: number;
    y: number;
    terrain: Terrain;
    description: string;
    NPCs: Npc[];
    items: ChunkItem[];
    structures: Structure[];
    explored: boolean;
    lastVisited: number; 
    enemy: Enemy | null;
    actions: Action[];
    regionId: number;
    travelCost: number;          
    vegetationDensity: number;   
    moisture: number;            
    elevation: number;           
    lightLevel: number;          
    dangerLevel: number;         
    magicAffinity: number;       
    humanPresence: number;       
    explorability: number;       
    soilType: SoilType;          
    predatorPresence: number;    
    windLevel?: number;
    temperature?: number;
}

export interface PlayerBehaviorProfile {
    moves: number;
    attacks: number;
    crafts: number;
    customActions: number;
    /**
     * Item name (translatable).
     */
    name: TranslatableString;
    /**
     * Item description (translatable).
     */
    description: TranslatableString; 
    /**
     * Quantity of the item.
     */
    quantity: number;
    /**
     * Item tier/rarity.
     */
    tier: number;
    /**
     * Emoji for UI.
     */
    emoji: string;
}

export type NarrativeEntry = {
    id: string;
    text: string;
    type: 'narrative' | 'action' | 'system';
    /**
     * Item name (translatable).
     */
    name: TranslatableString;
    /**
     * Quantity of the item.
     */
    quantity: number;
    /**
     * Item tier/rarity.
     */
    tier: number;
    /**
     * Emoji for UI.
     */
    emoji: string;
}

export interface WorldConcept {
    worldName: TranslatableString;
    initialNarrative: TranslatableString;
    startingBiome: Terrain;
    startingSkill: Skill;
    playerInventory: PlayerItem[];
    initialQuests: TranslatableString[];
    customStructures?: Structure[];
    customItemCatalog?: GeneratedItem[];
    /**
     * Pet type (translatable).
     */
    type: TranslatableString;
    /**
     * Pet name (optional).
     */
    name?: string;
    /**
     * Pet level.
     */
    level: number;
}

/**
 * GameState holds the full serializable state of the game for save/load/modding.
 * Uses plain interfaces for world and player, mapped to entity classes for logic.
 */
export interface GameState {
    worldProfile: WorldProfile;
    currentSeason: Season;
    /**
     * Serializable world state for save/load/modding. See GameWorld entity for logic.
     */
    world: WorldDefinition;
    regions: { [id: number]: Region };
    recipes: Record<string, Recipe>;
    buildableStructures: Record<string, Structure>;
    regionCounter: number;
    playerPosition: { x: number; y: number };
    playerBehaviorProfile: PlayerBehaviorProfile;
    /**
     * Serializable player state for save/load/modding. See Character entity for logic.
     */
    playerStats: PlayerStatusDefinition;
    narrativeLog: NarrativeEntry[];
    worldSetup: WorldConcept;
    customItemDefinitions: Record<string, ItemDefinition>;
    customItemCatalog: GeneratedItem[];
    customStructures: StructureDefinition[];
    weatherZones: { [zoneId: string]: WeatherZone };
    gameTime: number; 
    day: number;
    turn: number;
    // Skill fields below may be legacy or misplaced; consider refactoring to Skill[] or player entity
    name: TranslatableString;
    description: TranslatableString;
    tier: number;
    manaCost: number;
    effect: {
        type: 'HEAL' | 'DAMAGE' | 'TELEPORT';
        amount: number;
        target: 'SELF' | 'ENEMY';
        healRatio?: number;
    };
    unlockCondition?: {
        type: 'kills' | 'damageSpells' | 'moves';
        count: number;
    };
}

export type RandomEvent = RandomEventDefinition;

export interface ModBundle {
    id: string;
    items?: Record<string, ItemDefinition>;
    recipes?: Record<string, Recipe>;
    structures?: Record<string, StructureDefinition>;
    creatures?: Record<string, CreatureDefinition>;
    biomes?: Record<string, BiomeDefinition>;
    events?: Record<string, RandomEventDefinition>;
    weather?: Record<string, WeatherDefinition>;
}

export interface EnemySpawn {
    data: CreatureDefinition;
    conditions: SpawnConditions;
}

/**
 * @description Defines the output of a crafting calculation.
 */
export const ExpCurve = [
  { level: 20, increase: 0.25 }, // Levels 1-20: 25% increase
  { level: 60, increase: 0.15 }, // Levels 21-60: 15% increase
  { level: 100, increase: 0.05 }, // Levels 61-100: 5% increase
];

export interface CraftingOutcome {
    canCraft: boolean;
    chance: number;
    hasRequiredTool: boolean;
    ingredientsToConsume: { name: string; quantity: number }[];
    resolvedIngredients: {
        requirement: RecipeIngredient;
        usedItem: { name: TranslatableString, tier: number };
        isSubstitute: boolean;
        hasEnough: boolean;
        playerQuantity: number;
    }[];
    craftability?: CraftabilityInfo;
}
