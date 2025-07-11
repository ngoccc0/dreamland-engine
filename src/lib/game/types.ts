

import type { TranslationKey } from "../i18n";
import type { 
    ItemDefinition as ItemDefZod, 
    ItemEffect, 
    Recipe as RecipeDefZod, 
    StructureDefinition,
    BiomeDefinition,
    WeatherDefinition,
    RandomEventDefinition,
    CreatureDefinition,
    LootDrop,
    SpawnConditions,
    PlayerAttributes
} from "./definitions";


// Re-export for easier access elsewhere
export type { 
    ItemEffect, 
    StructureDefinition,
    BiomeDefinition,
    WeatherDefinition,
    RandomEventDefinition,
    CreatureDefinition,
    LootDrop,
    SpawnConditions,
    PlayerAttributes,
};

export const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave", "jungle", "volcanic", "wall", "floptropica", "tundra", "beach", "mesa", "mushroom_forest", "ocean", "city", "space_station", "underwater"];

export type ItemDefinition = Omit<ItemDefZod, 'spawnBiomes'> & { spawnBiomes?: Terrain[] };
export type Recipe = Omit<RecipeDefZod, 'ingredients'> & { ingredients: RecipeIngredient[] };

// Represents a contiguous region of a single biome.
export interface Region {
    terrain: Terrain;
    cells: { x: number; y: number }[];
}

export type Terrain = "forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave" | "jungle" | "volcanic" | "wall" | "floptropica" | "tundra" | "beach" | "mesa" | "mushroom_forest" | "ocean" | "city" | "space_station" | "underwater";
export type SoilType = 'loamy' | 'clay' | 'sandy' | 'rocky' | 'metal';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type ItemCategory = 'Weapon' | 'Armor' | 'Accessory' | 'Material' | 'Energy Source' | 'Food' | 'Consumable' | 'Potion' | 'Data' | 'Tool' | 'Utility' | 'Magic' | 'Fusion' | 'Misc';
export type PlayerPersona = 'none' | 'explorer' | 'warrior' | 'artisan';
export type GameMode = 'ai' | 'offline';
export type DiceType = 'd20' | 'd12' | '2d6';
export type AiModel = 'balanced' | 'creative' | 'fast' | 'quality';
export type NarrativeLength = 'short' | 'medium' | 'long';
export type GameTheme = 'Magic' | 'Technology' | 'Post-Apocalypse' | 'Cyberpunk' | 'Normal';
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';
export type FontFamily = 'literata' | 'inter' | 'source_code_pro';
export type FontSize = 'sm' | 'base' | 'lg';
export type Theme = 'light' | 'dark';


// --- WEATHER SYSTEM TYPES ---
// WeatherState is now an instance of a WeatherDefinition
export type WeatherState = WeatherDefinition;

export interface WeatherZone {
  id: string; // Typically the regionId
  terrain: Terrain;
  currentWeather: WeatherState;
  nextChangeTime: number; // The game time when the weather will change
}


// --- WORLD & GAME STATE TYPES ---

// Represents the structure of items loaded from Firestore/premade worlds.
export type GeneratedItem = Omit<ItemDefinition, 'name' | 'description'> & {
  name: string | { en: string; vi: string };
  description: string | { en: string; vi: string };
};

// 1. WorldProfile: Global settings for the world, affecting all biomes.
export interface WorldProfile {
    climateBase: 'temperate' | 'arid' | 'tropical';
    magicLevel: number; // 0-10, how magical the world is
    mutationFactor: number; // 0-10, chance for strange things to happen
    sunIntensity: number; // 0-10, base sunlight level
    weatherTypesAllowed: ('clear' | 'rain' | 'fog' | 'snow')[];
    moistureBias: number; // -5 to +5, global moisture offset
    tempBias: number; // -5 to +5, global temperature offset
    resourceDensity: number; // 0-10, affects amount of spawned resources
    theme: GameTheme;
}

// 2. Season: Global modifiers based on the time of year.
export interface SeasonModifiers {
    temperatureMod: number;
    moistureMod: number;
    sunExposureMod: number;
    windMod: number;
    eventChance: number; // Base chance for seasonal events
}

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
    name: string;
    description: TranslationKey; // Now a key
    quantity: number;
    tier: number;
    emoji: string;
}

export interface PlayerItem {
    name: string;
    quantity: number;
    tier: number;
    emoji: string;
}

export interface Pet {
    type: string;
    name?: string;
    level: number;
}

export interface Npc {
    name: { en: string; vi: string };
    description: { en: string; vi: string };
    dialogueSeed: { en: string; vi: string };
    quest?: { en: string; vi: string };
    questItem?: { name: string; quantity: number };
    rewardItems?: PlayerItem[];
}

