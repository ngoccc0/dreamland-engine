import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept, ItemDefinition } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: { en: 'Trench Coat', vi: 'Áo Khoác Trench' }, description: { en: 'item_trench_coat_desc', vi: 'item_trench_coat_desc' }, emoji: '🧥', category: 'Armor', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'armor', attributes: { physicalDefense: 3 }, spawnEnabled: false },
    { name: { en: 'Magnifying Glass', vi: 'Kính Lúp' }, description: { en: 'item_magnifying_glass_desc', vi: 'item_magnifying_glass_desc' }, emoji: '🔎', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Old Revolver', vi: 'Khẩu Súng Lục Cũ' }, description: { en: 'item_old_revolver_desc', vi: 'item_old_revolver_desc' }, emoji: '🔫', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 6, critChance: 3 }, spawnEnabled: false },
    { name: { en: 'Case File', vi: 'Hồ Sơ Vụ Án' }, description: { en: 'item_case_file_desc', vi: 'item_case_file_desc' }, emoji: '📂', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Synth-Whiskey', vi: 'Rượu Synth-Whiskey' }, description: { en: 'item_synth_whiskey_desc', vi: 'item_synth_whiskey_desc' }, emoji: '🥃', category: 'Support', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Gumshoe Office', vi: 'Văn phòng Thám tử' }, description: { en: 'structure_gumshoe_office_desc', vi: 'structure_gumshoe_office_desc' }, emoji: '🏢', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 30 }, heatValue: 1 },
    { name: { en: 'Neon Dragon Bar', vi: 'Quán Bar Rồng Neon' }, description: { en: 'structure_neon_dragon_bar_desc', vi: 'structure_neon_dragon_bar_desc' }, emoji: '🍻', providesShelter: true, buildable: false, restEffect: { hp: 5, stamina: 10 }, heatValue: 1 },
];

const skill1: Skill = { name: { en: 'skillHealName', vi: 'skillHealName' }, description: { en: 'skillHealDesc', vi: 'skillHealDesc' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: { en: 'skillLifeSiphonName', vi: 'skillLifeSiphonName' }, description: { en: 'skillLifeSiphonDesc', vi: 'skillLifeSiphonDesc' }, tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };


const concepts: WorldConcept[] = [
    {
        worldName: { en: "worldName_rainyCity", vi: "worldName_rainyCity" }, initialNarrative: { en: 'detective_narrative1', vi: 'detective_narrative1' }, startingBiome: 'city',
        playerInventory: [ { name: "Trench Coat", quantity: 1 }, { name: "Case File", quantity: 1 } ],
        initialQuests: [ { en: 'detective_quest1', vi: 'detective_quest1' }, { en: 'detective_quest2', vi: 'detective_quest2' } ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: { en: "worldName_rainyCity", vi: "worldName_rainyCity" }, initialNarrative: { en: 'detective_narrative1', vi: 'detective_narrative1' }, startingBiome: 'city',
        playerInventory: [ { name: "Old Revolver", quantity: 1 }, { name: "Synth-Whiskey", quantity: 2 } ],
        initialQuests: [ { en: 'detective_quest1', vi: 'detective_quest1' }, { en: 'detective_quest2', vi: 'detective_quest2' } ], startingSkill: skill2, customStructures: structures
    },
];

export const detectiveNoirWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts,
};
