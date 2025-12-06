/**
 * OVERVIEW: Text Emphasis Rules - Maps narrative keywords to visual emphasis styles.
 *
 * Purpose:
 *   Define which keywords/patterns should receive emphasis (bold, italic, color highlight)
 *   in narrative text. This adds visual polish without requiring new text generation.
 *
 * Approach:
 *   - Regex patterns for matching keywords
 *   - Style mapping: bold, italic, highlight (color)
 *   - Supports regex groups for flexible matching
 *   - Bilingual (pattern agnostic to language)
 *
 * Integration:
 *   - Called by NarrativePanel when rendering narrative entries
 *   - Returns styled JSX with <strong>, <em>, <span class="text-{color}">
 *
 * @module TextEmphasisRules
 */

/**
 * Emphasis style types.
 */
export type EmphasisStyle = 'bold' | 'italic' | 'highlight' | 'highlight-danger';

/**
 * Emphasis rule: Pattern to match keywords and the style to apply.
 */
export interface EmphasisRule {
    /** Unique identifier for the rule */
    id: string;
    /** Regex pattern to match keywords (use non-capturing groups for flexible matching) */
    pattern: RegExp;
    /** Style to apply: bold, italic, or color highlight */
    style: EmphasisStyle;
    /** Priority (higher = apply first, to avoid nested replacements) */
    priority?: number;
}

/**
 * Collection of emphasis rules for narrative text.
 * Applied in priority order (highest first) to avoid conflicts.
 */
