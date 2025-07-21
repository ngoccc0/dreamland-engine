/**
 * Base interface for terrain attributes shared across the system
 */
export interface BaseTerrainAttributes {
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
 * Extended attributes for detailed grid cell terrain information
 */
export interface GridTerrainAttributes extends BaseTerrainAttributes {
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
