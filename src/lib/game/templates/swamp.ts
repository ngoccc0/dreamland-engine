
export const swamp_vi = {
    descriptionTemplates: [
        'Bạn đang lội qua một đầm lầy [adjective]. Nước bùn [feature] ngập đến đầu gối.',
        'Không khí đặc quánh mùi cây cỏ mục rữa. Những cây [feature] mọc lên từ làn nước tù đọng.',
        'Sương mù [adjective] bao phủ khắp nơi. Bạn nghe thấy tiếng [sound] và ngửi thấy mùi [smell].',
        'Một vùng đất [adjective] chết chóc. Rễ cây [feature] trồi lên như những cánh tay xương xẩu.'
    ],
    adjectives: ['hôi thối', 'âm u', 'chết chóc', 'sương giăng', 'ngập nước', 'lầy lội'],
    features: ['đước', 'dây leo', 'khí độc', 'bong bóng bùn', 'côn trùng', 'xác động vật'],
    sounds: ['ếch kêu', 'nước sủi bọt', 'muỗi vo ve', 'tiếng lội bì bõm', 'tiếng thì thầm'],
    smells: ['cây cỏ mục', 'bùn lầy', 'khí metan', 'hoa thối', 'xác chết'],
    NPCs: [
        { 
            data: { name: 'Phù thủy đầm lầy', description: 'Một bà lão với nụ cười bí hiểm, sống trong một túp lều tạm bợ.', dialogueSeed: 'Một phù thủy lập dị, nói chuyện bằng những câu đố và có thể giúp đỡ nếu được trả công xứng đáng.' },
            conditions: { humanPresence: { min: 1, max: 2 }, magicAffinity: { min: 5 }, chance: 0.05 } 
        },
        { 
            data: { name: 'Thợ săn cá sấu', description: 'Một người đàn ông lực lưỡng, trên người có nhiều vết sẹo, mang theo một cây lao lớn.', dialogueSeed: 'Một người thợ săn dũng cảm, chỉ nói về con mồi lớn nhất mà ông ta đang theo đuổi.' },
            conditions: { humanPresence: { min: 2 }, predatorPresence: { min: 8 }, chance: 0.1 } 
        },
    ],
    items: [
        { name: 'Rêu Phát Sáng', conditions: { lightLevel: { max: -4 }, chance: 0.3 } },
        { name: 'Trứng Bò Sát', conditions: { predatorPresence: { min: 7 }, chance: 0.2 } },
        { name: 'Nấm Đầm Lầy', conditions: { moisture: { min: 9 }, chance: 0.25 } },
        { name: 'Rễ Cây Hiếm', conditions: { magicAffinity: { min: 6 }, moisture: {min: 8}, chance: 0.1 } },
        { name: 'Nước Bùn', conditions: { chance: 0.3 } },
        { name: 'Hoa Độc', conditions: { vegetationDensity: { min: 6 }, chance: 0.15 } },
        { name: 'Cây Sậy', conditions: { moisture: { min: 7 }, chance: 0.2 } },
        { name: 'Lá cây lớn', conditions: { vegetationDensity: { min: 6 }, chance: 0.3 } },
    ],
    structures: [],
    enemies: [
        { data: { type: 'Đỉa khổng lồ', emoji: '🩸', hp: 40, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Trứng Bò Sát'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn của Đỉa', chance: 0.5, quantity: {min: 1, max: 2}}] }, conditions: { moisture: { min: 9 }, chance: 0.4 } },
        { data: { type: 'Ma trơi', emoji: '💡', hp: 25, damage: 20, behavior: 'territorial', size: 'small', diet: ['Hoa Tinh Linh'], satiation: 0, maxSatiation: 1, loot: [{name: 'Tinh chất Ma trơi', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { magicAffinity: { min: 7 }, lightLevel: { max: -5 }, chance: 0.2 } },
        { data: { type: 'Cá sấu', emoji: '🐊', hp: 70, damage: 25, behavior: 'territorial', size: 'large', diet: ['Heo Rừng', 'Dê núi hung hãn'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cá Sấu', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Răng Cá Sấu', chance: 0.3, quantity: {min: 1, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 8 }, chance: 0.25 } },
        { data: { type: 'Muỗi khổng lồ', emoji: '🦟', hp: 15, damage: 5, behavior: 'aggressive', size: 'small', diet: [], satiation: 0, maxSatiation: 1, loot: [{name: 'Cánh Muỗi', chance: 0.7, quantity: {min: 2, max: 6}}] }, conditions: { chance: 0.5 } },
    ],
};

export const swamp_en = {
    descriptionTemplates: [
        'You are wading through a [adjective] swamp. The [feature] water is knee-deep.',
        'The air is thick with the smell of decay. [feature] trees rise from the stagnant water.',
        '[adjective] fog covers everything. You hear the [sound] and smell the stench of [smell].',
        'A deadly, [adjective] land. Tree roots [feature] rise up like bony arms.'
    ],
    adjectives: ['stinking', 'gloomy', 'deadly', 'foggy', 'waterlogged', 'muddy'],
    features: ['mangroves', 'vines', 'toxic gas', 'mud bubbles', 'insects', 'animal carcasses'],
    sounds: ['frogs croaking', 'water bubbling', 'mosquitoes buzzing', 'squelching sounds', 'whispers'],
    smells: ['decaying plants', 'mud', 'methane gas', 'rotting flowers', 'death'],
    NPCs: [
        { 
            data: { name: 'Swamp Witch', description: 'An old woman with a mysterious smile, living in a makeshift hut.', dialogueSeed: 'An eccentric witch who speaks in riddles and might help for the right price.' },
            conditions: { humanPresence: { min: 1, max: 2 }, magicAffinity: { min: 5 }, chance: 0.05 } 
        },
        { 
            data: { name: 'Alligator Hunter', description: 'A sturdy man covered in scars, carrying a large harpoon.', dialogueSeed: 'A brave hunter who only talks about the biggest prey he is tracking.' },
            conditions: { humanPresence: { min: 2 }, predatorPresence: { min: 8 }, chance: 0.1 } 
        },
    ],
    items: swamp_vi.items,
    structures: [],
    enemies: [
        { data: { type: 'Giant Leech', emoji: '🩸', hp: 40, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Trứng Bò Sát'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn của Đỉa', chance: 0.5, quantity: {min: 1, max: 2}}] }, conditions: { moisture: { min: 9 }, chance: 0.4 } },
        { data: { type: 'Will-o-Wisp', emoji: '💡', hp: 25, damage: 20, behavior: 'territorial', size: 'small', diet: ['Hoa Tinh Linh'], satiation: 0, maxSatiation: 1, loot: [{name: 'Tinh chất Ma trơi', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { magicAffinity: { min: 7 }, lightLevel: { max: -5 }, chance: 0.2 } },
        { data: { type: 'Alligator', emoji: '🐊', hp: 70, damage: 25, behavior: 'territorial', size: 'large', diet: ['Wild Boar', 'Aggressive Mountain Goat'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cá Sấu', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Răng Cá Sấu', chance: 0.3, quantity: {min: 1, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 8 }, chance: 0.25 } },
        { data: { type: 'Giant Mosquito', emoji: '🦟', hp: 15, damage: 5, behavior: 'aggressive', size: 'small', diet: [], satiation: 0, maxSatiation: 1, loot: [{name: 'Cánh Muỗi', chance: 0.7, quantity: {min: 2, max: 6}}] }, conditions: { chance: 0.5 } },
    ],
};
