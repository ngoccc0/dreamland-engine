import type { RandomEventDefinition } from '@/core/types/definitions';

export const randomEvents: RandomEventDefinition[] = [
    // --- MAGIC EVENTS ---
    {
        id: 'mysticFog',
        name: { en: 'Mystic Fog', vi: 'Sương mù huyền bí' },
        theme: 'Magic',
        difficulty: 'easy',
        canTrigger: (chunk) => !['desert', 'volcanic', 'cave'].includes(chunk.terrain),
        outcomes: {
            Success: {
                description: { en: 'A mysterious fog rolls in, reducing visibility. As you navigate cautiously, you stumble upon a rare healing herb.', vi: 'Một màn sương mù bí ẩn kéo đến, làm giảm tầm nhìn. Khi bạn thận trọng di chuyển, bạn tình cờ tìm thấy một loại thảo dược chữa bệnh hiếm.' },
                effects: {
                    items: [{ name: 'healing_herb', quantity: 1 }],
                }
            },
        },
    },
    {
        id: 'magicRain',
        name: { en: 'Magic Rain', vi: 'Cơn mưa ma thuật' },
        theme: 'Magic',
        difficulty: 'medium',
        canTrigger: (chunk) => !['desert', 'volcanic', 'cave'].includes(chunk.terrain),
        outcomes: {
            Success: {
                description: { en: 'A shimmering rain begins to fall. It feels refreshing, restoring your stamina, but its magical properties are slightly corrosive if you are not sheltered.', vi: 'Một cơn mưa lung linh bắt đầu rơi. Cảm giác thật sảng khoái, phục hồi thể lực của bạn, nhưng đặc tính ma thuật của nó hơi ăn mòn nếu bạn không có nơi trú ẩn.' },
                effects: {
                    staminaChange: 15,
                    hpChange: -10, // Conditional damage
                }
            },
            Failure: {
                description: { en: 'A strange, shimmering rain falls. It burns your skin, causing you to lose health.', vi: 'Một cơn mưa lạ, lung linh rơi xuống. Nó làm bỏng da bạn, khiến bạn mất máu.' },
                effects: {
                    hpChange: -15,
                }
            }
        },
    },
    {
        id: 'magicStorm',
        name: { en: 'Magic Storm', vi: 'Bão ma thuật' },
        theme: 'Magic',
        difficulty: 'hard',
        canTrigger: (chunk) => !['desert', 'cave'].includes(chunk.terrain),
        outcomes: {
            CriticalFailure: {
                description: { en: 'A violent magic storm erupts! You are struck by a bolt of raw magic, causing massive damage.', vi: 'Một cơn bão ma thuật dữ dội bùng nổ! Bạn bị một tia ma thuật thô đánh trúng, gây sát thương lớn.' },
                effects: { hpChange: -40 }
            },
            Failure: {
                description: { en: 'A tempest of wild magic swirls around you, sapping your life force.', vi: 'Một cơn bão ma thuật hoang dã xoáy quanh bạn, hút cạn sinh lực của bạn.' },
                effects: { hpChange: -30 }
            },
            Success: {
                description: { en: 'You weather the magical storm. The chaotic energy tears a nearby tree apart, revealing its hardened core.', vi: 'Bạn chống chọi với cơn bão ma thuật. Năng lượng hỗn loạn xé toạc một cái cây gần đó, để lộ ra lõi cứng của nó.' },
                effects: { hpChange: -20, items: [{ name: 'wood_core', quantity: 1 }] }
            },
            GreatSuccess: {
                description: { en: 'You brace yourself against the storm. The raw power is painful, but you manage to collect some of the energized wood.', vi: 'Bạn chống cự lại cơn bão. Sức mạnh thô thiển gây đau đớn, nhưng bạn đã cố gắng thu thập một số gỗ được tăng cường năng lượng.' },
                effects: { hpChange: -10, items: [{ name: 'wood_core', quantity: 2 }] }
            },
            CriticalSuccess: {
                description: { en: 'You find a moment of calm in the eye of the storm. The intense magical energy crystallizes the air, leaving behind precious resources.', vi: 'Bạn tìm thấy một khoảnh khắc yên tĩnh trong mắt bão. Năng lượng ma thuật mãnh liệt kết tinh không khí, để lại những tài nguyên quý giá.' },
                effects: { items: [{ name: 'wood_core', quantity: 2 }, { name: 'mountain_crystal', quantity: 1 }], manaChange: 25 }
            },
        },
    },

    // --- NORMAL EVENTS ---
    {
        id: 'lightRain',
        name: { en: 'Light Rain', vi: 'Mưa nhẹ' },
        theme: 'Normal',
        difficulty: 'easy',
        canTrigger: (chunk) => !['desert', 'volcanic', 'cave'].includes(chunk.terrain),
        outcomes: {
            Success: {
                description: { en: 'A gentle rain begins, cooling the air and restoring your stamina.', vi: 'Một cơn mưa nhẹ bắt đầu, làm mát không khí và phục hồi thể lực của bạn.' },
                effects: { staminaChange: 15, }
            },
            GreatSuccess: {
                description: { en: 'The refreshing rain brings life to the area, and a small creature emerges from hiding.', vi: 'Cơn mưa sảng khoái mang lại sự sống cho khu vực, và một sinh vật nhỏ chui ra từ chỗ ẩn nấp.' },
                effects: { staminaChange: 25, spawnEnemy: { type: 'Aggressive Rabbit', hp: 20, damage: 5 }, }
            }
        },
    },
    {
        id: 'blizzard',
        name: { en: 'Blizzard', vi: 'Bão tuyết' },
        theme: 'Normal',
        difficulty: 'hard',
        canTrigger: (chunk, player, season) => ['mountain', 'forest'].includes(chunk.terrain) && (season === 'winter' || (chunk.temperature ?? 50) < 2),
        outcomes: {
            Failure: {
                description: { en: 'The blizzard is relentless. The biting cold saps your strength and health.', vi: 'Cơn bão tuyết không ngừng nghỉ. Cái lạnh cắt da làm cạn kiệt sức lực và máu của bạn.' },
                effects: { hpChange: -25, staminaChange: -25 }
            },
            Success: {
                description: { en: 'You push through the blinding snow, but the effort leaves you exhausted and chilled.', vi: 'Bạn vượt qua lớp tuyết mù mịt, nhưng nỗ lực đó khiến bạn kiệt sức và lạnh cóng.' },
                effects: { hpChange: -15, staminaChange: -15 }
            },
            CriticalSuccess: {
                description: { en: 'You find a small, sheltered alcove out of the wind. In it, you find some firewood left by a previous traveler.', vi: 'Bạn tìm thấy một hốc nhỏ, có mái che khuất gió. Trong đó, bạn tìm thấy một ít củi do một du khách trước đó để lại.' },
                effects: { items: [{ name: 'wood_core', quantity: 1 }] }
            },
        },
    },
    // --- RARE EVENTS ---
    {
        id: 'fallenStar',
        name: { en: 'Fallen Star', vi: 'Sao rơi' },
        theme: 'Magic',
        difficulty: 'hard',
        chance: 0.1,
        canTrigger: (chunk) => chunk.lightLevel !== undefined && chunk.lightLevel < -5 && chunk.terrain !== 'cave',
        outcomes: {
            CriticalFailure: {
                description: { en: 'You rush towards the impact crater but get too close to the searing heat, getting burned.', vi: 'Bạn lao về phía miệng hố va chạm nhưng lại đến quá gần sức nóng thiêu đốt, bị bỏng.' },
                effects: { hpChange: -20 }
            },
            Failure: {
                description: { en: 'You find the crater where the star landed. It has already cooled into a large, useless chunk of obsidian.', vi: 'Bạn tìm thấy miệng hố nơi ngôi sao rơi xuống. Nó đã nguội thành một khối obsidian lớn, vô dụng.' },
                effects: { items: [{ name: 'obsidian', quantity: 1 }] }
            },
            Success: {
                description: { en: 'You carefully approach the crater and find a warm, glowing shard of the fallen star.', vi: 'Bạn cẩn thận tiếp cận miệng hố và tìm thấy một mảnh vỡ ấm áp, phát sáng của ngôi sao rơi.' },
                effects: { items: [{ name: 'magma_heart', quantity: 1 }] }
            },
            GreatSuccess: {
                description: { en: 'As you approach, you find a pulsating core from the star, along with some magically charged sand.', vi: 'Khi bạn đến gần, bạn tìm thấy một lõi đang đập từ ngôi sao, cùng với một ít cát được tích điện ma thuật.' },
                effects: { items: [{ name: 'magma_heart', quantity: 1 }, { name: 'magic_sand', quantity: 1 }] }
            },
            CriticalSuccess: {
                description: { en: 'The fallen star is not a rock, but a small, sentient light creature. It thanks you for not disturbing it, gifts you a crystal, and vanishes, leaving you feeling magically refreshed.', vi: 'Ngôi sao rơi không phải là một tảng đá, mà là một sinh vật ánh sáng nhỏ, có tri giác. Nó cảm ơn bạn vì đã không làm phiền, tặng bạn một viên pha lê và biến mất, để lại cho bạn cảm giác sảng khoái về mặt ma thuật.' },
                effects: { items: [{ name: 'mountain_crystal', quantity: 1 }], manaChange: 25 }
            },
        },
    },
    {
        id: 'abandonedCaravan',
        name: { en: 'Abandoned Caravan', vi: 'Đoàn lữ hành bị bỏ hoang' },
        theme: 'Normal',
        difficulty: 'medium',
        chance: 0.2,
        canTrigger: (chunk) => ['grassland', 'desert'].includes(chunk.terrain) && chunk.humanPresence > 3,
        outcomes: {
            Failure: {
                description: { en: 'You come across an abandoned caravan, but it has already been picked clean by scavengers. You only find some torn cloth.', vi: 'Bạn bắt gặp một đoàn lữ hành bị bỏ hoang, nhưng nó đã bị những kẻ nhặt rác dọn sạch. Bạn chỉ tìm thấy một ít vải rách.' },
                effects: { items: [{ name: 'torn_cloth', quantity: 2 }] }
            },
            Success: {
                description: { en: 'You search the wagons and find some forgotten supplies.', vi: 'Bạn tìm kiếm các toa xe và tìm thấy một số đồ tiếp tế bị bỏ quên.' },
                effects: { items: [{ name: 'old_canteen', quantity: 1 }, { name: 'wheat', quantity: 2 }] }
            },
            GreatSuccess: {
                description: { en: 'You discover a heavy, locked chest under a tarp. With some effort, you manage to pry it open, revealing its valuable contents.', vi: 'Bạn phát hiện ra một chiếc rương nặng, bị khóa dưới một tấm bạt. Sau một hồi cố gắng, bạn đã cạy được nó ra, để lộ những món đồ có giá trị bên trong.' },
                effects: { items: [{ name: 'rusty_key', quantity: 1 }, { name: 'gold_vein', quantity: 1 }] }
            },
            CriticalSuccess: {
                description: { en: 'Tucked away in a hidden compartment, you find a meticulously drawn map that seems to lead to a place of interest.', vi: 'Giấu trong một ngăn bí mật, bạn tìm thấy một bản đồ được vẽ tỉ mỉ dường như dẫn đến một địa điểm thú vị.' },
                effects: { items: [{ name: 'ancient_map', quantity: 1 }] }
            },
        },
    },
    {
        id: 'ghostlyProcession',
        name: { en: 'Ghostly Procession', vi: 'Đoàn rước ma quái' },
        theme: 'Magic',
        difficulty: 'easy',
        chance: 0.15,
        canTrigger: (chunk) => ['swamp', 'forest'].includes(chunk.terrain) && chunk.lightLevel !== undefined && chunk.lightLevel < -5 && chunk.magicAffinity > 5,
        outcomes: {
            Failure: {
                description: { en: 'A procession of ghostly figures emerges from the mist. They seem angered by your presence and their chilling aura drains your stamina.', vi: 'Một đoàn rước những hình người ma quái hiện ra từ màn sương. Họ dường như tức giận vì sự hiện diện của bạn và luồng khí lạnh lẽo của họ hút cạn thể lực của bạn.' },
                effects: { staminaChange: -15 }
            },
            Success: {
                description: { en: 'You watch from a safe distance as a silent procession of spirits passes by. As they fade, they leave behind a single wisp of their essence.', vi: 'Bạn quan sát từ một khoảng cách an toàn khi một đoàn rước im lặng của các linh hồn đi qua. Khi họ mờ dần, họ để lại một làn khói tinh chất duy nhất.' },
                effects: { items: [{ name: 'wisp_essence', quantity: 1 }] }
            },
            GreatSuccess: {
                description: { en: 'One of the spirits in the procession seems to notice you and gives a slow nod of acknowledgement. It leaves behind a more potent gift as it fades away.', vi: 'Một trong những linh hồn trong đoàn rước dường như nhận ra bạn và gật đầu chậm rãi thừa nhận. Nó để lại một món quà mạnh mẽ hơn khi nó mờ dần.' },
                effects: { items: [{ name: 'wisp_essence', quantity: 2 }] }
            },
        },
    },
];

