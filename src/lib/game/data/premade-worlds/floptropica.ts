import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept, ItemDefinition } from '@/lib/game/types';

const floptropicaItems: GeneratedItem[] = [
    { name: { en: "Jiafei's Pan", vi: 'Chảo của Jiafei' }, description: { en: 'item_jiafei_pan_desc', vi: 'item_jiafei_pan_desc' }, emoji: '🍳', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, attributes: { physicalAttack: 5, critChance: 2 }, equipmentSlot: 'weapon', spawnEnabled: false },
    { name: { en: 'Stan Twitter Thread', vi: 'Chủ đề Stan Twitter' }, description: { en: 'item_stan_twitter_thread_desc', vi: 'item_stan_twitter_thread_desc' }, emoji: '📜', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: "CupcakKe's Remix", vi: 'Bản Remix của CupcakKe' }, description: { en: 'item_cupcakke_remix_desc', vi: 'item_cupcakke_remix_desc' }, emoji: '🎶', category: 'Support', tier: 3, effects: [{ type: 'RESTORE_STAMINA', amount: 50 }], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Yass Pill', vi: 'Viên Yass' }, description: { en: 'item_yass_pill_desc', vi: 'item_yass_pill_desc' }, emoji: '💊', category: 'Support', tier: 2, effects: [{ type: 'HEAL', amount: 30 }], baseQuantity: { min: 2, max: 2 }, spawnEnabled: false },
    { name: { en: 'Gusher', vi: 'Gusher' }, description: { en: 'item_gusher_desc', vi: 'item_gusher_desc' }, emoji: '🥤', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { name: { en: 'Onika Burger Coupon', vi: 'Phiếu giảm giá Onika Burger' }, description: { en: 'item_onika_burger_coupon_desc', vi: 'item_onika_burger_coupon_desc' }, emoji: '🎟️', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const floptropicaStructures: Structure[] = [
    { name: { en: "Deborah's C.V.N.T. University", vi: 'Đại học C.V.N.T. của Deborah' }, description: { en: 'structure_deborah_university_desc', vi: 'structure_deborah_university_desc' }, emoji: '🎓', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 30, stamina: 30 }, heatValue: 1 },
    { name: { en: "Nicki's Barbz Hospital", vi: 'Bệnh viện Barbz của Nicki' }, description: { en: 'structure_nicki_hospital_desc', vi: 'structure_nicki_hospital_desc' }, emoji: '🏥', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 100, stamina: 50 }, heatValue: 0 },
    { name: { en: "Onika Burgers", vi: "Onika Burgers" }, description: { en: 'structure_onika_burgers_desc', vi: 'structure_onika_burgers_desc' }, emoji: '🍔', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 15, stamina: 40 }, heatValue: 1 },
];

const skill1: Skill = { name: { en: 'skillFireballName', vi: 'skillFireballName' }, description: { en: 'skillFireballDesc', vi: 'skillFireballDesc' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: { en: 'skillHealName', vi: 'skillHealName' }, description: { en: 'skillHealDesc', vi: 'skillHealDesc' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill3: Skill = { name: { en: 'skillLifeSiphonName', vi: 'skillLifeSiphonName' }, description: { en: 'skillLifeSiphonDesc', vi: 'skillLifeSiphonDesc' }, tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };

const floptropicaConcepts: WorldConcept[] = [
    {
        worldName: { en: "worldName_floptropica", vi: "worldName_floptropica" }, initialNarrative: { en: 'floptropica_narrative1', vi: 'floptropica_narrative1' }, startingBiome: 'floptropica',
        playerInventory: [ { name: "Jiafei's Pan", quantity: 1 }, { name: "Stan Twitter Thread", quantity: 1 } ],
        initialQuests: [ { en: 'floptropica_quest1', vi: 'floptropica_quest1' }, { en: 'floptropica_quest2', vi: 'floptropica_quest2' } ], startingSkill: skill1, customStructures: floptropicaStructures
    },
    {
        worldName: { en: "worldName_onikaKingdom", vi: "worldName_onikaKingdom" }, initialNarrative: { en: 'floptropica_narrative2', vi: 'floptropica_narrative2' }, startingBiome: 'floptropica',
        playerInventory: [ { name: "CupcakKe's Remix", quantity: 1 }, { name: "Onika Burger Coupon", quantity: 1 } ],
        initialQuests: [ { en: 'floptropica_quest3', vi: 'floptropica_quest3' }, { en: 'floptropica_quest4', vi: 'floptropica_quest4' } ], startingSkill: skill2, customStructures: floptropicaStructures
    },
    {
        worldName: { en: "worldName_badBussyWasteland", vi: "worldName_badBussyWasteland" }, initialNarrative: { en: 'floptropica_narrative3', vi: 'floptropica_narrative3' }, startingBiome: 'floptropica',
        playerInventory: [ { name: "Jiafei's Pan", quantity: 1 }, { name: "Yass Pill", quantity: 2 } ],
        initialQuests: [ { en: 'floptropica_quest5', vi: 'floptropica_quest5' }, { en: 'floptropica_quest6', vi: 'floptropica_quest6' } ], startingSkill: skill3, customStructures: floptropicaStructures
    }
];

export const floptropicaWorld: GenerateWorldSetupOutput = {
    customItemCatalog: floptropicaItems,
    customStructures: floptropicaStructures,
    concepts: floptropicaConcepts,
};
