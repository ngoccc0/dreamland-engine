import { WeatherEngine } from '../engines/weather-engine';
import { WeatherType, WeatherIntensity, WeatherCondition } from '../types/weather';
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/grid-cell';

export interface IWeatherUseCase {
    getCurrentWeather(): WeatherCondition;
    getWeatherAtPosition(position: GridPosition): WeatherCondition;
    createRegionalWeather(center: GridPosition, radius: number, type: WeatherType): Promise<void>;
    updateWeather(gameTime: number): Promise<void>;
}

export class WeatherUseCase implements IWeatherUseCase {
    constructor(
        private readonly weatherEngine: WeatherEngine,
        private readonly worldRepository: any // Will be defined in infrastructure
    ) {}

    getCurrentWeather(): WeatherCondition {
        return this.weatherEngine.getWeatherAt(new GridPosition(0, 0));
    }

    getWeatherAtPosition(position: GridPosition): WeatherCondition {
        return this.weatherEngine.getWeatherAt(position);
    }

    async createRegionalWeather(
        center: GridPosition,
        radius: number,
        type: WeatherType
    ): Promise<void> {
        this.weatherEngine.createRegionalWeather(
            center,
            radius,
            type,
            WeatherIntensity.MODERATE
        );

        // Update affected cells
        const world = await this.worldRepository.getWorld();
        const affectedCells = world.getChunksInArea(center, radius);
        
        affectedCells.forEach((cell: GridCell) => {
            this.weatherEngine.applyWeatherEffects(cell);
        });

        await this.worldRepository.save(world);
    }

    async updateWeather(gameTime: number): Promise<void> {
        this.weatherEngine.update(gameTime);

        // Update world cells affected by weather
        const world = await this.worldRepository.getWorld();
        world.chunks.forEach(cell => {
            this.weatherEngine.applyWeatherEffects(cell);
        });

        await this.worldRepository.save(world);
    }

    // Additional methods for weather manipulation
    async disperseWeather(position: GridPosition): Promise<void> {
        // Logic to gradually disperse weather effects in an area
    }

    async intensifyWeather(position: GridPosition): Promise<void> {
        // Logic to intensify weather in an area
    }

    async mergeWeatherSystems(position1: GridPosition, position2: GridPosition): Promise<void> {
        // Logic to merge two weather systems
    }
}
