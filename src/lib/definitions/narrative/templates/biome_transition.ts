/**
 * Biome Transition Template
 * Category: transition
 * Terrain: all
 * Moods: Mysterious, Vibrant, Ethereal
 * Trigger: Moving from one terrain type to another
 */

import type { NarrativeTemplate } from '@/lib/definitions/narrative/template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const biomeTransitionTemplate: NarrativeTemplate = {
    id: 'biome_transition',
    category: 'transition',
    terrain: ['forest', 'jungle', 'cave', 'desert', 'mountain', 'grassland', 'ocean', 'swamp', 'tundra', 'volcanic', 'mushroom_forest', 'beach', 'mesa', 'city', 'space_station', 'underwater', 'wall', 'floptropica'],
    tags: [MoodTag.Mysterious, MoodTag.Vibrant, MoodTag.Ethereal],
    variations: {
        standard: {
            en: {
                pattern: 'The landscape shifts noticeably as you move forward into new territory.',
                emphasisHints: {},
            },
            vi: {
                pattern: 'Cảnh quan thay đổi rõ ràng khi bạn tiến vào lãnh thổ mới.',
                emphasisHints: {},
            },
        },
        subtle: {
            en: {
                pattern: 'Things around you change gradually.',
                emphasisHints: {},
            },
            vi: {
                pattern: 'Mọi thứ xung quanh bạn thay đổi từ từ.',
                emphasisHints: {},
            },
        },
        emphatic: {
            en: {
                pattern: 'You CROSS the threshold into NEW territory! Everything transforms around you!',
                emphasisHints: { CROSS: 'highlight', THRESHOLD: 'highlight', NEW: 'highlight', TRANSFORMS: 'highlight' },
            },
            vi: {
                pattern: 'Bạn VƯỢt qua RANH GIỚI vào LÃNHhổ MỚI! Mọi thứ BIẾN ĐỔI xung quanh bạn!',
                emphasisHints: { VƯỢt: 'highlight', RANH: 'highlight', GIỚI: 'highlight', 'BIẾN ĐỔI': 'highlight' },
            },
        },
    },
    weight: 1.0,
    priority: 4,
};
