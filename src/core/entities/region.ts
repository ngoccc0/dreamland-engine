import { Position } from '../types/common';
import { Terrain } from './terrain';
import { RegionAttributes, TerrainAttributes } from '../types/world-attributes';
import { Entity, IEntityContainer } from './entity';

export interface RegionChunkData {
    position: Position;
    terrain: Terrain;
    attributes: TerrainAttributes;
}

export class Region implements IEntityContainer {
    private readonly _terrain: Terrain;
    private readonly _chunks: Map<string, RegionChunkData>;
    private readonly _entities: Entity[] = [];
    private _attributes: RegionAttributes;

    constructor(terrain: Terrain, attributes: RegionAttributes) {
        this._terrain = terrain;
        this._chunks = new Map();
        this._attributes = attributes;
    }

    get terrain(): Terrain {
        return this._terrain;
    }

    get attributes(): RegionAttributes {
        return this._attributes;
    }

    get chunks(): RegionChunkData[] {
        return Array.from(this._chunks.values());
    }

    // IEntityContainer implementation
    get entities(): Entity[] {
        return this._entities;
    }

    addEntity(entity: Entity): void {
        this._entities.push(entity);
    }

    removeEntity(entityId: string): void {
        const index = this._entities.findIndex(e => e.id === entityId);
        if (index !== -1) {
            this._entities.splice(index, 1);
        }
    }

    getEntities(): Entity[] {
        return this._entities;
    }

    // Chunk management
    addChunk(chunk: RegionChunkData): void {
        const key = `${chunk.position.x},${chunk.position.y}`;
        this._chunks.set(key, chunk);
    }

    removeChunk(position: Position): void {
        const key = `${position.x},${position.y}`;
        this._chunks.delete(key);
    }

    hasChunk(position: Position): boolean {
        const key = `${position.x},${position.y}`;
        return this._chunks.has(key);
    }

    getChunk(position: Position): RegionChunkData | undefined {
        const key = `${position.x},${position.y}`;
        return this._chunks.get(key);
    }
}
