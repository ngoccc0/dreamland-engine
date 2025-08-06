
// Minimal World interface for usecase compatibility (should be replaced with real implementation)
interface World {
    getChunk(position: any): GridCell | undefined;
    getChunksInArea(position: any, viewRadius: number): GridCell[];
    getChunksByTerrain(terrainType: any): GridCell[];
    update(): void;
    getExploredPercentage(): number;
    getRegion(regionId: number): any;
}
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/world';
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
        // TODO: Replace with real World implementation
        this.world = await this.worldGenerator.generateWorld() as unknown as World;
        await this.worldRepository.save(this.world);
        return this.world;
    }

    async exploreChunk(position: GridPosition): Promise<GridCell> {
        const chunk = this.world.getChunk(position);
        if (!chunk) {
            throw new Error(`No chunk found at position ${position.toString()}`);
        }

        chunk.markExplored();
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
