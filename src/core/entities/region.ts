/**
 * OVERVIEW: Region entity (biome grouping)
 *
 * Represents a contiguous region of the world consisting of multiple chunks with same/similar terrain.
 * Regions are detected via FloodFill algorithm on world generation to create natural biomes.
 * Each region has dominant terrain, shared attributes, and entity management for regional effects.
 * Enables efficient biome queries, weather management, and creature population control.
 *
 * ## Region Basics
 *
 * ### What is a Region?
 * ```
 * Definition: Connected chunks of identical terrain type
 * Detection: FloodFill from seed chunk, stopping at terrain boundaries
 * Size: 1-1000+ chunks (variable, organic)
 * Shape: Irregular (biome-shaped instead of rectangular)
 * ```
 *
 * ### Region Examples
 *
 * ```
 * Region 1 (Grassland):
 * ┌─────────────────┐
 * │ GGG GG GGG GGG  │ ← Grassland chunks (G)
 * │ GGG GG GGG GGG  │
 * │ GGG GG GGG GGG  │ Area: ~30-50 chunks
 * └─────────────────┘
 *
 * Region 2 (Forest):
 * ┌─────────────────┐
 * │ FFF FF FFF      │ ← Forest chunks (F)
 * │ FFF FF FFF FFF  │
 * │ FFF    FFF FFF  │ Area: ~20-40 chunks
 * └─────────────────┘
 * ```
 *
 * ## RegionChunkData (Chunk Representation)
 *
 * Each region tracks its chunks:
 *
 * ```typescript
 * interface RegionChunkData {
 *   position: Position,              // {x, y} chunk coordinates
 *   terrain: Terrain,                // Terrain type
 *   attributes: TerrainAttributes,   // Environmental data
 * }
 * ```
 *
 * Usage:
 * ```typescript
 * region.chunks.get(\"2,3\") returns ChunkData
 * region.getChunks() returns ChunkData[]
 * ```
 *
 * ## Region Class (Region)
 *
 * Container for region data:
 *
 * ```typescript
 * class Region implements IEntityContainer {
 *   terrain: Terrain,                 // Dominant terrain (shared)
 *   chunks: Map<string, ChunkData>,  // Chunks in region
 *   entities: Entity[],               // Regional entities (creatures)
 *   attributes: RegionAttributes,     // Shared environment
 *   regionId: number,                 // Unique identifier
 *   discovered: boolean,              // Player knows of it?
 *   name: string,                     // \"Whispering Forest\", \"Golden Desert\"
 * }
 * ```
 *
 * ## RegionAttributes (Shared Environment)
 *
 * Properties shared across all chunks in region:
 *
 * ```typescript
 * interface RegionAttributes {
 *   dominantTerrain: TerrainType,    // FOREST, GRASSLAND, etc.
 *   difficultyLevel: 1-30,           // Recommended player level
 *   dangerLevel: 0-100,              // Creature threat scale
 *   weather: WeatherType,            // Current weather (all chunks)
 *   temperature: -30 to +50,         // Regional average
 *   population: number,              // Creature count
 *   resourceDensity: 0-100,          // Item/material availability
 *   magicAffinity: 0-100,            // Magical saturation
 *   humidityAverage: 0-100,          // Water in air
 * }
 * ```
 *
 * ## Region Generation (FloodFill Algorithm)
 *
 * Process for grouping chunks into regions:
 *
 * ```
 * 1. Start with unvisited chunk at (0, 0)
 * 2. Get chunk terrain: FOREST
 * 3. Add chunk to region, mark visited
 * 4. Check 8 neighbors:
 *    - North (0, -1): FOREST ✓ → Add to queue
 *    - Northeast (1, -1): FOREST ✓ → Add to queue
 *    - East (1, 0): GRASSLAND ✗ → Skip (boundary)
 *    - Southeast (1, 1): GRASSLAND ✗ → Skip
 *    - South (0, 1): FOREST ✓ → Add to queue
 *    - Southwest (-1, 1): FOREST ✓ → Add to queue
 *    - West (-1, 0): FOREST ✓ → Add to queue
 *    - Northwest (-1, -1): FOREST ✓ → Add to queue
 * 5. Process queue, repeat until all neighbors are different terrain
 * 6. Region complete, repeat from unvisited chunk
 * ```
 *
 * Result: Natural-looking biomes without grid artifacts
 *
 * ## Region Size Distribution
 *
 * | Size | Example | Difficulty | Traversal Time |
 * |------|---------|-----------|---------------|
 * | Tiny | 1-5 chunks | Specialty area | <1 min |
 * | Small | 5-20 chunks | Starting region | 5-10 min |
 * | Medium | 20-50 chunks | Main biome | 30-60 min |
 * | Large | 50-100 chunks | Major zone | 2-4 hours |
 * | Massive | 100+ chunks | Continent-scale | 8+ hours |
 *
 * ## Region Entity Management
 *
 * Implements IEntityContainer for creature pools:
 *
 * ```typescript
 * region.getEntities()           // All creatures in region
 * region.addEntity(creature)     // Add creature (spawn)
 * region.removeEntity(id)        // Remove creature (death)
 * ```
 *
 * Regional Creature Pool:
 * ```typescript
 * // Forest region
 * creaturePool = [
 *   {type: 'wolf', weight: 0.3},
 *   {type: 'deer', weight: 0.2},
 *   {type: 'bear', weight: 0.15},
 *   {type: 'goblin', weight: 0.25},
 *   {type: 'troll', weight: 0.1},
 * ]
 *
 * // Desert region
 * creaturePool = [
 *   {type: 'scorpion', weight: 0.3},
 *   {type: 'lizard', weight: 0.2},
 *   {type: 'bandit', weight: 0.2},
 *   {type: 'wyvern', weight: 0.15},
 *   {type: 'golem', weight: 0.15},
 * ]
 * ```
 *
 * ## Regional Weather
 *
 * Weather can be per-region (optional optimization):
 *
 * ```typescript
 * // Mountain region: snow
 * // Valley region: clear
 * // Coast region: rain
 *
 * region.weather = WeatherType.SNOW
 * region.temperature = -15°C
 * // Applies to all chunks in region
 * ```
 *
 * ## Region Discovery & Naming
 *
 * Players discover regions through exploration:
 *
 * ```typescript
 * discovered: boolean  // Unknown → Known (revelation on entry)
 * name: string        // \"Unknown Land\" → revealed name
 *
 * On first entry:
 * region.discovered = true
 * player.learnRegionName(\"Whispering Forest\")
 * ```
 *
 * ### Region Naming Convention
 * ```
 * Format: [adjective] [terrain]
 *
 * Forest: \"Dark Forest\", \"Ancient Woods\", \"Whispering Forest\"
 * Desert: \"Golden Sands\", \"Scorched Wastes\", \"Silent Desert\"
 * Mountain: \"Misty Peaks\", \"Frozen Summit\", \"Stone Giant's Spine\"
 * ```
 *
 * ## Region Progression
 *
 * Biomes arranged by difficulty:
 *
 * ```
 * Level 1-5: Starter Grassland (Difficulty 1)
 * Level 5-10: Forest Border (Difficulty 2-3)
 * Level 10-15: Deep Forest (Difficulty 4-5)
 * Level 15-20: Desert Region (Difficulty 5-6)
 * Level 20-30: Mountain Range (Difficulty 6-8)
 * Level 30+: Forbidden Zones (Difficulty 8-10)
 * ```
 *
 * ## Region Queries
 *
 * ### Find All Creatures
 * ```typescript
 * creatures = region.getEntities()
 *   .filter(e => e.type === 'creature')
 * ```
 *
 * ### Count by Type
 * ```typescript
 * wolfCount = region.getEntities()
 *   .filter(e => e.attributes.speciesId === 'wolf')
 *   .length
 * ```
 *
 * ### Regional Difficulty
 * ```typescript
 * if (player.level < region.difficultyLevel):
 *   damage *= 1.5  (underleveled penalty)
 * elif (player.level > region.difficultyLevel + 5):
 *   xp_reward *= 0.5  (overleveled penalty)
 * ```
 *
 * ## Performance Characteristics
 *
 * | Operation | Complexity | Time |
 * |-----------|-----------|------|
 * | Create region (FloodFill) | O(world_size) | 0.5-2 sec |
 * | Get all chunks | O(chunks_in_region) | <1 ms |
 * | Query creatures | O(entities) | 1-5 ms |
 * | Update attributes | O(chunks) | 1-10 ms |
 * | Spawn creature | O(1) | <1 ms |
 *
 * ## Design Philosophy
 *
 * - **Natural Biomes**: FloodFill creates organic terrain grouping
 * - **Scalability**: Supports 1-1000+ chunk regions flexibly
 * - **Shared Effects**: Regional weather/attributes reduce redundancy
 * - **Discovery**: Players progressively learn world geography
 * - **Population Control**: Regional pools prevent spawn spam
 * - **Progression**: Difficulty scaling creates natural level progression
 *
 */
