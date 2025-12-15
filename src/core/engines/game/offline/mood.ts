/**
 * Chunk Mood Analysis
 *
 * @remarks
 * Analyzes chunk properties to determine dominant mood tags based
 * on numeric ranges (0-100 for most attributes). Each property
 * contributes specific moods that are combined and deduplicated.
 */

import type { Chunk, MoodTag } from "@/core/types/game";

/**
 * Analyzes chunk attributes to determine dominant mood tags.
 *
 * @remarks
 * **Logic:**
 * 1. **Danger Level** (0-100): High (≥70) → "Danger", "Foreboding", "Threatening"; Medium (≥40) → "Threatening"
 * 2. **Light Level** (-100 to 100): Very dark (≤10) → "Dark", "Gloomy", "Mysterious"; Dim (<50) → "Mysterious", "Gloomy"; Bright (≥80) → "Vibrant", "Peaceful"
 * 3. **Moisture** (0-100): High (≥80) → "Lush", "Wet", "Vibrant"; Low (≤20) → "Arid", "Desolate"
 * 4. **Predator Presence** (0-100): High (≥60) → "Danger", "Wild"
 * 5. **Magic Affinity** (0-100): High (≥70) → "Magic", "Mysterious", "Ethereal"; Medium (≥40) → "Mysterious"
 * 6. **Human Presence** (0-100): High (≥60) → "Civilized", "Historic"; Any (>0) → "Abandoned"
 * 7. **Temperature** (-30 to 50°C): Hot (≥40) → "Hot", "Harsh"; Cold (≤0) → "Cold", "Harsh"; Mild (15-30) → "Peaceful"
 * 8. **Terrain** (string): Each terrain type maps to specific moods (swamp, desert, mountain, forest, cave, jungle, volcanic, ocean, city, tundra)
 *
 * @param chunk - Chunk data to analyze
 * @returns Array of mood tags (deduplicated)
 */
export const analyze_chunk_mood = (chunk: Chunk): MoodTag[] => {
    const moods: MoodTag[] = [];

    // 1. Danger Level
    if (chunk.dangerLevel >= 70) {
        moods.push("Danger", "Foreboding", "Threatening");
    } else if (chunk.dangerLevel >= 40) {
        moods.push("Threatening");
    }

    // 2. Light Level
    if (chunk.lightLevel <= 10) {
        moods.push("Dark", "Gloomy", "Mysterious");
    } else if (chunk.lightLevel < 50) {
        moods.push("Mysterious", "Gloomy");
    } else if (chunk.lightLevel >= 80) {
        moods.push("Vibrant", "Peaceful");
    }

    // 3. Moisture
    if (chunk.moisture >= 80) {
        moods.push("Lush", "Wet", "Vibrant");
    } else if (chunk.moisture <= 20) {
        moods.push("Arid", "Desolate");
    }

    // 4. Predator Presence
    if (chunk.predatorPresence >= 60) {
        moods.push("Danger", "Wild");
    }

    // 5. Magic Affinity
    if (chunk.magicAffinity >= 70) {
        moods.push("Magic", "Mysterious", "Ethereal");
    } else if (chunk.magicAffinity >= 40) {
        moods.push("Mysterious");
    }

    // 6. Human Presence
    if (chunk.humanPresence >= 60) {
        moods.push("Civilized", "Historic");
    } else if (chunk.humanPresence > 0) {
        moods.push("Abandoned");
    }

    // 7. Temperature
    const temp: number = (chunk.temperature ?? NaN) as number;
    if (Number.isFinite(temp) && temp >= 40) {
        moods.push("Hot", "Harsh");
    } else if (Number.isFinite(temp) && temp <= 0) {
        moods.push("Cold", "Harsh");
    } else if (Number.isFinite(temp) && temp > 15 && temp < 30) {
        moods.push("Peaceful");
    }

    // 8. Terrain
    switch (chunk.terrain) {
        case "swamp":
            moods.push("Gloomy", "Wet", "Mysterious");
            break;
        case "desert":
            moods.push("Arid", "Desolate", "Harsh");
            break;
        case "mountain":
            moods.push("Harsh", "Rugged", "Elevated");
            break;
        case "forest":
            moods.push("Lush", "Peaceful");
            break;
        case "cave":
            moods.push("Dark", "Mysterious", "Foreboding", "Confined");
            break;
        case "jungle":
            moods.push("Lush", "Vibrant", "Mysterious", "Wild");
            break;
        case "volcanic":
            moods.push("Danger", "Harsh", "Smoldering");
            break;
        case "ocean":
        case "underwater":
            moods.push("Serene", "Mysterious", "Vast");
            break;
        case "city":
        case "space_station":
            moods.push("Civilized", "Structured");
            break;
        case "tundra":
            moods.push("Cold", "Desolate", "Barren");
            break;
    }

    return Array.from(new Set(moods));
};

/**
 * Determines if a template's mood tags overlap with current chunk moods.
 *
 * @remarks
 * Returns true if any template mood matches any current mood.
 * Empty template moods are treated as matching everything.
 *
 * @param template_moods - Moods required by the template
 * @param current_moods - Moods of the current chunk
 * @returns True if there is overlap or template has no mood restrictions
 */
export const has_mood_overlap = (template_moods: MoodTag[], current_moods: MoodTag[]): boolean => {
    if (!template_moods || template_moods.length === 0) return true;
    if (!current_moods || current_moods.length === 0) return false;
    return template_moods.some(mood => current_moods.includes(mood));
};
