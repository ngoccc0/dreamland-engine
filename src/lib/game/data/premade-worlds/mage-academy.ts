import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const mageAcademyItems: GeneratedItem[] = [
    { name: { en: "Student's Wand", vi: 'Đũa Phép Của Học Viên' }, description: { en: 'item_student_wand_desc', vi: 'item_student_wand_desc' }, emoji: '🪄', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { magicalAttack: 5 }, spawnEnabled: false },
    { name: { en: 'Tome of Cantrips', vi: 'Sách Phép Cơ Bản' }, description: { en: 'item_tome_of_cantrips_desc', vi: 'item_tome_of_cantrips_desc' }, emoji: '📕', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Floatstone', vi: 'Đá Bay' }, description: { en: 'item_floatstone_desc', vi: 'item_floatstone_desc' }, emoji: '☁️', category: 'Material', tier: 3, effects: [], baseQuantity: { min: 1, max: 3 }, spawnEnabled: false },
    { name: { en: 'Stardust', vi: 'Bụi Sao' }, description: { en: 'item_stardust_desc', vi: 'item_stardust_desc' }, emoji: '✨', category: 'Magic', tier: 4, effects: [], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { name: { en: 'Academy Robe', vi: 'Áo Choàng Học Viện' }, description: { en: 'item_academy_robe_desc', vi: 'item_academy_robe_desc' }, emoji: '🥋', category: 'Armor', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'armor', attributes: { cooldownReduction: 5 }, spawnEnabled: false },
];

const mageAcademyStructures: Structure[] = [
    { name: { en: 'Observatory', vi: 'Đài Quan Sát Thiên Văn' }, description: { en: 'structure_observatory_desc', vi: 'structure_observatory_desc' }, emoji: '🔭', providesShelter: true, buildable: false },
    { name: { en: 'Infinite Library', vi: 'Thư Viện Vô Tận' }, description: { en: 'structure_infinite_library_desc', vi: 'structure_infinite_library_desc' }, emoji: '📚', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 20 } },
    { name: { en: 'Alchemy Lab', vi: 'Phòng Thí Nghiệm Giả Kim' }, description: { en: 'structure_alchemy_lab_desc', vi: 'structure_alchemy_lab_desc' }, emoji: '⚗️', providesShelter: true, buildable: false },
];

const startingSkill: Skill = { name: { en: 'skillFireballName', vi: 'skillFireballName' }, description: { en: 'skillFireballDesc', vi: 'skillFireballDesc' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };

const mageAcademyConcepts: WorldConcept[] = [
    {
        worldName: { en: "worldName_driftingAcademy", vi: "worldName_driftingAcademy" }, initialNarrative: { en: 'mage_narrative1', vi: 'mage_narrative1' }, startingBiome: 'mountain', // Simulate floating island
        playerInventory: [ { name: "Đũa Phép Của Học Viên", quantity: 1 }, { name: "Sách Phép Cơ Bản", quantity: 1 } ],
        initialQuests: [ { en: 'mage_quest1', vi: 'mage_quest1' }, { en: 'mage_quest2', vi: 'mage_quest2' } ], startingSkill: startingSkill, customStructures: mageAcademyStructures, customItemCatalog: mageAcademyItems
    },
];

export const mageAcademyWorld: GenerateWorldSetupOutput = {
    customItemCatalog: mageAcademyItems,
    customStructures: mageAcademyStructures,
    concepts: mageAcademyConcepts as any,
};
