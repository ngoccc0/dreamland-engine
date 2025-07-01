import type { ItemDefinition } from "./types";

// --- CENTRAL ITEM CATALOG ---
export const itemDefinitions: Record<string, ItemDefinition> = {
    // --- VẬT PHẨM CHẾ TẠO CƠ BẢN ---
    'Sỏi': {
        description: 'Những viên sỏi nhỏ, có thể dùng để ném hoặc làm vật liệu cơ bản.',
        tier: 1,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 3, max: 8 }
    },
    'Đá Cuội': {
        description: 'Một hòn đá cuội vừa tay, cứng và nặng.',
        tier: 1,
        category: 'Material',
        emoji: '🗿',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Đất Sét': {
        description: 'Một khối đất sét dẻo, có thể dùng để nặn hình hoặc xây dựng.',
        tier: 1,
        category: 'Material',
        emoji: '🧱',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cát Thường': {
        description: 'Một nắm cát khô, lọt qua kẽ tay.',
        tier: 1,
        category: 'Material',
        emoji: '⏳',
        effects: [],
        baseQuantity: { min: 2, max: 6 }
    },
    'Mảnh Xương': {
        description: 'Một mảnh xương không rõ của sinh vật nào.',
        tier: 1,
        category: 'Material',
        emoji: '🦴',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Dây Gai': {
        description: 'Một đoạn dây leo có gai sắc, rất bền.',
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Thú Nhỏ': {
        description: 'Một tấm da nhỏ từ một con thú không xác định.',
        tier: 1,
        category: 'Material',
        emoji: '🩹',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Vải Rách': {
        description: 'Một miếng vải cũ đã rách, có thể dùng để băng bó tạm thời.',
        tier: 1,
        category: 'Material',
        emoji: ' rags ',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lõi Gỗ': {
        description: 'Phần lõi cứng nhất của một cành cây.',
        tier: 2,
        category: 'Material',
        emoji: '🪵',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Mài': {
        description: 'Một viên đá nhám, dùng để mài sắc công cụ.',
        tier: 2,
        category: 'Tool',
        emoji: '🔪',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bột Xương': {
        description: 'Xương được nghiền mịn, có thể dùng trong giả kim thuật.',
        tier: 2,
        category: 'Material',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Chìa Khóa Rỉ Sét': {
        description: 'Một chiếc chìa khóa cũ kỹ, không rõ nó mở được ổ khóa nào.',
        tier: 2,
        category: 'Data',
        emoji: '🗝️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- VẬT PHẨM CHẾ TẠO ĐƯỢC ---
    'Rìu Đá Đơn Giản': {
        description: 'Một chiếc rìu đá thô sơ, hữu ích để chặt cây hoặc chiến đấu.',
        tier: 1,
        category: 'Tool',
        emoji: '🪓',
        effects: [],
        baseQuantity: { min: 1, max: 1 } 
    },
    'Thuốc Máu Yếu': {
        description: 'Một loại thuốc pha chế đơn giản, giúp phục hồi một lượng máu nhỏ.',
        tier: 1,
        category: 'Support',
        emoji: '🧪',
        effects: [{ type: 'HEAL', amount: 35 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Bó Đuốc': {
        description: 'Một bó đuốc tạm bợ, tỏa ra ánh sáng và hơi ấm.',
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- VẬT PHẨM TỪ SINH VẬT ---
    'Nanh Sói': {
        description: 'Một chiếc nanh sắc nhọn, chiến lợi phẩm từ một con sói.',
        tier: 2,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Sói Sống': {
        description: 'Miếng thịt tươi nhưng còn sống, cần nấu chín để ăn an toàn.',
        tier: 1,
        category: 'Food',
        emoji: '🥩',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tơ Nhện Khổng Lồ': {
        description: 'Những sợi tơ cực kỳ bền chắc và dính, lấy từ một con nhện khổng lồ.',
        tier: 2,
        category: 'Material',
        emoji: '🕸️',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Mắt Nhện': {
        description: 'Một con mắt đa diện, vẫn còn nhìn chằm chằm một cách đáng sợ.',
        tier: 2,
        category: 'Material',
        emoji: '👁️',
        effects: [],
        baseQuantity: { min: 2, max: 8 }
    },
    'Da Heo Rừng': {
        description: 'Một tấm da dày và cứng, phủ đầy lông cứng như lông bàn chải.',
        tier: 2,
        category: 'Material',
        emoji: '🐗',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Heo Rừng': {
        description: 'Một tảng thịt lớn, giàu năng lượng nhưng cần được chế biến.',
        tier: 2,
        category: 'Food',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tai Yêu Tinh': {
        description: 'Một chiếc tai nhọn hoắt, được cắt một cách thô bạo. Thường được dùng làm bằng chứng.',
        tier: 2,
        category: 'Data',
        emoji: '👂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Móng Vuốt Gấu': {
        description: 'Một chiếc móng vuốt to và sắc, có thể xé toạc cả kim loại.',
        tier: 4,
        category: 'Material',
        emoji: '🐾',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Da Gấu': {
        description: 'Một tấm da gấu dày và ấm, là vật liệu tuyệt vời cho áo giáp mùa đông.',
        tier: 4,
        category: 'Material',
        emoji: '🐻',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Thỏ': {
        description: 'Thịt từ một con thỏ hoang, nhỏ nhưng ngon.',
        tier: 1,
        category: 'Food',
        emoji: '🐰',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Da Cáo': {
        description: 'Một tấm da cáo mềm mại và mượt mà.',
        tier: 2,
        category: 'Material',
        emoji: '🦊',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cánh Châu Chấu': {
        description: 'Cánh của một con châu chấu, mỏng như giấy nhưng rất dai.',
        tier: 1,
        category: 'Material',
        emoji: '🦗',
        effects: [],
        baseQuantity: { min: 5, max: 10 }
    },
    'Răng Linh Cẩu': {
        description: 'Một chiếc răng chắc khỏe, có khả năng nghiền nát xương.',
        tier: 2,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Da Rắn': {
        description: 'Da của một con rắn đuôi chuông, có hoa văn đẹp mắt.',
        tier: 2,
        category: 'Material',
        emoji: '🐍',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Rắn': {
        description: 'Một quả trứng rắn có vỏ dai.',
        tier: 2,
        category: 'Food',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Đuôi Bọ Cạp': {
        description: 'Chiếc đuôi của một con bọ cạp khổng lồ, ngòi độc đã bị loại bỏ.',
        tier: 3,
        category: 'Material',
        emoji: '🦂',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Kền Kền': {
        description: 'Một chiếc lông vũ đen và bẩn thỉu.',
        tier: 2,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Cát Ma Thuật': {
        description: 'Những hạt cát lấp lánh năng lượng ma thuật, tàn dư của một linh hồn cát.',
        tier: 4,
        category: 'Magic',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Chất nhờn của Đỉa': {
        description: 'Một chất lỏng nhớt và có khả năng chống đông máu.',
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tinh chất Ma trơi': {
        description: 'Một quả cầu ánh sáng yếu ớt, ấm áp khi chạm vào.',
        tier: 4,
        category: 'Magic',
        emoji: '💡',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Da Cá Sấu': {
        description: 'Một tấm da cực kỳ cứng và bền, gần như không thể xuyên thủng.',
        tier: 4,
        category: 'Material',
        emoji: '🐊',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Răng Cá Sấu': {
        description: 'Một chiếc răng hình nón, sắc như dao găm.',
        tier: 3,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },
    'Cánh Muỗi': {
        description: 'Cánh của một con muỗi khổng lồ, trong suốt và mỏng manh.',
        tier: 1,
        category: 'Material',
        emoji: '🦟',
        effects: [],
        baseQuantity: { min: 2, max: 6 }
    },
    'Sừng Dê Núi': {
        description: 'Một cặp sừng xoắn và cứng, có thể dùng làm vũ khí hoặc trang trí.',
        tier: 3,
        category: 'Material',
        emoji: '🐐',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Thịt Dê Núi': {
        description: 'Thịt dê hơi dai nhưng rất bổ dưỡng.',
        tier: 2,
        category: 'Food',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Lõi Người Đá': {
        description: 'Một hòn đá phát ra năng lượng sống yếu ớt, trái tim của một Stone Golem.',
        tier: 5,
        category: 'Energy Source',
        emoji: '💖',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Harpie': {
        description: 'Một chiếc lông vũ dài và sắc, dính máu.',
        tier: 3,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 3, max: 6 }
    },
    'Da Báo Tuyết': {
        description: 'Một tấm da báo có hoa văn tuyệt đẹp, giữ ấm cực tốt.',
        tier: 4,
        category: 'Material',
        emoji: '🐆',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Thịt Báo Tuyết': {
        description: 'Thịt của một kẻ săn mồi đỉnh cao, chứa đầy năng lượng.',
        tier: 3,
        category: 'Food',
        emoji: '🍖',
        effects: [{ type: 'RESTORE_STAMINA', amount: 40 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cánh Dơi': {
        description: 'Một chiếc cánh dơi bằng da, dùng để chế tạo các vật phẩm bay lượn.',
        tier: 2,
        category: 'Material',
        emoji: '🦇',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Độc Nhện Hang': {
        description: 'Một túi nọc độc đặc quánh, có khả năng làm tê liệt con mồi.',
        tier: 3,
        category: 'Material',
        emoji: '☠️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Chất nhờn Slime': {
        description: 'Một khối chất nhờn co giãn, có tính axit nhẹ.',
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Răng Sâu Bò': {
        description: 'Một chiếc răng khổng lồ, cứng như kim cương.',
        tier: 5,
        category: 'Material',
        emoji: '🦷',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - RỪNG ---
    'Quả Mọng Ăn Được': {
        description: 'Một loại quả mọng đỏ, có vẻ ngon miệng và an toàn, giúp phục hồi chút thể lực.',
        tier: 1,
        category: 'Food',
        emoji: '🍓',
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
        emoji: '🍄',
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
        emoji: '🌿',
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
        emoji: '🪵',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mũi Tên Cũ': {
        description: 'Một mũi tên có vẻ đã được sử dụng, cắm trên một thân cây.',
        tier: 1,
        category: 'Material',
        emoji: '🏹',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Tinh Linh': {
        description: 'Một bông hoa phát ra ánh sáng xanh lam yếu ớt, tỏa ra năng lượng phép thuật.',
        tier: 4,
        category: 'Magic',
        emoji: '🌸',
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
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Vỏ Cây Cổ Thụ': {
        description: 'Một miếng vỏ cây cứng như đá từ một cây cổ thụ, có đặc tính phòng thủ.',
        tier: 3,
        category: 'Material',
        emoji: '🌳',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nhựa Cây Dính': {
        description: 'Một cục nhựa cây dính, có thể dùng để bẫy hoặc chế tạo.',
        tier: 2,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Mật Ong Hoang': {
        description: 'Mật ong vàng óng từ một tổ ong hoang, vừa ngọt ngào vừa bổ dưỡng.',
        tier: 2,
        category: 'Food',
        emoji: '🍯',
        effects: [{ type: 'HEAL', amount: 10 }, { type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Rêu Xanh': {
        description: 'Một mảng rêu mềm mại mọc trên đá, dùng để ngụy trang hoặc làm thuốc.',
        tier: 1,
        category: 'Material',
        emoji: ' moss ',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Cỏ Ba Lá': {
        description: 'Một cây cỏ ba lá. Người ta nói nó mang lại may mắn, nhưng có lẽ chỉ là lời đồn.',
        tier: 2,
        category: 'Material',
        emoji: '🍀',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tổ Chim Rỗng': {
        description: 'Một chiếc tổ chim được đan khéo léo nhưng đã bị bỏ trống.',
        tier: 1,
        category: 'Material',
        emoji: ' nests ',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },


    // --- TÀI NGUYÊN BIOME - ĐỒNG CỎ ---
    'Hoa Dại': {
        description: 'Một bông hoa đẹp, có thể có giá trị với một nhà thảo dược học.',
        tier: 1,
        category: 'Material',
        emoji: '🌻',
        effects: [],
        baseQuantity: { min: 3, max: 8 }
    },
    'Lúa Mì': {
        description: 'Một bó lúa mì chín vàng, có thể dùng làm thức ăn.',
        tier: 1,
        category: 'Food',
        emoji: '🌾',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Lông Chim Ưng': {
        description: 'Một chiếc lông vũ sắc bén từ một loài chim săn mồi.',
        tier: 2,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Lửa': {
        description: 'Hai hòn đá lửa, có thể dùng để nhóm lửa.',
        tier: 1,
        category: 'Tool',
        emoji: '🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Chim Hoang': {
        description: 'Một quả trứng chim hoang, giàu dinh dưỡng.',
        tier: 1,
        category: 'Food',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Rễ Củ Ăn Được': {
        description: 'Một loại củ có nhiều tinh bột, có thể ăn để phục hồi năng lượng.',
        tier: 1,
        category: 'Food',
        emoji: '🥔',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 3 }
    },
    'Hạt Giống Hoa Dại': {
        description: 'Những hạt giống nhỏ li ti, có thể gieo trồng để mọc ra những bông hoa đẹp.',
        tier: 1,
        category: 'Material',
        emoji: '🌱',
        effects: [],
        baseQuantity: { min: 5, max: 10 }
    },
    'Nấm Mỡ': {
        description: 'Một cây nấm phổ biến, ăn được và giúp phục hồi chút thể lực.',
        tier: 1,
        category: 'Food',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 5 }
    },
    'Cỏ Khô': {
        description: 'Cỏ đã được phơi khô, là thức ăn ưa thích của các loài ăn cỏ.',
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 4 }
    },

    // --- TÀI NGUYÊN BIOME - SA MẠC ---
    'Bình Nước Cũ': {
        description: 'Một bình nước quý giá, gần như còn đầy.',
        tier: 1,
        category: 'Support',
        emoji: '💧',
        effects: [{ type: 'RESTORE_STAMINA', amount: 25 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mảnh Gốm Cổ': {
        description: 'Một mảnh gốm vỡ có hoa văn kỳ lạ, có thể là của một nền văn minh đã mất.',
        tier: 2,
        category: 'Data',
        emoji: '🏺',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Hoa Xương Rồng': {
        description: 'Một bông hoa hiếm hoi nở trên sa mạc, chứa đầy nước giúp phục hồi thể lực.',
        tier: 1,
        category: 'Food',
        emoji: '🌵',
        effects: [{ type: 'RESTORE_STAMINA', amount: 20 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Xương Động Vật': {
        description: 'Một bộ xương lớn bị tẩy trắng bởi ánh mặt trời.',
        tier: 1,
        category: 'Material',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Sa Thạch': {
        description: 'Một phiến đá sa thạch mềm, có thể được khắc hoặc dùng làm công cụ mài.',
        tier: 1,
        category: 'Material',
        emoji: '🏜️',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nọc Bọ Cạp': {
        description: 'Một chiếc ngòi chứa đầy nọc độc chết người. Cực kỳ nguy hiểm.',
        tier: 4,
        category: 'Material',
        emoji: '☠️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Cây Xương Rồng Nhỏ': {
        description: 'Một cây xương rồng nhỏ, có thể ép lấy nước.',
        tier: 1,
        category: 'Food',
        emoji: '🌵',
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
        emoji: '🔍',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - ĐẦM LẦY ---
    'Rêu Phát Sáng': {
        description: 'Một loại rêu có thể dùng để đánh dấu đường đi hoặc làm thuốc.',
        tier: 2,
        category: 'Material',
        emoji: '✨',
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
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Nấm Đầm Lầy': {
        description: 'Một loại nấm ăn được nhưng có vị hơi tanh.',
        tier: 1,
        category: 'Food',
        emoji: '🍄',
        effects: [{ type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 2, max: 4 }
    },
    'Cây Sậy': {
        description: 'Thân cây sậy dài và rỗng, có thể dùng làm ống thổi hoặc chế tạo.',
        tier: 1,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 3, max: 7 }
    },
    'Hoa Độc': {
        description: 'Một bông hoa có màu sắc quyến rũ nhưng lại chứa độc tố.',
        tier: 2,
        category: 'Material',
        emoji: '🌺',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nước Bùn': {
        description: 'Một chai nước bùn đặc quánh, có thể chứa các vi sinh vật lạ.',
        tier: 1,
        category: 'Material',
        emoji: '💧',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },

    // --- TÀI NGUYÊN BIOME - NÚI ---
    'Quặng Sắt': {
        description: 'Một mỏm đá chứa quặng sắt có thể rèn thành vũ khí.',
        tier: 2,
        category: 'Material',
        emoji: '⛏️',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Lông Đại Bàng': {
        description: 'Một chiếc lông vũ lớn và đẹp, rơi ra từ một sinh vật bay lượn trên đỉnh núi.',
        tier: 3,
        category: 'Material',
        emoji: '🪶',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Pha Lê Núi': {
        description: 'Một tinh thể trong suốt, lạnh toát khi chạm vào.',
        tier: 4,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Thuốc Núi': {
        description: 'Một loại thảo dược quý hiếm chỉ mọc ở nơi cao, có tác dụng chữa bệnh.',
        tier: 3,
        category: 'Support',
        emoji: '🌿',
        effects: [{ type: 'HEAL', amount: 50 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Trứng Griffon': {
        description: 'Một quả trứng lớn, có vỏ cứng như đá. Vô cùng quý hiếm.',
        tier: 6,
        category: 'Data',
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Vỏ Chai': {
        description: 'Một mảnh đá vỏ chai sắc như dao cạo, được hình thành từ dung nham nguội lạnh.',
        tier: 3,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Đá Granit': {
        description: 'Một khối đá granit cứng, vật liệu xây dựng tuyệt vời.',
        tier: 2,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Cây Địa Y': {
        description: 'Một loại địa y bám trên đá, có thể dùng làm thuốc nhuộm hoặc thuốc chữa bệnh.',
        tier: 2,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Trứng Đại Bàng': {
        description: 'Một quả trứng lớn từ tổ của đại bàng núi.',
        tier: 3,
        category: 'Food',
        emoji: '🥚',
        effects: [{ type: 'RESTORE_STAMINA', amount: 50 }],
        baseQuantity: { min: 1, max: 2 }
    },
    'Tuyết': {
        description: 'Một nắm tuyết sạch, có thể làm tan ra để lấy nước.',
        tier: 1,
        category: 'Support',
        emoji: '❄️',
        effects: [{ type: 'RESTORE_STAMINA', amount: 5 }],
        baseQuantity: { min: 1, max: 3 }
    },

    // --- TÀI NGUYÊN BIOME - HANG ĐỘNG ---
     'Mảnh Tinh Thể': {
        description: 'Một mảnh tinh thể phát ra ánh sáng yếu ớt, có thể soi đường.',
        tier: 2,
        category: 'Magic',
        emoji: '💎',
        effects: [],
        baseQuantity: { min: 2, max: 7 }
    },
    'Bản Đồ Cổ': {
        description: 'Một tấm bản đồ da cũ kỹ, có vẻ chỉ đường đến một nơi bí mật trong hang.',
        tier: 3,
        category: 'Data',
        emoji: '🗺️',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Xương Cổ': {
        description: 'Một bộ xương của một sinh vật lạ chưa từng thấy.',
        tier: 2,
        category: 'Material',
        emoji: '💀',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Mỏ Vàng': {
        description: 'Những vệt vàng lấp lánh trên vách đá.',
        tier: 5,
        category: 'Material',
        emoji: '💰',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Nấm Phát Quang': {
        description: 'Một loại nấm phát ra ánh sáng dịu nhẹ, có thể ăn để tăng cường thị lực trong bóng tối.',
        tier: 3,
        category: 'Material',
        emoji: '🍄',
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
        emoji: '🥚',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nước Ngầm': {
        description: 'Nước trong vắt và mát lạnh chảy từ một kẽ đá.',
        tier: 1,
        category: 'Support',
        emoji: '💧',
        effects: [{ type: 'HEAL', amount: 5 }, { type: 'RESTORE_STAMINA', amount: 10 }],
        baseQuantity: { min: 1, max: 1 }
    },
    'Đá Vôi': {
        description: 'Một loại đá trầm tích mềm hơn granit, dễ dàng chế tác.',
        tier: 2,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Guano (Phân dơi)': {
        description: 'Một đống phân dơi giàu nitrat, là một loại phân bón tuyệt vời.',
        tier: 1,
        category: 'Material',
        emoji: '💩',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },

    // --- TÀI NGUYÊN BIOME - RỪNG RẬM (JUNGLE) ---
    'Dây leo Titan': {
        description: 'Một sợi dây leo to và chắc như cáp thép, gần như không thể bị cắt đứt.',
        tier: 3,
        category: 'Material',
        emoji: '🌿',
        effects: [],
        baseQuantity: { min: 1, max: 2 }
    },
    'Hoa ăn thịt': {
        description: 'Một bông hoa có màu sắc rực rỡ và mùi hương quyến rũ, nhưng những chiếc lá của nó có gai sắc nhọn.',
        tier: 3,
        category: 'Material',
        emoji: '🌺',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Nọc Ếch độc': {
        description: 'Một loại độc tố cực mạnh được chiết xuất từ da của loài ếch cây sặc sỡ.',
        tier: 4,
        category: 'Material',
        emoji: '🐸',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Lông Vẹt Sặc Sỡ': {
        description: 'Một chiếc lông vũ có màu sắc cầu vồng, được các bộ lạc trong rừng rậm dùng làm vật trang trí.',
        tier: 2,
        category: 'Material',
        emoji: '🦜',
        effects: [],
        baseQuantity: { min: 2, max: 5 }
    },
    'Quả Lạ': {
        description: 'Một loại quả có vỏ cứng và hình thù kỳ dị, không rõ có ăn được không.',
        tier: 2,
        category: 'Food',
        emoji: '🥥',
        effects: [{ type: 'RESTORE_STAMINA', amount: 15 }],
        baseQuantity: { min: 1, max: 3 }
    },

    // --- TÀI NGUYÊN BIOME - NÚI LỬA (VOLCANIC) ---
    'Đá Obsidian': {
        description: 'Một mảnh đá thủy tinh núi lửa đen bóng, có cạnh sắc như dao cạo.',
        tier: 3,
        category: 'Material',
        emoji: '🪨',
        effects: [],
        baseQuantity: { min: 2, max: 4 }
    },
    'Lưu huỳnh': {
        description: 'Một cục bột màu vàng có mùi trứng thối đặc trưng, là thành phần quan trọng trong chế tạo thuốc súng.',
        tier: 2,
        category: 'Material',
        emoji: '✨',
        effects: [],
        baseQuantity: { min: 1, max: 3 }
    },
    'Trái tim Magma': {
        description: 'Một hòn đá vẫn còn nóng hổi và phát ra ánh sáng le lói, chứa đựng năng lượng của dung nham.',
        tier: 5,
        category: 'Energy Source',
        emoji: '❤️‍🔥',
        effects: [],
        baseQuantity: { min: 1, max: 1 }
    },
    'Tro núi lửa': {
        description: 'Một lớp bụi mịn màu xám, rất giàu khoáng chất và có thể dùng làm phân bón.',
        tier: 1,
        category: 'Material',
        emoji: '🌋',
        effects: [],
        baseQuantity: { min: 1, max: 5 }
    },
};
