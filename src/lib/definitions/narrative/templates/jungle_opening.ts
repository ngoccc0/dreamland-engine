/**
 * Jungle Opening Template
 * Category: opening
 * Terrains: jungle, mushroom_forest
 * Moods: Lush, Wild, Vibrant, Mysterious
 */

import type { NarrativeTemplate } from '@/lib/definitions/narrative/template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const jungleOpeningTemplate: NarrativeTemplate = {
    id: 'jungle_opening',
    category: 'opening',
    terrain: ['jungle', 'mushroom_forest'],
    tags: [MoodTag.Lush, MoodTag.Wild, MoodTag.Vibrant, MoodTag.Mysterious],
    variations: {
        standard: {
            en: {
                pattern: 'You enter a lush {{jungle}} filled with strange sounds and vibrant life.',
                emphasisHints: { jungle: 'bold' },
            },
            vi: {
                pattern: 'Bạn bước vào một {{rừng}} tươi tốt với những âm thanh kỳ lạ và sự sống sôi động.',
                emphasisHints: { rừng: 'bold' },
            },
        },
        subtle: {
            en: {
                pattern: 'The {{jungle}} surrounds you with dense foliage and distant calls.',
                emphasisHints: { jungle: 'bold' },
            },
            vi: {
                pattern: 'Những cây cối dày đặc bao quanh bạn với tiếng kêu từ phía xa.',
            },
        },
        emphatic: {
            en: {
                pattern: 'A WILD, UNTAMED {{jungle}} explodes around you with primal energy!',
                emphasisHints: { jungle: 'bold', WILD: 'highlight-danger', UNTAMED: 'highlight-danger' },
            },
            vi: {
                pattern: 'Một {{rừng}} HOANG DÃ, NGUYÊN VĐ nổ tung xung quanh bạn!',
                emphasisHints: { rừng: 'bold', HOANG: 'highlight-danger', DÃ: 'highlight-danger' },
            },
        },
    },
    weight: 1.2,
    priority: 5,
};
