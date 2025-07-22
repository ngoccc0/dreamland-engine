/**
 * Core definitions for the terrain system using Composition pattern
 * This file serves as the single source of truth for all terrain-related type definitions
 */

/**
 * Registry to store and manage terrain types dynamically
 */
export class TerrainRegistry {
    private static _instance: TerrainRegistry;
    private _terrainTypes: Set<string> = new Set([
        "forest", "grassland", "desert", "swamp", "mountain",
        "cave", "jungle", "volcanic", "wall", "floptropica",
        "tundra", "beach", "mesa", "mushroom_forest", "ocean",
        "city", "space_station", "underwater"
    ]);

    private constructor() {}

    static getInstance(): TerrainRegistry {
        if (!TerrainRegistry._instance) {
            TerrainRegistry._instance = new TerrainRegistry();
        }
        return TerrainRegistry._instance;
    }

    /**
     * Register a new terrain type
     * @param terrainType The new terrain type to add
     * @throws Error if terrain type already exists
     */
    registerTerrainType(terrainType: string): void {
        if (this._terrainTypes.has(terrainType)) {
            throw new Error(`Terrain type "${terrainType}" already registered`);
        }
        this._terrainTypes.add(terrainType);
    }

    /**
     * Check if a terrain type exists
     */
    hasTerrainType(terrainType: string): boolean {
        return this._terrainTypes.has(terrainType);
    }

    /**
     * Get all registered terrain types
     */
    getAllTerrainTypes(): string[] {
        return Array.from(this._terrainTypes);
    }
}

/**
 * Type representing all possible terrain types
 * Uses typeof to ensure type safety with the registry
 */
export type TerrainType = string;

/**
 * Represents different types of soil that can exist in the game world
 */
export type SoilType = 
    | 'rocky' 
    | 'sandy' 
    | 'fertile' 
    | 'clay' 
    | 'loamy' 
    | 'volcanic' 
    | 'peaty' 
    | 'silty' 
    | 'chalky';

/**
 * Comprehensive list of all available terrain types
 */
export const allTerrains = TerrainRegistry.getInstance().getAllTerrainTypes();

/**
 * Base attributes that all terrain types possess
 */
export interface IBaseTerrainAttributes {
    /** Density of vegetation in the area (0-100) */
    vegetationDensity: number;
    /** Elevation level in meters */
    elevation: number;
    /** Temperature in celsius */
    temperature: number;
    /** Moisture level (0-100) */
    moisture: number;
}

/**
 * Extended attributes for detailed grid-based terrain information
 */
export interface IGridTerrainAttributes extends IBaseTerrainAttributes {
    /** Level of danger in the area (0-100) */
    dangerLevel: number;
    /** Magical energy concentration (0-100) */
    magicAffinity: number;
    /** Human activity level (0-100) */
    humanPresence: number;
    /** Predator activity level (0-100) */
    predatorPresence: number;
    /** Wind intensity (0-100) */
    windLevel: number;
    /** Ambient light level (0-100) */
    lightLevel: number;
    /** How easy it is to explore this area (0-100) */
    explorability: number;
    /** Type of soil in the area */
    soilType: SoilType;
    /** Cost of traveling through this cell */
    travelCost: number;
}

/**
 * Core properties that every terrain must have
 */
export interface ITerrainCore {
    /** The type of terrain */
    type: TerrainType;
    /** Base attributes that all terrain types share */
    baseAttributes: IBaseTerrainAttributes;
}

/**
 * Represents a specific feature or aspect of a terrain
 * Features can be combined to create complex terrain behaviors
 */
export interface ITerrainFeature {
    /** Unique identifier for the feature type */
    type: string;
    /** Name of the feature */
    name: string;
    /** Optional description of what this feature does */
    description?: string;
    /** Additional attributes specific to this feature */
    attributes: Partial<IGridTerrainAttributes>;
}

/**
 * Complete definition of a terrain, combining core properties and features
 */
export interface ITerrainDefinition {
    /** Core terrain properties */
    core: ITerrainCore;
    /** Array of features that modify or enhance the terrain */
    features: ITerrainFeature[];
}
