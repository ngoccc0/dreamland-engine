
import { structureDefinitions } from "../structures";

export const mountain_vi = {
    descriptionTemplates: [
        'Bạn đang leo lên một sườn núi [adjective]. Gió [sound] mạnh và lạnh buốt.',
        'Con đường mòn [adjective] cheo leo dẫn lên đỉnh núi. Không khí loãng dần và tầm nhìn [visibility].',
        'Những đỉnh núi [adjective] nhọn hoắt chọc thủng bầu trời. Bạn ngửi thấy mùi [smell] của đá lạnh.',
        'Một dòng sông băng [feature] chảy xuống từ trên cao, tạo ra một cảnh tượng [adjective].'
    ],
    adjectives: ['hiểm trở', 'lộng gió', 'hùng vĩ', 'tuyết phủ', 'trơ trọi', 'cô độc'],
    features: ['vách đá', 'tuyết', 'hang động', 'dòng sông băng', 'mỏm đá', 'thác nước đóng băng'],
    visibility: ['cực tốt', 'bị mây che phủ', 'hạn chế', 'rõ ràng'],
    sounds: ['gió rít', 'đá lở', 'tiếng đại bàng kêu', 'sự tĩnh lặng', 'tiếng tuyết lở xa'],
    smells: ['không khí lạnh', 'đá ẩm', 'mùi tuyết', 'khoáng chất', 'sự trong lành'],
    NPCs: [
        { 
            data: { name: 'Thợ mỏ già', description: 'Một người lùn gân guốc với bộ râu được tết gọn gàng, tay cầm chiếc cuốc chim.', dialogueSeed: 'Một người thợ mỏ càu nhàu, phàn nàn về việc các mạch khoáng sản ngày càng khó tìm.' },
            conditions: { humanPresence: { min: 3 }, elevation: { min: 7 }, chance: 0.15 } 
        },
        { 
            data: { name: 'Người cưỡi griffon', description: 'Một chiến binh mặc áo giáp sáng bóng, đứng cạnh một sinh vật griffon uy nghi.', dialogueSeed: 'Một hiệp sĩ cao ngạo, chỉ nói chuyện với những người mà họ cho là xứng đáng.' },
            conditions: { magicAffinity: { min: 6 }, elevation: { min: 9 }, chance: 0.05 } 
        },
    ],
    items: [
        { name: 'Quặng Sắt', conditions: { soilType: ['rocky'], chance: 0.25 } },
        { name: 'Lông Đại Bàng', conditions: { elevation: { min: 8 }, chance: 0.15 } },
        { name: 'Pha Lê Núi', conditions: { magicAffinity: { min: 5 }, elevation: { min: 7 }, chance: 0.1 } },
        { name: 'Cây Thuốc Núi', conditions: { vegetationDensity: { min: 2 }, elevation: { min: 6 }, chance: 0.2 } },
        { name: 'Trứng Griffon', conditions: { elevation: { min: 9 }, magicAffinity: {min: 7}, chance: 0.01 } },
        { name: 'Đá Vỏ Chai', conditions: { elevation: { min: 6 }, chance: 0.1 } },
        { name: 'Đá Granit', conditions: { chance: 0.2 } },
        { name: 'Tuyết', conditions: { temperature: { max: 2 }, chance: 0.4 } },
        { name: 'Cây Địa Y', conditions: { moisture: { min: 4 }, chance: 0.1 } },
        { name: 'Trứng Đại Bàng', conditions: { elevation: { min: 8 }, chance: 0.1 } },
    ],
    structures: [
        { 
            data: structureDefinitions['Cửa hầm mỏ bỏ hoang'], 
            loot: [
                { name: 'Quặng Sắt', chance: 0.3, quantity: { min: 1, max: 2 } }, 
                { name: 'Chìa Khóa Rỉ Sét', chance: 0.1, quantity: { min: 1, max: 1 } }
            ],
            conditions: { elevation: { min: 5 }, dangerLevel: { min: 6 }, chance: 0.1 } 
        },
        { 
            data: structureDefinitions['Đảo Bay'],
            conditions: { elevation: { min: 10 }, magicAffinity: { min: 8 }, chance: 0.02 } 
        },
    ],
    enemies: [
        { data: { type: 'Dê núi hung hãn', emoji: '🐐', hp: 50, damage: 15, behavior: 'defensive', size: 'medium', diet: ['Cây Thuốc Núi', 'Hoa Dại'], satiation: 0, maxSatiation: 3, loot: [{name: 'Sừng Dê Núi', chance: 0.4, quantity: {min: 1, max: 2}}, {name: 'Thịt Dê Núi', chance: 0.7, quantity: {min: 1, max: 2}}] }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
        { data: { type: 'Người đá', emoji: '🗿', hp: 80, damage: 10, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt', 'Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lõi Người Đá', chance: 0.1, quantity: {min: 1, max: 1}}, {name: 'Đá Cuội', chance: 0.25, quantity: {min: 2, max: 3}}] }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
        { data: { type: 'Harpie', emoji: '🦅', hp: 45, damage: 18, behavior: 'aggressive', size: 'medium', diet: ['Dê núi hung hãn', 'Thỏ hoang hung dữ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Lông Harpie', chance: 0.5, quantity: {min: 3, max: 6}}] }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
        { data: { type: 'Báo tuyết', emoji: '🐆', hp: 60, damage: 20, behavior: 'aggressive', size: 'large', diet: ['Dê núi hung hãn'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Báo Tuyết', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Thịt Báo Tuyết', chance: 0.6, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
    ],
};

export const mountain_en = {
    descriptionTemplates: [
        'You are climbing a [adjective] mountainside. The [sound] wind is strong and chilling.',
        'A treacherous [adjective] path leads up the peak. The air thins and the visibility is [visibility].',
        'The sharp, [adjective] peaks pierce the sky. You can smell the [smell] of cold stone.',
        'A glacier [feature] flows down from above, creating an [adjective] spectacle.'
    ],
    adjectives: ['treacherous', 'windswept', 'majestic', 'snow-capped', 'barren', 'lonely'],
    features: ['cliffs', 'snowdrifts', 'caves', 'glaciers', 'outcrops', 'frozen waterfalls'],
    visibility: ['excellent', 'clouded', 'limited', 'clear'],
    sounds: ['wind howling', 'rockslides', 'eagle cries', 'silence', 'a distant avalanche'],
    smells: ['cold air', 'damp rock', 'snow', 'minerals', 'crispness'],
    NPCs: [
        { 
            data: { name: 'Old Miner', description: 'A sturdy dwarf with a neatly braided beard, holding a pickaxe.', dialogueSeed: 'A grumpy miner who complains that ore veins are getting harder to find.' },
            conditions: { humanPresence: { min: 3 }, elevation: { min: 7 }, chance: 0.15 } 
        },
        { 
            data: { name: 'Griffon Rider', description: 'A warrior in shining armor, standing next to a majestic griffon creature.', dialogueSeed: 'An arrogant knight who only speaks to those they deem worthy.' },
            conditions: { magicAffinity: { min: 6 }, elevation: { min: 9 }, chance: 0.05 } 
        },
    ],
    items: mountain_vi.items,
    structures: [
        { 
            data: structureDefinitions['Cửa hầm mỏ bỏ hoang'], 
            loot: [
                { name: 'Quặng Sắt', chance: 0.3, quantity: { min: 1, max: 2 } }, 
                { name: 'Chìa Khóa Rỉ Sét', chance: 0.1, quantity: { min: 1, max: 1 } }
            ],
            conditions: { elevation: { min: 5 }, dangerLevel: { min: 6 }, chance: 0.1 } 
        },
        { 
            data: structureDefinitions['Đảo Bay'],
            conditions: { elevation: { min: 10 }, magicAffinity: { min: 8 }, chance: 0.02 } 
        },
    ],
    enemies: [
        { data: { type: 'Aggressive Mountain Goat', emoji: '🐐', hp: 50, damage: 15, behavior: 'defensive', size: 'medium', diet: ['Cây Thuốc Núi', 'Hoa Dại'], satiation: 0, maxSatiation: 3, loot: [{name: 'Sừng Dê Núi', chance: 0.4, quantity: {min: 1, max: 2}}, {name: 'Thịt Dê Núi', chance: 0.7, quantity: {min: 1, max: 2}}] }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
        { data: { type: 'Stone Golem', emoji: '🗿', hp: 80, damage: 10, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt', 'Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lõi Người Đá', chance: 0.1, quantity: {min: 1, max: 1}}, {name: 'Đá Cuội', chance: 0.25, quantity: {min: 2, max: 3}}] }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
        { data: { type: 'Harpy', emoji: '🦅', hp: 45, damage: 18, behavior: 'aggressive', size: 'medium', diet: ['Aggressive Mountain Goat', 'Aggressive Rabbit'], satiation: 0, maxSatiation: 2, loot: [{name: 'Lông Harpie', chance: 0.5, quantity: {min: 3, max: 6}}] }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
        { data: { type: 'Snow Leopard', emoji: '🐆', hp: 60, damage: 20, behavior: 'aggressive', size: 'large', diet: ['Aggressive Mountain Goat'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Báo Tuyết', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Thịt Báo Tuyết', chance: 0.6, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
    ],
};
