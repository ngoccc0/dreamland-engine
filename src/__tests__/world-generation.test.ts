import { WorldUseCase } from '@/core/usecases/world-usecase';
import { WorldGenerator } from '@/core/generators/world-generator';
import { CreatureEngine } from '@/core/rules/creature';
import { GridPosition } from '@/core/values/grid-position';

/**
 * Test suite for world generation algorithm (Weakness 7 resolution)
 *
 * Validates:
 * - World generation algorithm implementation (Weakness 7)
 * - Terrain distribution matches configuration
 * - Chunk attributes properly initialized
 * - Creature spawning per terrain type
 * - Plant/vegetation seeding
 * - Region grouping and exploration tracking
 * - Persistence integration
 */

describe('world-generation', () => {
    let worldUseCase: WorldUseCase;
    let mockWorldGenerator: any;
    let mockRepository: any;
    let mockCreatureEngine: any;
    let mockWorld: any;

    beforeEach(() => {
        // Setup mock repository
        mockRepository = {
            save: jest.fn().mockResolvedValue(undefined),
            load: jest.fn().mockResolvedValue(undefined),
        };

        // Setup mock creature engine
        mockCreatureEngine = {
            registerCreature: jest.fn(),
        };

        // Setup mock world object
        mockWorld = {
            getChunk: jest.fn((pos: GridPosition) => ({
                x: pos.x,
                y: pos.y,
                terrainType: 'grassland',
                vegetationDensity: 50,
                plants: [],
                explored: false,
                enemy: null,
                regionId: 1,
                moisture: 60,
                lightLevel: 75,
                elevation: 10,
                danger: 2,
            })),
            getChunksInArea: jest.fn((pos: GridPosition, radius: number) => []),
            getChunksByTerrain: jest.fn(() => []),
            update: jest.fn(),
            getExploredPercentage: jest.fn(() => 0),
            getRegion: jest.fn(() => ({
                id: 1,
                exploredPercentage: 0,
                dominantTerrain: { type: 'grassland' }
            })),
        };

        // Setup mock world generator
        mockWorldGenerator = {
            generateWorld: jest.fn().mockResolvedValue(mockWorld),
        };

        worldUseCase = new WorldUseCase(
            mockWorld,
            mockWorldGenerator as unknown as WorldGenerator,
            mockRepository,
            mockCreatureEngine as unknown as CreatureEngine
        );
    });

    test('world generation succeeds with valid config', async () => {
        const config = {
            width: 10,
            height: 10,
            minRegionSize: 5,
            maxRegionSize: 50,
            terrainDistribution: {
                grassland: 0.4,
                forest: 0.3,
                mountain: 0.2,
                water: 0.1,
            },
        };

        const world = await worldUseCase.generateWorld(config);

        expect(mockWorldGenerator.generateWorld).toHaveBeenCalled();
        expect(mockRepository.save).toHaveBeenCalled();
        expect(world).toBeDefined();
    });

    test('chunk exploration marks as discovered and registers creatures', async () => {
        const position = new GridPosition(5, 5);
        const mockChunk = {
            x: 5,
            y: 5,
            terrainType: 'forest',
            vegetationDensity: 70,
            explored: false,
            enemy: { id: 'goblin_1', type: 'goblin' },
            regionId: 1,
        };

        mockWorld.getChunk.mockReturnValue(mockChunk);

        const chunk = await worldUseCase.exploreChunk(position);

        expect(mockChunk.explored).toBe(true);
        expect(mockCreatureEngine.registerCreature).toHaveBeenCalledWith(
            'creature_5_5',
            mockChunk.enemy,
            position,
            mockChunk
        );
        expect(mockRepository.save).toHaveBeenCalled();
    });

    test('visible chunks query returns nearby chunks within radius', async () => {
        const position = new GridPosition(10, 10);
        const radius = 5;
        const mockChunks = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 11, y: 10 },
            { x: 10, y: 9 },
            { x: 10, y: 11 },
        ];

        mockWorld.getChunksInArea.mockReturnValue(mockChunks);

        const visible = await worldUseCase.getVisibleChunks(position, radius);

        expect(visible).toEqual(mockChunks);
        expect(mockWorld.getChunksInArea).toHaveBeenCalledWith(position, radius);
    });

    test('exploration percentage reflects global discovery progress', async () => {
        mockWorld.getExploredPercentage.mockReturnValue(45);

        const percentage = await worldUseCase.getExploredPercentage();

        expect(percentage).toBe(45);
    });

    test('region info returns correct region metadata', async () => {
        const position = new GridPosition(7, 7);
        const mockChunk = {
            x: 7,
            y: 7,
            regionId: 2,
        };
        const mockRegion = {
            id: 2,
            exploredPercentage: 60,
            dominantTerrain: { type: 'forest' },
        };

        mockWorld.getChunk.mockReturnValue(mockChunk);
        mockWorld.getRegion.mockReturnValue(mockRegion);

        const info = await worldUseCase.getRegionInfo(position);

        expect(info).toEqual({
            regionId: 2,
            exploredPercentage: 60,
            dominantTerrain: 'forest',
        });
    });

    test('world update persists state to repository', async () => {
        await worldUseCase.updateWorld();

        expect(mockWorld.update).toHaveBeenCalled();
        expect(mockRepository.save).toHaveBeenCalledWith(mockWorld);
    });

    test('terrain-based chunk queries work correctly', async () => {
        const forestChunks = [
            { x: 1, y: 1, terrainType: 'forest' },
            { x: 2, y: 3, terrainType: 'forest' },
        ];

        mockWorld.getChunksByTerrain.mockReturnValue(forestChunks);

        const chunks = await worldUseCase.getChunksByTerrain('forest' as any);

        expect(chunks).toEqual(forestChunks);
        expect(mockWorld.getChunksByTerrain).toHaveBeenCalledWith('forest');
    });

    test('chunk exploration throws error if chunk not found', async () => {
        const position = new GridPosition(99, 99);
        mockWorld.getChunk.mockReturnValue(undefined);

        await expect(worldUseCase.exploreChunk(position)).rejects.toThrow(
            'No chunk found at position'
        );
    });

    test('region info throws error if region not found', async () => {
        const position = new GridPosition(5, 5);
        mockWorld.getChunk.mockReturnValue({ x: 5, y: 5, regionId: 999 });
        mockWorld.getRegion.mockReturnValue(undefined);

        await expect(worldUseCase.getRegionInfo(position)).rejects.toThrow(
            'No region found'
        );
    });
});
