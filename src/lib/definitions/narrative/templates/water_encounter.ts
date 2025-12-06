/**
 * Water Encounter Template
 * Category: discovery
 * Terrains: ocean, beach, underwater
 * Moods: Peaceful, Mysterious, Dangerous, Ethereal
 */

import type { NarrativeTemplate } from '@/lib/definitions/narrative/template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const waterEncounterTemplate: NarrativeTemplate = {
    id: 'water_encounter',
    category: 'discovery',
    terrain: ['ocean', 'beach', 'underwater'],
    tags: [MoodTag.Peaceful, MoodTag.Mysterious, MoodTag.Danger, MoodTag.Ethereal],
    variations: {
        standard: {
            en: {
                pattern: 'Water stretches before you, deep and mysterious.',
                emphasisHints: {},
            },
            vi: {
                pattern: 'Nước trải rộng trước mặt bạn, sâu thẳm và bí ẩn.',
                emphasisHints: {},
            },
        },
        subtle: {
            en: {
                pattern: 'The {{water}} glimmers softly in the light.',
                emphasisHints: { water: 'italic' },
            },
            vi: {
                pattern: 'Mặt {{nước}} lấp loáng nhẹ nhàng.',
                emphasisHints: { nước: 'italic' },
            },
        },
        emphatic: {
            en: {
                pattern: '{{DANGER}}! The {{WATER}} churns with unseen THREATS!',
                emphasisHints: { DANGER: 'highlight-danger', WATER: 'bold', THREATS: 'highlight-danger' },
            },
            vi: {
                pattern: '{{NGUY HIỂM}}! Mặt {{NƯỚC}} dâng sóng với những mối ĐÌNH ẨN!',
                emphasisHints: { 'NGUY HIỂM': 'highlight-danger', NƯỚC: 'bold', ẨN: 'highlight-danger' },
            },
        },
    },
    weight: 1.0,
    priority: 3,
};
