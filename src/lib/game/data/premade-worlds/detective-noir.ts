
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept, ItemDefinition } from '@/lib/game/types';

const items: ItemDefinition[] = [
    { name: { en: 'Trench Coat', vi: 'Áo Khoác Trench' }, description: 'item_trench_coat_desc', emoji: '🧥', category: 'Equipment', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'armor', attributes: { physicalDefense: 3 } },
    { name: { en: 'Magnifying Glass', vi: 'Kính Lúp' }, description: 'item_magnifying_glass_desc', emoji: '🔎', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 } },
    { name: { en: 'Old Revolver', vi: 'Khẩu Súng Lục Cũ' }, description: 'item_old_revolver_desc', emoji: '🔫', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 6, critChance: 3 } },
    { name: { en: 'Case File', vi: 'Hồ Sơ Vụ Án' }, description: 'item_case_file_desc', emoji: '📂', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 } },
    { name: { en: 'Synth-Whiskey', vi: 'Rượu Synth-Whiskey' }, description: 'item_synth_whiskey_desc', emoji: '🥃', category: 'Support', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }], baseQuantity: { min: 1, max: 1 } },
];

const structures: Structure[] = [
    { name: { en: 'Gumshoe Office', vi: 'Văn phòng Thám tử' }, description: 'structure_gumshoe_office_desc', emoji: '🏢', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 30 }, heatValue: 1 },
    { name: { en: 'Neon Dragon Bar', vi: 'Quán Bar Rồng Neon' }, description: 'structure_neon_dragon_bar_desc', emoji: '🍻', providesShelter: true, buildable: false, restEffect: { hp: 5, stamina: 10 }, heatValue: 1 },
];

const skill1: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: 'skillLifeSiphonName', description: 'skillLifeSiphonDesc', tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };


const concepts: WorldConcept[] = [
    {
        worldName: "worldName_rainyCity", initialNarrative: 'detective_narrative1', startingBiome: 'city',
        playerInventory: [ { name: "Trench Coat", quantity: 1 }, { name: "Case File", quantity: 1 } ],
        initialQuests: [ 'detective_quest1', 'detective_quest2' ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: "worldName_rainyCity", initialNarrative: 'detective_narrative1', startingBiome: 'city',
        playerInventory: [ { name: "Old Revolver", quantity: 1 }, { name: "Synth-Whiskey", quantity: 2 } ],
        initialQuests: [ 'detective_quest1', 'detective_quest2' ], startingSkill: skill2, customStructures: structures
    },
];

export const detectiveNoirWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts,
};
