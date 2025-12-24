import { GridPosition } from '../values/grid-position';
import { RegionAttributes } from '../types/world-attributes';
import { GridCell, GridCellAttributes } from '../entities/world';
import { Terrain, TerrainType, SoilType } from '../entities/terrain';
import WorldImpl from '../entities/world-impl';
import type { Chunk } from '@/core/types/game';
import { GAME_BALANCE } from '@/config/game-balance';

// Define WorldGenerationConfig using the correct types
interface WorldGenerationConfig {
    width: number;
    height: number;
    minRegionSize: number;
    maxRegionSize: number;
    terrainDistribution: Record<TerrainType, number>;
    baseAttributes: Partial<GridCellAttributes>;
}

export class WorldGenerator {
    constructor(
        private readonly config: WorldGenerationConfig,
        // Type terrainFactory properly if possible, otherwise keep 'any'
        private readonly terrainFactory: any // Will be properly typed later
    ) { }

    /**
     * Generates the full world grid and returns a concrete WorldImpl instance
     * containing a `Chunk[][]` grid.
     */
    async generateWorld(): Promise<WorldImpl> {
        // Build a concrete world grid (Chunk[][]) and return a WorldImpl instance.
        const width = this.config.width;
        const height = this.config.height;
        const grid: (Chunk | null)[][] = [];

        for (let r = 0; r < height; r++) {
            const row: (Chunk | null)[] = [];
            for (let c = 0; c < width; c++) {
                const pos = new GridPosition(c, r);
                const terrainEntity = await this.selectTerrainForRegion(pos);
                const attrs = terrainEntity.attributes as any;
                const chunk: Chunk = {
                    x: pos.x,
                    y: pos.y,
                    terrain: terrainEntity.type as any,
                    description: '',
                    NPCs: [],
                    items: [],
                    structures: [],
                    explored: false,
                    lastVisited: 0,
                    enemy: null,
                    actions: [],
                    regionId: 0,
                    travelCost: attrs.travelCost ?? GAME_BALANCE.WORLD_GEN.DEFAULT_TRAVEL_COST,
                    vegetationDensity: attrs.vegetationDensity ?? 0,
                    moisture: attrs.moisture ?? 0,
                    elevation: attrs.elevation ?? 0,
                    lightLevel: attrs.lightLevel ?? 0,
                    dangerLevel: attrs.dangerLevel ?? 0,
                    magicAffinity: attrs.magicAffinity ?? 0,
                    humanPresence: attrs.humanPresence ?? 0,
                    explorability: attrs.explorability ?? 0,
                    soilType: (attrs.soilType as any) ?? 'loamy',
                    predatorPresence: attrs.predatorPresence ?? 0,
                    windLevel: attrs.windLevel ?? 0,
                    temperature: attrs.temperature ?? 0,
                };
                row.push(chunk);
            }
            grid.push(row);
        }

        // Regions generation can still run if needed, but WorldImpl currently accepts regions externally
        const world = new WorldImpl(grid, {});
        return world;
    }

    private async generateRegions(): Promise<any[]> {
        // kept for compatibility but not currently used by generateWorld
        const regions: any[] = [];
        const gridPositions = this.generateGridPositions();
        while (gridPositions.length > 0) {
            const centerPos = this.selectRandomPosition(gridPositions);
            const terrainEntity = await this.selectTerrainForRegion(centerPos);
            const regionAttributes: RegionAttributes = {
                ...terrainEntity.attributes,
                regionType: terrainEntity.type,
                difficultyLevel: GAME_BALANCE.WORLD_GEN.DEFAULT_DIFFICULTY,
                fertility: GAME_BALANCE.WORLD_GEN.DEFAULT_FERTILITY,
                biodiversity: GAME_BALANCE.WORLD_GEN.DEFAULT_BIODIVERSITY,
                soilType: typeof terrainEntity.attributes.soilType === 'string' ? terrainEntity.attributes.soilType : String(terrainEntity.attributes.soilType)
            };
            regions.push(regionAttributes);
        }
        return regions;
    }

    private generateGridPositions(): GridPosition[] {
        const positions: GridPosition[] = [];
        for (let x = 0; x < this.config.width; x++) {
            for (let y = 0; y < this.config.height; y++) {
                positions.push(new GridPosition(x, y));
            }
        }
        return positions;
    }

