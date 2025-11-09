import { Weather } from '../entities/weather';
import { WeatherType, WeatherIntensity, WeatherCondition, RegionalWeather } from '../types/weather';
import { EffectEngine } from '../engines/effect-engine';
import { GridPosition } from '../values/grid-position';
import { GridCell } from '../entities/world';
import { Character } from '../entities/character';
import { Effect, EffectType, EffectTarget } from '../types/effects';


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

    applyWeatherEffects(cell: GridCell, character?: Character): void {
        const weather = this.getWeatherAt(cell.position);

        weather.effects.forEach(effect => {
            this.effectEngine.applyEffect(effect, cell);
        });

        // Apply temperature effects to character if present
        if (character) {
            const environmentalTemp = this.getEnvironmentalTemperature(cell.position);
            const idealTemp = 37; // Normal human body temperature
            const tempDifference = environmentalTemp - idealTemp;

            // Create a temperature effect based on the difference
            // Scale the effect to prevent instant temperature changes
            const tempEffectValue = tempDifference * 0.01; // Small incremental change

            if (Math.abs(tempEffectValue) > 0.001) { // Only apply if there's a meaningful difference
                const tempEffect: Effect = {
                    id: `environmental_temperature_${cell.position.x}_${cell.position.y}`,
                    name: { key: 'effect.environmental_temperature.name' },
                    description: { key: 'effect.environmental_temperature.description' },
                    type: EffectType.TEMPERATURE,
                    target: EffectTarget.SELF,
                    value: tempEffectValue,
                    modifier: { type: 'flat', value: 1 },
                    duration: 1, // Apply every game tick
                    tickRate: 1000 // Apply every second
                };

                this.effectEngine.applyEffect(tempEffect, character);
            }

            // Check for long-term temperature effects
            this.effectEngine.checkTemperatureStatusEffects(character);
        }
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
        // Calculate the average temperature across the world
        // This is a simplified implementation - in a full game, this would iterate over all cells
        // For now, we'll use a default baseline temperature
        return 20;
    }

    /**
     * Calculates the environmental temperature at a specific position, considering terrain, weather, and time of day.
     * @param position - The grid position to calculate temperature for.
     * @returns The environmental temperature in Celsius.
     */
    getEnvironmentalTemperature(position: GridPosition): number {
        // Get terrain temperature as base
        const weatherCondition = this.getWeatherAt(position);
        const baseTerrainTemp = weatherCondition.temperature || 20; // Default if no terrain data

        // Apply weather modifiers
        let weatherModifier = 0;
        const weatherType = this.currentWeather.getType();
        const intensity = this.currentWeather.getIntensity();

        switch (weatherType) {
            case WeatherType.CLEAR:
                weatherModifier = 0;
                break;
            case WeatherType.CLOUDY:
                weatherModifier = -2;
                break;
            case WeatherType.RAIN:
                weatherModifier = -5;
                break;
            case WeatherType.SNOW:
                weatherModifier = -10;
                break;
            case WeatherType.HEATWAVE:
                weatherModifier = 10;
                break;
            default:
                weatherModifier = 0;
        }

        // Apply intensity modifier
        const intensityMultiplier = intensity === WeatherIntensity.SEVERE ? 1.5 :
                                   intensity === WeatherIntensity.MILD ? 0.5 : 1.0;
        weatherModifier *= intensityMultiplier;

        // Apply day/night cycle modifier
        const dayNightModifier = this.getDayNightTemperatureModifier();

        // Calculate final temperature
        const environmentalTemp = baseTerrainTemp + weatherModifier + dayNightModifier;

        return Math.round(environmentalTemp);
    }

    /**
     * Calculates temperature modifier based on time of day.
     * @returns Temperature modifier for day/night cycle.
     */
    private getDayNightTemperatureModifier(): number {
        // Simplified day/night cycle - in a full implementation, this would use gameTime
        // For now, assume daytime (warmer) during most of the game
        const hourOfDay = (this.gameTime / 3600) % 24; // Convert gameTime to hours

        if (hourOfDay >= 6 && hourOfDay <= 18) {
            // Daytime: +5°C
            return 5;
        } else {
            // Nighttime: -5°C
            return -5;
        }
    }

    private getAverageHumidity(): number {
        // This would calculate the average humidity across the world
        return 50;
    }
}
