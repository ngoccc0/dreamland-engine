/**
 * @overview
 * Advanced ambience engine for dynamic multi-layer soundscape.
 * Selects ambience tracks based on biome, time of day, weather, and mood.
 * Supports layering multiple ambience tracks simultaneously.
 */

import { AMBIENCE_TRACKS, BIOME_AMBIENCE_MAP } from './assets';
import type { MoodTag } from '@/core/types/game';

/**
 * Ambience context containing all factors for selection.
 */
export interface AmbienceContext {
    biome?: string | null;
    mood?: MoodTag[] | null;
    timeOfDay?: 'day' | 'night';
    weather?: {
        type?: string;
        moisture?: number;
        windLevel?: number;
        lightLevel?: number;
    };
}

/**
 * Selected ambience layer with properties.
 */
export interface AmbienceLayer {
    track: string;
    volume: number; // 0-1
    fadeInMs?: number;
    fadeOutMs?: number;
}

/**
 * Get primary biome-based ambience category.
 */
function getBiomeCategory(biome?: string | null): string | null {
    if (!biome) return null;
    const biomeLower = String(biome).toLowerCase().trim();
    return BIOME_AMBIENCE_MAP[biomeLower] || null;
}

/**
 * Get time-of-day ambience modifiers.
 * At night, prefer darker/spookier ambience.
 * During day, prefer brighter/nature sounds.
 */
function getTimeModifiers(timeOfDay?: 'day' | 'night'): string[] {
    if (timeOfDay === 'night') {
        return ['night', 'dark']; // night sounds, cicadas, etc.
    }
    return ['day', 'bright']; // birds, daylight sounds
}

/**
 * Get weather-based ambience priorities.
 * Rain/water sounds override other ambience when wet.
 * Wind becomes prominent in storms.
 */
function getWeatherModifiers(weather?: { type?: string; moisture?: number; windLevel?: number }): string[] {
    const modifiers: string[] = [];

    if (!weather) return modifiers;

    // High moisture → water/rain sounds
    if (weather.moisture !== undefined && weather.moisture > 70) {
        modifiers.push('rain', 'water');
    }

    // High wind → wind sounds
    if (weather.windLevel !== undefined && weather.windLevel > 60) {
        modifiers.push('wind');
    }

    // Weather type specific
    if (weather.type?.toLowerCase().includes('rain')) {
        modifiers.push('rain');
    } else if (weather.type?.toLowerCase().includes('storm')) {
        modifiers.push('rain', 'wind');
    }

    return modifiers;
}

/**
 * Get mood-based ambience priorities.
 * Dangerous/dark moods prefer eerie/cave sounds.
 * Peaceful moods prefer nature/water sounds.
 */
function getMoodModifiers(mood?: MoodTag[] | null): string[] {
    if (!mood || mood.length === 0) return [];

    const modifiers: string[] = [];
    const moodSet = new Set(mood.map(m => String(m).toLowerCase()));

    // Map moods to ambience categories
    if (moodSet.has('dark') || moodSet.has('gloomy') || moodSet.has('foreboding')) {
        modifiers.push('cave', 'night');
    }
    if (moodSet.has('peaceful') || moodSet.has('serene')) {
        modifiers.push('nature', 'water', 'day');
    }
    if (moodSet.has('wet') || moodSet.has('lush')) {
        modifiers.push('water', 'nature');
    }
    if (moodSet.has('harsh') || moodSet.has('threatening') || moodSet.has('danger')) {
        modifiers.push('cave', 'wind');
    }
    if (moodSet.has('vibrant') || moodSet.has('wild')) {
        modifiers.push('forest', 'nature');
    }
    if (moodSet.has('mysterious') || moodSet.has('ethereal')) {
        modifiers.push('night', 'cave');
    }

    return modifiers;
}

/**
 * Select single ambience track matching criteria.
 * Priority order: weather modifiers > mood modifiers > time modifiers > biome base
 */
