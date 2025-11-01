import { GridPosition } from '../values/grid-position';

/**
 * Represents a generic entity within the game world.
 * All interactive or significant objects in the game should implement this interface.
 */
export interface Entity {
    /** Unique identifier for the entity. */
    id: string;
    /** The type of the entity (e.g., 'player', 'monster', 'item', 'structure'). */
    type: string;
    /** The grid position of the entity in the game world. */
    position: GridPosition;
    /** A flexible record of attributes associated with the entity. */
    attributes: Record<string, any>;
}

/**
 * Interface for containers that can hold multiple entities.
 * This allows for consistent management of entities within different game components (e.g., chunks, inventories).
 */
export interface IEntityContainer {
    /** An array of entities currently within this container. */
    entities: Entity[];
    /**
     * Adds an entity to the container.
     * @param entity - The {@link Entity} to add.
     */
    addEntity(entity: Entity): void;
    /**
     * Removes an entity from the container by its ID.
     * @param entityId - The unique ID of the entity to remove.
     */
    removeEntity(entityId: string): void;
    /**
     * Retrieves all entities currently in the container.
     * @returns An array of {@link Entity} objects.
     */
    getEntities(): Entity[];
}
