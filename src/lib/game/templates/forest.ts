
import { structureDefinitions } from "../structures";

export const forest_vi = {
    descriptionTemplates: [
        'Bạn đang ở trong một khu rừng [adjective]. Những cây [feature] cao vút che khuất ánh mặt trời, và không khí phảng phất mùi [smell].',
        'Một khu rừng [adjective] bao quanh bạn. Tiếng lá xào xạc dưới chân khi bạn di chuyển giữa những cây [feature]. Bạn nghe thấy âm thanh của [sound].',
    ],
    adjectives: ['rậm rạp', 'u ám', 'cổ xưa', 'yên tĩnh', 'ma mị', 'ẩm ướt', 'ngập nắng'],
    features: ['sồi', 'thông', 'dương xỉ', 'nấm phát quang', 'dây leo chằng chịt', 'thân cây mục', 'suối nhỏ'],
    smells: ['đất ẩm', 'lá cây mục', 'nhựa thông', 'hoa dại'],
    sounds: ['chim hót', 'gió rít', 'cành cây gãy', 'sự im lặng đáng sợ'],
    NPCs: [
        { 
            data: { 
                name: 'Thợ săn bí ẩn', 
                description: 'Một người đàn ông với ánh mắt sắc lẹm và bộ quần áo bằng da cũ kỹ, luôn mang theo cây cung dài.', 
                dialogueSeed: 'Một thợ săn dày dạn kinh nghiệm, mệt mỏi nhưng cảnh giác, nói năng cộc lốc.',
                quest: 'Mang cho tôi 5 Nanh Sói để chứng tỏ bản lĩnh của ngươi.',
                questItem: { name: 'Nanh Sói', quantity: 5 },
                rewardItems: [{ name: 'Da Gấu', quantity: 1, tier: 4, emoji: '🐻' }]
            },
            conditions: { humanPresence: { min: 2 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Linh hồn cây', description: 'Một thực thể được tạo thành từ cành và lá cây, đôi mắt phát ra ánh sáng xanh dịu.', dialogueSeed: 'Một linh hồn cổ xưa, nói chuyện chậm rãi và uyên thâm, quan tâm đến sự cân bằng của khu rừng.' },
            conditions: { magicAffinity: { min: 6 }, chance: 0.05 } 
        },
        { 
            data: { name: 'Ẩn sĩ', description: 'Một ông lão có bộ râu dài, sống một mình trong rừng.', dialogueSeed: 'Một người sống ẩn dật, nói chuyện có vẻ điên rồ nhưng đôi khi lại chứa đựng những sự thật sâu sắc.' },
            conditions: { humanPresence: { min: 1, max: 3 }, chance: 0.05 } 
        },
    ],
    items: [
        { name: 'Quả Mọng Ăn Được', conditions: { dangerLevel: { max: 4 }, chance: 0.3 } },
        { name: 'Nấm Độc', conditions: { dangerLevel: { min: 5 }, moisture: { min: 6 }, chance: 0.25 } },
        { name: 'Thảo Dược Chữa Lành', conditions: { vegetationDensity: { min: 8 }, chance: 0.2 } },
        { name: 'Cành Cây Chắc Chắn', conditions: { chance: 0.4 } },
        { name: 'Mũi Tên Cũ', conditions: { humanPresence: { min: 2 }, chance: 0.1 } },
        { name: 'Hoa Tinh Linh', conditions: { magicAffinity: { min: 7 }, chance: 0.1 } },
        { name: 'Vỏ Cây Cổ Thụ', conditions: { vegetationDensity: { min: 9 }, chance: 0.05 } },
        { name: 'Nhựa Cây Dính', conditions: { chance: 0.15 } },
        { name: 'Mật Ong Hoang', conditions: { vegetationDensity: { min: 6 }, chance: 0.1 } },
        { name: 'Sỏi', conditions: { chance: 0.3 } },
        { name: 'Tổ Chim Rỗng', conditions: { chance: 0.1 } },
        { name: 'Dây Gai', conditions: { vegetationDensity: { min: 5 }, chance: 0.2 } },
        { name: 'Lá cây lớn', conditions: { vegetationDensity: { min: 6 }, chance: 0.3 } },
    ],
    structures: [
         { 
            data: structureDefinitions['Bàn thờ bị bỏ hoang'], 
            loot: [{ name: 'Mảnh Tinh Thể', chance: 0.1, quantity: { min: 1, max: 1 } }],
            conditions: { magicAffinity: { min: 6 }, chance: 0.05 } 
        },
    ],
    enemies: [
        { data: { type: 'Sói', emoji: '🐺', hp: 30, damage: 10, behavior: 'aggressive', size: 'medium', diet: ['Thịt Heo Rừng', 'Thịt Thỏ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Thịt Sói Sống', chance: 0.7, quantity: {min: 1, max: 1}}, {name: 'Nanh Sói', chance: 0.15, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 5 }, chance: 0.4 } },
        { data: { type: 'Nhện khổng lồ', emoji: '🕷️', hp: 40, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Heo Rừng', 'Yêu Tinh Rừng'], satiation: 0, maxSatiation: 2, loot: [{name: 'Tơ Nhện Khổng lồ', chance: 0.6, quantity: {min: 1, max: 3}}, {name: 'Mắt Nhện', chance: 0.1, quantity: {min: 2, max: 8}}] }, conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 }, chance: 0.3 } },
        { data: { type: 'Heo Rừng', emoji: '🐗', hp: 50, damage: 8, behavior: 'defensive', size: 'medium', diet: ['Quả Mọng Ăn Được', 'Rễ Cây Hiếm'], satiation: 0, maxSatiation: 3, loot: [{name: 'Thịt Heo Rừng', chance: 0.8, quantity: {min: 1, max: 2}}, {name: 'Da Heo Rừng', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { predatorPresence: { min: 4 }, chance: 0.3 } },
        { data: { type: 'Yêu Tinh Rừng', emoji: '👺', hp: 25, damage: 8, behavior: 'aggressive', size: 'small', diet: ['Thịt Thỏ', 'Nấm Độc'], satiation: 0, maxSatiation: 3, loot: [{name: 'Tai Yêu Tinh', chance: 0.5, quantity: {min: 1, max: 1}}, {name: 'Mũi Tên Cũ', chance: 0.05, quantity: {min: 1, max: 1}}, {name: 'Sỏi', chance: 0.2, quantity: {min: 1, max: 3}}] }, conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.25 } },
        { data: { type: 'Gấu', emoji: '🐻', hp: 80, damage: 20, behavior: 'territorial', size: 'large', diet: ['Heo Rừng', 'Cá sấu'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Gấu', chance: 0.5, quantity: {min: 1, max: 1}}, {name: 'Móng Vuốt Gấu', chance: 0.3, quantity: {min: 2, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 }, chance: 0.1 } },
    ],
};

export const forest_en = {
    descriptionTemplates: [
        'You are in a [adjective] forest. Tall [feature] trees block out the sun, and the air smells of [smell].',
        'An [adjective] forest surrounds you. Leaves rustle underfoot as you move between the [feature] trees. You hear the sound of [sound].',
    ],
    adjectives: ['dense', 'gloomy', 'ancient', 'quiet', 'eerie', 'damp', 'sun-dappled'],
    features: ['oak', 'pine', 'fern', 'glowing mushrooms', 'tangled vines', 'rotting logs', 'a small stream'],
    smells: ['damp earth', 'decaying leaves', 'pine resin', 'wildflowers'],
    sounds: ['birds singing', 'wind whistling', 'a snapping twig', 'an unnerving silence'],
    NPCs: [
        { 
            data: { 
                name: 'Mysterious Hunter', 
                description: 'A man with sharp eyes and worn leather clothes, always carrying a longbow.', 
                dialogueSeed: 'A seasoned hunter, weary but vigilant, speaks in short, clipped sentences.',
                quest: 'Bring me 5 Wolf Fangs to prove your worth.',
                questItem: { name: 'Nanh Sói', quantity: 5 },
                rewardItems: [{ name: 'Da Gấu', quantity: 1, tier: 4, emoji: '🐻' }]
            },
            conditions: { humanPresence: { min: 2 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Tree Spirit', description: 'An entity made of branches and leaves, with eyes that emit a soft green light.', dialogueSeed: 'An ancient spirit, speaks slowly and wisely, concerned with the balance of the forest.' },
            conditions: { magicAffinity: { min: 6 }, chance: 0.05 } 
        },
        { 
            data: { name: 'Hermit', description: 'An old man with a long beard, living alone in the woods.', dialogueSeed: 'A recluse who speaks in what seems like nonsense but sometimes contains profound truths.' },
            conditions: { humanPresence: { min: 1, max: 3 }, chance: 0.05 } 
        },
    ],
    items: forest_vi.items,
    structures: forest_vi.structures,
    enemies: [
        { data: { type: 'Wolf', emoji: '🐺', hp: 30, damage: 10, behavior: 'aggressive', size: 'medium', diet: ['Wild Boar', 'Rabbit'], satiation: 0, maxSatiation: 2, loot: [{name: 'Thịt Sói Sống', chance: 0.7, quantity: {min: 1, max: 1}}, {name: 'Nanh Sói', chance: 0.15, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 5 }, chance: 0.4 } },
        { data: { type: 'Giant Spider', emoji: '🕷️', hp: 40, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Wild Boar', 'Forest Goblin'], satiation: 0, maxSatiation: 2, loot: [{name: 'Tơ Nhện Khổng lồ', chance: 0.6, quantity: {min: 1, max: 3}}, {name: 'Mắt Nhện', chance: 0.1, quantity: {min: 2, max: 8}}] }, conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 }, chance: 0.3 } },
        { data: { type: 'Wild Boar', emoji: '🐗', hp: 50, damage: 8, behavior: 'defensive', size: 'medium', diet: ['Quả Mọng Ăn Được', 'Rễ Cây Hiếm'], satiation: 0, maxSatiation: 3, loot: [{name: 'Thịt Heo Rừng', chance: 0.8, quantity: {min: 1, max: 2}}, {name: 'Da Heo Rừng', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { predatorPresence: { min: 4 }, chance: 0.3 } },
        { data: { type: 'Forest Goblin', emoji: '👺', hp: 25, damage: 8, behavior: 'aggressive', size: 'small', diet: ['Rabbit', 'Nấm Độc'], satiation: 0, maxSatiation: 3, loot: [{name: 'Tai Yêu Tinh', chance: 0.5, quantity: {min: 1, max: 1}}, {name: 'Mũi Tên Cũ', chance: 0.05, quantity: {min: 1, max: 1}}, {name: 'Sỏi', chance: 0.2, quantity: {min: 1, max: 3}}] }, conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.25 } },
        { data: { type: 'Bear', emoji: '🐻', hp: 80, damage: 20, behavior: 'territorial', size: 'large', diet: ['Wild Boar', 'Alligator'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Gấu', chance: 0.5, quantity: {min: 1, max: 1}}, {name: 'Móng Vuốt Gấu', chance: 0.3, quantity: {min: 2, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 }, chance: 0.1 } },
    ],
};
