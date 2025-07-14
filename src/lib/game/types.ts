import type { TranslationKey, Language } from "../i18n";
import type { 
    ItemDefinition as ItemDefZod, 
    ItemEffect, 
    Recipe as RecipeDefZod, 
    StructureDefinition as StructDefZod,
    BiomeDefinition as BiomeDefZod,
    WeatherDefinition,
    RandomEventDefinition,
    CreatureDefinition,
    LootDrop,
    SpawnConditions,
    PlayerAttributes,
    ItemCategory, 
    MultilingualText,
} from "./definitions";

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
    Language,
};

export const allTerrains: [Terrain, ...Terrain[]] = ["forest", "grassland", "desert", "swamp", "mountain", "cave", "jungle", "volcanic", "wall", "floptropica", "tundra", "beach", "mesa", "mushroom_forest", "ocean", "city", "space_station", "underwater"];

export type TranslatableString = { en: string; vi: string; } | TranslationKey;

export type ItemDefinition = Omit<ItemDefZod, 'name' | 'description' | 'spawnBiomes'> & { 
    name: TranslatableString,
    description: TranslatableString,
    spawnBiomes?: Terrain[] 
};
export type BiomeDefinition = Omit<BiomeDefZod, 'id'>;
export type Recipe = Omit<RecipeDefZod, 'ingredients' | 'description'> & { 
    ingredients: RecipeIngredient[],
    description: MultilingualText,
};
export type StructureDefinition = Omit<StructDefZod, 'name' | 'description'> & {
    name: TranslatableString,
    description: TranslatableString,
};

// Represents a contiguous region of a single biome.
export interface Region {
    terrain: Terrain;
    cells: { x: number; y: number }[];
}

export type Terrain = "forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave" | "jungle" | "volcanic" | "wall" | "floptropica" | "tundra" | "beach" | "mesa" | "mushroom_forest" | "ocean" | "city" | "space_station" | "underwater";
export type SoilType = 'loamy' | 'clay' | 'sandy' | 'rocky' | 'metal';
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
export type GeneratedItem = Omit<ItemDefinition, 'name' | 'description'> & {
  name: TranslatableString;
  description: TranslatableString;
};

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

export interface Structure extends Omit<StructureDefinition, 'name' | 'description'> {
    name: TranslatableString;
    description: TranslatableString;
}

export interface Action {
  id: number;
  textKey: TranslationKey;
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
    enemy: {
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
        senseEffect?: { keywords: string[] };
    } | null;
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

export interface World {
    [key: string]: Chunk;
}

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
    language?: Language;
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

export interface WorldConcept {
  worldName: TranslatableString;
  initialNarrative: TranslatableString;
  startingBiome: Terrain;
  customStructures: StructureDefinition[];
  playerInventory: { name: string; quantity: number }[];
  initialQuests: TranslatableString[];
  startingSkill: Skill;
  customItemCatalog?: GeneratedItem[];
}

export interface RecipeIngredient {
    name: string;
    quantity: number;
}

export interface CraftingOutcome {
    canCraft: boolean;
    chance: number;
    hasRequiredTool: boolean;
    ingredientsToConsume: { name: string; quantity: number }[];
    resolvedIngredients: {
        requirement: {name: string, quantity: number};
        usedItem: { name: string; tier: number } | null; 
        isSubstitute: boolean;
        hasEnough: boolean; 
        playerQuantity: number;
    }[];
}

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
    worldSetup: Omit<WorldConcept, 'playerInventory' | 'customStructures' | 'customItemCatalog' | 'initialQuests' > & { 
        playerInventory: PlayerItem[], 
        startingSkill: Skill, 
        customStructures: Structure[],
        customItemCatalog: GeneratedItem[],
        initialQuests: string[],
    };
    customItemDefinitions: Record<string, ItemDefinition>;
    customItemCatalog: GeneratedItem[];
    customStructures: StructureDefinition[];
    weatherZones: { [zoneId: string]: WeatherZone };
    gameTime: number; 
    day: number;
    turn: number;
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
