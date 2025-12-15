/**
 * Narrative Template Processing
 *
 * @remarks
 * Functions for selecting, validating, and filling narrative templates
 * with chunk-specific data. Handles template filtering, weighting, and
 * placeholder replacement.
 */

import type { Chunk, NarrativeLength, NarrativeTemplate, ConditionType, Language, PlayerStatus, World, ItemDefinition } from "@/core/types/game";
import { getTranslatedText } from "@/lib/utils";
import type { TranslationKey } from "@/lib/core/i18n";
import { logger } from "@/lib/core/logger";
import { isDay } from "@/lib/utils/time/time-utils";
import { biomeNarrativeTemplates } from "@/core/data/narrative/templates";

/**
 * Determines sentence count limits based on narrative length.
 *
 * @remarks
 * Used to control output verbosity:
 * - "short" (1-2 sentences) for quick feedback
 * - "medium" (2-4 sentences) for balanced output
 * - "long"/"detailed" (4-7 sentences) for rich descriptions
 *
 * @param narrativeLength - Requested narrative length level
 * @returns Object with `min_s` and `max_s` sentence counts
 */
export const get_sentence_limits = (narrativeLength: NarrativeLength): { min_s: number; max_s: number; } => {
    switch (narrativeLength) {
        case "short":
            return { min_s: 1, max_s: 2 };
        case "medium":
            return { min_s: 2, max_s: 4 };
        case "long":
        case "detailed":
            return { min_s: 4, max_s: 7 };
        default:
            return { min_s: 1, max_s: 2 };
    }
};

/**
 * Checks if a template's conditions are met by the current chunk/player state.
 *
 * @remarks
 * **Condition Types:**
 * - **timeOfDay**: "day" or "night" (uses isDay utility)
 * - **soilType**: Array of acceptable soil types
 * - **playerHealth**: `{ min: number, max: number }`
 * - **playerStamina**: `{ min: number, max: number }`
 * - **requiredEntities**: `{ enemyType?: string, itemType?: string }`
 * - **Numeric ranges**: `{ min: number, max: number }` for any chunk property
 *
 * Empty/undefined conditions always return true.
 *
 * @param template_conditions - Conditions object from template
 * @param chunk - Current chunk state
 * @param playerState - Optional player state for health/stamina checks
 * @returns True if all conditions are satisfied
 */
export const check_conditions = (template_conditions: ConditionType | undefined, chunk: Chunk, playerState?: PlayerStatus): boolean => {
    if (!template_conditions) return true;

    for (const key in template_conditions) {
        if (!Object.prototype.hasOwnProperty.call(template_conditions, key)) continue;

        const conditionValue = (template_conditions as any)[key];
        const chunkValue = (chunk as any)[key];

        // Handle special string-based conditions
        if (key === 'timeOfDay') {
            const gameTime = (chunk as any).gameTime;
            if (gameTime === undefined) continue;
            const defaultStartTime = 360;
            const defaultDayDuration = 1440;
            const isCurrentDay = isDay(gameTime, defaultStartTime, defaultDayDuration);
            if (conditionValue === 'day' && !isCurrentDay) return false;
            if (conditionValue === 'night' && isCurrentDay) return false;
            continue;
        }

        if (key === 'soilType') {
            if (Array.isArray(conditionValue) && !conditionValue.includes(chunk.soilType)) return false;
            continue;
        }

        // Handle player-based conditions
        if (key === 'playerHealth' && playerState) {
            if (playerState.hp < (conditionValue.min ?? 0) || playerState.hp > (conditionValue.max ?? 100)) return false;
            continue;
        }

        if (key === 'playerStamina' && playerState) {
            if (playerState.stamina < (conditionValue.min ?? 0) || playerState.stamina > (conditionValue.max ?? 100)) return false;
            continue;
        }

        // Handle entity presence checks
        if (key === 'requiredEntities') {
            const { enemyType, itemType } = conditionValue;
            let entityFound = false;
            if (enemyType && chunk.enemy && chunk.enemy.type && getTranslatedText(chunk.enemy.type, 'vi') === enemyType) {
                entityFound = true;
            }
            if (itemType && !entityFound) {
                if (chunk.items.some(item => getTranslatedText(item.name, 'vi') === itemType)) {
                    entityFound = true;
                }
            }
            if (!entityFound && (enemyType || itemType)) return false;
            continue;
        }

        // Handle generic numerical range conditions
        if (typeof chunkValue === 'number' && typeof conditionValue === 'object' && conditionValue !== null) {
            if (chunkValue < (conditionValue.min ?? -Infinity) || chunkValue > (conditionValue.max ?? Infinity)) return false;
        }
    }

    return true;
};

/**
 * Selects a template from a list using weighted random selection.
 *
 * @remarks
 * **Algorithm:**
 * 1. Calculate total weight (default weight per template: 0.5)
 * 2. Generate random number in range [0, totalWeight)
 * 3. Iterate templates, subtracting their weight until random ≤ 0
 * 4. Return first template where random becomes non-positive
 *
 * Fallback: returns first template if no selection made (safety).
 *
 * @param templates - Array of templates to choose from
 * @returns Selected template
 * @throws Error if templates array is empty
 */
