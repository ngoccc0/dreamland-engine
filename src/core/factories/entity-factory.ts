/**
 * EntityFactory: Centralized factory for creating game entities based on terrain and context.
 * Combines all logic from previous factories, with TSDoc for all interfaces and methods.
 * Place in src/core/factories/entity-factory.ts for Clean Architecture.
 */

import { GridPosition } from '../values/grid-position';
import { EntityAttributes } from '../types/attributes';

/**
 * Represents a game entity (tree, animal, rock, cactus, etc.)
 * @property id Unique identifier
 * @property type Entity type (e.g. 'TREE', 'DEER')
 * @property position Grid position in the world
 * @property attributes Entity stats and properties
 */
export interface Entity {
    id: string;
    type: string;
    position: GridPosition;
    attributes: EntityAttributes;
}

/**
 * Factory for creating entities based on terrain type and context.
 * Supports trees, animals, rocks, cactus, and can be extended for modding.
 */
export class EntityFactory {
    /** Internal counter for unique entity IDs */
    private entityCounter = 0;

    /**
     * Creates entities for a given terrain type and position.
     * @param terrainType Terrain type as string (e.g. 'forest', 'plains', 'mountain', 'desert')
     * @param position Grid position
     * @returns Array of created entities
     * @example
     *   factory.createEntitiesForTerrain('forest', new GridPosition(1,2));
     */
    createEntitiesForTerrain(terrainType: string, position: GridPosition): Entity[] {
        const entities: Entity[] = [];
        switch(terrainType) {
            case 'forest':
                if (Math.random() > 0.3) entities.push(this.createTree(position));
                if (Math.random() > 0.7) entities.push(this.createAnimal('DEER', position));
                break;
            case 'plains':
                if (Math.random() > 0.5) entities.push(this.createTree(position));
                if (Math.random() > 0.8) entities.push(this.createAnimal('RABBIT', position));
                break;
            case 'mountain':
                if (Math.random() > 0.6) entities.push(this.createRock(position));
                if (Math.random() > 0.9) entities.push(this.createAnimal('GOAT', position));
                break;
            case 'desert':
                if (Math.random() > 0.8) entities.push(this.createCactus(position));
                if (Math.random() > 0.9) entities.push(this.createAnimal('SNAKE', position));
                break;
        }
        return entities;
    }

    /**
     * Creates a tree entity.
     * @param position Grid position
     * @returns Tree entity
     */
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

    /**
     * Creates a cactus entity (desert only).
     * @param position Grid position
     * @returns Cactus entity
     */
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

    /**
     * Creates a rock entity (mountain only).
     * @param position Grid position
     * @returns Rock entity
     */
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

    /**
     * Creates an animal entity.
     * @param animalType Animal type (e.g. 'DEER', 'GOAT', 'SNAKE')
     * @param position Grid position
     * @returns Animal entity
     */
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
