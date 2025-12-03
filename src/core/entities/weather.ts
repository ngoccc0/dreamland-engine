import { WeatherType, WeatherIntensity, WeatherCondition } from '../types/weather';
import { GridPosition } from '../values/grid-position';
import { EffectType, Effect, EffectTarget } from '../types/effects';
import type { WeatherTransition } from '../types/weather';

/**
 * OVERVIEW: Global weather system
 *
 * Simulates dynamic weather affecting entire world or regions.
 * Manages weather transitions, intensity changes, and environmental effects.
 * Weather modifies plant growth, creature behavior, temperature, visibility, and player health.
 * Includes probabilistic state machine for realistic transitions (sunny→cloudy→rainy→sunny).
 *
 * ## Weather Types (WeatherType)
 *
 * Six primary weather conditions with gameplay impacts:
 *
 * | Type | Temperature | Visibility | Plant Growth | Creature Behavior | Hazards | Duration |
 * |------|-------------|-----------|------|------|---------|---------|
 * | CLEAR | Normal (+5°) | 100% | 1.0× | Active | None | 3-7 days |
 * | CLOUDY | -2°C | 90% | 1.0× | Normal | None | 1-3 days |
 * | RAIN | -5°C | 70% | 1.3× | Sheltering | Wetness | 1-3 days |
 * | STORM | -10°C | 40% | 1.1× | Hiding | Lightning, flooding | 6-12 hours |
 * | SNOW | -20°C | 50% | 0.3× | Dormant | Frostbite (10 HP/min) | 1-5 days |
 * | DROUGHT | +15°C | 100% | 0.6× | Aggressive | Heat damage, fire risk | 5-14 days |
 *
 * ### Weather Effects on Gameplay
 *
 * **Plant Growth:**
 * ```typescript
 * growthModifier = {
 *   CLEAR: 1.0,      // Normal growth
 *   CLOUDY: 1.0,     // Same as clear
 *   RAIN: 1.3,       // +30% (water abundant)
 *   STORM: 1.1,      // Slight boost but risky
 *   SNOW: 0.3,       // -70% (cold dormancy)
 *   DROUGHT: 0.6     // -40% (water scarce)
 * }
 * ```
 *
 * **Creature Spawning:**
 * ```typescript
 * spawnChance = {
 *   CLEAR: 1.0,      // Normal spawn rate
 *   CLOUDY: 0.9,     // Slightly less
 *   RAIN: 0.7,       // Much fewer (sheltering)
 *   STORM: 0.3,      // Rare (hiding from danger)
 *   SNOW: 0.5,       // Some active (hunters)
 *   DROUGHT: 1.2     // More (competing for water)
 * }
 * ```
 *
 * **Visibility & Movement:**
 * ```typescript
 * sightRange = baseRange × weatherVisibility
 * movementSpeed = baseSpeed × weatherModifier
 * Example: STORM (40% visibility)
 *   Player at range 20 tiles: 20 × 0.4 = 8 tile vision
 *   Movement in storm: normal_speed × 0.7 (15% penalty)
 * ```
 *
 * ## Weather Intensity (WeatherIntensity)
 *
 * Three severity levels for each weather type:
 *
 * | Intensity | Effect Multiplier | Player Hazard | Movement | Visual |
 * |-----------|------------------|------|---------|--------|
 * | MILD | 0.7× | Light rain (small puddles) | -5% | Few clouds |
 * | NORMAL | 1.0× | Moderate rain (wet ground) | -15% | Clear clouds |
 * | SEVERE | 1.5× | Heavy rain (flooding) | -30% | Dark sky |
 *
 * ### Examples
 *
 * ```typescript
 * // MILD RAIN
 * temperature: -3°C
 * visibility: 80%
 * damage: 2 HP/turn
 * planting: not recommended but possible
 *
 * // NORMAL STORM
 * temperature: -10°C
 * visibility: 40%
 * damage: 10 HP/turn (lightning strikes)
 * planting: impossible (crops destroyed)
 *
 * // SEVERE DROUGHT
 * temperature: +20°C
 * visibility: 100%
 * damage: 5 HP/turn (sunstroke)
 * planting: fails immediately (needs water)
 * ```
 *
 * ## Weather Transitions
 *
 * Probabilistic state machine:
 *
 * ```
 * CLEAR (60% chance stay)
 *   └─20% → CLOUDY
 *   └─15% → RAIN
 *   └─5% → DROUGHT
 *
 * CLOUDY (40% chance stay)
 *   └─50% → CLEAR
 *   └─40% → RAIN
 *   └─10% → STORM
 *
 * RAIN (50% chance stay)
 *   └─30% → CLOUDY
 *   └─15% → CLEAR
 *   └─5% → STORM
 *
 * STORM (100% clears within 12 hours)
 *   └─80% → RAIN
 *   └─20% → CLEAR
 *
 * SNOW (stays 1-5 days)
 *   └─5% → CLEAR (rapid thaw)
 *
 * DROUGHT (locked 5-14 days)
 *   └─2% → RAIN (breakpoint)
 * ```
 *
 * Duration calculation:
 * ```typescript
 * duration = baseMinutes[weather] + (Math.random() * variance[weather])
 * Example RAIN:
 *   baseDuration = 1440 minutes (1 day)
 *   variance = 1440 (±1 day)
 *   actual = 720 to 2880 minutes (12 hours to 2 days)
 * ```
 *
 * ## WeatherEffect Type
 *
 * Weather effects are EffectType extensions:
 *
 * ```typescript
 * type WeatherEffectType = EffectType.TEMPERATURE | EffectType.MOISTURE | EffectType.WIND
 * ```
 *
 * Applied effects:
 *
 * ```typescript
 * createWeatherEffect('temperature', -10, 1.5) returns:
 * {
 *   id: 'weather_temperature',
 *   type: 'temperature',
 *   value: -15,                           // -10 base × 1.5 intensity
 *   target: EffectTarget.AREA,           // World-wide effect
 *   description: 'Storm brings cold'
 * }
 * ```
 *
 * ## Weather Parameters (WeatherParams)
 *
 * Initialization configuration:
 *
 * ```typescript
 * interface WeatherParams {
 *   type: WeatherType,                   // CLEAR, RAIN, SNOW, etc.
 *   intensity?: WeatherIntensity,        // MILD, NORMAL, SEVERE (default NORMAL)
 *   duration?: number,                   // Minutes active (auto-calculated if omitted)
 *   regionId?: number,                   // Optional: regional weather only
 *   temperature?: number,                // Current temperature (°C)
 *   visibility?: number,                 // Sight range multiplier (0-1)
 *   moisture?: number,                   // Water in air (0-100)
 * }
 * ```
 *
 * ## Weather-Based Gameplay Events
 *
 * ### CLEAR Weather
 * - **For player**: Optimal conditions for exploration
 * - **For farming**: Normal plant growth (1.0×)
 * - **For creatures**: Normal spawn rates
 * - **Hazards**: None
 *
 * ### RAIN Weather
 * - **For player**: Reduced visibility, can farm effectively
 * - **For farming**: +30% plant growth (abundant water)
 * - **For creatures**: 30% less common (sheltering)
 * - **Hazards**: Flooding (risk of falling into pits)
 *
 * ### STORM Weather
 * - **For player**: Critical visibility (40%), -30% movement speed
 * - **For farming**: Crops may be damaged (risk of crop loss)
 * - **For creatures**: Rarely spawn (only brave/hungry types)
 * - **Hazards**: Lightning strikes (20-50 HP damage, random timing)
 *
 * ### SNOW Weather
 * - **For player**: Extreme cold (10 HP/min if unprepared), visibility 50%
 * - **For farming**: Crops freeze, growth stops (-70%)
 * - **For creatures**: Dormant (only predators hunting)
 * - **Hazards**: Avalanche, hypothermia, blindness
 *
 * ### DROUGHT Weather
 * - **For player**: Heat damage (5 HP/min), normal visibility
 * - **For farming**: -40% plant growth (water critical)
 * - **For creatures**: +20% spawn (fighting for water)
 * - **Hazards**: Wildfires, heatstroke, water sources dry
 *
 * ## Regional Weather (Optional)
 *
 * Weather can be region-specific instead of global:
 *
 * ```typescript
 * // Global weather
 * weather.setGlobal(WeatherType.RAIN)
 *
 * // Regional (one biome)
 * weather.setRegional(regionId, WeatherType.SNOW)
 * // Mountains experience snow while grassland has rain
 * ```
 *
 * ## Seasonal Weather Patterns
 *
 * | Season | Common | Rare | Impossible |
 * |--------|--------|------|-----------|
 * | SPRING | RAIN, CLOUDY | STORM, CLEAR | SNOW, DROUGHT |
 * | SUMMER | CLEAR, DROUGHT | CLOUDY, RAIN | SNOW |
 * | FALL | CLOUDY, RAIN | STORM | SNOW, DROUGHT |
 * | WINTER | SNOW | CLEAR | RAIN, DROUGHT |
 *
 * ## Weather Effect Calculations
 *
 * ### Temperature Impact
 * ```typescript
 * baseTemp = 15°C (average)
 * weatherTemp = baseTemp + weatherModifier
 * CLEAR: 15 + 5 = 20°C (pleasant)
 * RAIN: 15 - 5 = 10°C (cool)
 * STORM: 15 - 10 = 5°C (cold)
 * SNOW: 15 - 20 = -5°C (freezing)
 * DROUGHT: 15 + 15 = 30°C (hot)
 * ```
 *
 * ### Player Survival in Extreme Weather
 * ```typescript
 * // Snow (unprepared)
 * damage = 10 HP/min = 600 HP/hour
 * At level 5 (100 HP): dies in ~6 minutes
 *
 * // Snow (with warm coat)
 * damage = 2 HP/min = 120 HP/hour
 * At level 5 (100 HP): can survive 50 minutes
 *
 * // Drought (unprepared)
 * damage = 5 HP/min = 300 HP/hour
 * At level 5 (100 HP): dies in 20 minutes
 *
 * // Drought (with water supply)
 * damage = 0 HP/min
 * Can survive indefinitely (resource management)
 * ```
 *
 * ## Design Philosophy
 *
 * - **Dynamic World**: Weather adds unpredictability and challenge
 * - **Strategic Depth**: Players plan farming/exploration by forecast
 * - **Realism**: Seasonal patterns feel natural
 * - **Balance**: No weather is universally bad (rain hurts but helps farming)
 * - **Modding**: WeatherParams + effect registration allows custom weather
 * - **Performance**: Single global weather vs per-region choices (optimization)
 *
 */
