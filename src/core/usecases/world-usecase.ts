import { World } from '../entities/world';
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/grid-cell';
import { TerrainType } from '../entities/terrain';
import { WorldGenerator } from '../generators/world-generator';

export interface IWorldUseCase {
    generateWorld(config: WorldGenerationConfig): Promise<World>;
    exploreChunk(position: GridPosition): Promise<GridCell>;
    getVisibleChunks(position: GridPosition, viewRadius: number): Promise<GridCell[]>;
    updateWorld(): Promise<void>;
}

interface WorldGenerationConfig {
    width: number;
    height: number;
    minRegionSize: number;
    maxRegionSize: number;
    terrainDistribution: Record<TerrainType, number>;
}

export class WorldUseCase implements IWorldUseCase {
    constructor(
        private world: World,
        private readonly worldGenerator: WorldGenerator,
        private readonly worldRepository: any // Will be defined in infrastructure
    ) {}

    async generateWorld(config: WorldGenerationConfig): Promise<World> {
        this.world = await this.worldGenerator.generateWorld();
        await this.worldRepository.save(this.world);
        return this.world;
    }

    async exploreChunk(position: GridPosition): Promise<GridCell> {
        const chunk = this.world.getChunk(position);
        if (!chunk) {
            throw new Error(`No chunk found at position ${position.toString()}`);
        }

        chunk.visit();
        await this.worldRepository.save(this.world);
        return chunk;
    }

    async getVisibleChunks(position: GridPosition, viewRadius: number): Promise<GridCell[]> {
        return this.world.getChunksInArea(position, viewRadius);
    }

    async updateWorld(): Promise<void> {
        this.world.update();
        await this.worldRepository.save(this.world);
    }

    async getExploredPercentage(): Promise<number> {
        return this.world.getExploredPercentage();
    }

    async getChunksByTerrain(terrainType: TerrainType): Promise<GridCell[]> {
        return this.world.getChunksByTerrain(terrainType);
    }

    async getRegionInfo(position: GridPosition): Promise<{
        regionId: number;
        exploredPercentage: number;
        dominantTerrain: TerrainType;
    }> {
        const chunk = this.world.getChunk(position);
        if (!chunk) {
            throw new Error(`No chunk found at position ${position.toString()}`);
        }

        const region = this.world.getRegion(chunk.regionId);
        if (!region) {
            throw new Error(`No region found with id ${chunk.regionId}`);
        }

        return {
            regionId: region.id,
            exploredPercentage: region.exploredPercentage,
            dominantTerrain: region.dominantTerrain.type
        };
    }
}
