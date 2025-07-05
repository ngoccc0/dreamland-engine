
export const ocean_vi = {
    descriptionTemplates: [
        'Một đại dương [adjective] bao la trải dài đến tận chân trời. Những [feature] lấp lánh dưới ánh mặt trời.',
        'Bạn đang đứng trước một vùng biển [adjective]. Gió mang theo mùi [smell] và tiếng [sound] không ngớt.',
    ],
    adjectives: ['sâu thẳm', 'mênh mông', 'dữ dội', 'yên ả'],
    features: ['sóng bạc đầu', 'đàn cá heo', 'hải đăng xa xăm', 'đảo nhỏ'],
    smells: ['muối biển', 'không khí trong lành', 'cá'],
    sounds: ['sóng vỗ', 'hải âu kêu', 'gió biển'],
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
    ],
    adjectives: ['deep', 'vast', 'rough', 'calm'],
    features: ['white-capped waves', 'a pod of dolphins', 'a distant lighthouse', 'small islands'],
    smells: ['sea salt', 'fresh air', 'fish'],
    sounds: ['crashing waves', 'seagull cries', 'sea wind'],
    NPCs: [],
    items: [],
    structures: [],
    enemies: [
        { data: { type: 'Shark', emoji: '🦈', hp: 100, damage: 25, behavior: 'aggressive', size: 'large', diet: [], satiation: 0, maxSatiation: 1, loot: [{name: 'Răng Cá Sấu', chance: 0.5, quantity: {min: 3, max: 6}}] }, conditions: { chance: 0.1 } },
    ],
};