export const select_template_by_weight = (templates: NarrativeTemplate[]): NarrativeTemplate => {
    if (templates.length === 0) throw new Error("No templates provided for weighted selection.");
    const totalWeight = templates.reduce((sum, tmpl) => sum + (tmpl.weight || 0.5), 0);
    let randomNum = Math.random() * totalWeight;

    for (const tmpl of templates) {
        randomNum -= (tmpl.weight || 0.5);
        if (randomNum <= 0) return tmpl;
    }
    return templates[0];
};

/**
 * Fills template placeholders with chunk, biome, and player-specific data.
 *
 * @remarks
 * **Placeholder Types:**
 * - **Biome placeholders** `{{keyword}}`: Replaced with random value from biome templates (adjectives, features, smells, sounds, sky)
 * - **Numeric placeholders** `{light_level_detail}`, `{temp_detail}`, etc.: Replaced with translations based on chunk values
 * - **Entity placeholders** `{enemy_name}`, `{item_found}`: Replaced with current enemies/items or translation fallbacks
 * - **Player placeholders** `{player_health_status}`, `{player_stamina_status}`: Replaced based on player state
 *
 * Unknown placeholders are logged as warnings and replaced with empty strings.
 *
 * @param template_string - Template text with placeholders
 * @param chunk - Current chunk state
 * @param world - World context
 * @param playerPosition - Current player position
 * @param t - Translation function
 * @param language - Language code
 * @param playerState - Optional player state for health/stamina placeholders
 * @returns Filled template string
 */
export const fill_template = (
    template_string: string,
    chunk: Chunk,
    world: World,
    playerPosition: { x: number; y: number; },
    t: (key: TranslationKey, replacements?: any) => string,
    language: Language,
    playerState?: PlayerStatus
): string => {
    let filled_template = template_string;
    const currentBiomeName: string = chunk.terrain;

    // Lookup biome templates with case-insensitive fallback
    let biomeTemplateData = biomeNarrativeTemplates[currentBiomeName];
    if (!biomeTemplateData) {
        const lower = currentBiomeName.toLowerCase();
        biomeTemplateData = biomeNarrativeTemplates[lower] || biomeNarrativeTemplates[currentBiomeName.charAt(0).toUpperCase() + currentBiomeName.slice(1)];
    }
    if (!biomeTemplateData) {
        biomeTemplateData = Object.values(biomeNarrativeTemplates).find((b: any) => b && b.terrain && String(b.terrain).toLowerCase() === String(currentBiomeName).toLowerCase()) as any;
    }

    if (!biomeTemplateData) {
        logger.warn(`Placeholder data not found for ${chunk.terrain}`);
        return template_string;
    }

    // Replace biome placeholders {{keyword}}
    filled_template = filled_template.replace(/{{(.*?)}}/g, (match, p1) => {
        const key = p1.trim();
        const category =
            (biomeTemplateData.adjectives as any)[key] ||
            (biomeTemplateData.features as any)[key] ||
            (biomeTemplateData.smells as any)[key] ||
            (biomeTemplateData.sounds as any)[key] ||
            (biomeTemplateData.sky ? (biomeTemplateData.sky as any)[key] : undefined);
        if (category && Array.isArray(category) && category.length > 0) {
            return category[Math.floor(Math.random() * category.length)];
        }
        logger.warn(`Placeholder category not found or empty: ${p1}`);
        return '';
    });

    // Replace numeric/sensory placeholders
    filled_template = filled_template.replace('{light_level_detail}', () => chunk.lightLevel <= 10 ? t('light_level_dark') : chunk.lightLevel < 50 ? t('light_level_dim') : t('light_level_normal'));
    filled_template = filled_template.replace('{temp_detail}', () => chunk.temperature && chunk.temperature <= 0 ? t('temp_cold') : chunk.temperature && chunk.temperature >= 40 ? t('temp_hot') : t('temp_mild'));
    filled_template = filled_template.replace('{moisture_detail}', () => chunk.moisture >= 80 ? t('moisture_humid') : chunk.moisture <= 20 ? t('moisture_dry') : t('moisture_normal'));
    filled_template = filled_template.replace('{jungle_feeling_dark}', t('jungle_feeling_dark_phrase'));

    // Replace entity placeholders
    filled_template = filled_template.replace(/{enemy_name}/g, chunk.enemy && chunk.enemy.type ? getTranslatedText(chunk.enemy.type, language, t) : t('no_enemy_found'));
    filled_template = filled_template.replace(/{item_found}/g, chunk.items && chunk.items.length > 0 ? getTranslatedText(chunk.items[Math.floor(Math.random() * chunk.items.length)].name, language, t) : t('no_item_found'));

    // Replace player state placeholders
    if (playerState) {
        filled_template = filled_template.replace('{player_health_status}', playerState.hp < 30 ? t('player_health_low') : t('player_health_normal'));
        filled_template = filled_template.replace('{player_stamina_status}', playerState.stamina < 30 ? t('player_stamina_low') : t('player_stamina_normal'));
    }

    return filled_template;
};
