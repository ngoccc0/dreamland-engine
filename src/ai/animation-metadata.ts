/**
 * Animation Metadata & Configuration
 *
 * OVERVIEW: Defines animation metadata schemas and configurations for narrative generation.
 * This system determines animation type, thinking markers, and emphasized segments based on
 * mood profiles and game state, enabling dynamic visual feedback synchronized with narrative content.
 *
 * Key Components:
 * - AnimationMetadata: Schema for animation hints injected into narrative generation
 * - MoodToAnimationConfig: Maps mood strength/tags to animation types
 * - AnimationType enum: Standard animation types (typing, fadeIn, thinking, emphasis)
 * - ThinkingMarker: Used to indicate LLM processing stages
 */

import { z } from 'zod';
import type { MoodTag } from '@/core/engines/MoodProfiler';

/**
 * Animation types supported by the narrative system
 */
export enum AnimationType {
    /** Word-by-word typing animation (default, 150ms/word) */
    TYPING = 'typing',

    /** Fade-in animation (full text appears with fade, 500ms) */
    FADE_IN = 'fadeIn',

    /** Thinking animation (shows thinking indicator, then reveals text) */
    THINKING = 'thinking',

    /** Fast typing animation (100ms/word, for emphasis moments) */
    FAST_TYPING = 'fastTyping',

    /** Slow typing animation (250ms/word, for contemplative moments) */
    SLOW_TYPING = 'slowTyping'
}

/**
 * Thinking marker stages (used to show AI processing progress)
 */
export enum ThinkingMarkerStage {
    /** Initial thinking indicator */
    INITIAL = 'initial',

    /** Processing game state */
    PROCESSING = 'processing',

    /** Generating narrative */
    GENERATING = 'generating',

    /** Done processing, about to reveal */
    COMPLETE = 'complete'
}

/**
 * Zod schema for animation metadata
 *
 * This schema defines what animation information should be injected into
 * narrative generation flows, typically returned alongside the narrative text.
 */
export const AnimationMetadataSchema = z.object({
    /** Type of animation to apply to narrative text */
    animationType: z.nativeEnum(AnimationType)
        .describe("The animation type to apply (typing, fadeIn, thinking, fastTyping, slowTyping)")
        .default(AnimationType.TYPING),

    /** Whether to show thinking indicator before revealing narrative */
    thinkingMarker: z.boolean()
        .describe("Whether to show a thinking indicator before revealing the narrative")
        .default(false),

    /** Segments of text that should be emphasized */
    emphasizedSegments: z.array(z.object({
        start: z.number().int().min(0).describe("Start index in narrative text"),
        end: z.number().int().min(0).describe("End index in narrative text"),
        style: z.enum(['bold', 'italic', 'highlight', 'highlight-danger'])
            .describe("CSS style class to apply")
    }))
        .describe("Segments of narrative text to emphasize with specific styles")
        .default([]),

    /** Animation speed multiplier (0.5 = half speed, 1.5 = 1.5x speed) */
    speedMultiplier: z.number()
        .min(0.3)
        .max(3.0)
        .describe("Animation speed multiplier (0.5-3.0)")
        .default(1.0),

    /** Delay before animation starts (milliseconds) */
    delayMs: z.number()
        .int()
        .min(0)
        .max(2000)
        .describe("Delay in milliseconds before animation starts")
        .default(0)
});

export type AnimationMetadata = z.infer<typeof AnimationMetadataSchema>;

/**
 * Configuration for mood-to-animation mapping
 *
 * Maps mood strength ranges to appropriate animation types and settings
 */
export const MOOD_TO_ANIMATION_CONFIG = {
    /**
     * Mood strength < 0.3: Quiet, contemplative moments
     * - Animation: Slow typing (250ms/word)
     * - Thinking: Show for reflective moments
     * - Speed: 0.7x normal
     */
    quiet: {
        moodStrengthRange: [0, 0.3],
        animationType: AnimationType.SLOW_TYPING,
        thinkingMarker: false,
        speedMultiplier: 0.7,
        delayMs: 100
    },

    /**
     * Mood strength 0.3-0.6: Normal narrative flow
     * - Animation: Standard typing (150ms/word)
     * - Thinking: Show on demand (via moodTag indicators)
     * - Speed: 1.0x normal
     */
    normal: {
        moodStrengthRange: [0.3, 0.6],
        animationType: AnimationType.TYPING,
        thinkingMarker: false,
        speedMultiplier: 1.0,
        delayMs: 0
    },

    /**
     * Mood strength 0.6-0.8: Elevated tension or excitement
     * - Animation: Fast typing (100ms/word)
     * - Thinking: Show if processing complex state
     * - Speed: 1.2x normal
     */
    elevated: {
        moodStrengthRange: [0.6, 0.8],
        animationType: AnimationType.FAST_TYPING,
        thinkingMarker: true,
        speedMultiplier: 1.2,
        delayMs: 50
    },

    /**
     * Mood strength 0.8-1.0: Intense, dramatic moments
     * - Animation: Emphasis with fade-in for impact
     * - Thinking: Always show thinking indicator
     * - Speed: 1.5x normal (fast)
     */
    intense: {
        moodStrengthRange: [0.8, 1.0],
        animationType: AnimationType.FADE_IN,
        thinkingMarker: true,
        speedMultiplier: 1.5,
        delayMs: 200
    }
} as const;

/**
 * Mood-tag-specific animation overrides
 *
 * Certain mood tags override standard animation based on strength.
 * These take precedence over strength-based selection.
 */
