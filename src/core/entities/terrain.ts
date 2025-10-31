export type { TerrainType, SoilType };
/**
 * Terrain entity for the world system.
 * Merged and refactored for clarity, modding, and clean architecture.
 * @module src/core/entities/terrain
 */

import { TranslatableString } from '../types/i18n';
import { GridPosition } from '../values/grid-position';
import type { TerrainType, SoilType } from '../../lib/game/definitions/terrain-definitions';
import { Entity, IEntityContainer } from './entity';
import { TerrainAttributes } from '../types/attributes';

/**
 * Represents a terrain type in the world, with attributes and modding support.
 */
export class Terrain implements IEntityContainer {
    private _entities: Entity[] = [];

    /**
     * @param _type The terrain type (e.g., 'forest', 'desert')
     * @param _attributes The base attributes for this terrain
     * @param _name The translatable name of the terrain
     * @param _description The translatable description of the terrain
     */
    constructor(
        private readonly _type: TerrainType,
        private readonly _attributes: TerrainAttributes,
        private readonly _name: TranslatableString,
        private readonly _description: TranslatableString
    ) {}

    /** Terrain type (e.g., 'forest', 'desert') */
    get type(): TerrainType { return this._type; }
    /** Base attributes for this terrain */
    get attributes(): Readonly<TerrainAttributes> { return this._attributes; }
    /** Entities present in this terrain */
    get entities(): Entity[] { return [...this._entities]; }
    /** Translatable name */
    get name(): TranslatableString { return this._name; }
    /** Translatable description */
    get description(): TranslatableString { return this._description; }

    /** Add an entity to this terrain */
    addEntity(entity: Entity): void {
        this._entities.push(entity);
    }

    /** Remove an entity by ID */
    removeEntity(entityId: string): void {
        this._entities = this._entities.filter(e => e.id !== entityId);
    }

    /** Get all entities in this terrain */
    getEntities(): Entity[] {
        return this.entities;
    }

    /**
     * Calculate final attributes based on position, time, weather, etc.
     * @param position The grid position
     * @param time The current time
     * @param weather The weather context
     * @returns The calculated terrain attributes
     */
    calculateAttributes(_position: GridPosition, _time: number, _weather: any): TerrainAttributes {
        // This will be implemented to modify base attributes based on context
        // Parameters prefixed with _ are intentionally unused for now
        return {
           ...this._attributes
        };
    }
}
