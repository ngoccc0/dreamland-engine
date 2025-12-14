/**
 * Narrative Selection Rules Module - Pure game logic for text generation
 *
 * Handles dynamic narrative selection, template building, and placeholder validation.
 * All functions are pure (no side effects, deterministic, testable).
 *
 * @remarks
 * Used by narrative usecases to generate player-facing text and story elements.
 * Does NOT handle persistence or state mutations—returns generated text only.
 */

/**
 * Selects appropriate narrative template based on context conditions.
 *
 * @remarks
 * **Formula:** `selectedTemplate = templates[contextKey][randomIndex]`
 *
 * **Logic:**
 * 1. Map context type to template category:
 *    - CREATURE_DEATH → death narratives
 *    - CREATURE_BIRTH → birth narratives
 *    - PLANT_GROW → growth narratives
 *    - ITEM_CRAFT → crafting narratives
 *    - EXPLORATION → discovery narratives
 * 2. Filter templates by intensity level (1-5):
 *    - intensity 1: calming, subtle language
 *    - intensity 3: balanced, moderate tone
 *    - intensity 5: dramatic, powerful language
 * 3. Select random template from filtered set
 * 4. Return template with placeholders (e.g., {{creatureName}})
 *
 * **Edge Cases:**
 * - Unknown context type → default to neutral template
 * - intensity out of range → clamp to 1-5
 * - No templates for context → return fallback
 *
 * @param contextType - Type of narrative event (CREATURE_DEATH, PLANT_GROW, etc.)
 * @param intensity - Narrative intensity 1-5 (1=subtle, 5=dramatic)
 * @param seed - Random seed for reproducibility
 * @returns Template string with {{placeholder}} markers
 *
 * @example
 * selectDynamicNarrative('CREATURE_DEATH', 3, 42)
 * → "The {{creatureName}} perished in {{location}}."
 *
 * selectDynamicNarrative('PLANT_GROW', 5, 42)
 * → "{{plantName}} SURGES TO LIFE with magnificent {{color}} flowers!"
 */
export function selectDynamicNarrative(
    contextType: string,
    intensity: number,
    seed: number
): string {
    // Clamp intensity
    const level = Math.max(1, Math.min(5, Math.floor(intensity)));

    // Template database by context and intensity
    const templates: Record<string, Record<number, string[]>> = {
        CREATURE_DEATH: {
            1: [
                'The {{creatureName}} passed away peacefully.',
                'The {{creatureName}} faded from the world.',
            ],
            3: [
                'The {{creatureName}} collapsed in {{location}}.',
                'The {{creatureName}} breathed its last.',
            ],
            5: [
                'The {{creatureName}} FELL in a final struggle at {{location}}!',
                'The {{creatureName}} perished in AGONY and DESPAIR!',
            ],
        },
        CREATURE_BIRTH: {
            1: [
                'A new {{creatureName}} emerged from the egg.',
                'A young {{creatureName}} took its first steps.',
            ],
            3: [
                'A {{creatureName}} was born in {{location}}!',
                'The eggs hatched, releasing {{creatureCount}} new {{creatureName}}!',
            ],
            5: [
                'A MAGNIFICENT {{creatureName}} BURST forth into the world!',
                '{{creatureCount}} powerful {{creatureName}} emerged TRIUMPHANTLY!',
            ],
        },
        PLANT_GROW: {
            1: [
                'The {{plantName}} grew slightly.',
                'The {{plantName}} appears healthier.',
            ],
            3: [
                'The {{plantName}} flourished in {{location}}.',
                'The {{plantName}} reached new heights.',
            ],
            5: [
                'The {{plantName}} EXPLODED with growth, its {{color}} flowers MAGNIFICENT!',
                'The {{plantName}} became a TOWERING TESTAMENT to nature\'s power!',
            ],
        },
        ITEM_CRAFT: {
            1: [
                'You crafted a {{itemName}}.',
                'A {{itemName}} was created.',
            ],
            3: [
                'You successfully crafted a {{itemName}}!',
                'A {{itemName}} materialized before you.',
            ],
            5: [
                'You FORGED a LEGENDARY {{itemName}} of IMMENSE POWER!',
                'A {{itemName}} of UNPARALLELED QUALITY emerged from your work!',
            ],
        },
        EXPLORATION: {
            1: [
                'You discovered {{location}}.',
                'You found something at {{location}}.',
            ],
            3: [
                'You uncovered {{location}} and its secrets!',
                'A new area, {{location}}, revealed itself.',
            ],
            5: [
                'You DISCOVERED THE MAGNIFICENT {{location}}!',
                '{{location}} REVEALED ITSELF in all its GLORY!',
            ],
        },
    };

    // Get templates for context type
    const contextTemplates = templates[contextType];
    if (!contextTemplates) {
        return `An event occurred at {{location}}.`; // fallback
    }

    // Get templates for intensity level
    const intensityTemplates = contextTemplates[level];
    if (!intensityTemplates || intensityTemplates.length === 0) {
        return `An event occurred.`; // double fallback
    }

    // Seeded random selection (deterministic)
    const index = seed % intensityTemplates.length;
    return intensityTemplates[index];
}

