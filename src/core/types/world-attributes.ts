/**
 * Base attributes for all world objects
 */
export interface BaseAttributes {
    vegetationDensity: number;    // 0-100: How dense the vegetation is
    moisture: number;             // 0-100: How wet the area is
    elevation: number;            // 0-100: Height above sea level
    temperature: number;          // 0-100: Temperature in the area
    windLevel: number;            // 0-100: Wind strength
    lightLevel: number;           // 0-100: Natural light level
    soilType: string;             // Type of soil in the area (string for modding compatibility)
}

/**
 * Additional attributes that affect gameplay mechanics
 */
export interface GameplayAttributes extends BaseAttributes {
    dangerLevel: number;         // 0-100: How dangerous the area is
    magicAffinity: number;       // 0-100: How strong magic is in the area
    humanPresence: number;       // 0-100: Level of human activity
    predatorPresence: number;    // 0-100: Level of predator activity
    explorability: number;       // 0-100: How easy it is to explore
    travelCost: number;         // Base cost to travel through this area
}

/**
 * Region-specific attributes
 */
export interface RegionAttributes extends GameplayAttributes {
    regionType: string;         // The type of region
    difficultyLevel: number;    // 0-100: Overall difficulty of the region
    fertility: number;         // 0-100: How fertile the region is for plant growth
    biodiversity: number;      // 0-100: Variety of life forms in the region
}

/**
 * Attributes for the entire world
 */
export interface WorldAttributes extends BaseAttributes {
    worldType: string;         // The type of world
    magicalPotency: number;    // 0-100: Overall magical energy level
    worldAge: number;         // Age of the world in years
    stability: number;        // 0-100: How stable the world is
}

/**
 * Entity-specific attributes for living things
 */
export interface EntityAttributes {
    // Base stats
    health: number;           // Current health
    maxHealth: number;        // Maximum health
    strength: number;         // Physical strength
    defense?: number;         // Base defense value (optional)
    agility: number;          // Movement and reaction speed
    intelligence: number;     // Mental capability
    resistance: number;       // Resistance to damage and effects
    size?: number;            // Size of the entity (1 = normal)
    height?: number;          // Height of the entity (0-1)
    speed?: number;           // Movement speed
    age?: number;             // Age in years
    reproductionRate?: number;// Rate of reproduction
    adaptability?: number;    // Ability to adapt to changes
    resourceYield?: number;   // Resources provided when harvested
}

/**
 * Combined attributes for terrain (used by chunks)
 */
export type TerrainAttributes = GameplayAttributes;
