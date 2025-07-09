

import { structureDefinitions } from "../structures";

export const volcanic_vi = {
    descriptionTemplates: {
        short: [
            "Mặt đất [adjective] và nứt nẻ dưới chân bạn.",
        ],
        medium: [
            "Mặt đất [adjective] và nứt nẻ dưới chân bạn. Không khí nồng nặc mùi [smell]. Xa xa, một [feature] phun trào những cột khói đen. {sensory_details} {entity_report}",
            "Cảnh quan ở đây thật [adjective]. Những dòng [feature] đã nguội lạnh tạo thành những hình thù kỳ quái. Thỉnh thoảng, bạn cảm nhận được mặt đất rung chuyển nhẹ. {sensory_details} {entity_report}",
        ],
        long: [
            "Một vùng đất [adjective] bị tàn phá bởi dung nham. Bầu trời bị che phủ bởi tro bụi, và mùi [smell] khiến bạn khó thở. Âm thanh duy nhất là tiếng [sound] của ngọn núi lửa đang hoạt động, một lời nhắc nhở thường trực về sự hủy diệt. {sensory_details} {entity_report} {surrounding_peek}",
            "Cảnh quan địa ngục của một vùng đất [adjective]. Những dòng [feature] đã nguội lạnh tạo thành những hình thù kỳ quái. Thỉnh thoảng, bạn cảm nhận được mặt đất rung chuyển nhẹ, và tiếng [sound] của đá nứt vang lên. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['hoang tàn', 'nóng bỏng', 'đáng sợ', 'đầy tro bụi', 'địa ngục'],
    features: ['dung nham', 'khe nứt', 'cột đá bazan', 'hồ axit', 'đá bọt'],
    smells: ['lưu huỳnh', 'đá cháy', 'kim loại nóng chảy', 'khí độc', 'tro bụi'],
    sounds: ['tiếng dung nham sôi', 'tiếng đá nứt', 'tiếng gầm của núi lửa', 'sự im lặng chết chóc', 'tiếng đất rung chuyển'],
    sky: ['đỏ rực', 'xám xịt tro bụi'],
    NPCs: [
        { 
            data: { name: 'Thợ rèn dung nham', description: 'Một người lùn với làn da đỏ như đồng, đang dùng một chiếc búa lớn để rèn trên một tảng đá nóng chảy.', dialogueSeed: 'Một thợ rèn bậc thầy, ít nói, chỉ quan tâm đến việc tạo ra những vũ khí huyền thoại từ vật liệu núi lửa.' },
            conditions: { humanPresence: { min: 1 }, temperature: { min: 9 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Hỏa tinh bị mắc kẹt', description: 'Một thực thể bằng lửa bị mắc kẹt trong một tảng obsidian.', dialogueSeed: 'Một sinh vật nguyên tố mạnh mẽ nhưng đang yếu dần, hứa hẹn sức mạnh nếu được giải thoát.' },
            conditions: { magicAffinity: { min: 8 }, chance: 0.05 } 
        }
    ],
    items: [
        { name: 'Đá Obsidian', conditions: { chance: 0.4 } },
        { name: 'Lưu huỳnh', conditions: { temperature: { min: 8 }, chance: 0.3 } },
        { name: 'Trái tim Magma', conditions: { dangerLevel: { min: 9 }, magicAffinity: { min: 7 }, chance: 0.05 } },
        { name: 'Tro núi lửa', conditions: { chance: 0.5 } },
        { name: 'Quặng Sắt', conditions: { soilType: ['rocky'], chance: 0.15 } }
    ],
    structures: [
        { data: structureDefinitions['Mạch nước phun'], conditions: { temperature: { min: 7 }, chance: 0.15 } },
    ],
    enemies: [
        { data: { type: 'Salamander lửa', emoji: '🦎', hp: 50, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Lưu huỳnh'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Da Rắn', chance: 0.5, quantity: { min: 1, max: 2 } }] }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
        { data: { type: 'Golem dung nham', emoji: '🔥', hp: 120, damage: 25, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Trái tim Magma', chance: 0.1, quantity: { min: 1, max: 1 } }, { name: 'Đá Obsidian', chance: 0.3, quantity: { min: 2, max: 5 } }] }, conditions: { dangerLevel: { min: 9 }, chance: 0.25 } },
        { data: { type: 'Rồng lửa con', emoji: '🐉', hp: 150, damage: 30, behavior: 'aggressive', size: 'large', diet: ['Golem dung nham'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Vảy Rồng', chance: 0.2, quantity: { min: 3, max: 6 } }, { name: 'Răng Rồng', chance: 0.1, quantity: { min: 1, max: 2 } }] }, conditions: { predatorPresence: { min: 10 }, dangerLevel: { min: 10 }, chance: 0.1 } }
    ]
};

export const volcanic_en = {
    descriptionTemplates: {
        short: [
            "The ground is [adjective] and cracked under your feet.",
        ],
        medium: [
            "The ground is [adjective] and cracked under your feet. The air is thick with the smell of [smell]. In the distance, a [feature] erupts with columns of black smoke. {sensory_details} {entity_report}",
            "The landscape here is [adjective]. Cooled [feature] flows form bizarre shapes. Occasionally, you feel the ground tremble slightly. {sensory_details} {entity_report}",
        ],
        long: [
            "An [adjective] land devastated by lava. The sky is obscured by ash, and the smell of [smell] makes it hard to breathe. The only sound is the [sound] of the active volcano, a constant reminder of destruction. {sensory_details} {entity_report} {surrounding_peek}",
            "The hellish landscape of an [adjective] land. Cooled [feature] flows form bizarre shapes. Occasionally, you feel the ground tremble slightly, and the [sound] of cracking rock echoes. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['desolate', 'scorching', 'fearsome', 'ash-covered', 'hellish'],
    features: ['lava flows', 'fissures', 'basalt columns', 'acid pools', 'pumice stones'],
    smells: ['sulfur', 'burning rock', 'molten metal', 'toxic fumes', 'ash'],
    sounds: ['bubbling lava', 'cracking rock', 'the roar of the volcano', 'deathly silence', 'the ground trembling'],
    sky: ['fiery red', 'ashy gray'],
    NPCs: [
        { 
            data: { name: 'Lava Blacksmith', description: 'A dwarf with skin as red as copper, using a large hammer to forge on a molten rock.', dialogueSeed: 'A master blacksmith, taciturn, only interested in creating legendary weapons from volcanic materials.' },
            conditions: { humanPresence: { min: 1 }, temperature: { min: 9 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Trapped Fire Elemental', description: 'A fire entity trapped in a block of obsidian.', dialogueSeed: 'A powerful but weakening elemental being, promising power if freed.' },
            conditions: { magicAffinity: { min: 8 }, chance: 0.05 } 
        }
    ],
    items: volcanic_vi.items,
    structures: [
        { data: structureDefinitions['Mạch nước phun'], conditions: { temperature: { min: 7 }, chance: 0.15 } },
    ],
    enemies: [
        { data: { type: 'Fire Salamander', emoji: '🦎', hp: 50, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Lưu huỳnh'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Da Rắn', chance: 0.5, quantity: { min: 1, max: 2 } }] }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
        { data: { type: 'Lava Golem', emoji: '🔥', hp: 120, damage: 25, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Trái tim Magma', chance: 0.1, quantity: { min: 1, max: 1 } }, { name: 'Đá Obsidian', chance: 0.3, quantity: { min: 2, max: 5 } }] }, conditions: { dangerLevel: { min: 9 }, chance: 0.25 } },
        { data: { type: 'Young Fire Dragon', emoji: '🐉', hp: 150, damage: 30, behavior: 'aggressive', size: 'large', diet: ['Golem dung ham'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Vảy Rồng', chance: 0.2, quantity: { min: 3, max: 6 } }, { name: 'Răng Rồng', chance: 0.1, quantity: { min: 1, max: 2 } }] }, conditions: { predatorPresence: { min: 10 }, dangerLevel: { min: 10 }, chance: 0.1 } }
    ]
};
