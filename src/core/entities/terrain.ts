export type { TerrainType, SoilType };
/**
 * Represents a terrain entity within the world system.
 * This class has been merged and refactored for clarity, modding support, and adherence to clean architecture principles.
 * It manages terrain-specific attributes and contains entities present on it.
 * @module src/core/entities/terrain
 */

import { TranslatableString } from '../types/i18n';
import { GridPosition } from '../values/grid-position';
import type { TerrainType, SoilType } from '../../lib/game/definitions/terrain-definitions';
import { Entity, IEntityContainer } from './entity';
import { TerrainAttributes } from '../types/attributes';

/**
 * Represents a terrain type in the world, with its base attributes and support for containing entities.
 * This class is designed to be extensible for modding.
 */
export class Terrain implements IEntityContainer {
    private _entities: Entity[] = [];

    /**
     * Creates an instance of Terrain.
     * @param _type - The specific type of terrain (e.g., 'forest', 'desert').
     * @param _attributes - The base {@link TerrainAttributes} for this terrain.
     * @param _name - The {@link TranslatableString} name of the terrain, displayed to the player.
     * @param _description - The {@link TranslatableString} description of the terrain, providing lore and details.
     */
    constructor(
        private readonly _type: TerrainType,
        private readonly _attributes: TerrainAttributes,
        private readonly _name: TranslatableString,
        private readonly _description: TranslatableString
    ) {}

    /** Gets the specific type of terrain (e.g., 'forest', 'desert'). */
    get type(): TerrainType { return this._type; }
    /** Gets the base {@link TerrainAttributes} for this terrain. */
    get attributes(): Readonly<TerrainAttributes> { return this._attributes; }
    /** Gets an array of {@link Entity} objects currently present in this terrain. */
    get entities(): Entity[] { return [...this._entities]; }
    /** Gets the {@link TranslatableString} name of the terrain. */
    get name(): TranslatableString { return this._name; }
    /** Gets the {@link TranslatableString} description of the terrain. */
    get description(): TranslatableString { return this._description; }

    /**
     * Adds an entity to this terrain.
     * @param entity - The {@link Entity} to add.
     */
    addEntity(entity: Entity): void {
        this._entities.push(entity);
    }

    /**
     * Removes an entity from this terrain by its ID.
     * @param entityId - The unique ID of the entity to remove.
     */
    removeEntity(entityId: string): void {
        this._entities = this._entities.filter(e => e.id !== entityId);
    }

    /**
     * Retrieves all entities currently in this terrain.
     * @returns An array of {@link Entity} objects.
     */
    getEntities(): Entity[] {
        return this.entities;
    }

    /**
     * Calculates the final, dynamic attributes of the terrain based on various contextual factors.
     * This method allows for environmental effects (e.g., weather, time of day) to modify base terrain attributes.
     * @param _position - The {@link GridPosition} of the terrain cell.
     * @param _time - The current in-game time.
     * @param _weather - The current weather context.
     * @returns The calculated {@link TerrainAttributes} for this terrain at the given context.
     * @todo Implement actual attribute modification logic based on context.
     */
    calculateAttributes(_position: GridPosition, _time: number, _weather: any): TerrainAttributes {
        // This will be implemented to modify base attributes based on context
        // Parameters prefixed with _ are intentionally unused for now
        return {
           ...this._attributes
        };
    }
}
