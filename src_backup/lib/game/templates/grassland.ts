
import { structureDefinitions } from "../structures";

export const grassland_vi = {
    descriptionTemplates: {
        short: ["Bạn đang ở trên một đồng cỏ [adjective]."],
        medium: ["Một đồng cỏ [adjective] với những [feature] trải dài. Bầu trời [sky] và bạn nghe thấy tiếng [sound]."],
        long: ["Cỏ [adjective] trải dài đến tận chân trời, gợn sóng như một đại dương xanh dưới làn gió. Bầu trời [sky] bao la, điểm xuyết vài [feature]. Không khí trong lành mang theo mùi [smell] và tiếng [sound] của sự sống."]
    },
    adjectives: ['xanh mướt', 'bạt ngàn', 'khô cằn', 'lộng gió', 'yên bình', 'hoang vắng'],
    features: ['hoa dại', 'cỏ cao', 'đá tảng', 'lối mòn', 'đàn gia súc', 'bụi cây'],
    sky: ['trong xanh', 'đầy mây', 'u ám', 'hoàng hôn', 'đầy sao'],
    sounds: ['gió thổi', 'côn trùng kêu', 'tiếng vó ngựa xa', 'sự tĩnh lặng', 'tiếng chim hót'],
    smells: ['cỏ tươi', 'hoa dại', 'đất khô', 'phân động vật', 'không khí trong lành'],
    NPCs: [
        { 
            data: { name: 'Người du mục', description: 'Một người phụ nữ với làn da rám nắng, mặc trang phục làm từ nhiều mảnh da khác nhau.', dialogueSeed: 'Một người từng trải, nói về những vùng đất xa xôi và những cơn gió.' },
            conditions: { humanPresence: { min: 4 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Nông dân', description: 'Một người đàn ông có đôi tay chai sạn, đang lo lắng nhìn về phía cánh đồng của mình.', dialogueSeed: 'Một nông dân hiền lành, luôn lo lắng về thời tiết và mùa màng.' },
            conditions: { humanPresence: { min: 5 }, soilType: ['loamy'], chance: 0.15 } 
        },
    ],
    items: [
        { name: 'Hoa Dại', conditions: { vegetationDensity: { min: 3 }, chance: 0.5 } },
        { name: 'Lúa Mì', conditions: { soilType: ['loamy'], moisture: { min: 3, max: 6 }, chance: 0.25 } },
        { name: 'Lông Chim Ưng', conditions: { predatorPresence: { min: 3 }, chance: 0.15 } },
        { name: 'Đá Lửa', conditions: { chance: 0.25 } },
        { name: 'Trứng Chim Hoang', conditions: { chance: 0.3 } },
        { name: 'Rễ Củ Ăn Được', conditions: { soilType: ['loamy'], chance: 0.2 } },
        { name: 'Đất Sét', conditions: { moisture: { min: 4 }, chance: 0.2 } },
        { name: 'Cỏ Khô', conditions: { moisture: { max: 3 }, chance: 0.4 } },
        { name: 'Hạt Giống Hoa Dại', conditions: { chance: 0.25 } },
        { name: 'Mảnh Vải Rách', conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
        { name: 'Cành Cây Chắc Chắn', conditions: { chance: 0.3 } },
    ],
    structures: [
        { 
            data: structureDefinitions['watchtower_ruin'], 
            conditions: { humanPresence: { min: 2 }, elevation: { min: 2 }, chance: 0.03 } 
        },
    ],
    enemies: [
        { data: { type: 'Thỏ hoang hung dữ', emoji: '🐇', hp: 20, damage: 5, behavior: 'defensive', size: 'small', diet: ['Hoa Dại', 'Lúa Mì'], satiation: 0, maxSatiation: 4, loot: [{name: 'Thịt Thỏ', chance: 0.6, quantity: {min: 1, max: 2}}, {name: 'Da Thú Nhỏ', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 2, max: 5 }, chance: 0.35 } },
        { data: { type: 'Cáo gian xảo', emoji: '🦊', hp: 25, damage: 8, behavior: 'territorial', size: 'small', diet: ['Thỏ hoang hung dữ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cáo', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Mảnh Xương', chance: 0.1, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 3 }, chance: 0.25 } },
        { data: { type: 'Bầy châu chấu', emoji: '🦗', hp: 35, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Lúa Mì', 'Hoa Dại'], satiation: 0, maxSatiation: 5, loot: [{name: 'Cánh Châu Chấu', chance: 0.7, quantity: {min: 2, max: 4}}] }, conditions: { temperature: { min: 7 }, moisture: { max: 3 }, chance: 0.1 } },
        { data: { type: 'Linh cẩu', emoji: '🐕', hp: 40, damage: 12, behavior: 'aggressive', size: 'medium', diet: ['Thỏ hoang hung dữ', 'Xương Động Vật'], satiation: 0, maxSatiation: 2, loot: [{name: 'Răng Linh Cẩu', chance: 0.3, quantity: {min: 1, max: 3}}, {name: 'Mảnh Xương', chance: 0.15, quantity: {min: 2, max: 4}}] }, conditions: { predatorPresence: { min: 5 }, chance: 0.15 } },
    ],
};

export const grassland_en = {
    descriptionTemplates: {
        short: ["You are on an [adjective] grassland."],
        medium: ["An [adjective] grassland with rolling [feature]. The sky is [sky] and you hear the [sound]."],
        long: ["[adjective] grass stretches to the horizon, rippling like a green ocean in the breeze. The [sky] sky is vast, dotted with a few [feature]. The fresh air carries the scent of [smell] and the [sound] of life."]
    },
    adjectives: ['lush', 'vast', 'arid', 'windy', 'peaceful', 'desolate'],
    features: ['wildflowers', 'tall grass', 'boulders', 'worn paths', 'herds of animals', 'shrubs'],
    sky: ['clear blue', 'cloudy', 'overcast', 'sunset', 'starlit'],
    sounds: ['wind blowing', 'insects chirping', 'distant hooves', 'silence', 'birds singing'],
    smells: ['fresh grass', 'wildflowers', 'dry earth', 'animal dung', 'fresh air'],
    NPCs: [
        { 
            data: { name: 'Nomad', description: 'A woman with sun-tanned skin, dressed in clothes made from various pieces of leather.', dialogueSeed: 'An experienced traveler who speaks of distant lands and the winds.' },
            conditions: { humanPresence: { min: 4 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Farmer', description: 'A man with calloused hands, looking worriedly at his fields.', dialogueSeed: 'A gentle farmer, always worried about the weather and his crops.' },
            conditions: { humanPresence: { min: 5 }, soilType: ['loamy'], chance: 0.15 } 
        },
    ],
    items: grassland_vi.items,
    structures: grassland_vi.structures,
    enemies: [
        { data: { type: 'Aggressive Rabbit', emoji: '🐇', hp: 20, damage: 5, behavior: 'defensive', size: 'small', diet: ['Hoa Dại', 'Lúa Mì'], satiation: 0, maxSatiation: 4, loot: [{name: 'Thịt Thỏ', chance: 0.6, quantity: {min: 1, max: 2}}, {name: 'Da Thú Nhỏ', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 2, max: 5 }, chance: 0.35 } },
        { data: { type: 'Cunning Fox', emoji: '🦊', hp: 25, damage: 8, behavior: 'territorial', size: 'small', diet: ['Aggressive Rabbit'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cáo', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Mảnh Xương', chance: 0.1, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 3 }, chance: 0.25 } },
        { data: { type: 'Locust Swarm', emoji: '🦗', hp: 35, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Lúa Mì', 'Hoa Dại'], satiation: 0, maxSatiation: 5, loot: [{name: 'Cánh Châu Chấu', chance: 0.7, quantity: {min: 2, max: 4}}] }, conditions: { temperature: { min: 7 }, moisture: { max: 3 }, chance: 0.1 } },
        { data: { type: 'Hyena', emoji: '🐕', hp: 40, damage: 12, behavior: 'aggressive', size: 'medium', diet: ['Aggressive Rabbit', 'Xương Động Vật'], satiation: 0, maxSatiation: 2, loot: [{name: 'Răng Linh Cẩu', chance: 0.3, quantity: {min: 1, max: 3}}, {name: 'Mảnh Xương', chance: 0.15, quantity: {min: 2, max: 4}}] }, conditions: { predatorPresence: { min: 5 }, chance: 0.15 } },
    ],
};