// Represents a skill the player can use.
export interface Skill {
    name: TranslationKey;
    description: TranslationKey;
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

// Represents a structure in the world (natural or player-built)
// This is now an instance of a StructureDefinition
export interface Structure extends StructureDefinition {
    // any instance-specific state could go here in the future
}


// Represents a contextual action available in a chunk
export interface Action {
  id: number;
  textKey: TranslationKey;
  params?: Record<string, string | number>;
}


// This represents the detailed properties of a single tile/chunk in the world.
export interface Chunk {
    x: number;
    y: number;
    terrain: Terrain;
    description: string;
    NPCs: Npc[];
    items: ChunkItem[];
    structures: Structure[];
    explored: boolean;
    lastVisited: number; // The turn number this chunk was last part of the player's view
    enemy: {
        type: string;
        hp: number;
        damage: number;
        behavior: 'aggressive' | 'passive' | 'defensive' | 'territorial' | 'immobile' | 'ambush';
        size: 'small' | 'medium' | 'large';
        diet: string[]; // e.g., ['Thịt hoang hung dữ', 'Quả Mọng Ăn Được']
        satiation: number; // Current food level
        maxSatiation: number; // How much food it needs to be "full"
        emoji: string;
        harvestable?: { // For resources like trees
            difficulty: number;
            requiredTool: string;
            loot: LootDrop[];
        };
        senseEffect?: { keywords: string[] };
    } | null;
    actions: Action[];
    regionId: number;

    // --- Detailed Tile Attributes ---
    travelCost: number;          // How many turns/energy it costs to cross this tile.
    vegetationDensity: number;   // 0-10, density of plants, affects visibility.
    moisture: number;            // 0-10, affects fungi, swamps, slipperiness.
    elevation: number;           // -10 to 10, height, creates slopes, hills.
    lightLevel: number;          // -10 (pitch black) to 10 (bright sun), affects visibility, enemy spawning.
    dangerLevel: number;         // 0-10, probability of traps, enemies.
    magicAffinity: number;       // 0-10, presence of magical energy.
    humanPresence: number;       // 0-10, signs of human activity (camps, ruins).
    explorability: number;       // 0-10, ease of exploration.
    soilType: SoilType;          // Type of ground, affects what can grow.
    predatorPresence: number;    // 0-10, likelihood of predator encounters.

    // Optional because they are dynamically calculated by applying weather to a base value
    windLevel?: number;
    temperature?: number;
}

// Represents the entire game world as a collection of chunks.
export interface World {
    [key: string]: Chunk;
}

// Represents the player's current status.
export interface PlayerStatus {
    hp: number;
    mana: number;
    stamina: number;
    bodyTemperature: number;
    items: PlayerItem[];
    equipment: {
        weapon: PlayerItem | null;
        armor: PlayerItem | null;
        accessory: PlayerItem | null;
    };
    quests: string[];
    questsCompleted: number;
    skills: Skill[];
    persona: PlayerPersona;
    attributes: PlayerAttributes;
    pets?: Pet[];
    unlockProgress: {
        kills: number;
        damageSpells: number;
        moves: number;
    };
    journal?: Record<number, string>;
    dailyActionLog?: string[];
    questHints?: Record<string, string>;
    trackedEnemy?: {
        chunkKey: string;
        type: string;
        lastSeen: number; // turn
    };
}

export interface PlayerBehaviorProfile {
    moves: number;
    attacks: number;
    crafts: number;
    customActions: number;
}

export type NarrativeEntry = {
    id: string;
    text: string;
    type: 'narrative' | 'action' | 'system';
}

// This defines the final, assembled world concept object that the game uses.
// It's constructed in the WorldSetup component from the AI's generated data.
export interface WorldConcept {
  worldName: string;
  initialNarrative: string;
  startingBiome: Terrain;
  customItemCatalog: ItemDefinition[];
  customStructures: StructureDefinition[];
  playerInventory: { name: string; quantity: number }[];
  initialQuests: string[];
  startingSkill: Skill;
}

export interface RecipeIngredient {
    name: string;
    quantity: number;
}

// Represents the detailed result of checking a recipe, for use in the UI.
export interface CraftingOutcome {
    canCraft: boolean;
    chance: number;
    hasRequiredTool: boolean;
    ingredientsToConsume: { name: string; quantity: number }[];
    resolvedIngredients: {
        requirement: {name: string, quantity: number};
        usedItem: { name: string; tier: number } | null; // which item was chosen
        isSubstitute: boolean;
        hasEnough: boolean; // if enough of *any* valid item is available for this slot
        playerQuantity: number;
    }[];
}


// Represents the entire savable state of the game
export interface GameState {
    worldProfile: WorldProfile;
    currentSeason: Season;
    world: World;
    regions: { [id: number]: Region };
    recipes: Record<string, Recipe>;
    buildableStructures: Record<string, Structure>;
    regionCounter: number;
    playerPosition: { x: number; y: number };
    playerBehaviorProfile: PlayerBehaviorProfile;
    playerStats: PlayerStatus;
    narrativeLog: NarrativeEntry[];
    worldSetup: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog' | 'customStructures'> & { playerInventory: PlayerItem[], startingSkill: Skill, customStructures: Structure[] };
    customItemDefinitions: Record<string, ItemDefinition>;
    customItemCatalog: GeneratedItem[];
    customStructures: StructureDefinition[];
    weatherZones: { [zoneId: string]: WeatherZone };
    gameTime: number; // In-game minutes from 0 to 1439
    day: number;
    turn: number;
}

// --- RANDOM EVENT SYSTEM ---
// This is an instance of a RandomEventDefinition
export type RandomEvent = RandomEventDefinition;

// --- MODDING ---
// This is now the definitive structure for a mod file.
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