    private selectRandomPosition(positions: GridPosition[]): GridPosition {
        const index = Math.floor(Math.random() * positions.length);
        const [pos] = positions.splice(index, 1);
        return pos;
    }

    // Use Terrain type for terrain creation and distribution
    private async selectTerrainForRegion(_position: GridPosition): Promise<Terrain> {
        // Use weighted random selection based on terrainDistribution
        const random = Math.random();
        let cumulativeWeight = 0;
        for (const [type, weight] of Object.entries(this.config.terrainDistribution)) {
            cumulativeWeight += weight;
            if (random <= cumulativeWeight) {
                return this.terrainFactory.createTerrain(type as TerrainType);
            }
        }
        return this.terrainFactory.createTerrain('plains' as TerrainType);
    }

    private generateRegionCells(
        center: GridPosition,
        size: number,
        regionId: number,
        terrain: Terrain,
        availablePositions: GridPosition[]
    ): GridCell[] {
        const cells: GridCell[] = [];
        const positions = this.selectPositionsForRegion(center, size, availablePositions);
        for (const pos of positions) {
            const attributes = this.generateCellAttributes(pos, terrain);
            const cell = new GridCell(pos, terrain, attributes, false, 0, regionId);
            cells.push(cell);
        }
        return cells;
    }

    private selectPositionsForRegion(
        center: GridPosition,
        size: number,
        availablePositions: GridPosition[]
    ): GridPosition[] {
        const selected: GridPosition[] = [];
        const remaining = [...availablePositions];

        // Use a simple distance-based selection algorithm
        while (selected.length < size && remaining.length > 0) {
            const bestPosIndex = remaining.findIndex(pos => {
                const dx = pos.x - center.x;
                const dy = pos.y - center.y;
                return Math.sqrt(dx * dx + dy * dy) <= Math.sqrt(size);
            });

            if (bestPosIndex === -1) break;

            const [selectedPos] = remaining.splice(bestPosIndex, 1);
            selected.push(selectedPos);
        }

        // Remove selected positions from available positions
        selected.forEach(pos => {
            const index = availablePositions.findIndex(p => p.equals(pos));
            if (index !== -1) availablePositions.splice(index, 1);
        });

        return selected;
    }

    private generateCellAttributes(position: GridPosition, terrain: Terrain): GridCellAttributes {
        const base = terrain.attributes;
        const random = () => (1 - GAME_BALANCE.WORLD_GEN.BASE_VARIANCE) + Math.random() * (GAME_BALANCE.WORLD_GEN.BASE_VARIANCE * 2);
        return {
            vegetationDensity: Math.floor(base.vegetationDensity * random()),
            elevation: Math.floor(base.elevation * random()),
            dangerLevel: Math.floor(base.dangerLevel * random()),
            magicAffinity: Math.floor(base.magicAffinity * random()),
            humanPresence: Math.floor((this.config.baseAttributes.humanPresence || 0) * random()),
            predatorPresence: Math.floor(base.predatorPresence * random()),
            temperature: Math.floor(base.temperature * random()),
            moisture: Math.floor(base.moisture * random()),
            windLevel: Math.floor(base.windLevel * random()),
            lightLevel: Math.floor(base.lightLevel * random()),
            explorability: Math.floor(base.explorability * random()),
            soilType: this.selectSoilType(terrain),
            travelCost: Math.floor(base.travelCost * random())
        };
    }

    private selectSoilType(terrain: Terrain): SoilType {
        // If preferredSoilTypes exists, pick randomly; otherwise, default to 'loamy'
        const attrs: any = terrain.attributes;
        if (attrs.preferredSoilTypes && attrs.preferredSoilTypes.length > 0) {
            const index = Math.floor(Math.random() * attrs.preferredSoilTypes.length);
            return attrs.preferredSoilTypes[index] as SoilType;
        }
        return 'loamy';
    }

    // Helper to calculate average attribute from cells
    private calculateAverageAttribute(cells: GridCell[], attributeName: keyof GridCellAttributes): number {
        if (cells.length === 0) return 0;
        const total = cells.reduce((sum, cell) => sum + (typeof cell.attributes[attributeName] === 'number' ? (cell.attributes[attributeName] as number) : 0), 0);
        return Math.floor(total / cells.length);
    }

    private randomBetween(min: number, max: number): number {
        return Math.floor(min + Math.random() * (max - min + 1));
    }
}
