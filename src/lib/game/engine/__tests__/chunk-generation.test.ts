import { generateChunkContent } from '../chunk-generation';
import * as entityGen from '../entity-generation';
import * as worldGen from '../world-generation';

jest.mock('../entity-generation');

describe('generateChunkContent (deterministic aspects)', () => {
  const allItemDefinitions = {
    iron_ingot: {
      id: 'iron_ingot',
      name: 'Iron Ingot',
      description: 'A bar of iron.',
      tier: 1,
      emoji: '🔩',
      baseQuantity: { min: 1, max: 1 },
    }
  } as any;

  beforeAll(() => {
    // Make random deterministic for tests
    jest.spyOn(Math, 'random').mockImplementation(() => 0.01);
    // make getRandomInRange deterministic by accepting any argument shape
    if ((worldGen as any).getRandomInRange) {
      jest.spyOn(worldGen as any, 'getRandomInRange').mockImplementation((arg: any) => (arg && arg.min) ?? 0);
    }
  });

  afterAll(() => {
    (Math.random as any).mockRestore && (Math.random as any).mockRestore();
    (worldGen as any).getRandomInRange && (worldGen as any).getRandomInRange.mockRestore && (worldGen as any).getRandomInRange.mockRestore();
    jest.resetAllMocks();
  });

  test('merges loot quantity into existing spawned item when ids resolve', () => {
    // Mock selectEntities to produce controlled outputs for spawned items and structures.
    const selectEntitiesMock = (entityGen as any).selectEntities as jest.Mock;
    // Order of calls in generateChunkContent (actual):
    // 1) spawnedNPCs
    // 2) spawnedEnemies
    // 3) spawnedStructureRefs
    // Provide mocks accordingly so structures return loot containing iron_ingot.
    selectEntitiesMock
      .mockImplementationOnce(() => []) // NPCs
      .mockImplementationOnce(() => []) // enemies
      .mockImplementationOnce(() => [
        { loot: [{ name: 'iron_ingot', chance: 1, quantity: { min: 2, max: 2 } }], data: {} }
      ]); // structures

    const chunkData = {
      vegetationDensity: 70,
      moisture: 60,
      elevation: 100,
      dangerLevel: 10,
      magicAffinity: 0,
      humanPresence: 0,
      predatorPresence: 0,
      temperature: 20,
      terrain: 'forest',
      explorability: 80,
      soilType: 'fertile',
      travelCost: 1,
      lightLevel: 100,
      windLevel: 0
    } as any;

    const worldProfile = { spawnMultiplier: 1, resourceDensity: 50 } as any;

    const result = generateChunkContent(chunkData, worldProfile, allItemDefinitions, [], [], 'en');

    // Expect iron ingot to be present and final quantity = loot (2)
    const found = result.items.find(i => {
      const nameAny: any = i.name;
      return (typeof nameAny === 'string' && nameAny === 'Iron Ingot') || (nameAny?.en === 'Iron Ingot');
    });
    expect(found).toBeDefined();
    expect(found!.quantity).toBe(2);
  });
});