export const MOOD_TAG_ANIMATION_OVERRIDES: Record<string, AnimationType | null> = {
    // Contemplative/meditative moods - always slow
    Peaceful: AnimationType.SLOW_TYPING,
    Serene: AnimationType.SLOW_TYPING,

    // Intense/dangerous moods - always fast
    Danger: AnimationType.FAST_TYPING,
    Threatening: AnimationType.FAST_TYPING,
    Foreboding: AnimationType.FAST_TYPING,

    // Think-inducing moods - use thinking marker
    Mysterious: AnimationType.TYPING,
    Ethereal: AnimationType.TYPING,

    // No override (null means use default strength-based selection)
    Dark: null,
    Gloomy: null,
    Vibrant: null,
    Wild: null
};

/**
 * Determine animation metadata based on mood and game state
 *
 * Algorithm:
 * 1. Check for mood-tag-specific overrides
 * 2. Fall back to mood-strength-based selection
 * 3. Apply speed multiplier based on game state
 * 4. Determine if thinking marker should show
 */
export function determineAnimationMetadata(options: {
    primaryMood?: MoodTag;
    moodStrength?: number;
    isDangerousAction?: boolean;
    isComplexGameState?: boolean;
    narrativeLength?: 'short' | 'medium' | 'long' | 'detailed';
    language?: 'en' | 'vi';
}): AnimationMetadata {
    const {
        primaryMood,
        moodStrength = 0.5,
        isDangerousAction = false,
        isComplexGameState = false,
        narrativeLength = 'medium',
        language: _language = 'en'
    } = options;

    // Check mood-tag-specific override
    let animationType = AnimationType.TYPING;
    if (primaryMood && MOOD_TAG_ANIMATION_OVERRIDES[primaryMood]) {
        animationType = MOOD_TAG_ANIMATION_OVERRIDES[primaryMood]!;
    } else {
        // Use mood-strength-based selection
        if (moodStrength < 0.3) {
            animationType = MOOD_TO_ANIMATION_CONFIG.quiet.animationType;
        } else if (moodStrength < 0.6) {
            animationType = MOOD_TO_ANIMATION_CONFIG.normal.animationType;
        } else if (moodStrength < 0.8) {
            animationType = MOOD_TO_ANIMATION_CONFIG.elevated.animationType;
        } else {
            animationType = MOOD_TO_ANIMATION_CONFIG.intense.animationType;
        }
    }

    // Determine if thinking marker should show
    let thinkingMarker = false;
    if (isDangerousAction || isComplexGameState || moodStrength > 0.7) {
        thinkingMarker = true;
    }

    // Calculate speed multiplier based on narrative length
    let speedMultiplier = 1.0;
    switch (narrativeLength) {
        case 'short':
            speedMultiplier = 1.2; // Faster for short narratives
            break;
        case 'medium':
            speedMultiplier = 1.0;
            break;
        case 'long':
        case 'detailed':
            speedMultiplier = 0.9; // Slower for long narratives to maintain readability
            break;
    }

    // Apply mood-strength adjustment
    if (moodStrength > 0.7) {
        speedMultiplier *= 1.1; // Slightly faster for high-tension moments
    } else if (moodStrength < 0.4) {
        speedMultiplier *= 0.9; // Slightly slower for contemplative moments
    }

    // Calculate delay based on mood and game state
    let delayMs = 0;
    if (moodStrength > 0.8) {
        delayMs = 200; // More dramatic pause for intense moments
    } else if (isComplexGameState) {
        delayMs = 100; // Slight pause for complex situations
    }

    return {
        animationType,
        thinkingMarker,
        emphasizedSegments: [], // Populated by TextEmphasisRules separately
        speedMultiplier,
        delayMs
    };
}

/**
 * Get animation config bucket for mood strength
 *
 * Returns the configuration object matching the mood strength range
 */
export function getAnimationConfigForMoodStrength(
    moodStrength: number
): (typeof MOOD_TO_ANIMATION_CONFIG)[keyof typeof MOOD_TO_ANIMATION_CONFIG] {
    if (moodStrength < 0.3) {
        return MOOD_TO_ANIMATION_CONFIG.quiet;
    } else if (moodStrength < 0.6) {
        return MOOD_TO_ANIMATION_CONFIG.normal;
    } else if (moodStrength < 0.8) {
        return MOOD_TO_ANIMATION_CONFIG.elevated;
    } else {
        return MOOD_TO_ANIMATION_CONFIG.intense;
    }
}

/**
 * Adjust animation metadata for mobile devices
 *
 * Mobile devices get slower animation and adjusted timing
 */
export function adjustAnimationForMobile(metadata: AnimationMetadata): AnimationMetadata {
    return {
        ...metadata,
        speedMultiplier: metadata.speedMultiplier * 0.8, // 20% slower on mobile
        delayMs: metadata.delayMs + 100 // Add 100ms extra delay for mobile
    };
}

/**
 * Adjust animation metadata for low bandwidth
 *
 * Low bandwidth gets fade-in instead of typing (less network overhead)
 */
export function adjustAnimationForLowBandwidth(metadata: AnimationMetadata): AnimationMetadata {
    return {
        ...metadata,
        animationType: AnimationType.FADE_IN, // Use fade-in to reduce frame updates
        speedMultiplier: 1.0 // Normalize to prevent network strain
    };
}

/**
 * Example usage for Genkit flow integration:
 *
 * ```typescript
 * const metadata = determineAnimationMetadata({
 *   primaryMood: MoodTag.Danger,
 *   moodStrength: 0.85,
 *   isDangerousAction: true,
 *   isComplexGameState: false,
 *   narrativeLength: 'medium',
 *   language: 'en'
 * });
 *
 * // Result: FADE_IN animation with thinking marker,
 * // 1.5x speed for intense moment
 *
 * return {
 *   narrative: generatedText,
 *   animationMetadata: metadata,
 *   // ... other fields
 * };
 * ```
 */
