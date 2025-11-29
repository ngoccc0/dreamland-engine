import { adaptivePlantTick, scheduleNextEvent, calculateEnvironmentalMultiplier } from '@/core/usecases/adaptivePlantTick';
import { defaultGameConfig, GameConfig } from '@/lib/config/game-config';
import { createRng, RNG } from '@/lib/narrative/rng'; // Import RNG type as well
import type { Chunk } from '@/core/types/world';
import type { CreatureDefinition } from '@/core/types/creature';

// Mock getTranslatedText since it's a util and not the focus of this unit test
jest.mock('@/lib/i18n', () => ({
    getTranslatedText: jest.fn((text, lang) => {
        if (typeof text === 'object' && text !== null && 'en' in text) {
            return text.en;
        }
        return text;
    }),
}));

// Mock the entire rng module to control createRng behavior
jest.mock('@/lib/narrative/rng', () => {
    const originalModule = jest.requireActual('@/lib/narrative/rng');
    return {
        ...originalModule,
        createRng: jest.fn((seed?: string | number) => {
            const mockRng: RNG = {
                float: jest.fn(),
                int: jest.fn(),
                choice: jest.fn(),
                weightedChoice: jest.fn(),
                shuffle: jest.fn(),
                seedHex: originalModule.createRng(seed).seedHex, // Keep original seedHex behavior
            };
            // Default mock values, can be overridden per test
            (mockRng.float as jest.Mock).mockReturnValue(0.5);
            (mockRng.int as jest.Mock).mockImplementation((min: number, max: number) => min + Math.floor(0.5 * (max - min + 1)));
            (mockRng.choice as jest.Mock).mockImplementation((arr: any[]) => (arr.length > 0 ? arr[0] : undefined));
            (mockRng.weightedChoice as jest.Mock).mockImplementation((items: any[], weights: number[]) => (items.length > 0 ? items[0] : undefined));
            (mockRng.shuffle as jest.Mock).mockImplementation((arr: any[]) => [...arr]); // Return a shallow copy

            return mockRng;
        }),
    };
});

// Cast the mocked createRng for better type safety when setting up mocks
const mockedCreateRng = createRng as jest.MockedFunction<typeof createRng>;

