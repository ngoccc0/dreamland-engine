import { TranslatableString } from '../types/i18n';
import { Terrain, SoilType } from './terrain';

export interface Position {
    x: number;
    y: number;
}

export interface WorldAttributes {
    vegetationDensity: number;
    moisture: number;
    elevation: number;
    lightLevel: number;
    dangerLevel: number;
    magicAffinity: number;
    humanPresence: number;
    explorability: number;
    soilType: SoilType;
    predatorPresence: number;
    windLevel: number;
    temperature: number;
}

export interface Chunk extends Position, WorldAttributes {
    terrain: Terrain;
    description: string;
    explored: boolean;
    lastVisited: number;
    regionId: number;
    travelCost: number;
}

export interface Region {
    terrain: Terrain;
    cells: Position[];
}

export interface World {
    chunks: Record<string, Chunk>;
    regions: Record<number, Region>;
}
