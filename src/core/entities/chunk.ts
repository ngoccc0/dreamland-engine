import { Position } from '../types/common';
import { Terrain } from '../types/terrain';
import { TerrainAttributes } from '../types/attributes';
import { Entity, IEntityContainer } from './entity';

export class Chunk implements IEntityContainer {
    public readonly position: Position;
    public readonly terrain: Terrain;
    private _attributes: TerrainAttributes;

    get attributes(): TerrainAttributes {
        return this._attributes;
    }
    private _explored: boolean;
    private _lastVisited: number;
    private _regionId: number;
    private _entities: Entity[] = [];
    private _lastUpdated: number;

    constructor(
        position: Position,
        terrain: Terrain,
        attributes: TerrainAttributes,
        regionId: number
    ) {
        this.position = position;
        this.terrain = terrain;
        this._attributes = attributes;
        this._regionId = regionId;
        this._explored = false;
        this._lastVisited = 0;
        this._lastUpdated = Date.now();
    }

    get explored(): boolean {
        return this._explored;
    }

    get lastVisited(): number {
        return this._lastVisited;
    }

    get regionId(): number {
        return this._regionId;
    }

    get lastUpdated(): number {
        return this._lastUpdated;
    }

    // IEntityContainer implementation
    get entities(): Entity[] {
        return this._entities;
    }

    addEntity(entity: Entity): void {
        this._entities.push(entity);
    }

    removeEntity(entityId: string): void {
        this._entities = this._entities.filter(e => e.id !== entityId);
    }

    getEntities(): Entity[] {
        return this._entities;
    }

    visit(time: number): void {
        this._explored = true;
        this._lastVisited = time;
        this.update();
    }

    update(): void {
        const now = Date.now();
        const hoursSinceLastUpdate = (now - this._lastUpdated) / (1000 * 60 * 60);
        
        // Update attributes based on time passed and current conditions
        if (hoursSinceLastUpdate > 1) {
            this._attributes = this.calculateNewAttributes(hoursSinceLastUpdate);
            this._lastUpdated = now;
        }
    }

    private calculateNewAttributes(hoursPassed: number): TerrainAttributes {
        // This will implement the actual attribute evolution over time
        // For now, return current attributes
        return { ...this.attributes };
    }

    reassignRegion(newRegionId: number): void {
        this._regionId = newRegionId;
    }
}
