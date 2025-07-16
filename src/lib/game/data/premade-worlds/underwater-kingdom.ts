
/**
 * @fileOverview Defines all unique assets for the "Underwater Kingdom" premade world.
 * @description This file contains the item, structure, and starting scenario definitions
 * for a world set beneath the ocean. Items here are marked with `spawnEnabled: false`
 * to prevent them from appearing in other, drier game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { id: 'bioluminescent_pearl', name: { en: 'Bioluminescent Pearl', vi: 'Ngọc trai Phát quang' }, description: { en: 'A pearl that emits a soft, calming blue light.', vi: 'Một viên ngọc trai phát ra ánh sáng xanh lam dịu nhẹ, êm dịu.' }, emoji: '💡', category: 'Material', tier: 2, effects: [], baseQuantity: { min: 1, max: 3 }, spawnEnabled: false },
    { id: 'coral_spear', name: { en: 'Coral Spear', vi: 'Giáo San hô' }, description: { en: 'A spear tipped with sharpened, hardened coral.', vi: 'Một cây giáo được bịt đầu bằng san hô cứng và sắc nhọn.' }, emoji: '🔱', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 5 }, spawnEnabled: false },
    { id: 'algae_salve', name: { en: 'Algae Salve', vi: 'Thuốc mỡ Tảo biển' }, description: { en: 'A soothing balm made from deep-sea algae. Has healing properties.', vi: 'Một loại thuốc mỡ làm dịu da được làm từ tảo biển sâu. Có đặc tính chữa bệnh.' }, emoji: '🌿', category: 'Support', tier: 1, effects: [{ type: 'HEAL', amount: 20 }, { type: 'RESTORE_MANA', amount: 2 }], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { id: 'ancient_tablet_fragment', name: { en: 'Ancient Tablet Fragment', vi: 'Mảnh Bia đá Cổ' }, description: { en: 'A piece of a stone tablet covered in ancient, glowing runes.', vi: 'Một mảnh của một tấm bia đá được bao phủ bởi những chữ rune cổ xưa, phát sáng.' }, emoji: '📜', category: 'Data', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Coral Palace', vi: 'Cung điện San hô' }, description: { en: 'A breathtaking palace grown from living coral.', vi: 'Một cung điện ngoạn mục được xây dựng từ san hô sống.' }, emoji: '🏰', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 20, stamina: 20, mana: 0 }, heatValue: 0 },
    { name: { en: 'Sunken Temple', vi: 'Ngôi đền Chìm' }, description: { en: 'A temple dedicated to an old sea god, now lost to the depths.', vi: 'Một ngôi đền dành riêng cho một vị thần biển cũ, giờ đã bị chôn vùi dưới đáy sâu.' }, emoji: '🏛️', providesShelter: true, buildable: false, buildCost: [], restEffect: undefined, heatValue: 0 },
    { name: { en: 'Hydrothermal Vent', vi: 'Miệng phun Thủy nhiệt' }, description: { en: 'A fissure in the seabed that spews hot, mineral-rich water.', vi: 'Một khe nứt dưới đáy biển phun ra nước nóng, giàu khoáng chất.' }, emoji: '💨', providesShelter: false, buildable: false, buildCost: [], restEffect: undefined, heatValue: 5 },
];

const skill1: Skill = { name: { en: 'Heal', vi: 'Chữa lành' }, description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: { en: 'Life Siphon', vi: 'Hút sinh lực' }, description: { en: 'Deal magic damage and heal for 50% of the damage dealt.', vi: 'Gây sát thương phép và hồi máu bằng 50% sát thương gây ra.' }, tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };

const concepts: WorldConcept[] = [
    {
        worldName: "worldName_abyssalKingdom", initialNarrative: 'underwater_narrative1', startingBiome: 'underwater',
        playerInventory: [ { name: {en: "Coral Spear", vi: "Giáo San hô"}, quantity: 1, tier: 2, emoji: '🔱' }, { name: {en: "Algae Salve", vi: "Thuốc mỡ Tảo biển"}, quantity: 1, tier: 1, emoji: '🌿' } ],
        initialQuests: [ 'underwater_quest1', 'underwater_quest2' ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: "worldName_abyssalKingdom", initialNarrative: 'underwater_narrative2', startingBiome: 'underwater',
        playerInventory: [ { name: {en: "Bioluminescent Pearl", vi: "Ngọc trai Phát quang"}, quantity: 2, tier: 2, emoji: '💡' }, { name: {en: "Ancient Tablet Fragment", vi: "Mảnh Bia đá Cổ"}, quantity: 1, tier: 3, emoji: '📜' } ],
        initialQuests: [ 'underwater_quest3' ], startingSkill: skill2, customStructures: structures
    },
];

export const underwaterKingdomWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
