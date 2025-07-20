import { GridPosition } from '../values/grid-position';
import { TerrainType } from '../entities/terrain';
import { EntityAttributes } from '../types/world-attributes';

export interface Entity {
    id: string;
    type: string;
    position: GridPosition;
    attributes: EntityAttributes;
}

export class EntityFactory {
    private entityCounter = 0;

    createEntitiesForTerrain(terrainType: TerrainType, position: GridPosition): Entity[] {
        const entities: Entity[] = [];
        
        switch(terrainType) {
            case TerrainType.FOREST:
                if (Math.random() > 0.3) {
                    entities.push(this.createTree(position));
                }
                if (Math.random() > 0.7) {
                    entities.push(this.createAnimal('DEER', position));
                }
                break;

            case TerrainType.PLAINS:
                if (Math.random() > 0.5) {
                    entities.push(this.createTree(position));
                }
                if (Math.random() > 0.8) {
                    entities.push(this.createAnimal('RABBIT', position));
                }
                break;

            case TerrainType.MOUNTAIN:
                if (Math.random() > 0.6) {
                    entities.push(this.createTree(position));
                }
                if (Math.random() > 0.9) {
                    entities.push(this.createAnimal('GOAT', position));
                }
                break;
        }

        return entities;
    }

    private createTree(position: GridPosition): Entity {
        return {
            id: `tree_${this.entityCounter++}`,
            type: 'TREE',
            position,
            attributes: {
                health: 100,
                maxHealth: 100,
                strength: 0,
                agility: 0,
                intelligence: 0,
                resistance: 50,
                size: Math.random() * 2 + 1
            }
        };
    }

    private createAnimal(type: string, position: GridPosition): Entity {
        const baseStats = {
            health: 100,
            maxHealth: 100,
            strength: Math.floor(Math.random() * 20) + 10,
            agility: Math.floor(Math.random() * 20) + 10,
            intelligence: Math.floor(Math.random() * 10) + 5,
            resistance: Math.floor(Math.random() * 15) + 5,
            speed: Math.random() * 2 + 0.5,
            size: type === 'DEER' ? 2 : 1
        };

        return {
            id: `animal_${type.toLowerCase()}_${this.entityCounter++}`,
            type,
            position,
            attributes: baseStats
        };
    }
}