import { Position } from '../types/common';
import { Terrain } from './terrain';
import { RegionAttributes, TerrainAttributes } from '../types/world-attributes';
import { Entity, IEntityContainer } from './entity';

/**
 * Represents the data for a single chunk within a region.
 * This includes its position, terrain type, and specific terrain attributes.
 */
export interface RegionChunkData {
    /** The grid position of the chunk. */
    position: Position;
    /** The terrain entity associated with this chunk. */
    terrain: Terrain;
    /** The specific terrain attributes of this chunk. */
    attributes: TerrainAttributes;
}

/**
 * Represents a contiguous region in the game world, characterized by a dominant terrain type
 * and containing multiple chunks and entities.
 * It acts as a container for managing chunks and entities within its boundaries.
 */
export class Region implements IEntityContainer {
    private readonly _terrain: Terrain;
    private readonly _chunks: Map<string, RegionChunkData>;
    private readonly _entities: Entity[] = [];
    private _attributes: RegionAttributes;

    /**
     * Creates an instance of Region.
     * @param terrain - The dominant {@link Terrain} type of this region.
     * @param attributes - The overall {@link RegionAttributes} for this region.
     */
    constructor(terrain: Terrain, attributes: RegionAttributes) {
        this._terrain = terrain;
        this._chunks = new Map();
        this._attributes = attributes;
    }

