/**
 * Terrain & Weather Discovery Impact Usecase
 *
 * Calculates how weather and terrain conditions affect discovery probability
 * and modify encounter difficulty when exploring.
 *
 * @remarks
 * Weather and terrain modifiers apply to:
 * - Discovery probability: Some discoveries only appear in certain weather/terrain
 * - Encounter difficulty: Monster stats adjust based on conditions
 * - Travel hazards: Weather inflicts damage during exploration
 * - Visibility: Terrain/weather affect how far you can see discoveries
 *
 * @example
 * const usecase = new TerrainWeatherDiscoveryUseCase(weatherEngine, terrainEngine);
 * const modifiedDifficulty = usecase.calculateDiscoveryModifier(
 *   discovery,
 *   weatherEngine.getCurrentWeather(),
 *   cellTerrain,
 *   playerLevel
 * );
 */

import type { Discovery } from '../entities/exploration';
import type { WeatherType, WeatherIntensity } from '../types/weather';
import type { TerrainType } from '../entities/terrain';

/**
 * Represents a discovery modifier calculation result
 *
 * @remarks
 * Contains all the bonuses/penalties applied to a discovery due to weather and terrain.
 * Used for display (showing player why discovery is harder) and actual encounter generation.
 */
export interface DiscoveryModifier {
    /**
     * Multiplier for encounter difficulty (1.0 = normal, 0.5 = half difficulty, 2.0 = double)
     */
    difficultyMultiplier: number;

    /**
     * Multiplier for XP rewards (accounts for harder encounters)
     */
    xpMultiplier: number;

    /**
     * Multiplier for loot rarity (better loot in harder conditions)
     */
    lootMultiplier: number;

    /**
     * Whether discovery is currently visible (some only appear in certain weather)
     */
    isVisible: boolean;

    /**
     * Optional damage per turn during exploration (weather hazards)
     */
    hazardDamagePerTurn?: number;

    /**
     * Descriptive reason for the modifiers (for UI display)
     */
    reason: string;

    /**
     * Applied modifiers for detailed breakdown
     */
    appliedModifiers: {
        weather: string;
        terrain: string;
        visibility: string;
    };
}

/**
 * Mapping of terrain types to their discovery visibility impact
 *
 * @remarks
 * Higher values = harder to spot discoveries in that terrain.
 * FOREST (0.6) = 40% less visible, MOUNTAIN (0.7) = 30% less visible, etc.
 */
const TERRAIN_VISIBILITY_MAP: Record<string, number> = {
    grassland: 1.0,    // Clear visibility
    forest: 0.4,       // Dense foliage hides things
    desert: 0.95,      // Wide open, very visible
    mountain: 0.3,     // Terrain hides discoveries
    water: 0.5,        // Reflections and waves obscure
    snow: 0.6,         // Drifts hide objects
    swamp: 0.35,       // Fog and murk
    cave: 0.2,         // Dark, very hard to see
    jungle: 0.25,      // Extreme foliage
    volcanic: 0.6,     // Smoke and ash
    tundra: 0.7,       // Open but harsh visibility
    beach: 0.9,        // Open and visible
    mesa: 0.85,        // Good visibility from height
    mushroom_forest: 0.5, // Magical obscuring
    ocean: 0.4,        // Waves and depth
    city: 1.0,         // Clear streets
    space_station: 1.0, // Well-lit
    underwater: 0.2    // Dark depths
};

/**
 * Mapping of weather types to their discovery visibility impact
 *
 * @remarks
 * CLEAR (1.0) = normal, RAIN (0.7) = 30% harder to see, STORM (0.4) = 60% harder, etc.
 */
const WEATHER_VISIBILITY_MAP: Record<string, number> = {
    CLEAR: 1.0,
    CLOUDY: 0.95,
    RAIN: 0.7,
    STORM: 0.4,
    SNOW: 0.5,
    DROUGHT: 1.0,
    HEATWAVE: 1.0
};

/**
 * Mapping of terrain to discovery bias (which discoveries appear where)
 *
 * @remarks
 * Determines which discovery types naturally occur in each terrain.
 * Used to increase probability of certain discoveries.
 */
