/**
 * Desert Opening Template
 * Category: opening
 * Terrains: desert, mesa
 * Moods: Desolate, Harsh, Barren, Vast
 */

import type { NarrativeTemplate } from '../template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const desertOpeningTemplate: NarrativeTemplate = {
    id: 'desert_opening',
    category: 'opening',
    terrain: ['desert', 'mesa'],
    tags: [MoodTag.Desolate, MoodTag.Harsh, MoodTag.Barren, MoodTag.Vast],
    variations: {
        standard: {
            en: {
                pattern: 'Sand stretches endlessly in all directions around you.',
                emphasisHints: {},
            },
            vi: {
                pattern: 'Cát trải rộng vô tận theo mọi hướng xung quanh bạn.',
                emphasisHints: {},
            },
        },
        subtle: {
            en: {
                pattern: 'The {{desert}} surrounds you with barren silence.',
                emphasisHints: { desert: 'bold' },
            },
            vi: {
                pattern: '{{Sa mạc}} bao quanh bạn với sự im lặng cằn cỗi.',
                emphasisHints: { 'Sa mạc': 'bold' },
            },
        },
        emphatic: {
            en: {
                pattern: 'The VAST, ANCIENT {{DESERT}} looms before you! Endless dunes stretch to the horizon!',
                emphasisHints: { VAST: 'highlight', ANCIENT: 'highlight', DESERT: 'bold', ENDLESS: 'highlight' },
            },
            vi: {
                pattern: '{{SA MẠC}} BỘNG LỘNG, CỔ KÍNH phía trước! Những cồi cát VÔ TẬN trải dài tới chân trời!',
                emphasisHints: { 'SA MẠC': 'bold', 'BỘNG LỘNG': 'highlight', 'CỔ KÍNH': 'highlight', 'VÔ TẬN': 'highlight' },
            },
        },
    },
    weight: 1.0,
    priority: 3,
};

