import { GridPosition } from '../values/grid-position';
import type { World } from '../entities/world';
import { Region } from '../entities/region';
import { GridCell, GridCellAttributes } from '../entities/grid-cell';
import { Terrain } from '../entities/terrain';
import { TerrainType, SoilType } from '../../lib/definitions/terrain-definitions';

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
        private readonly terrainFactory: any // Will be properly typed later
    ) {}

    async generateWorld(): Promise<World> {
        const world = new World();
        const regions = await this.generateRegions();

        regions.forEach(region => {
            world.addRegion(region);
            // region.chunks is the correct property
            region.chunks.forEach(chunk => world.addChunk(chunk));
        });

        return world;
    }

    private async generateRegions(): Promise<Region[]> {
        const regions: Region[] = [];
        const gridPositions = this.generateGridPositions();
        let currentRegionId = 0;

        while (gridPositions.length > 0) {
            const centerPos = this.selectRandomPosition(gridPositions);
            const terrain = await this.selectTerrainForRegion(centerPos);

            const regionSize = this.randomBetween(
                this.config.minRegionSize,
                this.config.maxRegionSize
            );

            const regionCells = this.generateRegionCells(
                centerPos,
                regionSize,
                currentRegionId,
                terrain,
                gridPositions
            );

            // Region expects (terrain, attributes), so pass terrain and regionCells as attributes
            const region = new Region(terrain, regionCells);
            regions.push(region);
            currentRegionId++;
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
        const [position] = positions.splice(index, 1);
        return position;
    }

    private async selectTerrainForRegion(position: GridPosition): Promise<Terrain> {
        // Use weighted random selection based on terrainDistribution
        const random = Math.random();
        let cumulativeWeight = 0;
        
        for (const [type, weight] of Object.entries(this.config.terrainDistribution)) {
            cumulativeWeight += weight;
            if (random <= cumulativeWeight) {
                return this.terrainFactory.createTerrain(type as TerrainType);
            }
        }

        return this.terrainFactory.createTerrain(TerrainType.PLAINS);
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
        const random = () => 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2

        return {
            vegetationDensity: Math.floor(base.vegetationDensity * random()),
            elevation: Math.floor(base.elevation * random()),
            dangerLevel: Math.floor(base.dangerLevel * random()),
            magicAffinity: Math.floor(base.magicAffinity * random()),
            humanPresence: Math.floor(this.config.baseAttributes.humanPresence || 0 * random()),
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
        if (terrain.attributes.preferredSoilTypes && terrain.attributes.preferredSoilTypes.length > 0) {
            const index = Math.floor(Math.random() * terrain.attributes.preferredSoilTypes.length);
            return terrain.attributes.preferredSoilTypes[index];
        }
        return SoilType.LOAMY; // Default soil type
    }

    private randomBetween(min: number, max: number): number {
        return Math.floor(min + Math.random() * (max - min + 1));
    }
}
