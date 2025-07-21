import { ITerrainManager, TerrainDefinition } from '../api';

/**
 * Manages terrain definitions and their lifecycle
 */
export class TerrainManager implements ITerrainManager {
    private static instance: TerrainManager;
    private definitions: Map<string, TerrainDefinition> = new Map();

    private constructor() {}

    /**
     * Get the singleton instance
     */
    public static getInstance(): TerrainManager {
        if (!TerrainManager.instance) {
            TerrainManager.instance = new TerrainManager();
        }
        return TerrainManager.instance;
    }

    /**
     * Get a terrain definition by ID
     */
    public getTerrainDefinition(id: string): TerrainDefinition | undefined {
        return this.definitions.get(id);
    }

    /**
     * Register a new terrain type
     * @throws Error if terrain with same ID already exists
     */
    public registerTerrain(definition: TerrainDefinition): void {
        if (this.definitions.has(definition.id)) {
            throw new Error(`Terrain with id "${definition.id}" already exists`);
        }
        this.validateDefinition(definition);
        this.definitions.set(definition.id, definition);
    }

    /**
     * Get all registered terrain type IDs
     */
    public getAllTerrainTypes(): string[] {
        return Array.from(this.definitions.keys());
    }

    /**
     * Check if a terrain type exists
     */
    public hasTerrainType(id: string): boolean {
        return this.definitions.has(id);
    }

    /**
     * Validate a terrain definition
     * @throws Error if definition is invalid
     */
    private validateDefinition(definition: TerrainDefinition): void {
        if (!definition.id) {
            throw new Error('Terrain definition must have an id');
        }
        if (!definition.name) {
            throw new Error('Terrain definition must have a name');
        }
        if (!definition.baseAttributes) {
            throw new Error('Terrain definition must have base attributes');
        }
        
        // Validate base attributes
        const required = ['vegetationDensity', 'elevation', 'temperature', 'moisture'];
        for (const attr of required) {
            if (!(attr in definition.baseAttributes)) {
                throw new Error(`Missing required attribute: ${attr}`);
            }
        }

        // Validate features
        if (definition.features) {
            for (const feature of definition.features) {
                if (!feature.id || !feature.name) {
                    throw new Error('Each feature must have id and name');
                }
            }
        }
    }
}
