/**
 * Core definitions for terrain system (merged from terrain-v2)
 */

/** Base terrain types available in the game */
export type TerrainType = 
    | 'forest' 
    | 'grassland' 
    | 'desert' 
    | 'swamp' 
    | 'mountain' 
    | 'cave' 
    | 'jungle' 
    | 'volcanic';

/** Type of modification a feature can apply */
export type ModifierType = 'add' | 'subtract' | 'multiply' | 'set';

/** Structure for attribute modification */
export interface AttributeModifier {
    type: ModifierType;
    value: number;
    priority?: number;
}

/** Base attributes all terrains must have */
export interface TerrainAttributes {
    /** Density of vegetation (0-100) */
    vegetationDensity: number;
    /** Elevation in meters */
    elevation: number;
    /** Temperature in celsius */
    temperature: number;
    /** Moisture level (0-100) */
    moisture: number;
}

/** Extended attributes for detailed terrain information */
export interface GridTerrainAttributes extends TerrainAttributes {
    /** Level of danger (0-100) */
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
    /** Ease of exploration (0-100) */
    explorability: number;
    /** Type of soil */
    soilType: string;
    /** Cost of traveling */
    travelCost: number;
}

/** Default extended attributes by terrain type */
export interface TerrainTypeDefaults {
    /** The terrain type these defaults apply to */
    type: TerrainType;
    /** Default values for extended attributes */
    extendedAttributes: Partial<GridTerrainAttributes>;
}

/** Feature that can modify terrain attributes */
export interface TerrainFeature {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Optional description */
    description?: string;
    /** Modifiers to apply */
    attributeModifiers: {
        [K in keyof Partial<GridTerrainAttributes>]: AttributeModifier;
    };
    /** Priority in application order */
    priority?: number;
}

/** Complete definition of a terrain */
export interface TerrainDefinition {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** The type of terrain */
    type: TerrainType;
    /** Base attributes */
    baseAttributes: TerrainAttributes;
    /** Features that modify this terrain */
    features: TerrainFeature[];
    /** Additional metadata */
    metadata: {
        buildable: boolean;
        passable: boolean;
        resources: string[];
    };
}

