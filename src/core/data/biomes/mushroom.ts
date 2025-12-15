

export const mushroom_forest_vi = {
    descriptionTemplates: {
        short: [
            "Bạn đang ở trong một khu rừng nấm [adjective] khổng lồ.",
        ],
        medium: [
            "Một khu rừng toàn những cây nấm [adjective] khổng lồ. Không khí đầy những [smell] phát quang. Ánh sáng lờ mờ từ những [feature] chiếu rọi con đường. {sensory_details} {entity_report}",
            "Bạn đi lạc vào một khu rừng nấm [adjective]. Mặt đất mềm và xốp, phủ một lớp rêu. Những cây nấm [feature] tỏa ra mùi [smell]. {sensory_details} {entity_report}",
        ],
        long: [
            "Một thế giới kỳ ảo mở ra trước mắt bạn. Những cây nấm [adjective] khổng lồ vươn lên như những tòa tháp, tỏa ra ánh sáng lân tinh huyền ảo. Không khí [adjective] và đầy mùi [smell]. Âm thanh duy nhất là tiếng [sound] của những bào tử bay trong không khí. {sensory_details} {entity_report} {surrounding_peek}",
            "Bạn đang ở trong một khu rừng nấm [adjective], nơi ánh sáng và bóng tối nhảy múa. Những [feature] phát sáng tạo nên những hoa văn kỳ lạ trên mặt đất. Một cảm giác vừa mê hoặc vừa nguy hiểm. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['kỳ lạ', 'phát quang', 'huyền ảo', 'ẩm ướt', 'im lìm'],
    features: ['cây nấm', 'bào tử', 'thảm rêu', 'côn trùng phát sáng'],
    smells: ['mùi đất', 'mùi nấm', 'bào tử', 'mùi ozon'],
    sounds: ['tiếng thì thầm', 'sự im lặng', 'tiếng nấm phát triển', 'tiếng nước rỉ'],
    sky: [],
    NPCs: [],
    items: [
        { name: 'Nấm Độc', conditions: { chance: 0.3 } },
        { name: 'Nấm Phát Quang', conditions: { chance: 0.4 } },
        { name: 'Mảnh Tinh Thể', conditions: { magicAffinity: { min: 7 }, chance: 0.15 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Slime', emoji: '💧', hp: 30, damage: 8, behavior: 'passive', size: 'small', diet: ['Nấm Phát Quang'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Chất nhờn Slime', chance: 0.7, quantity: { min: 1, max: 3 } }] }, conditions: { moisture: { min: 8 }, chance: 0.4 } },
    ],
};

export const mushroom_forest_en = {
    descriptionTemplates: {
        short: [
            "You are in a forest of giant, [adjective] mushrooms.",
        ],
        medium: [
            "A forest of giant, [adjective] mushrooms. The air is filled with glowing [smell]. Faint light from the [feature] illuminates the path. {sensory_details} {entity_report}",
            "You wander into an [adjective] mushroom forest. The ground is soft and spongy, covered in a layer of moss. The [feature] mushrooms emit a [smell] scent. {sensory_details} {entity_report}",
        ],
        long: [
            "A fantastical world unfolds before you. Giant, [adjective] mushrooms rise like towers, emitting an ethereal phosphorescence. The air is [adjective] and filled with the scent of [smell]. The only sound is the [sound] of spores floating in the air. {sensory_details} {entity_report} {surrounding_peek}",
            "You are in an [adjective] mushroom forest where light and shadow dance. The glowing [feature] create strange patterns on the ground. A feeling of both enchantment and danger. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['strange', 'glowing', 'magical', 'damp', 'silent'],
    features: ['mushrooms', 'spores', 'moss carpets', 'glowing insects'],
    smells: ['earthy scent', 'mushroom scent', 'spores', 'ozone'],
    sounds: ['whispers', 'silence', 'the sound of mushrooms growing', 'water dripping'],
    sky: [],
    NPCs: [],
    items: [
        { name: 'Nấm Độc', conditions: { chance: 0.3 } },
        { name: 'Nấm Phát Quang', conditions: { chance: 0.4 } },
        { name: 'Mảnh Tinh Thể', conditions: { magicAffinity: { min: 7 }, chance: 0.15 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Slime', emoji: '💧', hp: 30, damage: 8, behavior: 'passive', size: 'small', diet: ['Nấm Phát Quang'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Chất nhờn Slime', chance: 0.7, quantity: { min: 1, max: 3 } }] }, conditions: { moisture: { min: 8 }, chance: 0.4 } },
    ],
};
