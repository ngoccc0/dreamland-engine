
export const tundra_vi = {
    descriptionTemplates: [
        'Một vùng lãnh nguyên [adjective] rộng lớn và lạnh lẽo. Gió [sound] qua những [feature] trơ trụi.',
        'Mặt đất đóng băng và cứng lại. Chỉ có những loài [feature] kiên cường nhất mới có thể tồn tại ở nơi [adjective] này.',
        'Tuyết phủ trắng xóa đến tận chân trời. Một cảm giác [adjective] và cô độc bao trùm.',
        'Gió [sound], mang theo cái lạnh cắt da. Bạn thấy những [feature] bám trên đá.'
    ],
    adjectives: ['băng giá', 'hoang vắng', 'trống trải', 'tĩnh lặng'],
    features: ['rêu', 'địa y', 'đá tảng', 'sông băng'],
    smells: ['không khí lạnh', 'tuyết', 'đất băng', 'sự tinh khiết'],
    sounds: ['rít', 'hú', 'vi vu', 'tiếng tuyết lạo xạo'],
    NPCs: [],
    items: [
        { name: 'Tuyết', conditions: { chance: 0.5 } },
        { name: 'Cây Địa Y', conditions: { chance: 0.3 } },
        { name: 'Đá Granit', conditions: { chance: 0.2 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Báo tuyết', emoji: '🐆', hp: 60, damage: 20, behavior: 'aggressive', size: 'large', diet: ['Dê núi hung hãn'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Báo Tuyết', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Thịt Báo Tuyết', chance: 0.6, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.25 } },
    ],
};

export const tundra_en = {
    descriptionTemplates: [
        'A vast and cold [adjective] tundra. The wind [sound] through the bare [feature].',
        'The ground is frozen and hard. Only the hardiest [feature] can survive in this [adjective] place.',
        'White snow covers everything to the horizon. A feeling of [adjective] loneliness pervades.',
        'The wind [sound], carrying a biting cold. You see [feature] clinging to the rocks.'
    ],
    adjectives: ['frozen', 'desolate', 'empty', 'silent'],
    features: ['moss', 'lichen', 'boulders', 'glaciers'],
    smells: ['cold air', 'snow', 'frozen earth', 'purity'],
    sounds: ['whistles', 'howls', 'sings', 'the crunch of snow'],
    NPCs: [],
    items: [
        { name: 'Tuyết', conditions: { chance: 0.5 } },
        { name: 'Cây Địa Y', conditions: { chance: 0.3 } },
        { name: 'Đá Granit', conditions: { chance: 0.2 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Snow Leopard', emoji: '🐆', hp: 60, damage: 20, behavior: 'aggressive', size: 'large', diet: ['Aggressive Mountain Goat'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Báo Tuyết', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Thịt Báo Tuyết', chance: 0.6, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.25 } },
    ],
};
