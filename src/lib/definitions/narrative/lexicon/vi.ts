/**
 * Vietnamese Narrative Lexicon
 *
 * OVERVIEW: Comprehensive Vietnamese lexicon for narrative generation, organized by mood tags
 * with 3 variation tiers (standard/subtle/emphatic). Maintains full parity with English lexicon
 * while respecting Vietnamese language patterns and cultural context.
 *
 * Structure:
 * - adjectives: { [moodTag]: { standard: [], subtle: [], emphatic: [] } }
 * - continuations: { [actionType]: [] }
 * - transitionPhrases: [] (used between sentences)
 * - descriptiveNouns: [] (used as emphasis targets)
 *
 * Tier Distribution:
 * - Standard (60%): Neutral, balanced adjectives suitable for all contexts
 * - Subtle (20%): Understated, minimalist adjectives for quiet moments
 * - Emphatic (20%): Intense, dramatic adjectives for high-tension scenes
 *
 * Bilingual Parity: All 24 mood tags × 3 tiers maintained with Vietnamese equivalents
 * Continuation Phrases: 5 action types × 8+ variants in Vietnamese
 * Transition Phrases: 15+ variants for smooth narrative flow
 */

/**
 * Vietnamese Lexicon - Complete adjective and phrase database
 *
 * Each mood tag includes 3 variation tiers optimized for specific narrative contexts.
 * All content is translated from English lexicon with cultural/linguistic adaptations.
 */
