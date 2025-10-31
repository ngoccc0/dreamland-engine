import { selectEntities } from '../entity-generation';
import { generateChunkContent } from '../chunk-generation';

// Mock getTemplates used by generateChunkContent
jest.mock('@/lib/game/templates', () => ({
  getTemplates: (language: string) => ({
    testTerrain: {
      descriptionTemplates: ['A test terrain [adjective] with [feature]'],
      adjectives: ['rocky'],
      features: ['stones'],
      items: [
        { name: 'MasterItem', conditions: { chance: 1 } }
      ],
      NPCs: [],
      enemies: [],
      structures: []
    }
  })
}));

describe('entity generation and chunk content', () => {
  const originalRandom = Math.random;

  afterEach(() => {
    Math.random = originalRandom;
    jest.resetModules();
  });

  test('selectEntities selects entity when random is low and tier multiplier applied', () => {
    // Force deterministic random values
    Math.random = () => 0.01; // very low => should spawn when chance ~1

    const available = [ { name: 'TestItem', conditions: { chance: 1 } } ];
    const chunkMock: any = { vegetationDensity: 10, moisture: 0, elevation: 0, dangerLevel: 0, magicAffinity: 0, humanPresence: 0, predatorPresence: 0, temperature: 20, terrain: 'testTerrain', explorability: 10, soilType: 'loam', travelCost: 1, lightLevel: 50, windLevel: 10 };
    const allItemDefinitions: any = { TestItem: { name: 'TestItem', description: 'desc', tier: 1, baseQuantity: { min:1, max:1 }, emoji: 'x' } };
    const worldProfile: any = { resourceDensity: 50 };

    const selected = selectEntities(available as any, 3, chunkMock, allItemDefinitions, worldProfile);
    expect(selected.length).toBeGreaterThan(0);
  });

  test('generateChunkContent produces spawned items using mocked templates', () => {
    // deterministic random
    let counter = 0;
    Math.random = () => {
      // first call to pick description, others to decide spawns: return low values
      counter++;
      return 0.02;
    };

    const chunkData: any = {
      vegetationDensity: 5,
      moisture: 10,
      elevation: 0,
      dangerLevel: 0,
      magicAffinity: 0,
      humanPresence: 0,
      predatorPresence: 0,
      temperature: 20,
      terrain: 'testTerrain',
      explorability: 10,
      soilType: 'loam',
      travelCost: 1,
      lightLevel: 50,
      windLevel: 10
    };

    const worldProfile: any = { resourceDensity: 100 };
    const allItemDefinitions: any = { MasterItem: { name: {en: 'MasterItem'}, description: 'master', tier: 1, baseQuantity: { min:1, max:2 }, emoji: '★' } };
    const customCatalog: any[] = [];

    const result = generateChunkContent(chunkData, worldProfile, allItemDefinitions, customCatalog, [], 'en');

    expect(result.items.length).toBeGreaterThan(0);
    // Ensure instrumentation sample items matches items names
    const sample = result.items.map(i => {
      if (typeof i.name === 'string') return i.name;
      const nameObj: any = i.name as any;
      return nameObj.en ?? nameObj.default ?? JSON.stringify(nameObj);
    });
    expect(sample).toContain('MasterItem');
    expect(result.enemy).toBeNull();
  });
});
