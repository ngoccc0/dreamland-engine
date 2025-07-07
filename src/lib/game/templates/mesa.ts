
export const mesa_vi = {
    descriptionTemplates: [
        'Một hẻm núi [adjective] với những vách đá sa thạch đỏ. Gió [sound] qua các khe núi.',
        'Bạn đang ở trên một cao nguyên [adjective]. Những [feature] tạo nên một cảnh quan hùng vĩ.',
        'Vách đá [adjective] dựng đứng hai bên. Phía dưới là một lòng sông cạn khô, đầy [feature].',
        'Mặt trời chiếu xuống làm những tảng đá [adjective] trở nên nóng rực. Bạn nghe thấy tiếng [sound] vọng lại từ xa.'
    ],
    adjectives: ['khô cằn', 'hùng vĩ', 'lộng gió', 'cổ xưa'],
    features: ['cột đá', 'vòm đá tự nhiên', 'bụi cây thấp', 'đá cuội'],
    smells: ['đá nóng', 'bụi đất', 'không khí khô', 'cây xô thơm'],
    sounds: ['rít', 'thổi mạnh', 'vi vu', 'tiếng vọng'],
    NPCs: [],
    items: [
        { name: 'Đá Sa Thạch', conditions: { chance: 0.4 } },
        { name: 'Cỏ Khô', conditions: { chance: 0.3 } },
        { name: 'Lông Đại Bàng', conditions: { chance: 0.1 } },
    ],
    structures: [],
    enemies: [],
};

export const mesa_en = {
    descriptionTemplates: [
        'An [adjective] mesa with red sandstone cliffs. The wind [sound] through the canyons.',
        'You are on an [adjective] plateau. [feature] create a majestic landscape.',
        '[adjective] cliffs rise on either side. Below is a dry riverbed, filled with [feature].',
        'The sun beats down, making the [adjective] rocks scorching hot. You hear the [sound] echoing from afar.'
    ],
    adjectives: ['arid', 'majestic', 'windswept', 'ancient'],
    features: ['rock pillars', 'natural arches', 'low shrubs', 'pebbles'],
    smells: ['hot rock', 'dust', 'dry air', 'sagebrush'],
    sounds: ['whistles', 'blows strongly', 'howls', 'echoes'],
    NPCs: [],
    items: [
        { name: 'Đá Sa Thạch', conditions: { chance: 0.4 } },
        { name: 'Cỏ Khô', conditions: { chance: 0.3 } },
        { name: 'Lông Đại Bàng', conditions: { chance: 0.1 } },
    ],
    structures: [],
    enemies: [],
};
