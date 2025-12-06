/**
 * Forest Discovery Template
 * Category: discovery
 * Terrains: forest, grassland
 * Moods: Peaceful, Wild, Lush, Mysterious
 */

import type { NarrativeTemplate } from '@/lib/definitions/narrative/template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const forestDiscoveryTemplate: NarrativeTemplate = {
    id: 'forest_discovery',
    category: 'discovery',
    terrain: ['forest', 'grassland'],
    tags: [MoodTag.Peaceful, MoodTag.Wild, MoodTag.Lush, MoodTag.Mysterious],
    variations: {
        standard: {
            en: {
                pattern: 'You {{discover}} a peaceful clearing in the {{forest}}.',
                emphasisHints: { discover: 'italic', forest: 'bold' },
            },
            vi: {
                pattern: 'Bạn {{phát hiện}} một khoảng trống yên tĩnh trong {{rừng}}.',
                emphasisHints: { 'phát hiện': 'italic', rừng: 'bold' },
            },
        },
        subtle: {
            en: {
                pattern: 'Trees surround you gently, leaves rustling softly.',
                emphasisHints: {},
            },
            vi: {
                pattern: 'Những cây cối bao quanh bạn một cách nhẹ nhàng, những chiếc lá xào xạc.',
                emphasisHints: {},
            },
        },
        emphatic: {
            en: {
                pattern: 'You DISCOVER a SECRET, HIDDEN clearing! NATURE surrounds you!',
                emphasisHints: { DISCOVER: 'highlight', SECRET: 'highlight', HIDDEN: 'highlight', NATURE: 'bold' },
            },
            vi: {
                pattern: 'Bạn PHÁT HIỆN một khoảng trống BÍ MẬT, ẨN CHỨA! {{THIÊN NHIÊN}} bao quanh bạn!',
                emphasisHints: { 'PHÁT HIỆN': 'highlight', 'BÍ MẬT': 'highlight', ẨN: 'highlight', 'THIÊN NHIÊN': 'bold' },
            },
        },
    },
    weight: 1.0,
    priority: 3,
};
