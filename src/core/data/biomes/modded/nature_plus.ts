import type { EnemySpawn } from '@/core/types/game';

export const naturePlusForestEnemies: EnemySpawn[] = [
    {
        data: {
            type: 'Sói Bóng Đêm',
            emoji: '🐺🌑',
            hp: 45,
            damage: 15,
            behavior: 'ambush',
            size: 'medium',
            diet: ['Heo Rừng', 'Thỏ hoang hung dữ'],
            satiation: 0,
            maxSatiation: 2,
            loot: [
                { name: 'Lông Sói Đen', chance: 0.6, quantity: { min: 1, max: 2 } },
                { name: 'Thịt Sói Sống', chance: 0.8, quantity: { min: 1, max: 1 } }
            ],
            senseEffect: { keywords: ['sound:sensory.sound.silent', 'motion:sensory.motion.swift', 'visual:sensory.visual.dark'] },
        },
        conditions: { timeOfDay: 'night', chance: 0.2 }
    },
    {
        data: {
            type: 'Đom Đóm Phát Sáng',
            emoji: '✨🐛',
            hp: 5,
            damage: 1,
            behavior: 'passive',
            size: 'small',
            diet: [],
            satiation: 0,
            maxSatiation: 0,
            loot: [],
            senseEffect: { keywords: ['visual:sensory.visual.glowing', 'motion:sensory.motion.fluttering', 'visual:sensory.visual.small'] },
        },
        conditions: { timeOfDay: 'night', chance: 0.3, humidity: { min: 5 } }
    },
];

export const naturePlusMountainEnemies: EnemySpawn[] = [
    {
        data: {
            type: 'Sói Bóng Đêm',
            emoji: '🐺🌑',
            hp: 45,
            damage: 15,
            behavior: 'ambush',
            size: 'medium',
            diet: ['Dê núi hung hãn'],
            satiation: 0,
            maxSatiation: 2,
            loot: [
                { name: 'Lông Sói Đen', chance: 0.6, quantity: { min: 1, max: 2 } },
                { name: 'Thịt Sói Sống', chance: 0.8, quantity: { min: 1, max: 1 } }
            ],
            senseEffect: { keywords: ['silent', 'swift', 'dark'] },
        },
        conditions: { timeOfDay: 'night', chance: 0.15, elevation: { min: 5 } }
    },
];

export const naturePlusJungleEnemies: EnemySpawn[] = [
    {
        data: {
            type: 'Rắn Độc Rừng Rậm',
            emoji: '🐍🍃',
            hp: 50,
            damage: 12,
            behavior: 'ambush',
            size: 'small',
            diet: [], // Assuming no specific diet for this modded creature yet
            satiation: 0,
            maxSatiation: 1,
            loot: [
                { name: 'Nọc Rắn Độc', chance: 0.6, quantity: { min: 1, max: 1 } },
                { name: 'Da Rắn', chance: 0.8, quantity: { min: 1, max: 1 } }
            ],
            senseEffect: { keywords: ['motion:sensory.motion.slithering', 'sound:sensory.sound.hissing', 'trait:sensory.trait.venomous'] },
        },
        conditions: { humidity: { min: 8 }, visibility: { max: 3 }, chance: 0.2 }
    },
];

export const naturePlusSwampEnemies: EnemySpawn[] = [
    {
        data: {
            type: 'Cá Sấu Đầm Lầy Cổ Đại',
            emoji: '🐊🌳',
            hp: 150,
            damage: 30,
            behavior: 'territorial',
            size: 'large',
            diet: ['Cá sấu'],
            satiation: 0,
            maxSatiation: 3,
            loot: [
                { name: 'Da Cá Sấu Cổ Đại', chance: 0.7, quantity: { min: 1, max: 2 } },
                { name: 'Thịt Cá Nướng', chance: 0.9, quantity: { min: 2, max: 4 } }
            ],
            senseEffect: { keywords: ['visual:sensory.visual.scaly', 'motion:sensory.motion.slow', 'trait:sensory.trait.powerful'] },
        },
        conditions: { humidity: { min: 8 }, visibility: { max: 5 }, temperature: { min: 8 }, chance: 0.1 }
    },
];
