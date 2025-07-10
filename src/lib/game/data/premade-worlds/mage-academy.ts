import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const mageAcademyItems: GeneratedItem[] = [
    { name: 'Đũa Phép Của Học Viên', description: 'item_student_wand_desc', emoji: '🪄', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], equipmentSlot: 'weapon', attributes: { physicalAttack: 0, magicalAttack: 5, critChance: 0, attackSpeed: 0, cooldownReduction: 0 } },
    { name: 'Sách Phép Cơ Bản', description: 'item_tome_of_cantrips_desc', emoji: '📕', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [] },
    { name: 'Đá Bay', description: 'item_floatstone_desc', emoji: '☁️', category: 'Material', tier: 3, effects: [], baseQuantity: { min: 1, max: 3 }, spawnBiomes: ['mountain'] },
    { name: 'Bụi Sao', description: 'item_stardust_desc', emoji: '✨', category: 'Magic', tier: 4, effects: [], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['mountain'] },
    { name: 'Áo Choàng Học Viện', description: 'item_academy_robe_desc', emoji: '🥋', category: 'Equipment', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], equipmentSlot: 'armor', attributes: { physicalAttack: 0, magicalAttack: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 5 } },
];

const mageAcademyStructures: Structure[] = [
    { name: 'Đài Quan Sát Thiên Văn', description: 'structure_observatory_desc', emoji: '🔭', providesShelter: true, buildable: false },
    { name: 'Thư Viện Vô Tận', description: 'structure_infinite_library_desc', emoji: '📚', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 20 } },
    { name: 'Phòng Thí Nghiệm Giả Kim', description: 'structure_alchemy_lab_desc', emoji: '⚗️', providesShelter: true, buildable: false },
];

const startingSkill: Skill = { name: 'skillFireballName', description: 'skillFireballDesc', tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };

const mageAcademyConcepts: WorldConcept[] = [
    {
        worldName: "worldName_driftingAcademy", initialNarrative: 'mage_narrative1', startingBiome: 'mountain', // Simulate floating island
        playerInventory: [ { name: "Đũa Phép Của Học Viên", quantity: 1 }, { name: "Sách Phép Cơ Bản", quantity: 1 } ],
        initialQuests: [ 'mage_quest1', 'mage_quest2' ], startingSkill: startingSkill, customStructures: mageAcademyStructures, customItemCatalog: mageAcademyItems
    },
];

export const mageAcademyWorld: GenerateWorldSetupOutput = {
    customItemCatalog: mageAcademyItems,
    customStructures: mageAcademyStructures,
    concepts: mageAcademyConcepts as any,
};
