/**
 * OVERVIEW: Narrative Template Registry
 *
 * Central registry for all narrative templates. Provides utilities for template
 * selection by mood, terrain, and priority.
 */

import type { NarrativeTemplate } from './template-schema';
import { jungleOpeningTemplate } from './templates/jungle_opening';
import { caveOpeningTemplate } from './templates/cave_opening';
import { mountainClimbTemplate } from './templates/mountain_climb';
import { waterEncounterTemplate } from './templates/water_encounter';
import { weatherStormTemplate } from './templates/weather_storm';
import { desertOpeningTemplate } from './templates/desert_opening';
import { forestDiscoveryTemplate } from './templates/forest_discovery';
import { movementTiredTemplate } from './templates/movement_tired';
import { biomeTransitionTemplate } from './templates/biome_transition';
import { dangerEncounterTemplate } from './templates/danger_encounter';

/**
 * Master registry of all narrative templates
 */
export const NARRATIVE_TEMPLATES: NarrativeTemplate[] = [
    jungleOpeningTemplate,
    caveOpeningTemplate,
    mountainClimbTemplate,
    waterEncounterTemplate,
    weatherStormTemplate,
    desertOpeningTemplate,
    forestDiscoveryTemplate,
    movementTiredTemplate,
    biomeTransitionTemplate,
    dangerEncounterTemplate,
];

/**
 * Get all templates matching a specific mood
 */
export function getTemplatesByMood(moodTag: string): NarrativeTemplate[] {
    return NARRATIVE_TEMPLATES.filter((template) => template.tags.includes(moodTag));
}

/**
 * Get all templates for a specific terrain
 */
export function getTemplatesByTerrain(terrain: string): NarrativeTemplate[] {
    return NARRATIVE_TEMPLATES.filter((template) => template.terrain.includes(terrain as any));
}

/**
 * Get all templates in a specific category
 */
export function getTemplatesByCategory(category: string): NarrativeTemplate[] {
    return NARRATIVE_TEMPLATES.filter((template) => template.category === category);
}

/**
 * Select best matching template for given criteria
 * Priority: explicit mood tags match > terrain match > category match > random
 */
export function selectTemplateForNarrative(options: {
    mood?: string[];
    terrain?: string;
    category?: string;
    excludeIds?: string[];
}): NarrativeTemplate | undefined {
    const { mood, terrain, category, excludeIds = [] } = options;

    // Filter by excluded IDs
    let candidates = NARRATIVE_TEMPLATES.filter((t) => !excludeIds.includes(t.id));

    // Phase 1: Match by mood tags (highest priority)
    if (mood && mood.length > 0) {
        const moodMatches = candidates.filter((t) => mood.some((m) => t.tags.includes(m)));
        if (moodMatches.length > 0) {
            candidates = moodMatches;
        }
    }

    // Phase 2: Match by terrain
    if (terrain) {
        const terrainMatches = candidates.filter((t) => t.terrain.includes(terrain as any));
        if (terrainMatches.length > 0) {
            candidates = terrainMatches;
        }
    }

    // Phase 3: Match by category
    if (category) {
        const categoryMatches = candidates.filter((t) => t.category === category);
        if (categoryMatches.length > 0) {
            candidates = categoryMatches;
        }
    }

    if (candidates.length === 0) {
        return undefined;
    }

    // Sort by priority (descending), then by weight (descending)
    candidates.sort((a, b) => {
        const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        return (b.weight ?? 1.0) - (a.weight ?? 1.0);
    });

    // Random selection weighted by weight
    const totalWeight = candidates.reduce((sum, t) => sum + (t.weight ?? 1.0), 0);
    let random = Math.random() * totalWeight;

    for (const template of candidates) {
        random -= template.weight ?? 1.0;
        if (random <= 0) {
            return template;
        }
    }

    return candidates[0];
}

/**
 * Get all available template IDs
 */
export function getAllTemplateIds(): string[] {
    return NARRATIVE_TEMPLATES.map((t) => t.id);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): NarrativeTemplate | undefined {
    return NARRATIVE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get template statistics (for debugging/analytics)
 */
export function getTemplateStats() {
    return {
        total: NARRATIVE_TEMPLATES.length,
        byCategory: {
            opening: NARRATIVE_TEMPLATES.filter((t) => t.category === 'opening').length,
            transition: NARRATIVE_TEMPLATES.filter((t) => t.category === 'transition').length,
            action: NARRATIVE_TEMPLATES.filter((t) => t.category === 'action').length,
            weather: NARRATIVE_TEMPLATES.filter((t) => t.category === 'weather').length,
            discovery: NARRATIVE_TEMPLATES.filter((t) => t.category === 'discovery').length,
            danger: NARRATIVE_TEMPLATES.filter((t) => t.category === 'danger').length,
        },
    };
}
