import { tillSoil, waterTile, fertilizeTile, plantSeed } from '@/core/usecases/farming-usecase';

describe('farming-usecase', () => {
  test('tillSoil sets soilType and initializes fields', () => {
    const chunk: any = { x: 0, y: 0 };
    const next = tillSoil(chunk as any);
    expect(next.soilType).toBe('tilled');
    expect(next.waterRetention).toBeDefined();
    expect(next.waterTimer).toBeDefined();
    expect(next.nutrition).toBeDefined();
    expect(next.fertilizerLevel).toBeDefined();
  });

  test('waterTile sets waterTimer respecting retention', () => {
    const chunk: any = { waterTimer: 0, waterRetention: 2 };
    const next = waterTile(chunk as any, 3);
    // retention 2 should double duration
    expect(next.waterTimer).toBeGreaterThanOrEqual(6 - 1); // ceil rounding
  });

  test('fertilizeTile increases nutrition and fertilizerLevel', () => {
    const chunk: any = { nutrition: 10, fertilizerLevel: 0 };
    const next = fertilizeTile(chunk as any, 20);
    expect(next.nutrition).toBeGreaterThanOrEqual(30);
    expect(next.fertilizerLevel).toBeGreaterThanOrEqual(1);
  });

  test('plantSeed requires tilled soil and adds plant', () => {
    const baseChunk: any = { soilType: 'untouched', plants: [] };
    const res1 = plantSeed(baseChunk as any, 'wildflower_seeds');
    expect(res1.planted).toBe(false);

    const tilled: any = { soilType: 'tilled', plants: [] };
    const res2 = plantSeed(tilled as any, 'wildflower_seeds');
    expect(res2.planted).toBe(true);
    expect(Array.isArray(res2.chunk.plants)).toBe(true);
    expect((res2.chunk.plants as any).length).toBeGreaterThanOrEqual(1);
  });
});
