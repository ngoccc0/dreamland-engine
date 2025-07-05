
export const tundra_vi = {
    descriptionTemplates: [
        'Một vùng lãnh nguyên [adjective] rộng lớn và lạnh lẽo. Gió [sound] qua những [feature] trơ trụi.',
        'Mặt đất đóng băng và cứng lại. Chỉ có những loài [feature] kiên cường nhất mới có thể tồn tại ở nơi [adjective] này.',
    ],
    adjectives: ['băng giá', 'hoang vắng', 'trống trải'],
    features: ['rêu', 'địa y', 'đá tảng'],
    smells: ['không khí lạnh', 'tuyết', 'đất băng'],
    sounds: ['rít', 'hú', 'vi vu'],
    NPCs: [],
    items: [
        { name: 'Tuyết', conditions: { chance: 0.5 } },
        { name: 'Cây Địa Y', conditions: { chance: 0.3 } },
    ],
    structures: [],
    enemies: [],
};

export const tundra_en = {
    descriptionTemplates: [
        'A vast and cold [adjective] tundra. The wind [sound] through the bare [feature].',
        'The ground is frozen and hard. Only the hardiest [feature] can survive in this [adjective] place.',
    ],
    adjectives: ['frozen', 'desolate', 'empty'],
    features: ['moss', 'lichen', 'boulders'],
    smells: ['cold air', 'snow', 'frozen earth'],
    sounds: ['whistles', 'howls', 'sings'],
    NPCs: [],
    items: [
        { name: 'Tuyết', conditions: { chance: 0.5 } },
        { name: 'Cây Địa Y', conditions: { chance: 0.3 } },
    ],
    structures: [],
    enemies: [],
};