    /** Gets the dominant {@link Terrain} type of this region. */
    get terrain(): Terrain {
        return this._terrain;
    }

    /** Gets the overall {@link RegionAttributes} of this region. */
    get attributes(): RegionAttributes {
        return this._attributes;
    }

    /** Gets an array of all {@link RegionChunkData} within this region. */
    get chunks(): RegionChunkData[] {
        return Array.from(this._chunks.values());
    }

    // IEntityContainer implementation
    /** Gets an array of all {@link Entity} objects currently within this region. */
    get entities(): Entity[] {
        return this._entities;
    }

    /**
     * Adds an entity to this region.
     * @param entity - The {@link Entity} to add.
     */
    addEntity(entity: Entity): void {
        this._entities.push(entity);
    }

    /**
     * Removes an entity from this region by its ID.
     * @param entityId - The unique ID of the entity to remove.
     */
    removeEntity(entityId: string): void {
        const index = this._entities.findIndex(e => e.id === entityId);
        if (index !== -1) {
            this._entities.splice(index, 1);
        }
    }

    /**
     * Retrieves all entities currently in this region.
     * @returns An array of {@link Entity} objects.
     */
    getEntities(): Entity[] {
        return this._entities;
    }

    // Chunk management
    /**
     * Adds a chunk to this region.
     * @param chunk - The {@link RegionChunkData} to add.
     */
    addChunk(chunk: RegionChunkData): void {
        const key = `${chunk.position.x},${chunk.position.y}`;
        this._chunks.set(key, chunk);
    }

    /**
     * Removes a chunk from this region by its position.
     * @param position - The {@link Position} of the chunk to remove.
     */
    removeChunk(position: Position): void {
        const key = `${position.x},${position.y}`;
        this._chunks.delete(key);
    }

    /**
     * Checks if this region contains a chunk at the specified position.
     * @param position - The {@link Position} to check.
     * @returns `true` if the chunk exists in this region, `false` otherwise.
     */
    hasChunk(position: Position): boolean {
        const key = `${position.x},${position.y}`;
        return this._chunks.has(key);
    }

    /**
     * Retrieves a chunk from this region by its position.
     * @param position - The {@link Position} of the chunk to retrieve.
     * @returns The {@link RegionChunkData} if found, otherwise `undefined`.
     */
    getChunk(position: Position): RegionChunkData | undefined {
        const key = `${position.x},${position.y}`;
        return this._chunks.get(key);
    }
}