const TERRAIN_DISCOVERY_AFFINITY: Record<string, string[]> = {
    grassland: ['landmark', 'resource', 'settlement'],
    forest: ['resource', 'dungeon', 'secret', 'landmark'],
    desert: ['artifact', 'landmark', 'secret'],
    mountain: ['dungeon', 'artifact', 'landmark'],
    water: ['secret', 'resource'],
    snow: ['secret', 'landmark'],
    swamp: ['dungeon', 'secret', 'resource'],
    cave: ['dungeon', 'artifact', 'resource'],
    jungle: ['secret', 'resource', 'landmark'],
    volcanic: ['dungeon', 'artifact'],
    tundra: ['landmark', 'secret'],
    beach: ['resource', 'landmark'],
    mesa: ['artifact', 'landmark'],
    mushroom_forest: ['secret', 'artifact'],
    ocean: ['secret'],
    city: ['settlement', 'landmark'],
    space_station: ['secret'],
    underwater: ['secret', 'artifact']
};

/**
 * Mapping of weather to difficulty modifiers
 *
 * @remarks
 * How weather affects combat difficulty during discovery exploration.
 * CLEAR (1.0) = normal, RAIN (1.15) = 15% harder, STORM (1.4) = 40% harder, etc.
 */
const WEATHER_DIFFICULTY_MAP: Record<string, number> = {
    CLEAR: 1.0,
    CLOUDY: 1.0,
    RAIN: 1.15,      // Muddy, slippery combat
    STORM: 1.4,      // Lightning, wind, visibility issues
    SNOW: 1.25,      // Cold, icy footing
    DROUGHT: 1.1,    // Heat exhaustion
    HEATWAVE: 1.3    // Extreme heat exhaustion
};

/**
 * Mapping of terrain to difficulty modifiers
 *
 * @remarks
 * How terrain affects combat difficulty during discovery exploration.
 * GRASSLAND (1.0) = normal, FOREST (1.1) = 10% harder, MOUNTAIN (1.4) = 40% harder, etc.
 */
const TERRAIN_DIFFICULTY_MAP: Record<string, number> = {
    grassland: 1.0,  // Neutral
    forest: 1.1,     // Limited movement
    desert: 1.15,    // Heat effects
    mountain: 1.4,   // Movement restrictions
    water: 1.35,     // Swimming penalty
    snow: 1.3,       // Cold damage
    swamp: 1.25,     // Movement penalty + poison
    cave: 1.2,       // Dark combat
    jungle: 1.35,    // Dense movement
    volcanic: 1.45,  // Lava hazards
    tundra: 1.3,     // Extreme cold
    beach: 1.05,     // Sand movement penalty
    mesa: 1.1,       // Elevation effects
    mushroom_forest: 1.15, // Magical hazards
    ocean: 1.5,      // Swimming penalty + depth
    city: 1.0,       // Neutral
    space_station: 1.2, // Low gravity/pressure
    underwater: 1.6  // Extreme pressure + breathing
};

/**
 * Mapping of weather intensity to multiplier
 */
const WEATHER_INTENSITY_MAP: Record<string, number> = {
    MILD: 0.7,
    NORMAL: 1.0,
    SEVERE: 1.5,
    INTENSE: 2.0
};

/**
 * Weather hazard damage per turn
 *
 * @remarks
 * Damage applied to player during exploration in dangerous weather.
 * In SEVERE STORM, player takes 2 HP/turn automatically.
 */
const WEATHER_HAZARD_DAMAGE: Record<string, number> = {
    CLEAR: 0,
    CLOUDY: 0,
    RAIN: 0,
    STORM: 2,      // Lightning strikes
    SNOW: 1,       // Frostbite
    DROUGHT: 0,
    HEATWAVE: 3    // Extreme heat
};

/**
 * Terrain hazard damage per turn
 *
 * @remarks
 * Damage applied to player during exploration in dangerous terrain.
 * In VOLCANIC terrain, player takes 2 HP/turn automatically.
 */
const TERRAIN_HAZARD_DAMAGE: Record<string, number> = {
    grassland: 0,
    forest: 0,
    desert: 0,
    mountain: 0,
    water: 1,       // Drowning risk
    snow: 1,        // Hypothermia
    swamp: 2,       // Poison
    cave: 0,
    jungle: 0,
    volcanic: 2,    // Lava/heat
    tundra: 1,      // Extreme cold
    beach: 0,
    mesa: 0,
    mushroom_forest: 0,
    ocean: 2,       // Deep water pressure
    city: 0,
    space_station: 1, // Radiation
    underwater: 3   // Crushing pressure
};

