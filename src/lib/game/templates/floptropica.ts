

import type { TranslationKey } from "@/lib/i18n";

import type { TranslationKey } from '../../i18n'
export const floptropica_vi = {
    descriptionTemplates: {
        short: [
            "Bạn đang ở trong một khu rừng rậm [adjective] và cực kỳ \"slay\".",
        ],
        medium: [
            "Bạn đang ở trong một khu rừng rậm [adjective] và cực kỳ \"slay\". Không khí nồng nặc mùi [smell] và tiếng nhạc pop vang vọng đâu đó. {sensory_details} {entity_report}",
            "Một hòn đảo [adjective] bao quanh bạn. Những cây [feature] óng ánh dưới ánh sáng kỳ lạ. Bạn nghe thấy âm thanh của [sound]. {sensory_details} {entity_report}",
        ],
        long: [
            "Bạn đã đến Floptropica, một hòn đảo [adjective] nơi luật lệ của tự nhiên bị bẻ cong. Những cây [feature] kim tuyến mọc san sát, và không khí nồng nặc mùi [smell]. Từ xa vọng lại tiếng [sound] chói tai, một lời mời gọi đầy nguy hiểm. {sensory_details} {entity_report} {surrounding_peek}",
            "Hòn đảo [adjective] này là một sự hỗn loạn tuyệt đẹp. Dưới chân bạn là một dòng sông nước tăng lực, và những bông hoa dại \"yassified\" dường như đang nhìn bạn. Tiếng [sound] không ngừng nghỉ khiến đầu bạn ong ong. {sensory_details} {entity_report} {surrounding_peek}",
        ]
    },
    adjectives: ['hồng rực', 'lấp lánh', 'hỗn loạn', 'sang chảnh', 'sành điệu'],
    features: ['cọ kim tuyến', 'hoa dại "yassified"', 'dòng sông nước tăng lực', 'tàn tích của một "flop era"'],
    smells: ['nước hoa rẻ tiền', 'sản phẩm của Jiafei', 'gà rán', 'tuyệt vọng'],
    sounds: ['tiếng hét "ATE!"', 'nhạc của CupcakKe', 'tiếng thông báo của Stan Twitter', 'tiếng dép loẹt quẹt'],
    sky: ['cầu vồng', 'hoàng hôn tím', 'đầy sao lấp lánh'],
    NPCs: [
        { 
            data: { 
                name: 'npc_panicked_stan_name' as TranslationKey, 
                description: 'npc_panicked_stan_desc' as TranslationKey,
                dialogueSeed: 'dialogueSeed_stan' as TranslationKey,
                quest: 'quest_stan_onika_coupon' as TranslationKey,
                questItem: { name: 'Phiếu giảm giá Onika Burger', quantity: 1 },
                rewardItems: [{ name: 'Bản Remix của CupcakKe', quantity: 1, tier: 3, emoji: '🎶' }]
            },
            conditions: { humanPresence: { min: 2 }, chance: 0.5 } 
        },
    ],
    items: [
        { name: 'Chảo của Jiafei', conditions: { chance: 0.2 } },
        { name: 'Chủ đề Stan Twitter', conditions: { chance: 0.3 } },
        { name: 'Bản Remix của CupcakKe', conditions: { chance: 0.1 } },
        { name: 'Viên Yass', conditions: { chance: 0.4 } },
        { name: 'Gusher', conditions: { chance: 0.5 } },
        { name: 'Phiếu giảm giá Onika Burger', conditions: { chance: 0.05 } },
    ],
    structures: [
         { 
            data: { name: 'Đại học C.V.N.T. của Deborah', description: 'structure_deborah_university_desc', emoji: '🎓' },
            conditions: { magicAffinity: { min: 8 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Bệnh viện Barbz của Nicki', description: 'structure_nicki_hospital_desc', emoji: '🏥' },
            conditions: { magicAffinity: { min: 7 }, chance: 0.1 } 
        },
         { 
            data: { name: 'Onika Burgers', description: 'structure_onika_burgers_desc', emoji: '🍔' },
            conditions: { humanPresence: { min: 5 }, chance: 0.2 } 
        },
    ],
    enemies: [
        { data: { type: 'Twink Hung Dữ', emoji: '💅', hp: 35, damage: 12, behavior: 'aggressive', size: 'small', diet: ['Gusher'], satiation: 0, maxSatiation: 1, loot: [{name: 'Gusher', chance: 0.3, quantity: {min: 1, max: 1}}] }, conditions: { chance: 0.6 } },
    ],
};

export const floptropica_en = floptropica_vi;