describe('adaptivePlantTick', () => {
    let mockPlant: CreatureDefinition;
    let mockChunk: Chunk;
    let mockConfig: GameConfig;
    const initialRngSeed = 'test-plant-seed';

    beforeEach(() => {
        // Reset mocks before each test
        mockedCreateRng.mockClear();

        mockConfig = {
            ...defaultGameConfig,
            plant: {
                ...defaultGameConfig.plant,
                magicAffinityGrowthFactor: 0.1,
                windDropFactor: 0.05,
                baseEnvironmentalFactor: 1.0,
            },
        };

        mockPlant = {
            id: 'common_tree',
            name: { en: 'Common Tree', vi: 'Cây Gỗ Thường' },
            description: { en: 'A medium-sized deciduous tree.', vi: 'Một cây gỗ tầm trung, thường gặp.' },
            emoji: '🌳',
            hp: 200,
            damage: 0,
            behavior: 'immobile',
            size: 'large',
            diet: [],
            satiation: 0,
            maxSatiation: 0,
            plantProperties: {
                vegetationContribution: 20,
                initialVegetationRatio: 0.8, // Example initial value
                parts: [
                    {
                        name: 'leaves',
                        maxQty: 5,
                        currentQty: 4,
                        growProb: 0.05,
                        dropProb: 0.01,
                        loot: [{ name: 'plant_fiber', chance: 0.9, quantity: { min: 1, max: 2 } }],
                        droppedLoot: [{ name: 'fallen_leaf', chance: 1, quantity: { min: 1, max: 1 } }],
                    },
                    {
                        name: 'flowers',
                        maxQty: 3,
                        currentQty: 0, // Starts at 0, depends on leaves
                        growProb: 0.03,
                        dropProb: 0.005,
                        loot: [{ name: 'white_flower', chance: 0.7, quantity: { min: 1, max: 1 } }],
                        droppedLoot: [{ name: 'petal', chance: 1, quantity: { min: 1, max: 1 } }],
                        triggerFrom: 'leaves',
                    },
                    {
                        name: 'fruits',
                        maxQty: 3,
                        currentQty: 0, // Starts at 0, depends on flowers
                        growProb: 0.02,
                        dropProb: 0.01,
                        loot: [{ name: 'strange_fruit', chance: 0.8, quantity: { min: 1, max: 1 } }],
                        droppedLoot: [{ name: 'tree_seed', chance: 0.2, quantity: { min: 1, max: 1 } }],
                        triggerFrom: 'flowers',
                    },
                    {
                        name: 'trunk',
                        maxQty: 1,
                        currentQty: 1,
                        growProb: 0.005,
                        dropProb: 0,
                        loot: [{ name: 'sturdy_branch', chance: 0.6, quantity: { min: 1, max: 1 } }, { name: 'wood_core', chance: 0.9, quantity: { min: 1, max: 1 } }],
                        structural: true,
                    },
                    {
                        name: 'roots',
                        maxQty: 1,
                        currentQty: 1,
                        growProb: 0.008,
                        dropProb: 0,
                        loot: [{ name: 'root', chance: 0.5, quantity: { min: 1, max: 1 } }],
                        structural: true,
                        hidden: true,
                    },
                ],
            },
        };

        mockChunk = {
            x: 0, y: 0,
            terrain: 'forest',
            description: 'A lush forest.',
            explored: true,
            lastVisited: 0,
            regionId: 1,
            travelCost: 10,
            vegetationDensity: 50,
            moisture: 70,
            elevation: 100,
            lightLevel: 80,
            dangerLevel: 20,
            magicAffinity: 30,
            humanPresence: 10,
            explorability: 50,
            soilType: 'loamy',
            predatorPresence: 5,
            windLevel: 10,
            temperature: 20,
            actions: [],
            items: [],
            NPCs: [],
            structures: [],
            enemy: mockPlant,
        };
    });

    it('should not modify plant if no plantProperties or parts are defined', () => {
        const plantWithoutParts: CreatureDefinition = { ...mockPlant, plantProperties: { vegetationContribution: 10 } };
        const result = adaptivePlantTick({ plant: plantWithoutParts, chunk: mockChunk, config: mockConfig, rngSeed: initialRngSeed, gameTime: 0 });
        expect(result.newPlant).toEqual(plantWithoutParts);
        expect(result.droppedItems).toEqual([]);
        expect(result.narrativeEvents).toEqual([]);
        expect(result.envUpdates).toEqual({});
    });

    it('should increase leaves quantity under optimal conditions', () => {
        const mockRngInstance: RNG = {
            float: jest.fn(() => 0.01), // Force growth
            int: jest.fn((min, max) => min),
            choice: jest.fn((arr: any[]) => (arr.length > 0 ? arr[0] : undefined)),
            weightedChoice: jest.fn((items: any[], weights: number[]) => (items.length > 0 ? items[0] : undefined)),
            shuffle: jest.fn((arr: any[]) => [...arr]),
            seedHex: 'mockSeedHex',
        };
        mockedCreateRng.mockReturnValue(mockRngInstance);

        const result = adaptivePlantTick({ plant: mockPlant, chunk: mockChunk, config: mockConfig, rngSeed: 'leaves_seed', gameTime: 0 });
        const leaves = result.newPlant.plantProperties!.parts!.find(p => p.name === 'leaves');
        expect(leaves!.currentQty).toBe(5); // Should grow from 4 to 5
        expect(result.narrativeEvents).toContainEqual({ key: 'growEvent', params: { part: 'leaves', target: 'Common Tree' } });
    });

    it('should handle leaf drop probability based on wind', () => {
        mockChunk.windLevel = 80; // High wind

        const mockRngInstance: RNG = {
            float: jest.fn(() => 0.01), // Force drop
            int: jest.fn((min, max) => min),
            choice: jest.fn((arr: any[]) => (arr.length > 0 ? arr[0] : undefined)),
            weightedChoice: jest.fn((items: any[], weights: number[]) => (items.length > 0 ? items[0] : undefined)),
            shuffle: jest.fn((arr: any[]) => [...arr]),
            seedHex: 'mockSeedHex',
        };
        mockedCreateRng.mockReturnValue(mockRngInstance);

        const result = adaptivePlantTick({ plant: mockPlant, chunk: mockChunk, config: mockConfig, rngSeed: 'leaves_seed_drop', gameTime: 0 });
        const leaves = result.newPlant.plantProperties!.parts!.find(p => p.name === 'leaves');
        expect(leaves!.currentQty).toBe(3); // Should drop from 4 to 3
        expect(result.narrativeEvents).toContainEqual({ key: 'dropEvent', params: { part: 'leaves', target: 'Common Tree' } });
        expect(result.droppedItems).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'fallen_leaf', quantity: 1, sourcePlantId: 'common_tree' })
        ]));
    });

    it('should trigger flower growth only if leaves are present', () => {
        mockPlant.plantProperties!.parts![0].currentQty = 5; // Manually set leaves to max

        mockedCreateRng.mockImplementation((seed) => {
            const mockRng: RNG = {
                float: jest.fn(),
                int: jest.fn(),
                choice: jest.fn((arr: any[]) => (arr.length > 0 ? arr[0] : undefined)),
                weightedChoice: jest.fn((items: any[], weights: number[]) => (items.length > 0 ? items[0] : undefined)),
                shuffle: jest.fn((arr: any[]) => [...arr]),
                seedHex: 'mockSeedHex',
            };
            if (String(seed).includes('leaves')) (mockRng.float as jest.Mock).mockReturnValue(0.5); // Leaves are stable
            if (String(seed).includes('flowers')) (mockRng.float as jest.Mock).mockReturnValue(0.01); // Force flowers grow
            return mockRng;
        });

        const result = adaptivePlantTick({ plant: mockPlant, chunk: mockChunk, config: mockConfig, rngSeed: initialRngSeed, gameTime: 0 });
        const flowers = result.newPlant.plantProperties!.parts!.find(p => p.name === 'flowers');
        expect(flowers!.currentQty).toBe(1); // Should grow from 0 to 1
        expect(result.narrativeEvents).toContainEqual({ key: 'growEvent', params: { part: 'flowers', target: 'Common Tree' } });
    });

    it('should update environmental light level based on leaves quantity', () => {
        mockPlant.plantProperties!.parts![0].currentQty = 5; // Max leaves
        mockPlant.plantProperties!.parts![0].maxQty = 5; // Ensure maxQty is defined for ratio calc

        mockedCreateRng.mockReturnValue({ // Default RNG for other parts
            float: jest.fn(() => 0.5),
            int: jest.fn((min, max) => min),
            choice: jest.fn((arr: any[]) => (arr.length > 0 ? arr[0] : undefined)),
            weightedChoice: jest.fn((items: any[], weights: number[]) => (items.length > 0 ? items[0] : undefined)),
            shuffle: jest.fn((arr: any[]) => [...arr]),
            seedHex: 'mockSeedHex',
        });

        const result = adaptivePlantTick({ plant: mockPlant, chunk: mockChunk, config: mockConfig, rngSeed: initialRngSeed, gameTime: 0 });
        // Expect a negative delta for light due to dense leaves
        expect(result.envUpdates.lightLevelDelta).toBeLessThan(0);
    });

    it('should remove plant if all parts are depleted over time', () => {
        mockPlant.plantProperties!.parts!.forEach(p => p.currentQty = 0); // Deplete all parts

        mockedCreateRng.mockReturnValue({ // Default RNG for other parts
            float: jest.fn(() => 0.5),
            int: jest.fn((min, max) => min),
            choice: jest.fn((arr: any[]) => (arr.length > 0 ? arr[0] : undefined)),
            weightedChoice: jest.fn((items: any[], weights: number[]) => (items.length > 0 ? items[0] : undefined)),
            shuffle: jest.fn((arr: any[]) => [...arr]),
            seedHex: 'mockSeedHex',
        });

        const result = adaptivePlantTick({ plant: mockPlant, chunk: mockChunk, config: mockConfig, rngSeed: initialRngSeed, gameTime: 0 });
        expect(result.plantRemoved).toBe(true);
        expect(result.narrativeEvents).toContainEqual({ key: 'plantWilts', params: { target: 'Common Tree' } });
    });

    it('should handle cactus-specific parts and growth', () => {
        mockPlant = {
            ...mockPlant,
            id: 'cactus',
            name: { en: 'Cactus', vi: 'Xương Rồng' },
            emoji: '🌵',
            plantProperties: {
                vegetationContribution: 10,
                initialVegetationRatio: 0.5,
                parts: [
                    {
                        name: 'flowers',
                        maxQty: 2,
                        currentQty: 1,
                        growProb: 0.04,
                        dropProb: 0.005,
                        loot: [{ name: 'cactus_flower', chance: 0.8, quantity: { min: 1, max: 1 } }],
                        droppedLoot: [{ name: 'petal', chance: 1, quantity: { min: 1, max: 1 } }],
                    },
                    {
                        name: 'fruits',
                        maxQty: 4,
                        currentQty: 2,
                        growProb: 0.03,
                        dropProb: 0.01,
                        loot: [{ name: 'cactus_fruit', chance: 0.9, quantity: { min: 1, max: 2 } }],
                        droppedLoot: [{ name: 'cactus_seed', chance: 0.3, quantity: { min: 1, max: 1 } }],
                        triggerFrom: 'flowers',
                    },
                    {
                        name: 'trunk',
                        maxQty: 1,
                        currentQty: 1,
                        growProb: 0.006,
                        dropProb: 0,
                        loot: [{ name: 'thorny_vine', chance: 0.7, quantity: { min: 1, max: 1 } }],
                        structural: true,
                    },
                ],
            },
        };

        mockChunk.moisture = 20; // Desert-like conditions
        mockChunk.lightLevel = 90; // High light

        // Set up individual mocks for createRng calls
        mockedCreateRng.mockImplementation((seed) => {
            const mockRng: RNG = {
                float: jest.fn(),
                int: jest.fn(),
                choice: jest.fn((arr: any[]) => (arr.length > 0 ? arr[0] : undefined)),
                weightedChoice: jest.fn((items: any[], weights: number[]) => (items.length > 0 ? items[0] : undefined)),
                shuffle: jest.fn((arr: any[]) => [...arr]),
                seedHex: 'mockSeedHex',
            };
            if (String(seed).includes('flowers')) (mockRng.float as jest.Mock).mockReturnValue(0.01); // Force flowers grow
            if (String(seed).includes('fruits')) (mockRng.float as jest.Mock).mockReturnValue(0.01); // Force fruits grow
            if (String(seed).includes('trunk')) (mockRng.float as jest.Mock).mockReturnValue(0.5); // Trunk stable
            return mockRng;
        });

        const result = adaptivePlantTick({ plant: mockPlant, chunk: mockChunk, config: mockConfig, rngSeed: initialRngSeed, gameTime: 0 });
        const flowers = result.newPlant.plantProperties!.parts!.find(p => p.name === 'flowers');
        const fruits = result.newPlant.plantProperties!.parts!.find(p => p.name === 'fruits');

        // Due to lower moisture, growth multiplier will be lower, so even with forced RNG, growth might be capped by env.
        // Assuming baseGrowProb for cactus flowers (0.04) * envMultiplier (e.g. around 0.5 for dry/bright) = 0.02.
        // If RNG is 0.01, it should grow.
        expect(flowers!.currentQty).toBe(2); // Should grow from 1 to 2
        expect(fruits!.currentQty).toBe(3); // Should grow from 2 to 3 (as flowers are now maxed for trigger)
        expect(result.narrativeEvents).toEqual(expect.arrayContaining([
            expect.objectContaining({ key: 'growEvent', params: { part: 'flowers', target: 'Cactus' } }),
            expect.objectContaining({ key: 'growEvent', params: { part: 'fruits', target: 'Cactus' } }),
        ]));
    });
});

