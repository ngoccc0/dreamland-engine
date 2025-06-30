import type { BiomeDefinition, Season, SeasonModifiers, ItemDefinition, Terrain } from "./types";

// --- WORLD CONFIGURATION (BIOME DEFINITIONS & SEASONS) ---

export const seasonConfig: Record<Season, SeasonModifiers> = {
    spring: { temperatureMod: 0, moistureMod: 2, sunExposureMod: 1, windMod: 1, eventChance: 0.3 },
    summer: { temperatureMod: 3, moistureMod: -1, sunExposureMod: 3, windMod: 0, eventChance: 0.1 },
    autumn: { temperatureMod: -1, moistureMod: 1, sunExposureMod: -1, windMod: 2, eventChance: 0.4 },
    winter: { temperatureMod: -4, moistureMod: -2, sunExposureMod: -3, windMod: 3, eventChance: 0.2 },
};

// --- CENTRAL ITEM CATALOG ---
export const itemDefinitions: Record<string, ItemDefinition> = {
    // Forest Items
    'Quả Mọng Ăn Được': {
        description: 'Một loại quả mọng đỏ, có vẻ ngon miệng và an toàn, giúp phục hồi chút thể lực.',
        tier: 1,
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 2, max: 6 }
    },
    'Nấm Độc': {
        description: 'Một loại nấm có màu sắc sặc sỡ, tốt nhất không nên ăn.',
        tier: 2,
        effects: [], // No positive effects
        baseQuantity: { min: 1, max: 3 }
    },
    'Thảo Dược Chữa Lành': {
        description: 'Một loại lá cây có mùi thơm dễ chịu, có khả năng chữa lành vết thương nhỏ.',
        tier: 2,
        effects: [{ type: 'HEAL', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cành Cây Chắc Chắn': {
        description: 'Một cành cây thẳng và cứng, có thể dùng làm vũ khí tạm thời.',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mũi Tên Cũ': {
        description: 'Một mũi tên có vẻ đã được sử dụng, cắm trên một thân cây.',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Tinh Linh': {
        description: 'Một bông hoa phát ra ánh sáng xanh lam yếu ớt, tỏa ra năng lượng phép thuật.',
        tier: 4,
        effects: [], // Would be 'RESTORE_MANA' if mana existed
        baseQuantity: { min: 1, max: 1 }
    },
     'Rễ Cây Hiếm': {
        description: 'Một loại rễ cây chỉ mọc ở vùng nước độc, có giá trị cao trong giả kim thuật.',
        tier: 3,
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    // Grassland Items
    'Hoa Dại': {
        description: 'Một bông hoa đẹp, có thể có giá trị với một nhà thảo dược học.',
        tier: 1,
        effects: [],
        baseQuantity: { min: 3, max: 8 }
    },
    'Lúa Mì': {
        description: 'Một bó lúa mì chín vàng, có thể dùng làm thức ăn.',
        tier: 1,
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Lông Chim Ưng': {
        description: 'Một chiếc lông vũ sắc bén từ một loài chim săn mồi.',
        tier: 2,
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Lửa': {
        description: 'Hai hòn đá lửa, có thể dùng để nhóm lửa.',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    // Desert Items
    'Bình Nước Cũ': {
        description: 'Một bình nước quý giá, gần như còn đầy.',
        tier: 1,
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Gốm Cổ': {
        description: 'Một mảnh gốm vỡ có hoa văn kỳ lạ, có thể là của một nền văn minh đã mất.',
        tier: 2,
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Xương Rồng': {
        description: 'Một bông hoa hiếm hoi nở trên sa mạc, chứa đầy nước giúp phục hồi thể lực.',
        tier: 1,
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Xương Động Vật': {
        description: 'Một bộ xương lớn bị tẩy trắng bởi ánh mặt trời.',
        tier: 1,
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    // Swamp Items
    'Rêu Phát Sáng': {
        description: 'Một loại rêu có thể dùng để đánh dấu đường đi hoặc làm thuốc.',
        tier: 2,
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Trứng Bò Sát': {
        description: 'Một ổ trứng lạ, có lớp vỏ dai và dày.',
        tier: 2,
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Nấm Đầm Lầy': {
        description: 'Một loại nấm ăn được nhưng có vị hơi tanh.',
        tier: 1,
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 4 }
    },
    // Mountain Items
    'Quặng Sắt': {
        description: 'Một mỏm đá chứa quặng sắt có thể rèn thành vũ khí.',
        tier: 2,
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Lông Đại Bàng': {
        description: 'Một chiếc lông vũ lớn và đẹp, rơi ra từ một sinh vật bay lượn trên đỉnh núi.',
        tier: 3,
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Pha Lê Núi': {
        description: 'Một tinh thể trong suốt, lạnh toát khi chạm vào.',
        tier: 4,
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Thuốc Núi': {
        description: 'Một loại thảo dược quý hiếm chỉ mọc ở nơi cao, có tác dụng chữa bệnh.',
        tier: 3,
        effects: [{ type: 'HEAL', amount: 50 }],
        baseQuantity: { min: 1, max: 1 }
    },
    // Cave Items
     'Mảnh Tinh Thể': {
        description: 'Một mảnh tinh thể phát ra ánh sáng yếu ớt, có thể soi đường.',
        tier: 2,
        effects: [],
        baseQuantity: { min: 2, max: 7 }
    },
    'Bản Đồ Cổ': {
        description: 'Một tấm bản đồ da cũ kỹ, có vẻ chỉ đường đến một nơi bí mật trong hang.',
        tier: 3,
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Xương Cổ': {
        description: 'Một bộ xương của một sinh vật lạ chưa từng thấy.',
        tier: 2,
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mỏ Vàng': {
        description: 'Những vệt vàng lấp lánh trên vách đá.',
        tier: 5,
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
};

export const worldConfig: Record<Terrain, BiomeDefinition> = {
    forest: {
        minSize: 5, maxSize: 10, travelCost: 4, spreadWeight: 0.6,
        allowedNeighbors: ['grassland', 'mountain', 'swamp'],
        defaultValueRanges: {
            vegetationDensity: { min: 7, max: 10 }, moisture: { min: 5, max: 8 }, elevation: { min: 1, max: 4 },
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
// This has been refactored to use the central itemDefinitions catalog
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
            { name: 'Quả Mọng Ăn Được', conditions: { dangerLevel: { max: 4 }, chance: 0.3 } },
            { name: 'Nấm Độc', conditions: { dangerLevel: { min: 5 }, moisture: { min: 6 }, chance: 0.25 } },
            { name: 'Thảo Dược Chữa Lành', conditions: { vegetationDensity: { min: 8 }, chance: 0.2 } },
            { name: 'Cành Cây Chắc Chắn', conditions: { chance: 0.4 } },
            { name: 'Mũi Tên Cũ', conditions: { humanPresence: { min: 2 }, chance: 0.1 } },
            { name: 'Hoa Tinh Linh', conditions: { magicAffinity: { min: 7 }, chance: 0.1 } },
            { name: 'Rễ Cây Hiếm', conditions: { magicAffinity: { min: 6 }, chance: 0.15 } },
        ],
        enemies: [
            { data: { type: 'Sói', hp: 30, damage: 10, behavior: 'aggressive', diet: ['Heo Rừng', 'Thỏ hoang hung dữ'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 5 }, chance: 0.4 } },
            { data: { type: 'Nhện khổng lồ', hp: 40, damage: 15, behavior: 'aggressive', diet: ['Heo Rừng', 'Yêu Tinh Rừng (Goblin)'], maxSatiation: 2 }, conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Heo Rừng', hp: 50, damage: 8, behavior: 'aggressive', diet: ['Quả Mọng Ăn Được', 'Rễ Cây Hiếm'], maxSatiation: 3 }, conditions: { predatorPresence: { min: 4 }, chance: 0.3 } },
            { data: { type: 'Yêu Tinh Rừng (Goblin)', hp: 25, damage: 8, behavior: 'aggressive', diet: ['Thỏ hoang hung dữ', 'Nấm Độc'], maxSatiation: 3 }, conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.25 } },
            { data: { type: 'Gấu', hp: 80, damage: 20, behavior: 'aggressive', diet: ['Heo Rừng', 'Cá sấu'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 }, chance: 0.1 } },
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
            { name: 'Hoa Dại', conditions: { vegetationDensity: { min: 3 }, chance: 0.4 } },
            { name: 'Lúa Mì', conditions: { soilType: ['loamy'], moisture: { min: 3, max: 6 }, chance: 0.2 } },
            { name: 'Lông Chim Ưng', conditions: { predatorPresence: { min: 3 }, chance: 0.15 } },
            { name: 'Đá Lửa', conditions: { chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Thỏ hoang hung dữ', hp: 20, damage: 5, behavior: 'aggressive', diet: ['Hoa Dại', 'Lúa Mì'], maxSatiation: 4 }, conditions: { dangerLevel: { min: 2, max: 5 }, chance: 0.3 } },
            { data: { type: 'Cáo gian xảo', hp: 25, damage: 8, behavior: 'aggressive', diet: ['Thỏ hoang hung dữ'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 3 }, chance: 0.25 } },
            { data: { type: 'Bầy châu chấu', hp: 35, damage: 5, behavior: 'aggressive', diet: ['Lúa Mì', 'Hoa Dại'], maxSatiation: 5 }, conditions: { temperature: { min: 7 }, moisture: { max: 3 }, chance: 0.15 } },
            { data: { type: 'Linh cẩu', hp: 40, damage: 12, behavior: 'aggressive', diet: ['Thỏ hoang hung dữ', 'Xương Động Vật'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 5 }, chance: 0.2 } },
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
            { name: 'Bình Nước Cũ', conditions: { humanPresence: { min: 1 }, chance: 0.15 } },
            { name: 'Mảnh Gốm Cổ', conditions: { chance: 0.1 } },
            { name: 'Hoa Xương Rồng', conditions: { vegetationDensity: { min: 1 }, chance: 0.2 } },
            { name: 'Xương Động Vật', conditions: { chance: 0.3 } },
        ],
        enemies: [
            { data: { type: 'Rắn đuôi chuông', hp: 30, damage: 15, behavior: 'aggressive', diet: ['Thỏ hoang hung dữ'], maxSatiation: 2 }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Bọ cạp khổng lồ', hp: 50, damage: 10, behavior: 'aggressive', diet: ['Rắn đuôi chuông'], maxSatiation: 2 }, conditions: { dangerLevel: { min: 7 }, chance: 0.35 } },
            { data: { type: 'Kền kền', hp: 25, damage: 8, behavior: 'aggressive', diet: ['Xương Động Vật'], maxSatiation: 1 }, conditions: { predatorPresence: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Linh hồn cát', hp: 60, damage: 12, behavior: 'aggressive', diet: ['Pha Lê Núi'], maxSatiation: 1 }, conditions: { magicAffinity: { min: 5 }, chance: 0.1 } },
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
            { name: 'Rêu Phát Sáng', conditions: { lightLevel: { max: -4 }, chance: 0.3 } },
            { name: 'Trứng Bò Sát', conditions: { predatorPresence: { min: 7 }, chance: 0.2 } },
            { name: 'Nấm Đầm Lầy', conditions: { moisture: { min: 9 }, chance: 0.25 } },
            { name: 'Rễ Cây Hiếm', conditions: { magicAffinity: { min: 6 }, moisture: {min: 8}, chance: 0.1 } },
        ],
        enemies: [
            { data: { type: 'Đỉa khổng lồ', hp: 40, damage: 5, behavior: 'aggressive', diet: ['Trứng Bò Sát'], maxSatiation: 3 }, conditions: { moisture: { min: 9 }, chance: 0.4 } },
            { data: { type: 'Ma trơi', hp: 25, damage: 20, behavior: 'aggressive', diet: ['Hoa Tinh Linh'], maxSatiation: 1 }, conditions: { magicAffinity: { min: 7 }, lightLevel: { max: -5 }, chance: 0.2 } },
            { data: { type: 'Cá sấu', hp: 70, damage: 25, behavior: 'aggressive', diet: ['Heo Rừng', 'Dê núi hung hãn'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 8 }, chance: 0.25 } },
            { data: { type: 'Muỗi khổng lồ', hp: 15, damage: 5, behavior: 'aggressive', diet: [], maxSatiation: 1 }, conditions: { chance: 0.5 } },
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
            { name: 'Quặng Sắt', conditions: { soilType: ['rocky'], chance: 0.25 } },
            { name: 'Lông Đại Bàng', conditions: { elevation: { min: 8 }, chance: 0.15 } },
            { name: 'Pha Lê Núi', conditions: { magicAffinity: { min: 5 }, elevation: { min: 7 }, chance: 0.1 } },
            { name: 'Cây Thuốc Núi', conditions: { vegetationDensity: { min: 2 }, elevation: { min: 6 }, chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Dê núi hung hãn', hp: 50, damage: 15, behavior: 'aggressive', diet: ['Cây Thuốc Núi', 'Hoa Dại'], maxSatiation: 3 }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
            { data: { type: 'Người đá (Stone Golem)', hp: 80, damage: 10, behavior: 'aggressive', diet: ['Quặng Sắt', 'Pha Lê Núi'], maxSatiation: 1 }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
            { data: { type: 'Harpie', hp: 45, damage: 18, behavior: 'aggressive', diet: ['Dê núi hung hãn', 'Thỏ hoang hung dữ'], maxSatiation: 2 }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
            { data: { type: 'Báo tuyết', hp: 60, damage: 20, behavior: 'aggressive', diet: ['Dê núi hung hãn'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
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
            { name: 'Mảnh Tinh Thể', conditions: { magicAffinity: { min: 6 }, chance: 0.3 } },
            { name: 'Bản Đồ Cổ', conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
            { name: 'Xương Cổ', conditions: { dangerLevel: { min: 7 }, chance: 0.2 } },
            { name: 'Mỏ Vàng', conditions: { elevation: { min: -8 }, chance: 0.05 } },
        ],
        enemies: [
            { data: { type: 'Dơi khổng lồ', hp: 25, damage: 10, behavior: 'aggressive', diet: ['Nhện hang'], maxSatiation: 2 }, conditions: { lightLevel: { max: -2 }, chance: 0.5 } },
            { data: { type: 'Nhện hang', hp: 45, damage: 15, behavior: 'aggressive', diet: ['Dơi khổng lồ'], maxSatiation: 2 }, conditions: { dangerLevel: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Slime', hp: 30, damage: 8, behavior: 'passive', diet: ['Mảnh Tinh Thể', 'Rêu Phát Sáng'], maxSatiation: 3 }, conditions: { moisture: { min: 8 }, chance: 0.3 } },
            { data: { type: 'Sâu Bò Khổng Lồ', hp: 100, damage: 20, behavior: 'aggressive', diet: ['Người đá (Stone Golem)'], maxSatiation: 1 }, conditions: { dangerLevel: { min: 9 }, chance: 0.15 } },
        ],
    },
};
