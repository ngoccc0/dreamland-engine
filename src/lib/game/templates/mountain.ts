
import { structureDefinitions } from "../structures";
import { naturePlusMountainEnemies } from "./modded/nature_plus";
import type { TranslationKey } from "@/lib/i18n";

export const mountain_vi = {
    descriptionTemplates: {
        short: ["Bạn đang leo lên một sườn núi [adjective]."],
        medium: ["Bạn đang leo lên một sườn núi [adjective]. Gió [sound] mạnh và lạnh buốt, không khí loãng dần. {sensory_details} {entity_report}"],
        long: ["Những đỉnh núi [adjective] nhọn hoắt chọc thủng bầu trời [sky]. Bạn ngửi thấy mùi [smell] của đá lạnh và nghe tiếng gió [sound]. Một dòng sông băng [feature] chảy xuống từ trên cao, tạo ra một cảnh tượng hùng vĩ nhưng cũng đầy nguy hiểm. {sensory_details} {entity_report} {surrounding_peek}"]
    },
    adjectives: ['hiểm trở', 'lộng gió', 'hùng vĩ', 'tuyết phủ', 'trơ trọi', 'cô độc'],
    features: ['vách đá', 'tuyết', 'hang động', 'dòng sông băng', 'mỏm đá', 'thác nước đóng băng'],
    sounds: ['gió rít', 'đá lở', 'tiếng đại bàng kêu', 'sự tĩnh lặng', 'tiếng tuyết lở xa'],
    smells: ['không khí lạnh', 'đá ẩm', 'mùi tuyết', 'khoáng chất', 'sự trong lành'],
    sky: ['xanh thẳm', 'xám xịt', 'trong vắt'],
    NPCs: [
        { 
            data: { name: 'Thợ mỏ già' as TranslationKey, description: 'Một người lùn gân guốc với bộ râu được tết gọn gàng, tay cầm chiếc cuốc chim.' as TranslationKey, dialogueSeed: 'Một người thợ mỏ càu nhàu, phàn nàn về việc các mạch khoáng sản ngày càng khó tìm.' as TranslationKey },
            conditions: { humanPresence: { min: 3 }, elevation: { min: 7 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Người cưỡi griffon' as TranslationKey, description: 'Một chiến binh mặc áo giáp sáng bóng, đứng cạnh một sinh vật griffon uy nghi.' as TranslationKey, dialogueSeed: 'Một hiệp sĩ cao ngạo, chỉ nói chuyện với những người mà họ cho là xứng đáng.' as TranslationKey },
            conditions: { magicAffinity: { min: 6 }, elevation: { min: 9 }, chance: 0.02 } 
        }
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
        { name: 'Trứng Đại Bàng', conditions: { elevation: { min: 8 }, chance: 0.1 } }
    ],
    structures: [
        structureDefinitions['abandoned_mine_entrance'],
        structureDefinitions['floating_island']
    ],
    enemies: [
        {
            data: {
                type: 'Cây Gỗ Núi',
                emoji: '🌲',
                hp: 40,
                damage: 0,
                behavior: 'immobile',
                size: 'large',
                diet: [],
                satiation: 0,
                maxSatiation: 0,
                harvestable: {
                    difficulty: 2,
                    requiredTool: 'Rìu Đá Đơn Giản',
                    loot: [
                        { name: 'Lõi Gỗ', chance: 1.0, quantity: { min: 3, max: 5 } },
                    ]
                },
            },
            conditions: { chance: 0.6, elevation: { min: 4 } }
        },
        { data: { type: 'Dê núi hung hãn', emoji: '🐐', hp: 50, damage: 15, behavior: 'defensive', size: 'medium', diet: ['Cây Thuốc Núi', 'Hoa Dại'], satiation: 0, maxSatiation: 3, loot: [{name: 'Sừng Dê Núi', chance: 0.4, quantity: {min: 1, max: 2}}, {name: 'Thịt Dê Núi', chance: 0.7, quantity: {min: 1, max: 2}}] }, conditions: { elevation: { min: 7 }, chance: 0.4 } },
        { data: { type: 'Người đá', emoji: '🗿', hp: 80, damage: 10, behavior: 'defensive', size: 'large', diet: ['Quặng Sắt', 'Pha Lê Núi'], satiation: 0, maxSatiation: 1, loot: [{name: 'Lõi Người Đá', chance: 0.1, quantity: {min: 1, max: 1}}, {name: 'Đá Cuội', chance: 0.25, quantity: {min: 2, max: 3}}] }, conditions: { magicAffinity: { min: 6 }, elevation: { min: 8 }, chance: 0.2 } },
        { data: { type: 'Harpie', emoji: '🦅', hp: 45, damage: 18, behavior: 'aggressive', size: 'medium', diet: ['Dê núi hung hãn', 'Thỏ hoang hung dữ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Lông Harpie', chance: 0.5, quantity: {min: 3, max: 6}}] }, conditions: { elevation: { min: 9 }, windLevel: { min: 7 }, chance: 0.25 } },
        { data: { type: 'Báo tuyết', emoji: '🐆', hp: 60, damage: 20, behavior: 'aggressive', size: 'large', diet: ['Dê núi hung hãn'], satiation: 0, maxSatiation: 2, loot: [{name: 'Da Báo Tuyết', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Thịt Báo Tuyết', chance: 0.6, quantity: {min: 1, max: 2}}] }, conditions: { predatorPresence: { min: 7 }, temperature: { max: 3 }, chance: 0.15 } },
        ...naturePlusMountainEnemies
    ]
};

export const mountain_en = {
    ...mountain_vi,
};