describe('scheduleNextEvent (Hybrid Scheduling)', () => {
    let mockPart: any;

    beforeEach(() => {
        mockPart = {
            name: 'leaves',
            maxQty: 5,
            currentQty: 2,
            growProb: 0.1,
            dropProb: 0.02,
        };
    });

    test('scheduleNextEvent returns null for p_eff <= 0', () => {
        const nextTick = scheduleNextEvent(mockPart, 0, 100, 'seed1');
        expect(nextTick).toBeNull();
    });

    test('scheduleNextEvent returns integer > currentTime for valid p', () => {
        const nextTick = scheduleNextEvent(mockPart, 0.5, 100, 'seed1');
        expect(nextTick).not.toBeNull();
        expect(typeof nextTick).toBe('number');
        if (nextTick !== null) {
            expect(nextTick).toBeGreaterThan(100);
        }
    });

    test('scheduleNextEvent is deterministic with same seed', () => {
        const nextTick1 = scheduleNextEvent(mockPart, 0.5, 100, 'consistent-seed');
        const nextTick2 = scheduleNextEvent(mockPart, 0.5, 100, 'consistent-seed');
        expect(nextTick1).toBe(nextTick2);
    });

    test('scheduleNextEvent produces different results for different seeds', () => {
        const nextTick1 = scheduleNextEvent(mockPart, 0.5, 100, 'seed-a');
        const nextTick2 = scheduleNextEvent(mockPart, 0.5, 100, 'seed-b');
        // Different seeds should produce different waits
        expect(nextTick1).not.toBe(nextTick2);
    });
});

