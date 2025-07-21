import { TerrainDefinition } from '../api';
import { TerrainManager } from '../implementations/terrain-manager';

/**
 * Service responsible for loading terrain definitions from data files
 */
export class TerrainLoader {
    private constructor() {}

    /**
     * Load terrain definitions from a JSON string
     * @throws Error if JSON is invalid or definitions are invalid
     */
    public static loadFromJson(jsonData: string): void {
        try {
            const data = JSON.parse(jsonData);
            if (!data.terrains || !Array.isArray(data.terrains)) {
                throw new Error('Invalid terrain data format: expected array of terrains');
            }

            const manager = TerrainManager.getInstance();
            
            // Load each terrain definition
            for (const terrainData of data.terrains) {
                const definition = this.validateAndNormalize(terrainData);
                manager.registerTerrain(definition);
            }
        } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to load terrain definitions: ${message}`);
        }
    }

    /**
     * Load terrain definitions from multiple JSON strings
     * Useful for loading base game + mod data
     */
    public static loadMultiple(jsonDataArray: string[]): void {
        for (const jsonData of jsonDataArray) {
            this.loadFromJson(jsonData);
        }
    }

    /**
     * Validate and normalize a terrain definition from raw data
     */
    private static validateAndNormalize(data: any): TerrainDefinition {
        // Required fields
        if (!data.id || !data.name || !data.baseAttributes) {
            throw new Error(`Invalid terrain definition: missing required fields`);
        }

        // Normalize features array
        const features = data.features || [];
        for (const feature of features) {
            if (!feature.id || !feature.name) {
                throw new Error(`Invalid feature in terrain ${data.id}: missing id or name`);
            }
            // Ensure attributeModifiers exists
            feature.attributeModifiers = feature.attributeModifiers || {};
        }

        // Normalize metadata
        const metadata = data.metadata || {};
        metadata.buildable = metadata.buildable ?? false;
        metadata.passable = metadata.passable ?? true;
        metadata.resources = metadata.resources || [];

        return {
            id: data.id,
            name: data.name,
            baseAttributes: {
                vegetationDensity: data.baseAttributes.vegetationDensity ?? 0,
                elevation: data.baseAttributes.elevation ?? 0,
                temperature: data.baseAttributes.temperature ?? 20,
                moisture: data.baseAttributes.moisture ?? 50
            },
            features,
            metadata
        };
    }
}
