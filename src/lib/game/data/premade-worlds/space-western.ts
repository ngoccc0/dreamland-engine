import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: { en: 'Laser Revolver', vi: 'Súng lục Laser' }, description: { en: 'item_laser_revolver_desc', vi: 'item_laser_revolver_desc' }, emoji: '🔫', category: 'Weapon', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], equipmentSlot: 'weapon', attributes: { physicalAttack: 8, critChance: 5 }, spawnEnabled: false },
    { name: { en: 'Spice-Infused Water', vi: 'Nước tẩm Gia vị' }, description: { en: 'item_spice_infused_water_desc', vi: 'item_spice_infused_water_desc' }, emoji: '💧', category: 'Support', tier: 2, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }, { type: 'RESTORE_MANA', amount: 5 }], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['desert'], spawnEnabled: false },
    { name: { en: 'Sandworm Tooth', vi: 'Răng Giun cát' }, description: { en: 'item_sandworm_tooth_desc', vi: 'item_sandworm_tooth_desc' }, emoji: '🦷', category: 'Material', tier: 5, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['desert'], spawnEnabled: false },
    { name: { en: 'Bounty Puck', vi: 'Chip Tiền thưởng' }, description: { en: 'item_bounty_puck_desc', vi: 'item_bounty_puck_desc' }, emoji: '💿', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Dusty Saloon', vi: 'Quán rượu Bụi bặm' }, description: { en: 'structure_dusty_saloon_desc', vi: 'structure_dusty_saloon_desc' }, emoji: '🍺', providesShelter: true, buildable: false, restEffect: { hp: 5, stamina: 15 }, heatValue: 0 },
    { name: { en: "Sheriff's Office", vi: 'Văn phòng Cảnh sát trưởng' }, description: { en: 'structure_sheriffs_office_desc', vi: 'structure_sheriffs_office_desc' }, emoji: '⭐', providesShelter: true, buildable: false },
    { name: { en: 'Crashed Freighter', vi: 'Xác tàu chở hàng' }, description: { en: 'structure_crashed_freighter_desc', vi: 'structure_crashed_freighter_desc' }, emoji: '🚀', providesShelter: true, buildable: false },
];

const skill1: Skill = { name: { en: 'skillHealName', vi: 'skillHealName' }, description: { en: 'skillHealDesc', vi: 'skillHealDesc' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: { en: 'skillFireballName', vi: 'skillFireballName' }, description: { en: 'skillFireballDesc', vi: 'skillFireballDesc' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };

const concepts: WorldConcept[] = [
    {
        worldName: { en: "worldName_outlawPlanet", vi: "worldName_outlawPlanet" }, initialNarrative: { en: 'western_narrative1', vi: 'western_narrative1' }, startingBiome: 'desert',
        playerInventory: [ { name: "Súng lục Laser", quantity: 1 }, { name: "Chip Tiền thưởng", quantity: 1 } ],
        initialQuests: [ { en: 'western_quest1', vi: 'western_quest1' }, { en: 'western_quest2', vi: 'western_quest2' } ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: { en: "worldName_outlawPlanet", vi: "worldName_outlawPlanet" }, initialNarrative: { en: 'western_narrative2', vi: 'western_narrative2' }, startingBiome: 'desert',
        playerInventory: [ { name: "Nước tẩm Gia vị", quantity: 3 } ],
        initialQuests: [ { en: 'western_quest3', vi: 'western_quest3' } ], startingSkill: skill2, customStructures: structures
    },
];

export const spaceWesternWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
