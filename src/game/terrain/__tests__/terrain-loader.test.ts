import { TerrainLoader } from '../services/terrain-loader';
import { TerrainManager } from '../implementations/terrain-manager';
import * as fs from 'fs';
import * as path from 'path';

describe('TerrainLoader', () => {
    beforeEach(() => {
        // Reset TerrainManager singleton before each test
        (TerrainManager as any).instance = undefined;
    });

    describe('loadFromJson', () => {
        it('should load valid terrain definitions', () => {
            // Load test fixture
            const jsonData = fs.readFileSync(
                path.join(__dirname, 'fixtures', 'terrain-data.json'),
                'utf8'
            );

            TerrainLoader.loadFromJson(jsonData);
            const manager = TerrainManager.getInstance();

            // Verify terrains were loaded
            expect(manager.hasTerrainType('test_forest')).toBe(true);
            expect(manager.hasTerrainType('test_desert')).toBe(true);

            // Verify terrain details
            const forest = manager.getTerrainDefinition('test_forest');
            expect(forest).toBeDefined();
            expect(forest?.baseAttributes.vegetationDensity).toBe(80);
            expect(forest?.features.length).toBe(1);
            expect(forest?.features[0].id).toBe('dense_trees');
        });

        it('should throw on invalid JSON', () => {
            expect(() => {
                TerrainLoader.loadFromJson('invalid json');
            }).toThrow();
        });

        it('should throw on missing required fields', () => {
            const invalidJson = JSON.stringify({
                terrains: [{
                    id: 'invalid'
                    // Missing required fields
                }]
            });

            expect(() => {
                TerrainLoader.loadFromJson(invalidJson);
            }).toThrow(/missing required fields/);
        });

        it('should normalize optional fields', () => {
            const minimalJson = JSON.stringify({
                terrains: [{
                    id: 'minimal',
                    name: 'Minimal',
                    baseAttributes: {
                        vegetationDensity: 0,
                        elevation: 0,
                        temperature: 20,
                        moisture: 50
                    }
                }]
            });

            TerrainLoader.loadFromJson(minimalJson);
            const manager = TerrainManager.getInstance();
            const terrain = manager.getTerrainDefinition('minimal');

            expect(terrain).toBeDefined();
            expect(terrain?.features).toEqual([]);
            expect(terrain?.metadata).toBeDefined();
            expect(terrain?.metadata.buildable).toBe(false);
            expect(terrain?.metadata.passable).toBe(true);
            expect(terrain?.metadata.resources).toEqual([]);
        });
    });

    describe('loadMultiple', () => {
        it('should load multiple JSON sources', () => {
            const json1 = JSON.stringify({
                terrains: [{
                    id: 'terrain1',
                    name: 'Terrain 1',
                    baseAttributes: {
                        vegetationDensity: 50,
                        elevation: 100,
                        temperature: 20,
                        moisture: 50
                    }
                }]
            });

            const json2 = JSON.stringify({
                terrains: [{
                    id: 'terrain2',
                    name: 'Terrain 2',
                    baseAttributes: {
                        vegetationDensity: 60,
                        elevation: 200,
                        temperature: 25,
                        moisture: 60
                    }
                }]
            });

            TerrainLoader.loadMultiple([json1, json2]);
            const manager = TerrainManager.getInstance();

            expect(manager.hasTerrainType('terrain1')).toBe(true);
            expect(manager.hasTerrainType('terrain2')).toBe(true);
        });

        it('should throw if any JSON is invalid', () => {
            const validJson = JSON.stringify({
                terrains: [{
                    id: 'valid',
                    name: 'Valid',
                    baseAttributes: {
                        vegetationDensity: 50,
                        elevation: 100,
                        temperature: 20,
                        moisture: 50
                    }
                }]
            });

            expect(() => {
                TerrainLoader.loadMultiple([validJson, 'invalid json']);
            }).toThrow();
        });
    });
});