export class TerrainWeatherDiscoveryUseCase {
    /**
     * Calculate how weather and terrain modify a discovery's difficulty and visibility.
     *
     * @param discovery - The discovery being approached
     * @param currentWeather - Current weather type (CLEAR, RAIN, STORM, etc.)
     * @param weatherIntensity - Weather intensity (MILD, NORMAL, SEVERE)
     * @param terrainType - Current terrain type (grassland, forest, etc.)
     * @param playerLevel - Player's current level (for context)
     * @returns DiscoveryModifier with all calculated multipliers
     *
     * @example
     * const modifier = usecase.calculateDiscoveryModifier(
     *   goblinCave,
     *   'STORM',
     *   'SEVERE',
     *   'mountain',
     *   15
     * );
     * // Result: { difficultyMultiplier: 1.8, xpMultiplier: 1.5, ... }
     */
    calculateDiscoveryModifier(
        discovery: Discovery,
        currentWeather: WeatherType,
        weatherIntensity: string,
        terrainType: TerrainType,
        playerLevel: number
    ): DiscoveryModifier {
        const terrainStr = String(terrainType).toLowerCase();
        const weatherStr = String(currentWeather).toUpperCase();

        // 1. Check visibility
        const terrainVisibility = TERRAIN_VISIBILITY_MAP[terrainStr] ?? 1.0;
        const weatherVisibility = WEATHER_VISIBILITY_MAP[weatherStr] ?? 1.0;
        const combinedVisibility = terrainVisibility * weatherVisibility;

        // Discovery is visible if combined visibility > 0.3 (30% threshold)
        // Some discoveries only appear in certain terrain/weather
        const isVisible = this.isDiscoveryVisible(
            discovery,
            currentWeather,
            terrainType,
            combinedVisibility
        );

        // 2. Calculate difficulty modifiers
        const terrainDifficulty = TERRAIN_DIFFICULTY_MAP[terrainStr] ?? 1.0;
        const weatherDifficulty = WEATHER_DIFFICULTY_MAP[weatherStr] ?? 1.0;
        const intensityMultiplier = WEATHER_INTENSITY_MAP[weatherIntensity] ?? 1.0;

        const difficultyMultiplier =
            terrainDifficulty * weatherDifficulty * intensityMultiplier;

        // 3. XP multiplier (higher difficulty = better rewards)
        const xpMultiplier = Math.min(difficultyMultiplier, 2.5); // Cap at 2.5×

        // 4. Loot multiplier (harder conditions = rarer loot)
        const lootMultiplier = Math.min(difficultyMultiplier * 1.15, 3.0); // Slightly better than XP

        // 5. Calculate hazard damage
        const weatherDamage =
            (WEATHER_HAZARD_DAMAGE[weatherStr] ?? 0) * intensityMultiplier;
        const terrainDamage = TERRAIN_HAZARD_DAMAGE[terrainStr] ?? 0;
        const hazardDamagePerTurn = weatherDamage + terrainDamage;

        // 6. Build reason string
        const reasons: string[] = [];
        if (terrainDifficulty > 1.0) {
            reasons.push(`${terrainStr} terrain adds ${((terrainDifficulty - 1) * 100).toFixed(0)}% difficulty`);
        }
        if (weatherDifficulty > 1.0) {
            reasons.push(`${weatherStr} adds ${((weatherDifficulty - 1) * 100).toFixed(0)}% difficulty`);
        }
        if (intensityMultiplier > 1.0) {
            reasons.push(`${weatherIntensity} intensity multiplies effects by ${intensityMultiplier.toFixed(1)}×`);
        }
        if (!isVisible) {
            reasons.push('Discovery is hidden in current conditions');
        }
        if (combinedVisibility < 1.0) {
            const visibilityPenalty = ((1 - combinedVisibility) * 100).toFixed(0);
            reasons.push(`${visibilityPenalty}% visibility reduction`);
        }

        const reason = reasons.length > 0 ? reasons.join('; ') : 'No weather/terrain modifiers';

        return {
            difficultyMultiplier: isVisible ? difficultyMultiplier : 0,
            xpMultiplier: isVisible ? xpMultiplier : 0,
            lootMultiplier: isVisible ? lootMultiplier : 0,
            isVisible,
            hazardDamagePerTurn: isVisible ? hazardDamagePerTurn : 0,
            reason,
            appliedModifiers: {
                weather: `${weatherStr} (intensity: ${weatherIntensity})`,
                terrain: terrainStr,
                visibility: `${(combinedVisibility * 100).toFixed(0)}%`
            }
        };
    }

