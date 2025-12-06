/**
 * OVERVIEW: MoodProfiler - Explicit, deterministic mood calculation engine.
 *
 * Purpose:
 *   Calculate semantic mood tags from chunk environmental properties.
 *   Each mood is derived from explicit threshold-based rules (not learned/probabilistic).
 *   Supports mood strength metrics (subtle/standard/emphatic) for nuanced lexicon selection.
 *
 * Key Features:
 *   - Threshold-based: All rules use explicit numeric/categorical thresholds
 *   - Deterministic: Same input always produces same mood tags + strengths
 *   - Memoizable: Pure function (no side effects, easy to cache via React.useMemo)
 *   - Strength-aware: Each mood has a 0-1 strength value for intensity matching
 *   - Biome-centric: Terrain type directly maps to mood families
 *   - Bilingual-ready: No hardcoded text; mood names are English enums (language-neutral)
 *
 * Algorithm Summary:
 *   1. Analyze 8 environmental factors (light, temp, danger, etc.)
 *   2. For each factor, apply threshold rules → emit mood(s) if met
 *   3. Deduplicate and normalize strength values
 *   4. Apply terrain "flavor" moods
 *   5. Return sorted by strength (highest first)
 *
 * Integration:
 *   - Called by NarrativeTemplateSelector to filter templates by mood overlap
 *   - Called by NarrativeLexiconService.pick() to filter lexicon entries by tone
 *   - Memoized in React hooks (useGameEngine) to avoid recomputation every frame
 *
 * @module MoodProfiler
 */

import type { Chunk } from '@/core/types/world';
import type { Terrain } from '@/core/types/terrain';

/**
 * Semantic mood tags for narrative generation.
 * These represent emotional/atmospheric states derived from chunk properties.
 */
export enum MoodTag {
    // Primary emotional states
    Dark = 'Dark',
    Gloomy = 'Gloomy',
    Peaceful = 'Peaceful',
    Threatening = 'Threatening',
    Mysterious = 'Mysterious',

    // Intensity/danger
    Danger = 'Danger',
    Foreboding = 'Foreboding',
    Wild = 'Wild',

    // Environmental qualities
    Lush = 'Lush',
    Vibrant = 'Vibrant',
    Arid = 'Arid',
    Desolate = 'Desolate',
    Wet = 'Wet',
    Ethereal = 'Ethereal',
    Harsh = 'Harsh',
    Hot = 'Hot',
    Cold = 'Cold',
    Confined = 'Confined',
    Elevated = 'Elevated',
    Vast = 'Vast',

    // Civilization
    Civilized = 'Civilized',
    Historic = 'Historic',
    Abandoned = 'Abandoned',

    // Special qualities
    Magic = 'Magic',
    Resourceful = 'Resourceful',
    Serene = 'Serene',
    Rugged = 'Rugged',
    Smoldering = 'Smoldering',
    Structured = 'Structured',
    Barren = 'Barren',
}

/**
 * Mood with strength metric for intensity-aware selection.
 * Strength indicates how prominently this mood should influence narrative/lexicon choices.
 */
export interface MoodProfile {
    mood: MoodTag;
    strength: number; // 0-1, where 1 = maximum intensity
}

/**
 * Configuration object for mood analysis.
 * Allows customization of thresholds without changing core algorithm.
 */
export interface MoodAnalysisConfig {
    dangerThresholdHigh: number; // Default: 70 (triggers Danger + Foreboding + Threatening)
    dangerThresholdMedium: number; // Default: 40 (triggers Threatening)
    lightLevelDark: number; // Default: 10 (triggers Dark + Gloomy + Mysterious)
    lightLevelDim: number; // Default: 50 (triggers Mysterious + Gloomy)
    lightLevelBright: number; // Default: 80 (triggers Vibrant + Peaceful)
    moistureHigh: number; // Default: 80 (triggers Lush + Wet + Vibrant)
    moistureLow: number; // Default: 20 (triggers Arid + Desolate)
    tempHot: number; // Default: 40°C (triggers Hot + Harsh)
    tempCold: number; // Default: 0°C (triggers Cold + Harsh)
    tempMild: number; // Default: 15-30°C (triggers Peaceful)
    predatorPresenceHigh: number; // Default: 60 (triggers Danger + Wild)
    magicAffinityHigh: number; // Default: 70 (triggers Magic + Ethereal)
    magicAffinityMedium: number; // Default: 40 (triggers Mysterious)
    humanPresenceHigh: number; // Default: 60 (triggers Civilized + Historic)
}

// Default configuration
const DEFAULT_CONFIG: MoodAnalysisConfig = {
    dangerThresholdHigh: 70,
    dangerThresholdMedium: 40,
    lightLevelDark: 10,
    lightLevelDim: 50,
    lightLevelBright: 80,
    moistureHigh: 80,
    moistureLow: 20,
    tempHot: 40,
    tempCold: 0,
    tempMild: 15, // interpreted as 15-30 range
    predatorPresenceHigh: 60,
    magicAffinityHigh: 70,
    magicAffinityMedium: 40,
    humanPresenceHigh: 60,
};

