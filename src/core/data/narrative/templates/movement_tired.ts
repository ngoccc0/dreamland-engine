/**
 * Movement Tired Template
 * Category: action
 * Terrain: all
 * Moods: Gloomy, Barren, Abandoned
 * Trigger: visitCount > 5 (familiar area)
 */

import type { NarrativeTemplate } from '../template-schema';
import { MoodTag } from '@/core/engines/MoodProfiler';

export const movementTiredTemplate: NarrativeTemplate = {
    id: 'movement_tired',
    category: 'action',
    terrain: ['forest', 'jungle', 'cave', 'desert', 'mountain', 'grassland', 'ocean', 'swamp', 'tundra', 'volcanic', 'mushroom_forest', 'beach', 'mesa', 'city', 'space_station', 'underwater', 'wall', 'floptropica'],
    tags: [MoodTag.Gloomy, MoodTag.Barren, MoodTag.Abandoned],
    variations: {
        standard: {
            en: {
                pattern: "You've traveled this path many times before. Familiarity settles over you.",
                emphasisHints: {},
            },
            vi: {
                pattern: 'Bạn đã đi trên con đường này nhiều lần rồi. Sự quen thuộc bao trùm bạn.',
                emphasisHints: {},
            },
        },
        subtle: {
            en: {
                pattern: 'The area feels familiar. Your steps come more easily.',
                emphasisHints: {},
            },
            vi: {
                pattern: 'Nơi này cảm thấy quen thuộc. Các bước chân của bạn dễ dàng hơn.',
                emphasisHints: {},
            },
        },
        emphatic: {
            en: {
                pattern: 'Yet another step in this MONOTONOUS, FAMILIAR place. The journey blurs together...',
                emphasisHints: { MONOTONOUS: 'italic', FAMILIAR: 'italic', BLURS: 'italic' },
            },
            vi: {
                pattern: 'Lại một bước nữa trong nơi này NHÀM CHÁN, QUEN THUỘC. Hành trình trở thành một mớ hỗn độn...',
                emphasisHints: { 'NHÀM CHÁN': 'italic', QUEN: 'italic', THUỘC: 'italic' },
            },
        },
    },
    weight: 0.9,
    priority: 1,
    trigger: {
        visitCount: { min: 5 },
    },
};

