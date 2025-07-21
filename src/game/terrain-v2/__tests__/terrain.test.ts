import { TerrainV2 } from '../terrain';
import { TerrainDefinition, TerrainFeature, AttributeModifier } from '../types';
import { logger } from '../../../lib/logger';

describe('TerrainV2', () => {
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

    const mockForestDefinition: TerrainDefinition = {
        id: 'test_forest',
        name: 'Test Forest',
        type: 'forest',
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

    describe('Default Attributes', () => {
        it('should initialize with correct default attributes', () => {
            const basicForest: TerrainDefinition = {
                ...mockForestDefinition,
                features: [] // No features for testing default values
            };
            const terrain = new TerrainV2(basicForest);
            const attrs = terrain.getModifiedAttributes();
            
            // Check default forest attributes
            expect(attrs.windLevel).toBe(40); // Default forest wind level
            expect(attrs.lightLevel).toBe(60); // Default forest light level
            expect(attrs.explorability).toBe(70); // Default forest explorability
        });
    });

    describe('Feature Application', () => {
        it('should apply features on top of default attributes', () => {
            const terrain = new TerrainV2(mockForestDefinition);
            const attrs = terrain.getModifiedAttributes();
            
            // Default forest windLevel (40) - feature subtract (30) = 10
            expect(attrs.windLevel).toBe(10);
            // Default forest lightLevel (60) - feature subtract (20) = 40
            expect(attrs.lightLevel).toBe(40);
        });

        it('should apply features in priority order', () => {
            const definition: TerrainDefinition = {
                ...mockForestDefinition,
                features: [
                    createMockFeature('low_priority', {
                        lightLevel: { type: 'set', value: 50 }
                    }, 1),
                    createMockFeature('high_priority', {
                        lightLevel: { type: 'subtract', value: 20 }
                    }, 2)
                ]
            };

            const terrain = new TerrainV2(definition);
            const attrs = terrain.getModifiedAttributes();

            // Default (60) -> set to 50 -> subtract 20 = 30
            expect(attrs.lightLevel).toBe(30);
        });
    });

    describe('Value Clamping', () => {
        it('should clamp values between 0 and 100 except elevation and temperature', () => {
            const definition: TerrainDefinition = {
                ...mockForestDefinition,
                features: [
                    createMockFeature('extreme', {
                        lightLevel: { type: 'add', value: 1000 },
                        windLevel: { type: 'subtract', value: 1000 },
                        elevation: { type: 'add', value: 1000 },
                        temperature: { type: 'add', value: 1000 }
                    })
                ]
            };

            const terrain = new TerrainV2(definition);
            const attrs = terrain.getModifiedAttributes();

            expect(attrs.lightLevel).toBe(100); // Clamped
            expect(attrs.windLevel).toBe(0); // Clamped
            expect(attrs.elevation).toBe(1100); // Not clamped
            expect(attrs.temperature).toBe(1020); // Not clamped
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty feature list', () => {
            const emptyFeaturesDef: TerrainDefinition = {
                ...mockForestDefinition,
                features: []
            };
            const terrain = new TerrainV2(emptyFeaturesDef);
            const attrs = terrain.getModifiedAttributes();

            expect(attrs.windLevel).toBe(40); // Default forest wind level
        });

        it('should handle missing optional attributes', () => {
            const partialAttrsDef: TerrainDefinition = {
                ...mockForestDefinition,
                features: [], // Remove features to test just defaults
                baseAttributes: {
                    vegetationDensity: 80,
                    elevation: 100,
                    temperature: 20,
                    moisture: 60
                }
            };
            const terrain = new TerrainV2(partialAttrsDef);
            const attrs = terrain.getModifiedAttributes();

            // Should use type defaults for missing attributes
            expect(attrs.windLevel).toBe(40);
            expect(attrs.lightLevel).toBe(60);
        });

        it('should handle invalid modifier types', () => {
            const invalidModifierDef: TerrainDefinition = {
                ...mockForestDefinition,
                features: [
                    createMockFeature('invalid', {
                        lightLevel: { type: 'invalid' as any, value: 20 }
                    })
                ]
            };

            expect(() => new TerrainV2(invalidModifierDef).getModifiedAttributes())
                .toThrow();
        });

        it('should handle extreme priority values', () => {
            const extremePriorityDef: TerrainDefinition = {
                ...mockForestDefinition,
                features: [
                    createMockFeature('lowest', {
                        lightLevel: { type: 'set', value: 50 }
                    }, Number.MIN_SAFE_INTEGER),
                    createMockFeature('highest', {
                        lightLevel: { type: 'set', value: 30 }
                    }, Number.MAX_SAFE_INTEGER)
                ]
            };

            const terrain = new TerrainV2(extremePriorityDef);
            const attrs = terrain.getModifiedAttributes();

            expect(attrs.lightLevel).toBe(30); // Highest priority should win
        });

        it('should handle NaN and undefined values gracefully', () => {
            const terrain = new TerrainV2({
                ...mockForestDefinition,
                features: [
                    createMockFeature('invalid_values', {
                        lightLevel: { type: 'add', value: NaN },
                        windLevel: { type: 'set', value: undefined as any }
                    })
                ]
            });

            expect(() => terrain.getModifiedAttributes()).toThrow();
        });
    });

    describe('Feature Priority and Ordering', () => {
        it('should apply features in strict priority order', () => {
            const orderedFeaturesDef: TerrainDefinition = {
                ...mockForestDefinition,
                features: [
                    createMockFeature('first', {
                        lightLevel: { type: 'set', value: 50 }
                    }, 1),
                    createMockFeature('second', {
                        lightLevel: { type: 'subtract', value: 20 }
                    }, 2),
                    createMockFeature('third', {
                        lightLevel: { type: 'add', value: 10 }
                    }, 3)
                ]
            };

            const terrain = new TerrainV2(orderedFeaturesDef);
            const attrs = terrain.getModifiedAttributes();

            expect(attrs.lightLevel).toBe(40); // 50 - 20 + 10
        });

        it('should handle features with same priority', () => {
            const samePriorityDef: TerrainDefinition = {
                ...mockForestDefinition,
                features: [
                    createMockFeature('first', {
                        lightLevel: { type: 'set', value: 50 }
                    }, 1),
                    createMockFeature('also_first', {
                        lightLevel: { type: 'set', value: 30 }
                    }, 1)
                ]
            };

            const terrain = new TerrainV2(samePriorityDef);
            const attrs = terrain.getModifiedAttributes();

            // Later feature with same priority should win
            expect(attrs.lightLevel).toBe(30);
        });
    });

    describe('Performance', () => {
        it('should handle large number of features efficiently', () => {
            const manyFeaturesDef: TerrainDefinition = {
                ...mockForestDefinition,
                features: Array.from({ length: 1000 }, (_, i) => 
                    createMockFeature(`feature_${i}`, {
                        lightLevel: { type: 'subtract', value: 1 }
                    }, i)
                )
            };

            const start = performance.now();
            const terrain = new TerrainV2(manyFeaturesDef);
            const attrs = terrain.getModifiedAttributes();
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100); // Should complete in under 100ms
            expect(attrs.lightLevel).toBe(0); // 60 - 1000 clamped to 0
        });
    });

    describe('Logging', () => {
        it('should log attribute modifications', () => {
            const basicTerrain = new TerrainV2(mockForestDefinition);
            basicTerrain.getModifiedAttributes();

            expect(logger.debug).toHaveBeenCalledWith(
                'Starting attribute modification',
                expect.any(Object)
            );
            expect(logger.debug).toHaveBeenCalledWith(
                'Default extended attributes',
                expect.any(Object)
            );
            expect(logger.debug).toHaveBeenCalledWith(
                'Final attributes',
                expect.any(Object)
            );
        });

        it('should warn about potential issues', () => {
            const extremeValuesDef: TerrainDefinition = {
                ...mockForestDefinition,
                features: [
                    createMockFeature('extreme', {
                        lightLevel: { type: 'add', value: 1000 }
                    })
                ]
            };
            const extremeTerrain = new TerrainV2(extremeValuesDef);
            extremeTerrain.getModifiedAttributes();

            expect(logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('attribute value clamped'),
                expect.any(Object)
            );
        });
    });
});