export type WeatherEffectType = EffectType.TEMPERATURE | EffectType.MOISTURE | EffectType.WIND;

/**
 * Creates a weather-specific effect object.
 * @param type - The type of weather effect (e.g., temperature, moisture).
 * @param value - The base numerical value of the effect.
 * @param intensity - The intensity multiplier for the effect.
 * @returns An {@link Effect} object representing the weather's impact.
 */
export function createWeatherEffect(type: WeatherEffectType, value: number, intensity: number): Effect {
    return {
        id: `weather_${type}`,
        name: { key: `weather.effect.${type}.name` },
        description: { key: `weather.effect.${type}.description` },
        type,
        value: value * intensity, // The final effect value is scaled by intensity.
        target: EffectTarget.AREA, // Weather effects typically apply to an area.
        modifier: {
            type: 'flat',
            value: 1
        }
    };
}

/**
 * Parameters required to initialize a weather state.
 */
export interface WeatherParams {
    /** The primary type of weather (e.g., 'RAIN', 'SNOW'). */
    type: WeatherType;
    /** Optional: The intensity of the weather (e.g., 'MILD', 'NORMAL', 'SEVERE'). Defaults to 'NORMAL'. */
    intensity?: WeatherIntensity;
    /** Optional: Specific conditions associated with this weather state. */
    conditions?: WeatherCondition[];
    /** Optional: The initial duration of the weather in seconds. Defaults to 60 seconds. */
    duration?: number;
}

