/**
 * Narrative Lexicon Selector
 *
 * OVERVIEW: Smart selection system for narrative adjectives and phrases based on
 * mood profiles, variation tiers, and bilingual support. This utility enables dynamic
 * lexicon selection that maintains narrative variety while respecting game state.
 *
 * Key Features:
 * - Tier-aware selection (standard/subtle/emphatic based on mood strength)
 * - Bilingual support (EN/VI with switchable context)
 * - Weighted random selection (prevents immediate repetition)
 * - Mood-based filtering (priority: high-priority moods first)
 * - Continuation context (action-type-aware phrase selection)
 *
 * Integration Points:
 * - MoodProfiler: Provides mood tags and strength metrics
 * - TextEmphasisRules: Highlights selected adjectives/nouns
 * - NarrativeState: Tracks recent selections to prevent repetition
 * - Template Registry: Uses continuation types from template categories
 */

import type { MoodTag } from '@/core/engines/MoodProfiler';
import { ENGLISH_LEXICON, getRandomAdjective as getRandomAdjectiveEN } from '@/lib/definitions/narrative/lexicon/en';
import { VIETNAMESE_LEXICON, getRandomAdjective as getRandomAdjectiveVI } from '@/lib/definitions/narrative/lexicon/vi';

/**
 * Lexicon selection options
 */
export interface LexiconSelectionOptions {
    /** Primary mood tag to select from */
    mood?: MoodTag;
    /** Additional mood tags for fallback selection */
    alternativeMoods?: MoodTag[];
    /** Variation tier preference (standard/subtle/emphatic) */
    tier?: 'standard' | 'subtle' | 'emphatic';
    /** Language selection (en/vi) */
    language?: 'en' | 'vi';
    /** Action type for continuation selection (movement/discovery/danger/weather/transition) */
    actionType?: string;
    /** Recently used adjectives to avoid (prevent immediate repetition) */
    excludeRecent?: string[];
    /** Mood strength (0-1) to influence tier selection */
    moodStrength?: number;
}

/**
 * Determine variation tier based on mood strength
 *
 * Algorithm:
 * - strength < 0.4: subtle tier preferred (60% subtle, 30% standard, 10% emphatic)
 * - 0.4-0.7: standard tier preferred (50% standard, 35% subtle, 15% emphatic)
 * - 0.7+: emphatic tier preferred (50% emphatic, 35% standard, 15% subtle)
 */
export function determineTier(moodStrength: number = 0.5): 'standard' | 'subtle' | 'emphatic' {
    if (moodStrength < 0.4) {
        const rand = Math.random();
        if (rand < 0.6) return 'subtle';
        if (rand < 0.9) return 'standard';
        return 'emphatic';
    }

    if (moodStrength >= 0.7) {
        const rand = Math.random();
        if (rand < 0.5) return 'emphatic';
        if (rand < 0.85) return 'standard';
        return 'subtle';
    }

    // 0.4-0.7: balanced distribution
    const rand = Math.random();
    if (rand < 0.5) return 'standard';
    if (rand < 0.85) return 'subtle';
    return 'emphatic';
}

/**
 * Select a random adjective based on mood and preferences
 *
 * Selection Algorithm:
 * 1. Filter by primary mood (if provided)
 * 2. Determine tier from mood strength
 * 3. Select random adjective from tier
 * 4. Exclude recently used adjectives
 * 5. Fall back to alternative moods if needed
 */
export function selectAdjective(options: LexiconSelectionOptions = {}): string | undefined {
    const {
        mood,
        alternativeMoods = [],
        tier = determineTier(options.moodStrength),
        language = 'en',
        excludeRecent = [],
        moodStrength = 0.5
    } = options;

    const lexicon = language === 'vi' ? VIETNAMESE_LEXICON : ENGLISH_LEXICON;
    const getRandomAdjective = language === 'vi' ? getRandomAdjectiveVI : getRandomAdjectiveEN;

    // Try primary mood first
    if (mood) {
        const adjective = getRandomAdjective(mood, tier);
        if (adjective && !excludeRecent.includes(adjective)) {
            return adjective;
        }
    }

    // Try alternative moods
    for (const altMood of alternativeMoods) {
        const adjective = getRandomAdjective(altMood, tier);
        if (adjective && !excludeRecent.includes(adjective)) {
            return adjective;
        }
    }

    // Try any available mood from lexicon
    const allMoods = Object.keys(lexicon.adjectives);
    const shuffled = allMoods.sort(() => Math.random() - 0.5);
    for (const moodKey of shuffled) {
        const adjective = getRandomAdjective(moodKey, tier);
        if (adjective && !excludeRecent.includes(adjective)) {
            return adjective;
        }
    }

    return undefined;
}

/**
 * Select a continuation phrase based on action type
 *
 * Selection Algorithm:
 * 1. Match action type in continuations
 * 2. Select random phrase
 * 3. Exclude recently used continuations
 * 4. Fall back to generic "transition" type if needed
 */
