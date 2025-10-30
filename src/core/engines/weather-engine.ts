import { Weather } from '../entities/weather';
import { WeatherType, WeatherIntensity, WeatherCondition, RegionalWeather } from '../types/weather';
import { EffectEngine } from '../engines/effect-engine';
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/world';


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
        if (this.currentWeather.remainingDuration() <= 0) {
            // Defensive: getPossibleTransitions may return WeatherTransition[] or WeatherType[]
            const possibleTransitions = this.currentWeather.getPossibleTransitions?.() || [];
            // If transitions have probability and toType, treat as WeatherTransition[]
            if (possibleTransitions.length > 0 && typeof possibleTransitions[0] === 'object' && 'probability' in possibleTransitions[0] && 'toType' in possibleTransitions[0]) {
                const totalProb = possibleTransitions.reduce((sum: number, t: any) => sum + (t.probability || 0), 0);
                let random = Math.random() * totalProb;
                for (const transition of possibleTransitions) {
                    random -= transition.probability || 0;
                    if (random <= 0) {
                        this.transitionTo(transition.toType);
                        break;
                    }
                }
            }
        }
    }

    private updateRegionalWeather(_timeDelta: number): void {
        // Update each regional variation
        // This could include:
        // - Expanding/contracting weather areas
        // - Changing intensities
        // - Moving weather systems
    }

    getWeatherAt(position: GridPosition): WeatherCondition {
        const weather = this.currentWeather.getWeatherAtPosition(position);
        // Fallback to a default WeatherCondition if null
        return weather ? weather.getPrimaryCondition() : this.weatherData.get(WeatherType.CLEAR)!;
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

        const regionType = regionalWeather.primaryCondition.type ?? 'CLEAR';
        this.currentWeather.addRegionalVariation(String(regionType), 1);
    }

    private createWeather(type: WeatherType, intensity: WeatherIntensity): Weather {
        const condition = this.weatherData.get(type);
        if (!condition) {
            throw new Error(`No weather data found for type: ${type}`);
        }

        // Use a Weather factory or implementation as needed
        // Placeholder: return an object matching the Weather interface
        return {
            getType: () => type,
            getIntensity: () => intensity,
            getConditions: () => [condition],
            getEffects: () => condition.effects,
            getCoverage: () => [],
            getDuration: () => condition.duration || 0,
            remainingDuration: () => condition.duration || 0,
            getPossibleTransitions: () => condition.transitions || [],
            update: () => {},
            getWeatherAtPosition: () => null,
            addRegionalVariation: () => {},
            getPrimaryCondition: () => condition
        };
    }

    transitionTo(newType: WeatherType): void {
        this.currentWeather = this.createWeather(newType, WeatherIntensity.NORMAL);
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