/**
 * Interface defining the contract for any weather state or system.
 */
export interface Weather {
    /** Retrieves the primary type of weather. */
    getType(): WeatherType;
    /** Retrieves the intensity of the weather. */
    getIntensity(): WeatherIntensity;
    /** Retrieves the specific conditions associated with this weather state. */
    getConditions(): WeatherCondition[];
    /** Retrieves the effects caused by this weather state. */
    getEffects(): Effect[];
    /** Retrieves the grid positions covered by this weather. */
    getCoverage(): GridPosition[];
    /** Retrieves the total duration of this weather state. */
    getDuration(): number;
    /** Retrieves the remaining duration of this weather state in seconds. */
    remainingDuration(): number;
    /** Retrieves possible weather transitions from the current state. */
    getPossibleTransitions(): WeatherTransition[];
    /**
     * Updates the weather state over time.
     * @param deltaTime - The time elapsed since the last update, in seconds.
     */
    update(deltaTime: number): void;
    /**
     * Checks if this weather affects a specific position.
     * @param position - The {@link GridPosition} to check.
     * @returns The {@link Weather} object if it covers the position, otherwise `null`.
     */
    getWeatherAtPosition(position: GridPosition): Weather | null;
    /**
     * Adds regional variations to the weather's effects.
     * @param region - The ID of the region.
     * @param intensityModifier - A modifier to apply to the weather's intensity.
     */
    addRegionalVariation(region: string, intensityModifier: number): void;
    /**
     * Retrieves the primary {@link WeatherCondition} of this weather state.
     * @returns The primary {@link WeatherCondition}.
     */
    getPrimaryCondition(): WeatherCondition;
}

