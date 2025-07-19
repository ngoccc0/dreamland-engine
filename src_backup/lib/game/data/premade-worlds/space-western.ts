
/**
 * @fileOverview Defines all unique assets for the "Space Western" premade world.
 * @description This file contains the item, structure, and starting scenario definitions
 * for a sci-fi western world. Items here are marked with `spawnEnabled: false`
 * to prevent them from appearing in other, less futuristic game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { id: 'laser_revolver', name: { en: 'Laser Revolver', vi: 'Súng lục Laser' }, description: { en: 'A reliable six-shot laser pistol. Standard issue for any gunslinger on the outer rim.', vi: 'Một khẩu súng lục laser sáu phát đáng tin cậy. Trang bị tiêu chuẩn cho bất kỳ tay súng nào ở vành đai ngoài.' }, emoji: '🔫', category: 'Weapon', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 8, critChance: 5 }, spawnEnabled: false },
    { id: 'spice_infused_water', name: { en: 'Spice-Infused Water', vi: 'Nước tẩm Gia vị' }, description: { en: 'Water infused with the mysterious local spice. Highly refreshing.', vi: 'Nước được pha với loại gia vị bí ẩn của địa phương. Rất sảng khoái.' }, emoji: '💧', category: 'Support', tier: 2, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }, { type: 'RESTORE_MANA', amount: 5 }], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'sandworm_tooth', name: { en: 'Sandworm Tooth', vi: 'Răng Giun cát' }, description: { en: 'A massive tooth from one of the planet\'s apex predators. A valuable trophy.', vi: 'Một chiếc răng khổng lồ từ một trong những kẻ săn mồi đỉnh cao của hành tinh. Một chiến lợi phẩm có giá trị.' }, emoji: '🦷', category: 'Material', tier: 5, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'bounty_puck', name: { en: 'Bounty Puck', vi: 'Chip Tiền thưởng' }, description: { en: 'A small holographic puck displaying your latest bounty. The target is local.', vi: 'Một chiếc đĩa ba chiều nhỏ hiển thị tiền thưởng mới nhất của bạn. Mục tiêu ở địa phương.' }, emoji: '💿', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'scrap_metal', name: { en: 'Scrap Metal', vi: 'Kim loại phế liệu' }, description: { en: 'Assorted pieces of discarded metal. Useful for repairs or crafting.', vi: 'Các mảnh kim loại bỏ đi. Hữu ích cho việc sửa chữa hoặc chế tạo.' }, emoji: '🔩', category: 'Material', tier: 1, effects: [], baseQuantity: { min: 2, max: 5 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Dusty Saloon', vi: 'Quán rượu Bụi bặm' }, description: { en: 'A classic saloon with swinging doors, a gruff bartender, and questionable clientele.', vi: 'Một quán rượu cổ điển với cửa xoay, một người pha chế cộc cằn và những khách hàng đáng ngờ.' }, emoji: '🍺', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 5, stamina: 15, mana: 0 }, heatValue: 0 },
    { name: { en: "Sheriff's Office", vi: 'Văn phòng Cảnh sát trưởng' }, description: { en: 'A small, fortified building. The only law in this town.', vi: 'Một tòa nhà nhỏ, được gia cố. Luật pháp duy nhất trong thị trấn này.' }, emoji: '⭐', providesShelter: true, buildable: false, buildCost: [], restEffect: undefined, heatValue: 0 },
    { name: { en: 'Crashed Freighter', vi: 'Xác tàu chở hàng' }, description: { en: 'The wreckage of a cargo ship, now a haven for scavengers and worse.', vi: 'Xác của một con tàu chở hàng, giờ là thiên đường cho những kẻ nhặt rác và những thứ tồi tệ hơn.' }, emoji: '🚀', providesShelter: true, buildable: false, buildCost: [], restEffect: undefined, heatValue: 0 },
];

const skill1: Skill = { name: { en: 'Heal', vi: 'Chữa lành' }, description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: { en: 'Fireball', vi: 'Quả cầu lửa' }, description: { en: 'Launch a fireball at an enemy, dealing magic damage.', vi: 'Phóng một quả cầu lửa vào kẻ thù, gây sát thương phép.' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };

const concepts: WorldConcept[] = [
    {
        worldName: { en: "The Crimson Sands of Kepler-186f", vi: "Cát đỏ của Kepler-186f" },
        initialNarrative: { en: "You're a lone bounty hunter on the desolate planet Kepler-186f, a laser revolver your only friend. Your latest bounty puck points to a notorious outlaw hiding in the endless desert. Justice, or credits, await.", vi: "Bạn là một thợ săn tiền thưởng đơn độc trên hành tinh hoang vắng Kepler-186f, khẩu súng lục laser là người bạn duy nhất của bạn. Chip tiền thưởng mới nhất của bạn chỉ đến một tên tội phạm khét tiếng đang ẩn náu trong sa mạc vô tận. Công lý, hoặc tín dụng, đang chờ đợi." },
        startingBiome: 'desert',
        playerInventory: [
            { name: {en: "Laser Revolver", vi: "Súng lục Laser"}, quantity: 1, tier: 3, emoji: '🔫' },
            { name: {en: "Bounty Puck", vi: "Chip Tiền thưởng"}, quantity: 1, tier: 1, emoji: '💿' }
        ],
        initialQuests: [
            { en: "Track down and apprehend 'Whispering Jack'.", vi: "Truy lùng và bắt giữ 'Whispering Jack'." },
            { en: "Earn enough credits for a ticket off this rock.", vi: "Kiếm đủ tín dụng để mua vé rời khỏi hành tinh này." }
        ],
        startingSkill: skill1,
        customStructures: structures
    },
    {
        worldName: { en: "Mesa of the Sky Drifters", vi: "Mesa của những kẻ lang thang trên bầu trời" },
        initialNarrative: { en: "Perched atop a towering mesa, you gaze upon the vast, alien landscape. Your canteen, filled with spice-infused water, is a precious commodity. Explore the floating islands and ancient ruins, but beware the sky pirates.", vi: "Đứng trên một mesa cao chót vót, bạn nhìn ngắm cảnh quan rộng lớn, xa lạ. Bình nước của bạn, chứa đầy nước tẩm gia vị, là một món hàng quý giá. Khám phá những hòn đảo nổi và tàn tích cổ xưa, nhưng hãy cẩn thận với những tên cướp bầu trời." },
        startingBiome: 'mesa',
        playerInventory: [
            { name: {en: "Spice-Infused Water", vi: "Nước tẩm Gia vị"}, quantity: 3, tier: 2, emoji: '💧' },
            { name: {en: "Scrap Metal", vi: "Kim loại phế liệu"}, quantity: 5, tier: 1, emoji: '🔩' }
        ],
        initialQuests: [
            { en: "Find a way to descend the mesa safely.", vi: "Tìm cách xuống mesa an toàn." },
            { en: "Locate a hidden sky pirate outpost.", vi: "Xác định vị trí một tiền đồn cướp bầu trời ẩn giấu." }
        ],
        startingSkill: skill2,
        customStructures: structures
    },
    {
        worldName: { en: "The Maw of the Sandworm", vi: "Hàm của Giun cát" },
        initialNarrative: { en: "You've crash-landed in a volcanic wasteland, the ground trembling with unseen giants. A massive sandworm tooth, a grim souvenir, is all you have left. Can you survive the tremors and escape the planet's most dangerous predators?", vi: "Bạn đã hạ cánh khẩn cấp xuống một vùng đất hoang núi lửa, mặt đất rung chuyển với những gã khổng lồ vô hình. Một chiếc răng giun cát khổng lồ, một món quà lưu niệm nghiệt ngã, là tất cả những gì bạn còn lại. Bạn có thể sống sót qua những trận động đất và thoát khỏi những kẻ săn mồi nguy hiểm nhất hành tinh không?" },
        startingBiome: 'volcanic',
        playerInventory: [
            { name: {en: "Sandworm Tooth", vi: "Răng Giun cát"}, quantity: 1, tier: 5, emoji: '🦷' },
            { name: {en: "Laser Revolver", vi: "Súng lục Laser"}, quantity: 1, tier: 3, emoji: '🔫' }
        ],
        initialQuests: [
            { en: "Find a way to signal for rescue.", vi: "Tìm cách báo hiệu cứu hộ." },
            { en: "Avoid or defeat the colossal sandworms.", vi: "Tránh hoặc đánh bại những con giun cát khổng lồ." }
        ],
        startingSkill: skill1,
        customStructures: structures
    }
];

export const spaceWesternWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
