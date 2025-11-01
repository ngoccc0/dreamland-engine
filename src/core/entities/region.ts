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
