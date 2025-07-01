import type { Terrain } from "./types";

// --- CONTENT TEMPLATES & ENTITY CATALOG ---
export const templates: Record<Terrain, any> = {
    forest: {
        descriptionTemplates: [
            'Bạn đang ở trong một khu rừng [adjective]. Những cây [feature] cao vút che khuất ánh mặt trời, và không khí phảng phất mùi [smell].',
            'Một khu rừng [adjective] bao quanh bạn. Tiếng lá xào xạc dưới chân khi bạn di chuyển giữa những cây [feature]. Bạn nghe thấy âm thanh của [sound].',
        ],
        adjectives: ['rậm rạp', 'u ám', 'cổ xưa', 'yên tĩnh', 'ma mị', 'ẩm ướt', 'ngập nắng'],
        features: ['sồi', 'thông', 'dương xỉ', 'nấm phát quang', 'dây leo chằng chịt', 'thân cây mục', 'suối nhỏ'],
        smells: ['đất ẩm', 'lá cây mục', 'nhựa thông', 'hoa dại'],
        sounds: ['chim hót', 'gió rít', 'cành cây gãy', 'sự im lặng đáng sợ'],
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
            { name: 'Vỏ Cây Cổ Thụ', conditions: { vegetationDensity: { min: 9 }, chance: 0.05 } },
            { name: 'Nhựa Cây Dính', conditions: { chance: 0.15 } },
            { name: 'Mật Ong Hoang', conditions: { vegetationDensity: { min: 6 }, chance: 0.1 } },
            { name: 'Sỏi', conditions: { chance: 0.3 } },
            { name: 'Tổ Chim Rỗng', conditions: { chance: 0.1 } },
            { name: 'Dây Gai', conditions: { vegetationDensity: { min: 5 }, chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Sói', emoji: '🐺', hp: 30, damage: 10, behavior: 'aggressive', size: 'medium', diet: ['Heo Rừng', 'Thịt Thỏ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Thịt Sói Sống', chance: 0.7, quantity: {min: 1, max: 1}}, {name: 'Nanh Sói', chance: 0.15, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 5 }, chance: 0.4 } },
            { data: { type: 'Nhện khổng lồ', emoji: '🕷️', hp: 40, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Heo Rừng', 'Yêu Tinh Rừng'], satiation: 0, maxSatiation: 2, loot: [{name: 'Tơ Nhện Khổng lồ', chance: 0.6, quantity: {min: 1, max: 3}}, {name: 'Mắt Nhện', chance: 0.1, quantity: {min: 2, max: 8}}] }, conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Heo Rừng', emoji: '🐗', hp: 50, damage: 8, behavior: 'defensive', size: 'medium', diet: ['Quả Mọng Ăn Được', 'Rễ Cây Hiếm'], satiation: 0, maxSatiation: 3, loot: [{name: 'Thịt Heo Rừng', chance: 0.8, quantity: {min: 1, max: 2}}, {name: 'Da Heo Rừng', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { predatorPresence: { min: 4 }, chance: 0.3 } },
            { data: { type: 'Yêu Tinh Rừng', emoji: '👺', hp: 25, damage: 8, behavior: 'aggressive', size: 'small', diet: ['Thịt Thỏ', 'Nấm Độc'], satiation: 0, maxSatiation: 3, loot: [{name: 'Tai Yêu Tinh', chance: 0.5, quantity: {min: 1, max: 1}}, {name: 'Mũi Tên Cũ', chance: 0.05, quantity: {min: 1, max: 1}}, {name: 'Sỏi', chance: 0.2, quantity: {min: 1, max: 3}}] }, conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.25 } },
            { data: { type: 'Gấu', emoji: '🐻', hp: 80, damage: 20, behavior: 'territorial', size: 'large', diet: ['Heo Rừng', 'Cá sấu'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Gấu', chance: 0.5, quantity: {min: 1, max: 1}}, {name: 'Móng Vuốt Gấu', chance: 0.3, quantity: {min: 2, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 }, chance: 0.1 } },
        ],
    },
    grassland: {
        descriptionTemplates: [
            'Một đồng cỏ [adjective] trải dài đến tận chân trời. Những ngọn đồi [feature] nhấp nhô nhẹ nhàng dưới bầu trời [sky].',
            'Bạn đang đứng giữa một thảo nguyên [adjective]. Gió thổi qua làm những ngọn cỏ [feature] lay động như sóng.',
        ],
        adjectives: ['xanh mướt', 'bạt ngàn', 'khô cằn', 'lộng gió', 'yên bình'],
        features: ['hoa dại', 'cỏ cao', 'đá tảng', 'lối mòn', 'đàn gia súc'],
        sky: ['trong xanh', 'đầy mây', 'u ám', 'hoàng hôn'],
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
            { name: 'Trứng Chim Hoang', conditions: { chance: 0.25 } },
            { name: 'Rễ Củ Ăn Được', conditions: { soilType: ['loamy'], chance: 0.15 } },
            { name: 'Đất Sét', conditions: { moisture: { min: 4 }, chance: 0.15 } },
            { name: 'Cỏ Khô', conditions: { moisture: { max: 3 }, chance: 0.3 } },
            { name: 'Hạt Giống Hoa Dại', conditions: { chance: 0.2 } },
            { name: 'Mảnh Vải Rách', conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
        ],
        enemies: [
            { data: { type: 'Thỏ hoang hung dữ', emoji: '🐇', hp: 20, damage: 5, behavior: 'defensive', size: 'small', diet: ['Hoa Dại', 'Lúa Mì'], satiation: 0, maxSatiation: 4, loot: [{name: 'Thịt Thỏ', chance: 0.6, quantity: {min: 1, max: 2}}, {name: 'Da Thú Nhỏ', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 2, max: 5 }, chance: 0.3 } },
            { data: { type: 'Cáo gian xảo', emoji: '🦊', hp: 25, damage: 8, behavior: 'territorial', size: 'small', diet: ['Thỏ hoang hung dữ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cáo', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Mảnh Xương', chance: 0.1, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 3 }, chance: 0.25 } },
            { data: { type: 'Bầy châu chấu', emoji: '🦗', hp: 35, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Lúa Mì', 'Hoa Dại'], satiation: 0, maxSatiation: 5, loot: [{name: 'Cánh Châu Chấu', chance: 0.7, quantity: {min: 5, max: 10}}] }, conditions: { temperature: { min: 7 }, moisture: { max: 3 }, chance: 0.15 } },
            { data: { type: 'Linh cẩu', emoji: '🐕', hp: 40, damage: 12, behavior: 'aggressive', size: 'medium', diet: ['Thỏ hoang hung dữ', 'Xương Động Vật'], satiation: 0, maxSatiation: 2, loot: [{name: 'Răng Linh Cẩu', chance: 0.3, quantity: {min: 1, max: 3}}, {name: 'Mảnh Xương', chance: 0.15, quantity: {min: 2, max: 4}}] }, conditions: { predatorPresence: { min: 5 }, chance: 0.2 } },
        ],
    },
    desert: {
        descriptionTemplates: [
            'Cát, cát và cát. Một sa mạc [adjective] bao la. Những [feature] là cảnh tượng duy nhất phá vỡ sự đơn điệu.',
            'Cái nóng của sa mạc [adjective] thật khắc nghiệt. Bạn thấy một [feature] ở phía xa, có thể là ảo ảnh.',
        ],
        adjectives: ['nóng bỏng', 'khô cằn', 'vô tận', 'lặng im', 'gió cát'],
        features: ['cồn cát', 'ốc đảo', 'xương rồng khổng lồ', 'bộ xương cũ', 'tàn tích đá'],
        NPCs: [
            { data: 'thương nhân lạc đà', conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
            { data: 'nhà thám hiểm lạc lối', conditions: { humanPresence: { min: 1, max: 2 }, dangerLevel: { min: 6 }, chance: 0.05 } },
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
        enemies: [
            { data: { type: 'Rắn đuôi chuông', emoji: '🐍', hp: 30, damage: 15, behavior: 'defensive', size: 'small', diet: ['Thỏ hoang hung dữ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Rắn', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Trứng Rắn', chance: 0.05, quantity: {min: 2, max: 4}}] }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Bọ cạp khổng lồ', emoji: '🦂', hp: 50, damage: 10, behavior: 'territorial', size: 'medium', diet: ['Rắn đuôi chuông'], satiation: 0, maxSatiation: 2, loot: [{name: 'Đuôi Bọ Cạp', chance: 0.25, quantity: {min: 1, max: 1}}, {name: 'Nọc Bọ Cạp', chance: 0.08, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 7 }, chance: 0.35 } },
            { data: { type: 'Kền kền', emoji: '🦅', hp: 25, damage: 8, behavior: 'passive', size: 'medium', diet: ['Xương Động Vật'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lông Kền Kền', chance: 0.6, quantity: {min: 2, max: 5}}, {name: 'Xương Động Vật', chance: 0.15, quantity: {min: 1, max: 1}}] }, conditions: { predatorPresence: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Linh hồn cát', emoji: '👻', hp: 60, damage: 12, behavior: 'territorial', size: 'medium', diet: ['Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Cát Ma Thuật', chance: 0.15, quantity: {min: 1, max: 2}}] }, conditions: { magicAffinity: { min: 5 }, chance: 0.1 } },
        ],
    },
    swamp: {
        descriptionTemplates: [
            'Bạn đang lội qua một đầm lầy [adjective]. Nước bùn [feature] ngập đến đầu gối.',
            'Không khí đặc quánh mùi cây cỏ mục rữa. Những cây [feature] mọc lên từ làn nước tù đọng.',
        ],
        adjectives: ['hôi thối', 'âm u', 'chết chóc', 'sương giăng', 'ngập nước'],
        features: ['đước', 'dây leo', 'khí độc', 'bong bóng bùn', 'côn trùng'],
        NPCs: [
            { data: 'ẩn sĩ', conditions: { humanPresence: { min: 1, max: 2 }, magicAffinity: { min: 5 }, chance: 0.05 } },
            { data: 'thợ săn cá sấu', conditions: { humanPresence: { min: 2 }, predatorPresence: { min: 8 }, chance: 0.1 } },
        ],
        items: [
            { name: 'Rêu Phát Sáng', conditions: { lightLevel: { max: -4 }, chance: 0.3 } },
            { name: 'Trứng Bò Sát', conditions: { predatorPresence: { min: 7 }, chance: 0.2 } },
            { name: 'Nấm Đầm Lầy', conditions: { moisture: { min: 9 }, chance: 0.25 } },
            { name: 'Rễ Cây Hiếm', conditions: { magicAffinity: { min: 6 }, moisture: {min: 8}, chance: 0.1 } },
            { name: 'Nước Bùn', conditions: { chance: 0.3 } },
            { name: 'Hoa Độc', conditions: { vegetationDensity: { min: 6 }, chance: 0.15 } },
            { name: 'Cây Sậy', conditions: { moisture: { min: 7 }, chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Đỉa khổng lồ', emoji: '🩸', hp: 40, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Trứng Bò Sát'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn của Đỉa', chance: 0.5, quantity: {min: 1, max: 2}}] }, conditions: { moisture: { min: 9 }, chance: 0.4 } },
            { data: { type: 'Ma trơi', emoji: '💡', hp: 25, damage: 20, behavior: 'territorial', size: 'small', diet: ['Hoa Tinh Linh'], satiation: 0, maxSatiation: 1, loot: [{name: 'Tinh chất Ma trơi', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { magicAffinity: { min: 7 }, lightLevel: { max: -5 }, chance: 0.2 } },
            { data: { type: 'Cá sấu', emoji: '🐊', hp: 70, damage: 25, behavior: 'territorial', size: 'large', diet: ['Heo Rừng', 'Dê núi hung hãn'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cá Sấu', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Răng Cá Sấu', chance: 0.3, quantity: {min: 1, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 8 }, chance: 0.25 } },
            { data: { type: 'Muỗi khổng lồ', emoji: '🦟', hp: 15, damage: 5, behavior: 'aggressive', size: 'small', diet: [], satiation: 0, maxSatiation: 1, loot: [{name: 'Cánh Muỗi', chance: 0.7, quantity: {min: 2, max: 6}}] }, conditions: { chance: 0.5 } },
        ],
    },
    mountain: {
        descriptionTemplates: [
            'Bạn đang leo lên một sườn núi [adjective]. Gió [feature] thổi mạnh và lạnh buốt.',
            'Con đường mòn [feature] cheo leo dẫn lên đỉnh núi. Không khí loãng dần và tầm nhìn [visibility].',
        ],
        adjectives: ['hiểm trở', 'lộng gió', 'hùng vĩ', 'tuyết phủ', 'trơ trọi'],
        features: ['vách đá', 'tuyết', 'hang động', 'dòng sông băng', 'mỏm đá'],
        visibility: ['cực tốt', 'bị mây che phủ', 'hạn chế'],
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
            { name: 'Trứng Griffon', conditions: { elevation: { min: 9 }, magicAffinity: {min: 7}, chance: 0.01 } },
            { name: 'Đá Vỏ Chai', conditions: { elevation: { min: 6 }, chance: 0.1 } },
            { name: 'Đá Granit', conditions: { chance: 0.2 } },
            { name: 'Tuyết', conditions: { temperature: { max: 2 }, chance: 0.4 } },
            { name: 'Cây Địa Y', conditions: { moisture: { min: 4 }, chance: 0.1 } },
            { name: 'Trứng Đại Bàng', conditions: { elevation: { min: 8 }, chance: 0.1 } },
        ],
        enemies: [
            { data: { type: 'Dê núi hung hãn', emoji: '🐐', hp: 50, damage: 15, behavior: 'defensive', size: 'medium', diet: ['Cây Thuốc Núi', 'Hoa Dại'], satiation: 0, maxSatiation: 3, loot: [{name: 'Sừng Dê Núi', chance: 0.4, quantity: {min: 1, max: 2}}, {name: 'Thịt Dê Núi', chance: 0.7, quantity: {min: 1, max: 2}}] }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
            { data: { type: 'Người đá', emoji: '🗿', hp: 80, damage: 10, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt', 'Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lõi Người Đá', chance: 0.1, quantity: {min: 1, max: 1}}, {name: 'Đá Cuội', chance: 0.25, quantity: {min: 2, max: 3}}] }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
            { data: { type: 'Harpie', emoji: '🦅', hp: 45, damage: 18, behavior: 'aggressive', size: 'medium', diet: ['Dê núi hung hãn', 'Thỏ hoang hung dữ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Lông Harpie', chance: 0.5, quantity: {min: 3, max: 6}}] }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
            { data: { type: 'Báo tuyết', emoji: '🐆', hp: 60, damage: 20, behavior: 'aggressive', size: 'large', diet: ['Dê núi hung hãn'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Báo Tuyết', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Thịt Báo Tuyết', chance: 0.6, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
        ],
    },
    cave: {
        descriptionTemplates: [
            'Bên trong hang động tối [adjective] và ẩm ướt. Tiếng bước chân của bạn vang vọng giữa những [feature].',
            'Những khối [feature] lấp lánh dưới ánh sáng yếu ớt lọt vào từ bên ngoài. Không khí có mùi [smell].',
        ],
        adjectives: ['sâu thẳm', 'lạnh lẽo', 'bí ẩn', 'chằng chịt', 'tối đen'],
        features: ['thạch nhũ', 'tinh thể', 'dòng sông ngầm', 'tranh vẽ cổ', 'mạng nhện'],
        smells: ['đất ẩm', 'nước tù', 'khoáng chất', 'lưu huỳnh'],
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
            { name: 'Nấm Phát Quang', conditions: { lightLevel: { max: -6 }, chance: 0.25 } },
            { name: 'Túi Trứng Nhện', conditions: { dangerLevel: { min: 7 }, chance: 0.1 } },
            { name: 'Nước Ngầm', conditions: { moisture: { min: 7 }, chance: 0.2 } },
            { name: 'Guano (Phân dơi)', conditions: { chance: 0.15 } },
            { name: 'Đá Vôi', conditions: { chance: 0.2 } },
            { name: 'Mảnh Xương', conditions: { chance: 0.3 } },
        ],
        enemies: [
            { data: { type: 'Dơi khổng lồ', emoji: '🦇', hp: 25, damage: 10, behavior: 'passive', size: 'small', diet: ['Nhện hang'], satiation: 0, maxSatiation: 2, loot: [{name: 'Cánh Dơi', chance: 0.6, quantity: {min: 1, max: 2}}, {name: 'Guano (Phân dơi)', chance: 0.2, quantity: {min: 1, max: 2}}] }, conditions: { lightLevel: { max: -2 }, chance: 0.5 } },
            { data: { type: 'Nhện hang', emoji: '🕷️', hp: 45, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Dơi khổng lồ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Nọc Độc Nhện Hang', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Túi Trứng Nhện', chance: 0.08, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Slime', emoji: '💧', hp: 30, damage: 8, behavior: 'passive', size: 'small', diet: ['Mảnh Tinh Thể', 'Rêu Phát Sáng'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn Slime', chance: 0.7, quantity: {min: 1, max: 3}}] }, conditions: { moisture: { min: 8 }, chance: 0.3 } },
            { data: { type: 'Sâu Bò Khổng Lồ', emoji: '🐛', hp: 100, damage: 20, behavior: 'defensive', size: 'large', diet: ['Người đá'], satiation: 0, maxSatiation: 1, loot: [{name: 'Răng Sâu Bò', chance: 0.15, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 9 }, chance: 0.15 } },
        ],
    },
    jungle: {
        descriptionTemplates: [
            'Bạn đang ở giữa một khu rừng rậm [adjective]. Những tán lá [feature] dày đặc đến nỗi ánh sáng mặt trời khó có thể lọt qua. Tiếng [sound] vang vọng khắp nơi.',
            'Không khí [adjective] và ẩm ướt. Cây cối và dây leo [feature] mọc um tùm, tạo thành một mê cung xanh. Mùi [smell] nồng nặc trong không khí.'
        ],
        adjectives: ['nguyên sinh', 'nhiệt đới', 'ngột ngạt', 'bí hiểm', 'sống động'],
        features: ['khổng lồ', 'dây leo', 'hoa lạ', 'thác nước ẩn', 'tàn tích cổ'],
        smells: ['hoa thối', 'đất ẩm', 'mùi xạ hương của động vật'],
        sounds: ['vẹt kêu', 'khỉ hú', 'tiếng côn trùng rả rích', 'tiếng nước chảy'],
        NPCs: [
            { data: 'thầy mo của bộ lạc', conditions: { humanPresence: { min: 3 }, magicAffinity: { min: 5 }, chance: 0.1 } },
            { data: 'nhà thực vật học', conditions: { humanPresence: { min: 1, max: 3 }, vegetationDensity: { min: 9 }, chance: 0.15 } }
        ],
        items: [
            { name: 'Dây leo Titan', conditions: { vegetationDensity: { min: 9 }, chance: 0.2 } },
            { name: 'Hoa ăn thịt', conditions: { dangerLevel: { min: 6 }, vegetationDensity: { min: 8 }, chance: 0.1 } },
            { name: 'Nọc Ếch độc', conditions: { dangerLevel: { min: 7 }, moisture: { min: 8 }, chance: 0.05 } },
            { name: 'Lông Vẹt Sặc Sỡ', conditions: { chance: 0.3 } },
            { name: 'Quả Lạ', conditions: { chance: 0.25 } }
        ],
        enemies: [
            { data: { type: 'Trăn khổng lồ', emoji: '🐍', hp: 90, damage: 18, behavior: 'territorial', size: 'large', diet: ['Khỉ đột'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Da Rắn', chance: 0.8, quantity: { min: 2, max: 3 } }] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 7 }, chance: 0.2 } },
            { data: { type: 'Báo đốm', emoji: '🐆', hp: 70, damage: 22, behavior: 'aggressive', size: 'large', diet: ['Khỉ đột'], satiation: 0, maxSatiation: 2, loot: [{ name: 'Da Báo Tuyết', chance: 0.5, quantity: { min: 1, max: 1 } }, { name: 'Nanh Sói', chance: 0.3, quantity: { min: 2, max: 4 } }] }, conditions: { predatorPresence: { min: 9 }, chance: 0.25 } },
            { data: { type: 'Khỉ đột', emoji: '🦍', hp: 80, damage: 20, behavior: 'defensive', size: 'large', diet: ['Quả Lạ', 'Hoa ăn thịt'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Da Gấu', chance: 0.3, quantity: { min: 1, max: 1 } }] }, conditions: { vegetationDensity: { min: 8 }, chance: 0.3 } }
        ]
    },
    volcanic: {
        descriptionTemplates: [
            'Mặt đất [adjective] và nứt nẻ dưới chân bạn. Không khí nồng nặc mùi [smell]. Xa xa, một [feature] phun trào những cột khói đen.',
            'Cảnh quan ở đây thật [adjective]. Những dòng [feature] đã nguội lạnh tạo thành những hình thù kỳ quái. Thỉnh thoảng, bạn cảm nhận được mặt đất rung chuyển nhẹ.'
        ],
        adjectives: ['hoang tàn', 'nóng bỏng', 'đáng sợ', 'đầy tro bụi'],
        features: ['dung nham', 'khe nứt', 'cột đá bazan', 'hồ axit'],
        smells: ['lưu huỳnh', 'đá cháy', 'kim loại nóng chảy'],
        NPCs: [
            { data: 'thợ rèn dung nham', conditions: { humanPresence: { min: 1 }, temperature: { min: 9 }, chance: 0.1 } },
            { data: 'hỏa tinh bị mắc kẹt', conditions: { magicAffinity: { min: 8 }, chance: 0.05 } }
        ],
        items: [
            { name: 'Đá Obsidian', conditions: { chance: 0.4 } },
            { name: 'Lưu huỳnh', conditions: { temperature: { min: 8 }, chance: 0.3 } },
            { name: 'Trái tim Magma', conditions: { dangerLevel: { min: 9 }, magicAffinity: { min: 7 }, chance: 0.05 } },
            { name: 'Tro núi lửa', conditions: { chance: 0.5 } },
            { name: 'Quặng Sắt', conditions: { soilType: ['rocky'], chance: 0.15 } }
        ],
        enemies: [
            { data: { type: 'Salamander lửa', emoji: '🦎', hp: 50, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Lưu huỳnh'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Da Rắn', chance: 0.5, quantity: { min: 1, max: 2 } }] }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Golem dung nham', emoji: '🔥', hp: 120, damage: 25, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Trái tim Magma', chance: 0.1, quantity: { min: 1, max: 1 } }, { name: 'Đá Obsidian', chance: 0.3, quantity: { min: 2, max: 5 } }] }, conditions: { dangerLevel: { min: 9 }, chance: 0.25 } },
            { data: { type: 'Rồng lửa con', emoji: '🐉', hp: 150, damage: 30, behavior: 'aggressive', size: 'large', diet: ['Golem dung nham'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Vảy Rồng', chance: 0.2, quantity: { min: 3, max: 6 } }, { name: 'Răng Rồng', chance: 0.1, quantity: { min: 1, max: 2 } }] }, conditions: { predatorPresence: { min: 10 }, dangerLevel: { min: 10 }, chance: 0.1 } }
        ]
    },
};