const EMPHASIS_RULES: EmphasisRule[] = [
    // ===== BIOME/TERRAIN NAMES (Bold) =====
    // Pattern: names of biomes at word boundaries
    {
        id: 'biome_jungle',
        pattern: /\b(jungle|jungle's?|verdant|canopy|undergrowth|rainforest)\b/gi,
        style: 'bold',
        priority: 100,
    },
    {
        id: 'biome_cave',
        pattern: /\b(cave|cavern|cave's?|cavern's?|underground|subterranean|grotto|chasm|abyss)\b/gi,
        style: 'bold',
        priority: 100,
    },
    {
        id: 'biome_desert',
        pattern: /\b(desert|dune|dunes|wasteland|sand|sands|oasis|mirage|expanse|barren)\b/gi,
        style: 'bold',
        priority: 100,
    },
    {
        id: 'biome_forest',
        pattern: /\b(forest|forests?|woodland|tree|trees|grove|thicket|woods?|timberland)\b/gi,
        style: 'bold',
        priority: 100,
    },
    {
        id: 'biome_mountain',
        pattern: /\b(mountain|mountains|peak|peaks?|alpine|cliff|ridge|summit|slope|precipice)\b/gi,
        style: 'bold',
        priority: 100,
    },
    {
        id: 'biome_ocean',
        pattern: /\b(ocean|sea|seas?|shore|beach|tide|wave|waves?|current|deep|abyss|waters?)\b/gi,
        style: 'bold',
        priority: 100,
    },
    {
        id: 'biome_swamp',
        pattern: /\b(swamp|marsh|bog|wetland|murk|mire|quagmire|bog|fen|morass)\b/gi,
        style: 'bold',
        priority: 100,
    },

    // ===== PLAYER ACTIONS (Italic) =====
    // Pattern: verb phrases indicating player action
    {
        id: 'action_movement',
        pattern: /\b(you (?:go|go forth|move|walk|climb|descend|ascend|stride|venture|trek|trudge|slip|creep|dash|sprint|wander|roam|traverse|navigate))\b/gi,
        style: 'italic',
        priority: 90,
    },
    {
        id: 'action_discovery',
        pattern: /\b(you (?:discover|find|uncover|encounter|see|spot|notice|observe|glimpse|catch sight of|detect|perceive))\b/gi,
        style: 'italic',
        priority: 90,
    },
    {
        id: 'action_interaction',
        pattern: /\b(you (?:touch|grab|pick up|take|examine|inspect|study|investigate|search|explore|gather|collect))\b/gi,
        style: 'italic',
        priority: 90,
    },

    // ===== DANGER / THREATS (Highlight-Danger - Red) =====
    // Pattern: keywords indicating danger or hostility
    {
        id: 'danger_threat',
        pattern: /\b(danger|dangerous|threat|threatening|peril|menace|risk|hazard|hostile|aggressive|attack|assault|strike|strike at|assault|ambush|prowl|lurk|stalk)\b/gi,
        style: 'highlight-danger',
        priority: 80,
    },
    {
        id: 'danger_enemy',
        pattern: /\b(creature|creature's?|beast|monster|predator|hunter|enemy|enemies|foe|foes|assailant|attacker|combatant)\b/gi,
        style: 'highlight-danger',
        priority: 80,
    },
    {
        id: 'danger_death',
        pattern: /\b(death|die|dying|dead|corpse|bones|skull|fatal|mortal|slain|kill|killed|perish|consumed)\b/gi,
        style: 'highlight-danger',
        priority: 80,
    },
    {
        id: 'danger_damage',
        pattern: /\b(wound|wounds?|wounded|injury|injure|blood|bleeding|cut|cuts?|stab|stabbed|torn|ripped|shattered|destroyed|obliterated)\b/gi,
        style: 'highlight-danger',
        priority: 80,
    },
    {
        id: 'danger_weather',
        pattern: /\b(storm|storms?|thunder|lightning|tempest|tornado|hurricane|blizzard|avalanche|earthquake|flood|fire|wildfire|lava|magma)\b/gi,
        style: 'highlight-danger',
        priority: 80,
    },

    // ===== MAGIC / MYSTERIOUS (Highlight - Purple/Special) =====
    {
        id: 'magic_spell',
        pattern: /\b(spell|spell's?|magic|magical|enchant|enchanted|curse|cursed|hex|hexed|rune|runes?|arcane|mystical|sorcery|incantation)\b/gi,
        style: 'highlight',
        priority: 70,
    },
    {
        id: 'magic_mystery',
        pattern: /\b(mysterious|mystery|enigma|enigmatic|unkn own|strange|weird|odd|bizarre|peculiar|cryptic|obscure|veiled|shadowy|phantom|specter|ghost|spirit)\b/gi,
        style: 'highlight',
        priority: 70,
    },

    // ===== SENSORY / EMOTIONAL (Italic - subtle emphasis) =====
    {
        id: 'sensory_sound',
        pattern: /\b(sound|sounds?|hear|hearing|whisper|whispers?|rustle|rustling|crackle|crackling|roar|roaring|thunder|echo|echoing|silence|silent)\b/gi,
        style: 'italic',
        priority: 60,
    },
    {
        id: 'sensory_sight',
        pattern: /\b(see|sees?|sight|view|glimpse|glimmer|gleam|shimmer|glow|glowing|flicker|flickering|darkness|shadows?|light|illuminat|darkness)\b/gi,
        style: 'italic',
        priority: 60,
    },
    {
        id: 'sensory_scent',
        pattern: /\b(smell|smells?|scent|scents?|odor|odors?|aroma|fragrance|stench|rank|pungent|sweet|acrid|fresh|musty)\b/gi,
        style: 'italic',
        priority: 60,
    },

    // ===== EMOTION / MOOD (Italic) =====
    {
        id: 'mood_fear',
        pattern: /\b(fear|afraid|terror|terrified|dread|horror|horrified|panic|panicked|anxiety|anxious)\b/gi,
        style: 'italic',
        priority: 50,
    },
    {
        id: 'mood_wonder',
        pattern: /\b(wonder|amazed?|amazing|awe|awestruck|astonished|astounded|breathtaking|magnificent|splendid|beautiful)\b/gi,
        style: 'italic',
        priority: 50,
    },
];

/**
 * Apply emphasis rules to narrative text.
 * Returns array of text nodes and styled spans for React rendering.
 *
 * Algorithm:
 *   1. Sort rules by priority (highest first)
 *   2. For each rule, find all matches in text
 *   3. Replace matched text with styled span markers
 *   4. Build JSX nodes with <strong>, <em>, <span> elements
 *
 * @param text - Raw narrative text
 * @returns Array of {type: 'text'|'emphasis', content: string, style?: EmphasisStyle}
 *
 * @example
 * ```typescript
 * const text = "You discover a jungle cave with mysterious danger!";
 * const emphasized = applyEmphasisRules(text);
 * // Returns:
 * // [
 * //   {type: 'text', content: 'You discover a '},
 * //   {type: 'emphasis', content: 'jungle', style: 'bold'},
 * //   {type: 'text', content: ' '},
 * //   {type: 'emphasis', content: 'cave', style: 'bold'},
 * //   ... etc
 * // ]
 * ```
 */
export function applyEmphasisRules(
    text: string,
): Array<{ type: 'text' | 'emphasis'; content: string; style?: EmphasisStyle }> {
    if (!text || text.length === 0) return [];

    // Sort rules by priority
    const sorted = [...EMPHASIS_RULES].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // Track replacements to avoid overlapping
    const replacements: Array<{ start: number; end: number; rule: EmphasisRule; match: string }> = [];

    for (const rule of sorted) {
        const matches = text.matchAll(rule.pattern);
        for (const match of matches) {
            const start = match.index ?? 0;
            const end = start + match[0].length;

            // Check for overlap with existing replacements
            const overlaps = replacements.some((r) => (start < r.end && end > r.start) || (r.start < end && r.end > start));

            if (!overlaps) {
                replacements.push({ start, end, rule, match: match[0] });
            }
        }
    }

    if (replacements.length === 0) {
        return [{ type: 'text', content: text }];
    }

    // Sort by position
    replacements.sort((a, b) => a.start - b.start);

    // Build result nodes
    const result: Array<{ type: 'text' | 'emphasis'; content: string; style?: EmphasisStyle }> = [];
    let lastEnd = 0;

    for (const replacement of replacements) {
        // Add text before this replacement
        if (lastEnd < replacement.start) {
            result.push({
                type: 'text',
                content: text.substring(lastEnd, replacement.start),
            });
        }

        // Add the emphasized part
        result.push({
            type: 'emphasis',
            content: replacement.match,
            style: replacement.rule.style,
        });

        lastEnd = replacement.end;
    }

    // Add remaining text
    if (lastEnd < text.length) {
        result.push({
            type: 'text',
            content: text.substring(lastEnd),
        });
    }

    return result;
}

/**
 * Get Tailwind class for emphasis style.
 *
 * @param style - EmphasisStyle
 * @returns Tailwind class string
 */
export function getEmphasisClass(style: EmphasisStyle): string {
    switch (style) {
        case 'bold':
            return 'font-bold text-foreground';
        case 'italic':
            return 'italic text-muted-foreground';
        case 'highlight':
            return 'bg-violet-200 dark:bg-violet-900 font-medium';
        case 'highlight-danger':
            return 'bg-red-200 dark:bg-red-900 font-medium text-red-900 dark:text-red-100';
        default:
            return '';
    }
}

export default { applyEmphasisRules, getEmphasisClass, EMPHASIS_RULES };
