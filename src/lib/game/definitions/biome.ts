import type { Terrain, SoilType } from "../types";

export interface BiomeDefinition {
    minSize: number;
    maxSize: number;
    travelCost: number;
    spreadWeight: number; // How likely it is to spread during world generation
    allowedNeighbors: Terrain[];
    defaultValueRanges: {
        vegetationDensity: { min: number, max: number };
        moisture: { min: number, max: number };
        elevation: { min: number, max: number };
        dangerLevel: { min: number, max: number };
        magicAffinity: { min: number, max: number };
        humanPresence: { min: number, max: number };
        predatorPresence: { min: number, max: number };
        temperature: { min: number, max: number };
    };
    soilType: SoilType[];
}
