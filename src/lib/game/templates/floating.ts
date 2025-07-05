
export const floating_islands_vi = {
    descriptionTemplates: [
        'Bạn đang đứng trên một hòn đảo lơ lửng giữa bầu trời [adjective]. Gió [sound] thổi quanh bạn.',
        'Thảm thực vật [adjective] trên hòn đảo bay này. Bên dưới là một biển mây [feature].',
    ],
    adjectives: ['kỳ vĩ', 'yên bình', 'cổ xưa'],
    features: ['dày đặc', 'trắng xóa', 'bồng bềnh'],
    smells: ['không khí trong lành', 'hoa lạ', 'đất ẩm'],
    sounds: ['nhẹ nhàng', 'mạnh mẽ', 'vi vu'],
    NPCs: [],
    items: [
        { name: 'Lông Đại Bàng', conditions: { chance: 0.2 } },
        { name: 'Pha Lê Núi', conditions: { magicAffinity: { min: 8 }, chance: 0.15 } },
    ],
    structures: [],
    enemies: [],
};

export const floating_islands_en = {
    descriptionTemplates: [
        'You are standing on an island floating in the [adjective] sky. The wind [sound] around you.',
        '[adjective] vegetation covers this flying island. Below is a sea of [feature] clouds.',
    ],
    adjectives: ['majestic', 'peaceful', 'ancient'],
    features: ['thick', 'white', 'fluffy'],
    smells: ['fresh air', 'strange flowers', 'damp earth'],
    sounds: ['gently blows', 'blows strongly', 'whistles'],
    NPCs: [],
    items: [
        { name: 'Lông Đại Bàng', conditions: { chance: 0.2 } },
        { name: 'Pha Lê Núi', conditions: { magicAffinity: { min: 8 }, chance: 0.15 } },
    ],
    structures: [],
    enemies: [],
};
