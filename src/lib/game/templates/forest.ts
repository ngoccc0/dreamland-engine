
import { structureDefinitions } from '@/core/data/structures';

export const forest_vi = {
    descriptionTemplates: {
        short: [ "Bạn đang ở trong một khu rừng [adjective]." ],
        medium: [ "Một khu rừng [adjective] với [feature] ở khắp nơi. Không khí có mùi [smell] và bạn nghe thấy tiếng [sound]. {sensory_details} {entity_report}" ],
        long: [ "Bạn đang ở trong một khu rừng [adjective]. Những cây [feature] vươn cao, che khuất bầu trời [sky]. Không khí có mùi [smell] và bạn nghe thấy tiếng [sound] của sự sống hoang dã. {sensory_details} {entity_report} {surrounding_peek}" ]
    },
    adjectives: ['rậm rạp', 'u ám', 'cổ xưa', 'yên tĩnh', 'ma mị', 'ẩm ướt', 'ngập nắng', 'sâu thẳm', 'bí ẩn'],
    features: ['sồi', 'thông', 'dương xỉ', 'nấm phát quang', 'dây leo chằng chịt', 'thân cây mục', 'suối nhỏ', 'hoa dại', 'tảng đá phủ rêu'],
    smells: ['đất ẩm', 'lá cây mục', 'nhựa thông', 'hoa dại', 'xạ hương động vật', 'ozon sau mưa'],
    sounds: ['chim hót', 'gió rít', 'cành cây gãy', 'sự im lặng đáng sợ', 'tiếng suối chảy róc rách', 'tiếng côn trùng kêu'],
    sky: ['xanh biếc', 'vàng úa', 'xám xịt'],
    
    NPCs: [
        { 
            data: { 
                name: {en: 'Mysterious Hunter', vi: 'Thợ săn bí ẩn'},
                description: {en: 'A man with sharp eyes and old leather clothes, always carrying a longbow.', vi: 'Một người đàn ông với ánh mắt sắc lẹm và bộ quần áo bằng da cũ kỹ, luôn mang theo cây cung dài.'},
                dialogueSeed: {en: 'A seasoned hunter, weary but watchful, who speaks in short, clipped sentences.', vi: 'Một thợ săn dày dạn kinh nghiệm, mệt mỏi nhưng cảnh giác, nói những câu ngắn gọn, dứt khoát.'},
                quest: {en: 'Bring me 5 Wolf Fangs to prove your mettle.', vi: 'Mang cho ta 5 Nanh Sói để chứng tỏ bản lĩnh của ngươi.'},
                questItem: { name: 'wolf_fang', quantity: 5 },
                rewardItems: [{ name: 'bear_hide', quantity: 1, tier: 4, emoji: '🐻' }]
            },
            conditions: { humanPresence: { min: 2 }, chance: 0.05 } 
        }
    ],
    items: [
        { name: 'edible_berries', conditions: { dangerLevel: { max: 4 }, chance: 0.4 } },
        { name: 'poisonous_mushroom', conditions: { dangerLevel: { min: 5 }, moisture: { min: 6 }, chance: 0.25 } },
        { name: 'healing_herb', conditions: { vegetationDensity: { min: 8 }, chance: 0.3 } },
        { name: 'spirit_bloom', conditions: { magicAffinity: { min: 7 }, chance: 0.05 } },
        { name: 'ancient_bark', conditions: { vegetationDensity: { min: 9 }, chance: 0.02 } },
        { name: 'sticky_resin', conditions: { chance: 0.2 } },
        { name: 'wild_honey', conditions: { vegetationDensity: { min: 6 }, chance: 0.05 } },
        { name: 'pebbles', conditions: { chance: 0.55 } },
    { name: 'thorny_vine', conditions: { vegetationDensity: { min: 5 }, chance: 0.45 } },
        { name: 'large_leaf', conditions: { vegetationDensity: { min: 6 }, chance: 0.4 } },
        { name: 'sturdy_branch', conditions: { chance: 0.65 } },
        { name: 'hollow_wood_core', conditions: { chance: 0.15, moisture: { min: 4 } } },
        { name: 'magic_root', conditions: { chance: 0.05, moisture: { min: 6 }, timeOfDay: 'night' } }
    ],
    structures: [
        structureDefinitions['abandoned_altar']
    ]
};

export const forest_en = forest_vi;