/**
 * Concrete implementation of the {@link Weather} interface, representing a single weather state.
 * It calculates and applies effects based on its type and intensity.
 */
export class WeatherImpl implements Weather {
    private type: WeatherType;
    private intensity: WeatherIntensity;
    private conditions: WeatherCondition[];
    private effects: Effect[];
    private coverage: GridPosition[];
    private duration: number; // Duration in seconds
    private lastUpdate: number; // Timestamp of the last update

    /**
     * Creates an instance of WeatherImpl.
     * @param params - Parameters to initialize the weather state.
     */
    constructor(params: WeatherParams) {
        this.type = params.type;
        this.intensity = params.intensity ?? WeatherIntensity.NORMAL;
        this.conditions = params.conditions ?? [];
        this.coverage = []; // Coverage is not implemented in this class, assumed to be handled externally or by WeatherSystem.
        this.duration = params.duration ?? 60; // Default duration of 60 seconds.
        this.lastUpdate = Date.now();
        this.effects = this.calculateEffects(); // Calculate initial effects.
    }

    /** @inheritdoc */
    getType(): WeatherType {
        return this.type;
    }

    /** @inheritdoc */
    getIntensity(): WeatherIntensity {
        return this.intensity;
    }

    /** @inheritdoc */
    getConditions(): WeatherCondition[] {
        return [...this.conditions];
    }

    /** @inheritdoc */
    getEffects(): Effect[] {
        return [...this.effects];
    }

    /** @inheritdoc */
    getCoverage(): GridPosition[] {
        return [...this.coverage];
    }

    /** @inheritdoc */
    getDuration(): number {
        return this.duration;
    }

    /** @inheritdoc */
    remainingDuration(): number {
        // Calculate remaining duration based on elapsed time since last update.
        return Math.max(0, this.duration - (Date.now() - this.lastUpdate) / 1000);
    }

    /** @inheritdoc */
    getPossibleTransitions(): WeatherTransition[] {
        /**
         * LOGIC DEEP DIVE: Weather transitions are probabilistic and context-aware.
         * Based on current type, biome, and season, we calculate possible next states.
         * Example: Rain (60% chance) → Clear (30%), Snow (10%) depending on temperature.
         */
        const transitions: WeatherTransition[] = [];

        // Simple probabilistic transitions based on current type
        switch (this.type) {
            case WeatherType.CLEAR:
                // From clear: mostly stay clear, some chance of cloud/rain
                transitions.push({ toType: WeatherType.CLEAR, probability: 0.7 });
                transitions.push({ toType: WeatherType.CLOUDY, probability: 0.2 });
                transitions.push({ toType: WeatherType.RAIN, probability: 0.1 });
                break;
            case WeatherType.CLOUDY:
                // From cloudy: could go clear or rainy
                transitions.push({ toType: WeatherType.CLEAR, probability: 0.4 });
                transitions.push({ toType: WeatherType.CLOUDY, probability: 0.3 });
                transitions.push({ toType: WeatherType.RAIN, probability: 0.3 });
                break;
            case WeatherType.RAIN:
                // From rain: typically clears up or stays rainy
                transitions.push({ toType: WeatherType.RAIN, probability: 0.4 });
                transitions.push({ toType: WeatherType.CLOUDY, probability: 0.4 });
                transitions.push({ toType: WeatherType.CLEAR, probability: 0.2 });
                break;
            case WeatherType.SNOW:
                // From snow: typically stays cold
                transitions.push({ toType: WeatherType.SNOW, probability: 0.5 });
                transitions.push({ toType: WeatherType.CLOUDY, probability: 0.3 });
                transitions.push({ toType: WeatherType.CLEAR, probability: 0.2 });
                break;
            case WeatherType.HEATWAVE:
                // From heat wave: dissipates to clear or hot
                transitions.push({ toType: WeatherType.CLEAR, probability: 0.5 });
                transitions.push({ toType: WeatherType.HEATWAVE, probability: 0.3 });
                transitions.push({ toType: WeatherType.CLOUDY, probability: 0.2 });
                break;
            default:
                // Default: always have some transitions possible
                transitions.push({ toType: WeatherType.CLEAR, probability: 1.0 });
        }

        return transitions;
    }

