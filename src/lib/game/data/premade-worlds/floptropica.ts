import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const floptropicaItems: GeneratedItem[] = [
    { name: 'Chảo của Jiafei', description: 'item_jiafei_pan_desc', emoji: '🍳', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'], equipmentSlot: 'weapon', attributes: { physicalAttack: 5, critChance: 2 } },
    { name: 'Chủ đề Stan Twitter', description: 'item_stan_twitter_thread_desc', emoji: '📜', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
    { name: 'Bản Remix của CupcakKe', description: 'item_cupcakke_remix_desc', emoji: '🎶', category: 'Support', tier: 3, effects: [{ type: 'RESTORE_STAMINA', amount: 50 }], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
    { name: 'Viên Yass', description: 'item_yass_pill_desc', emoji: '💊', category: 'Support', tier: 2, effects: [{ type: 'HEAL', amount: 30 }], baseQuantity: { min: 2, max: 2 }, spawnBiomes: ['floptropica'] },
    { name: 'Gusher', description: "item_gusher_desc", emoji: '🥤', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['floptropica'] },
    { name: 'Phiếu giảm giá Onika Burger', description: "item_onika_burger_coupon_desc", emoji: '🎟️', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
];

const floptropicaStructures: Structure[] = [
    { name: 'Đại học C.V.N.T. của Deborah', description: 'structure_deborah_university_desc', emoji: '🎓', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 30, stamina: 30 }, heatValue: 1 },
    { name: 'Bệnh viện Barbz của Nicki', description: 'structure_nicki_hospital_desc', emoji: '🏥', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 100, stamina: 50 }, heatValue: 0 },
    { name: "Onika Burgers", description: "structure_onika_burgers_desc", emoji: '🍔', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 15, stamina: 40 }, heatValue: 1 },
];

const skill1: Skill = { name: 'skillFireballName', description: 'skillFireballDesc', tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill3: Skill = { name: 'skillLifeSiphonName', description: 'skillLifeSiphonDesc', tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };

const floptropicaConcepts: WorldConcept[] = [
    {
        worldName: "worldName_floptropica", initialNarrative: 'floptropica_narrative1', startingBiome: 'floptropica',
        playerInventory: [ { name: "Chảo của Jiafei", quantity: 1 }, { name: "Chủ đề Stan Twitter", quantity: 1 } ],
        initialQuests: [ 'floptropica_quest1', 'floptropica_quest2' ], startingSkill: skill1, customStructures: floptropicaStructures, customItemCatalog: floptropicaItems
    },
    {
        worldName: "worldName_onikaKingdom", initialNarrative: 'floptropica_narrative2', startingBiome: 'floptropica',
        playerInventory: [ { name: "Bản Remix của CupcakKe", quantity: 1 }, { name: "Phiếu giảm giá Onika Burger", quantity: 1 } ],
        initialQuests: [ 'floptropica_quest3', 'floptropica_quest4' ], startingSkill: skill2, customStructures: floptropicaStructures, customItemCatalog: floptropicaItems
    },
    {
        worldName: "worldName_badBussyWasteland", initialNarrative: 'floptropica_narrative3', startingBiome: 'floptropica',
        playerInventory: [ { name: "Chảo của Jiafei", quantity: 1 }, { name: "Viên Yass", quantity: 2 } ],
        initialQuests: [ 'floptropica_quest5', 'floptropica_quest6' ], startingSkill: skill3, customStructures: floptropicaStructures, customItemCatalog: floptropicaItems
    }
];

export const floptropicaWorld: GenerateWorldSetupOutput = {
    customItemCatalog: floptropicaItems,
    customStructures: floptropicaStructures,
    concepts: floptropicaConcepts as any,
};
