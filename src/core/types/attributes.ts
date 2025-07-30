
// SoilType is a type, not a value. Use string literals like "loamy", "rocky", etc.

/**
 * Base attributes for all environment-related entities
 */
export interface EnvironmentAttributes {
    vegetationDensity: number;
    moisture: number;
    elevation: number;
    temperature: number;
    windLevel: number;
    lightLevel: number;
    soilType: string; // e.g. "loamy", "rocky", etc.
}

/**
 * Gameplay-related attributes that affect game mechanics
 */
export interface GameplayAttributes {
    dangerLevel: number;
    magicAffinity: number;
    humanPresence: number;
    predatorPresence: number;
    explorability: number;
    travelCost: number;
}

/**
 * Character-specific attributes for NPCs and players
 */
export interface CharacterAttributes {
    strength: number;
    dexterity: number;
    intelligence: number;
    constitution: number;
}

/**
 * Combined attributes for world chunks and cells
 */
export interface TerrainAttributes extends EnvironmentAttributes, GameplayAttributes {
    preferredSoilTypes?: string[]; // e.g. ["loamy", "rocky"]
}

/**
 * Entity-specific attributes
 */
export interface EntityAttributes {
    health: number;
    strength: number;
    defense: number;
    speed: number;
    intelligence: number;
    size: number;
    age: number;
    reproductionRate: number;
    adaptability: number;
    resourceYield: number;
    harvestable?: boolean;
    mineral?: string;
    friendly?: boolean;
}

/**
 * Combined attributes for regions
 */
export interface RegionAttributes extends EnvironmentAttributes, GameplayAttributes {
    regionType: string; // e.g. "forest", "desert", etc.
    fertility: number;
    biodiversity: number;
}

/**
 * Combined attributes for the world
 */
export interface WorldAttributes extends EnvironmentAttributes {
    worldType: string; // e.g. "overworld", "underwater", etc.
    magicalPotency: number;
}