/**
 * Builds complete narrative by filling placeholders in template.
 *
 * @remarks
 * **Formula:** `narrative = template.replace({{key}}, values[key])`
 *
 * **Logic:**
 * 1. Find all {{placeholder}} patterns in template
 * 2. Match each placeholder to values object
 * 3. Replace {{key}} with values[key]
 * 4. Return complete narrative string
 * 5. Leave unmatched placeholders unchanged
 *
 * **Placeholder Format:**
 * - {{creatureName}}: Name of creature
 * - {{plantName}}: Name of plant
 * - {{itemName}}: Name of crafted item
 * - {{location}}: Location name
 * - {{color}}: Color description
 * - {{creatureCount}}: Number of creatures
 *
 * **Edge Cases:**
 * - Template with no placeholders → returned unchanged
 * - Missing value → placeholder left unchanged
 * - Null template → return empty string
 * - Circular references → not replaced
 *
 * @param template - Template string with {{placeholder}} markers
 * @param values - Object with placeholder values
 * @returns Complete narrative with placeholders filled
 *
 * @example
 * buildTemplate(
 *   'The {{creatureName}} grew in {{location}}.',
 *   { creatureName: 'Wolf', location: 'Forest' }
 * ) → 'The Wolf grew in Forest.'
 */
export function buildTemplate(
    template: string,
    values: Record<string, string | number>
): string {
    if (!template) {
        return '';
    }

    // Replace all {{placeholder}} patterns
    let result = template;

    // Find and replace placeholders
    const placeholderPattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    result = result.replace(placeholderPattern, (match, key) => {
        const value = values[key];
        if (value !== undefined && value !== null) {
            return String(value);
        }
        return match; // leave unmatched placeholder
    });

    return result;
}

/**
 * Validates that all required placeholders exist and are filled.
 *
 * @remarks
 * **Formula:** `valid = requiredPlaceholders ⊆ providedValues`
 *
 * **Logic:**
 * 1. Extract all {{placeholder}} names from template
 * 2. Check each placeholder exists in values object
 * 3. Verify value is not empty/null/undefined
 * 4. Return true if all required placeholders filled
 * 5. Return false if any placeholder missing
 *
 * **Validation Rules:**
 * - {{creatureName}} is required for creature contexts
 * - {{plantName}} is required for plant contexts
 * - {{itemName}} is required for craft contexts
 * - {{location}} is optional (can be empty)
 * - Empty strings count as valid (not null)
 *
 * **Edge Cases:**
 * - Template with no placeholders → true (always valid)
 * - values object is null → false (can't fill anything)
 * - Placeholder with empty string value → true (still counts)
 *
 * @param template - Template string with placeholders
 * @param values - Values object to fill placeholders
 * @returns true if all placeholders can be filled, false otherwise
 *
 * @example
 * validatePlaceholders(
 *   'The {{creatureName}} at {{location}}.',
 *   { creatureName: 'Wolf', location: 'Forest' }
 * ) → true
 *
 * validatePlaceholders(
 *   'The {{creatureName}} at {{location}}.',
 *   { creatureName: 'Wolf' }  // missing location
 * ) → false
 */
export function validatePlaceholders(
    template: string,
    values: Record<string, string | number | undefined | null>
): boolean {
    if (!template) {
        return true; // empty template is valid
    }

    if (!values) {
        return false; // can't validate without values object
    }

    // Extract all placeholder names
    const placeholderPattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    let match;
    const placeholders = new Set<string>();

    while ((match = placeholderPattern.exec(template)) !== null) {
        placeholders.add(match[1]);
    }

    // Check each placeholder exists and is filled
    for (const placeholder of placeholders) {
        const value = values[placeholder];
        // Value must be defined (null/undefined not allowed)
        if (value === null || value === undefined) {
            return false;
        }
    }

    return true;
}
