
export const mesa_vi = {
    descriptionTemplates: [
        'Một hẻm núi [adjective] với những vách đá sa thạch đỏ. Gió [sound] qua các khe núi.',
        'Bạn đang ở trên một cao nguyên [adjective]. Những [feature] tạo nên một cảnh quan hùng vĩ.',
    ],
    adjectives: ['khô cằn', 'hùng vĩ', 'lộng gió'],
    features: ['cột đá', 'vòm đá tự nhiên', 'bụi cây thấp'],
    smells: ['đá nóng', 'bụi đất', 'không khí khô'],
    sounds: ['rít', 'thổi mạnh', 'vi vu'],
    NPCs: [],
    items: [
        { name: 'Đá Sa Thạch', conditions: { chance: 0.4 } },
        { name: 'Cỏ Khô', conditions: { chance: 0.3 } },
    ],
    structures: [],
    enemies: [],
};

export const mesa_en = {
    descriptionTemplates: [
        'An [adjective] mesa with red sandstone cliffs. The wind [sound] through the canyons.',
        'You are on an [adjective] plateau. [feature] create a majestic landscape.',
    ],
    adjectives: ['arid', 'majestic', 'windswept'],
    features: ['rock pillars', 'natural arches', 'low shrubs'],
    smells: ['hot rock', 'dust', 'dry air'],
    sounds: ['whistles', 'blows strongly', 'howls'],
    NPCs: [],
    items: [
        { name: 'Đá Sa Thạch', conditions: { chance: 0.4 } },
        { name: 'Cỏ Khô', conditions: { chance: 0.3 } },
    ],
    structures: [],
    enemies: [],
};
