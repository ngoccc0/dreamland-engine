import { Position } from '../types/common';
import { Terrain } from './terrain';
import { TerrainAttributes } from '../types/world-attributes';
import { Entity, IEntityContainer } from './entity';

export class Chunk implements IEntityContainer {
    private _attributes: TerrainAttributes;
    private _explored: boolean = false;
    private _lastVisited: number = 0;
    private _lastUpdated: number = Date.now();
    private readonly _entities: Entity[] = [];

    constructor(
        private readonly _position: Position,
        private readonly _terrain: Terrain,
        attributes: TerrainAttributes,
        private _regionId: number
    ) {
        this._attributes = attributes;
    }

    // Basic properties
    get position(): Position { 
        return this._position;
    }

    get terrain(): Terrain {
        return this._terrain;
    }

    get attributes(): TerrainAttributes {
        return this._attributes;
    }

    get explored(): boolean {
        return this._explored;
    }

    get lastVisited(): number {
        return this._lastVisited;
    }

    get lastUpdated(): number {
        return this._lastUpdated;
    }

    get regionId(): number {
        return this._regionId;
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

    // Game mechanics
    visit(time: number): void {
        this._explored = true;
        this._lastVisited = time;
        this.update();
    }

    update(): void {
        const now = Date.now();
        const hoursSinceLastUpdate = (now - this._lastUpdated) / (1000 * 60 * 60);
        
        if (hoursSinceLastUpdate > 1) {
            this._attributes = this.calculateNewAttributes(hoursSinceLastUpdate);
            this._lastUpdated = now;
        }
    }

    reassignRegion(newRegionId: number): void {
        this._regionId = newRegionId;
    }

    private calculateNewAttributes(hoursPassed: number): TerrainAttributes {
        // Basic attribute evolution over time
        const attrs = { ...this._attributes };

        // Example: Vegetation grows slightly over time in suitable conditions
        if (attrs.moisture >= 30 && attrs.temperature >= 10 && attrs.temperature <= 35) {
            attrs.vegetationDensity = Math.min(100, 
                attrs.vegetationDensity + (0.1 * hoursPassed)
            );
        }

        return attrs;
    }
}
