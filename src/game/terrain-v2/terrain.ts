import { 
    TerrainDefinition, 
    TerrainFeature, 
    TerrainAttributes, 
    GridTerrainAttributes,
    AttributeModifier
} from './types';
import { terrainDefaults } from './defaults';
import { logger } from '../../lib/logger';

export class TerrainV2 {
    private readonly definition: TerrainDefinition;
    private currentAttributes: TerrainAttributes;

    constructor(definition: TerrainDefinition) {
        this.definition = definition;
        this.currentAttributes = { ...definition.baseAttributes };
        
        logger.debug('Created terrain instance', {
            id: definition.id,
            type: definition.type,
            featureCount: definition.features.length
        });
    }

    get id(): string {
        return this.definition.id;
    }

    get type(): string {
        return this.definition.type;
    }

    get attributes(): TerrainAttributes {
        return { ...this.currentAttributes };
    }

    get features(): TerrainFeature[] {
        return [...this.definition.features];
    }

    private getDefaultExtendedAttributes(): Partial<GridTerrainAttributes> {
        const defaults = terrainDefaults[this.definition.type];
        if (!defaults) {
            logger.warn(`No defaults found for terrain type: ${this.definition.type}`);
            return {};
        }
        return { 
            // This ensures defaults are returned cleanly without feature modifications
            ...defaults.extendedAttributes,
            // Only include attributes not already in base attributes
            ...(this.currentAttributes && Object.fromEntries(
                Object.entries(defaults.extendedAttributes)
                    .filter(([key]) => !(key in this.currentAttributes))
            ))
        };
    }

    private applyModifier(currentValue: number, modifier: AttributeModifier): number {
        logger.debug('Applying modifier', {
            currentValue,
            modifier,
            type: modifier.type
        });

        if (typeof modifier.value !== 'number' || isNaN(modifier.value)) {
            throw new Error(`Invalid modifier value: ${modifier.value}`);
        }

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
                throw new Error(`Unknown modifier type: ${modifier.type}`);
        }
    }

    public getModifiedAttributes(): GridTerrainAttributes {
        logger.debug('Starting attribute modification', {
            baseAttributes: this.currentAttributes,
            terrainType: this.definition.type
        });

        // Get default extended attributes for this terrain type
        const defaultExtended = this.getDefaultExtendedAttributes();
        
        logger.debug('Default extended attributes', defaultExtended);

        // Combine base and extended attributes (giving precedence to base attributes)
        const result: GridTerrainAttributes = {
            ...defaultExtended,
            ...this.currentAttributes
        } as GridTerrainAttributes;

        // Return only default values if there are no features
        if (this.features.length === 0) {
            logger.debug('No features to apply, returning defaults');
            return result;
        }
        
        // Sort features by priority
        const sortedFeatures = [...this.features].sort((a, b) => 
            (a.priority || 0) - (b.priority || 0)
        );

        logger.debug('Applying features in order', { 
            featureOrder: sortedFeatures.map(f => ({
                id: f.id,
                priority: f.priority
            }))
        });

        // Apply each feature's modifiers
        for (const feature of sortedFeatures) {
            logger.debug('Processing feature', { 
                featureId: feature.id,
                modifiers: feature.attributeModifiers 
            });

            Object.entries(feature.attributeModifiers).forEach(([key, modifier]) => {
                const attributeKey = key as keyof GridTerrainAttributes;
                if (attributeKey in result) {
                    const oldValue = result[attributeKey];
                    if (typeof oldValue === 'number') {
                        const newValue = this.applyModifier(oldValue, modifier);
                        logger.debug('Modified attribute', {
                            attribute: key,
                            oldValue,
                            newValue,
                            modifier
                        });
                        (result[attributeKey] as number) = newValue;
                    }
                }
            });
        }

        // Clamp numeric values between 0 and 100 (except elevation and temperature)
        Object.entries(result).forEach(([key, value]) => {
            if (typeof value === 'number' && key !== 'elevation' && key !== 'temperature') {
                const attributeKey = key as keyof GridTerrainAttributes;
                const oldValue = value;
                const newValue = Math.max(0, Math.min(100, value));
                if (oldValue !== newValue) {
                    logger.warn(`attribute value clamped: ${key} from ${oldValue} to ${newValue}`, { 
                        attribute: key, 
                        oldValue, 
                        newValue 
                    });
                }
                (result[attributeKey] as number) = newValue;
            }
        });

        logger.debug('Final attributes', result);
        return result;
    }

    public updateAttributes(updates: Partial<TerrainAttributes>): void {
        logger.debug('Updating attributes', {
            current: this.currentAttributes,
            updates
        });

        this.currentAttributes = {
            ...this.currentAttributes,
            ...updates
        };

        logger.debug('Updated attributes', this.currentAttributes);
    }
}
