
import { structureDefinitions } from "../structures";

export const cave_vi = {
    descriptionTemplates: {
        short: ["Bạn đang ở trong một hang động [adjective]."],
        medium: ["Một hang động [adjective] với những [feature] kỳ lạ. Không khí có mùi [smell] và bạn nghe thấy tiếng [sound] vang vọng. {sensory_details} {entity_report}"],
        long: ["Không gian [adjective] của hang động bao trùm lấy bạn. Những [feature] tạo nên những hình thù kỳ quái trong bóng tối. Không khí có mùi [smell] và tiếng [sound] khiến bạn cảm thấy vừa tò mò vừa sợ hãi. {sensory_details} {entity_report} {surrounding_peek}"]
    },
    adjectives: ['sâu thẳm', 'lạnh lẽo', 'bí ẩn', 'chằng chịt', 'tối đen', 'âm u'],
    features: ['thạch nhũ', 'tinh thể', 'dòng sông ngầm', 'tranh vẽ cổ', 'mạng nhện', 'đống xương'],
    smells: ['đất ẩm', 'nước tù', 'khoáng chất', 'lưu huỳnh', 'mùi phân dơi'],
    sounds: ['tiếng nước nhỏ giọt', 'tiếng vang', 'tiếng dơi kêu', 'sự im lặng nặng nề', 'tiếng đá lạo xạo'],
    sky: [],
    NPCs: [
        { 
            data: { name: 'Nhà thám hiểm bị lạc', description: 'Một người với trang bị cũ kỹ, đang tuyệt vọng vẽ bản đồ lên tường.', dialogueSeed: 'Một người thông minh nhưng đang hoảng loạn, nói nhanh và liên tục hỏi về đường ra.' },
            conditions: { humanPresence: { min: 2, max: 3 }, chance: 0.1 } 
        },
        { 
            data: { name: 'Thủ lĩnh Goblin', description: 'Một con goblin to lớn hơn đồng loại, ngồi trên một chiếc ngai bằng xương.', dialogueSeed: 'Một thủ lĩnh goblin xảo quyệt và hung hăng, nói bằng một ngôn ngữ kỳ lạ nhưng có thể hiểu được qua cử chỉ.' },
            conditions: { humanPresence: { min: 4 }, dangerLevel: { min: 8 }, chance: 0.2 } 
        }
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
        { name: 'Mảnh Xương', conditions: { chance: 0.3 } }
    ],
    structures: [
        { 
            data: structureDefinitions['Cửa hầm mỏ bỏ hoang'],
            conditions: { dangerLevel: { min: 8 }, chance: 0.15 } 
        }
    ],
    enemies: [
        { data: { type: 'Dơi khổng lồ', emoji: '🦇', hp: 25, damage: 10, behavior: 'passive', size: 'small', diet: ['Nhện hang'], satiation: 0, maxSatiation: 2, loot: [{name: 'Cánh Dơi', chance: 0.6, quantity: {min: 1, max: 2}}, {name: 'Guano (Phân dơi)', chance: 0.2, quantity: {min: 1, max: 2}}] }, conditions: { lightLevel: { max: -2 }, chance: 0.5 } },
        { data: { type: 'Nhện hang', emoji: '🕷️', hp: 45, damage: 15, behavior: 'territorial', size: 'medium', diet: ['Dơi khổng lồ'], satiation: 0, maxSatiation: 2, loot: [{name: 'Nọc Độc Nhện Hang', chance: 0.3, quantity: {min: 1, max: 1}}, {name: 'Túi Trứng Nhện', chance: 0.08, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 8 }, chance: 0.4 } },
        { data: { type: 'Slime', emoji: '💧', hp: 30, damage: 8, behavior: 'passive', size: 'small', diet: ['Mảnh Tinh Thể', 'Rêu Phát Sáng'], satiation: 0, maxSatiation: 3, loot: [{name: 'Chất nhờn Slime', chance: 0.7, quantity: {min: 1, max: 3}}] }, conditions: { moisture: { min: 8 }, chance: 0.3 } },
        { data: { type: 'Sâu Bò Khổng Lồ', emoji: '🐛', hp: 100, damage: 20, behavior: 'defensive', size: 'large', diet: ['Người đá'], satiation: 0, maxSatiation: 1, loot: [{name: 'Răng Sâu Bò', chance: 0.15, quantity: {min: 1, max: 1}}] }, conditions: { dangerLevel: { min: 9 }, chance: 0.15 } }
    ]
};

export const cave_en = {
    ...cave_vi,
};
