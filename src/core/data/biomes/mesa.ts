

export const mesa_vi = {
    descriptionTemplates: {
        short: [
            "Bạn đang ở trên một cao nguyên [adjective] với những vách đá sa thạch đỏ.",
        ],
        medium: [
            "Một hẻm núi [adjective] với những vách đá sa thạch đỏ. Gió [sound] qua các khe núi, tạo nên âm thanh ma mị. {sensory_details} {entity_report}",
            "Bạn đang ở trên một cao nguyên [adjective]. Những [feature] tạo nên một cảnh quan hùng vĩ và hoang sơ. {sensory_details} {entity_report}",
        ],
        long: [
            "Vách đá [adjective] dựng đứng hai bên, nhuốm màu đỏ của hoàng hôn. Phía dưới là một lòng sông cạn khô, đầy [feature]. Không khí có mùi [smell] của đất và đá nóng. {sensory_details} {entity_report} {surrounding_peek}",
            "Mặt trời chiếu xuống làm những tảng đá [adjective] trở nên nóng rực. Bạn nghe thấy tiếng [sound] vọng lại từ xa, một bản giao hưởng của sự im lặng và gió. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['khô cằn', 'hùng vĩ', 'lộng gió', 'cổ xưa'],
    features: ['cột đá', 'vòm đá tự nhiên', 'bụi cây thấp', 'đá cuội'],
    smells: ['đá nóng', 'bụi đất', 'không khí khô', 'cây xô thơm'],
    sounds: ['rít', 'thổi mạnh', 'vi vu', 'tiếng vọng'],
    sky: ['xanh trong', 'vàng rực'],
    NPCs: [],
    items: [
        { name: 'Đá Sa Thạch', conditions: { chance: 0.4 } },
        { name: 'Đá Cuội', conditions: { chance: 0.25 } },
        { name: 'Cỏ Khô', conditions: { chance: 0.3 } },
        { name: 'Lông Đại Bàng', conditions: { chance: 0.1 } },
    ],
    structures: [],
    enemies: [],
};

export const mesa_en = {
    descriptionTemplates: {
        short: [
            "You are on an [adjective] plateau with red sandstone cliffs.",
        ],
        medium: [
            "An [adjective] canyon with red sandstone cliffs. The wind [sound] through the ravines, creating an eerie sound. {sensory_details} {entity_report}",
            "You are on an [adjective] plateau. [feature] create a majestic and wild landscape. {sensory_details} {entity_report}",
        ],
        long: [
            "[adjective] cliffs rise on either side, painted red by the sunset. Below is a dry riverbed, filled with [feature]. The air smells of hot [smell] and earth. {sensory_details} {entity_report} {surrounding_peek}",
            "The sun beats down, making the [adjective] rocks scorching hot. You hear the [sound] echoing from afar, a symphony of silence and wind. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['arid', 'majestic', 'windswept', 'ancient'],
    features: ['rock pillars', 'natural arches', 'low shrubs', 'pebbles'],
    smells: ['hot rock', 'dust', 'dry air', 'sagebrush'],
    sounds: ['whistles', 'blows strongly', 'howls', 'echoes'],
    sky: ['clear blue', 'brilliant gold'],
    NPCs: [],
    items: [
        { name: 'Đá Sa Thạch', conditions: { chance: 0.4 } },
        { name: 'Cỏ Khô', conditions: { chance: 0.3 } },
        { name: 'Lông Đại Bàng', conditions: { chance: 0.1 } },
    ],
    structures: [],
    enemies: [],
};
