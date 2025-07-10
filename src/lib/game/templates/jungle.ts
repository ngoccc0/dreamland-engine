

import type { TranslationKey } from "@/lib/i18n";

export const jungle_vi = {
    descriptionTemplates: {
        short: ["Bạn đang ở trong một khu rừng rậm [adjective]."],
        medium: ["Rừng rậm [adjective] và ngột ngạt. Không khí đặc quánh mùi [smell] và bạn nghe thấy tiếng [sound] của sự sống hoang dã. {sensory_details} {entity_report}"],
        long: ["Bạn đang ở sâu trong một khu rừng rậm [adjective]. Những cây [feature] khổng lồ tạo thành một mái vòm che kín bầu trời. Không khí đặc quánh mùi [smell] và tiếng [sound] không ngớt của côn trùng và động vật hoang dã tạo nên một bản giao hưởng vừa sống động vừa đáng sợ. {sensory_details} {entity_report} {surrounding_peek}"]
    },
    adjectives: ['nguyên sinh', 'nhiệt đới', 'ngột ngạt', 'bí hiểm', 'sống động', 'hoang dã'],
    features: ['cây khổng lồ', 'dây leo', 'hoa lạ', 'thác nước ẩn', 'tàn tích cổ', 'cây ăn thịt'],
    smells: ['hoa thối', 'đất ẩm', 'mùi xạ hương của động vật', 'mùi trái cây chín', 'mùi mưa'],
    sounds: ['vẹt kêu', 'khỉ hú', 'tiếng côn trùng rả rích', 'tiếng nước chảy', 'tiếng gầm xa'],
    sky: [],
    NPCs: [
        { 
            data: { name: 'Thầy mo của bộ lạc', description: 'Một người đàn ông lớn tuổi với khuôn mặt được sơn vẽ kỳ dị, đeo nhiều loại bùa hộ mệnh.', dialogueSeed: 'Một người thông thái và bí ẩn, nói về các linh hồn và những lời tiên tri cổ xưa.' },
            conditions: { humanPresence: { min: 3 }, magicAffinity: { min: 5 }, chance: 0.05 } 
        },
        { 
            data: { name: 'Nhà thực vật học', description: 'Một nhà khoa học với cặp kính dày, đang cẩn thận ghi chép vào một cuốn sổ tay.', dialogueSeed: 'Một người đam mê, hào hứng nói về các loài thực vật quý hiếm và đặc tính của chúng.' },
            conditions: { humanPresence: { min: 1, max: 3 }, vegetationDensity: { min: 9 }, chance: 0.1 } 
        }
    ],
    items: [
        { name: 'Dây leo Titan', conditions: { vegetationDensity: { min: 9 }, chance: 0.2 } },
        { name: 'Hoa ăn thịt', conditions: { dangerLevel: { min: 6 }, vegetationDensity: { min: 8 }, chance: 0.1 } },
        { name: 'Nọc Ếch độc', conditions: { dangerLevel: { min: 7 }, moisture: { min: 8 }, chance: 0.05 } },
        { name: 'Lông Vẹt Sặc Sỡ', conditions: { chance: 0.3 } },
        { name: 'Quả Lạ', conditions: { chance: 0.25 } },
        { name: 'Lá cây lớn', conditions: { vegetationDensity: { min: 8 }, chance: 0.4 } },
        { name: 'Cành Cây Chắc Chắn', conditions: { chance: 0.4 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Trăn khổng lồ', emoji: '🐍', hp: 90, damage: 18, behavior: 'territorial', size: 'large', diet: ['Khỉ đột'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Da Rắn', chance: 0.8, quantity: { min: 2, max: 3 } }] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 7 }, chance: 0.2 } },
        { data: { type: 'Báo đốm', emoji: '🐆', hp: 70, damage: 22, behavior: 'aggressive', size: 'large', diet: ['Khỉ đột'], satiation: 0, maxSatiation: 2, loot: [{ name: 'Da Báo Tuyết', chance: 0.5, quantity: { min: 1, max: 1 } }, { name: 'Nanh Sói', chance: 0.3, quantity: { min: 2, max: 4 } }] }, conditions: { predatorPresence: { min: 9 }, chance: 0.25 } },
        { data: { type: 'Khỉ đột', emoji: '🦍', hp: 80, damage: 20, behavior: 'defensive', size: 'large', diet: ['Quả Lạ', 'Hoa ăn thịt'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Da Gấu', chance: 0.3, quantity: { min: 1, max: 1 } }] }, conditions: { vegetationDensity: { min: 8 }, chance: 0.3 } }
    ]
};

export const jungle_en = {
    descriptionTemplates: {
        short: ["You are in a [adjective] jungle."],
        medium: ["An [adjective] and suffocating jungle. The air is thick with the smell of [smell] and you hear the [sound] of wildlife. {sensory_details} {entity_report}"],
        long: ["You are deep within an [adjective] jungle. Giant [feature] form a canopy that blots out the sky. The thick air smells of [smell] and the incessant [sound] of insects and wild animals creates a symphony that is both vibrant and terrifying. {sensory_details} {entity_report} {surrounding_peek}"]
    },
    adjectives: ['primeval', 'tropical', 'suffocating', 'mysterious', 'vibrant', 'wild'],
    features: ['giant trees', 'vines', 'strange flowers', 'hidden waterfalls', 'ancient ruins', 'carnivorous plants'],
    smells: ['rotting flowers', 'damp earth', 'animal musk', 'ripe fruit', 'the scent of rain'],
    sounds: ['parrots squawking', 'monkeys howling', 'insects chirping', 'running water', 'a distant roar'],
    sky: [],
    NPCs: [
        { 
            data: { name: 'Tribal Shaman', description: 'An old man with a strangely painted face, wearing many amulets.', dialogueSeed: 'A wise and mysterious person who speaks of spirits and ancient prophecies.' },
            conditions: { humanPresence: { min: 3 }, magicAffinity: { min: 5 }, chance: 0.05 } 
        },
        { 
            data: { name: 'Botanist', description: 'A scientist with thick glasses, carefully taking notes in a notebook.', dialogueSeed: 'An enthusiast who excitedly talks about rare plants and their properties.' },
            conditions: { humanPresence: { min: 1, max: 3 }, vegetationDensity: { min: 9 }, chance: 0.1 } 
        }
    ],
    items: jungle_vi.items,
    structures: [],
    enemies: [
        { data: { type: 'Giant Python', emoji: '🐍', hp: 90, damage: 18, behavior: 'territorial', size: 'large', diet: ['Gorilla'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Da Rắn', chance: 0.8, quantity: { min: 2, max: 3 } }] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 7 }, chance: 0.2 } },
        { data: { type: 'Jaguar', emoji: '🐆', hp: 70, damage: 22, behavior: 'aggressive', size: 'large', diet: ['Gorilla'], satiation: 0, maxSatiation: 2, loot: [{ name: 'Da Báo Tuyết', chance: 0.5, quantity: { min: 1, max: 1 } }, { name: 'Nanh Sói', chance: 0.3, quantity: { min: 2, max: 4 } }] }, conditions: { predatorPresence: { min: 9 }, chance: 0.25 } },
        { data: { type: 'Gorilla', emoji: '🦍', hp: 80, damage: 20, behavior: 'defensive', size: 'large', diet: ['Quả Lạ', 'Hoa ăn thịt'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Da Gấu', chance: 0.3, quantity: { min: 1, max: 1 } }] }, conditions: { vegetationDensity: { min: 8 }, chance: 0.3 } }
    ]
};
