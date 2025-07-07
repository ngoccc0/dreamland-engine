
export const ocean_vi = {
    descriptionTemplates: [
        'Một đại dương [adjective] bao la trải dài đến tận chân trời. Những [feature] lấp lánh dưới ánh mặt trời.',
        'Bạn đang đứng trước một vùng biển [adjective]. Gió mang theo mùi [smell] và tiếng [sound] không ngớt.',
        'Nước biển trong vắt, bạn có thể thấy những [feature] bơi lội bên dưới. Một cảm giác [adjective] bao trùm.',
        'Những con sóng [sound] vỗ vào mạn thuyền. Xa xa là một [feature] trên đường chân trời.'
    ],
    adjectives: ['sâu thẳm', 'mênh mông', 'dữ dội', 'yên ả', 'xanh biếc'],
    features: ['sóng bạc đầu', 'đàn cá heo', 'hải đăng xa xăm', 'đảo nhỏ', 'đàn cá'],
    smells: ['muối biển', 'không khí trong lành', 'cá', 'mùi bão'],
    sounds: ['sóng vỗ', 'hải âu kêu', 'gió biển', 'cá voi hát'],
    NPCs: [],
    items: [],
    structures: [],
    enemies: [
        { data: { type: 'Cá mập', emoji: '🦈', hp: 100, damage: 25, behavior: 'aggressive', size: 'large', diet: [], satiation: 0, maxSatiation: 1, loot: [{name: 'Răng Cá Sấu', chance: 0.5, quantity: {min: 3, max: 6}}] }, conditions: { chance: 0.1 } },
    ],
};

export const ocean_en = {
    descriptionTemplates: [
        'A vast, [adjective] ocean stretches to the horizon. The [feature] glisten under the sun.',
        'You are facing an [adjective] sea. The wind carries the scent of [smell] and the incessant sound of [sound].',
        'The seawater is crystal clear, you can see [feature] swimming below. A feeling of [adjective] pervades.',
        '[sound] waves crash against the side of the boat. Far away is a [feature] on the horizon.'
    ],
    adjectives: ['deep', 'vast', 'rough', 'calm', 'azure'],
    features: ['white-capped waves', 'a pod of dolphins', 'a distant lighthouse', 'small islands', 'schools of fish'],
    smells: ['sea salt', 'fresh air', 'fish', 'the scent of a storm'],
    sounds: ['crashing waves', 'seagull cries', 'sea wind', 'whale songs'],
    NPCs: [],
    items: [],
    structures: [],
    enemies: [
        { data: { type: 'Shark', emoji: '🦈', hp: 100, damage: 25, behavior: 'aggressive', size: 'large', diet: [], satiation: 0, maxSatiation: 1, loot: [{name: 'Răng Cá Sấu', chance: 0.5, quantity: {min: 3, max: 6}}] }, conditions: { chance: 0.1 } },
    ],
};
