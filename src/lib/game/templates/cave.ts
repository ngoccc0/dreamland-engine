

import { structureDefinitions } from "../structures";

export const cave_vi = {
    descriptionTemplates: {
        short: [
            "Bên trong hang động tối [adjective] và ẩm ướt.",
        ],
        medium: [
            "Bên trong hang động tối [adjective] và ẩm ướt. Tiếng bước chân của bạn vang vọng giữa những [feature]. Không khí có mùi [smell]. {entity_report}",
            "Những khối [feature] lấp lánh dưới ánh sáng yếu ớt lọt vào từ bên ngoài. Tiếng [sound] là âm thanh duy nhất phá vỡ sự tĩnh lặng. {sensory_details} {entity_report}",
        ],
        long: [
            "Bạn đi sâu vào một hang động [adjective] chằng chịt. Một luồng gió lạnh [adjective] thổi ra từ bóng tối, mang theo mùi [smell]. Những [feature] kỳ lạ mọc trên vách đá và tiếng [sound] duy nhất là của chính bạn. {sensory_details} {entity_report} {surrounding_peek}",
            "Sự im lặng tuyệt đối của hang động [adjective] bao trùm lấy bạn. Những [feature] lấp lánh ma mị trong bóng tối, và tiếng nước [sound] từ đâu đó tạo nên một giai điệu rờn rợn. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['sâu thẳm', 'lạnh lẽo', 'bí ẩn', 'chằng chịt', 'tối đen', 'âm u'],
    features: ['thạch nhũ', 'tinh thể', 'dòng sông ngầm', 'tranh vẽ cổ', 'mạng nhện', 'đống xương'],
    smells: ['đất ẩm', 'nước tù', 'khoáng chất', 'lưu huỳnh', 'mùi phân dơi'],
    sounds: ['tiếng nước nhỏ giọt', 'tiếng vang', 'tiếng dơi kêu', 'sự im lặng nặng nề', 'tiếng đá lạo xạo'],
    sky: [],
    NPCs: [
        { 
            data: { name: 'Nhà thám hiểm bị lạc', description: 'Một người với trang bị cũ kỹ, đang tuyệt vọng vẽ bản đồ lên tường.', dialogueSeed: 'Một người thông minh nhưng đang hoảng loạn, nói nhanh và liên tục hỏi về đường ra.' },
            conditions: { humanPresence: { min: 2, max: 3 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Thủ lĩnh Goblin', description: 'Một con goblin to lớn hơn đồng loại, ngồi trên một chiếc ngai bằng xương.', dialogueSeed: 'Một thủ lĩnh goblin xảo quyệt và hung hăng, nói bằng một ngôn ngữ kỳ lạ nhưng có thể hiểu được qua cử chỉ.' },
            conditions: { humanPresence: { min: 4 }, dangerLevel: { min: 8 }, chance: 0.2 } 
        },
    ],
    items: [
        { name: 'Mảnh Tinh Thể', conditions: { magicAffinity: { min: 6 }, chance: 0.3 } },
        { name: 'Bản Đồ Cổ', conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
        { name: 'Xương Cổ', conditions: { dangerLevel: { min: 7 }, chance: 0.2 } },
        { name: 'Mỏ Vàng', conditions: { elevation: { min: -8 }, chance: 0.05 } },
        { name: 'Nấm Phát Quang', conditions: { lightLevel: { max: -6 }, chance: 0.25 } },
        { name: 'Túi Trứng Nhện', conditions: { dangerLevel: { min: 7 }, chance: 0.1 } },
        { name: 'Nước Ngầm', conditions: { moisture: { min: 7 }, chance: 0.2 } },
        { name: 'Guano (Phân dơi)', conditions: { chance: 0.15 } },
        { name: 'Đá Vôi', conditions: { chance: 0.2 } },
        { name: 'Mảnh Xương', conditions: { chance: 0.3 } },
    ],
    structures: [
        { 
            data: structureDefinitions['Cửa hầm mỏ bỏ hoang'], 
            loot: [
                { name: 'Quặng Sắt', chance: 0.2, quantity: { min: 2, max: 4 } }, 
                { name: 'Mỏ Vàng', chance: 0.02, quantity: { min: 1, max: 1 } },
                { name: 'Bản Đồ Cổ', chance: 0.05, quantity: { min: 1, max: 1 } }
            ],
            conditions: { dangerLevel: { min: 8 }, chance: 0.15 } 
        },
    ],
    enemies: [
        { data: { type: 'Dơi khổng lồ', emoji: '🦇', hp: 25, damage: 10, behavior: 'passive', size: 'small', diet: ['Nhện hang'], satiation: 0, maxSatiation: 2, loot: [{name: 'Cánh Dơi', chance: 0.6, quantity: {min: 1, max: 2}}, {name: 'Guano (Phân dơi)', chance: 0.2, quantity: {min: 1, max: 2}}] }, conditions: { lightLevel: { max: -2 }, chance: 0.5 } },
        { data: { type: 'Nhện hang', emoji: '🕷️', hp: 45, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Dơi khổng lồ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Nọc Độc Nhện Hang', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Túi Trứng Nhện', chance: 0.08, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 8 }, chance: 0.4 } },
        { data: { type: 'Slime', emoji: '💧', hp: 30, damage: 8, behavior: 'passive', size: 'small', diet: ['Mảnh Tinh Thể', 'Rêu Phát Sáng'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn Slime', chance: 0.7, quantity: {min: 1, max: 3}}] }, conditions: { moisture: { min: 8 }, chance: 0.3 } },
        { data: { type: 'Sâu Bò Khổng Lồ', emoji: '🐛', hp: 100, damage: 20, behavior: 'defensive', size: 'large', diet: ['Người đá'], satiation: 0, maxSatiation: 1, loot: [{name: 'Răng Sâu Bò', chance: 0.15, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 9 }, chance: 0.15 } },
    ],
};

export const cave_en = {
    descriptionTemplates: {
        short: [
            "Inside the [adjective] and damp cave.",
        ],
        medium: [
            "Inside the [adjective] and damp cave. The sound of your footsteps echoes among the [feature]. The air smells of [smell]. {entity_report}",
            "The [feature] formations glitter in the faint light filtering from outside. The sound of [sound] is the only thing breaking the silence. {sensory_details} {entity_report}",
        ],
        long: [
            "You delve deeper into a [adjective], labyrinthine cave. A [adjective] cold draft blows from the darkness, carrying the smell of [smell]. Strange [feature] grow on the rock walls, and the only [sound] is your own. {sensory_details} {entity_report} {surrounding_peek}",
            "The absolute silence of the [adjective] cave envelops you. The [feature] glitters eerily in the darkness, and the [sound] of dripping water from somewhere creates a creepy melody. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['deep', 'cold', 'mysterious', 'labyrinthine', 'pitch-black', 'gloomy'],
    features: ['stalactites', 'crystals', 'an underground river', 'ancient drawings', 'cobwebs', 'piles of bones'],
    smells: ['damp earth', 'stagnant water', 'minerals', 'sulfur', 'bat guano'],
    sounds: ['dripping water', 'echoes', 'bat squeaks', 'heavy silence', 'scraping stones'],
    sky: [],
    NPCs: [
        { 
            data: { name: 'Lost Adventurer', description: 'A person with old gear, desperately drawing a map on the wall.', dialogueSeed: 'A smart but panicked person, speaks quickly and constantly asks for a way out.' },
            conditions: { humanPresence: { min: 2, max: 3 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Goblin Chief', description: 'A goblin larger than its kin, sitting on a throne of bones.', dialogueSeed: 'A cunning and aggressive goblin chief, speaks a strange language but can be understood through gestures.' },
            conditions: { humanPresence: { min: 4 }, dangerLevel: { min: 8 }, chance: 0.2 } 
        },
    ],
    items: cave_vi.items,
    structures: [
        { 
            data: structureDefinitions['Cửa hầm mỏ bỏ hoang'], 
            loot: [
                { name: 'Quặng Sắt', chance: 0.2, quantity: { min: 2, max: 4 } }, 
                { name: 'Mỏ Vàng', chance: 0.02, quantity: { min: 1, max: 1 } },
                { name: 'Bản Đồ Cổ', chance: 0.05, quantity: { min: 1, max: 1 } }
            ],
            conditions: { dangerLevel: { min: 8 }, chance: 0.15 } 
        },
    ],
    enemies: [
        { data: { type: 'Giant Bat', emoji: '🦇', hp: 25, damage: 10, behavior: 'passive', size: 'small', diet: ['Cave Spider'], satiation: 0, maxSatiation: 2, loot: [{name: 'Cánh Dơi', chance: 0.6, quantity: {min: 1, max: 2}}, {name: 'Guano (Phân dơi)', chance: 0.2, quantity: {min: 1, max: 2}}] }, conditions: { lightLevel: { max: -2 }, chance: 0.5 } },
        { data: { type: 'Cave Spider', emoji: '🕷️', hp: 45, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Giant Bat'], satiation: 0, maxSatiation: 2, loot: [{name: 'Nọc Độc Nhện Hang', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Túi Trứng Nhện', chance: 0.08, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 8 }, chance: 0.4 } },
        { data: { type: 'Slime', emoji: '💧', hp: 30, damage: 8, behavior: 'passive', size: 'small', diet: ['Mảnh Tinh Thể', 'Rêu Phát Sáng'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn Slime', chance: 0.7, quantity: {min: 1, max: 3}}] }, conditions: { moisture: { min: 8 }, chance: 0.3 } },
        { data: { type: 'Giant Crawler', emoji: '🐛', hp: 100, damage: 20, behavior: 'defensive', size: 'large', diet: ['Stone Golem'], satiation: 0, maxSatiation: 1, loot: [{name: 'Răng Sâu Bò', chance: 0.15, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 9 }, chance: 0.15 } },
    ],
};
