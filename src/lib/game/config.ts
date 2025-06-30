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
    // --- VẬT PHẨM CHẾ TẠO CƠ BẢN ---
    'Sỏi': {
        description: 'Những viên sỏi nhỏ, có thể dùng để ném hoặc làm vật liệu cơ bản.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 3, max: 8 }
    },
    'Đá Cuội': {
        description: 'Một hòn đá cuội vừa tay, cứng và nặng.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Đất Sét': {
        description: 'Một khối đất sét dẻo, có thể dùng để nặn hình hoặc xây dựng.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cát Thường': {
        description: 'Một nắm cát khô, lọt qua kẽ tay.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 2, max: 6 }
    },
    'Mảnh Xương': {
        description: 'Một mảnh xương không rõ của sinh vật nào.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Dây Gai': {
        description: 'Một đoạn dây leo có gai sắc, rất bền.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Thú Nhỏ': {
        description: 'Một tấm da nhỏ từ một con thú không xác định.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Vải Rách': {
        description: 'Một miếng vải cũ đã rách, có thể dùng để băng bó tạm thời.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lõi Gỗ': {
        description: 'Phần lõi cứng nhất của một cành cây.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Mài': {
        description: 'Một viên đá nhám, dùng để mài sắc công cụ.',
        tier: 2,
        category: 'Tool',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bột Xương': {
        description: 'Xương được nghiền mịn, có thể dùng trong giả kim thuật.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Chìa Khóa Rỉ Sét': {
        description: 'Một chiếc chìa khóa cũ kỹ, không rõ nó mở được ổ khóa nào.',
        tier: 2,
        category: 'Data',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- VẬT PHẨM CHẾ TẠO ĐƯỢC ---
    'Rìu Đá Đơn Giản': {
        description: 'Một chiếc rìu đá thô sơ, hữu ích để chặt cây hoặc chiến đấu.',
        tier: 1,
        category: 'Tool',
        effects: [],
        baseQuantity: { min: 1, max: 1 } 
    },
    'Thuốc Máu Yếu': {
        description: 'Một loại thuốc pha chế đơn giản, giúp phục hồi một lượng máu nhỏ.',
        tier: 1,
        category: 'Support',
        effects: [{ type: 'HEAL', amount: 35 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bó Đuốc': {
        description: 'Một bó đuốc tạm bợ, tỏa ra ánh sáng và hơi ấm.',
        tier: 1,
        category: 'Tool',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- VẬT PHẨM TỪ SINH VẬT ---
    'Nanh Sói': {
        description: 'Một chiếc nanh sắc nhọn, chiến lợi phẩm từ một con sói.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Sói Sống': {
        description: 'Miếng thịt tươi nhưng còn sống, cần nấu chín để ăn an toàn.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tơ Nhện Khổng Lồ': {
        description: 'Những sợi tơ cực kỳ bền chắc và dính, lấy từ một con nhện khổng lồ.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Mắt Nhện': {
        description: 'Một con mắt đa diện, vẫn còn nhìn chằm chằm một cách đáng sợ.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 2, max: 8 }
    },
    'Da Heo Rừng': {
        description: 'Một tấm da dày và cứng, phủ đầy lông cứng như lông bàn chải.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Heo Rừng': {
        description: 'Một tảng thịt lớn, giàu năng lượng nhưng cần được chế biến.',
        tier: 2,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tai Yêu Tinh': {
        description: 'Một chiếc tai nhọn hoắt, được cắt một cách thô bạo. Thường được dùng làm bằng chứng.',
        tier: 2,
        category: 'Data',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Móng Vuốt Gấu': {
        description: 'Một chiếc móng vuốt to và sắc, có thể xé toạc cả kim loại.',
        tier: 4,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Da Gấu': {
        description: 'Một tấm da gấu dày và ấm, là vật liệu tuyệt vời cho áo giáp mùa đông.',
        tier: 4,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Thỏ': {
        description: 'Thịt từ một con thỏ hoang, nhỏ nhưng ngon.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Da Cáo': {
        description: 'Một tấm da cáo mềm mại và mượt mà.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cánh Châu Chấu': {
        description: 'Cánh của một con châu chấu, mỏng như giấy nhưng rất dai.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 5, max: 10 }
    },
    'Răng Linh Cẩu': {
        description: 'Một chiếc răng chắc khỏe, có khả năng nghiền nát xương.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Rắn': {
        description: 'Da của một con rắn đuôi chuông, có hoa văn đẹp mắt.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Rắn': {
        description: 'Một quả trứng rắn có vỏ dai.',
        tier: 2,
        category: 'Food',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Đuôi Bọ Cạp': {
        description: 'Chiếc đuôi của một con bọ cạp khổng lồ, ngòi độc đã bị loại bỏ.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Kền Kền': {
        description: 'Một chiếc lông vũ đen và bẩn thỉu.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Cát Ma Thuật': {
        description: 'Những hạt cát lấp lánh năng lượng ma thuật, tàn dư của một linh hồn cát.',
        tier: 4,
        category: 'Magic',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Chất nhờn của Đỉa': {
        description: 'Một chất lỏng nhớt và có khả năng chống đông máu.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tinh chất Ma trơi': {
        description: 'Một quả cầu ánh sáng yếu ớt, ấm áp khi chạm vào.',
        tier: 4,
        category: 'Magic',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Da Cá Sấu': {
        description: 'Một tấm da cực kỳ cứng và bền, gần như không thể xuyên thủng.',
        tier: 4,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Răng Cá Sấu': {
        description: 'Một chiếc răng hình nón, sắc như dao găm.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Cánh Muỗi': {
        description: 'Cánh của một con muỗi khổng lồ, trong suốt và mỏng manh.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 2, max: 6 }
    },
    'Sừng Dê Núi': {
        description: 'Một cặp sừng xoắn và cứng, có thể dùng làm vũ khí hoặc trang trí.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Dê Núi': {
        description: 'Thịt dê hơi dai nhưng rất bổ dưỡng.',
        tier: 2,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lõi Người Đá': {
        description: 'Một hòn đá phát ra năng lượng sống yếu ớt, trái tim của một Stone Golem.',
        tier: 5,
        category: 'Energy Source',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Harpie': {
        description: 'Một chiếc lông vũ dài và sắc, dính máu.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 3, max: 6 }
    },
    'Da Báo Tuyết': {
        description: 'Một tấm da báo có hoa văn tuyệt đẹp, giữ ấm cực tốt.',
        tier: 4,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Báo Tuyết': {
        description: 'Thịt của một kẻ săn mồi đỉnh cao, chứa đầy năng lượng.',
        tier: 3,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 40 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cánh Dơi': {
        description: 'Một chiếc cánh dơi bằng da, dùng để chế tạo các vật phẩm bay lượn.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Độc Nhện Hang': {
        description: 'Một túi nọc độc đặc quánh, có khả năng làm tê liệt con mồi.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Chất nhờn Slime': {
        description: 'Một khối chất nhờn co giãn, có tính axit nhẹ.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Răng Sâu Bò': {
        description: 'Một chiếc răng khổng lồ, cứng như kim cương.',
        tier: 5,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - RỪNG ---
    'Quả Mọng Ăn Được': {
        description: 'Một loại quả mọng đỏ, có vẻ ngon miệng và an toàn, giúp phục hồi chút thể lực.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 2, max: 6 },
        growthConditions: {
            optimal: { moisture: { min: 5 }, vegetationDensity: { min: 7 } },
            subOptimal: { moisture: { min: 3, max: 4 } }
        }
    },
    'Nấm Độc': {
        description: 'Một loại nấm có màu sắc sặc sỡ, tốt nhất không nên ăn.',
        tier: 2,
        category: 'Material',
        effects: [], // No positive effects
        baseQuantity: { min: 1, max: 3 },
        growthConditions: {
            optimal: { moisture: { min: 7, max: 10 }, lightLevel: { max: -2 } },
            subOptimal: { moisture: { min: 5, max: 6 }, lightLevel: { min: -1, max: 1 } }
        }
    },
    'Thảo Dược Chữa Lành': {
        description: 'Một loại lá cây có mùi thơm dễ chịu, có khả năng chữa lành vết thương nhỏ.',
        tier: 2,
        category: 'Support',
        effects: [{ type: 'HEAL', amount: 20 }],
        baseQuantity: { min: 1, max: 2 },
        growthConditions: {
            optimal: { moisture: { min: 6, max: 8 }, temperature: { min: 5, max: 8 }, lightLevel: { min: 2, max: 6 } },
            subOptimal: { moisture: { min: 4, max: 5 }, temperature: { min: 3, max: 4 } }
        }
    },
    'Cành Cây Chắc Chắn': {
        description: 'Một cành cây thẳng và cứng, có thể dùng làm vũ khí tạm thời.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mũi Tên Cũ': {
        description: 'Một mũi tên có vẻ đã được sử dụng, cắm trên một thân cây.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Tinh Linh': {
        description: 'Một bông hoa phát ra ánh sáng xanh lam yếu ớt, tỏa ra năng lượng phép thuật.',
        tier: 4,
        category: 'Magic',
        effects: [], // Would be 'RESTORE_MANA' if mana existed
        baseQuantity: { min: 1, max: 1 },
        growthConditions: {
            optimal: { magicAffinity: { min: 7 } },
            subOptimal: { magicAffinity: { min: 5, max: 6 } }
        }
    },
     'Rễ Cây Hiếm': {
        description: 'Một loại rễ cây chỉ mọc ở vùng nước độc, có giá trị cao trong giả kim thuật.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Vỏ Cây Cổ Thụ': {
        description: 'Một miếng vỏ cây cứng như đá từ một cây cổ thụ, có đặc tính phòng thủ.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nhựa Cây Dính': {
        description: 'Một cục nhựa cây dính, có thể dùng để bẫy hoặc chế tạo.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mật Ong Hoang': {
        description: 'Mật ong vàng óng từ một tổ ong hoang, vừa ngọt ngào vừa bổ dưỡng.',
        tier: 2,
        category: 'Food',
        effects: [{ type: 'HEAL', amount: 10 }, { type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rêu Xanh': {
        description: 'Một mảng rêu mềm mại mọc trên đá, dùng để ngụy trang hoặc làm thuốc.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cỏ Ba Lá': {
        description: 'Một cây cỏ ba lá. Người ta nói nó mang lại may mắn, nhưng có lẽ chỉ là lời đồn.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tổ Chim Rỗng': {
        description: 'Một chiếc tổ chim được đan khéo léo nhưng đã bị bỏ trống.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },


    // --- TÀI NGUYÊN BIOME - ĐỒNG CỎ ---
    'Hoa Dại': {
        description: 'Một bông hoa đẹp, có thể có giá trị với một nhà thảo dược học.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 3, max: 8 }
    },
    'Lúa Mì': {
        description: 'Một bó lúa mì chín vàng, có thể dùng làm thức ăn.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Lông Chim Ưng': {
        description: 'Một chiếc lông vũ sắc bén từ một loài chim săn mồi.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Lửa': {
        description: 'Hai hòn đá lửa, có thể dùng để nhóm lửa.',
        tier: 1,
        category: 'Tool',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Chim Hoang': {
        description: 'Một quả trứng chim hoang, giàu dinh dưỡng.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Rễ Củ Ăn Được': {
        description: 'Một loại củ có nhiều tinh bột, có thể ăn để phục hồi năng lượng.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Hạt Giống Hoa Dại': {
        description: 'Những hạt giống nhỏ li ti, có thể gieo trồng để mọc ra những bông hoa đẹp.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 5, max: 10 }
    },
    'Nấm Mỡ': {
        description: 'Một cây nấm phổ biến, ăn được và giúp phục hồi chút thể lực.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Cỏ Khô': {
        description: 'Cỏ đã được phơi khô, là thức ăn ưa thích của các loài ăn cỏ.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },

    // --- TÀI NGUYÊN BIOME - SA MẠC ---
    'Bình Nước Cũ': {
        description: 'Một bình nước quý giá, gần như còn đầy.',
        tier: 1,
        category: 'Support',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Gốm Cổ': {
        description: 'Một mảnh gốm vỡ có hoa văn kỳ lạ, có thể là của một nền văn minh đã mất.',
        tier: 2,
        category: 'Data',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Xương Rồng': {
        description: 'Một bông hoa hiếm hoi nở trên sa mạc, chứa đầy nước giúp phục hồi thể lực.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Xương Động Vật': {
        description: 'Một bộ xương lớn bị tẩy trắng bởi ánh mặt trời.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Sa Thạch': {
        description: 'Một phiến đá sa thạch mềm, có thể được khắc hoặc dùng làm công cụ mài.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Bọ Cạp': {
        description: 'Một chiếc ngòi chứa đầy nọc độc chết người. Cực kỳ nguy hiểm.',
        tier: 4,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cây Xương Rồng Nhỏ': {
        description: 'Một cây xương rồng nhỏ, có thể ép lấy nước.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 3 },
        growthConditions: {
            optimal: { temperature: { min: 8 }, moisture: { max: 1 } },
            subOptimal: { temperature: { min: 6, max: 7 }, moisture: { min: 2, max: 3 } }
        }
    },
    'Thủy tinh sa mạc': {
        description: 'Một mảnh thủy tinh tự nhiên được tạo ra khi sét đánh vào cát.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - ĐẦM LẦY ---
    'Rêu Phát Sáng': {
        description: 'Một loại rêu có thể dùng để đánh dấu đường đi hoặc làm thuốc.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 4 },
        growthConditions: {
            optimal: { moisture: { min: 8 }, lightLevel: { max: -5 } },
            subOptimal: { moisture: { min: 6, max: 7 }, lightLevel: { min: -4, max: -2 } }
        }
    },
    'Trứng Bò Sát': {
        description: 'Một ổ trứng lạ, có lớp vỏ dai và dày.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Nấm Đầm Lầy': {
        description: 'Một loại nấm ăn được nhưng có vị hơi tanh.',
        tier: 1,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Cây Sậy': {
        description: 'Thân cây sậy dài và rỗng, có thể dùng làm ống thổi hoặc chế tạo.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 3, max: 7 }
    },
    'Hoa Độc': {
        description: 'Một bông hoa có màu sắc quyến rũ nhưng lại chứa độc tố.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nước Bùn': {
        description: 'Một chai nước bùn đặc quánh, có thể chứa các vi sinh vật lạ.',
        tier: 1,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - NÚI ---
    'Quặng Sắt': {
        description: 'Một mỏm đá chứa quặng sắt có thể rèn thành vũ khí.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Lông Đại Bàng': {
        description: 'Một chiếc lông vũ lớn và đẹp, rơi ra từ một sinh vật bay lượn trên đỉnh núi.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Pha Lê Núi': {
        description: 'Một tinh thể trong suốt, lạnh toát khi chạm vào.',
        tier: 4,
        category: 'Magic',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Thuốc Núi': {
        description: 'Một loại thảo dược quý hiếm chỉ mọc ở nơi cao, có tác dụng chữa bệnh.',
        tier: 3,
        category: 'Support',
        effects: [{ type: 'HEAL', amount: 50 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Griffon': {
        description: 'Một quả trứng lớn, có vỏ cứng như đá. Vô cùng quý hiếm.',
        tier: 6,
        category: 'Data',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Vỏ Chai': {
        description: 'Một mảnh đá vỏ chai sắc như dao cạo, được hình thành từ dung nham nguội lạnh.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Granit': {
        description: 'Một khối đá granit cứng, vật liệu xây dựng tuyệt vời.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Địa Y': {
        description: 'Một loại địa y bám trên đá, có thể dùng làm thuốc nhuộm hoặc thuốc chữa bệnh.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Trứng Đại Bàng': {
        description: 'Một quả trứng lớn từ tổ của đại bàng núi.',
        tier: 3,
        category: 'Food',
        effects: [{ type: 'RESTORE_STAMINA', amount: 50 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tuyết': {
        description: 'Một nắm tuyết sạch, có thể làm tan ra để lấy nước.',
        tier: 1,
        category: 'Support',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 3 }
    },

    // --- TÀI NGUYÊN BIOME - HANG ĐỘNG ---
     'Mảnh Tinh Thể': {
        description: 'Một mảnh tinh thể phát ra ánh sáng yếu ớt, có thể soi đường.',
        tier: 2,
        category: 'Magic',
        effects: [],
        baseQuantity: { min: 2, max: 7 }
    },
    'Bản Đồ Cổ': {
        description: 'Một tấm bản đồ da cũ kỹ, có vẻ chỉ đường đến một nơi bí mật trong hang.',
        tier: 3,
        category: 'Data',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Xương Cổ': {
        description: 'Một bộ xương của một sinh vật lạ chưa từng thấy.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mỏ Vàng': {
        description: 'Những vệt vàng lấp lánh trên vách đá.',
        tier: 5,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nấm Phát Quang': {
        description: 'Một loại nấm phát ra ánh sáng dịu nhẹ, có thể ăn để tăng cường thị lực trong bóng tối.',
        tier: 3,
        category: 'Material',
        effects: [], // Special effect would require new logic, so no effect for now.
        baseQuantity: { min: 2, max: 5 },
        growthConditions: {
            optimal: { lightLevel: { max: -6 }, moisture: { min: 7 } },
            subOptimal: { lightLevel: { min: -5, max: -3 } }
        }
    },
    'Túi Trứng Nhện': {
        description: 'Một bọc trứng nhện tơ, cảm giác có gì đó đang ngọ nguậy bên trong.',
        tier: 3,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nước Ngầm': {
        description: 'Nước trong vắt và mát lạnh chảy từ một kẽ đá.',
        tier: 1,
        category: 'Support',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Vôi': {
        description: 'Một loại đá trầm tích mềm hơn granit, dễ dàng chế tác.',
        tier: 2,
        category: 'Material',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Guano (Phân dơi)': {
        description: 'Một đống phân dơi giàu nitrat, là một loại phân bón tuyệt vời.',
        tier: 1,
        category: 'Material',
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
            { name: 'Nanh Sói', conditions: { predatorPresence: { min: 6 }, chance: 0.15 } },
            { name: 'Thịt Sói Sống', conditions: { predatorPresence: { min: 6 }, chance: 0.1 } },
            { name: 'Tơ Nhện Khổng Lồ', conditions: { dangerLevel: { min: 6 }, chance: 0.2 } },
            { name: 'Mắt Nhện', conditions: { dangerLevel: { min: 6 }, chance: 0.1 } },
            { name: 'Da Heo Rừng', conditions: { predatorPresence: { min: 4 }, chance: 0.1 } },
            { name: 'Tai Yêu Tinh', conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.1 } },
            { name: 'Móng Vuốt Gấu', conditions: { predatorPresence: { min: 8 }, chance: 0.05 } },
            { name: 'Mật Ong Hoang', conditions: { vegetationDensity: { min: 6 }, chance: 0.1 } },
            { name: 'Sỏi', conditions: { chance: 0.3 } },
            { name: 'Tổ Chim Rỗng', conditions: { chance: 0.1 } },
            { name: 'Dây Gai', conditions: { vegetationDensity: { min: 5 }, chance: 0.2 } },
        ],
        enemies: [
            { data: { type: 'Sói', hp: 30, damage: 10, behavior: 'aggressive', diet: ['Heo Rừng', 'Thỏ hoang hung dữ'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 5 }, chance: 0.4 } },
            { data: { type: 'Nhện khổng lồ', hp: 40, damage: 15, behavior: 'aggressive', diet: ['Heo Rừng', 'Yêu Tinh Rừng'], maxSatiation: 2 }, conditions: { vegetationDensity: { min: 8 }, dangerLevel: { min: 6 }, chance: 0.3 } },
            { data: { type: 'Heo Rừng', hp: 50, damage: 8, behavior: 'aggressive', diet: ['Quả Mọng Ăn Được', 'Rễ Cây Hiếm'], maxSatiation: 3 }, conditions: { predatorPresence: { min: 4 }, chance: 0.3 } },
            { data: { type: 'Yêu Tinh Rừng', hp: 25, damage: 8, behavior: 'aggressive', diet: ['Thỏ hoang hung dữ', 'Nấm Độc'], maxSatiation: 3 }, conditions: { dangerLevel: { min: 5 }, humanPresence: { min: 1 }, chance: 0.25 } },
            { data: { type: 'Gấu', hp: 80, damage: 20, behavior: 'aggressive', diet: ['Heo Rừng', 'Cá sấu'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 8 }, dangerLevel: { min: 7 }, chance: 0.1 } },
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
            { name: 'Thịt Thỏ', conditions: { dangerLevel: { min: 2, max: 5 }, chance: 0.2 } },
            { name: 'Da Cáo', conditions: { predatorPresence: { min: 3 }, chance: 0.1 } },
            { name: 'Cánh Châu Chấu', conditions: { temperature: { min: 7 }, chance: 0.1 } },
            { name: 'Răng Linh Cẩu', conditions: { predatorPresence: { min: 5 }, chance: 0.1 } },
            { name: 'Đất Sét', conditions: { moisture: { min: 4 }, chance: 0.15 } },
            { name: 'Cỏ Khô', conditions: { moisture: { max: 3 }, chance: 0.3 } },
            { name: 'Hạt Giống Hoa Dại', conditions: { chance: 0.2 } },
            { name: 'Mảnh Vải Rách', conditions: { humanPresence: { min: 3 }, chance: 0.1 } },
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
            { name: 'Nọc Bọ Cạp', conditions: { predatorPresence: { min: 7 }, chance: 0.1 } },
            { name: 'Da Rắn', conditions: { temperature: { min: 8 }, chance: 0.1 } },
            { name: 'Đuôi Bọ Cạp', conditions: { dangerLevel: { min: 7 }, chance: 0.1 } },
            { name: 'Lông Kền Kền', conditions: { predatorPresence: { min: 6 }, chance: 0.15 } },
            { name: 'Cát Ma Thuật', conditions: { magicAffinity: { min: 5 }, chance: 0.05 } },
            { name: 'Cát Thường', conditions: { chance: 0.4 } },
            { name: 'Thủy tinh sa mạc', conditions: { magicAffinity: { min: 4 }, chance: 0.05 } },
            { name: 'Chìa Khóa Rỉ Sét', conditions: { humanPresence: { min: 2 }, chance: 0.05 } },
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
            { name: 'Chất nhờn của Đỉa', conditions: { moisture: { min: 9 }, chance: 0.15 } },
            { name: 'Tinh chất Ma trơi', conditions: { magicAffinity: { min: 7 }, chance: 0.1 } },
            { name: 'Da Cá Sấu', conditions: { predatorPresence: { min: 8 }, chance: 0.1 } },
            { name: 'Cánh Muỗi', conditions: { chance: 0.2 } },
            { name: 'Nước Bùn', conditions: { chance: 0.3 } },
            { name: 'Hoa Độc', conditions: { vegetationDensity: { min: 6 }, chance: 0.15 } },
            { name: 'Cây Sậy', conditions: { moisture: { min: 7 }, chance: 0.2 } },
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
            { name: 'Sừng Dê Núi', conditions: { elevation: { min: 7 }, chance: 0.15 } },
            { name: 'Lõi Người Đá', conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.05 } },
            { name: 'Lông Harpie', conditions: { elevation: { min: 9 }, chance: 0.1 } },
            { name: 'Da Báo Tuyết', conditions: { temperature: { max: 3 }, chance: 0.05 } },
            { name: 'Đá Granit', conditions: { chance: 0.2 } },
            { name: 'Tuyết', conditions: { temperature: { max: 2 }, chance: 0.4 } },
            { name: 'Cây Địa Y', conditions: { moisture: { min: 4 }, chance: 0.1 } },
            { name: 'Trứng Đại Bàng', conditions: { elevation: { min: 8 }, chance: 0.1 } },
        ],
        enemies: [
            { data: { type: 'Dê núi hung hãn', hp: 50, damage: 15, behavior: 'aggressive', diet: ['Cây Thuốc Núi', 'Hoa Dại'], maxSatiation: 3 }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
            { data: { type: 'Người đá', hp: 80, damage: 10, behavior: 'aggressive', diet: ['Quặng Sắt', 'Pha Lê Núi'], maxSatiation: 1 }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
            { data: { type: 'Harpie', hp: 45, damage: 18, behavior: 'aggressive', diet: ['Dê núi hung hãn', 'Thỏ hoang hung dữ'], maxSatiation: 2 }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
            { data: { type: 'Báo tuyết', hp: 60, damage: 20, behavior: 'aggressive', diet: ['Dê núi hung hãn'], maxSatiation: 2 }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
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
            { name: 'Cánh Dơi', conditions: { chance: 0.2 } },
            { name: 'Nọc Độc Nhện Hang', conditions: { dangerLevel: { min: 8 }, chance: 0.1 } },
            { name: 'Chất nhờn Slime', conditions: { moisture: { min: 8 }, chance: 0.15 } },
            { name: 'Răng Sâu Bò', conditions: { dangerLevel: { min: 9 }, chance: 0.05 } },
            { name: 'Nước Ngầm', conditions: { moisture: { min: 7 }, chance: 0.2 } },
            { name: 'Guano (Phân dơi)', conditions: { chance: 0.15 } },
            { name: 'Đá Vôi', conditions: { chance: 0.2 } },
            { name: 'Mảnh Xương', conditions: { chance: 0.3 } },
        ],
        enemies: [
            { data: { type: 'Dơi khổng lồ', hp: 25, damage: 10, behavior: 'aggressive', diet: ['Nhện hang'], maxSatiation: 2 }, conditions: { lightLevel: { max: -2 }, chance: 0.5 } },
            { data: { type: 'Nhện hang', hp: 45, damage: 15, behavior: 'aggressive', diet: ['Dơi khổng lồ'], maxSatiation: 2 }, conditions: { dangerLevel: { min: 8 }, chance: 0.4 } },
            { data: { type: 'Slime', hp: 30, damage: 8, behavior: 'passive', diet: ['Mảnh Tinh Thể', 'Rêu Phát Sáng'], maxSatiation: 3 }, conditions: { moisture: { min: 8 }, chance: 0.3 } },
            { data: { type: 'Sâu Bò Khổng Lồ', hp: 100, damage: 20, behavior: 'aggressive', diet: ['Người đá'], maxSatiation: 1 }, conditions: { dangerLevel: { min: 9 }, chance: 0.15 } },
        ],
    },
};