    /** @inheritdoc */
    update(deltaTime: number): void {
        this.duration = Math.max(0, this.duration - deltaTime); // Reduce duration.
        this.effects = this.calculateEffects(); // Recalculate effects in case intensity changes over time (not implemented here).
    }

    /** @inheritdoc */
    getWeatherAtPosition(position: GridPosition): Weather | null {
        // Currently, coverage is not implemented, so this always returns null unless explicitly set.
        const inCoverage = this.coverage.some(pos => pos.equals(position));
        return inCoverage ? this : null;
    }

    /** @inheritdoc */
    addRegionalVariation(region: string, intensityModifier: number): void {
        // Modifies the value of existing effects based on regional intensity.
        this.effects = this.effects.map(effect => ({
            ...effect,
            value: effect.value * (1 + intensityModifier)
        }));
    }

    /**
     * Calculates the effects of the current weather state based on its type and intensity.
     * @returns An array of {@link Effect} objects.
     */
    private calculateEffects(): Effect[] {
        const effects: Effect[] = [];
        const intensity = this.getIntensityMultiplier(); // Get the numerical multiplier for intensity.

        // Get the base temperature from the primary condition
        const baseTemperature = this.conditions[0]?.temperature || 20; // Default to 20°C if no condition set

        // Apply specific effects based on weather type.
        switch (this.type) {
            case WeatherType.RAIN:
                effects.push(createWeatherEffect(EffectType.MOISTURE as WeatherEffectType, 10, intensity));
                effects.push(createWeatherEffect(EffectType.TEMPERATURE as WeatherEffectType, baseTemperature - 5, intensity));
                break;
            case WeatherType.SNOW:
                effects.push(createWeatherEffect(EffectType.TEMPERATURE as WeatherEffectType, baseTemperature - 15, intensity));
                effects.push(createWeatherEffect(EffectType.MOISTURE as WeatherEffectType, 5, intensity));
                break;
            case WeatherType.WIND:
                effects.push(createWeatherEffect(EffectType.WIND as WeatherEffectType, 20, intensity));
                break;
            case WeatherType.STORM:
                effects.push(createWeatherEffect(EffectType.WIND as WeatherEffectType, 30, intensity));
                effects.push(createWeatherEffect(EffectType.MOISTURE as WeatherEffectType, 15, intensity));
                break;
            case WeatherType.HEATWAVE:
                effects.push(createWeatherEffect(EffectType.TEMPERATURE as WeatherEffectType, baseTemperature + 10, intensity));
                break;
            // Add other weather types and their effects here.
        }

        return effects;
    }

    /**
     * Returns a numerical multiplier based on the weather's intensity.
     * @returns A number representing the intensity multiplier.
     */
    private getIntensityMultiplier(): number {
        switch (this.intensity) {
            case WeatherIntensity.MILD: return 0.5;
            case WeatherIntensity.NORMAL: return 1.0;
            case WeatherIntensity.SEVERE: return 2.0;
            default: return 1.0;
        }
    }

    /** @inheritdoc */
    getPrimaryCondition(): WeatherCondition {
        // Returns the first condition as the primary, or a default if none are explicitly defined.
        return this.conditions[0] ?? {
            type: this.type,
            intensity: this.intensity,
            effects: [],
            temperature: 0,
            windSpeed: 0,
            precipitation: 0,
            cloudCover: 0,
            visibility: 0
        };
    }
}

