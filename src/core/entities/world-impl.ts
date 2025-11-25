import type { Chunk } from '@/core/types/game';
import { GridPosition } from '../values/grid-position';

/**
 * Concrete World implementation holding a 2D grid of `Chunk` objects.
 * This class provides helper accessors used by usecases and renderers.
 */
export class WorldImpl {
  public grid: (Chunk | null)[][];
  public regions: { [id: number]: any } = {};

  constructor(grid: (Chunk | null)[][] = [], regions: { [id: number]: any } = {}) {
    this.grid = grid;
    this.regions = regions;
  }

  get width(): number {
    return this.grid[0]?.length ?? 0;
  }

  get height(): number {
    return this.grid.length;
  }

  getChunk(position: GridPosition | { x: number; y: number } | any): Chunk | undefined {
    const x = position.x;
    const y = position.y;
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < (this.grid[r] || []).length; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;
        if (cell.x === x && cell.y === y) return cell;
      }
    }
    return undefined;
  }

  getChunksInArea(position: GridPosition | { x: number; y: number } | any, viewRadius: number): Chunk[] {
    const centerX = position.x;
    const centerY = position.y;
    const out: Chunk[] = [];
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < (this.grid[r] || []).length; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;
        const dx = Math.abs(cell.x - centerX);
        const dy = Math.abs(cell.y - centerY);
        if (Math.max(dx, dy) <= viewRadius) out.push(cell);
      }
    }
    return out;
  }

  getChunksByTerrain(terrainType: string): Chunk[] {
    const out: Chunk[] = [];
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < (this.grid[r] || []).length; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;
        if (cell.terrain === terrainType) out.push(cell);
      }
    }
    return out;
  }

  update(): void {
    // placeholder for future simulation ticks
  }

  getExploredPercentage(): number {
    let total = 0;
    let explored = 0;
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < (this.grid[r] || []).length; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;
        total++;
        if (cell.explored) explored++;
      }
    }
    return total === 0 ? 0 : Math.round((explored / total) * 100);
  }

  getRegion(regionId: number): any {
    return this.regions?.[regionId] ?? null;
  }
}

export default WorldImpl;
