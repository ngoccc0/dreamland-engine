/**
 * Danger Encounter Template
 * Category: danger
 * Terrain: all
 * Moods: Danger, Threatening, Foreboding, Wild
 * Trigger: dangerLevel > 70
 */

import type { NarrativeTemplate } from '../template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const dangerEncounterTemplate: NarrativeTemplate = {
    id: 'danger_encounter',
    category: 'danger',
    terrain: ['forest', 'jungle', 'cave', 'desert', 'mountain', 'grassland', 'ocean', 'swamp', 'tundra', 'volcanic', 'mushroom_forest', 'beach', 'mesa', 'city', 'space_station', 'underwater', 'wall', 'floptropica'],
    tags: [MoodTag.Danger, MoodTag.Threatening, MoodTag.Foreboding, MoodTag.Wild],
    variations: {
        standard: {
            en: {
                pattern: 'You sense {{DANGER}} nearby. Every instinct tells you to stay alert.',
                emphasisHints: { DANGER: 'highlight-danger' },
            },
            vi: {
                pattern: 'Bạn cảm nhận được {{NGUY HIỂM}} gần đó. Mọi bản năng bảo bạn cẩn thận.',
                emphasisHints: { 'NGUY HIỂM': 'highlight-danger' },
            },
        },
        subtle: {
            en: {
                pattern: 'Something feels off. A prickle runs down your spine.',
                emphasisHints: {},
            },
            vi: {
                pattern: 'Có gì đó không ổn. Rợn mình chạy dọc sống lưng bạn.',
                emphasisHints: {},
            },
        },
        emphatic: {
            en: {
                pattern: '{{DANGER}}! {{THREATS}} surround you! BE ALERT! THREATS!',
                emphasisHints: {
                    DANGER: 'highlight-danger',
                    THREATS: 'highlight-danger',
                    ALERT: 'highlight-danger',
                },
            },
            vi: {
                pattern: '{{NGUY HIỂM}}! {{MỐI ĐÌNH}}ẨN bao quanh bạn! CẢNH CÓ! {{NGUY}}!',
                emphasisHints: {
                    'NGUY HIỂM': 'highlight-danger',
                    'MỐI ĐÌNH': 'highlight-danger',
                    'CẢNH CÓ': 'highlight-danger',
                    NGUY: 'highlight-danger',
                },
            },
        },
    },
    weight: 0.9,
    priority: 7,
    trigger: {
        dangerLevel: { min: 70 },
    },
};

