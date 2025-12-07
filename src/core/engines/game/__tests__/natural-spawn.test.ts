import { generateChunkContent } from '../chunk-generation';

describe('naturalSpawn integration', () => {
  const originalRandom = Math.random;
  afterEach(() => {
    Math.random = originalRandom;
    jest.resetModules();
  });

  test('creature naturalSpawn in creature definitions produces enemy object for matching biome', () => {
  // Force deterministic randomness very low so enemy spawn checks pass
  Math.random = () => 0.0001;

    const chunkData: any = {
      vegetationDensity: 50,
      moisture: 50,
      elevation: 0,
      dangerLevel: 0,
      magicAffinity: 0,
      humanPresence: 0,
      predatorPresence: 0,
      temperature: 20,
      terrain: 'forest',
      explorability: 10,
      soilType: 'fertile',
      travelCost: 1,
      lightLevel: 50,
      windLevel: 10
    };

    const worldProfile: any = { resourceDensity: 1 };
    const allItemDefinitions: any = {};
    const customCatalog: any[] = [];

    const result = generateChunkContent(chunkData, worldProfile, allItemDefinitions, customCatalog, [], 'en');

    // Expect an enemy object to be present (plants are represented as creature/enemy objects)
    expect(result.enemy).not.toBeNull();
    // basic sanity: enemy should have hp and behavior fields
    expect(result.enemy).toHaveProperty('hp');
    expect(result.enemy).toHaveProperty('behavior');
  });
});
