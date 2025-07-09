import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const frozenWastelandItems: GeneratedItem[] = [
    { name: 'Vải Bố Cách Nhiệt', description: 'item_insulated_cloth_desc', emoji: '🧣', category: 'Material', tier: 2, effects: [], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['tundra', 'mountain'] },
    { name: 'Súp Nóng Đóng Hộp', description: 'item_canned_hot_soup_desc', emoji: '🥫', category: 'Food', tier: 2, effects: [{ type: 'RESTORE_STAMINA', amount: 40 }], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['tundra'] },
    { name: 'Mảnh Vỡ Vệ Tinh', description: 'item_satellite_debris_desc', emoji: '🛰️', category: 'Material', tier: 4, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['tundra', 'mountain'] },
    { name: 'Nhật Ký Của Người Sống Sót', description: 'item_survivor_diary_desc', emoji: '📔', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['tundra'] },
    { name: 'Rìu Băng Tự Chế', description: 'item_makeshift_ice_axe_desc', emoji: '⛏️', category: 'Weapon', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], attributes: { physicalAttack: 4, critChance: 1 }, equipmentSlot: 'weapon' },
];

const frozenWastelandStructures: Structure[] = [
    { name: 'Trạm Nghiên Cứu Bị Bỏ Hoang', description: 'structure_abandoned_research_station_desc', emoji: '🔬', providesShelter: true, buildable: false, restEffect: { hp: 25, stamina: 50 }, heatValue: 2 },
    { name: 'Vệ Tinh Rơi', description: 'structure_fallen_satellite_desc', emoji: '🛰️', providesShelter: false, buildable: false },
];

const startingSkill: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };

const frozenWastelandConcepts: WorldConcept[] = [
    {
        worldName: "worldName_frostedWreckage", initialNarrative: 'frozen_narrative1', startingBiome: 'tundra',
        playerInventory: [ { name: "Rìu Băng Tự Chế", quantity: 1 }, { name: "Súp Nóng Đóng Hộp", quantity: 1 } ],
        initialQuests: [ 'frozen_quest1', 'frozen_quest2' ], startingSkill: startingSkill, customStructures: frozenWastelandStructures, customItemCatalog: frozenWastelandItems
    },
];

export const frozenWastelandWorld: GenerateWorldSetupOutput = {
    customItemCatalog: frozenWastelandItems,
    customStructures: frozenWastelandStructures,
    concepts: frozenWastelandConcepts as any,
};
