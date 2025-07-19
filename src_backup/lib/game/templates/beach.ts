

export const beach_vi = {
    descriptionTemplates: {
        short: [
            "Bạn đang ở trên một bãi biển [adjective] với cát trắng mịn.",
        ],
        medium: [
            "Một bãi biển [adjective] với cát trắng mịn. Tiếng sóng [sound] vỗ về bờ cát, và không khí phảng phất mùi [smell]. {sensory_details} {entity_report}",
            "Bạn đứng trên một bãi biển [adjective], nơi những [feature] nằm rải rác trên bờ. Gió biển mặn mà thổi qua. {sensory_details} {entity_report}",
        ],
        long: [
            "Bờ cát [adjective] trải dài vô tận dưới bầu trời [sky]. Gió biển mặn mà thổi qua, mang theo mùi [smell] và tiếng sóng [sound] không ngớt. Cảnh tượng thật yên bình nhưng cũng đầy hoang sơ. {sensory_details} {entity_report} {surrounding_peek}",
            "Dưới ánh nắng, bãi biển trông thật [adjective]. Bạn thấy những [feature] lấp lánh trên cát, bị sóng cuốn vào rồi lại đẩy ra. Một cảm giác tự do và cô độc bao trùm. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['yên tĩnh', 'hoang sơ', 'lộng gió', 'vắng vẻ', 'ngập nắng'],
    features: ['vỏ sò', 'sao biển', 'đá cuội nhẵn bóng', 'gỗ mục trôi dạt', 'tảo biển khô'],
    smells: ['muối biển', 'cát ẩm', 'rong biển', 'cá khô'],
    sounds: ['nhẹ nhàng', 'dữ dội', 'ầm ì', 'thì thầm'],
    sky: ['trong xanh', 'đầy mây', 'hoàng hôn'],
    NPCs: [],
    items: [
        { name: 'Sỏi', conditions: { chance: 0.3 } },
        { name: 'Cát Thường', conditions: { chance: 0.5 } },
        { name: 'Đá Cuội', conditions: { chance: 0.2 } },
    ],
    structures: [],
    enemies: [],
};

export const beach_en = {
    descriptionTemplates: {
        short: [
            "You are on an [adjective] beach with fine white sand.",
        ],
        medium: [
            "An [adjective] beach with fine white sand. The [sound] waves lap the shore, and the air smells of [smell]. {sensory_details} {entity_report}",
            "You stand on an [adjective] beach, where [feature] are scattered along the shore. The salty sea breeze blows past. {sensory_details} {entity_report}",
        ],
        long: [
            "The [adjective] sand stretches endlessly under the [sky] sky. The salty sea breeze blows, carrying the scent of [smell] and the incessant [sound] of the waves. The scene is peaceful yet wild. {sensory_details} {entity_report} {surrounding_peek}",
            "Under the sun, the beach looks [adjective]. You see sparkling [feature] on the sand, washed in and out by the tide. A feeling of freedom and solitude pervades. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['peaceful', 'pristine', 'windy', 'desolate', 'sun-drenched'],
    features: ['seashells', 'starfish', 'smooth pebbles', 'driftwood', 'dried seaweed'],
    smells: ['sea salt', 'damp sand', 'seaweed', 'dried fish'],
    sounds: ['gentle', 'roaring', 'murmuring', 'whispering'],
    sky: ['clear blue', 'cloudy', 'sunset'],
    NPCs: [],
    items: [
        { name: 'Sỏi', conditions: { chance: 0.3 } },
        { name: 'Cát Thường', conditions: { chance: 0.5 } },
        { name: 'Đá Cuội', conditions: { chance: 0.2 } },
    ],
    structures: [],
    enemies: [],
};
