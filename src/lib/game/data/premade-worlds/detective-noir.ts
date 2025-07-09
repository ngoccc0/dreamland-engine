import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: 'Áo Khoác Trench', description: 'item_trench_coat_desc', emoji: '🧥', category: 'Equipment', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['city'], equipmentSlot: 'armor' },
    { name: 'Kính Lúp', description: 'item_magnifying_glass_desc', emoji: ' magnifying_glass ', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [] },
    { name: 'Khẩu Súng Lục Cũ', description: 'item_old_revolver_desc', emoji: '🔫', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], equipmentSlot: 'weapon', attributes: { physicalAttack: 6, critChance: 3 } },
    { name: 'Hồ Sơ Vụ Án', description: 'item_case_file_desc', emoji: '📂', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [] },
    { name: 'Rượu Synth-Whiskey', description: 'item_synth_whiskey_desc', emoji: '🥃', category: 'Support', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 20 }], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['city'] },
];

const structures: Structure[] = [
    { name: 'Văn phòng Thám tử', description: 'structure_gumshoe_office_desc', emoji: '🏢', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 30 }, heatValue: 1 },
    { name: 'Quán Bar Rồng Neon', description: 'structure_neon_dragon_bar_desc', emoji: '🍻', providesShelter: true, buildable: false, restEffect: { hp: 5, stamina: 10 }, heatValue: 1 },
];

const startingSkill: Skill = { name: 'skillLifeSiphonName', description: 'skillLifeSiphonDesc', tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };

const concepts: WorldConcept[] = [
    {
        worldName: "Thành phố Mưa", initialNarrative: 'detective_narrative1', startingBiome: 'city',
        playerInventory: [ { name: "Áo Khoác Trench", quantity: 1 }, { name: "Hồ Sơ Vụ Án", quantity: 1 } ],
        initialQuests: [ 'detective_quest1', 'detective_quest2' ], startingSkill: startingSkill, customStructures: structures, customItemCatalog: items
    },
];

export const detectiveNoirWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
