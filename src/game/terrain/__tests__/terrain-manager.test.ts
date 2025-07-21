import { TerrainManager } from '../implementations/terrain-manager';
import { TerrainDefinition } from '../api';

describe('TerrainManager', () => {
    let manager: TerrainManager;
    
    beforeEach(() => {
        // Reset singleton instance before each test
        (TerrainManager as any).instance = undefined;
        manager = TerrainManager.getInstance();
    });

    const mockTerrain: TerrainDefinition = {
        id: 'test_terrain',
        name: 'Test Terrain',
        baseAttributes: {
            vegetationDensity: 50,
            elevation: 100,
            temperature: 20,
            moisture: 50
        },
        features: [],
        metadata: {
            buildable: true,
            passable: true,
            resources: []
        }
    };

    describe('getInstance', () => {
        it('should return the same instance', () => {
            const instance1 = TerrainManager.getInstance();
            const instance2 = TerrainManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('registerTerrain', () => {
        it('should register a valid terrain definition', () => {
            manager.registerTerrain(mockTerrain);
            expect(manager.hasTerrainType('test_terrain')).toBe(true);
        });

        it('should throw on duplicate terrain id', () => {
            manager.registerTerrain(mockTerrain);
            expect(() => {
                manager.registerTerrain(mockTerrain);
            }).toThrow(/already exists/);
        });

        it('should throw on invalid terrain definition', () => {
            const invalidTerrain = { ...mockTerrain, baseAttributes: {} };
            expect(() => {
                manager.registerTerrain(invalidTerrain as TerrainDefinition);
            }).toThrow(/Missing required attribute/);
        });
    });

    describe('getTerrainDefinition', () => {
        it('should return undefined for non-existent terrain', () => {
            expect(manager.getTerrainDefinition('non_existent')).toBeUndefined();
        });

        it('should return correct definition for registered terrain', () => {
            manager.registerTerrain(mockTerrain);
            const retrieved = manager.getTerrainDefinition('test_terrain');
            expect(retrieved).toEqual(mockTerrain);
        });
    });

    describe('getAllTerrainTypes', () => {
        it('should return empty array when no terrains registered', () => {
            expect(manager.getAllTerrainTypes()).toEqual([]);
        });

        it('should return all registered terrain ids', () => {
            manager.registerTerrain(mockTerrain);
            manager.registerTerrain({
                ...mockTerrain,
                id: 'another_terrain'
            });
            expect(manager.getAllTerrainTypes()).toEqual(['test_terrain', 'another_terrain']);
        });
    });
});
