/**
 * Cave Opening Template
 * Category: opening
 * Terrain: cave
 * Moods: Dark, Confined, Foreboding, Mysterious
 */

import type { NarrativeTemplate } from '../template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const caveOpeningTemplate: NarrativeTemplate = {
    id: 'cave_opening',
    category: 'opening',
    terrain: ['cave'],
    tags: [MoodTag.Dark, MoodTag.Confined, MoodTag.Foreboding, MoodTag.Mysterious],
    variations: {
        standard: {
            en: {
                pattern: 'You enter a {{cave}}. The air grows noticeably colder.',
                emphasisHints: { cave: 'bold' },
            },
            vi: {
                pattern: 'Bạn bước vào một {{hang động}}. Không khí trở nên lạnh hơn.',
                emphasisHints: { 'hang động': 'bold' },
            },
        },
        subtle: {
            en: {
                pattern: 'A {{cave}} stretches before you, barely illuminated.',
                emphasisHints: { cave: 'bold' },
            },
            vi: {
                pattern: 'Một {{hang động}} trải dài trước mặt bạn, hầu như không có ánh sáng.',
                emphasisHints: { 'hang động': 'bold' },
            },
        },
        emphatic: {
            en: {
                pattern: 'DARKNESS engulfs you as you enter a FOREBODING {{cave}}. {{DANGER}} lurks in the shadows!',
                emphasisHints: {
                    DARKNESS: 'highlight-danger',
                    FOREBODING: 'highlight-danger',
                    cave: 'bold',
                    DANGER: 'highlight-danger',
                },
            },
            vi: {
                pattern: 'BỨC TỐI nuốt chửng bạn khi bước vào một {{hang động}} TỪN DỮ. {{NGUY HIỂM}} lẩn trốn trong bóng tối!',
                emphasisHints: {
                    'BỨC TỐI': 'highlight-danger',
                    'TỪN DỮ': 'highlight-danger',
                    'hang động': 'bold',
                    'NGUY HIỂM': 'highlight-danger',
                },
            },
        },
    },
    weight: 1.1,
    priority: 4,
};

