

export const ocean_vi = {
    descriptionTemplates: {
        short: [
            "Một đại dương [adjective] bao la trải dài đến tận chân trời.",
        ],
        medium: [
            "Một đại dương [adjective] bao la trải dài đến tận chân trời. Những [feature] lấp lánh dưới ánh mặt trời. Gió mang theo mùi [smell] và tiếng [sound] không ngớt. {sensory_details} {entity_report}",
            "Bạn đang ở giữa biển khơi [adjective]. Nước biển trong vắt, bạn có thể thấy những [feature] bơi lội bên dưới. Một cảm giác [adjective] bao trùm. {sensory_details} {entity_report}",
        ],
        long: [
            "Bốn bề là nước. Một đại dương [adjective] vô tận. Những con sóng [sound] vỗ vào mạn thuyền. Xa xa là một [feature] trên đường chân trời, một tia hy vọng hoặc một mối nguy hiểm tiềm tàng. {sensory_details} {entity_report} {surrounding_peek}",
            "Bầu trời [sky] phản chiếu trên mặt biển [adjective], tạo nên một màu xanh ngắt không thể phân biệt. Gió mang theo mùi [smell] của biển cả và tiếng [sound] của những sinh vật biển từ nơi sâu thẳm. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['sâu thẳm', 'mênh mông', 'dữ dội', 'yên ả', 'xanh biếc'],
    features: ['sóng bạc đầu', 'đàn cá heo', 'hải đăng xa xăm', 'đảo nhỏ', 'đàn cá'],
    smells: ['muối biển', 'không khí trong lành', 'cá', 'mùi bão'],
    sounds: ['sóng vỗ', 'hải âu kêu', 'gió biển', 'cá voi hát'],
    sky: ['trong xanh', 'đầy mây', 'bão tố'],
    NPCs: [],
    items: [],
    structures: [],
    enemies: [
        { data: { type: 'Cá mập', emoji: '🦈', hp: 100, damage: 25, behavior: 'aggressive', size: 'large', diet: [], satiation: 0, maxSatiation: 1, loot: [{ name: 'Răng Cá Sấu', chance: 0.5, quantity: { min: 3, max: 6 } }] }, conditions: { chance: 0.1 } },
    ],
};

export const ocean_en = {
    descriptionTemplates: {
        short: [
            "A vast, [adjective] ocean stretches to the horizon.",
        ],
        medium: [
            "A vast, [adjective] ocean stretches to the horizon. The [feature] glisten under the sun. The wind carries the scent of [smell] and the incessant sound of [sound]. {sensory_details} {entity_report}",
            "You are in the middle of an [adjective] sea. The seawater is crystal clear, you can see [feature] swimming below. A feeling of [adjective] pervades. {sensory_details} {entity_report}",
        ],
        long: [
            "Water in all directions. An endless, [adjective] ocean. [sound] waves crash against the side of the boat. Far away is a [feature] on the horizon, a glimmer of hope or a potential danger. {sensory_details} {entity_report} {surrounding_peek}",
            "The [sky] sky reflects on the [adjective] sea, creating an indistinguishable azure expanse. The wind carries the [smell] of the sea and the [sound] of marine creatures from the depths. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['deep', 'vast', 'rough', 'calm', 'azure'],
    features: ['white-capped waves', 'a pod of dolphins', 'a distant lighthouse', 'small islands', 'schools of fish'],
    smells: ['sea salt', 'fresh air', 'fish', 'the scent of a storm'],
    sounds: ['crashing waves', 'seagull cries', 'sea wind', 'whale songs'],
    sky: ['clear', 'cloudy', 'stormy'],
    NPCs: [],
    items: [],
    structures: [],
    enemies: [
        { data: { type: 'Shark', emoji: '🦈', hp: 100, damage: 25, behavior: 'aggressive', size: 'large', diet: [], satiation: 0, maxSatiation: 1, loot: [{ name: 'Răng Cá Sấu', chance: 0.5, quantity: { min: 3, max: 6 } }] }, conditions: { chance: 0.1 } },
    ],
};
