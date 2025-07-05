
export const mushroom_forest_vi = {
    descriptionTemplates: [
        'Một khu rừng toàn những cây nấm [adjective] khổng lồ. Không khí đầy những [smell] phát quang.',
        'Bạn đi lạc vào một khu rừng nấm [adjective]. Ánh sáng lờ mờ từ những [feature] chiếu rọi con đường.',
    ],
    adjectives: ['kỳ lạ', 'phát quang', 'huyền ảo'],
    features: ['cây nấm', 'bào tử', 'thảm rêu'],
    smells: ['mùi đất', 'mùi nấm', 'bào tử'],
    sounds: ['tiếng thì thầm', 'sự im lặng', 'tiếng nấm phát triển'],
    NPCs: [],
    items: [
        { name: 'Nấm Độc', conditions: { chance: 0.3 } },
        { name: 'Nấm Phát Quang', conditions: { chance: 0.4 } },
    ],
    structures: [],
    enemies: [],
};

export const mushroom_forest_en = {
    descriptionTemplates: [
        'A forest of giant, [adjective] mushrooms. The air is filled with glowing [smell].',
        'You wander into an [adjective] mushroom forest. Faint light from the [feature] illuminates the path.',
    ],
    adjectives: ['strange', 'glowing', 'magical'],
    features: ['mushrooms', 'spores', 'moss carpets'],
    smells: ['earthy scent', 'mushroom scent', 'spores'],
    sounds: ['whispers', 'silence', 'the sound of mushrooms growing'],
    NPCs: [],
    items: [
        { name: 'Nấm Độc', conditions: { chance: 0.3 } },
        { name: 'Nấm Phát Quang', conditions: { chance: 0.4 } },
    ],
    structures: [],
    enemies: [],
};
