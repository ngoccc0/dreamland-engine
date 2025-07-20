import { WeatherType, WeatherIntensity, WeatherCondition } from '../types/weather';
import { GridPosition } from '../values/grid-position';
import { EffectType, Effect, EffectTarget } from '../types/effects';

export type WeatherEffectType = EffectType.TEMPERATURE | EffectType.MOISTURE | EffectType.WIND;

export function createWeatherEffect(type: WeatherEffectType, value: number, intensity: number): Effect {
    return {
        id: `weather_${type}`,
        name: { key: `weather.effect.${type}.name` },
        description: { key: `weather.effect.${type}.description` },
        type,
        value: value * intensity,
        target: EffectTarget.AREA,
        modifier: {
            type: 'flat',
            value: 1
        }
    };
}

export interface Weather {
    getType(): WeatherType;
    getIntensity(): WeatherIntensity;
    getConditions(): WeatherCondition[];
    getEffects(): Effect[];
    getCoverage(): GridPosition[];
    getDuration(): number;
    remainingDuration(): number;
    getPossibleTransitions(): WeatherType[];
    update(deltaTime: number): void;
    getWeatherAtPosition(position: GridPosition): Weather | null;
    addRegionalVariation(region: string, intensityModifier: number): void;
}

export interface WeatherParams {
    type: WeatherType;
    intensity?: WeatherIntensity;
    conditions?: WeatherCondition[];
    duration?: number;
}

export interface WeatherState {
    temperature: number;
    windSpeed: number;
    precipitation: number;
    cloudCover: number;
    visibility: number;
    thunderstorm: boolean;
    effects: Effect[];
}

export class WeatherImpl implements Weather {
    private type: WeatherType;
    private intensity: WeatherIntensity;
    private conditions: WeatherCondition[];
    private effects: Effect[];
    private coverage: GridPosition[];
    private duration: number;
    private lastUpdate: number;

    constructor(params: WeatherParams) {
        this.type = params.type;
        this.intensity = params.intensity ?? WeatherIntensity.NORMAL;
        this.conditions = params.conditions ?? [];
        this.coverage = [];
        this.duration = params.duration ?? 60;
        this.lastUpdate = Date.now();
        this.effects = this.calculateEffects();
    }

    getType(): WeatherType {
        return this.type;
    }

    getIntensity(): WeatherIntensity {
        return this.intensity;
    }

    getConditions(): WeatherCondition[] {
        return [...this.conditions];
    }

    getEffects(): Effect[] {
        return [...this.effects];
    }

    getCoverage(): GridPosition[] {
        return [...this.coverage];
    }

    getDuration(): number {
        return this.duration;
    }

    remainingDuration(): number {
        return Math.max(0, this.duration - (Date.now() - this.lastUpdate) / 1000);
    }
    
    getPossibleTransitions(): WeatherType[] {
        switch(this.type) {
            case WeatherType.CLEAR:
                return [WeatherType.CLOUDY, WeatherType.WIND];
            case WeatherType.CLOUDY:
                return [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.STORM];
            case WeatherType.RAIN:
                return [WeatherType.CLOUDY, WeatherType.STORM, WeatherType.SNOW];
            case WeatherType.SNOW:
                return [WeatherType.CLOUDY, WeatherType.CLEAR];
            case WeatherType.STORM:
                return [WeatherType.RAIN, WeatherType.CLOUDY];
            case WeatherType.WIND:
                return [WeatherType.CLEAR, WeatherType.CLOUDY, WeatherType.STORM];
            default:
                return [WeatherType.CLEAR];
        }
    }

    update(deltaTime: number): void {
        this.duration = Math.max(0, this.duration - deltaTime);
        this.effects = this.calculateEffects();
    }

    getWeatherAtPosition(position: GridPosition): Weather | null {
        const inCoverage = this.coverage.some(pos => pos.equals(position));
        return inCoverage ? this : null;
    }