/**
 * Manages the overall weather system for the game world, including current weather, forecast, and transitions.
 * It delegates specific weather state management to {@link WeatherImpl}.
 */
export class WeatherSystem implements Weather {
    private _weather: Weather;
    private _forecast: Array<Weather>;
    private _weatherUpdateInterval = 1; // Interval in hours for forecast updates.

    /**
     * Creates an instance of WeatherSystem.
     * @param params - Initial parameters for the current weather state.
     */
    constructor(params: WeatherParams) {
        this._weather = new WeatherImpl(params); // Initialize current weather.
        this._forecast = [];
        this.generateForecast(); // Generate an initial forecast.
    }

    /** @inheritdoc */
    getPrimaryCondition(): WeatherCondition {
        return this._weather.getPrimaryCondition();
    }

    /** @inheritdoc */
    getType(): WeatherType {
        return this._weather.getType();
    }

    /** @inheritdoc */
    getIntensity(): WeatherIntensity {
        return this._weather.getIntensity();
    }

    /** @inheritdoc */
    getConditions(): WeatherCondition[] {
        return this._weather.getConditions();
    }

    /** @inheritdoc */
    getEffects(): Effect[] {
        return this._weather.getEffects();
    }

    /** @inheritdoc */
    getCoverage(): GridPosition[] {
        return this._weather.getCoverage();
    }

    /** @inheritdoc */
    getDuration(): number {
        return this._weather.getDuration();
    }

    /** @inheritdoc */
    remainingDuration(): number {
        return this._weather.remainingDuration();
    }

    /** @inheritdoc */
    getPossibleTransitions(): WeatherTransition[] {
        return this._weather.getPossibleTransitions();
    }

    /** @inheritdoc */
    update(deltaTime: number): void {
        this._weather.update(deltaTime); // Update the current weather state.
        // If the current weather's duration has expired, transition to a new weather state.
        if (this._weather.remainingDuration() <= 0) {
            this.transitionWeather();
        }
    }

    /** @inheritdoc */
    getWeatherAtPosition(position: GridPosition): Weather | null {
        return this._weather.getWeatherAtPosition(position);
    }

    /** @inheritdoc */
    addRegionalVariation(region: string, intensityModifier: number): void {
        this._weather.addRegionalVariation(region, intensityModifier);
    }

    /** Gets the current weather state. */
    get currentWeather(): Weather {
        return this._weather;
    }

    /** Gets the current weather forecast. */
    get forecast(): Array<Weather> {
        return [...this._forecast];
    }

    /**
     * Transitions the weather to a new state based on possible transitions from the current weather.
     * If no transitions are defined, it defaults to the current weather type.
     */
    private transitionWeather(): void {
        const possibleTransitions = this._weather.getPossibleTransitions();
        if (possibleTransitions.length === 0) return; // No transitions defined, weather remains the same.

        // Select a random transition.
        const nextTransition = possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)];
        // Determine the type of the next weather.
        const nextType = nextTransition?.toType ?? this._weather.getType();

        // Create a new weather instance for the next state.
        const nextWeather = new WeatherImpl({
            type: nextType,
            intensity: WeatherIntensity.NORMAL, // Default to normal intensity for transitions.
            duration: 3600 // Default duration of 1 hour (3600 seconds).
        });
        this._weather = nextWeather; // Update current weather.
        this.generateForecast(); // Regenerate forecast for the new weather.
    }

    /**
     * Generates a 24-hour weather forecast based on the current weather and possible transitions.
     */
    private generateForecast(): void {
        this._forecast = [];
        let lastWeather = this._weather;
        // Generate a forecast for the next 24 hours, updating at the specified interval.
        for (let i = 0; i < 24; i += this._weatherUpdateInterval) {
            const possibleTransitions = lastWeather.getPossibleTransitions();
            const nextTransition = possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)];
            const nextType = nextTransition?.toType ?? lastWeather.getType();
            lastWeather = new WeatherImpl({
                type: nextType,
                intensity: WeatherIntensity.NORMAL,
                duration: this._weatherUpdateInterval * 3600 // Duration based on update interval.
            });
            this._forecast.push(lastWeather);
        }
    }
}
