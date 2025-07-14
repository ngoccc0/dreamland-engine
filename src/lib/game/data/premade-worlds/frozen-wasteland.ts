/**
 * @fileOverview Defines all unique assets for the "Frozen Wasteland" premade world.
 * @description This file contains the item, structure, and starting scenario definitions
 * for a post-apocalyptic, icy world. Items here are marked with `spawnEnabled: false`
 * to prevent them from appearing in other, less hostile game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept, ItemDefinition } from '@/lib/game/types';

const frozenWastelandItems: GeneratedItem[] = [
    { name: { en: 'Insulated Canvas', vi: 'Vải Bố Cách Nhiệt' }, description: { en: 'item_insulated_cloth_desc', vi: 'item_insulated_cloth_desc' }, emoji: '🧣', category: 'Material', tier: 2, effects: [], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { name: { en: 'Canned Hot Soup', vi: 'Súp Nóng Đóng Hộp' }, description: { en: 'item_canned_hot_soup_desc', vi: 'item_canned_hot_soup_desc' }, emoji: '🥫', category: 'Food', tier: 2, effects: [{ type: 'RESTORE_STAMINA', amount: 40 }], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Satellite Debris', vi: 'Mảnh Vỡ Vệ Tinh' }, description: { en: 'item_satellite_debris_desc', vi: 'item_satellite_debris_desc' }, emoji: '🛰️', category: 'Material', tier: 4, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: "Survivor's Diary", vi: 'Nhật Ký Của Người Sống Sót' }, description: { en: 'item_survivor_diary_desc', vi: 'item_survivor_diary_desc' }, emoji: '📔', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Makeshift Ice Axe', vi: 'Rìu Băng Tự Chế' }, description: { en: 'item_makeshift_ice_axe_desc', vi: 'item_makeshift_ice_axe_desc' }, emoji: '⛏️', category: 'Weapon', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, attributes: { physicalAttack: 4, critChance: 1 }, equipmentSlot: 'weapon', spawnEnabled: false },
];

const frozenWastelandStructures: Structure[] = [
    { name: { en: 'Abandoned Research Station', vi: 'Trạm Nghiên Cứu Bị Bỏ Hoang' }, description: { en: 'structure_abandoned_research_station_desc', vi: 'structure_abandoned_research_station_desc' }, emoji: '🔬', providesShelter: true, buildable: false, restEffect: { hp: 25, stamina: 50 }, heatValue: 2 },
    { name: { en: 'Fallen Satellite', vi: 'Vệ Tinh Rơi' }, description: { en: 'structure_fallen_satellite_desc', vi: 'structure_fallen_satellite_desc' }, emoji: '🛰️', providesShelter: false, buildable: false },
];

const startingSkill: Skill = { name: { en: 'skillHealName', vi: 'skillHealName' }, description: { en: 'skillHealDesc', vi: 'skillHealDesc' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };

const frozenWastelandConcepts: WorldConcept[] = [
    {
        worldName: { en: "worldName_frostedWreckage", vi: "worldName_frostedWreckage" }, initialNarrative: { en: 'frozen_narrative1', vi: 'frozen_narrative1' }, startingBiome: 'tundra',
        playerInventory: [ { name: "Makeshift Ice Axe", quantity: 1 }, { name: "Canned Hot Soup", quantity: 1 } ],
        initialQuests: [ { en: 'frozen_quest1', vi: 'frozen_quest1' }, { en: 'frozen_quest2', vi: 'frozen_quest2' } ], startingSkill: startingSkill, customStructures: frozenWastelandStructures, customItemCatalog: frozenWastelandItems
    },
];

export const frozenWastelandWorld: GenerateWorldSetupOutput = {
    customItemCatalog: frozenWastelandItems,
    customStructures: frozenWastelandStructures,
    concepts: frozenWastelandConcepts,
};
