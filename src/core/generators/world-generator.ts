import { GridPosition } from '../values/grid-position';
import { RegionAttributes } from '../types/world-attributes';
import { GridCell, GridCellAttributes } from '../entities/world';
import { Terrain, TerrainType, SoilType } from '../entities/terrain';

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
    ) {}

    /**
     * Generates the world as a collection of regions, each with its own grid of cells.
     * @returns An array of Region objects.
     */
    async generateWorld(): Promise<any[]> {
        // TODO: Replace 'any' with a proper Region class or interface if/when available
        const regions = await this.generateRegions();
        return regions;
    }

    private async generateRegions(): Promise<any[]> {
        const regions: any[] = [];
        const gridPositions = this.generateGridPositions();
        let currentRegionId = 0;

        while (gridPositions.length > 0) {
            const centerPos = this.selectRandomPosition(gridPositions);
            // terrainEntity is of type Terrain (entity)
            const terrainEntity = await this.selectTerrainForRegion(centerPos);

            const regionSize = this.randomBetween(
                this.config.minRegionSize,
                this.config.maxRegionSize
            );

            const regionCells = this.generateRegionCells( // returns GridCell[]
                centerPos,
                regionSize,
                currentRegionId,
                terrainEntity, // Pass the Terrain entity
                gridPositions
            );

            // Construct RegionAttributes from terrainEntity and regionCells
            const regionAttributes: RegionAttributes = {
                ...terrainEntity.attributes,
                regionType: terrainEntity.type,
                difficultyLevel: 50, // Default or calculate as needed
                fertility: 50, // Default or calculate as needed
                biodiversity: 50, // Default or calculate as needed
                soilType: typeof terrainEntity.attributes.soilType === 'string' ? terrainEntity.attributes.soilType : String(terrainEntity.attributes.soilType)
            };
            // Construct the region without using Region class
            regions.push(regionAttributes);
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

    // Use Terrain type for terrain creation and distribution
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
        const random = () => 0.8 + Math.random() * 0.4;
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
