export type Terrain = 
    | "forest" 
    | "grassland" 
    | "desert" 
    | "swamp" 
    | "mountain" 
    | "cave" 
    | "jungle" 
    | "volcanic" 
    | "wall" 
    | "floptropica" 
    | "tundra" 
    | "beach" 
    | "mesa" 
    | "mushroom_forest" 
    | "ocean" 
    | "city" 
    | "space_station" 
    | "underwater";

export type SoilType = 
    | 'rocky' 
    | 'sandy' 
    | 'fertile' 
    | 'clay' 
    | 'loamy' 
    | 'volcanic' 
    | 'peaty' 
    | 'silty' 
    | 'chalky';

export const allTerrains: [Terrain, ...Terrain[]] = [
    "forest", "grassland", "desert", "swamp", "mountain", 
    "cave", "jungle", "volcanic", "wall", "floptropica", 
    "tundra", "beach", "mesa", "mushroom_forest", "ocean", 
    "city", "space_station", "underwater"
];
