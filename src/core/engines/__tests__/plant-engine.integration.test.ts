import { PlantEngine } from '@/core/engines/plant-engine';
import plants from '@/lib/game/data/creatures/plants';

describe('PlantEngine integration', () => {
  it('grows plants over ticks and consumes chunk resources', () => {
    const t = (k: string) => k;
    const engine = new PlantEngine(t as any);

    const chunk: any = {
      x: 0,
      y: 0,
      moisture: 40,
      temperature: 20,
      vegetationDensity: 5,
      soilType: 'tilled',
      waterTimer: 5,
      waterRetention: 1,
      nutrition: 20,
      fertilizerLevel: 5,
      plants: []
    };

    const chunks = new Map<string, any>([[`0,0`, chunk]]);

    // Add a fast-growing plant for the test (tall_grass)
    engine.addPlant(chunk, plants.tall_grass);

    const initialNutrition = chunk.nutrition;
    const initialWater = chunk.waterTimer;
    const initialFertilizer = chunk.fertilizerLevel;

    // Tick the engine several times
    for (let i = 0; i < 6; i++) {
      const messages = engine.updatePlants(i, chunks, 'spring' as any);
      // allow messages but don't assert specifics here
    }

    expect(chunk.plants.length).toBeGreaterThanOrEqual(1);
    const p = chunk.plants[0];
    expect(p.maturity).toBeGreaterThan(0);

    // Resources should have been consumed/decayed
    expect(chunk.nutrition).toBeLessThan(initialNutrition);
    expect(chunk.waterTimer).toBeLessThanOrEqual(initialWater);
    expect(chunk.fertilizerLevel).toBeLessThanOrEqual(initialFertilizer);
  });
});
