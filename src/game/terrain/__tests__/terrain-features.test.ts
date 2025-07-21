import { Terrain } from '../implementations/terrain';
import { TerrainDefinition, TerrainFeature, AttributeModifier } from '../../terrain-v2/types';
import { logger } from '../../../lib/logger';

describe('Terrain', () => {
    // Spy on logger
    beforeEach(() => {
        jest.spyOn(logger, 'debug').mockImplementation();
        jest.spyOn(logger, 'warn').mockImplementation();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const createMockFeature = (
        id: string, 
        modifiers: Record<string, AttributeModifier>,
        priority?: number
    ): TerrainFeature => ({
        id,
        name: `Test ${id}`,
        attributeModifiers: modifiers,
        priority
    });

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
        features: [
            createMockFeature('dense_trees', {
                lightLevel: { type: 'subtract', value: 20 },
                windLevel: { type: 'subtract', value: 30 },
                travelCost: { type: 'add', value: 2 }
            })
        ],
        metadata: {
            buildable: true,
            passable: true,
            resources: ['wood']
        }
    };

    describe('Feature Application Order', () => {
        it('should apply features in priority order', () => {
            const definition: TerrainDefinition = {
                ...mockDefinition,
                type: 'forest', // Add required type
                features: [
                    createMockFeature('low_priority', {
                        lightLevel: { type: 'set', value: 50 }
                    }, 1),
                    createMockFeature('high_priority', {
                        lightLevel: { type: 'subtract', value: 20 }
                    }, 2)
                ]
            };

            const terrain = new Terrain(definition);
            const result = terrain.getModifiedAttributes();

            // High priority feature should be applied last
            expect(result.lightLevel).toBe(30); // 50 - 20
            expect(logger.debug).toHaveBeenCalledWith(
                'Starting attribute modification', 
                expect.any(Object)
            );
            expect(logger.debug).toHaveBeenCalledWith(
                'Default extended attributes',
                expect.any(Object)
            );
            expect(logger.debug).toHaveBeenCalledWith(
                'Applying features in order',
                expect.any(Object)
            );
            expect(logger.debug).toHaveBeenCalledWith(
                'Final attributes',
                expect.any(Object)
            );
        });

        it('should handle different modifier types correctly', () => {
            const definition: TerrainDefinition = {
                ...mockDefinition,
                type: 'forest', // Add required type
                features: [
                    createMockFeature('test_modifiers', {
                        vegetationDensity: { type: 'multiply', value: 0.5 }, // 80 * 0.5 = 40
                        moisture: { type: 'add', value: 20 },                // 60 + 20 = 80
                        temperature: { type: 'set', value: 30 },             // Set to 30
                        windLevel: { type: 'subtract', value: 10 }           // 40 (forest default) - 10 = 30
                    })
                ]
            };

            const terrain = new Terrain(definition);
            const result = terrain.getModifiedAttributes();

            expect(result.vegetationDensity).toBe(40);
            expect(result.moisture).toBe(80);
            expect(result.temperature).toBe(30);
            expect(result.windLevel).toBe(30);
        });

        it('should clamp values correctly', () => {
            const definition: TerrainDefinition = {
                ...mockDefinition,
                type: 'forest', // Add required type
                features: [
                    createMockFeature('extreme_values', {
                        vegetationDensity: { type: 'add', value: 1000 },     // Should clamp to 100
                        moisture: { type: 'subtract', value: 1000 },         // Should clamp to 0
                        temperature: { type: 'add', value: 1000 },           // Should NOT clamp
                        elevation: { type: 'subtract', value: 1000 }         // Should NOT clamp
                    })
                ]
            };

            const terrain = new Terrain(definition);
            const result = terrain.getModifiedAttributes();

            expect(result.vegetationDensity).toBe(100);
            expect(result.moisture).toBe(0);
            expect(result.temperature).toBe(1020);  // 20 + 1000
            expect(result.elevation).toBe(-900);    // 100 - 1000
        });
    });

    describe('Logging', () => {
        it('should log attribute modifications', () => {
            const terrain = new Terrain(mockDefinition);
            terrain.getModifiedAttributes();

            expect(logger.debug).toHaveBeenCalledWith(
                'Starting attribute modification',
                expect.any(Object)
            );
            expect(logger.debug).toHaveBeenCalledWith(
                'Final attributes',
                expect.any(Object)
            );
            expect(logger.debug).toHaveBeenCalledWith(
                'Final attributes',
                expect.any(Object)
            );
        });
    });
});
