import type { RandomEvent, Chunk, PlayerStatus, Season } from './types';

export const randomEvents: RandomEvent[] = [
    // --- MAGIC EVENTS ---
    {
        id: 'mysticFog',
        theme: 'Magic',
        difficulty: 'easy',
        canTrigger: (chunk) => !['desert', 'volcanic', 'cave'].includes(chunk.terrain),
        outcomes: {
            Success: {
                descriptionKey: 'eventMysticFogSuccess',
                effects: {
                    items: [{ name: 'Thảo Dược Chữa Lành', quantity: 1 }],
                }
            },
        },
    },
    {
        id: 'magicRain',
        theme: 'Magic',
        difficulty: 'medium',
        canTrigger: (chunk) => !['desert', 'volcanic', 'cave'].includes(chunk.terrain),
        outcomes: {
            Success: {
                descriptionKey: 'eventMagicRainSuccess',
                effects: {
                    staminaChange: 15,
                    hpChange: -10, // Conditional damage
                }
            },
            Failure: {
                descriptionKey: 'eventMagicRainFailure',
                effects: {
                    hpChange: -15,
                }
            }
        },
    },
    {
        id: 'magicStorm',
        theme: 'Magic',
        difficulty: 'hard',
        canTrigger: (chunk) => !['desert', 'cave'].includes(chunk.terrain),
        outcomes: {
            CriticalFailure: {
                descriptionKey: 'eventMagicStormCritFail',
                effects: {
                    hpChange: -40,
                }
            },
            Failure: {
                descriptionKey: 'eventMagicStormFail',
                effects: {
                    hpChange: -30,
                }
            },
            Success: {
                descriptionKey: 'eventMagicStormSuccess',
                effects: {
                    hpChange: -20,
                    items: [{ name: 'Lõi Gỗ', quantity: 1 }]
                }
            },
            GreatSuccess: {
                descriptionKey: 'eventMagicStormGreatSuccess',
                effects: {
                    hpChange: -10,
                    items: [{ name: 'Lõi Gỗ', quantity: 2 }]
                }
            },
            CriticalSuccess: {
                descriptionKey: 'eventMagicStormCritSuccess',
                effects: {
                    items: [{ name: 'Lõi Gỗ', quantity: 2 }, { name: 'Pha Lê Núi', quantity: 1 }]
                }
            },
        },
    },

    // --- NORMAL EVENTS ---
    {
        id: 'lightRain',
        theme: 'Normal',
        difficulty: 'easy',
        canTrigger: (chunk) => !['desert', 'volcanic', 'cave'].includes(chunk.terrain),
        outcomes: {
            Success: {
                descriptionKey: 'eventLightRainSuccess',
                effects: {
                    staminaChange: 15,
                }
            },
            GreatSuccess: {
                descriptionKey: 'eventLightRainGreatSuccess',
                effects: {
                    staminaChange: 25,
                    spawnEnemy: { type: 'Thỏ hoang hung dữ', hp: 20, damage: 5 },
                }
            }
        },
    },
    {
        id: 'blizzard',
        theme: 'Normal',
        difficulty: 'hard',
        canTrigger: (chunk, player, season) => ['mountain', 'forest'].includes(chunk.terrain) && (season === 'winter' || chunk.temperature < 2),
        outcomes: {
            Failure: {
                descriptionKey: 'eventBlizzardFail',
                effects: {
                    hpChange: -25,
                    staminaChange: -25
                }
            },
            Success: {
                descriptionKey: 'eventBlizzardSuccess',
                effects: {
                    hpChange: -15,
                    staminaChange: -15
                }
            },
            CriticalSuccess: {
                descriptionKey: 'eventBlizzardCritSuccess',
                effects: {
                    items: [{ name: 'Lõi Gỗ', quantity: 1 }]
                }
            },
        },
    },
];
