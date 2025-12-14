/**
 * Weather Storm Template
 * Category: weather
 * Terrain: all
 * Moods: Threatening, Dangerous, Wild, Foreboding
 */

import type { NarrativeTemplate } from '../template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const weatherStormTemplate: NarrativeTemplate = {
    id: 'weather_storm',
    category: 'weather',
    terrain: ['forest', 'grassland', 'desert', 'mountain', 'jungle', 'cave', 'ocean', 'beach', 'swamp', 'tundra', 'volcanic', 'mushroom_forest', 'mesa', 'city', 'space_station', 'underwater', 'wall', 'floptropica'],
    tags: [MoodTag.Threatening, MoodTag.Danger, MoodTag.Wild, MoodTag.Foreboding],
    variations: {
        standard: {
            en: {
                pattern: 'A {{STORM}} approaches overhead. Lightning flashes in the distance.',
                emphasisHints: { STORM: 'highlight' },
            },
            vi: {
                pattern: 'Một {{CƠN BẢO}} lao tới phía trên. Chớp sáng lóe lên phía xa.',
                emphasisHints: { 'CƠN BẢO': 'highlight' },
            },
        },
        subtle: {
            en: {
                pattern: 'Dark clouds gather ominously above you.',
            },
            vi: {
                pattern: 'Những đám mây tối đen tập hợp lại một cách đáng sợ phía trên.',
            },
        },
        emphatic: {
            en: {
                pattern: '{{DANGER}}! A VIOLENT {{STORM}} approaches! LIGHTNING and THUNDER crash around you!',
                emphasisHints: {
                    DANGER: 'highlight-danger',
                    VIOLENT: 'highlight-danger',
                    STORM: 'highlight-danger',
                    LIGHTNING: 'highlight-danger',
                    THUNDER: 'highlight-danger',
                },
            },
            vi: {
                pattern: '{{NGUY HIỂM}}! Một CƠN BẢO ỨC LIỆT lao tới! {{CHỚP}} và {{SÓM}} vang vọng xung quanh!',
                emphasisHints: {
                    'NGUY HIỂM': 'highlight-danger',
                    'ỨC LIỆT': 'highlight-danger',
                    CHỚP: 'highlight-danger',
                    SÓM: 'highlight-danger',
                },
            },
        },
    },
    weight: 0.8,
    priority: 6,
    trigger: {
        dangerLevel: { min: 50 },
    },
};

