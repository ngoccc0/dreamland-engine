import type { BiomeDefinition, Season, SeasonModifiers, SoilType, Terrain } from "./types";

// --- WORLD CONFIGURATION (BIOME DEFINITIONS & SEASONS) ---

export const seasonConfig: Record<Season, SeasonModifiers> = {
    spring: { temperatureMod: 0, moistureMod: 2, sunExposureMod: 1, windMod: 1, eventChance: 0.3 },
    summer: { temperatureMod: 3, moistureMod: -1, sunExposureMod: 3, windMod: 0, eventChance: 0.1 },
    autumn: { temperatureMod: -1, moistureMod: 1, sunExposureMod: -1, windMod: 2, eventChance: 0.4 },
    winter: { temperatureMod: -4, moistureMod: -2, sunExposureMod: -3, windMod: 3, eventChance: 0.2 },
};

export const worldConfig: Record<Terrain, BiomeDefinition> = {
    forest: {
        minSize: 5, maxSize: 10, travelCost: 4, spreadWeight: 0.6,
        allowedNeighbors: ['grassland', 'mountain', 'swamp'],
        defaultValueRanges: {
            vegetationDensity: { min: 7, max: 10 }, moisture: { min: 5, max: 8 }, elevation: { min: 1, max: 5 },
            dangerLevel: { min: 4, max: 7 }, magicAffinity: { min: 3, max: 6 }, humanPresence: { min: 0, max: 3 },
            predatorPresence: { min: 5, max: 8 }, temperature: { min: 4, max: 7 },
        },
        soilType: ['loamy'],
    },
    grassland: {
        minSize: 8, maxSize: 15, travelCost: 1, spreadWeight: 0.8,
        allowedNeighbors: ['forest', 'desert', 'swamp'],
        defaultValueRanges: {
            vegetationDensity: { min: 2, max: 5 }, moisture: { min: 2, max: 5 }, elevation: { min: 0, max: 2 },
            dangerLevel: { min: 1, max: 4 }, magicAffinity: { min: 0, max: 2 }, humanPresence: { min: 2, max: 6 },
            predatorPresence: { min: 2, max: 5 }, temperature: { min: 5, max: 8 },
        },
        soilType: ['loamy', 'sandy'],
    },
    desert: {
        minSize: 6, maxSize: 12, travelCost: 3, spreadWeight: 0.4,
        allowedNeighbors: ['grassland', 'mountain'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 1 }, moisture: { min: 0, max: 1 }, elevation: { min: 0, max: 3 },
            dangerLevel: { min: 5, max: 8 }, magicAffinity: { min: 1, max: 4 }, humanPresence: { min: 0, max: 2 },
            predatorPresence: { min: 6, max: 9 }, temperature: { min: 8, max: 10 },
        },
        soilType: ['sandy'],
    },
    swamp: {
        minSize: 4, maxSize: 8, travelCost: 5, spreadWeight: 0.2,
        allowedNeighbors: ['forest', 'grassland'],
        defaultValueRanges: {
            vegetationDensity: { min: 5, max: 8 }, moisture: { min: 8, max: 10 }, elevation: { min: -1, max: 1 },
            dangerLevel: { min: 7, max: 10 }, magicAffinity: { min: 4, max: 7 }, humanPresence: { min: 0, max: 1 },
            predatorPresence: { min: 7, max: 10 }, temperature: { min: 6, max: 9 },
        },
        soilType: ['clay'],
    },
    mountain: {
        minSize: 3, maxSize: 7, travelCost: 6, spreadWeight: 0.1,
        allowedNeighbors: ['forest', 'desert'],
        defaultValueRanges: {
            vegetationDensity: { min: 1, max: 4 }, moisture: { min: 2, max: 5 }, elevation: { min: 5, max: 10 },
            dangerLevel: { min: 6, max: 9 }, magicAffinity: { min: 2, max: 5 }, humanPresence: { min: 1, max: 4 },
            predatorPresence: { min: 4, max: 7 }, temperature: { min: 1, max: 4 },
        },
        soilType: ['rocky'],
    },
    cave: {
        minSize: 10, maxSize: 20, travelCost: 7, spreadWeight: 0.05,
        allowedNeighbors: ['mountain'],
        defaultValueRanges: {
            vegetationDensity: { min: 0, max: 2 }, moisture: { min: 6, max: 9 }, elevation: { min: -10, max: -1 },
            dangerLevel: { min: 8, max: 10 }, magicAffinity: { min: 5, max: 8 }, humanPresence: { min: 0, max: 3 },
            predatorPresence: { min: 8, max: 10 }, temperature: { min: 3, max: 6 },
        },
        soilType: ['rocky'],
    }
};

