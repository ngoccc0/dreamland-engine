import {
    TerrainDefinition,
    TerrainFeature,
    TerrainAttributes,
    GridTerrainAttributes,
    AttributeModifier
} from '../api/types';
import { terrainDefaults } from '../api/defaults';
import { logger } from '../../../../../lib/logger';

/** Interface defining core terrain functionality */
export interface ITerrain {
    /** Get the unique ID of this terrain type */
    readonly id: string;
    /** Get the current attributes of this terrain */
    readonly attributes: TerrainAttributes;
    /** Get all features applied to this terrain */
    readonly features: TerrainFeature[];
    /** Calculate final attributes including all feature modifiers */
    getModifiedAttributes(): GridTerrainAttributes;
}

export class Terrain implements ITerrain {
    private readonly definition: TerrainDefinition;
    private currentAttributes: TerrainAttributes;

    constructor(definition: TerrainDefinition) {
        this.definition = definition;
        this.currentAttributes = { ...definition.baseAttributes };
        logger.debug('Created terrain instance', { id: definition.id });
    }

    public get id(): string {
        return this.definition.id;
    }

    public get attributes(): TerrainAttributes {
        return { ...this.currentAttributes };
    }

    public get features(): TerrainFeature[] {
        return [...this.definition.features];
    }

    private applyModifier(currentValue: number, modifier: AttributeModifier): number {
        switch (modifier.type) {
            case 'add':
                return currentValue + modifier.value;
            case 'subtract':
                return currentValue - modifier.value;
            case 'multiply':
                return currentValue * modifier.value;
            case 'set':
                return modifier.value;
            default:
                logger.warn('Unknown modifier type', modifier);
                return currentValue;
        }
    }

    public getModifiedAttributes(): GridTerrainAttributes {
        logger.debug('Starting attribute modification', { terrainId: this.id });

        const typeDefaults = terrainDefaults[this.definition.type]?.extendedAttributes || {};

        const result: GridTerrainAttributes = {
            dangerLevel: 0,
            magicAffinity: 0,
            humanPresence: 0,
            predatorPresence: 0,
            windLevel: 50,
            lightLevel: 100,
            explorability: 100,
            soilType: 'normal',
            travelCost: 1,
            ...typeDefaults,
            ...this.currentAttributes
        } as GridTerrainAttributes;

        logger.debug('Default extended attributes', { terrainId: this.id, attributes: result });

        const sortedFeatures = [...this.features].sort((a, b) => 
            (a.priority || 0) - (b.priority || 0)
        );

        logger.debug('Applying features in order', { 
            terrainId: this.id, 
            features: sortedFeatures.map(f => ({ id: f.id, priority: f.priority }))
        });

        for (const feature of sortedFeatures) {
            Object.entries(feature.attributeModifiers).forEach(([key, modifier]) => {
                const attributeKey = key as keyof GridTerrainAttributes;
                if (attributeKey in result) {
                    const oldValue = result[attributeKey];
                    if (typeof oldValue === 'number') {
                        const mod = modifier as AttributeModifier;

                        if (typeof mod.value !== 'number' || isNaN(mod.value)) {
                            throw new Error(`Invalid modifier value for ${String(attributeKey)}: ${mod.value}`);
                        }

                        let newValue: number;
                        switch (mod.type) {
                            case 'add':
                                newValue = oldValue + mod.value;
                                break;
                            case 'subtract':
                                newValue = oldValue - mod.value;
                                break;
                            case 'multiply':
                                newValue = oldValue * mod.value;
                                break;
                            case 'set':
                                newValue = mod.value;
                                break;
                            default:
                                throw new Error(`Invalid modifier type: ${mod.type}`);
                        }

                        if (attributeKey !== 'elevation' && attributeKey !== 'temperature') {
                            if (newValue > 100) {
                                logger.warn(`Attribute value clamped: ${String(attributeKey)} from ${newValue} to 100`, {
                                    attribute: String(attributeKey),
                                    oldValue: newValue,
                                    newValue: 100
                                });
                                newValue = 100;
                            } else if (newValue < 0) {
                                logger.warn(`Attribute value clamped: ${String(attributeKey)} from ${newValue} to 0`, {
                                    attribute: String(attributeKey),
                                    oldValue: newValue,
                                    newValue: 0
                                });
                                newValue = 0;
                            }
                        }

                        (result[attributeKey] as number) = newValue;
                    }
                }
            });
        }

        logger.debug('Final attributes', { terrainId: this.id, attributes: result });

        Object.entries(result).forEach(([key, value]) => {
            const attributeKey = key as keyof GridTerrainAttributes;
            if (typeof value === 'number' && key !== 'elevation' && key !== 'temperature') {
                (result[attributeKey] as number) = Math.max(0, Math.min(100, value));
            }
        });

        return result;
    }

    public updateAttributes(updates: Partial<TerrainAttributes>): void {
        this.currentAttributes = {
            ...this.currentAttributes,
            ...updates
        };
    }
}
