// --- Data Types and Interfaces for the Game Engine ---

export type Terrain = "forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave";
export type SoilType = 'loamy' | 'clay' | 'sandy' | 'rocky';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type ItemCategory = 'Weapon' | 'Material' | 'Energy Source' | 'Food' | 'Data' | 'Tool' | 'Equipment' | 'Support' | 'Magic' | 'Fusion';

// --- NEW WEATHER SYSTEM TYPES ---

export interface WeatherState {
  name: string;
  description: string;
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
  nextChangeTime: number; // The game tick when the weather will change
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
}

// 2. Season: Global modifiers based on the time of year.
export interface SeasonModifiers {
    temperatureMod: number;
    moistureMod: number;
    sunExposureMod: number;
    windMod: number;
    eventChance: number; // Base chance for seasonal events
}

export interface ChunkItem {
    name: string;
    description: string;
    quantity: number;
    tier: number;
}

export interface PlayerItem {
    name: string;
    quantity: number;
    tier: number;
}

export interface Pet {
    type: string;
    name?: string;
    level: number;
}

// Represents a skill the player can use.
export interface Skill {
    name: string;
    description: string;
    tier: number;
    manaCost: number;
    effect: {
        type: 'HEAL' | 'DAMAGE';
        amount: number;
        target: 'SELF' | 'ENEMY';
    };
}

// This represents the detailed properties of a single tile/chunk in the world.
export interface Chunk {
    x: number;
    y: number;
    terrain: Terrain;
    description: string;
    NPCs: string[];
    items: ChunkItem[];
    explored: boolean;
    enemy: {
        type: string;
        hp: number;
        damage: number;
        behavior: 'aggressive' | 'passive';
        diet: string[]; // e.g., ['Thỏ hoang hung dữ', 'Quả Mọng Ăn Được']
        satiation: number; // Current food level
        maxSatiation: number; // How much food it needs to be "full"
    } | null;
    actions: { id: number; text: string }[];
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
    items: PlayerItem[];
    quests: string[];
    skills: Skill[];
    attributes: {
        physicalAttack: number;
        magicalAttack: number;
        critChance: number;
        attackSpeed: number;
        cooldownReduction: number;
    };
    pets?: Pet[];
}

// Represents a contiguous region of a single biome.
export interface Region {
    terrain: Terrain;
    cells: { x: number; y: number }[];
}

// Defines the "rulebook" for the procedural world generation.
export interface BiomeDefinition {
    minSize: number;
    maxSize: number;
    travelCost: number;
    spreadWeight: number;
    allowedNeighbors: Terrain[];
    // Defines the valid range for each attribute in this biome
    defaultValueRanges: {
        vegetationDensity: { min: number; max: number };
        moisture: { min: number; max: number };
        elevation: { min: number; max: number };
        dangerLevel: { min: number; max: number };
        magicAffinity: { min: number; max: number };
        humanPresence: { min: number; max: number };
        predatorPresence: { min: number; max: number };
        temperature: { min: number; max: number };
    };
    soilType: SoilType[]; // Can now have multiple valid soil types
}

// Helper type for defining spawn conditions for an entity
export type SpawnConditions = {
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
};

export type NarrativeEntry = {
    id: number;
    text: string;
    type: 'narrative' | 'action' | 'system';
}

export type MapCell = {
  biome: "forest" | "grassland" | "desert" | "swamp" | "mountain" | "cave" | "empty";
  hasPlayer?: boolean;
  hasEnemy?: boolean;
  hasNpc?: boolean;
  hasItem?: boolean;
};

// This defines the final, assembled world concept object that the game uses.
// It's constructed in the WorldSetup component from the AI's generated data.
export interface WorldConcept {
  worldName: string;
  initialNarrative: string;
  startingBiome: Terrain;
  customItemCatalog: GeneratedItem[];
  playerInventory: { name: string; quantity: number }[];
  initialQuests: string[];
  startingSkill: Skill;
}


// Represents the entire savable state of the game
export interface GameState {
    worldProfile: WorldProfile;
    currentSeason: Season;
    world: World;
    regions: { [id: number]: Region };
    regionCounter: number;
    playerPosition: { x: number; y: number };
    playerStats: PlayerStatus;
    narrativeLog: NarrativeEntry[];
    worldSetup: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog'> & { playerInventory: PlayerItem[], startingSkill: Skill };
    customItemDefinitions: Record<string, ItemDefinition>;
    customItemCatalog: GeneratedItem[];
    // New properties for weather system
    weatherZones: { [zoneId: string]: WeatherZone };
    gameTicks: number;
}

// --- NEW DATA-DRIVEN ITEM SYSTEM ---

export type ItemEffect =
  | { type: 'HEAL'; amount: number }
  | { type: 'RESTORE_STAMINA'; amount: number };

export interface ItemDefinition {
  description: string;
  tier: number;
  category: ItemCategory;
  effects: ItemEffect[];
  baseQuantity: { min: number, max: number };
  growthConditions?: {
    optimal: SpawnConditions;
    subOptimal: SpawnConditions;
  }
}

// Type for an item generated by the AI during world setup
export interface GeneratedItem {
    name: string;
    description: string;
    tier: number;
    category: ItemCategory;
    effects: ItemEffect[];
    baseQuantity: { min: number; max: number; };
    spawnBiomes: Terrain[];
    growthConditions?: {
      optimal: SpawnConditions;
      subOptimal: SpawnConditions;
    }
}

export interface RecipeAlternative {
    name: string;
    tier: 1 | 2 | 3; // 1: Perfect, 2: Good, 3: Viable but risky
}

export interface RecipeIngredient {
    name: string; // The primary/ideal ingredient
    quantity: number;
    alternatives?: RecipeAlternative[]; // A list of tiered substitute items
}

export interface Recipe {
    result: { name: string; quantity: number };
    ingredients: RecipeIngredient[];
    description: string;
}