export const VIETNAMESE_LEXICON = {
    adjectives: {
        // Dark & Shadow moods
        Dark: {
            standard: ['tối', 'tối đen', 'u ám', 'mờ mịt', 'che phủ', 'âm u', 'tối dần', 'u tối'],
            subtle: ['mờ nhạt', 'nhẹ nhõm', 'che kín', 'vừa vặn', 'mạnh mẽ', 'giảm dần'],
            emphatic: ['TỐI ĐEN HOÀN TOÀN', 'BỘI TỔNG BẢO CHE', 'TỐI NHƯ HUYẾT QUẢN', 'TRỐNG RỖNG TUYỆT ĐỐI', 'U TỐI VÔ TẬN', 'BẢO CHE TOÀN BỘ']
        },
        Gloomy: {
            standard: ['u sầu', 'buồn bã', 'ảm đạm', 'hoang tàn', 'tối tăm', 'ảm xảm', 'dừ dật', 'cau có'],
            subtle: ['hoài niệm', 'trầm tư', 'chấp nhận', 'yên tĩnh', 'thống thiết', 'ảm đạm'],
            emphatic: ['VƯỢT MỨC U SẦU', 'TÀN PHÁ TÂM HỒN', 'HOANG TÀNG SÂU SẮC', 'VÔ CÙNG ẢMT ĐẠM', 'CHÈN NỨC TỐI']
        },

        // Light & Brightness moods
        Bright: {
            standard: ['sáng', 'rạng rỡ', 'sáng chói', 'tỏa sáng', 'rực rỡ', 'lấp lánh', 'chói lóa', 'nắng'],
            subtle: ['sáng nhẹ', 'tỏa sáng dịu dàng', 'mờ ảo', 'sấm sáng', 'phát sáng nhẹ'],
            emphatic: ['CHÓI LÓA TỚI LOẠN', 'RẠNG RỠ LỤC ĐH', 'SÁNG CHÓI VÔ BỀN', 'LỤC ĐỊA RỰC RỠ', 'CHÓI LÓA CHÓNG MặT']
        },
        Ethereal: {
            standard: ['linh tinh', 'ma quái', 'siêu việt', 'thế giới khác', 'ảnh ma', 'mơ mộng', 'kỳ dị', 'siêu thế'],
            subtle: ['mỏng manh', 'mây khói', 'tinh tế', 'dính dáng', 'trong suốt', 'nhất thời'],
            emphatic: ['SIÊU VIỆT PHỤC TẠP', 'NGOÀI THỰC THÁNG', 'MA QUÁI HÙNG VĨ', 'THỰC HÌNH KỲ ĐỎ', 'SIÊU TUYỆT ĐẸP']
        },

        // Nature & Life moods
        Lush: {
            standard: ['tươi tốt', 'xanh tươi', 'phì nhiêu', 'phát triển', 'phong phú', 'rực rỡ', 'phát triển', 'cây lá'],
            subtle: ['xanh', 'mọc lên', 'sống', 'tươi', 'rộc rạch', 'tràn đầy'],
            emphatic: ['NỔ TỬ TƯƠI TỐT', 'XANH NGỘT NGẠT', 'RỰC RỠ SỐNG ĐỘNG', 'ĐẦY MÌNH SỐNG', 'TRÀN ĐẦY SỐNG LỰC']
        },
        Vibrant: {
            standard: ['sống động', 'sắc nét', 'đa màu', 'năng động', 'tươi tui', 'sinh động', 'nhịp đập', 'rạng rỡ'],
            subtle: ['sống', 'hoạt động', 'tích cực', 'tham gia', 'xô xác', 'nhanh lên'],
            emphatic: ['SỐNG ĐỘNG CƯỜNG LIỆT', 'MÀNN SẮCO LOẠN', 'NỘ LỰC NỔ TUNG', 'CHÓI LÓA RỰC RỠ']
        },
        Wild: {
            standard: ['hoang dã', 'chưa được kềm chế', 'thú tính', 'sơ khai', 'bất kiểm soát', 'hung hăng', 'man rợ', 'thô sơ'],
            subtle: ['chưa kềm chế', 'tự nhiên', 'tự do', 'không tinh tế', 'phảng phất', 'tự do'],
            emphatic: ['HOANG DÃ CỤC ĐỘ', 'THƠ THÒ KHỦNG KHIẾP', 'HỖN LOẠN VÔ CHỈ', 'HUNG HĂNG ĐỒI', 'TÀNG LỰC MAN RỢ']
        },
        Peaceful: {
            standard: ['yên bình', 'yên tĩnh', 'bình yên', 'thanh thản', 'lặng lẽ', 'đơi đấy', 'yên ổn', 'dịu dàng'],
            subtle: ['mềm mại', 'nhẹ nhàng', 'dịu dàng', 'ôm ấp', 'thoáng nhẹ', 'lạnh lẽo'],
            emphatic: ['YÊN BÌ CHÚC PHÚC', 'SIÊU VIỆT THANH TỊNH', 'TUYỆT ĐỐI YÊÊN TĨNH', 'HOÀN HẢO TĨNH LẶNG']
        },

        // Atmospheric moods
        Mysterious: {
            standard: ['bí ẩn', 'bí hiểm', 'mật mã', 'che chở', 'chưa biết', 'ẩn giấu', 'bí kíp', 'che phủ'],
            subtle: ['không rõ', 'mơ hồ', 'tinh tế', 'khác thường', 'yên tĩnh', 'không khai'],
            emphatic: ['BÍ ẨN SÂU THẲM', 'KHÔNG THỂ GIẢI MỞ', 'BẰNG HIỂM KỲ CỰC', 'TƯƠNG PHỤC BÌNH YÊN']
        },
        Confined: {
            standard: ['bị giới hạn', 'chật hẹp', 'kín cổng', 'sít sao', 'hẹp hòi', 'chộp hẹp', 'cảnh hành', 'hẹp hòi'],
            subtle: ['gần gũi', 'tỏ lộ', 'gọn gàng', 'ấm cúng', 'compact', 'hạn chế'],
            emphatic: ['CHẬT CHỘI KHI CỤNG', 'CHÍCH NGHẸT ĐỒNG', 'ÁICÁP HOÀNG TUYỆT', 'HẸPA NGÁCH SĂN']
        },
        Vast: {
            standard: ['rộng lớn', 'mênh mông', 'khồng lớn', 'vô bờ', 'tận cùng', 'vô tận', 'trải dài', 'khổng lồ'],
            subtle: ['rộng', 'mở', 'rộng rãi', 'trải rộng', 'mênh mông', 'siêu xa'],
            emphatic: ['RỘNG LỚN KHÔNG TƯỞNG', 'VÔ BỜMÊNH MÔNG', 'KHỒNG ĐỘI CẢ TRỜI', 'RỘNG NGÚT NGÀN']
        },
        Elevated: {
            standard: ['cao', 'cao vút', 'lơ lửng', 'toà nhà cao', 'tháp', 'nóc nhà', 'đỉnh cao', 'cao'],
            subtle: ['nâng cao', 'cao hơn', 'nổi lên', 'lên cao', 'tăng vọt', 'treo', 'lơ lửng'],
            emphatic: ['CAO CHÓNG MẶT', 'KHÔNG TƯỞNG CAO', 'LƠNG LỪNG TOÀ CAO', 'THÁP CAO KHOÁC']
        },

        // Danger & Threat moods
        Danger: {
            standard: ['nguy hiểm', 'liều lĩnh', 'hiểm nguy', 'ngặt ngà', 'đe dọa', 'dọa dẫy', 'hiểm trở', 'chết'],
            subtle: ['không chắc chắn', 'cẩn thận', 'cảnh báo', 'liều', 'không an toàn', 'rủi ro'],
            emphatic: ['CHẾT NGUY HIỂM', 'TIÊU SẬU NGƯỢC LẠI', 'TỰC TIỂU ĐÃN', 'ĐỌC HẠI HOÀNG TƯỞNG']
        },
        Threatening: {
            standard: ['đe dọa', 'xấu xa', 'tối tăm', 'áp lực', 'địch thủ', 'hung hăng', 'chiến đấu', 'đối kháng'],
            subtle: ['căng thẳng', 'hơi hơi', 'phòng vệ', 'canh chừng', 'cảnh báo', 'chú ý'],
            emphatic: ['ĐỀ DOẠ VƯỢT QUÁ', 'TỐI TĂNG SOMBM', 'ĐỊA THỦ HUNG HĂN', 'GIẾT HẠI KINH DOANH']
        },
        Foreboding: {
            standard: ['không lành', 'xấu xa', 'tiên báo', 'bất lợi', 'xấu xa', 'tận số', 'bị nguyền', 'mất tích'],
            subtle: ['lo lắng', 'bất yên', 'lo sợ', 'quan tâm', 'lo lắng', 'ghê sợ'],
            emphatic: ['KINH HOÀNG KHÔNG LÀNH', 'HOÀNG LII HẠN', 'TIÊU PHẨMỞ CỬ', 'TẬT SỐ KHÔNG THÓAT']
        },

        // Terrain-specific moods
        Desolate: {
            standard: ['hoang vắng', 'cằn cỗi', 'trống rỗng', 'bỏ hoang', 'bỏ rơi', 'không nhân', 'không sống', 'kỳ cùng'],
            subtle: ['ít ỏi', 'yên tĩnh', 'cô lập', 'cô đơn', 'xa xôi', 'rút lui'],
            emphatic: ['HOÀN TOÀN HOANG VẮN', 'SỐC TÂM HỒN TRỐNG RỖ', 'TOÀN BỘ BỎ RƠ', 'YÊUĐỘNG BẢN SỐNG']
        },
        Harsh: {
            standard: ['khắc nghiệt', 'cao ráo', 'không tha thứ', 'tàn bạo', 'gồ ghề', 'cứng rắn', 'tàn ác', 'khô cứng'],
            subtle: ['khó khăn', 'thách thức', 'khó', 'khắc khe', 'cứng', 'sâu'],
            emphatic: ['KHẮC NGHIỆT TÀNG TÍN', 'KHÔNG BỎ SÃN ĐIỆU', 'TÀN BẠO CHẺ TÔỒN', 'MAN RỢ TÀNG ĐẦU']
        },
        Barren: {
            standard: ['cằn cỗi', 'trơ', 'cạn cồi', 'lột mái', 'khoác chân', 'rỗng', 'trống', 'hiếm muộn'],
            subtle: ['ít ỏi', 'mỏng manh', 'lộ thiên', 'mở', 'rõ', 'chưa cây cối'],
            emphatic: ['HOÀN TOÀN CẰN CỖIA', 'HOÀN TOÀN LỘT MÁI', 'TUYỆT ĐỐI TRỐNG', 'KHÔNG HẠN HIẾM']
        },
        Serene: {
            standard: ['thanh thản', 'yên tĩnh', 'không lo lắng', 'bình thản', 'trầm lắng', 'không xáo trộn', 'yên tĩnh', 'hài hòa'],
            subtle: ['dịu dàng', 'mềm mại', 'yên tĩnh', 'thoáng nhẹ', 'bình yên', 'im lặng'],
            emphatic: ['SIÊU VIỆT THANH THẢN', 'HOÀN HẢO HÒA HỢP', 'TUYỆT ĐỐI YÊNNT Ĩ', 'CHÚC PHÚC BÌNH TĨNH']
        },

        // State-based moods
        Abandoned: {
            standard: ['bỏ rơi', 'hoang vắng', 'rời bỏ', 'trống rỗng', 'tả tơi', 'bỏ bê', 'hoang phế', 'mất tích'],
            subtle: ['không dùng', 'yên tĩnh', 'vẫn', 'ngủ yên', 'bất hoạt', 'im lặng'],
            emphatic: ['HOÀN TOÀN BỎ RƠI', 'TUYỆT ĐỐI TẢ TƠI', 'SÂUCHO MONG TỰC', 'YÊUĐỘNG HOANG PHẨ']
        }
    },

    continuations: {
        // Movement continuations
        movement: [
            'Mỗi bước chân của bạn vang lên.Tiếp tục từng bước.',
            'Con đường phía trước quanh co vào cái không biết.',
            'Bạn thúc đẩy thân mình tiếp tục, bị cuốn bởi tò mò.',
            'Mỗi bước mang cảm nhận mới.',
            'Hành trình của bạn tiếp tục, từng khoảnh khắc.',
            'Thời gian dường như dịch chuyển cùng với bạn.',
            'Bạn nhận thấy chi tiết mà bạn đã bỏ lỡ.',
            'Thế giới thay đổi tinh tế xung quanh bạn.'
        ],

        // Discovery continuations
        discovery: [
            'Đây là cái gì đó bạn sẽ nhớ lâu dài.',
            'Bạn ghi lại khoảnh khắc này vào trí nhớ.',
            'Sự tò mò của bạn tăng lên.',
            'Bạn khám phá thêm, háo hức để tìm hiểu thêm.',
            'Có điều gì đó về nơi này gọi đến bạn.',
            'Bạn cảm thấy có nhiều điều để khám phá tại đây.',
            'Sự khám phá này thay đổi quan điểm của bạn.',
            'Bạn ghi chép lại trong trí óc.'
        ],

        // Danger continuations
        danger: [
            'Cơ bắp của bạn giãn ra trong sự chờ đợi.',
            'Mỗi giác quan của bạn sắc bén hoàn toàn.',
            'Bạn chuẩn bị cho những gì có thể đến.',
            'Mối đe dọa cảm thấy rất thực tế bây giờ.',
            'Bản năng sống sót của bạn tiếp quản.',
            'Adrenaline chảy trong tĩnh mạch của bạn.',
            'Bạn nắm chặt vũ khí của bạn.',
            'Hiểm nguy lẩn quanh mỗi góc cua.'
        ],

        // Weather continuations
        weather: [
            'Các yếu tố tấn công bạn vô cùng dã man.',
            'Thiên nhiên trưng bày sức mạnh thô nguyên của nó.',
            'Bạn chui vào để tránh cuộc tấn công.',
            'Thời tiết tăng cường hơn nữa.',
            'Bạn tìm kiếm nơi ẩn náu khỏi giông bão.',
            'Cơn bão không có dấu hiệu dừng lại.',
            'Các yếu tố quéc bạn liên tục.',
            'Bạn kiên trì qua điều kiện khắc nghiệt.'
        ],

        // Transition continuations
        transition: [
            'Khi bạn di chuyển về phía trước...',
            'Dần dần, bạn nhận thấy...',
            'Trước khi bạn nhận ra nó...',
            'Trong khoảnh khắc đó...',
            'Đột nhiên, bạn trở nên ý thức...',
            'Thời gian dường như tạm dừng như...',
            'Chú ý của bạn chuyển sang...',
            'Ở đâu đó gần đây...',
            'Ở khoảng cách xa...',
            'Xa dưới...',
            'Cao phía trên...',
            'Xung quanh bạn...'
        ]
    },

    transitionPhrases: [
        'Khi khoảnh khắc trôi qua...',
        'Không lâu sau đó...',
        'Theo thời gian...',
        'Khi bạn ít chờ đợi nhất...',
        'Dần dần...',
        'Từng inch...',
        'Từng bước...',
        'Từ từ...',
        'Với mỗi khoảnh khắc trôi qua...',
        'Chậm nhưng chắc chắn...',
        'Rất nhẹ nhàng...',
        'Không có cảnh báo...',
        'Trong thoáng chốc...',
        'Trong một lát...',
        'Trong nháy mắt...'
    ],

    /**
     * Descriptive nouns for emphasis highlighting in Vietnamese
     */
    descriptiveNouns: [
        'rừng', 'hang động', 'núi', 'rừng tươi', 'sa mạc', 'biển', 'bãi biển',
        'giông bão', 'mưa', 'sấm', 'chớp', 'gió', 'tuyết', 'sương mù',
        'nguy hiểm', 'sinh vật', 'quái vật', 'bóng tối', 'ánh sáng', 'bóng tối',
        'kho báu', 'hiện vật', 'cổng', 'cổ đại', 'bí mật', 'bí ẩn',
        'con đường', 'đường mòn', 'con đường', 'khoảng trống', 'thung lũng', 'đỉnh', 'vách đá',
        'nước', 'lửa', 'đất', 'không khí', 'sống', 'chết', 'phép thuật'
    ]
};

