
/**
 * @fileOverview Defines all unique assets for the "Generation Ship" premade world.
 * @description This file contains the item, structure, and starting scenario definitions
 * for a sci-fi world set on a vast, silent starship. Items here are marked with 
 * `spawnEnabled: false` to prevent them from appearing in other, non-sci-fi game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { id: 'maintenance_wrench', name: { en: 'Maintenance Wrench', vi: 'Cờ lê Bảo trì' }, description: { en: 'A heavy, all-purpose wrench. Can be used for repairs or for cracking skulls.', vi: 'Một chiếc cờ lê nặng, đa năng. Có thể dùng để sửa chữa hoặc để đập đầu.' }, emoji: '🔧', category: 'Weapon', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 3 }, spawnEnabled: false },
    { id: 'keycard_level_1', name: { en: 'Keycard Level 1', vi: 'Thẻ khóa Cấp 1' }, description: { en: 'A standard issue keycard. Grants access to common areas.', vi: 'Một thẻ khóa tiêu chuẩn. Cấp quyền truy cập vào các khu vực chung.' }, emoji: '💳', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'nutrient_paste', name: { en: 'Nutrient Paste', vi: 'Bột Dinh dưỡng' }, description: { en: 'A tube of beige paste. Tasteless, but provides all necessary nutrients.', vi: 'Một tuýp bột nhão màu be. Vô vị, nhưng cung cấp tất cả các chất dinh dưỡng cần thiết.' }, emoji: '🧪', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }], baseQuantity: { min: 2, max: 4 }, spawnEnabled: false },
    { id: 'engineers_log', name: { en: "Engineer's Log", vi: 'Nhật ký Kỹ sư' }, description: { en: 'A datapad containing the last log of a ship\'s engineer. It mentions strange readings from the AI core.', vi: 'Một máy tính bảng chứa nhật ký cuối cùng của một kỹ sư trên tàu. Nó đề cập đến những chỉ số kỳ lạ từ lõi AI.' }, emoji: '📋', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'laser_cutter', name: { en: 'Laser Cutter', vi: 'Máy cắt Laser' }, description: { en: 'A powerful tool that can cut through reinforced doors... or enemies.', vi: 'Một công cụ mạnh mẽ có thể cắt xuyên qua các cánh cửa được gia cố... hoặc kẻ thù.' }, emoji: '✨', category: 'Tool', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Cryo Bay', vi: 'Khoang Ngủ đông' }, description: { en: 'Rows of cryo-pods stand silently. Yours is the only one that is open.', vi: 'Những hàng kén ngủ đông đứng im lặng. Của bạn là cái duy nhất đang mở.' }, emoji: '🛌', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 10 }, heatValue: 0 },
    { name: { en: 'Bridge', vi: 'Phòng Điều khiển' }, description: { en: 'The command center of the ship. All screens are dark, except for a single, blinking red light.', vi: 'Trung tâm chỉ huy của con tàu. Tất cả các màn hình đều tối đen, ngoại trừ một đèn đỏ nhấp nháy duy nhất.' }, emoji: '🖥️', providesShelter: true, buildable: false },
    { name: { en: 'Hydroponics Bay', vi: 'Khu Thủy canh' }, description: { en: 'A vast greenhouse, now overgrown and wild. The plants are the only living things you have seen.', vi: 'Một nhà kính rộng lớn, giờ đã mọc um tùm và hoang dại. Cây cối là sinh vật sống duy nhất bạn nhìn thấy.' }, emoji: '🌱', providesShelter: false, buildable: false },
];

const skill1: Skill = { name: { en: 'Heal', vi: 'Chữa lành' }, description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: { en: 'Fireball', vi: 'Quả cầu lửa' }, description: { en: 'Launch a fireball at an enemy, dealing magic damage.', vi: 'Phóng một quả cầu lửa vào kẻ thù, gây sát thương phép.' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };

const concepts: WorldConcept[] = [
    {
        worldName: "worldName_theWanderer", initialNarrative: 'genship_narrative1', startingBiome: 'space_station',
        playerInventory: [ { name: "Maintenance Wrench", quantity: 1 }, { name: "Nutrient Paste", quantity: 2 } ],
        initialQuests: [ 'genship_quest1', 'genship_quest2' ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: "worldName_theWanderer", initialNarrative: 'genship_narrative1', startingBiome: 'space_station',
        playerInventory: [ { name: "Engineer's Log", quantity: 1 }, { name: "Keycard Level 1", quantity: 1 } ],
        initialQuests: [ 'genship_quest3', 'genship_quest4' ], startingSkill: skill2, customStructures: structures
    },
];

export const generationShipWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
