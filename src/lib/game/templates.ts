
import type { Language, Npc, Terrain } from "./types";
import { structureDefinitions } from "./structures";

const templates_vi: Record<Terrain, any> = {
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
    },
    grassland: {
        descriptionTemplates: [
            'Một đồng cỏ [adjective] trải dài đến tận chân trời. Những ngọn đồi [feature] nhấp nhô nhẹ nhàng dưới bầu trời [sky].',
            'Bạn đang đứng giữa một thảo nguyên [adjective]. Gió thổi qua làm những ngọn cỏ [feature] lay động như sóng.',
        ],
        adjectives: ['xanh mướt', 'bạt ngàn', 'khô cằn', 'lộng gió', 'yên bình'],
        features: ['hoa dại', 'cỏ cao', 'đá tảng', 'lối mòn', 'đàn gia súc'],
        sky: ['trong xanh', 'đầy mây', 'u ám', 'hoàng hôn'],
        sounds: ['gió thổi', 'côn trùng kêu', 'tiếng vó ngựa xa', 'sự tĩnh lặng'],
        smells: ['cỏ tươi', 'hoa dại', 'đất khô', 'phân động vật'],
        NPCs: [
            { 
                data: { name: 'Người du mục', description: 'Một người phụ nữ với làn da rám nắng, mặc trang phục làm từ nhiều mảnh da khác nhau.', dialogueSeed: 'Một người từng trải, nói về những vùng đất xa xôi và những cơn gió.' },
                conditions: { humanPresence: { min: 4 }, chance: 0.15 } 
            },
            { 
                data: { name: 'Nông dân', description: 'Một người đàn ông có đôi tay chai sạn, đang lo lắng nhìn về phía cánh đồng của mình.', dialogueSeed: 'Một nông dân hiền lành, luôn lo lắng về thời tiết và mùa màng.' },
                conditions: { humanPresence: { min: 5 }, soilType: ['loamy'], chance: 0.2 } 
            },
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
        structures: [
            { 
                data: structureDefinitions['Tàn tích tháp canh'], 
                loot: [{ name: 'Mũi Tên Cũ', chance: 0.2, quantity: { min: 1, max: 3 } }, {name: 'Chìa Khóa Rỉ Sét', chance: 0.05, quantity: {min: 1, max: 1}}],
                conditions: { humanPresence: { min: 2 }, elevation: { min: 2 }, chance: 0.1 } 
            },
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
        sounds: ['gió rít', 'sự im lặng tuyệt đối', 'tiếng rắn trườn', 'tiếng cát chảy'],
        smells: ['cát nóng', 'không có gì', 'mùi ozon', 'xác khô'],
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
    },
    swamp: {
        descriptionTemplates: [
            'Bạn đang lội qua một đầm lầy [adjective]. Nước bùn [feature] ngập đến đầu gối.',
            'Không khí đặc quánh mùi cây cỏ mục rữa. Những cây [feature] mọc lên từ làn nước tù đọng.',
        ],
        adjectives: ['hôi thối', 'âm u', 'chết chóc', 'sương giăng', 'ngập nước'],
        features: ['đước', 'dây leo', 'khí độc', 'bong bóng bùn', 'côn trùng'],
        sounds: ['ếch kêu', 'nước sủi bọt', 'muỗi vo ve', 'tiếng lội bì bõm'],
        smells: ['cây cỏ mục', 'bùn lầy', 'khí metan', 'hoa thối'],
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
    },
    mountain: {
        descriptionTemplates: [
            'Bạn đang leo lên một sườn núi [adjective]. Gió [feature] thổi mạnh và lạnh buốt.',
            'Con đường mòn [feature] cheo leo dẫn lên đỉnh núi. Không khí loãng dần và tầm nhìn [visibility].',
        ],
        adjectives: ['hiểm trở', 'lộng gió', 'hùng vĩ', 'tuyết phủ', 'trơ trọi'],
        features: ['vách đá', 'tuyết', 'hang động', 'dòng sông băng', 'mỏm đá'],
        visibility: ['cực tốt', 'bị mây che phủ', 'hạn chế'],
        sounds: ['gió rít', 'đá lở', 'tiếng đại bàng kêu', 'sự tĩnh lặng'],
        smells: ['không khí lạnh', 'đá ẩm', 'mùi tuyết', 'khoáng chất'],
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
        sounds: ['tiếng nước nhỏ giọt', 'tiếng vang', 'tiếng dơi kêu', 'sự im lặng nặng nề'],
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
    },
    jungle: {
        descriptionTemplates: [
            'Bạn đang ở giữa một khu rừng rậm [adjective]. Những tán lá [feature] dày đặc đến nỗi ánh sáng mặt trời khó có thể lọt qua. Tiếng [sound] vang vọng khắp nơi.',
            'Không khí [adjective] và ẩm ướt. Cây cối và dây leo [feature] mọc um tùm, tạo thành một mê cung xanh. Mùi [smell] nồng nặc trong không khí.'
        ],
        adjectives: ['nguyên sinh', 'nhiệt đới', 'ngột ngạt', 'bí hiểm', 'sống động'],
        features: ['khổng lồ', 'dây leo', 'hoa lạ', 'thác nước ẩn', 'tàn tích cổ'],
        smells: ['hoa thối', 'đất ẩm', 'mùi xạ hương của động vật', 'mùi trái cây chín'],
        sounds: ['vẹt kêu', 'khỉ hú', 'tiếng côn trùng rả rích', 'tiếng nước chảy'],
        NPCs: [
            { 
                data: { name: 'Thầy mo của bộ lạc', description: 'Một người đàn ông lớn tuổi với khuôn mặt được sơn vẽ kỳ dị, đeo nhiều loại bùa hộ mệnh.', dialogueSeed: 'Một người thông thái và bí ẩn, nói về các linh hồn và những lời tiên tri cổ xưa.' },
                conditions: { humanPresence: { min: 3 }, magicAffinity: { min: 5 }, chance: 0.1 } 
            },
            { 
                data: { name: 'Nhà thực vật học', description: 'Một nhà khoa học với cặp kính dày, đang cẩn thận ghi chép vào một cuốn sổ tay.', dialogueSeed: 'Một người đam mê, hào hứng nói về các loài thực vật quý hiếm và đặc tính của chúng.' },
                conditions: { humanPresence: { min: 1, max: 3 }, vegetationDensity: { min: 9 }, chance: 0.15 } 
            }
        ],
        items: [
            { name: 'Dây leo Titan', conditions: { vegetationDensity: { min: 9 }, chance: 0.2 } },
            { name: 'Hoa ăn thịt', conditions: { dangerLevel: { min: 6 }, vegetationDensity: { min: 8 }, chance: 0.1 } },
            { name: 'Nọc Ếch độc', conditions: { dangerLevel: { min: 7 }, moisture: { min: 8 }, chance: 0.05 } },
            { name: 'Lông Vẹt Sặc Sỡ', conditions: { chance: 0.3 } },
            { name: 'Quả Lạ', conditions: { chance: 0.25 } },
            { name: 'Lá cây lớn', conditions: { vegetationDensity: { min: 8 }, chance: 0.4 } },
        ],
        structures: [],
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
        smells: ['lưu huỳnh', 'đá cháy', 'kim loại nóng chảy', 'khí độc'],
        sounds: ['tiếng dung nham sôi', 'tiếng đá nứt', 'tiếng gầm của núi lửa', 'sự im lặng chết chóc'],
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
    },
    wall: {
        descriptionTemplates: ['Một bức tường đá không thể vượt qua chặn đường.'],
        adjectives: [], features: [], smells: [], sounds: [],
        NPCs: [], items: [], structures: [], enemies: []
    },
};

const templates_en: Record<Terrain, any> = {
    forest: {
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
        items: templates_vi.forest.items,
        structures: templates_vi.forest.structures,
        enemies: [
            { data: { type: 'Wolf', emoji: '🐺', hp: 30, damage: 10, behavior: 'aggressive', size: 'medium', diet: ['Wild Boar', 'Rabbit'], satiation: 0, maxSatiation: 2, loot: [{name: 'Thịt Sói Sống', chance: 0.7, quantity: {min: 1, max: 1}}, {name: 'Nanh Sói', chance: 0.15, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 5 }, chance: 0.4 } },
            { data: { type: 'Giant Spider', emoji: '🕷️', hp: 40, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Wild Boar', 'Forest Goblin'], satiation: 0, maxSatiation: 2, loot: [{name: 'Tơ Nhện Khổng lồ', chance: 0.6, quantity: {min: 1, max: 3}}, {name: 'Mắt Nhện', chance: 0.1, quantity: {min: 2, max: 8}}] }, conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Wild Boar', emoji: '🐗', hp: 50, damage: 8, behavior: 'defensive', size: 'medium', diet: ['Quả Mọng Ăn Được', 'Rễ Cây Hiếm'], satiation: 0, maxSatiation: 3, loot: [{name: 'Thịt Heo Rừng', chance: 0.8, quantity: {min: 1, max: 2}}, {name: 'Da Heo Rừng', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { predatorPresence: { min: 4 }, chance: 0.3 } },
            { data: { type: 'Forest Goblin', emoji: '👺', hp: 25, damage: 8, behavior: 'aggressive', size: 'small', diet: ['Rabbit', 'Nấm Độc'], satiation: 0, maxSatiation: 3, loot: [{name: 'Tai Yêu Tinh', chance: 0.5, quantity: {min: 1, max: 1}}, {name: 'Mũi Tên Cũ', chance: 0.05, quantity: {min: 1, max: 1}}, {name: 'Sỏi', chance: 0.2, quantity: {min: 1, max: 3}}] }, conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.25 } },
            { data: { type: 'Bear', emoji: '🐻', hp: 80, damage: 20, behavior: 'territorial', size: 'large', diet: ['Wild Boar', 'Alligator'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Gấu', chance: 0.5, quantity: {min: 1, max: 1}}, {name: 'Móng Vuốt Gấu', chance: 0.3, quantity: {min: 2, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 }, chance: 0.1 } },
        ],
    },
    grassland: {
        descriptionTemplates: [
            'An [adjective] grassland stretches to the horizon. [feature] hills roll gently under the [sky] sky.',
            'You are standing in the middle of an [adjective] prairie. The wind rustles through the [feature] grass like waves.',
        ],
        adjectives: ['lush', 'vast', 'arid', 'windy', 'peaceful'],
        features: ['wildflowers', 'tall grass', 'boulders', 'worn paths', 'herds of animals'],
        sky: ['clear blue', 'cloudy', 'overcast', 'sunset'],
        sounds: ['wind blowing', 'insects chirping', 'distant hooves', 'silence'],
        smells: ['fresh grass', 'wildflowers', 'dry earth', 'animal dung'],
        NPCs: [
            { 
                data: { name: 'Nomad', description: 'A woman with sun-tanned skin, dressed in clothes made from various pieces of leather.', dialogueSeed: 'An experienced traveler who speaks of distant lands and the winds.' },
                conditions: { humanPresence: { min: 4 }, chance: 0.15 } 
            },
            { 
                data: { name: 'Farmer', description: 'A man with calloused hands, looking worriedly at his fields.', dialogueSeed: 'A gentle farmer, always worried about the weather and his crops.' },
                conditions: { humanPresence: { min: 5 }, soilType: ['loamy'], chance: 0.2 } 
            },
        ],
        items: templates_vi.grassland.items,
        structures: templates_vi.grassland.structures,
        enemies: [
            { data: { type: 'Aggressive Rabbit', emoji: '🐇', hp: 20, damage: 5, behavior: 'defensive', size: 'small', diet: ['Hoa Dại', 'Lúa Mì'], satiation: 0, maxSatiation: 4, loot: [{name: 'Thịt Thỏ', chance: 0.6, quantity: {min: 1, max: 2}}, {name: 'Da Thú Nhỏ', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 2, max: 5 }, chance: 0.3 } },
            { data: { type: 'Cunning Fox', emoji: '🦊', hp: 25, damage: 8, behavior: 'territorial', size: 'small', diet: ['Aggressive Rabbit'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cáo', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Mảnh Xương', chance: 0.1, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 3 }, chance: 0.25 } },
            { data: { type: 'Locust Swarm', emoji: '🦗', hp: 35, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Lúa Mì', 'Hoa Dại'], satiation: 0, maxSatiation: 5, loot: [{name: 'Cánh Châu Chấu', chance: 0.7, quantity: {min: 5, max: 10}}] }, conditions: { temperature: { min: 7 }, moisture: { max: 3 }, chance: 0.15 } },
            { data: { type: 'Hyena', emoji: '🐕', hp: 40, damage: 12, behavior: 'aggressive', size: 'medium', diet: ['Aggressive Rabbit', 'Xương Động Vật'], satiation: 0, maxSatiation: 2, loot: [{name: 'Răng Linh Cẩu', chance: 0.3, quantity: {min: 1, max: 3}}, {name: 'Mảnh Xương', chance: 0.15, quantity: {min: 2, max: 4}}] }, conditions: { predatorPresence: { min: 5 }, chance: 0.2 } },
        ],
    },
    desert: {
        descriptionTemplates: [
            'Sand, sand, and more sand. A vast [adjective] desert. The only break in the monotony are the [feature].',
            'The heat of the [adjective] desert is oppressive. You see a [feature] in the distance, perhaps a mirage.',
        ],
        adjectives: ['scorching', 'arid', 'endless', 'silent', 'windswept'],
        features: ['dunes', 'an oasis', 'giant cacti', 'old skeletons', 'stone ruins'],
        sounds: ['wind howling', 'absolute silence', 'a snake hissing', 'sand shifting'],
        smells: ['hot sand', 'nothing', 'ozone', 'dry carcass'],
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
        items: templates_vi.desert.items,
        structures: [],
        enemies: [
            { data: { type: 'Rattlesnake', emoji: '🐍', hp: 30, damage: 15, behavior: 'defensive', size: 'small', diet: ['Aggressive Rabbit'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Rắn', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Trứng Rắn', chance: 0.05, quantity: {min: 2, max: 4}}] }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Giant Scorpion', emoji: '🦂', hp: 50, damage: 10, behavior: 'territorial', size: 'medium', diet: ['Rattlesnake'], satiation: 0, maxSatiation: 2, loot: [{name: 'Đuôi Bọ Cạp', chance: 0.25, quantity: {min: 1, max: 1}}, {name: 'Nọc Bọ Cạp', chance: 0.08, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 7 }, chance: 0.35 } },
            { data: { type: 'Vulture', emoji: '🦅', hp: 25, damage: 8, behavior: 'passive', size: 'medium', diet: ['Xương Động Vật'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lông Kền Kền', chance: 0.6, quantity: {min: 2, max: 5}}, {name: 'Xương Động Vật', chance: 0.15, quantity: {min: 1, max: 1}}] }, conditions: { predatorPresence: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Sand Spirit', emoji: '👻', hp: 60, damage: 12, behavior: 'territorial', size: 'medium', diet: ['Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Cát Ma Thuật', chance: 0.15, quantity: {min: 1, max: 2}}] }, conditions: { magicAffinity: { min: 5 }, chance: 0.1 } },
        ],
    },
    swamp: {
        descriptionTemplates: [
            'You are wading through a [adjective] swamp. The [feature] water is knee-deep.',
            'The air is thick with the smell of decay. [feature] trees rise from the stagnant water.',
        ],
        adjectives: ['stinking', 'gloomy', 'deadly', 'foggy', 'waterlogged'],
        features: ['mangrove', 'vines', 'toxic gas', 'mud bubbles', 'insects'],
        sounds: ['frogs croaking', 'water bubbling', 'mosquitoes buzzing', 'squelching sounds'],
        smells: ['decaying plants', 'mud', 'methane gas', 'rotting flowers'],
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
        items: templates_vi.swamp.items,
        structures: [],
        enemies: [
            { data: { type: 'Giant Leech', emoji: '🩸', hp: 40, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Trứng Bò Sát'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn của Đỉa', chance: 0.5, quantity: {min: 1, max: 2}}] }, conditions: { moisture: { min: 9 }, chance: 0.4 } },
            { data: { type: 'Will-o-Wisp', emoji: '💡', hp: 25, damage: 20, behavior: 'territorial', size: 'small', diet: ['Hoa Tinh Linh'], satiation: 0, maxSatiation: 1, loot: [{name: 'Tinh chất Ma trơi', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { magicAffinity: { min: 7 }, lightLevel: { max: -5 }, chance: 0.2 } },
            { data: { type: 'Alligator', emoji: '🐊', hp: 70, damage: 25, behavior: 'territorial', size: 'large', diet: ['Wild Boar', 'Aggressive Mountain Goat'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cá Sấu', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Răng Cá Sấu', chance: 0.3, quantity: {min: 1, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 8 }, chance: 0.25 } },
            { data: { type: 'Giant Mosquito', emoji: '🦟', hp: 15, damage: 5, behavior: 'aggressive', size: 'small', diet: [], satiation: 0, maxSatiation: 1, loot: [{name: 'Cánh Muỗi', chance: 0.7, quantity: {min: 2, max: 6}}] }, conditions: { chance: 0.5 } },
        ],
    },
    mountain: {
        descriptionTemplates: [
            'You are climbing a [adjective] mountainside. The [feature] wind is strong and chilling.',
            'A treacherous [feature] path leads up the peak. The air thins and the visibility is [visibility].',
        ],
        adjectives: ['treacherous', 'windswept', 'majestic', 'snow-capped', 'barren'],
        features: ['cliffs', 'snowdrifts', 'caves', 'glaciers', 'outcrops'],
        visibility: ['excellent', 'clouded', 'limited'],
        sounds: ['wind howling', 'rockslides', 'eagle cries', 'silence'],
        smells: ['cold air', 'damp rock', 'snow', 'minerals'],
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
        items: templates_vi.mountain.items,
        structures: [
            { 
                data: structureDefinitions['Cửa hầm mỏ bỏ hoang'], 
                loot: [
                    { name: 'Quặng Sắt', chance: 0.3, quantity: { min: 1, max: 2 } }, 
                    { name: 'Chìa Khóa Rỉ Sét', chance: 0.1, quantity: { min: 1, max: 1 } }
                ],
                conditions: { elevation: { min: 5 }, dangerLevel: { min: 6 }, chance: 0.1 } 
            },
        ],
        enemies: [
            { data: { type: 'Aggressive Mountain Goat', emoji: '🐐', hp: 50, damage: 15, behavior: 'defensive', size: 'medium', diet: ['Cây Thuốc Núi', 'Hoa Dại'], satiation: 0, maxSatiation: 3, loot: [{name: 'Sừng Dê Núi', chance: 0.4, quantity: {min: 1, max: 2}}, {name: 'Thịt Dê Núi', chance: 0.7, quantity: {min: 1, max: 2}}] }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
            { data: { type: 'Stone Golem', emoji: '🗿', hp: 80, damage: 10, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt', 'Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lõi Người Đá', chance: 0.1, quantity: {min: 1, max: 1}}, {name: 'Đá Cuội', chance: 0.25, quantity: {min: 2, max: 3}}] }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
            { data: { type: 'Harpy', emoji: '🦅', hp: 45, damage: 18, behavior: 'aggressive', size: 'medium', diet: ['Aggressive Mountain Goat', 'Aggressive Rabbit'], satiation: 0, maxSatiation: 2, loot: [{name: 'Lông Harpie', chance: 0.5, quantity: {min: 3, max: 6}}] }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
            { data: { type: 'Snow Leopard', emoji: '🐆', hp: 60, damage: 20, behavior: 'aggressive', size: 'large', diet: ['Aggressive Mountain Goat'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Báo Tuyết', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Thịt Báo Tuyết', chance: 0.6, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
        ],
    },
    cave: {
        descriptionTemplates: [
            'Inside the [adjective] and damp cave. The sound of your footsteps echoes among the [feature].',
            'The [feature] formations glitter in the faint light filtering from outside. The air smells of [smell].',
        ],
        adjectives: ['deep', 'cold', 'mysterious', 'labyrinthine', 'pitch-black'],
        features: ['stalactites', 'crystals', 'an underground river', 'ancient drawings', 'cobwebs'],
        smells: ['damp earth', 'stagnant water', 'minerals', 'sulfur'],
        sounds: ['dripping water', 'echoes', 'bat squeaks', 'heavy silence'],
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
        items: templates_vi.cave.items,
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
    },
    jungle: {
        descriptionTemplates: [
            'You are in the middle of a [adjective] jungle. The [feature] canopy is so dense that sunlight can barely penetrate. The sound of [sound] echoes everywhere.',
            'The air is [adjective] and humid. Trees and [feature] vines grow profusely, forming a green maze. The smell of [smell] is strong in the air.'
        ],
        adjectives: ['primeval', 'tropical', 'suffocating', 'mysterious', 'vibrant'],
        features: ['giant trees', 'vines', 'strange flowers', 'hidden waterfalls', 'ancient ruins'],
        smells: ['rotting flowers', 'damp earth', 'animal musk', 'ripe fruit'],
        sounds: ['parrots squawking', 'monkeys howling', 'insects chirping', 'running water'],
        NPCs: [
            { 
                data: { name: 'Tribal Shaman', description: 'An old man with a strangely painted face, wearing many amulets.', dialogueSeed: 'A wise and mysterious person who speaks of spirits and ancient prophecies.' },
                conditions: { humanPresence: { min: 3 }, magicAffinity: { min: 5 }, chance: 0.1 } 
            },
            { 
                data: { name: 'Botanist', description: 'A scientist with thick glasses, carefully taking notes in a notebook.', dialogueSeed: 'An enthusiast who excitedly talks about rare plants and their properties.' },
                conditions: { humanPresence: { min: 1, max: 3 }, vegetationDensity: { min: 9 }, chance: 0.15 } 
            }
        ],
        items: templates_vi.jungle.items,
        structures: [],
        enemies: [
            { data: { type: 'Giant Python', emoji: '🐍', hp: 90, damage: 18, behavior: 'territorial', size: 'large', diet: ['Gorilla'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Da Rắn', chance: 0.8, quantity: { min: 2, max: 3 } }] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 7 }, chance: 0.2 } },
            { data: { type: 'Jaguar', emoji: '🐆', hp: 70, damage: 22, behavior: 'aggressive', size: 'large', diet: ['Gorilla'], satiation: 0, maxSatiation: 2, loot: [{ name: 'Da Báo Tuyết', chance: 0.5, quantity: { min: 1, max: 1 } }, { name: 'Nanh Sói', chance: 0.3, quantity: { min: 2, max: 4 } }] }, conditions: { predatorPresence: { min: 9 }, chance: 0.25 } },
            { data: { type: 'Gorilla', emoji: '🦍', hp: 80, damage: 20, behavior: 'defensive', size: 'large', diet: ['Quả Lạ', 'Hoa ăn thịt'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Da Gấu', chance: 0.3, quantity: { min: 1, max: 1 } }] }, conditions: { vegetationDensity: { min: 8 }, chance: 0.3 } }
        ]
    },
    volcanic: {
        descriptionTemplates: [
            'The ground is [adjective] and cracked under your feet. The air is thick with the smell of [smell]. In the distance, a [feature] erupts with columns of black smoke.',
            'The landscape here is [adjective]. Cooled [feature] flows form bizarre shapes. Occasionally, you feel the ground tremble slightly.'
        ],
        adjectives: ['desolate', 'scorching', 'fearsome', 'ash-covered'],
        features: ['lava flows', 'fissures', 'basalt columns', 'acid pools'],
        smells: ['sulfur', 'burning rock', 'molten metal', 'toxic fumes'],
        sounds: ['bubbling lava', 'cracking rock', 'the roar of the volcano', 'deathly silence'],
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
        items: templates_vi.volcanic.items,
        structures: [
            { data: structureDefinitions['Mạch nước phun'], conditions: { temperature: { min: 7 }, chance: 0.15 } },
        ],
        enemies: [
            { data: { type: 'Fire Salamander', emoji: '🦎', hp: 50, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Lưu huỳnh'], satiation: 0, maxSatiation: 3, loot: [{ name: 'Da Rắn', chance: 0.5, quantity: { min: 1, max: 2 } }] }, conditions: { temperature: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Lava Golem', emoji: '🔥', hp: 120, damage: 25, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Trái tim Magma', chance: 0.1, quantity: { min: 1, max: 1 } }, { name: 'Đá Obsidian', chance: 0.3, quantity: { min: 2, max: 5 } }] }, conditions: { dangerLevel: { min: 9 }, chance: 0.25 } },
            { data: { type: 'Young Fire Dragon', emoji: '🐉', hp: 150, damage: 30, behavior: 'aggressive', size: 'large', diet: ['Lava Golem'], satiation: 0, maxSatiation: 1, loot: [{ name: 'Vảy Rồng', chance: 0.2, quantity: { min: 3, max: 6 } }, { name: 'Răng Rồng', chance: 0.1, quantity: { min: 1, max: 2 } }] }, conditions: { predatorPresence: { min: 10 }, dangerLevel: { min: 10 }, chance: 0.1 } }
        ]
    },
    wall: {
        descriptionTemplates: ['An impassable rock wall blocks the way.'],
        adjectives: [], features: [], smells: [], sounds: [],
        NPCs: [], items: [], structures: [], enemies: []
    },
};

export const getTemplates = (lang: Language): Record<Terrain, any> => {
  if (lang === 'vi') {
    return templates_vi;
  }
  return templates_en;
};