/**
 * Mapping from terrain type to base mood tags.
 * These moods are always present for a given terrain, then enhanced by environmental factors.
 */
const TERRAIN_MOODS: Record<Terrain, MoodTag[]> = {
    swamp: [MoodTag.Gloomy, MoodTag.Wet, MoodTag.Mysterious],
    desert: [MoodTag.Arid, MoodTag.Desolate, MoodTag.Harsh],
    mountain: [MoodTag.Harsh, MoodTag.Rugged, MoodTag.Elevated],
    forest: [MoodTag.Lush, MoodTag.Peaceful],
    cave: [MoodTag.Dark, MoodTag.Mysterious, MoodTag.Foreboding, MoodTag.Confined],
    jungle: [MoodTag.Lush, MoodTag.Vibrant, MoodTag.Mysterious, MoodTag.Wild],
    volcanic: [MoodTag.Danger, MoodTag.Harsh, MoodTag.Smoldering],
    ocean: [MoodTag.Serene, MoodTag.Mysterious, MoodTag.Vast],
    tundra: [MoodTag.Cold, MoodTag.Desolate, MoodTag.Barren],
    grassland: [MoodTag.Peaceful, MoodTag.Vast, MoodTag.Resourceful],
    // Additional terrains (assign reasonable defaults)
    beach: [MoodTag.Serene, MoodTag.Peaceful],
    mesa: [MoodTag.Arid, MoodTag.Elevated, MoodTag.Vast],
    mushroom_forest: [MoodTag.Lush, MoodTag.Mysterious, MoodTag.Ethereal],
    city: [MoodTag.Civilized, MoodTag.Structured],
    space_station: [MoodTag.Civilized, MoodTag.Structured],
    underwater: [MoodTag.Serene, MoodTag.Mysterious, MoodTag.Vast, MoodTag.Confined],
    wall: [MoodTag.Harsh, MoodTag.Confined], // Placeholder (not normally a playable terrain)
    floptropica: [MoodTag.Vibrant, MoodTag.Lush], // Placeholder (whimsical terrain)
};

/**
 * Analyzes chunk properties and returns mood profiles sorted by strength.
 *
 * Algorithm:
 *   1. For each environmental factor, apply thresholds and emit moods
 *   2. Aggregate moods with strength calculations
 *   3. Apply terrain-specific moods
 *   4. Deduplicate (keep highest strength for each mood)
 *   5. Sort by strength descending
 *
 * @param chunk - Current environment (light, temp, danger, terrain, etc.)
 * @param config - Optional override configuration (uses defaults if not provided)
 * @returns Array of MoodProfiles sorted by strength (highest first)
 *
 * @example
 * ```typescript
 * const chunk = {
 *   terrain: 'cave',
 *   lightLevel: 5,
 *   temperature: 8,
 *   dangerLevel: 82,
 *   magicAffinity: 55,
 *   moisture: 65,
 *   humanPresence: 0,
 *   predatorPresence: 75,
 * };
 *
 * const moods = analyzeMood(chunk);
 * // Returns: [
 * //   { mood: MoodTag.Danger, strength: 1.0 },
 * //   { mood: MoodTag.Threatening, strength: 0.95 },
 * //   { mood: MoodTag.Dark, strength: 0.9 },
 * //   ...
 * // ]
 * ```
 */
