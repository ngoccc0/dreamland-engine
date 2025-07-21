import { Position } from '../types/common';
import { Terrain } from '../types/terrain';
import { BaseTerrainAttributes } from '../types/terrain-attributes';
import { Entity, IEntityContainer } from './entity';

/**
 * Represents a chunk in the game world
 * A chunk is a section of the world that contains terrain, entities, and other game elements
 */
export class Chunk implements IEntityContainer {
    private readonly _position: Position;
    private readonly _terrain: Terrain;
    private _attributes: BaseTerrainAttributes;
    private _explored: boolean;
    private _lastVisited: number;
    private _regionId: number;
    private _entities: Entity[] = [];
    private _lastUpdated: number;

    constructor(
        position: Position,
        terrain: Terrain,
        attributes: BaseTerrainAttributes,
        regionId: number
    ) {
        this._position = position;
        this._terrain = terrain;
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

    private calculateNewAttributes(hoursPassed: number): BaseTerrainAttributes {
        // Basic attribute evolution over time
        const attrs = { ...this._attributes };

        // Vegetation grows slightly over time in suitable conditions
        if (attrs.moisture >= 30 && attrs.temperature >= 10 && attrs.temperature <= 35) {
            attrs.vegetationDensity = Math.min(100, 
                attrs.vegetationDensity + (0.1 * hoursPassed)
            );
        }

        return attrs;
    }

    reassignRegion(newRegionId: number): void {
        this._regionId = newRegionId;
    }
}
