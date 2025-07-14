import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: { en: 'Maintenance Wrench', vi: 'Cờ lê Bảo trì' }, description: { en: 'item_maintenance_wrench_desc', vi: 'item_maintenance_wrench_desc' }, emoji: '🔧', category: 'Weapon', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 3 }, spawnEnabled: false },
    { name: { en: 'Keycard Level 1', vi: 'Thẻ khóa Cấp 1' }, description: { en: 'item_keycard_desc', vi: 'item_keycard_desc' }, emoji: '💳', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Nutrient Paste', vi: 'Bột Dinh dưỡng' }, description: { en: 'item_nutrient_paste_desc', vi: 'item_nutrient_paste_desc' }, emoji: '🧪', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }], baseQuantity: { min: 2, max: 4 }, spawnEnabled: false },
    { name: { en: "Engineer's Log", vi: 'Nhật ký Kỹ sư' }, description: { en: 'item_engineer_log_desc', vi: 'item_engineer_log_desc' }, emoji: '📋', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Laser Cutter', vi: 'Máy cắt Laser' }, description: { en: 'item_laser_cutter_desc', vi: 'item_laser_cutter_desc' }, emoji: '✨', category: 'Tool', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Cryo Bay', vi: 'Khoang Ngủ đông' }, description: { en: 'structure_cryo_bay_desc', vi: 'structure_cryo_bay_desc' }, emoji: '🛌', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 10 }, heatValue: 0 },
    { name: { en: 'Bridge', vi: 'Phòng Điều khiển' }, description: { en: 'structure_bridge_desc', vi: 'structure_bridge_desc' }, emoji: '🖥️', providesShelter: true, buildable: false },
    { name: { en: 'Hydroponics Bay', vi: 'Khu Thủy canh' }, description: { en: 'structure_hydroponics_desc', vi: 'structure_hydroponics_desc' }, emoji: '🌱', providesShelter: false, buildable: false },
];

const skill1: Skill = { name: { en: 'skillHealName', vi: 'skillHealName' }, description: { en: 'skillHealDesc', vi: 'skillHealDesc' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: { en: 'skillFireballName', vi: 'skillFireballName' }, description: { en: 'skillFireballDesc', vi: 'skillFireballDesc' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };

const concepts: WorldConcept[] = [
    {
        worldName: { en: "worldName_theWanderer", vi: "worldName_theWanderer" }, initialNarrative: { en: 'genship_narrative1', vi: 'genship_narrative1' }, startingBiome: 'space_station',
        playerInventory: [ { name: "Cờ lê Bảo trì", quantity: 1 }, { name: "Bột Dinh dưỡng", quantity: 2 } ],
        initialQuests: [ { en: 'genship_quest1', vi: 'genship_quest1' }, { en: 'genship_quest2', vi: 'genship_quest2' } ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: { en: "worldName_theWanderer", vi: "worldName_theWanderer" }, initialNarrative: { en: 'genship_narrative1', vi: 'genship_narrative1' }, startingBiome: 'space_station',
        playerInventory: [ { name: "Nhật ký Kỹ sư", quantity: 1 }, { name: "Thẻ khóa Cấp 1", quantity: 1 } ],
        initialQuests: [ { en: 'genship_quest3', vi: 'genship_quest3' }, { en: 'genship_quest4', vi: 'genship_quest4' } ], startingSkill: skill2, customStructures: structures
    },
];

export const generationShipWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
