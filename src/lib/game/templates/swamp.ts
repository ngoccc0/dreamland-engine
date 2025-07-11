import type { TranslationKey } from "@/lib/i18n";

export const swamp_vi = {
    descriptionTemplates: {
        short: ["Bạn đang lội qua một đầm lầy [adjective]."],
        medium: ["Một đầm lầy [adjective]. Không khí đặc quánh mùi [smell] và bạn nghe thấy tiếng [sound] rùng rợn từ trong sương mù. {sensory_details} {entity_report}"],
        long: ["Sương mù [adjective] dày đặc bao phủ đầm lầy, che khuất tầm nhìn. Không khí đặc quánh mùi [smell]. Nước bùn [feature] ngập đến đầu gối, và tiếng [sound] không ngừng của sự sống ẩn nấp khiến nơi đây càng thêm đáng sợ. {sensory_details} {entity_report} {surrounding_peek}"]
    },
    adjectives: ['hôi thối', 'âm u', 'chết chóc', 'sương giăng', 'ngập nước', 'lầy lội'],
    features: ['đước', 'dây leo', 'khí độc', 'bong bóng bùn', 'côn trùng', 'xác động vật'],
    sounds: ['ếch kêu', 'nước sủi bọt', 'muỗi vo ve', 'tiếng lội bì bõm', 'tiếng thì thầm'],
    smells: ['cây cỏ mục', 'bùn lầy', 'khí metan', 'hoa thối', 'xác chết'],
    sky: [],
    NPCs: [
        { 
            data: { name: 'Phù thủy đầm lầy' as TranslationKey, description: 'Một bà lão với nụ cười bí hiểm, sống trong một túp lều tạm bợ.' as TranslationKey, dialogueSeed: 'Một phù thủy lập dị, nói chuyện bằng những câu đố và có thể giúp đỡ nếu được trả công xứng đáng.' as TranslationKey },
            conditions: { humanPresence: { min: 1, max: 2 }, magicAffinity: { min: 5 }, chance: 0.05 } 
        },
        { 
            data: { name: 'Thợ săn cá sấu' as TranslationKey, description: 'Một người đàn ông lực lưỡng, trên người có nhiều vết sẹo, mang theo một cây lao lớn.' as TranslationKey, dialogueSeed: 'Một người thợ săn dũng cảm, chỉ nói về con mồi lớn nhất mà ông ta đang theo đuổi.' as TranslationKey },
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
        { name: 'Lõi Gỗ Rỗng', conditions: { chance: 0.2, humidity: { min: 6 } } },
    ],
    structures: [],
    enemies: [
        {
            data: {
                type: 'Cây Đầm Lầy',
                emoji: '🌿',
                hp: 25,
                damage: 0,
                behavior: 'immobile',
                size: 'medium',
                diet: [],
                satiation: 0,
                maxSatiation: 0,
                harvestable: {
                    difficulty: 1,
                    requiredTool: 'Rìu Đá Đơn Giản',
                    loot: [
                        { name: 'Lõi Gỗ', chance: 1.0, quantity: { min: 1, max: 3 } },
                        { name: 'Sợi Thực Vật', chance: 0.3, quantity: { min: 1, max: 2 } }
                    ]
                },
            },
            conditions: { chance: 0.6, humidity: { min: 7 } }
        },
        { data: { type: 'Đỉa khổng lồ', emoji: '🩸', hp: 40, damage: 5, behavior: 'aggressive', size: 'small', diet: ['Trứng Bò Sát'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn của Đỉa', chance: 0.5, quantity: {min: 1, max: 2}}] }, conditions: { moisture: { min: 9 }, chance: 0.4 } },
        { data: { type: 'Ma trơi', emoji: '💡', hp: 25, damage: 20, behavior: 'territorial', size: 'small', diet: ['Hoa Tinh Linh'], satiation: 0, maxSatiation: 1, loot: [{name: 'Tinh chất Ma trơi', chance: 0.2, quantity: {min: 1, max: 1}}] }, conditions: { magicAffinity: { min: 7 }, lightLevel: { max: -5 }, chance: 0.2 } },
        { data: { type: 'Cá sấu', emoji: '🐊', hp: 70, damage: 25, behavior: 'territorial', size: 'large', diet: ['Heo Rừng', 'Dê núi hung hãn'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Cá Sấu', chance: 0.4, quantity: {min: 1, max: 1}}, {name: 'Răng Cá Sấu', chance: 0.3, quantity: {min: 1, max: 4}}] }, conditions: { predatorPresence: { min: 8 }, moisture: { min: 8 }, chance: 0.25 } },
        { data: { type: 'Muỗi khổng lồ', emoji: '🦟', hp: 15, damage: 5, behavior: 'aggressive', size: 'small', diet: [], satiation: 0, maxSatiation: 1, loot: [{name: 'Cánh Muỗi', chance: 0.7, quantity: {min: 2, max: 6}}] }, conditions: { chance: 0.5 } },
    ],
};

export const swamp_en = {
    ...swamp_vi,
};