// --- CONTENT TEMPLATES & ENTITY CATALOG ---
export const templates: Record<Terrain, any> = {
    forest: {
        descriptionTemplates: [
            'Bạn đang ở trong một khu rừng [adjective]. Những cây [feature] cao vút che khuất ánh mặt trời.',
            'Một khu rừng [adjective] bao quanh bạn. Tiếng lá xào xạc dưới chân khi bạn di chuyển giữa những cây [feature].',
        ],
        adjectives: ['rậm rạp', 'u ám', 'cổ xưa', 'yên tĩnh', 'ma mị'],
        features: ['sồi', 'thông', 'dương xỉ', 'nấm phát quang', 'dây leo chằng chịt'],
        NPCs: [
            { data: 'thợ săn bí ẩn', conditions: { humanPresence: { min: 2 }, chance: 0.1 } },
            { data: 'linh hồn cây', conditions: { magicAffinity: { min: 6 }, chance: 0.05 } },
            { data: 'ẩn sĩ', conditions: { humanPresence: { min: 1, max: 3 }, chance: 0.05 } },
        ],
        items: [
            { data: { name: 'Quả Mọng Ăn Được', description: 'Một loại quả mọng đỏ, có vẻ ngon miệng và an toàn.', quantity: { min: 3, max: 8 } }, conditions: { dangerLevel: { max: 4 }, chance: 0.3 } },
            { data: { name: 'Nấm Độc', description: 'Một loại nấm có màu sắc sặc sỡ, tốt nhất không nên ăn.', quantity: { min: 2, max: 4 } }, conditions: { dangerLevel: { min: 5 }, moisture: { min: 6 }, chance: 0.25 } },
            { data: { name: 'Thảo Dược Chữa Lành', description: 'Một loại lá cây có mùi thơm dễ chịu, có khả năng chữa lành vết thương nhỏ.', quantity: { min: 1, max: 3 } }, conditions: { vegetationDensity: { min: 8 }, chance: 0.2 } },
            { data: { name: 'Cành Cây Chắc Chắn', description: 'Một cành cây thẳng và cứng, có thể dùng làm vũ khí tạm thời.', quantity: { min: 1, max: 2 } }, conditions: { chance: 0.4 } },
            { data: { name: 'Mũi Tên Cũ', description: 'Một mũi tên có vẻ đã được sử dụng, cắm trên một thân cây.', quantity: { min: 1, max: 1 } }, conditions: { humanPresence: { min: 2 }, chance: 0.1 } },
            { data: { name: 'Hoa Tinh Linh', description: 'Một bông hoa phát ra ánh sáng xanh lam yếu ớt, tỏa ra năng lượng phép thuật.', quantity: { min: 1, max: 1 } }, conditions: { magicAffinity: { min: 7 }, chance: 0.1 } },
        ],
        enemies: [
            { data: { type: 'Sói', hp: 30, damage: 10, behavior: 'aggressive', diet: 'carnivore' }, conditions: { predatorPresence: { min: 5 }, chance: 0.4 } },
            { data: { type: 'Nhện khổng lồ', hp: 40, damage: 15, behavior: 'aggressive', diet: 'carnivore' }, conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Heo Rừng', hp: 50, damage: 8, behavior: 'aggressive', diet: 'herbivore' }, conditions: { predatorPresence: { min: 4 }, chance: 0.3 } },
            { data: { type: 'Yêu Tinh Rừng (Goblin)', hp: 25, damage: 8, behavior: 'aggressive', diet: 'omnivore' }, conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.25 } },
            { data: { type: 'Gấu', hp: 80, damage: 20, behavior: 'aggressive', diet: 'omnivore' }, conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 }, chance: 0.1 } },
        ],
    },
    grassland: {
        descriptionTemplates: [
            'Một đồng cỏ [adjective] trải dài đến tận chân trời. Những ngọn đồi [feature] nhấp nhô nhẹ nhàng.',
            'Bạn đang đứng giữa một thảo nguyên [adjective]. Gió thổi qua làm những ngọn cỏ [feature] lay động như sóng.',
        ],
        adjectives: ['xanh mướt', 'bạt ngàn', 'khô cằn', 'lộng gió'],
        features: ['hoa dại', 'cỏ cao', 'đá tảng', 'lối mòn'],
        NPCs: [
            { data: 'người du mục', conditions: { humanPresence: { min: 4 }, chance: 0.15 } },
            { data: 'nông dân', conditions: { humanPresence: { min: 5 }, soilType: ['loamy'], chance: 0.2 } },
            { data: 'đàn ngựa hoang', conditions: { predatorPresence: { max: 4 }, vegetationDensity: { min: 3 }, chance: 0.1 } },
        ],
        items: [
            { data: { name: 'Hoa Dại', description: 'Một bông hoa đẹp, có thể có giá trị với một nhà thảo dược học.', quantity: { min: 5, max: 10 } }, conditions: { vegetationDensity: { min: 3 }, chance: 0.4 } },
            { data: { name: 'Lúa Mì', description: 'Một bó lúa mì chín vàng, có thể dùng làm thức ăn.', quantity: { min: 2, max: 6 } }, conditions: { soilType: ['loamy'], moisture: { min: 3, max: 6 }, chance: 0.2 } },
            { data: { name: 'Lông Chim Ưng', description: 'Một chiếc lông vũ sắc bén từ một loài chim săn mồi.', quantity: { min: 1, max: 2 } }, conditions: { predatorPresence: { min: 3 }, chance: 0.15 } },
            { data: { name: 'Đá Lửa', description: 'Hai hòn đá lửa, có thể dùng để nhóm lửa.', quantity: { min: 1, max: 1 } }, conditions: { chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Thỏ hoang hung dữ', hp: 20, damage: 5, behavior: 'aggressive', diet: 'herbivore' }, conditions: { dangerLevel: { min: 2, max: 5 }, chance: 0.3 } },
            { data: { type: 'Cáo gian xảo', hp: 25, damage: 8, behavior: 'aggressive', diet: 'carnivore' }, conditions: { predatorPresence: { min: 3 }, chance: 0.25 } },
            { data: { type: 'Bầy châu chấu', hp: 35, damage: 5, behavior: 'aggressive', diet: 'herbivore' }, conditions: { temperature: { min: 7 }, moisture: { max: 3 }, chance: 0.15 } },
            { data: { type: 'Linh cẩu', hp: 40, damage: 12, behavior: 'aggressive', diet: 'carnivore' }, conditions: { predatorPresence: { min: 5 }, chance: 0.2 } },
        ],
    },
    desert: {
        descriptionTemplates: [
            'Cát, cát và cát. Một sa mạc [adjective] bao la. Những [feature] là cảnh tượng duy nhất phá vỡ sự đơn điệu.',
            'Cái nóng của sa mạc [adjective] thật khắc nghiệt. Bạn thấy một [feature] ở phía xa, có thể là ảo ảnh.',
        ],
        adjectives: ['nóng bỏng', 'khô cằn', 'vô tận', 'lặng im'],
        features: ['cồn cát', 'ốc đảo', 'xương rồng khổng lồ', 'bộ xương cũ'],
        NPCs: [
            { data: 'thương nhân lạc đà', conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
            { data: 'nhà thám hiểm lạc lối', conditions: { humanPresence: { min: 1, max: 2 }, dangerLevel: { min: 6 }, chance: 0.05 } },
        ],
        items: [
            { data: { name: 'Bình Nước Cũ', description: 'Một bình nước quý giá, gần như còn đầy.', quantity: { min: 1, max: 1 } }, conditions: { humanPresence: { min: 1 }, chance: 0.15 } },
            { data: { name: 'Mảnh Gốm Cổ', description: 'Một mảnh gốm vỡ có hoa văn kỳ lạ, có thể là của một nền văn minh đã mất.', quantity: { min: 1, max: 1 } }, conditions: { chance: 0.1 } },
            { data: { name: 'Hoa Xương Rồng', description: 'Một bông hoa hiếm hoi nở trên sa mạc, có thể chứa nước.', quantity: { min: 1, max: 3 } }, conditions: { vegetationDensity: { min: 1 }, chance: 0.2 } },
            { data: { name: 'Xương Động Vật', description: 'Một bộ xương lớn bị tẩy trắng bởi ánh mặt trời.', quantity: { min: 1, max: 1 } }, conditions: { chance: 0.3 } },
        ],
        enemies: [
            { data: { type: 'Rắn đuôi chuông', hp: 30, damage: 15, behavior: 'aggressive', diet: 'carnivore' }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Bọ cạp khổng lồ', hp: 50, damage: 10, behavior: 'aggressive', diet: 'carnivore' }, conditions: { dangerLevel: { min: 7 }, chance: 0.35 } },
            { data: { type: 'Kền kền', hp: 25, damage: 8, behavior: 'aggressive', diet: 'carnivore' }, conditions: { predatorPresence: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Linh hồn cát', hp: 60, damage: 12, behavior: 'aggressive', diet: 'omnivore' }, conditions: { magicAffinity: { min: 5 }, windLevel: { min: 6 }, chance: 0.1 } },
        ],
    },
    swamp: {
        descriptionTemplates: [
            'Bạn đang lội qua một đầm lầy [adjective]. Nước bùn [feature] ngập đến đầu gối.',
            'Không khí đặc quánh mùi cây cỏ mục rữa. Những cây [feature] mọc lên từ làn nước tù đọng.',
        ],
        adjectives: ['hôi thối', 'âm u', 'chết chóc', 'sương giăng'],
        features: ['đước', 'dây leo', 'khí độc', 'bong bóng bùn'],
        NPCs: [
            { data: 'ẩn sĩ', conditions: { humanPresence: { min: 1, max: 2 }, magicAffinity: { min: 5 }, chance: 0.05 } },
            { data: 'thợ săn cá sấu', conditions: { humanPresence: { min: 2 }, predatorPresence: { min: 8 }, chance: 0.1 } },
        ],
        items: [
            { data: { name: 'Rễ Cây Hiếm', description: 'Một loại rễ cây chỉ mọc ở vùng nước độc, có giá trị cao trong giả kim thuật.', quantity: { min: 1, max: 2 } }, conditions: { magicAffinity: { min: 6 }, chance: 0.15 } },
            { data: { name: 'Rêu Phát Sáng', description: 'Một loại rêu có thể dùng để đánh dấu đường đi hoặc làm thuốc.', quantity: { min: 1, max: 4 } }, conditions: { lightLevel: { max: -4 }, chance: 0.3 } },
            { data: { name: 'Trứng Bò Sát', description: 'Một ổ trứng lạ, có lớp vỏ dai và dày.', quantity: { min: 2, max: 5 } }, conditions: { predatorPresence: { min: 7 }, chance: 0.2 } },
            { data: { name: 'Nấm Đầm Lầy', description: 'Một loại nấm ăn được nhưng có vị hơi tanh.', quantity: { min: 3, max: 6 } }, conditions: { moisture: { min: 9 }, chance: 0.25 } },
        ],
        enemies: [
            { data: { type: 'Đỉa khổng lồ', hp: 40, damage: 5, behavior: 'aggressive', diet: 'carnivore' }, conditions: { moisture: { min: 9 }, chance: 0.4 } },
            { data: { type: 'Ma trơi', hp: 25, damage: 20, behavior: 'aggressive', diet: 'omnivore' }, conditions: { magicAffinity: { min: 7 }, lightLevel: { max: -5 }, chance: 0.2 } },
            { data: { type: 'Cá sấu', hp: 70, damage: 25, behavior: 'aggressive', diet: 'carnivore' }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 8 }, chance: 0.25 } },
            { data: { type: 'Muỗi khổng lồ', hp: 15, damage: 5, behavior: 'aggressive', diet: 'carnivore' }, conditions: { chance: 0.5 } },
        ],
    },
    mountain: {
        descriptionTemplates: [
            'Bạn đang leo lên một sườn núi [adjective]. Gió [feature] thổi mạnh và lạnh buốt.',
            'Con đường mòn [feature] cheo leo dẫn lên đỉnh núi. Không khí loãng dần.',
        ],
        adjectives: ['hiểm trở', 'lộng gió', 'hùng vĩ', 'tuyết phủ'],
        features: ['vách đá', 'tuyết', 'hang động', 'dòng sông băng'],
        NPCs: [
            { data: 'thợ mỏ già', conditions: { humanPresence: { min: 3 }, elevation: { min: 7 }, chance: 0.15 } },
            { data: 'người cưỡi griffon', conditions: { magicAffinity: { min: 6 }, elevation: { min: 9 }, chance: 0.05 } },
            { data: 'nhà sư khổ hạnh', conditions: { elevation: { min: 8 }, chance: 0.05 } },
        ],
        items: [
            { data: { name: 'Quặng Sắt', description: 'Một mỏm đá chứa quặng sắt có thể rèn thành vũ khí.', quantity: { min: 1, max: 3 } }, conditions: { soilType: ['rocky'], chance: 0.25 } },
            { data: { name: 'Lông Đại Bàng', description: 'Một chiếc lông vũ lớn và đẹp, rơi ra từ một sinh vật bay lượn trên đỉnh núi.', quantity: { min: 1, max: 1 } }, conditions: { elevation: { min: 8 }, chance: 0.15 } },
            { data: { name: 'Pha Lê Núi', description: 'Một tinh thể trong suốt, lạnh toát khi chạm vào.', quantity: { min: 1, max: 2 } }, conditions: { magicAffinity: { min: 5 }, elevation: { min: 7 }, chance: 0.1 } },
            { data: { name: 'Cây Thuốc Núi', description: 'Một loại thảo dược quý hiếm chỉ mọc ở nơi cao.', quantity: { min: 1, max: 3 } }, conditions: { vegetationDensity: { min: 2 }, elevation: { min: 6 }, chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Dê núi hung hãn', hp: 50, damage: 15, behavior: 'aggressive', diet: 'herbivore' }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
            { data: { type: 'Người đá (Stone Golem)', hp: 80, damage: 10, behavior: 'aggressive', diet: 'omnivore' }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
            { data: { type: 'Harpie', hp: 45, damage: 18, behavior: 'aggressive', diet: 'carnivore' }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
            { data: { type: 'Báo tuyết', hp: 60, damage: 20, behavior: 'aggressive', diet: 'carnivore' }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
        ],
    },
    cave: {
        descriptionTemplates: [
            'Bên trong hang động tối [adjective] và ẩm ướt. Tiếng bước chân của bạn vang vọng.',
            'Những khối [feature] lấp lánh dưới ánh sáng yếu ớt lọt vào từ bên ngoài.',
        ],
        adjectives: ['sâu thẳm', 'lạnh lẽo', 'bí ẩn', 'chằng chịt'],
        features: ['thạch nhũ', 'tinh thể', 'dòng sông ngầm', 'tranh vẽ cổ'],
        NPCs: [
            { data: 'nhà thám hiểm bị lạc', conditions: { humanPresence: { min: 2, max: 3 }, chance: 0.1 } },
            { data: 'bộ lạc goblin', conditions: { humanPresence: { min: 4 }, dangerLevel: { min: 8 }, chance: 0.2 } },
            { data: 'sinh vật bóng tối', conditions: { lightLevel: { max: -8 }, magicAffinity: { min: 7 }, chance: 0.05 } },
        ],
        items: [
            { data: { name: 'Mảnh Tinh Thể', description: 'Một mảnh tinh thể phát ra ánh sáng yếu ớt, có thể soi đường.', quantity: { min: 2, max: 7 } }, conditions: { magicAffinity: { min: 6 }, chance: 0.3 } },
            { data: { name: 'Bản Đồ Cổ', description: 'Một tấm bản đồ da cũ kỹ, có vẻ chỉ đường đến một nơi bí mật trong hang.', quantity: { min: 1, max: 1 } }, conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
            { data: { name: 'Xương Cổ', description: 'Một bộ xương của một sinh vật lạ chưa từng thấy.', quantity: { min: 1, max: 1 } }, conditions: { dangerLevel: { min: 7 }, chance: 0.2 } },
            { data: { name: 'Mỏ Vàng', description: 'Những vệt vàng lấp lánh trên vách đá.', quantity: { min: 1, max: 2 } }, conditions: { elevation: { min: -8 }, chance: 0.05 } },
        ],
        enemies: [
            { data: { type: 'Dơi khổng lồ', hp: 25, damage: 10, behavior: 'aggressive', diet: 'carnivore' }, conditions: { lightLevel: { max: -2 }, chance: 0.5 } },
            { data: { type: 'Nhện hang', hp: 45, damage: 15, behavior: 'aggressive', diet: 'carnivore' }, conditions: { dangerLevel: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Slime', hp: 30, damage: 8, behavior: 'passive', diet: 'omnivore' }, conditions: { moisture: { min: 8 }, chance: 0.3 } },
            { data: { type: 'Sâu Bò Khổng Lồ', hp: 100, damage: 20, behavior: 'aggressive', diet: 'carnivore' }, conditions: { dangerLevel: { min: 9 }, chance: 0.15 } },
        ],
    },
};
