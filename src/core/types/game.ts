export type GameMode = 'ai' | 'offline';
export type GameTheme = 'Normal' | 'Magic' | 'Horror' | 'SciFi';
export type PlayerPersona = 'none' | 'explorer' | 'warrior' | 'artisan';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface GameTime {
    time: number;    // Minutes since start of day (0-1440)
    day: number;     // Days since game start
    turn: number;    // Game turns
    season: Season;
}

export interface GameSettings {
    gameMode: GameMode;
    theme: GameTheme;
    worldProfile: WorldProfile;
}

export interface WorldProfile {
    climateBase: 'temperate' | 'arid' | 'tropical';
    magicLevel: number;
    mutationFactor: number;
    sunIntensity: number;
    weatherTypesAllowed: ('clear' | 'rain' | 'fog' | 'snow')[];
    moistureBias: number;
    tempBias: number;
    resourceDensity: number;
    theme: GameTheme;
}
