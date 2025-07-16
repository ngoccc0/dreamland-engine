
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
        worldName: "worldName_outlawPlanet", initialNarrative: 'western_narrative1', startingBiome: 'desert',
        playerInventory: [ { name: {en: "Laser Revolver", vi: "Súng lục Laser"}, quantity: 1, tier: 3, emoji: '🔫' }, { name: {en: "Bounty Puck", vi: "Chip Tiền thưởng"}, quantity: 1, tier: 1, emoji: '💿' } ],
        initialQuests: [ 'western_quest1', 'western_quest2' ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: "worldName_outlawPlanet", initialNarrative: 'western_narrative2', startingBiome: 'desert',
        playerInventory: [ { name: {en: "Spice-Infused Water", vi: "Nước tẩm Gia vị"}, quantity: 3, tier: 2, emoji: '💧' } ],
        initialQuests: [ 'western_quest3' ], startingSkill: skill2, customStructures: structures
    },
];

export const spaceWesternWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
