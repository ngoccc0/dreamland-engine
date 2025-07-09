

export const tundra_vi = {
    descriptionTemplates: {
        short: [
            "Một vùng lãnh nguyên [adjective] rộng lớn và lạnh lẽo.",
        ],
        medium: [
            "Một vùng lãnh nguyên [adjective] rộng lớn và lạnh lẽo. Gió [sound] qua những [feature] trơ trụi. Bầu trời [sky] xám xịt. {sensory_details} {entity_report}",
            "Mặt đất đóng băng và cứng lại. Chỉ có những loài [feature] kiên cường nhất mới có thể tồn tại ở nơi [adjective] này. {sensory_details} {entity_report}",
        ],
        long: [
            "Tuyết phủ trắng xóa đến tận chân trời. Một cảm giác [adjective] và cô độc bao trùm, chỉ có tiếng gió [sound] làm bạn đồng hành. Những [feature] bám trên đá là dấu hiệu duy nhất của sự sống. {sensory_details} {entity_report} {surrounding_peek}",
            "Gió [sound], mang theo cái lạnh cắt da. Bầu trời [sky] và mặt đất tuyết trắng hòa làm một, tạo nên một không gian vô tận và [adjective]. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['băng giá', 'hoang vắng', 'trống trải', 'tĩnh lặng'],
    features: ['rêu', 'địa y', 'đá tảng', 'sông băng'],
    smells: ['không khí lạnh', 'tuyết', 'đất băng', 'sự tinh khiết'],
    sounds: ['rít', 'hú', 'vi vu', 'tiếng tuyết lạo xạo'],
    sky: ['xám xịt', 'trắng xóa', 'trong vắt'],
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
    descriptionTemplates: {
        short: [
            "A vast and cold [adjective] tundra.",
        ],
        medium: [
            "A vast and cold [adjective] tundra. The wind [sound] through the bare [feature]. The [sky] sky is gray. {sensory_details} {entity_report}",
            "The ground is frozen and hard. Only the hardiest [feature] can survive in this [adjective] place. {sensory_details} {entity_report}",
        ],
        long: [
            "White snow covers everything to the horizon. A feeling of [adjective] loneliness pervades, with only the [sound] of the wind for company. The [feature] clinging to the rocks are the only sign of life. {sensory_details} {entity_report} {surrounding_peek}",
            "The wind [sound], carrying a biting cold. The [sky] sky and the white snowy ground merge into one, creating an endless and [adjective] space. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['frozen', 'desolate', 'empty', 'silent'],
    features: ['moss', 'lichen', 'boulders', 'glaciers'],
    smells: ['cold air', 'snow', 'frozen earth', 'purity'],
    sounds: ['whistles', 'howls', 'sings', 'the crunch of snow'],
    sky: ['gray', 'whiteout', 'crystal clear'],
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
