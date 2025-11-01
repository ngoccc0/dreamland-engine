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
 * Type representing all possible terrain types.
 * This uses a string literal type to ensure type safety with the {@link TerrainRegistry}.
 */
export type TerrainType = string;

/**
 * Represents different types of soil that can exist in the game world.
 * Each soil type can have unique properties affecting plant growth, resource generation, etc.
 */
export type SoilType = 
    | 'rocky'     // Characterized by a high proportion of stones and gravel.
    | 'sandy'     // Loose, granular soil with good drainage but poor water retention.
    | 'fertile'   // Rich in organic matter, ideal for plant growth.
    | 'clay'      // Fine-grained soil that retains water well but can become waterlogged.
    | 'loamy'     // A balanced mix of sand, silt, and clay, often considered ideal for agriculture.
    | 'volcanic'  // Soil derived from volcanic ash, often very fertile.
    | 'peaty'     // High in organic matter, acidic, and water-retentive.
    | 'silty'     // Fine-grained soil with good water retention and fertility.
    | 'chalky';   // Alkaline soil with good drainage, often found over limestone.

/**
 * Comprehensive list of all available terrain types, dynamically retrieved from the {@link TerrainRegistry}.
 * This ensures that all registered terrain types are available for type checking and game logic.
 */
export const allTerrains = TerrainRegistry.getInstance().getAllTerrainTypes();

/**
 * Base attributes that all terrain types possess.
 * These provide fundamental environmental characteristics for any given terrain.
 */
export interface IBaseTerrainAttributes {
    /**
     * Density of vegetation in the area (0-100).
     * Higher values indicate lush environments, affecting resource spawns and visibility.
     */
    vegetationDensity: number;
    /**
     * Elevation level in meters.
     * Influences climate, accessibility, and visual representation.
     */
    elevation: number;
    /**
     * Temperature in Celsius.
     * Affects player status, creature behavior, and environmental effects.
     */
    temperature: number;
    /**
     * Moisture level (0-100).
     * Higher values indicate wetter environments, affecting plant life and water sources.
     */
    moisture: number;
}

/**
 * Extended attributes for detailed grid-based terrain information.
 * These attributes provide granular control over gameplay mechanics within a specific chunk or cell.
 */
export interface IGridTerrainAttributes extends IBaseTerrainAttributes {
    /**
     * Level of danger in the area (0-100).
     * Higher values indicate more hostile environments with dangerous creatures or hazards.
     */
    dangerLevel: number;
    /**
     * Magical energy concentration (0-100).
     * Influences magic-related events, creature spawns, and resource availability.
     */
    magicAffinity: number;
    /**
     * Human activity level (0-100).
     * Higher values indicate more civilization or human presence, affecting resource types and NPC interactions.
     */
    humanPresence: number;
    /**
     * Predator activity level (0-100).
     * Higher values indicate a greater presence of predatory creatures, increasing combat encounters.
     */
    predatorPresence: number;
    /**
     * Wind intensity (0-100).
     * Affects weather patterns, player movement, and certain environmental puzzles.
     */
    windLevel: number;
    /**
     * Ambient light level (0-100).
     * Influences visibility, creature behavior (e.g., nocturnal spawns), and plant growth.
     */
    lightLevel: number;
    /**
     * How easy it is to explore this area (0-100).
     * Higher values mean easier navigation and less chance of getting lost or encountering obstacles.
     */
    explorability: number;
    /**
     * Type of soil in the area.
     * Influences plant growth, resource harvesting, and building possibilities.
     */
    soilType: SoilType;
    /**
     * Cost of traveling through this cell.
     * Affects player stamina consumption or movement speed when traversing this terrain.
     */
    travelCost: number;
}

/**
 * Core properties that every terrain must have.
 * This interface defines the fundamental identity and base characteristics of a terrain.
 */
export interface ITerrainCore {
    /** The unique type of terrain (e.g., 'forest', 'desert'). */
    type: TerrainType;
    /** Base attributes that all terrain types share, providing fundamental environmental characteristics. */
    baseAttributes: IBaseTerrainAttributes;
}

/**
 * Represents a specific feature or aspect of a terrain.
 * Features can be combined to create complex and unique terrain behaviors and appearances.
 */
export interface ITerrainFeature {
    /** Unique identifier for the feature type (e.g., 'denseForest', 'rockyOutcrop'). */
    type: string;
    /** Display name of the feature. */
    name: string;
    /** Optional description of what this feature does or represents. */
    description?: string;
    /**
     * Additional attributes specific to this feature.
     * These attributes modify or override the base terrain attributes for this specific feature.
     */
    attributes: Partial<IGridTerrainAttributes>;
}

/**
 * Complete definition of a terrain, combining its core properties and a list of features.
 * This allows for a modular and extensible way to define diverse terrain types.
 */
export interface ITerrainDefinition {
    /** Core terrain properties, defining its fundamental type and base environmental attributes. */
    core: ITerrainCore;
    /** An array of features that modify or enhance the terrain's base properties and introduce unique characteristics. */
    features: ITerrainFeature[];
}
