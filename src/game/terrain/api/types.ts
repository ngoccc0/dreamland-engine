/**
 * Public type definitions for the Terrain system
 */

/**
 * Base interface for terrain attributes
 */
export interface TerrainAttributes {
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
 * Extended attributes for grid-based terrain
 */
export interface GridTerrainAttributes extends TerrainAttributes {
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
    soilType: string;
    /** Cost of traveling through this cell */
    travelCost: number;
}

/**
 * Feature that can be attached to a terrain
 */
/**
 * Type of modification a feature can apply to attributes
 */
export type ModifierType = 'add' | 'subtract' | 'multiply' | 'set';

/**
 * Structure of a single attribute modification
 */
export interface AttributeModifier {
    /** The type of modification to apply */
    type: ModifierType;
    /** The value to use in the modification */
    value: number;
    /** Optional priority (higher numbers apply later) */
    priority?: number;
}

/**
 * Represents a single terrain feature
 */
export interface TerrainFeature {
    /** Unique identifier for this feature */
    id: string;
    /** Display name of the feature */
    name: string;
    /** Optional description */
    description?: string;
    /** Attribute modifiers with their types */
    attributeModifiers: {
        [K in keyof Partial<GridTerrainAttributes>]: AttributeModifier;
    };
    /** Order in which this feature should be applied (higher numbers apply later) */
    priority?: number;
}

/**
 * Complete definition of a terrain type
 */
export interface TerrainDefinition {
    /** Unique identifier for this terrain type */
    id: string;
    /** Display name of the terrain */
    name: string;
    /** Base attributes */
    baseAttributes: TerrainAttributes;
    /** Available features */
    features: TerrainFeature[];
    /** Metadata for game mechanics */
    metadata: {
        /** Can players build here? */
        buildable: boolean;
        /** Can players move through this terrain? */
        passable: boolean;
        /** Resource types that can be found here */
        resources: string[];
    };
}
