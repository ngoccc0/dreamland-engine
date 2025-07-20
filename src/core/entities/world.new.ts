import { WorldPosition } from '../values/position';
import { Terrain, TerrainType, SoilType } from './terrain';
import { WeatherSystem, WeatherCondition, WeatherEffectType, Effect } from './weather';

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

export class WorldChunk {
    private _lastVisited: number = 0;
    private _explored: boolean = false;
    private _mutableAttributes: WorldAttributes;

    constructor(
        private readonly _position: WorldPosition,
        private readonly _terrain: Terrain,
        private readonly _attributes: WorldAttributes,
        private readonly _regionId: number,
        private _description: string = ''
    ) {
        this._mutableAttributes = { ...this._attributes };
    }

    get position(): WorldPosition { return this._position; }
    get terrain(): Terrain { return this._terrain; }
    get attributes(): Readonly<WorldAttributes> { return this._mutableAttributes; }
    get regionId(): number { return this._regionId; }
    get description(): string { return this._description; }
    get lastVisited(): number { return this._lastVisited; }
    get explored(): boolean { return this._explored; }

    visit(timestamp: number): void {
        this._lastVisited = timestamp;
        this._explored = true;
    }

    updateAttributes(weatherSystem: WeatherSystem): void {
        // Update attributes based on weather conditions
        this._mutableAttributes = {
            ...this._mutableAttributes,
            moisture: this.calculateMoisture(weatherSystem),
            windLevel: weatherSystem.currentWeather.windSpeed,
            temperature: weatherSystem.currentWeather.temperature
        };
    }

    private calculateMoisture(weatherSystem: WeatherSystem): number {
        const baseMoisture = this._mutableAttributes.moisture;
        const precipitationEffect = weatherSystem.currentWeather.precipitation * 0.01;
        return Math.min(100, Math.max(0, baseMoisture + precipitationEffect));
    }
}

export class WorldRegion {
    private _chunks: Map<string, WorldChunk> = new Map();
    private _lastUpdated: number = Date.now();
    private _weather: WeatherSystem;
    private _currentWeather: WeatherCondition;

    constructor(
        private readonly _id: number,
        private readonly _position: WorldPosition,
        private readonly _terrain: Terrain,
        weather: WeatherSystem,
        initialWeather: WeatherCondition
    ) {
        this._weather = weather;
        this._currentWeather = initialWeather;
    }

    get id(): number { return this._id; }
    
    addChunk(chunk: WorldChunk): void {
        this._chunks.set(chunk.position.toString(), chunk);
    }

    getChunk(position: WorldPosition): WorldChunk | undefined {
        return this._chunks.get(position.toString());
    }

    updateWeather(weatherSystem: WeatherSystem): void {
        this._weather = weatherSystem;
        this._currentWeather = weatherSystem.currentWeather;
        for (const chunk of this._chunks.values()) {
            chunk.updateAttributes(weatherSystem);
        }
    }

    update(): void {
        const now = Date.now();
        const hoursSinceLastUpdate = (now - this._lastUpdated) / (1000 * 60 * 60);
        if (hoursSinceLastUpdate >= 1) {
            // Update chunks based on weather effects
            for (const chunk of this._chunks.values()) {
                // Apply weather effects to chunk's mutable attributes
                const mutableChunk = chunk as any;
                for (const effect of this._currentWeather.effects) {
                    this.applyEffect(effect, mutableChunk);
                }
            }
            this._lastUpdated = now;
        }
    }

    private applyEffect(effect: Effect, chunk: any): void {
        switch (effect.type) {
            case 'TEMPERATURE':
                chunk._mutableAttributes.temperature += effect.value;
                break;
            case 'MOISTURE':
                chunk._mutableAttributes.moisture += effect.value;
                break;
            case 'WIND':
                chunk._mutableAttributes.windLevel += effect.value;
                break;
            // Add more effect handlers as needed
        }
    }

    get weather(): WeatherSystem {
        return this._weather;
    }

    get currentWeather(): WeatherCondition {
        return this._currentWeather;
    }

    getWeatherAt(position: WorldPosition): WeatherCondition {
        return this._currentWeather;
    }
}

export class GameWorld {
    private _regions: Map<number, WorldRegion> = new Map();
    private _weatherSystem: WeatherSystem;
    
    constructor(
        weatherSystem: WeatherSystem,
        regions: WorldRegion[] = []
    ) {
        this._weatherSystem = weatherSystem;
        regions.forEach(region => this._regions.set(region.id, region));
    }

    addRegion(region: WorldRegion): void {
        this._regions.set(region.id, region);
    }

    getRegion(id: number): WorldRegion | undefined {
        return this._regions.get(id);
    }

    getChunkAt(position: WorldPosition): WorldChunk | undefined {
        for (const region of this._regions.values()) {
            const chunk = region.getChunk(position);
            if (chunk) return chunk;
        }
        return undefined;
    }

    updateTime(elapsedSeconds: number): void {
        this._weatherSystem.updateWeather(elapsedSeconds);
        
        // Update all regions with new weather
        for (const region of this._regions.values()) {
            region.updateWeather(this._weatherSystem);
        }
    }

    getWeatherAt(position: WorldPosition): WeatherCondition {
        // Find the region containing this position and get its weather
        for (const region of this._regions.values()) {
            if (region.getChunk(position)) {
                return region.currentWeather;
            }
        }
        // Return global weather if no region found
        return this._weatherSystem.currentWeather;
    }
}