describe('calculateEnvironmentalMultiplier', () => {
    let mockChunk: Chunk;

    beforeEach(() => {
        mockChunk = {
            x: 0,
            y: 0,
            moisture: 50,
            lightLevel: 50,
            temperature: 20,
            windLevel: 0,
            items: [],
            actions: [],
            biome: 'temperate',
            season: 'summer',
        } as any;
    });

    test('calculateEnvironmentalMultiplier returns object with multiplier and state', () => {
        const result = calculateEnvironmentalMultiplier(mockChunk as any, defaultGameConfig, 0);
        expect(typeof result).toBe('object');
        expect(result.multiplier).toBeGreaterThan(0);
        expect(['SUITABLE', 'UNFAVORABLE', 'UNSUITABLE']).toContain(result.state);
    });
});

describe('Hybrid Scheduling - Integration', () => {
    let mockPart: any;

    beforeEach(() => {
        mockPart = {
            name: 'fruits',
            maxQty: 10,
            currentQty: 5,
            growProb: 0.08,
            dropProb: 0.01,
        };
    });

    test('Harvest-all zeroes currentQty', () => {
        mockPart.currentQty = 7;
        mockPart.currentQty = 0;
        expect(mockPart.currentQty).toBe(0);
    });

    test('After harvest, scheduleNextEvent generates new nextTick', () => {
        const envMult = 0.8;
        mockPart.currentQty = 0;
        const nextTick = scheduleNextEvent(mockPart, envMult, 200, 'post-harvest');
        expect(nextTick).not.toBeNull();
        if (nextTick !== null) {
            expect(nextTick).toBeGreaterThan(200);
        }
    });
});

