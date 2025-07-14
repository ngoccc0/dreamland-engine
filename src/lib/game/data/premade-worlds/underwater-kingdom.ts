import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: { en: 'Bioluminescent Pearl', vi: 'Ngọc trai Phát quang' }, description: { en: 'item_bioluminescent_pearl_desc', vi: 'item_bioluminescent_pearl_desc' }, emoji: '💡', category: 'Material', tier: 2, effects: [], baseQuantity: { min: 1, max: 3 }, spawnEnabled: false },
    { name: { en: 'Coral Spear', vi: 'Giáo San hô' }, description: { en: 'item_coral_spear_desc', vi: 'item_coral_spear_desc' }, emoji: '🔱', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 5 }, spawnEnabled: false },
    { name: { en: 'Algae Salve', vi: 'Thuốc mỡ Tảo biển' }, description: { en: 'item_algae_salve_desc', vi: 'item_algae_salve_desc' }, emoji: '🌿', category: 'Support', tier: 1, effects: [{ type: 'HEAL', amount: 20 }, { type: 'RESTORE_MANA', amount: 2 }], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { name: { en: 'Ancient Tablet Fragment', vi: 'Mảnh Bia đá Cổ' }, description: { en: 'item_ancient_tablet_fragment_desc', vi: 'item_ancient_tablet_fragment_desc' }, emoji: '📜', category: 'Data', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Coral Palace', vi: 'Cung điện San hô' }, description: { en: 'structure_coral_palace_desc', vi: 'structure_coral_palace_desc' }, emoji: '🏰', providesShelter: true, buildable: false, restEffect: { hp: 20, stamina: 20 }, heatValue: 0 },
    { name: { en: 'Sunken Temple', vi: 'Ngôi đền Chìm' }, description: { en: 'structure_sunken_temple_desc', vi: 'structure_sunken_temple_desc' }, emoji: '🏛️', providesShelter: true, buildable: false },
    { name: { en: 'Hydrothermal Vent', vi: 'Miệng phun Thủy nhiệt' }, description: { en: 'structure_hydrothermal_vent_desc', vi: 'structure_hydrothermal_vent_desc' }, emoji: '💨', providesShelter: false, buildable: false, heatValue: 5 },
];

const skill1: Skill = { name: { en: 'skillHealName', vi: 'skillHealName' }, description: { en: 'skillHealDesc', vi: 'skillHealDesc' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: { en: 'skillLifeSiphonName', vi: 'skillLifeSiphonName' }, description: { en: 'skillLifeSiphonDesc', vi: 'skillLifeSiphonDesc' }, tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };

const concepts: WorldConcept[] = [
    {
        worldName: { en: "worldName_abyssalKingdom", vi: "worldName_abyssalKingdom" }, initialNarrative: { en: 'underwater_narrative1', vi: 'underwater_narrative1' }, startingBiome: 'underwater',
        playerInventory: [ { name: "Giáo San hô", quantity: 1 }, { name: "Thuốc mỡ Tảo biển", quantity: 1 } ],
        initialQuests: [ { en: 'underwater_quest1', vi: 'underwater_quest1' }, { en: 'underwater_quest2', vi: 'underwater_quest2' } ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: { en: "worldName_abyssalKingdom", vi: "worldName_abyssalKingdom" }, initialNarrative: { en: 'underwater_narrative2', vi: 'underwater_narrative2' }, startingBiome: 'underwater',
        playerInventory: [ { name: "Ngọc trai Phát quang", quantity: 2 }, { name: "Mảnh Bia đá Cổ", quantity: 1 } ],
        initialQuests: [ { en: 'underwater_quest3', vi: 'underwater_quest3' } ], startingSkill: skill2, customStructures: structures
    },
];

export const underwaterKingdomWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
