import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: 'Đèn lồng Gỉ sét', description: 'item_rusty_lantern_desc', emoji: '🏮', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['cave'] },
    { name: 'Chìa khóa Bạc', description: 'item_silver_key_desc', emoji: '🗝️', category: 'Data', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [] },
    { name: 'Trang Nhật ký Bị xé', description: 'item_torn_diary_page_desc', emoji: '📄', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['cave'] },
    { name: 'Ectoplasm', description: 'item_ectoplasm_desc', emoji: '👻', category: 'Material', tier: 3, effects: [], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['cave'] },
];

const structures: Structure[] = [
    { name: 'Đại Sảnh', description: 'structure_grand_foyer_desc', emoji: '🚪', providesShelter: true, buildable: false },
    { name: 'Thư viện Bụi bặm', description: 'structure_dusty_library_desc', emoji: '📚', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 10 }, heatValue: -1 },
];

const skill1: Skill = { name: 'skillFireballName', description: 'skillFireballDesc', tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };


const concepts: WorldConcept[] = [
    {
        worldName: "worldName_blackwoodManor", initialNarrative: 'mansion_narrative1', startingBiome: 'cave', // Using 'cave' to represent dark, indoor spaces
        playerInventory: [ { name: "Đèn lồng Gỉ sét", quantity: 1 }, { name: "Trang Nhật ký Bị xé", quantity: 1 } ],
        initialQuests: [ 'mansion_quest1', 'mansion_quest2' ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: "worldName_blackwoodManor", initialNarrative: 'mansion_narrative2', startingBiome: 'cave',
        playerInventory: [ { name: "Chìa khóa Bạc", quantity: 1 } ],
        initialQuests: [ 'mansion_quest3' ], startingSkill: skill2, customStructures: structures
    },
];

export const hauntedMansionWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
