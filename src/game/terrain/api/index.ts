import { TerrainDefinition, TerrainFeature, TerrainAttributes, GridTerrainAttributes } from './types';

/**
 * Public interface for terrain management
 */
export interface ITerrainManager {
    /**
     * Get a terrain definition by ID
     */
    getTerrainDefinition(id: string): TerrainDefinition | undefined;

    /**
     * Register a new terrain type
     */
    registerTerrain(definition: TerrainDefinition): void;

    /**
     * Get all registered terrain types
     */
    getAllTerrainTypes(): string[];

    /**
     * Check if a terrain type exists
     */
    hasTerrainType(id: string): boolean;
}

/**
 * Public interface for terrain instances
 */
export interface ITerrain {
    /** Unique ID of this terrain type */
    readonly id: string;
    /** Current attributes of this terrain */
    readonly attributes: TerrainAttributes;
    /** All features applied to this terrain */
    readonly features: TerrainFeature[];
    /** Calculate final attributes including feature modifiers */
    getModifiedAttributes(): GridTerrainAttributes;
}

export type { 
    TerrainDefinition, 
    TerrainFeature, 
    TerrainAttributes, 
    GridTerrainAttributes,
    ModifierType,
    AttributeModifier
};
