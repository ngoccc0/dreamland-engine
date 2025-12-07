import { Terrain, SoilType } from './terrain';
import type { CreatureDefinition } from './creature'; // Import CreatureDefinition

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
    actions: any[]; // Added to support actions in chunks
    items: any[]; // Added to support items in chunks
    NPCs: any[]; // Added to support NPCs in chunks
    structures: any[]; // Added to support structures in chunks
    enemy: CreatureDefinition | null; // Added to support a single enemy creature in chunks
}

export interface Region {
    terrain: Terrain;
    cells: Position[];
}

export interface World {
    chunks: Record<string, Chunk>;
    regions: Record<number, Region>;
}
