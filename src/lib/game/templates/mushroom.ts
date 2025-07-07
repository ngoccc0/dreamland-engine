
export const mushroom_forest_vi = {
    descriptionTemplates: [
        'Một khu rừng toàn những cây nấm [adjective] khổng lồ. Không khí đầy những [smell] phát quang.',
        'Bạn đi lạc vào một khu rừng nấm [adjective]. Ánh sáng lờ mờ từ những [feature] chiếu rọi con đường.',
        'Mặt đất mềm và xốp, phủ một lớp rêu [adjective]. Những cây nấm [feature] tỏa ra mùi [smell].',
        'Âm thanh duy nhất là tiếng [sound] của những bào tử bay trong không khí [adjective].'
    ],
    adjectives: ['kỳ lạ', 'phát quang', 'huyền ảo', 'ẩm ướt', 'im lìm'],
    features: ['cây nấm', 'bào tử', 'thảm rêu', 'côn trùng phát sáng'],
    smells: ['mùi đất', 'mùi nấm', 'bào tử', 'mùi ozon'],
    sounds: ['tiếng thì thầm', 'sự im lặng', 'tiếng nấm phát triển', 'tiếng nước rỉ'],
    NPCs: [],
    items: [
        { name: 'Nấm Độc', conditions: { chance: 0.3 } },
        { name: 'Nấm Phát Quang', conditions: { chance: 0.4 } },
        { name: 'Mảnh Tinh Thể', conditions: { magicAffinity: { min: 7 }, chance: 0.15 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Slime', emoji: '💧', hp: 30, damage: 8, behavior: 'passive', size: 'small', diet: ['Nấm Phát Quang'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn Slime', chance: 0.7, quantity: {min: 1, max: 3}}] }, conditions: { moisture: { min: 8 }, chance: 0.4 } },
    ],
};

export const mushroom_forest_en = {
    descriptionTemplates: [
        'A forest of giant, [adjective] mushrooms. The air is filled with glowing [smell].',
        'You wander into an [adjective] mushroom forest. Faint light from the [feature] illuminates the path.',
        'The ground is soft and spongy, covered in a layer of [adjective] moss. The [feature] mushrooms emit a [smell] scent.',
        'The only sound is the [sound] of spores floating in the [adjective] air.'
    ],
    adjectives: ['strange', 'glowing', 'magical', 'damp', 'silent'],
    features: ['mushrooms', 'spores', 'moss carpets', 'glowing insects'],
    smells: ['earthy scent', 'mushroom scent', 'spores', 'ozone'],
    sounds: ['whispers', 'silence', 'the sound of mushrooms growing', 'water dripping'],
    NPCs: [],
    items: [
        { name: 'Nấm Độc', conditions: { chance: 0.3 } },
        { name: 'Nấm Phát Quang', conditions: { chance: 0.4 } },
        { name: 'Mảnh Tinh Thể', conditions: { magicAffinity: { min: 7 }, chance: 0.15 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Slime', emoji: '💧', hp: 30, damage: 8, behavior: 'passive', size: 'small', diet: ['Nấm Phát Quang'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn Slime', chance: 0.7, quantity: {min: 1, max: 3}}] }, conditions: { moisture: { min: 8 }, chance: 0.4 } },
    ],
};
