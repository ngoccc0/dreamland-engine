
import { structureDefinitions } from "../structures";

export const floptropica_vi = {
    descriptionTemplates: [
        'Bạn đang ở trong một khu rừng rậm [adjective] và cực kỳ "slay". Không khí nồng nặc mùi [smell] và tiếng nhạc pop vang vọng đâu đó.',
        'Một hòn đảo [adjective] bao quanh bạn. Những cây [feature] óng ánh dưới ánh sáng kỳ lạ. Bạn nghe thấy âm thanh của [sound].',
    ],
    adjectives: ['hồng rực', 'lấp lánh', 'hỗn loạn', 'sang chảnh', 'sành điệu'],
    features: ['cọ kim tuyến', 'hoa dại "yassified"', 'dòng sông nước tăng lực', 'tàn tích của một "flop era"'],
    smells: ['nước hoa rẻ tiền', 'sản phẩm của Jiafei', 'gà rán', 'tuyệt vọng'],
    sounds: ['tiếng hét "ATE!"', 'nhạc của CupcakKe', 'tiếng thông báo của Stan Twitter', 'tiếng dép loẹt quẹt'],
    NPCs: [
        { 
            data: { 
                name: 'Một Stan đang hoảng loạn', 
                description: 'Anh ta có vẻ đau khổ, đang cuộn điện thoại một cách điên cuồng.', 
                dialogueSeed: 'Rất cần tìm một "Phiếu giảm giá Onika Burger" để chứng minh lòng trung thành với Barbz.',
                quest: 'Tìm cho tôi Phiếu giảm giá Onika Burger!',
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
            data: { name: 'Đại học C.V.N.T. của Deborah', description: 'Một học viện danh tiếng nơi người ta học cách phục vụ và "slay".', emoji: '🎓' },
            conditions: { magicAffinity: { min: 8 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Bệnh viện Barbz của Nicki', description: 'Một nơi dành cho những khi bạn đã "slay" quá gần mặt trời.', emoji: '🏥' },
            conditions: { magicAffinity: { min: 7 }, chance: 0.1 } 
        },
         { 
            data: { name: 'Onika Burgers', description: 'Một quán ăn nhanh chỉ bật nhạc của Nicki Minaj. Bánh mì kẹp thịt thì... đáng ngờ.', emoji: '🍔' },
            conditions: { humanPresence: { min: 5 }, chance: 0.2 } 
        },
    ],
    enemies: [
        { data: { type: 'Twink Hung Dữ', emoji: '💅', hp: 35, damage: 12, behavior: 'aggressive', size: 'small', diet: ['Gusher'], satiation: 0, maxSatiation: 1, loot: [{name: 'Gusher', chance: 0.3, quantity: {min: 1, max: 1}}] }, conditions: { chance: 0.6 } },
    ],
};

export const floptropica_en = {
    descriptionTemplates: [
        'You are in a [adjective] and very slay jungle. The air is thick with the smell of [smell] and the sound of distant pop music.',
        'An [adjective] island surrounds you. The [feature] trees shimmer in the strange light. You hear the sound of [sound].',
    ],
    adjectives: ['hot pink', 'sparkling', 'chaotic', 'boujee', 'fashionable'],
    features: ['glitter palm trees', '"yassified" wildflowers', 'a river of energy drinks', 'ruins of a "flop era"'],
    smells: ['cheap perfume', "Jiafei's products", 'fried chicken', 'desperation'],
    sounds: ['screams of "ATE!"', "CupcakKe's music", 'Stan Twitter notifications', 'the sound of flip-flops'],
    NPCs: [
        { 
            data: { 
                name: 'A Panicked Stan', 
                description: 'He seems distressed, furiously scrolling through his phone.', 
                dialogueSeed: 'Desperately needs to find an "Onika Burger Coupon" to prove his loyalty to the Barbz.',
                quest: 'Find the Onika Burger Coupon for me!',
                questItem: { name: 'Onika Burger Coupon', quantity: 1 },
                rewardItems: [{ name: "CupcakKe's Remix", quantity: 1, tier: 3, emoji: '🎶' }]
            },
            conditions: { humanPresence: { min: 2 }, chance: 0.5 } 
        },
    ],
    items: [
        { name: "Jiafei's Pan", conditions: { chance: 0.2 } },
        { name: "Stan Twitter Thread", conditions: { chance: 0.3 } },
        { name: "CupcakKe's Remix", conditions: { chance: 0.1 } },
        { name: "Yass Pill", conditions: { chance: 0.4 } },
        { name: 'Gusher', conditions: { chance: 0.5 } },
        { name: 'Onika Burger Coupon', conditions: { chance: 0.05 } },
    ],
    structures: [
         { 
            data: { name: "Deborah's C.V.N.T. University", description: "A prestigious institution where one learns to serve and slay.", emoji: '🎓' },
            conditions: { magicAffinity: { min: 8 }, chance: 0.1 } 
        },
        { 
            data: { name: "Nicki's Barbz Hospital", description: "A place for when you've slayed too close to the sun.", emoji: '🏥' },
            conditions: { magicAffinity: { min: 7 }, chance: 0.1 } 
        },
         { 
            data: { name: "Onika Burgers", description: "A fast food joint that only plays Nicki Minaj. The burgers are... questionable.", emoji: '🍔' },
            conditions: { humanPresence: { min: 5 }, chance: 0.2 } 
        },
    ],
    enemies: [
        { data: { type: 'Fierce Twink', emoji: '💅', hp: 35, damage: 12, behavior: 'aggressive', size: 'small', diet: ['Gusher'], satiation: 0, maxSatiation: 1, loot: [{name: 'Gusher', chance: 0.3, quantity: {min: 1, max: 1}}] }, conditions: { chance: 0.6 } },
    ],
};
