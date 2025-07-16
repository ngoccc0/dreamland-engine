
/**
 * @fileOverview Defines all unique assets for the "Haunted Mansion" premade world.
 * @description This file contains the item, structure, and starting scenario definitions
 * for a horror-themed world. Items here are marked with `spawnEnabled: false`
 * to prevent them from appearing in other, less spooky game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { id: 'rusty_lantern', name: { en: 'Rusty Lantern', vi: 'Đèn lồng Gỉ sét' }, description: { en: 'An old oil lantern. Provides a flickering, unreliable light.', vi: 'Một chiếc đèn lồng dầu cũ kỹ. Cung cấp ánh sáng leo lét, không đáng tin cậy.' }, emoji: '🏮', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'silver_key', name: { en: 'Silver Key', vi: 'Chìa khóa Bạc' }, description: { en: 'A small, ornate silver key. It feels cold to the touch.', vi: 'Một chiếc chìa khóa bạc nhỏ, được trang trí tinh xảo. Cảm giác lạnh khi chạm vào.' }, emoji: '🗝️', category: 'Data', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'torn_diary_page', name: { en: 'Torn Diary Page', vi: 'Trang Nhật ký Bị xé' }, description: { en: "A page torn from a diary. It reads: '...it knows what I'm thinking. The walls... they move...'", vi: "Một trang giấy bị xé từ một cuốn nhật ký. Nó viết: '...nó biết tôi đang nghĩ gì. Những bức tường... chúng di chuyển...'" }, emoji: '📄', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'ectoplasm', name: { en: 'Ectoplasm', vi: 'Ectoplasm' }, description: { en: 'A viscous, supernatural substance left behind by a ghost.', vi: 'Một chất siêu nhiên, nhớt do một con ma để lại.' }, emoji: '👻', category: 'Material', tier: 3, effects: [], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Grand Foyer', vi: 'Đại Sảnh' }, description: { en: 'A large, imposing foyer. The portraits on the walls seem to watch you.', vi: 'Một đại sảnh lớn, hùng vĩ. Những bức chân dung trên tường dường như đang theo dõi bạn.' }, emoji: '🚪', providesShelter: true, buildable: false },
    { name: { en: 'Dusty Library', vi: 'Thư viện Bụi bặm' }, description: { en: 'Rows of books, covered in a thick layer of dust. The air is heavy with the smell of old paper.', vi: 'Những hàng sách, phủ một lớp bụi dày. Không khí nặng mùi giấy cũ.' }, emoji: '📚', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 10 }, heatValue: -1 },
];

const skill1: Skill = { name: { en: 'Fireball', vi: 'Quả cầu lửa' }, description: { en: 'Launch a fireball at an enemy, dealing magic damage.', vi: 'Phóng một quả cầu lửa vào kẻ thù, gây sát thương phép.' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: { en: 'Heal', vi: 'Chữa lành' }, description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };


const concepts: WorldConcept[] = [
    {
        worldName: "worldName_blackwoodManor", initialNarrative: 'mansion_narrative1', startingBiome: 'cave', // Using 'cave' to represent dark, indoor spaces
        playerInventory: [ { name: "Rusty Lantern", quantity: 1 }, { name: "Torn Diary Page", quantity: 1 } ],
        initialQuests: [ 'mansion_quest1', 'mansion_quest2' ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: "worldName_blackwoodManor", initialNarrative: 'mansion_narrative2', startingBiome: 'cave',
        playerInventory: [ { name: "Silver Key", quantity: 1 } ],
        initialQuests: [ 'mansion_quest3' ], startingSkill: skill2, customStructures: structures
    },
];

export const hauntedMansionWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