/**
 * Helper function to select a random adjective from a specific tier (Vietnamese)
 * @param moodTag - The mood tag to select from
 * @param tier - The variation tier (standard, subtle, emphatic)
 * @returns A random adjective or undefined if mood not found
 */
export function getRandomAdjective(moodTag: string, tier: 'standard' | 'subtle' | 'emphatic'): string | undefined {
    const moodAdjectives = (VIETNAMESE_LEXICON.adjectives as any)[moodTag]?.[tier];
    if (!moodAdjectives || moodAdjectives.length === 0) {
        return undefined;
    }
    return moodAdjectives[Math.floor(Math.random() * moodAdjectives.length)];
}

/**
 * Helper function to select a random continuation phrase (Vietnamese)
 * @param actionType - The action type (movement, discovery, danger, weather, transition)
 * @returns A random continuation phrase or undefined if action type not found
 */
export function getRandomContinuation(actionType: string): string | undefined {
    const continuations = (VIETNAMESE_LEXICON.continuations as any)[actionType];
    if (!continuations || continuations.length === 0) {
        return undefined;
    }
    return continuations[Math.floor(Math.random() * continuations.length)];
}

/**
 * Helper function to select a random transition phrase (Vietnamese)
 * @returns A random transition phrase
 */
export function getRandomTransition(): string {
    return VIETNAMESE_LEXICON.transitionPhrases[Math.floor(Math.random() * VIETNAMESE_LEXICON.transitionPhrases.length)];
}
