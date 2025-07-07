
export const desert_vi = {
    descriptionTemplates: [
        'Cát, cát và cát. Một sa mạc [adjective] bao la. Những [feature] là cảnh tượng duy nhất phá vỡ sự đơn điệu.',
        'Cái nóng của sa mạc [adjective] thật khắc nghiệt. Bạn thấy một [feature] ở phía xa, có thể là ảo ảnh.',
        'Mặt đất nứt nẻ vì khô hạn. Không khí có mùi [smell] và bạn nghe thấy tiếng [sound] của gió.',
        'Một vùng đất [adjective] và cằn cỗi. Chỉ có những [feature] gai góc nhất mới tồn tại được ở đây.'
    ],
    adjectives: ['nóng bỏng', 'khô cằn', 'vô tận', 'lặng im', 'gió cát', 'khắc nghiệt'],
    features: ['cồn cát', 'ốc đảo', 'xương rồng khổng lồ', 'bộ xương cũ', 'tàn tích đá', 'vực sâu'],
    sounds: ['gió rít', 'sự im lặng tuyệt đối', 'tiếng rắn trườn', 'tiếng cát chảy', 'tiếng kền kền kêu'],
    smells: ['cát nóng', 'không có gì', 'mùi ozon', 'xác khô', 'lưu huỳnh'],
    NPCs: [
        { 
            data: { name: 'Thương nhân lạc đà', description: 'Một người đàn ông trùm kín mặt, dẫn theo một con lạc đà chở đầy hàng hóa.', dialogueSeed: 'Một thương nhân lọc lõi, chỉ quan tâm đến việc mua bán và những món hời.' },
            conditions: { humanPresence: { min: 3 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Nhà thám hiểm lạc lối', description: 'Một người trông kiệt sức, quần áo rách nát, đang tìm kiếm nước uống.', dialogueSeed: 'Một người đang tuyệt vọng, sẽ làm bất cứ điều gì để có nước và tìm đường ra.' },
            conditions: { humanPresence: { min: 1, max: 2 }, dangerLevel: { min: 6 }, chance: 0.05 } 
        },
    ],
    items: [
        { name: 'Bình Nước Cũ', conditions: { humanPresence: { min: 1 }, chance: 0.15 } },
        { name: 'Mảnh Gốm Cổ', conditions: { chance: 0.1 } },
        { name: 'Hoa Xương Rồng', conditions: { vegetationDensity: { min: 1 }, chance: 0.2 } },
        { name: 'Xương Động Vật', conditions: { chance: 0.3 } },
        { name: 'Đá Sa Thạch', conditions: { chance: 0.25 } },
        { name: 'Cát Thường', conditions: { chance: 0.4 } },
        { name: 'Thủy tinh sa mạc', conditions: { magicAffinity: { min: 4 }, chance: 0.05 } },
        { name: 'Chìa Khóa Rỉ Sét', conditions: { humanPresence: { min: 2 }, chance: 0.05 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Rắn đuôi chuông', emoji: '🐍', hp: 30, damage: 15, behavior: 'defensive', size: 'small', diet: ['Thỏ hoang hung dữ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Rắn', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Trứng Rắn', chance: 0.05, quantity: {min: 2, max: 4}}] }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
        { data: { type: 'Bọ cạp khổng lồ', emoji: '🦂', hp: 50, damage: 10, behavior: 'territorial', size: 'medium', diet: ['Rắn đuôi chuông'], satiation: 0, maxSatiation: 2, loot: [{name: 'Đuôi Bọ Cạp', chance: 0.25, quantity: {min: 1, max: 1}}, {name: 'Nọc Bọ Cạp', chance: 0.08, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 7 }, chance: 0.35 } },
        { data: { type: 'Kền kền', emoji: '🦅', hp: 25, damage: 8, behavior: 'passive', size: 'medium', diet: ['Xương Động Vật'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lông Kền Kền', chance: 0.6, quantity: {min: 2, max: 5}}, {name: 'Xương Động Vật', chance: 0.15, quantity: {min: 1, max: 1}}] }, conditions: { predatorPresence: { min: 6 }, chance: 0.3 } },
        { data: { type: 'Linh hồn cát', emoji: '👻', hp: 60, damage: 12, behavior: 'territorial', size: 'medium', diet: ['Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Cát Ma Thuật', chance: 0.15, quantity: {min: 1, max: 2}}] }, conditions: { magicAffinity: { min: 5 }, chance: 0.1 } },
    ],
};

export const desert_en = {
    descriptionTemplates: [
        'Sand, sand, and more sand. A vast [adjective] desert. The only break in the monotony are the [feature].',
        'The heat of the [adjective] desert is oppressive. You see a [feature] in the distance, perhaps a mirage.',
        'The ground is cracked and dry. The air smells of [smell] and you hear the [sound] of the wind.',
        'An [adjective] and arid land. Only the toughest [feature] survive here.'
    ],
    adjectives: ['scorching', 'arid', 'endless', 'silent', 'windswept', 'harsh'],
    features: ['dunes', 'an oasis', 'giant cacti', 'old skeletons', 'stone ruins', 'deep canyons'],
    sounds: ['wind howling', 'absolute silence', 'a snake hissing', 'sand shifting', 'vulture cries'],
    smells: ['hot sand', 'nothing', 'ozone', 'dry carcass', 'sulfur'],
    NPCs: [
        { 
            data: { name: 'Camel Merchant', description: 'A man with his face covered, leading a camel laden with goods.', dialogueSeed: 'A shrewd merchant, only interested in buying, selling, and good deals.' },
            conditions: { humanPresence: { min: 3 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Lost Explorer', description: 'An exhausted-looking person in tattered clothes, searching for water.', dialogueSeed: 'A desperate person who will do anything for water and a way out.' },
            conditions: { humanPresence: { min: 1, max: 2 }, dangerLevel: { min: 6 }, chance: 0.05 } 
        },
    ],
    items: desert_vi.items,
    structures: [],
    enemies: [
        { data: { type: 'Rattlesnake', emoji: '🐍', hp: 30, damage: 15, behavior: 'defensive', size: 'small', diet: ['Aggressive Rabbit'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Rắn', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Trứng Rắn', chance: 0.05, quantity: {min: 2, max: 4}}] }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
        { data: { type: 'Giant Scorpion', emoji: '🦂', hp: 50, damage: 10, behavior: 'territorial', size: 'medium', diet: ['Rattlesnake'], satiation: 0, maxSatiation: 2, loot: [{name: 'Đuôi Bọ Cạp', chance: 0.25, quantity: {min: 1, max: 1}}, {name: 'Nọc Bọ Cạp', chance: 0.08, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 7 }, chance: 0.35 } },
        { data: { type: 'Vulture', emoji: '🦅', hp: 25, damage: 8, behavior: 'passive', size: 'medium', diet: ['Xương Động Vật'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lông Kền Kền', chance: 0.6, quantity: {min: 2, max: 5}}, {name: 'Xương Động Vật', chance: 0.15, quantity: {min: 1, max: 1}}] }, conditions: { predatorPresence: { min: 6 }, chance: 0.3 } },
        { data: { type: 'Sand Spirit', emoji: '👻', hp: 60, damage: 12, behavior: 'territorial', size: 'medium', diet: ['Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Cát Ma Thuật', chance: 0.15, quantity: {min: 1, max: 2}}] }, conditions: { magicAffinity: { min: 5 }, chance: 0.1 } },
    ],
};
