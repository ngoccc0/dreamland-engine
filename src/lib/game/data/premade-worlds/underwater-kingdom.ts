import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: 'Ngọc trai Phát quang', description: 'item_bioluminescent_pearl_desc', emoji: '💡', category: 'Material', tier: 2, effects: [], baseQuantity: { min: 1, max: 3 }, spawnBiomes: ['underwater', 'ocean'] },
    { name: 'Giáo San hô', description: 'item_coral_spear_desc', emoji: '🔱', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], equipmentSlot: 'weapon', attributes: { physicalAttack: 5 } },
    { name: 'Thuốc mỡ Tảo biển', description: 'item_algae_salve_desc', emoji: '🌿', category: 'Support', tier: 1, effects: [{ type: 'HEAL', amount: 20 }], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['underwater'] },
    { name: 'Mảnh Bia đá Cổ', description: 'item_ancient_tablet_fragment_desc', emoji: '📜', category: 'Data', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['underwater'] },
];

const structures: Structure[] = [
    { name: 'Cung điện San hô', description: 'structure_coral_palace_desc', emoji: '🏰', providesShelter: true, buildable: false, restEffect: { hp: 20, stamina: 20 }, heatValue: 0 },
    { name: 'Ngôi đền Chìm', description: 'structure_sunken_temple_desc', emoji: '🏛️', providesShelter: true, buildable: false },
    { name: 'Miệng phun Thủy nhiệt', description: 'structure_hydrothermal_vent_desc', emoji: '💨', providesShelter: false, buildable: false, heatValue: 5 },
];

const startingSkill: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };

const concepts: WorldConcept[] = [
    {
        worldName: "Vương quốc Abyssal", initialNarrative: 'underwater_narrative1', startingBiome: 'underwater',
        playerInventory: [ { name: "Giáo San hô", quantity: 1 }, { name: "Thuốc mỡ Tảo biển", quantity: 1 } ],
        initialQuests: [ 'underwater_quest1', 'underwater_quest2' ], startingSkill: startingSkill, customStructures: structures, customItemCatalog: items
    },
];

export const underwaterKingdomWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
