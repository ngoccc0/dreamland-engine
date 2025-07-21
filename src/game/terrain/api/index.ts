import { TerrainDefinition, TerrainFeature, TerrainAttributes, GridTerrainAttributes, ModifierType, AttributeModifier } from './types';

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
    /** Get the unique identifier of this terrain */
    readonly id: string;
    /** Get the current attributes */
    readonly attributes: TerrainAttributes;
    /** Get the list of features */
    readonly features: TerrainFeature[];
    /** Calculate modified attributes including all features */
    getModifiedAttributes(): GridTerrainAttributes;
    /** Update the current attributes */
    updateAttributes(updates: Partial<TerrainAttributes>): void;
}

export type {
    TerrainDefinition,
    TerrainFeature,
    TerrainAttributes,
    GridTerrainAttributes,
    ModifierType,
    AttributeModifier
};
