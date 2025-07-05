
export const beach_vi = {
    descriptionTemplates: [
        'Một bãi biển [adjective] với cát trắng mịn. Tiếng sóng [sound] vỗ về bờ cát.',
        'Bạn đứng trên một bãi biển [adjective]. Những [feature] nằm rải rác trên bờ.',
    ],
    adjectives: ['yên tĩnh', 'hoang sơ', 'lộng gió'],
    features: ['vỏ sò', 'sao biển', 'đá cuội nhẵn bóng', 'gỗ mục trôi dạt'],
    smells: ['muối biển', 'cát ẩm', 'rong biển'],
    sounds: ['nhẹ nhàng', 'dữ dội', 'ầm ì'],
    NPCs: [],
    items: [
        { name: 'Sỏi', conditions: { chance: 0.3 } },
        { name: 'Cát Thường', conditions: { chance: 0.5 } },
    ],
    structures: [],
    enemies: [],
};

export const beach_en = {
    descriptionTemplates: [
        'A [adjective] beach with fine white sand. The [sound] waves gently lap the shore.',
        'You stand on a [adjective] beach. [feature] are scattered along the shore.',
    ],
    adjectives: ['peaceful', 'pristine', 'windy'],
    features: ['seashells', 'starfish', 'smooth pebbles', 'driftwood'],
    smells: ['sea salt', 'damp sand', 'seaweed'],
    sounds: ['gentle', 'roaring', 'murmuring'],
    NPCs: [],
    items: [
        { name: 'Sỏi', conditions: { chance: 0.3 } },
        { name: 'Cát Thường', conditions: { chance: 0.5 } },
    ],
    structures: [],
    enemies: [],
};
