import { PlantEngine } from '@/core/engines/plant-engine';
import plants from '@/lib/game/data/creatures/plants';

describe('fertilizer decay integration', () => {
  test('fertilizer applied decays over ticks but boosts growth', () => {
    const t = (k: string) => k;
    const engine = new PlantEngine(t as any);

    const chunk: any = {
      x: 1,
      y: 1,
      moisture: 50,
      temperature: 20,
      vegetationDensity: 5,
      soilType: 'tilled',
      waterTimer: 10,
      waterRetention: 1,
      nutrition: 10,
      fertilizerLevel: 5,
      plants: []
    };

    engine.addPlant(chunk, plants.tall_grass);

    const initialFertilizer = chunk.fertilizerLevel;
    // Tick a few times
    for (let i = 0; i < 5; i++) {
      engine.updatePlants(i, new Map([["1,1", chunk]]), 'spring' as any);
    }

    // Fertilizer should have decayed
    expect(chunk.fertilizerLevel).toBeLessThan(initialFertilizer);
    // Plant should have gained some maturity
    expect(chunk.plants[0].maturity).toBeGreaterThan(0);
  });
});
