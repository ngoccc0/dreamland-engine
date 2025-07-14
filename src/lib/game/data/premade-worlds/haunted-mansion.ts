import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: { en: 'Rusty Lantern', vi: 'Đèn lồng Gỉ sét' }, description: { en: 'item_rusty_lantern_desc', vi: 'item_rusty_lantern_desc' }, emoji: '🏮', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['cave'], spawnEnabled: false },
    { name: { en: 'Silver Key', vi: 'Chìa khóa Bạc' }, description: { en: 'item_silver_key_desc', vi: 'item_silver_key_desc' }, emoji: '🗝️', category: 'Data', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], spawnEnabled: false },
    { name: { en: 'Torn Diary Page', vi: 'Trang Nhật ký Bị xé' }, description: { en: 'item_torn_diary_page_desc', vi: 'item_torn_diary_page_desc' }, emoji: '📄', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['cave'], spawnEnabled: false },
    { name: { en: 'Ectoplasm', vi: 'Ectoplasm' }, description: { en: 'item_ectoplasm_desc', vi: 'item_ectoplasm_desc' }, emoji: '👻', category: 'Material', tier: 3, effects: [], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['cave'], spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Grand Foyer', vi: 'Đại Sảnh' }, description: { en: 'structure_grand_foyer_desc', vi: 'structure_grand_foyer_desc' }, emoji: '🚪', providesShelter: true, buildable: false },
    { name: { en: 'Dusty Library', vi: 'Thư viện Bụi bặm' }, description: { en: 'structure_dusty_library_desc', vi: 'structure_dusty_library_desc' }, emoji: '📚', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 10 }, heatValue: -1 },
];

const skill1: Skill = { name: { en: 'skillFireballName', vi: 'skillFireballName' }, description: { en: 'skillFireballDesc', vi: 'skillFireballDesc' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: { en: 'skillHealName', vi: 'skillHealName' }, description: { en: 'skillHealDesc', vi: 'skillHealDesc' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };


const concepts: WorldConcept[] = [
    {
        worldName: { en: "worldName_blackwoodManor", vi: "worldName_blackwoodManor" }, initialNarrative: { en: 'mansion_narrative1', vi: 'mansion_narrative1' }, startingBiome: 'cave', // Using 'cave' to represent dark, indoor spaces
        playerInventory: [ { name: "Đèn lồng Gỉ sét", quantity: 1 }, { name: "Trang Nhật ký Bị xé", quantity: 1 } ],
        initialQuests: [ { en: 'mansion_quest1', vi: 'mansion_quest1' }, { en: 'mansion_quest2', vi: 'mansion_quest2' } ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: { en: "worldName_blackwoodManor", vi: "worldName_blackwoodManor" }, initialNarrative: { en: 'mansion_narrative2', vi: 'mansion_narrative2' }, startingBiome: 'cave',
        playerInventory: [ { name: "Chìa khóa Bạc", quantity: 1 } ],
        initialQuests: [ { en: 'mansion_quest3', vi: 'mansion_quest3' } ], startingSkill: skill2, customStructures: structures
    },
];

export const hauntedMansionWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