export function selectContinuation(options: LexiconSelectionOptions = {}): string | undefined {
    const {
        actionType = 'transition',
        language = 'en',
        excludeRecent = []
    } = options;

    const lexicon = language === 'vi' ? VIETNAMESE_LEXICON : ENGLISH_LEXICON;
    const continuations = (lexicon.continuations as any)[actionType];

    if (!continuations || continuations.length === 0) {
        // Fall back to transition type
        const transitionContinuations = (lexicon.continuations as any)['transition'];
        if (transitionContinuations && transitionContinuations.length > 0) {
            const filtered = transitionContinuations.filter((c: string) => !excludeRecent.includes(c));
            if (filtered.length > 0) {
                return filtered[Math.floor(Math.random() * filtered.length)];
            }
        }
        return undefined;
    }

    const filtered = continuations.filter((c: string) => !excludeRecent.includes(c));
    if (filtered.length === 0) {
        return continuations[Math.floor(Math.random() * continuations.length)];
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Select a transition phrase for narrative flow
 */
export function selectTransition(options: Pick<LexiconSelectionOptions, 'language' | 'excludeRecent'> = {}): string {
    const { language = 'en', excludeRecent = [] } = options;
    const lexicon = language === 'vi' ? VIETNAMESE_LEXICON : ENGLISH_LEXICON;
    const filtered = lexicon.transitionPhrases.filter((p: string) => !excludeRecent.includes(p));

    if (filtered.length === 0) {
        return lexicon.transitionPhrases[Math.floor(Math.random() * lexicon.transitionPhrases.length)];
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Select a descriptive noun for emphasis highlighting
 *
 * Used for identifying keywords that should be emphasized (bold/italic/highlight)
 * in narrative text. Helps highlight biomes, actions, and important concepts.
 */
export function selectDescriptiveNoun(options: Pick<LexiconSelectionOptions, 'language' | 'excludeRecent'> = {}): string | undefined {
    const { language = 'en', excludeRecent = [] } = options;
    const lexicon = language === 'vi' ? VIETNAMESE_LEXICON : ENGLISH_LEXICON;
    const filtered = lexicon.descriptiveNouns.filter((n: string) => !excludeRecent.includes(n));

    if (filtered.length === 0) {
        return lexicon.descriptiveNouns[Math.floor(Math.random() * lexicon.descriptiveNouns.length)];
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Get all adjectives for a specific mood and tier
 *
 * Useful for template variation or bulk operations
 */
export function getAdjectivesForMood(
    mood: string,
    tier?: 'standard' | 'subtle' | 'emphatic',
    language: 'en' | 'vi' = 'en'
): string[] {
    const lexicon = language === 'vi' ? VIETNAMESE_LEXICON : ENGLISH_LEXICON;
    const moodData = (lexicon.adjectives as any)[mood];

    if (!moodData) {
        return [];
    }

    if (tier) {
        return moodData[tier] || [];
    }

    // Return all tiers combined
    return [
        ...(moodData.standard || []),
        ...(moodData.subtle || []),
        ...(moodData.emphatic || [])
    ];
}

/**
 * Get all available mood tags in lexicon
 */
export function getAvailableMoods(language: 'en' | 'vi' = 'en'): string[] {
    const lexicon = language === 'vi' ? VIETNAMESE_LEXICON : ENGLISH_LEXICON;
    return Object.keys(lexicon.adjectives);
}

/**
 * Get all available action types for continuations
 */
export function getAvailableActionTypes(language: 'en' | 'vi' = 'en'): string[] {
    const lexicon = language === 'vi' ? VIETNAMESE_LEXICON : ENGLISH_LEXICON;
    return Object.keys(lexicon.continuations);
}

/**
 * Weighted random selection with frequency distribution
 *
 * Ensures diversity by limiting how often the same adjective can be selected
 * within a sliding window (e.g., last 10 selections)
 */
export class LexiconSelectionMemory {
    private recentSelections: string[] = [];
    private maxMemory: number = 10;

    constructor(maxMemory: number = 10) {
        this.maxMemory = maxMemory;
    }

    /**
     * Add a selection to history
     */
    record(selection: string): void {
        this.recentSelections.push(selection);
        if (this.recentSelections.length > this.maxMemory) {
            this.recentSelections.shift();
        }
    }

    /**
     * Get current memory (recently selected items)
     */
    getMemory(): string[] {
        return [...this.recentSelections];
    }

    /**
     * Clear all history
     */
    clear(): void {
        this.recentSelections = [];
    }

    /**
     * Check if selection is recent (within memory)
     */
    isRecent(selection: string): boolean {
        return this.recentSelections.includes(selection);
    }

    /**
     * Get selection frequency (count in recent memory)
     */
    getFrequency(selection: string): number {
        return this.recentSelections.filter(s => s === selection).length;
    }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Select an adjective for a specific mood
 * const adjective = selectAdjective({
 *   mood: 'Danger',
 *   moodStrength: 0.85,
 *   language: 'en',
 *   excludeRecent: ['dangerous', 'deadly']
 * });
 *
 * // Select a continuation for movement
 * const continuation = selectContinuation({
 *   actionType: 'movement',
 *   language: 'vi',
 *   excludeRecent: []
 * });
 *
 * // Use selection memory to prevent repetition
 * const memory = new LexiconSelectionMemory(10);
 * const adj = selectAdjective({
 *   mood: 'Bright',
 *   excludeRecent: memory.getMemory()
 * });
 * if (adj) memory.record(adj);
 * ```
 */
