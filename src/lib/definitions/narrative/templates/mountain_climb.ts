/**
 * Mountain Climb Template
 * Category: action
 * Terrain: mountain
 * Moods: Peaceful, Elevated, Isolated, Breathtaking
 */

import type { NarrativeTemplate } from '@/lib/definitions/narrative/template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const mountainClimbTemplate: NarrativeTemplate = {
    id: 'mountain_climb',
    category: 'action',
    terrain: ['mountain'],
    tags: [MoodTag.Peaceful, MoodTag.Elevated, MoodTag.Vast, MoodTag.Serene],
    variations: {
        standard: {
            en: {
                pattern: 'You {{climb}} the mountain, breathing in fresh, crisp air.',
                emphasisHints: { climb: 'italic' },
            },
            vi: {
                pattern: 'Bạn {{leo}} lên núi, hít thở không khí tươi mát.',
                emphasisHints: { leo: 'italic' },
            },
        },
        subtle: {
            en: {
                pattern: 'Mountains rise around you in peaceful solitude.',
            },
            vi: {
                pattern: 'Những ngọn núi nhô lên xung quanh bạn trong yên tĩnh.',
            },
        },
        emphatic: {
            en: {
                pattern: 'You CLIMB the TOWERING MOUNTAIN! Each step brings you higher into the sky!',
                emphasisHints: { CLIMB: 'highlight', TOWERING: 'bold', MOUNTAIN: 'bold' },
            },
            vi: {
                pattern: 'Bạn LEO lên ngọn NÚI CHỌC TRỜI! Mỗi bước đưa bạn cao hơn!',
                emphasisHints: { LEO: 'highlight', CHỌC: 'bold', TRỜI: 'bold' },
            },
        },
    },
    weight: 1.0,
    priority: 3,
};