export function analyzeMood(chunk: Chunk, config: Partial<MoodAnalysisConfig> = {}): MoodProfile[] {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const moodMap = new Map<MoodTag, number>(); // mood -> highest strength seen

    /**
     * Helper: Add or update mood with strength.
     * Keeps the highest strength value if mood is added multiple times.
     */
    const addMood = (mood: MoodTag, strength: number = 1.0) => {
        const current = moodMap.get(mood) ?? 0;
        moodMap.set(mood, Math.max(current, Math.min(strength, 1.0)));
    };

    /**
     * Factor 1: Danger Level
     * High danger → Danger, Foreboding, Threatening (full strength)
     * Medium danger → Threatening (partial strength)
     */
    if (chunk.dangerLevel >= cfg.dangerThresholdHigh) {
        addMood(MoodTag.Danger, 1.0);
        addMood(MoodTag.Foreboding, 0.95);
        addMood(MoodTag.Threatening, 0.95);
    } else if (chunk.dangerLevel >= cfg.dangerThresholdMedium) {
        addMood(MoodTag.Threatening, 0.8);
    }

    /**
     * Factor 2: Light Level
     * Dark → Dark, Gloomy, Mysterious
     * Dim → Mysterious, Gloomy
     * Bright → Vibrant, Peaceful
     */
    if (chunk.lightLevel <= cfg.lightLevelDark) {
        addMood(MoodTag.Dark, 1.0);
        addMood(MoodTag.Gloomy, 0.95);
        addMood(MoodTag.Mysterious, 0.85);
    } else if (chunk.lightLevel < cfg.lightLevelDim) {
        addMood(MoodTag.Mysterious, 0.9);
        addMood(MoodTag.Gloomy, 0.85);
    } else if (chunk.lightLevel >= cfg.lightLevelBright) {
        addMood(MoodTag.Vibrant, 1.0);
        addMood(MoodTag.Peaceful, 0.9);
    }

    /**
     * Factor 3: Moisture
     * High moisture → Lush, Wet, Vibrant
     * Low moisture → Arid, Desolate
     */
    if (chunk.moisture >= cfg.moistureHigh) {
        addMood(MoodTag.Lush, 1.0);
        addMood(MoodTag.Wet, 0.85);
        addMood(MoodTag.Vibrant, 0.8);
    } else if (chunk.moisture <= cfg.moistureLow) {
        addMood(MoodTag.Arid, 1.0);
        addMood(MoodTag.Desolate, 0.9);
    }

    /**
     * Factor 7: Temperature
     * Hot → Hot, Harsh
     * Cold → Cold, Harsh
     * Mild (15-30°C) → Peaceful
     */
    if ((chunk.temperature ?? 0) >= cfg.tempHot) {
        addMood(MoodTag.Hot, 1.0);
        addMood(MoodTag.Harsh, 0.85);
    } else if ((chunk.temperature ?? 0) <= cfg.tempCold) {
        addMood(MoodTag.Cold, 1.0);
        addMood(MoodTag.Harsh, 0.85);
    } else if ((chunk.temperature ?? 0) >= cfg.tempMild && (chunk.temperature ?? 0) <= 30) {
        addMood(MoodTag.Peaceful, 0.8);
    }

    /**
     * Factor 5: Predator Presence
     * High predator presence → Danger, Wild
     */
    if (chunk.predatorPresence >= cfg.predatorPresenceHigh) {
        addMood(MoodTag.Danger, 0.9);
        addMood(MoodTag.Wild, 1.0);
    }

    /**
     * Factor 6: Magic Affinity
     * High magic → Magic, Ethereal
     * Medium magic → Mysterious
     */
    if (chunk.magicAffinity >= cfg.magicAffinityHigh) {
        addMood(MoodTag.Magic, 1.0);
        addMood(MoodTag.Ethereal, 0.95);
    } else if (chunk.magicAffinity >= cfg.magicAffinityMedium) {
        addMood(MoodTag.Mysterious, 0.8);
    }

    /**
     * Factor 7: Human Presence
     * High human → Civilized, Historic
     * Some human → Abandoned
     */
    if (chunk.humanPresence >= cfg.humanPresenceHigh) {
        addMood(MoodTag.Civilized, 1.0);
        addMood(MoodTag.Historic, 0.85);
    } else if (chunk.humanPresence > 0) {
        addMood(MoodTag.Abandoned, 0.8);
    }

    /**
     * Factor 8: Terrain Type
     * Each terrain has inherent moods applied at full strength
     */
    const terrainMoods = TERRAIN_MOODS[chunk.terrain] ?? [];
    terrainMoods.forEach((mood) => {
        addMood(mood, 0.95); // Terrain moods at high strength but allow factors to override
    });

    /**
     * Convert map to sorted array (highest strength first)
     */
    const profiles = Array.from(moodMap.entries()).map(([mood, strength]) => ({
        mood,
        strength: Math.round(strength * 100) / 100, // Round to 2 decimals
    }));

    return profiles.sort((a, b) => b.strength - a.strength);
}

/**
 * Shorthand: Get mood tags only (without strength values).
 * Useful for template filtering where only presence matters.
 *
 * @param chunk - Current environment
 * @param config - Optional configuration override
 * @returns Array of MoodTag enums
 */
export function getMoodTags(chunk: Chunk, config?: Partial<MoodAnalysisConfig>): MoodTag[] {
    return analyzeMood(chunk, config).map((p) => p.mood);
}

/**
 * Get mood strength for a specific mood tag.
 * Returns 0 if mood not present.
 *
 * @param chunk - Current environment
 * @param moodTag - Specific mood to query
 * @param config - Optional configuration override
 * @returns Strength value 0-1
 */
export function getMoodStrength(
    chunk: Chunk,
    moodTag: MoodTag,
    config?: Partial<MoodAnalysisConfig>,
): number {
    const moods = analyzeMood(chunk, config);
    return moods.find((m) => m.mood === moodTag)?.strength ?? 0;
}

/**
 * Get the primary (highest strength) mood.
 * Useful for default lexicon filtering when multiple moods present.
 *
 * @param chunk - Current environment
 * @param config - Optional configuration override
 * @returns Strongest MoodProfile, or undefined if no moods
 */
export function getPrimaryMood(
    chunk: Chunk,
    config?: Partial<MoodAnalysisConfig>,
): MoodProfile | undefined {
    const moods = analyzeMood(chunk, config);
    return moods.length > 0 ? moods[0] : undefined;
}

export default { analyzeMood, getMoodTags, getMoodStrength, getPrimaryMood };
