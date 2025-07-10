import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { name: 'Cờ lê Bảo trì', description: 'item_maintenance_wrench_desc', emoji: '🔧', category: 'Weapon', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['space_station'], equipmentSlot: 'weapon', attributes: { physicalAttack: 3 } },
    { name: 'Thẻ khóa Cấp 1', description: 'item_keycard_desc', emoji: '💳', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['space_station'] },
    { name: 'Bột Dinh dưỡng', description: 'item_nutrient_paste_desc', emoji: '🧪', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 25 }], baseQuantity: { min: 2, max: 4 }, spawnBiomes: ['space_station'] },
    { name: 'Nhật ký Kỹ sư', description: 'item_engineer_log_desc', emoji: '📋', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['space_station'] },
    { name: 'Máy cắt Laser', description: 'item_laser_cutter_desc', emoji: '✨', category: 'Tool', tier: 3, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [] },
];

const structures: Structure[] = [
    { name: 'Khoang Ngủ đông', description: 'structure_cryo_bay_desc', emoji: '🛌', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 10 }, heatValue: 0 },
    { name: 'Phòng Điều khiển', description: 'structure_bridge_desc', emoji: '🖥️', providesShelter: true, buildable: false },
    { name: 'Khu Thủy canh', description: 'structure_hydroponics_desc', emoji: '🌱', providesShelter: false, buildable: false },
];

const startingSkill: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };

const concepts: WorldConcept[] = [
    {
        worldName: "worldName_theWanderer", initialNarrative: 'genship_narrative1', startingBiome: 'space_station',
        playerInventory: [ { name: "Cờ lê Bảo trì", quantity: 1 }, { name: "Bột Dinh dưỡng", quantity: 2 } ],
        initialQuests: [ 'genship_quest1', 'genship_quest2' ], startingSkill: startingSkill, customStructures: structures, customItemCatalog: items
    },
];

export const generationShipWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
