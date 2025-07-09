import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: 'Súng lục Laser', description: 'item_laser_revolver_desc', emoji: '🔫', category: 'Weapon', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], equipmentSlot: 'weapon', attributes: { physicalAttack: 8, critChance: 5 } },
    { name: 'Nước tẩm Gia vị', description: 'item_spice_infused_water_desc', emoji: '💧', category: 'Support', tier: 2, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['desert'] },
    { name: 'Răng Giun cát', description: 'item_sandworm_tooth_desc', emoji: '🦷', category: 'Material', tier: 5, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['desert'] },
    { name: 'Chip Tiền thưởng', description: 'item_bounty_puck_desc', emoji: '💿', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [] },
];

const structures: Structure[] = [
    { name: 'Quán rượu Bụi bặm', description: 'structure_dusty_saloon_desc', emoji: '🍺', providesShelter: true, buildable: false, restEffect: { hp: 5, stamina: 15 }, heatValue: 0 },
    { name: 'Văn phòng Cảnh sát trưởng', description: 'structure_sheriffs_office_desc', emoji: '⭐', providesShelter: true, buildable: false },
    { name: 'Xác tàu chở hàng', description: 'structure_crashed_freighter_desc', emoji: '🚀', providesShelter: true, buildable: false },
];

const startingSkill: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };

const concepts: WorldConcept[] = [
    {
        worldName: "worldName_outlawPlanet", initialNarrative: 'western_narrative1', startingBiome: 'desert',
        playerInventory: [ { name: "Súng lục Laser", quantity: 1 }, { name: "Chip Tiền thưởng", quantity: 1 } ],
        initialQuests: [ 'western_quest1', 'western_quest2' ], startingSkill: startingSkill, customStructures: structures, customItemCatalog: items
    },
];

export const spaceWesternWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
