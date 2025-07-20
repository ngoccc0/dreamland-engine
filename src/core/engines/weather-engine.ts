import { Weather } from '../entities/weather';
import { WeatherType, WeatherIntensity, WeatherCondition, RegionalWeather } from '../types/weather';
import { Effect, EffectEngine } from '../engines/effect-engine';
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/grid-cell';

export class WeatherEngine {
    private currentWeather: Weather;
    private gameTime: number = 0;
    private lastUpdate: number = 0;
    
    constructor(
        private readonly effectEngine: EffectEngine,
        private readonly weatherData: Map<WeatherType, WeatherCondition>,
        initialWeather?: Weather
    ) {
        // Start with clear weather if none specified
        this.currentWeather = initialWeather || this.createWeather(WeatherType.CLEAR, WeatherIntensity.MILD);
    }

    update(newGameTime: number): void {
        this.gameTime = newGameTime;
        const timeDelta = this.gameTime - this.lastUpdate;

        // Update current weather
        this.currentWeather.update(this.gameTime);

        // Check for weather transitions
        this.checkWeatherTransitions();

        // Update regional variations
        this.updateRegionalWeather(timeDelta);

        this.lastUpdate = this.gameTime;
    }

    private checkWeatherTransitions(): void {
        if (this.currentWeather.remainingDuration <= 0) {
            const possibleTransitions = this.currentWeather.getPossibleTransitions(
                this.gameTime,
                this.getCurrentSeason(),
                this.getAverageTemperature(),
                this.getAverageHumidity()
            );

            if (possibleTransitions.length > 0) {
                // Weight random selection by probability
                const totalProb = possibleTransitions.reduce((sum: number, t: { probability: number }) => sum + t.probability, 0);
                let random = Math.random() * totalProb;

                for (const transition of possibleTransitions) {
                    random -= transition.probability;
                    if (random <= 0) {
                        this.transitionTo(transition.toType);
                        break;
                    }
                }
            }
        }
    }

    private updateRegionalWeather(timeDelta: number): void {
        // Update each regional variation
        // This could include:
        // - Expanding/contracting weather areas
        // - Changing intensities
        // - Moving weather systems
    }

    getWeatherAt(position: GridPosition): WeatherCondition {
        return this.currentWeather.getWeatherAtPosition(position);
    }

    applyWeatherEffects(cell: GridCell): void {
        const weather = this.getWeatherAt(cell.position);
        
        weather.effects.forEach(effect => {
            this.effectEngine.applyEffect(effect, cell);
        });
    }

    createRegionalWeather(
        centerPosition: GridPosition,
        radius: number,
        weatherType: WeatherType,
        intensity: WeatherIntensity
    ): void {
        const regionalWeather: RegionalWeather = {
            primaryCondition: this.weatherData.get(weatherType)!,
            localVariations: new Map(),
            affectedArea: {
                center: { x: centerPosition.x, y: centerPosition.y },
                radius
            }
        };

        this.currentWeather.addRegionalVariation(regionalWeather);
    }

    private createWeather(type: WeatherType, intensity: WeatherIntensity): Weather {
        const condition = this.weatherData.get(type);
        if (!condition) {
            throw new Error(`No weather data found for type: ${type}`);
        }

        return new Weather(
            type,
            intensity,
            condition,
            { key: `weather.${type}.name` },
            { key: `weather.${type}.description` }
        );
    }

    transitionTo(newType: WeatherType): void {
        this.currentWeather = this.createWeather(newType, WeatherIntensity.MODERATE);
    }

    // Helper methods for weather transitions
    private getCurrentSeason(): string {
        // This would be implemented based on your game's time system
        return 'summer';
    }

    private getAverageTemperature(): number {
        // This would calculate the average temperature across the world
        return 20;
    }

    private getAverageHumidity(): number {
        // This would calculate the average humidity across the world
        return 50;
    }
}
