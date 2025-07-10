
import type { TranslationKey } from "../i18n";
import type { ItemDefinition, ItemEffect, GeneratedItem, RecipeIngredient, Recipe, StructureDefinition } from "./definitions";


// Re-export for easier access elsewhere
export type { ItemDefinition, ItemEffect, GeneratedItem, Recipe, StructureDefinition };

// Represents a contiguous region of a single biome.
export interface Region {
    terrain: Terrain;
    cells: { x: number; y: number }[];
}

export type Terrain = "forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave" | "jungle" | "volcanic" | "wall" | "floptropica" | "tundra" | "beach" | "mesa" | "mushroom_forest" | "ocean" | "city" | "space_station" | "underwater";
export type SoilType = 'loamy' | 'clay' | 'sandy' | 'rocky' | 'metal';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type ItemCategory = 'Weapon' | 'Material' | 'Energy Source' | 'Food' | 'Data' | 'Tool' | 'Equipment' | 'Support' | 'Magic' | 'Fusion' | 'Consumable' | 'Utility' | 'Armor' | 'Potion' | 'Misc';
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


// --- NEW WEATHER SYSTEM TYPES ---

export interface WeatherState {
  name: TranslationKey;
  description: TranslationKey;
  biome_affinity: Terrain[];
  season_affinity: Season[];
  temperature_delta: number;
  moisture_delta: number;
  wind_delta: number;
  light_delta: number;
  spawnWeight: number; // How likely this weather is to be chosen
  exclusive_tags: string[]; // e.g., ["rain", "storm"]. Prevents illogical combinations.
  duration_range: [number, number]; // in game ticks
}

export interface WeatherZone {
  id: string; // Typically the regionId
  terrain: Terrain;
  currentWeather: WeatherState;
  nextChangeTime: number; // The game time when the weather will change
}


// --- WORLD & GAME STATE TYPES ---

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
    description: string;
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

export interface PlayerAttributes {
    physicalAttack?: number;
    magicalAttack?: number;
    physicalDefense?: number;
    magicalDefense?: number;
    critChance?: number;
    attackSpeed?: number;
    cooldownReduction?: number;
}

export interface Npc {
    name: TranslationKey;
    description: TranslationKey;
    dialogueSeed: TranslationKey;
    quest?: TranslationKey;
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
export interface Structure {
    name: TranslationKey;
    description: TranslationKey;
    emoji: string;
    providesShelter?: boolean;
    buildable?: boolean;
    buildCost?: { name: string; quantity: number }[];
    restEffect?: { hp: number; stamina: number };
    heatValue?: number;
}

// Represents a contextual action available in a chunk
export interface Action {
  id: number;
  textKey: TranslationKey;
  params?: Record<string, string | number>;
}

// Helper type for defining spawn conditions for an entity
export interface SpawnConditions {
    chance?: number;
    vegetationDensity?: { min?: number, max?: number };
    moisture?: { min?: number, max?: number };
    elevation?: { min?: number, max?: number };
    dangerLevel?: { min?: number, max?: number };
    magicAffinity?: { min?: number, max?: number };
    humanPresence?: { min?: number, max?: number };
    predatorPresence?: { min?: number, max?: number };
    lightLevel?: { min?: number, max?: number };
    temperature?: { min?: number, max?: number };
    soilType?: SoilType[];
    timeOfDay?: 'day' | 'night';
    visibility?: { min?: number, max?: number };
    humidity?: { min?: number, max?: number };
};


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
        diet: string[]; // e.g., ['Thỏ hoang hung dữ', 'Quả Mọng Ăn Được']
        satiation: number; // Current food level
        maxSatiation: number; // How much food it needs to be "full"
        emoji: string;
        harvestable?: { // For resources like trees
            difficulty: number;
            requiredTool: string;
            loot: { name: string; chance: number; quantity: { min: number; max: number } }[];
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
    id: number;
    text: string;
    type: 'narrative' | 'action' | 'system';
}

// This defines the final, assembled world concept object that the game uses.
// It's constructed in the WorldSetup component from the AI's generated data.
export interface WorldConcept {
  worldName: string;
  initialNarrative: string;
  startingBiome: Terrain;
  customItemCatalog: GeneratedItem[];
  customStructures: Structure[];
  playerInventory: { name: string; quantity: number }[];
  initialQuests: string[];
  startingSkill: Skill;
}

// This represents the detailed result of checking a recipe, for use in the UI.
export interface CraftingOutcome {
    canCraft: boolean;
    chance: number;
    hasRequiredTool: boolean;
    ingredientsToConsume: { name: string; quantity: number }[];
    resolvedIngredients: {
        requirement: RecipeIngredient;
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
    customStructures: Structure[];
    weatherZones: { [zoneId: string]: WeatherZone };
    gameTime: number; // In-game minutes from 0 to 1439
    day: number;
    turn: number;
}

// --- RANDOM EVENT SYSTEM ---

export interface EventOutcome {
  descriptionKey: import('../i18n').TranslationKey;
  effects: {
    hpChange?: number;
    staminaChange?: number;
    manaChange?: number;
    items?: { name: string; quantity: number }[];
    spawnEnemy?: { type: string; hp: number; damage: number };
    unlockRecipe?: string;
  };
}

export interface RandomEvent {
  id: import('../i18n').TranslationKey; // The ID is also the translation key for the event name
  theme: GameTheme;
  difficulty: 'easy' | 'medium' | 'hard';
  chance?: number;
  // A function to check if this event can trigger in the current context
  canTrigger: (chunk: Chunk, playerStats: PlayerStatus, season: Season) => boolean;
  outcomes: {
    [key in import('./dice').SuccessLevel]?: EventOutcome;
  };
}


export interface BiomeDefinition {
    minSize: number;
    maxSize: number;
    travelCost: number;
    spreadWeight: number;
    allowedNeighbors: Terrain[];
    defaultValueRanges: {
        vegetationDensity: { min: number, max: number };
        moisture: { min: number, max: number };
        elevation: { min: number, max: number };
        dangerLevel: { min: number, max: number };
        magicAffinity: { min: number, max: number };
        humanPresence: { min: number, max: number };
        predatorPresence: { min: number, max: number };
        temperature: { min: number, max: number };
    };
    soilType: SoilType[];
}


// --- MODDING ---
export interface EnemySpawn {
    data: Omit<NonNullable<Chunk['enemy']>, 'type'> & { type: string };
    conditions: SpawnConditions;
}

export interface ModBundle {
    id: string;
    items?: Record<string, Omit<ItemDefinition, 'id' | 'name' | 'description'> & { name: {en: string, vi: string}, description: {en: string, vi: string} }>;
    recipes?: Record<string, Omit<Recipe, 'id' | 'description' | 'result'> & { result: { itemId: string, quantity: number}, description: {en: string, vi: string} }>;
    enemies?: Partial<Record<Terrain, EnemySpawn[]>>;
    // Future modding capabilities can be added here
    // biomes?: Record<string
}

// This is the structure a modder uses to define new content.
// It's a superset of ModBundle, meant for local development with full typing.
export interface ModDefinition {
    id: string;
    items?: Record<string, ItemDefinition>;
    recipes?: Record<string, Recipe>;
    enemies?: Partial<Record<Terrain, EnemySpawn[]>>;
    structures?: Record<string, StructureDefinition>;
}
