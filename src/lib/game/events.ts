import type { RandomEvent, Chunk, PlayerStatus, Season } from './types';

export const randomEvents: RandomEvent[] = [
    // --- MAGIC EVENTS ---
    {
        id: 'mysticFog',
        nameKey: 'mysticFog',
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
        nameKey: 'magicRain',
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
        nameKey: 'magicStorm',
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
        nameKey: 'lightRain',
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
        nameKey: 'blizzard',
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
    // --- RARE EVENTS ---
    {
        id: 'fallenStar',
        nameKey: 'fallenStar',
        theme: 'Magic',
        difficulty: 'hard',
        chance: 0.1,
        canTrigger: (chunk) => chunk.lightLevel !== undefined && chunk.lightLevel < -5 && chunk.terrain !== 'cave',
        outcomes: {
            CriticalFailure: {
                descriptionKey: 'eventFallenStarCritFail',
                effects: { hpChange: -20 }
            },
            Failure: {
                descriptionKey: 'eventFallenStarFail',
                effects: { items: [{ name: 'Đá Obsidian', quantity: 1 }] }
            },
            Success: {
                descriptionKey: 'eventFallenStarSuccess',
                effects: { items: [{ name: 'Trái tim Magma', quantity: 1 }] }
            },
            GreatSuccess: {
                descriptionKey: 'eventFallenStarGreatSuccess',
                effects: { items: [{ name: 'Trái tim Magma', quantity: 1 }, { name: 'Cát Ma Thuật', quantity: 1 }] }
            },
            CriticalSuccess: {
                descriptionKey: 'eventFallenStarCritSuccess',
                effects: { items: [{ name: 'Pha Lê Núi', quantity: 1 }], manaChange: 25 }
            },
        },
    },
    {
        id: 'abandonedCaravan',
        nameKey: 'abandonedCaravan',
        theme: 'Normal',
        difficulty: 'medium',
        chance: 0.2,
        canTrigger: (chunk) => ['grassland', 'desert'].includes(chunk.terrain) && chunk.humanPresence > 3,
        outcomes: {
            Failure: {
                descriptionKey: 'eventAbandonedCaravanFail',
                effects: { items: [{ name: 'Mảnh Vải Rách', quantity: 2 }] }
            },
            Success: {
                descriptionKey: 'eventAbandonedCaravanSuccess',
                effects: { items: [{ name: 'Bình Nước Cũ', quantity: 1 }, { name: 'Lúa Mì', quantity: 2 }] }
            },
            GreatSuccess: {
                descriptionKey: 'eventAbandonedCaravanGreatSuccess',
                effects: { items: [{ name: 'Chìa Khóa Rỉ Sét', quantity: 1 }, { name: 'Mỏ Vàng', quantity: 1 }] }
            },
            CriticalSuccess: {
                descriptionKey: 'eventAbandonedCaravanCritSuccess',
                effects: { items: [{ name: 'Bản Đồ Cổ', quantity: 1 }] }
            },
        },
    },
    {
        id: 'ghostlyProcession',
        nameKey: 'ghostlyProcession',
        theme: 'Magic',
        difficulty: 'easy',
        chance: 0.15,
        canTrigger: (chunk) => ['swamp', 'forest'].includes(chunk.terrain) && chunk.lightLevel !== undefined && chunk.lightLevel < -5 && chunk.magicAffinity > 5,
        outcomes: {
            Failure: {
                descriptionKey: 'eventGhostlyProcessionFail',
                effects: { staminaChange: -15 }
            },
            Success: {
                descriptionKey: 'eventGhostlyProcessionSuccess',
                effects: { items: [{ name: 'Tinh chất Ma trơi', quantity: 1 }] }
            },
            GreatSuccess: {
                descriptionKey: 'eventGhostlyProcessionGreatSuccess',
                effects: { items: [{ name: 'Tinh chất Ma trơi', quantity: 2 }] }
            },
        },
    },
];
