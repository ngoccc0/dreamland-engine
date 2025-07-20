import { GridPosition } from '../values/grid-position';

export interface Entity {
    id: string;
    type: string;
    position: GridPosition;
    attributes: Record<string, any>;
}

export interface IEntityContainer {
    entities: Entity[];
    addEntity(entity: Entity): void;
    removeEntity(entityId: string): void;
    getEntities(): Entity[];
}
