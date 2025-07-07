
export const beach_vi = {
    descriptionTemplates: [
        'Một bãi biển [adjective] với cát trắng mịn. Tiếng sóng [sound] vỗ về bờ cát.',
        'Bạn đứng trên một bãi biển [adjective]. Những [feature] nằm rải rác trên bờ.',
        'Gió biển mặn mà thổi qua, mang theo mùi [smell]. Bờ cát [adjective] trải dài vô tận.',
        'Dưới ánh nắng, bãi biển trông thật [adjective]. Bạn thấy những [feature] lấp lánh trên cát.'
    ],
    adjectives: ['yên tĩnh', 'hoang sơ', 'lộng gió', 'vắng vẻ', 'ngập nắng'],
    features: ['vỏ sò', 'sao biển', 'đá cuội nhẵn bóng', 'gỗ mục trôi dạt', 'tảo biển khô'],
    smells: ['muối biển', 'cát ẩm', 'rong biển', 'cá khô'],
    sounds: ['nhẹ nhàng', 'dữ dội', 'ầm ì', 'thì thầm'],
    NPCs: [],
    items: [
        { name: 'Sỏi', conditions: { chance: 0.3 } },
        { name: 'Cát Thường', conditions: { chance: 0.5 } },
        { name: 'Đá Cuội', conditions: { chance: 0.2 } },
    ],
    structures: [],
    enemies: [],
};

export const beach_en = {
    descriptionTemplates: [
        'A [adjective] beach with fine white sand. The [sound] waves gently lap the shore.',
        'You stand on a [adjective] beach. [feature] are scattered along the shore.',
        'The salty sea breeze blows, carrying the scent of [smell]. The [adjective] sand stretches endlessly.',
        'Under the sun, the beach looks [adjective]. You see sparkling [feature] on the sand.'
    ],
    adjectives: ['peaceful', 'pristine', 'windy', 'desolate', 'sun-drenched'],
    features: ['seashells', 'starfish', 'smooth pebbles', 'driftwood', 'dried seaweed'],
    smells: ['sea salt', 'damp sand', 'seaweed', 'dried fish'],
    sounds: ['gentle', 'roaring', 'murmuring', 'whispering'],
    NPCs: [],
    items: [
        { name: 'Sỏi', conditions: { chance: 0.3 } },
        { name: 'Cát Thường', conditions: { chance: 0.5 } },
        { name: 'Đá Cuội', conditions: { chance: 0.2 } },
    ],
    structures: [],
    enemies: [],
};