    /**
     * Determine if a discovery should be visible in current weather/terrain
     *
     * @remarks
     * Some discoveries only appear in specific conditions:
     * - DESERT discoveries rarely appear in non-desert
     * - Secret discoveries need poor visibility to appear
     * - Dungeons prefer mountains and caves
     * - Artifacts prefer extreme conditions
     *
     * @param discovery - The discovery to check
     * @param weather - Current weather
     * @param terrain - Current terrain
     * @param combinedVisibility - Calculated visibility (0-1)
     * @returns true if discovery should be visible
     */
    private isDiscoveryVisible(
        discovery: Discovery,
        weather: WeatherType,
        terrain: TerrainType,
        combinedVisibility: number
    ): boolean {
        const terrainStr = String(terrain).toLowerCase();
        const weatherStr = String(weather).toUpperCase();

        // Check terrain affinity
        const affinities = TERRAIN_DISCOVERY_AFFINITY[terrainStr] ?? [];
        const typeStr = String(discovery.type).toLowerCase();

        // If terrain has affinity for this discovery type, it's visible
        if (affinities.includes(typeStr)) {
            return true;
        }

        // Secrets need poor visibility (< 0.5) to appear
        if (typeStr === 'secret' && combinedVisibility < 0.5) {
            return true;
        }

        // Artifacts prefer extreme weather
        if (typeStr === 'artifact' && (weatherStr === 'STORM' || weatherStr === 'HEATWAVE')) {
            return combinedVisibility >= 0.3;
        }

        // Default: visible if visibility > 30%
        return combinedVisibility >= 0.3;
    }

    /**
     * Calculate encounter difficulty for a discovery with weather/terrain modifiers
     *
     * @remarks
     * Used when generating monsters for a discovery encounter.
     * Applies weather and terrain difficulty multipliers to base enemy stats.
     *
     * @param baseEnemyStats - Base enemy stats (hp, damage, etc.)
     * @param modifier - DiscoveryModifier from calculateDiscoveryModifier()
     * @returns Modified enemy stats
     *
     * @example
     * const baseEnemy = { hp: 30, damage: 10 };
     * const encountered = usecase.applyModifierToEncounter(baseEnemy, modifier);
     * // In severe storm: hp: 42, damage: 14
     */
    applyModifierToEncounter(
        baseEnemyStats: { hp: number; damage: number; level?: number },
        modifier: DiscoveryModifier
    ): { hp: number; damage: number; level?: number } {
        if (!modifier.isVisible || modifier.difficultyMultiplier <= 0) {
            return baseEnemyStats; // Don't modify if hidden
        }

        return {
            hp: Math.ceil(baseEnemyStats.hp * modifier.difficultyMultiplier),
            damage: Math.ceil(baseEnemyStats.damage * modifier.difficultyMultiplier),
            level: baseEnemyStats.level
                ? Math.ceil(baseEnemyStats.level * modifier.difficultyMultiplier * 0.5)
                : undefined
        };
    }

    /**
     * Get a list of ideal conditions for a discovery
     *
     * @remarks
     * Returns recommended weather/terrain for this discovery type.
     * Used for player guidance or spawning discoveries appropriately.
     *
     * @param discoveryType - Type of discovery
     * @returns Object with preferred weather/terrain arrays
     *
     * @example
     * const prefs = usecase.getIdealConditions('secret');
     * // { weather: ['STORM', 'RAIN'], terrain: ['forest', 'cave', 'swamp'] }
     */
    getIdealConditions(discoveryType: string): {
        weather: string[];
        terrain: string[];
    } {
        const typeStr = String(discoveryType).toLowerCase();

        const weatherPrefs: Record<string, string[]> = {
            landmark: ['CLEAR', 'CLOUDY'],
            resource: ['RAIN', 'CLOUDY'],
            settlement: ['CLEAR'],
            dungeon: ['STORM', 'SNOW'],
            artifact: ['STORM', 'HEATWAVE'],
            secret: ['STORM', 'SNOW', 'RAIN']
        };

        const terrainPrefs: Record<string, string[]> = {
            landmark: ['desert', 'mountain', 'mesa'],
            resource: ['forest', 'mountain', 'swamp'],
            settlement: ['grassland', 'beach', 'city'],
            dungeon: ['mountain', 'cave', 'volcanic'],
            artifact: ['volcanic', 'cave', 'desert', 'mushroom_forest'],
            secret: ['forest', 'cave', 'swamp', 'jungle']
        };

        return {
            weather: weatherPrefs[typeStr] ?? ['CLEAR'],
            terrain: terrainPrefs[typeStr] ?? ['grassland']
        };
    }
}