export function selectAmbienceTrack(context: AmbienceContext): string | null {
    // Get all possible categories
    const categories: string[] = [];

    // 1. Biome base category
    const biomeCat = getBiomeCategory(context.biome);
    if (biomeCat) categories.push(biomeCat);

    // 2. Modifiers by priority (highest = most override)
    const weatherMods = getWeatherModifiers(context.weather);
    const moodMods = getMoodModifiers(context.mood);
    const timeMods = getTimeModifiers(context.timeOfDay);

    // Build priority: weather > mood > time > biome
    if (weatherMods.length > 0) categories.unshift(...weatherMods);
    if (moodMods.length > 0) categories.unshift(...moodMods);
    if (timeMods.length > 0) categories.push(...timeMods); // Lower priority

    // Remove duplicates, maintaining order
    const uniqueCategories = Array.from(new Set(categories));

    // Try to find track matching highest priority category
    for (const cat of uniqueCategories) {
        const tracks = (AMBIENCE_TRACKS as Record<string, readonly string[]>)[cat.toLowerCase()];
        if (tracks && tracks.length > 0) {
            const randomIndex = Math.floor(Math.random() * tracks.length);
            return tracks[randomIndex];
        }
    }

    return null;
}

/**
 * Select multiple ambience layers for layering.
 * Can combine complementary ambience (e.g., forest birds + rain).
 * Returns array of layer selections with volume adjustments.
 */
export function selectAmbienceLayers(context: AmbienceContext, maxLayers: number = 2): AmbienceLayer[] {
    const layers: AmbienceLayer[] = [];
    const usedCategories = new Set<string>();

    // Get modifiers in priority order
    const weatherMods = getWeatherModifiers(context.weather);
    const moodMods = getMoodModifiers(context.mood);
    const timeMods = getTimeModifiers(context.timeOfDay);
    const biomeCat = getBiomeCategory(context.biome);

    // Build category queue by priority
    const categoryQueue: Array<{ cat: string; priority: number }> = [];

    weatherMods.forEach(cat => categoryQueue.push({ cat, priority: 3 }));
    moodMods.forEach(cat => categoryQueue.push({ cat, priority: 2 }));
    timeMods.forEach(cat => categoryQueue.push({ cat, priority: 2 }));
    if (biomeCat) categoryQueue.push({ cat: biomeCat, priority: 1 });

    // Sort by priority descending
    categoryQueue.sort((a, b) => b.priority - a.priority);

    // Select layers, avoiding duplicates
    for (const { cat } of categoryQueue) {
        if (layers.length >= maxLayers) break;
        if (usedCategories.has(cat)) continue;

        const tracks = (AMBIENCE_TRACKS as Record<string, readonly string[]>)[cat.toLowerCase()];
        if (!tracks || tracks.length === 0) continue;

        const randomIndex = Math.floor(Math.random() * tracks.length);
        const track = tracks[randomIndex];

        // Calculate volume based on layer position and compatibility
        const volume = layers.length === 0 ? 1.0 : 0.6;

        layers.push({
            track,
            volume,
            fadeInMs: 2500,  // Longer fade-in (2.5 seconds)
            fadeOutMs: 2500, // Fade-out duration for smooth exit
        });

        usedCategories.add(cat);
    }

    return layers;
}

/**
 * Get full path to ambience track in /public/asset/sound/ambience/
 */
export function getAmbiencePath(filename: string): string {
    return `/asset/sound/ambience/${filename}`;
}

/**
 * Get all paths for ambience layers.
 */
export function getAmbienceLayerPaths(layers: AmbienceLayer[]): string[] {
    return layers.map(layer => getAmbiencePath(layer.track));
}

/**
 * Convert ambience context from game chunk and related state.
 * This is the integration point from game engine.
 */
export function buildAmbienceContext(
    biome: string | null | undefined,
    moods: MoodTag[] | null | undefined,
    timeOfDay: 'day' | 'night' | undefined,
    weather?: {
        type?: string;
        moisture?: number;
        windLevel?: number;
        lightLevel?: number;
    }
): AmbienceContext {
    return {
        biome,
        mood: moods,
        timeOfDay,
        weather,
    };
}
