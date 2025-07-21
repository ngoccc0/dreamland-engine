import { Terrain } from '../implementations/terrain';
import { TerrainDefinition, TerrainFeature, AttributeModifier } from '../../terrain-v2/types';

describe('Terrain', () => {
    const mockFeature: TerrainFeature = {
        id: 'dense_trees',
        name: 'Dense Trees',
        attributeModifiers: {
            lightLevel: { type: 'subtract', value: 20 },
            windLevel: { type: 'subtract', value: 30 },
            travelCost: { type: 'add', value: 2 }
        }
    };

    const mockDefinition: TerrainDefinition = {
        id: 'test_forest',
        name: 'Test Forest',
        type: 'forest', // Add the required type property
        baseAttributes: {
            vegetationDensity: 80,
            elevation: 100,
            temperature: 20,
            moisture: 60
        },
        features: [mockFeature],
        metadata: {
            buildable: true,
            passable: true,
            resources: ['wood']
        }
    };

    let terrain: Terrain;

    beforeEach(() => {
        terrain = new Terrain(mockDefinition);
    });

    describe('basic properties', () => {
        it('should have correct id', () => {
            expect(terrain.id).toBe('test_forest');
        });

        it('should return copy of base attributes', () => {
            const attrs = terrain.attributes;
            attrs.moisture = 999; // Modify returned object
            expect(terrain.attributes.moisture).toBe(60); // Original should be unchanged
        });

        it('should return copy of features', () => {
            const features = terrain.features;
            features.push({ 
                id: 'new',
                name: 'New',
                attributeModifiers: {}
            });
            expect(terrain.features.length).toBe(1); // Original should be unchanged
        });
    });

    describe('getModifiedAttributes', () => {
        it('should apply feature modifiers correctly', () => {
            const modified = terrain.getModifiedAttributes();
            expect(modified.lightLevel).toBe(40); // 60 (forest default) - 20
            expect(modified.windLevel).toBe(10); // 40 (forest default) - 30
            expect(modified.travelCost).toBe(3.5); // 1.5 (forest default) + 2
        });

        it('should clamp numeric values between 0 and 100', () => {
            const extremeTerrain = new Terrain({
                ...mockDefinition,
                features: [{
                    id: 'extreme',
                    name: 'Extreme',
                    attributeModifiers: {
                        lightLevel: { type: 'subtract', value: 200 },  // Should clamp to 0
                        windLevel: { type: 'add', value: 200 }     // Should clamp to 100
                    }
                }]
            });
            const modified = extremeTerrain.getModifiedAttributes();
            expect(modified.lightLevel).toBe(0);
            expect(modified.windLevel).toBe(100);
        });

        it('should not clamp elevation and temperature', () => {
            const extremeTerrain = new Terrain({
                ...mockDefinition,
                baseAttributes: {
                    ...mockDefinition.baseAttributes,
                    elevation: -100,    // Should not clamp
                    temperature: 120    // Should not clamp
                }
            });
            const modified = extremeTerrain.getModifiedAttributes();
            expect(modified.elevation).toBe(-100);
            expect(modified.temperature).toBe(120);
        });
    });

    describe('updateAttributes', () => {
        it('should update specified attributes', () => {
            terrain.updateAttributes({
                moisture: 70,
                temperature: 25
            });
            expect(terrain.attributes.moisture).toBe(70);
            expect(terrain.attributes.temperature).toBe(25);
            // Other attributes should remain unchanged
            expect(terrain.attributes.vegetationDensity).toBe(80);
        });
    });
});
