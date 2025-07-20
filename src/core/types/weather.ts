import { TranslatableString } from '../types/i18n';
import { Effect } from '../types/effects';

export enum WeatherType {
    CLEAR = 'clear',
    CLOUDY = 'cloudy',
    RAIN = 'rain',
    SNOW = 'snow',
    WIND = 'wind',
    STORM = 'storm',
    THUNDER_STORM = 'thunder_storm',
    FOG = 'fog',
    BLIZZARD = 'blizzard',
    HEAVY_FOG = 'heavy_fog',
    SANDSTORM = 'sandstorm',
    HEATWAVE = 'heatwave'
}

export enum WeatherIntensity {
    MILD = 'MILD',
    NORMAL = 'NORMAL',
    SEVERE = 'SEVERE'
}

export interface WeatherCondition {
    type?: WeatherType;
    intensity?: WeatherIntensity;
    duration?: number; // In game ticks
    effects: Effect[];
    temperature: number;
    windSpeed: number;
    precipitation: number;
    cloudCover: number;
    visibility: number;
    thunderstorm?: boolean;
    transitions?: WeatherTransition[]; // Possible weather changes
}

export interface WeatherTransition {
    toType: WeatherType;
    probability: number; // 0-1
    conditions?: WeatherTransitionCondition[];
}

export interface WeatherTransitionCondition {
    type: 'time' | 'season' | 'location' | 'temperature' | 'humidity';
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number | string;
}

export interface WeatherParams {
    type: WeatherType;
    intensity?: WeatherIntensity;
    duration?: number;
    conditions?: WeatherCondition[];
}

// For modding support
export interface CustomWeatherType {
    modId: string;
    baseType: WeatherType; // The vanilla weather type this extends
    name: TranslatableString;
    description: TranslatableString;
    visualEffects?: string[];
    soundEffects?: string[];
    customProperties?: Record<string, any>;
}

export interface RegionalWeather {
    primaryCondition: WeatherCondition;
    localVariations: Map<string, WeatherCondition>; // Position string -> local weather
    affectedArea: {
        center: { x: number, y: number };
        radius: number;
    };
}
