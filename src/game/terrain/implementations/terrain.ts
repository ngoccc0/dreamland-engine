import { ITerrain, TerrainDefinition, TerrainFeature, TerrainAttributes, GridTerrainAttributes } from '../api';

/**
 * Represents an instance of a terrain type in the game world
 */
import { logger } from '../../../lib/logger';

export class Terrain implements ITerrain {
    private readonly definition: TerrainDefinition;
    private currentAttributes: TerrainAttributes;

    constructor(definition: TerrainDefinition) {
        logger.debug('Creating new Terrain instance', {
            id: definition.id,
            name: definition.name,
            featureCount: definition.features.length
        });
        
        this.definition = definition;
        this.currentAttributes = { ...definition.baseAttributes };
        
        logger.debug('Initial attributes set', this.currentAttributes);

    /**
     * Get the unique ID of this terrain type
     */
    get id(): string {
        return this.definition.id;
    }

    /**
     * Get the current attributes of this terrain
     */
    get attributes(): TerrainAttributes {
        return { ...this.currentAttributes };
    }

    /**
     * Get all features applied to this terrain
     */
    get features(): TerrainFeature[] {
        return [...this.definition.features];
    }

    /**
     * Calculate final attributes including all feature modifiers
     */
    public getModifiedAttributes(): GridTerrainAttributes {
        // Start with base attributes
        const result: GridTerrainAttributes = {
            ...this.currentAttributes,
            dangerLevel: 0,
            magicAffinity: 0,
            humanPresence: 0,
            predatorPresence: 0,
            windLevel: 0,
            lightLevel: 100, // Default full light
            explorability: 100, // Default fully explorable
            soilType: 'normal',
            travelCost: 1
        };

        // Apply feature modifiers
        for (const feature of this.definition.features) {
            if (feature.attributeModifiers) {
                Object.entries(feature.attributeModifiers).forEach(([key, value]) => {
                    if (value !== undefined && key in result) {
                        // Need type assertion since we can't guarantee key exists in GridTerrainAttributes
                        (result as any)[key] += value;
                    }
                });
            }
        }

        // Clamp numeric values between 0 and 100
        Object.entries(result).forEach(([key, value]) => {
            if (typeof value === 'number' && key !== 'elevation' && key !== 'temperature') {
                (result as any)[key] = Math.max(0, Math.min(100, value));
            }
        });

        return result;
    }

    /**
     * Update current attributes
     * @param updates Partial attributes to update
     */
    public updateAttributes(updates: Partial<TerrainAttributes>): void {
        this.currentAttributes = {
            ...this.currentAttributes,
            ...updates
        };
    }
}
