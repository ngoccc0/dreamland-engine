import { Position } from '../types/common';
import { Entity } from './entity';
import { Region } from './region';
import { Terrain, TerrainType } from './terrain';
import { EntityAttributes } from '../types/world-attributes';
import { GridPosition } from '../values/grid-position';

export class EntityFactory {
    /**
     * Creates appropriate entities based on terrain type and region attributes
     */
    createEntitiesForTerrain(region: Region, position: Position): Entity[] {
        const gridPosition = new GridPosition(position.x, position.y);
        const terrain = region.terrain;
        const entities: Entity[] = [];

        // Base spawn chances from terrain
        const treeChance = this.getTreeSpawnChance(terrain);
        const animalChance = this.getAnimalSpawnChance(terrain);
        
        // Modify chances based on region attributes
        const attrs = region.attributes;
        const finalTreeChance = treeChance * (attrs.fertility / 100);
        const finalAnimalChance = animalChance * (attrs.biodiversity / 100);

        // Attempt to spawn trees
        if (Math.random() < finalTreeChance) {
            const tree = this.createTree(position, terrain, attrs);
            if (tree) entities.push(tree);
        }

        // Attempt to spawn animals
        if (Math.random() < finalAnimalChance) {
            const animal = this.createAnimal(position, terrain, attrs);
            if (animal) entities.push(animal);
        }

        return entities;
    }

    private getTreeSpawnChance(terrain: Terrain): number {
        switch (terrain.type) {
            case TerrainType.FOREST: return 0.8;
            case TerrainType.PLAINS: return 0.3;
            case TerrainType.DESERT: return 0.05;
            default: return 0.1;
        }
    }

    private getAnimalSpawnChance(terrain: Terrain): number {
        switch (terrain.type) {
            case TerrainType.FOREST: return 0.4;
            case TerrainType.PLAINS: return 0.6;
            case TerrainType.DESERT: return 0.2;
            default: return 0.3;
        }
    }

    private createTree(position: Position, terrain: Terrain, regionAttrs: any): Entity | null {
        const gridPosition = new GridPosition(position.x, position.y);
        const attrs: EntityAttributes = {
            health: 100,
            maxHealth: 100,
            strength: Math.floor(Math.random() * 20) + 80,
            defense: Math.floor(Math.random() * 10) + 90,
            speed: 0,
            agility: Math.floor(Math.random() * 10) + 10,
            intelligence: 0,
            size: Math.floor(Math.random() * 3) + 1,
            age: Math.floor(Math.random() * 100),
            reproductionRate: Math.floor(Math.random() * 20) + 10,
            adaptability: Math.floor(Math.random() * 30) + 20,
            resourceYield: Math.floor(Math.random() * 50) + 50,
            resistance: Math.floor(Math.random() * 20) + 30
        };

        // Modify attributes based on terrain and region attributes
        if (terrain.type === TerrainType.DESERT) {
            attrs.health -= 20;
            attrs.strength -= 10;
            attrs.size = Math.max(1, attrs.size);
        } else if (terrain.type === TerrainType.FOREST) {
            attrs.health += 20;
            attrs.strength += 10;
            attrs.size = Math.min(5, attrs.size);
        }

        // Apply region attribute effects
        attrs.health *= (regionAttrs.fertility / 100);
        attrs.reproductionRate *= (regionAttrs.moisture / 100);

        return {
            id: Math.random().toString(36).substr(2, 9),
            type: 'TREE',
            position: gridPosition,
            attributes: attrs
        };
    }

    private createAnimal(position: Position, terrain: Terrain, regionAttrs: any): Entity | null {
        const gridPosition = new GridPosition(position.x, position.y);
        const attrs: EntityAttributes = {
            health: 100,
            maxHealth: 100,
            strength: Math.floor(Math.random() * 30) + 20,
            defense: Math.floor(Math.random() * 20) + 10,
            speed: Math.floor(Math.random() * 50) + 50,
            agility: Math.floor(Math.random() * 40) + 20,
            intelligence: Math.floor(Math.random() * 40) + 20,
            size: Math.floor(Math.random() * 3) + 1,
            age: Math.floor(Math.random() * 5),
            reproductionRate: Math.floor(Math.random() * 30) + 20,
            adaptability: Math.floor(Math.random() * 40) + 30,
            resourceYield: Math.floor(Math.random() * 30) + 20,
            resistance: Math.floor(Math.random() * 25) + 15
        };

        // Modify attributes based on terrain
        if (terrain.type === TerrainType.DESERT) {
            attrs.speed += 20;
            attrs.adaptability += 20;
            attrs.health -= 10;
        } else if (terrain.type === TerrainType.FOREST) {
            attrs.strength += 10;
            attrs.defense += 10;
            attrs.speed -= 10;
        }

        // Apply region attribute effects
        attrs.health *= (regionAttrs.fertility / 100);
        attrs.reproductionRate *= (regionAttrs.biodiversity / 100);
        
        return {
            id: Math.random().toString(36).substr(2, 9),
            type: 'ANIMAL',
            position: gridPosition,
            attributes: attrs
        };
    }
}
