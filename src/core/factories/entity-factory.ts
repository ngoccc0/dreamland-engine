import { GridPosition } from '../values/grid-position';
import { TerrainType } from '../entities/terrain';
import { EntityAttributes } from '../types/attributes';

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
                    entities.push(this.createRock(position));
                }
                if (Math.random() > 0.9) {
                    entities.push(this.createAnimal('GOAT', position));
                }
                break;

            case TerrainType.DESERT:
                if (Math.random() > 0.8) {
                    entities.push(this.createCactus(position));
                }
                if (Math.random() > 0.9) {
                    entities.push(this.createAnimal('SNAKE', position));
                }
                break;
        }

        return entities;
    }

    private createTree(position: GridPosition): Entity {
        const attributes: EntityAttributes = {
            health: 100,
            strength: Math.floor(Math.random() * 20) + 80,
            defense: Math.floor(Math.random() * 10) + 90,
            speed: 0,
            intelligence: 0,
            size: Math.floor(Math.random() * 3) + 1,
            age: Math.floor(Math.random() * 100),
            reproductionRate: Math.floor(Math.random() * 20) + 10,
            adaptability: Math.floor(Math.random() * 30) + 20,
            resourceYield: Math.floor(Math.random() * 50) + 50
        };

        return {
            id: `tree_${this.entityCounter++}`,
            type: 'TREE',
            position,
            attributes
        };
    }

    private createCactus(position: GridPosition): Entity {
        const attributes: EntityAttributes = {
            health: 80,
            strength: Math.floor(Math.random() * 30) + 70,
            defense: Math.floor(Math.random() * 20) + 80,
            speed: 0,
            intelligence: 0,
            size: Math.floor(Math.random() * 2) + 1,
            age: Math.floor(Math.random() * 50),
            reproductionRate: Math.floor(Math.random() * 10) + 5,
            adaptability: Math.floor(Math.random() * 50) + 50,
            resourceYield: Math.floor(Math.random() * 30) + 20
        };

        return {
            id: `cactus_${this.entityCounter++}`,
            type: 'CACTUS',
            position,
            attributes
        };
    }

    private createRock(position: GridPosition): Entity {
        const attributes: EntityAttributes = {
            health: 200,
            strength: Math.floor(Math.random() * 50) + 150,
            defense: Math.floor(Math.random() * 30) + 170,
            speed: 0,
            intelligence: 0,
            size: Math.floor(Math.random() * 3) + 2,
            age: Math.floor(Math.random() * 1000),
            reproductionRate: 0,
            adaptability: 0,
            resourceYield: Math.floor(Math.random() * 100) + 50
        };

        return {
            id: `rock_${this.entityCounter++}`,
            type: 'ROCK',
            position,
            attributes
        };
    }

    private createAnimal(animalType: string, position: GridPosition): Entity {
        const attributes: EntityAttributes = {
            health: 100,
            strength: Math.floor(Math.random() * 30) + 20,
            defense: Math.floor(Math.random() * 20) + 10,
            speed: Math.floor(Math.random() * 50) + 50,
            intelligence: Math.floor(Math.random() * 40) + 20,
            size: Math.floor(Math.random() * 3) + 1,
            age: Math.floor(Math.random() * 5),
            reproductionRate: Math.floor(Math.random() * 30) + 20,
            adaptability: Math.floor(Math.random() * 40) + 30,
            resourceYield: Math.floor(Math.random() * 30) + 20
        };

        return {
            id: `${animalType.toLowerCase()}_${this.entityCounter++}`,
            type: animalType,
            position,
            attributes
        };
    }
}
