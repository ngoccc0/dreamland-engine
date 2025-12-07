/**
 * OVERVIEW: Narrative Template Schema Definition
 *
 * Defines the structure for narrative templates with support for variation tiers
 * (standard, subtle, emphatic, poetic) and mood-based filtering.
 *
 * Variation Tiers:
 * - standard: Default, neutral tone (used 60% of time)
 * - subtle: Understated, minimalist (used 20% of time)
 * - emphatic: Intense, dramatic (used 15% of time)
 * - poetic: Literary, flowery (used 5% of time, optional)
 */

import type { MoodTag } from '@/core/engines/MoodProfiler';
import type { Terrain } from '@/core/types/terrain';
import { z } from 'zod';

/**
 * Variation tier for template content
 */
export type VariationTier = 'standard' | 'subtle' | 'emphatic' | 'poetic';

/**
 * Text emphasis style for keyword highlighting
 */
export type EmphasisStyle = 'bold' | 'italic' | 'highlight' | 'highlight-danger';

/**
 * Single language variant of a template
 */
export interface TemplateVariationText {
    /** Pattern with {{placeholders}} for interpolation */
    pattern: string;
    /** Optional emphasis hints for keyword styling */
    emphasisHints?: Record<string, EmphasisStyle>;
}

/**
 * Template variant with bilingual content
 */
export interface TemplateVariation {
    en: TemplateVariationText;
    vi: TemplateVariationText;
}

/**
 * Complete narrative template with multiple variation tiers
 */
export interface NarrativeTemplate {
    /** Unique identifier (e.g., 'jungle_opening') */
    id: string;

    /** Template category (opening, transition, action, weather, discovery, danger) */
    category: 'opening' | 'transition' | 'action' | 'weather' | 'discovery' | 'danger';

    /** Applicable terrain types */
    terrain: Terrain[];

    /** Mood tags this template matches */
    tags: (MoodTag | string)[];

    /** Template variations by tier */
    variations: {
        standard: TemplateVariation;
        subtle?: TemplateVariation;
        emphatic?: TemplateVariation;
        poetic?: TemplateVariation;
    };

    /** Optional: Trigger condition (e.g., { dangerLevel: { min: 70 } }) */
    trigger?: {
        dangerLevel?: { min?: number; max?: number };
        visitCount?: { min?: number; max?: number };
        timeSpent?: { min?: number; max?: number };
    };

    /** Template weight for random selection (default 1.0) */
    weight?: number;

    /** Priority for selection (higher = preferred, default 0) */
    priority?: number;
}

/**
 * Zod schema for runtime validation
 */
export const TemplateVariationSchema = z.object({
    en: z.object({
        pattern: z.string(),
        emphasisHints: z.record(z.enum(['bold', 'italic', 'highlight', 'highlight-danger'])).optional(),
    }),
    vi: z.object({
        pattern: z.string(),
        emphasisHints: z.record(z.enum(['bold', 'italic', 'highlight', 'highlight-danger'])).optional(),
    }),
});

export const NarrativeTemplateSchema = z.object({
    id: z.string().min(1),
    category: z.enum(['opening', 'transition', 'action', 'weather', 'discovery', 'danger']),
    terrain: z.array(z.string()),
    tags: z.array(z.string()),
    variations: z.object({
        standard: TemplateVariationSchema,
        subtle: TemplateVariationSchema.optional(),
        emphatic: TemplateVariationSchema.optional(),
        poetic: TemplateVariationSchema.optional(),
    }),
    trigger: z
        .object({
            dangerLevel: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
            visitCount: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
            timeSpent: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
        })
        .optional(),
    weight: z.number().default(1.0),
    priority: z.number().default(0),
});

export type NarrativeTemplateType = z.infer<typeof NarrativeTemplateSchema>;
