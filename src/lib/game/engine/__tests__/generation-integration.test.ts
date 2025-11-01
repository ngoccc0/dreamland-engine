import { generateChunkContent } from '../chunk-generation';
import { itemDefinitions } from '@/lib/game/items';

describe('generateChunkContent integration', () => {
  const originalRandom = Math.random;
  afterEach(() => {
    Math.random = originalRandom;
    jest.resetModules();
  });

  test('desert template spawns items when resourceDensity is high', () => {
    // force low random values to encourage spawns
    Math.random = () => 0.01;

    const chunkData: any = {
      vegetationDensity: 2,
      moisture: 0,
      elevation: 0,
      dangerLevel: 0,
      magicAffinity: 0,
      humanPresence: 0,
      predatorPresence: 0,
      temperature: 30,
      terrain: 'desert',
      explorability: 10,
      soilType: 'sand',
      travelCost: 1,
      lightLevel: 80,
      windLevel: 10
    };

    const worldProfile: any = { resourceDensity: 200 };
    const result = generateChunkContent(chunkData, worldProfile, itemDefinitions as any, [], [], 'en');

    expect(result.items.length).toBeGreaterThan(0);
  });
});
