import { TerrainType, SoilType } from '@/lib/game/definitions/terrain-definitions';
import { TerrainAttributes } from '../types/attributes';
import { Entity } from './entity-factory';
import { EntityFactory } from './entity-factory';
import { GridPosition } from '../values/grid-position';
import { Terrain } from '../entities/terrain';
import { TranslatableString } from '../types/i18n';

interface TerrainBaseAttributes {
    baseMoisture: number;
    baseVegetation: number;
    baseElevation: number;
    baseMagicAffinity: number;
    baseDanger: number;
    baseExplorability: number;
    baseLightLevel: number;
    baseTemperature: number;
    baseWindLevel: number;
    basePredatorPresence: number;
    baseHumanPresence: number;
    baseTravelCost: number;
    preferredSoilTypes: SoilType[];
}

export class TerrainFactory {
    private readonly terrainCache: Map<TerrainType, Terrain> = new Map();
    private readonly entityFactory: EntityFactory;

    constructor() {
        this.entityFactory = new EntityFactory();
    }

    createTerrainAttributes(type: TerrainType): TerrainAttributes {
        const defaultAttrs = defaultTerrainAttributes[type];
        if (!defaultAttrs) {
            throw new Error(`No attributes defined for terrain type: ${type}`);
        }

        // Add some randomization to make terrains more varied
        const randomFactor = () => 0.8 + Math.random() * 0.4; // Random between 0.8 and 1.2

        return {
            vegetationDensity: Math.round(defaultAttrs.baseVegetation * randomFactor()),
            moisture: Math.round(defaultAttrs.baseMoisture * randomFactor()),
            elevation: Math.round(defaultAttrs.baseElevation * randomFactor()),
            temperature: Math.round(defaultAttrs.baseTemperature * randomFactor()),
            windLevel: Math.round(defaultAttrs.baseWindLevel * randomFactor()),
            lightLevel: Math.round(defaultAttrs.baseLightLevel * randomFactor()),
            soilType: defaultAttrs.preferredSoilTypes[Math.floor(Math.random() * defaultAttrs.preferredSoilTypes.length)],
            dangerLevel: Math.round(defaultAttrs.baseDanger * randomFactor()),
            magicAffinity: Math.round(defaultAttrs.baseMagicAffinity * randomFactor()),
            humanPresence: Math.round(defaultAttrs.baseHumanPresence * randomFactor()),
            predatorPresence: Math.round(defaultAttrs.basePredatorPresence * randomFactor()),
            explorability: Math.round(defaultAttrs.baseExplorability * randomFactor()),
            travelCost: Math.round(defaultAttrs.baseTravelCost * randomFactor())
        };
    }

    createTerrain(type: TerrainType, position: GridPosition): Terrain {
        // Check cache first
        const cachedTerrain = this.terrainCache.get(type);
        if (cachedTerrain) {
            return cachedTerrain;
        }

        // Create new terrain with attributes
        const attributes = this.createTerrainAttributes(type);
        const name: TranslatableString = { key: `terrain.${type}.name` };
        const description: TranslatableString = { key: `terrain.${type}.description` };

        const terrain = new Terrain(type, attributes, name, description);
        
        // Add entities to the terrain
        const entities = this.entityFactory.createEntitiesForTerrain(type, position);
        entities.forEach((entity: Entity) => terrain.addEntity(entity));

        // Cache the terrain
        this.terrainCache.set(type, terrain);

        return terrain;
    }
}

const defaultTerrainAttributes: Record<TerrainType, TerrainBaseAttributes> = {
    ['grassland']: {
        baseMoisture: 50,
        baseVegetation: 70,
        baseElevation: 30,
        baseMagicAffinity: 40,
        baseDanger: 30,
        baseExplorability: 80,
        baseLightLevel: 90,
        baseTemperature: 22,
        baseWindLevel: 60,
        basePredatorPresence: 40,
        baseHumanPresence: 60,
        baseTravelCost: 1,
        preferredSoilTypes: ['loamy', 'silty']
    },
    ['forest']: {
        baseMoisture: 70,
        baseVegetation: 90,
        baseElevation: 40,
        baseMagicAffinity: 60,
        baseDanger: 50,
        baseExplorability: 60,
        baseLightLevel: 40,
        baseTemperature: 17,
        baseWindLevel: 30,
        basePredatorPresence: 70,
        baseHumanPresence: 30,
        baseTravelCost: 2,
        preferredSoilTypes: ['loamy', 'peaty']
    },
    ['mountain']: {
        baseMoisture: 40,
        baseVegetation: 30,
        baseElevation: 90,
        baseMagicAffinity: 70,
        baseDanger: 80,
        baseExplorability: 40,
        baseLightLevel: 80,
        baseTemperature: 7,
        baseWindLevel: 90,
        basePredatorPresence: 60,
        baseHumanPresence: 20,
        baseTravelCost: 4,
        preferredSoilTypes: ['rocky', 'chalky']
    },
    ['desert']: {
        baseMoisture: 10,
        baseVegetation: 10,
        baseElevation: 50,
        baseMagicAffinity: 50,
        baseDanger: 60,
        baseExplorability: 70,
        baseLightLevel: 100,
        baseTemperature: 37,
        baseWindLevel: 70,
        basePredatorPresence: 50,
        baseHumanPresence: 20,
        baseTravelCost: 3,
        preferredSoilTypes: ['sandy']
    },
    ['ocean']: {
        baseMoisture: 100,
        baseVegetation: 40,
        baseElevation: 0,
        baseMagicAffinity: 80,
        baseDanger: 70,
        baseExplorability: 50,
        baseLightLevel: 70,
        baseTemperature: 17,
        baseWindLevel: 50,
        basePredatorPresence: 60,
        baseHumanPresence: 40,
        baseTravelCost: 5,
        preferredSoilTypes: ['silty']
    },
    ['swamp']: {
        baseMoisture: 90,
        baseVegetation: 60,
        baseElevation: 20,
        baseMagicAffinity: 90,
        baseDanger: 90,
        baseExplorability: 30,
        baseLightLevel: 30,
        baseTemperature: 27,
        baseWindLevel: 20,
        basePredatorPresence: 80,
        baseHumanPresence: 10,
        baseTravelCost: 4,
        preferredSoilTypes: ['peaty']
    },
    ['cave']: {
        baseMoisture: 60,
        baseVegetation: 20,
        baseElevation: 0,
        baseMagicAffinity: 100,
        baseDanger: 100,
        baseExplorability: 20,
        baseLightLevel: 10,
        baseTemperature: 12,
        baseWindLevel: 10,
        basePredatorPresence: 90,
        baseHumanPresence: 5,
        baseTravelCost: 3,
        preferredSoilTypes: ['rocky']
    },
    ['ruins']: {
        baseMoisture: 40,
        baseVegetation: 50,
        baseElevation: 30,
        baseMagicAffinity: 100,
        baseDanger: 85,
        baseExplorability: 90,
        baseLightLevel: 50,
        baseTemperature: 22,
        baseWindLevel: 40,
        basePredatorPresence: 70,
        baseHumanPresence: 0,
        baseTravelCost: 2,
        preferredSoilTypes: ['rocky', 'chalky']
    }
};
