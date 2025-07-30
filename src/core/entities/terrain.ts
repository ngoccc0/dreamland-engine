import { TranslatableString } from '../types/i18n';
import { GridPosition } from '../values/grid-position';
import { TerrainType, SoilType } from '../../lib/definitions/terrain-definitions';

export type { TerrainType, SoilType };
import { Entity, IEntityContainer } from './entity';
import { TerrainAttributes } from '../types/attributes';

export class Terrain implements IEntityContainer {
    private _entities: Entity[] = [];


    constructor(
        private readonly _type: TerrainType,
        private readonly _attributes: TerrainAttributes,
        private readonly _name: TranslatableString,
        private readonly _description: TranslatableString
    ) {}

    get type(): TerrainType { return this._type; }
    get attributes(): Readonly<TerrainAttributes> { return this._attributes; }
    get entities(): Entity[] { return [...this._entities]; }

    addEntity(entity: Entity): void {
        this._entities.push(entity);
    }

    removeEntity(entityId: string): void {
        this._entities = this._entities.filter(e => e.id !== entityId);
    }

    getEntities(): Entity[] {
        return this.entities;
    }
    get name(): TranslatableString { return this._name; }
    get description(): TranslatableString { return this._description; }

    // Calculate final attributes based on position, time, weather, etc.
    calculateAttributes(position: GridPosition, time: number, weather: any): TerrainAttributes {
        // This will be implemented to modify base attributes based on context
        return {
            ...this._attributes
        };
    }
}