    addRegionalVariation(region: string, intensityModifier: number): void {
        this.effects = this.effects.map(effect => ({
            ...effect,
            value: effect.value * (1 + intensityModifier)
        }));
    }

    private calculateEffects(): Effect[] {
        const effects: Effect[] = [];
        const intensity = this.getIntensityMultiplier();

        switch(this.type) {
            case WeatherType.RAIN:
                effects.push(createWeatherEffect(EffectType.MOISTURE as WeatherEffectType, 10, intensity));
                effects.push(createWeatherEffect(EffectType.TEMPERATURE as WeatherEffectType, -5, intensity));
                break;
            case WeatherType.SNOW:
                effects.push(createWeatherEffect(EffectType.TEMPERATURE as WeatherEffectType, -15, intensity));
                effects.push(createWeatherEffect(EffectType.MOISTURE as WeatherEffectType, 5, intensity));
                break;
            case WeatherType.WIND:
                effects.push(createWeatherEffect(EffectType.WIND as WeatherEffectType, 20, intensity));
                break;
            case WeatherType.STORM:
                effects.push(createWeatherEffect(EffectType.WIND as WeatherEffectType, 30, intensity));
                effects.push(createWeatherEffect(EffectType.MOISTURE as WeatherEffectType, 15, intensity));
                break;
        }

        return effects;
    }

    private getIntensityMultiplier(): number {
        switch(this.intensity) {
            case WeatherIntensity.MILD: return 0.5;
            case WeatherIntensity.NORMAL: return 1.0;
            case WeatherIntensity.SEVERE: return 2.0;
            default: return 1.0;
        }
    }
}

export class WeatherSystem implements Weather {
    private _weather: Weather;
    private _forecast: Array<Weather>;
    private _weatherUpdateInterval = 1; // hours

    constructor(params: WeatherParams) {
        this._weather = new WeatherImpl(params);
        this._forecast = [];
        this.generateForecast();
    }

    getType(): WeatherType {
        return this._weather.getType();
    }

    getIntensity(): WeatherIntensity {
        return this._weather.getIntensity();
    }

    getConditions(): WeatherCondition[] {
        return this._weather.getConditions();
    }

    getEffects(): Effect[] {
        return this._weather.getEffects();
    }

    getCoverage(): GridPosition[] {
        return this._weather.getCoverage();
    }

    getDuration(): number {
        return this._weather.getDuration();
    }

    remainingDuration(): number {
        return this._weather.remainingDuration();
    }

    getPossibleTransitions(): WeatherType[] {
        return this._weather.getPossibleTransitions();
    }

    update(deltaTime: number): void {
        this._weather.update(deltaTime);
        if (this._weather.remainingDuration() <= 0) {
            this.transitionWeather();
        }
    }

    getWeatherAtPosition(position: GridPosition): Weather | null {
        return this._weather.getWeatherAtPosition(position);
    }

    addRegionalVariation(region: string, intensityModifier: number): void {
        this._weather.addRegionalVariation(region, intensityModifier);
    }

    get currentWeather(): Weather {
        return this._weather;
    }

    get forecast(): Array<Weather> {
        return [...this._forecast];
    }

    private transitionWeather(): void {
        const possibleTransitions = this._weather.getPossibleTransitions();
        if (possibleTransitions.length === 0) return;
        
        const nextType = possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)];
        const nextWeather = new WeatherImpl({
            type: nextType,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600 // 1 hour
        });
        
        this._weather = nextWeather;
        this.generateForecast();
    }

    private generateForecast(): void {
        this._forecast = [];
        let lastWeather = this._weather;
        
        // Generate 24-hour forecast
        for (let i = 0; i < 24; i += this._weatherUpdateInterval) {
            const possibleTypes = lastWeather.getPossibleTransitions();
            const nextType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
            
            lastWeather = new WeatherImpl({
                type: nextType || lastWeather.getType(),
                intensity: WeatherIntensity.NORMAL,
                duration: this._weatherUpdateInterval * 3600
            });
            
            this._forecast.push(lastWeather);
        }
    }
}