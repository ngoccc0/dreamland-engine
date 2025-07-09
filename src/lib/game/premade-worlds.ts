
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

// =================================================================
// 1. FLOPTROPICA - DEBUG & COMEDY WORLD
// =================================================================

const floptropicaItems: GeneratedItem[] = [
    { name: 'Chảo của Jiafei', description: 'item_jiafei_pan_desc', emoji: '🍳', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'], attributes: { physicalAttack: 5, critChance: 2 } },
    { name: 'Chủ đề Stan Twitter', description: 'item_stan_twitter_thread_desc', emoji: '📜', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
    { name: 'Bản Remix của CupcakKe', description: 'item_cupcakke_remix_desc', emoji: '🎶', category: 'Support', tier: 3, effects: [{ type: 'RESTORE_STAMINA', amount: 50 }], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
    { name: 'Viên Yass', description: 'item_yass_pill_desc', emoji: '💊', category: 'Support', tier: 2, effects: [{ type: 'HEAL', amount: 30 }], baseQuantity: { min: 2, max: 2 }, spawnBiomes: ['floptropica'] },
    { name: 'Gusher', description: "item_gusher_desc", emoji: '🥤', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['floptropica'] },
    { name: 'Phiếu giảm giá Onika Burger', description: "item_onika_burger_coupon_desc", emoji: '🎟️', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
];

const floptropicaStructures: Structure[] = [
    { name: 'Đại học C.V.N.T. của Deborah', description: 'structure_deborah_university_desc', emoji: '🎓', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 30, stamina: 30 }, heatValue: 1 },
    { name: 'Bệnh viện Barbz của Nicki', description: 'structure_nicki_hospital_desc', emoji: '🏥', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 100, stamina: 50 }, heatValue: 0 },
    { name: "Onika Burgers", description: "structure_onika_burgers_desc", emoji: '🍔', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 15, stamina: 40 }, heatValue: 1 },
];

const skill1: Skill = { name: 'skillFireballName', description: 'skillFireballDesc', tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill3: Skill = { name: 'skillLifeSiphonName', description: 'skillLifeSiphonDesc', tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };

const floptropicaConcepts: WorldConcept[] = [
    {
        worldName: "Floptropica", initialNarrative: 'floptropica_narrative1', startingBiome: 'floptropica',
        playerInventory: [ { name: "Chảo của Jiafei", quantity: 1 }, { name: "Chủ đề Stan Twitter", quantity: 1 } ],
        initialQuests: [ 'floptropica_quest1', 'floptropica_quest2' ], startingSkill: skill1, customStructures: floptropicaStructures
    },
    {
        worldName: "Vương quốc Onika", initialNarrative: 'floptropica_narrative2', startingBiome: 'floptropica',
        playerInventory: [ { name: "Bản Remix của CupcakKe", quantity: 1 }, { name: "Phiếu giảm giá Onika Burger", quantity: 1 } ],
        initialQuests: [ 'floptropica_quest3', 'floptropica_quest4' ], startingSkill: skill2, customStructures: floptropicaStructures
    },
    {
        worldName: "Vùng đất hoang Bad Bussy", initialNarrative: 'floptropica_narrative3', startingBiome: 'floptropica',
        playerInventory: [ { name: "Chảo của Jiafei", quantity: 1 }, { name: "Viên Yass", quantity: 2 } ],
        initialQuests: [ 'floptropica_quest5', 'floptropica_quest6' ], startingSkill: skill3, customStructures: floptropicaStructures
    }
];

const floptropicaWorld: GenerateWorldSetupOutput = {
    customItemCatalog: floptropicaItems,
    customStructures: floptropicaStructures,
    concepts: floptropicaConcepts as any,
};


// =================================================================
// 2. FROZEN WASTELAND - SURVIVAL WORLD
// =================================================================

const frozenWastelandItems: GeneratedItem[] = [
    { name: 'Vải Bố Cách Nhiệt', description: 'item_insulated_cloth_desc', emoji: '🧣', category: 'Material', tier: 2, effects: [], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['tundra', 'mountain'] },
    { name: 'Súp Nóng Đóng Hộp', description: 'item_canned_hot_soup_desc', emoji: '🥫', category: 'Food', tier: 2, effects: [{ type: 'RESTORE_STAMINA', amount: 40 }], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['tundra'] },
    { name: 'Mảnh Vỡ Vệ Tinh', description: 'item_satellite_debris_desc', emoji: '🛰️', category: 'Material', tier: 4, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['tundra', 'mountain'] },
    { name: 'Nhật Ký Của Người Sống Sót', description: 'item_survivor_diary_desc', emoji: '📔', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['tundra'] },
    { name: 'Rìu Băng Tự Chế', description: 'item_makeshift_ice_axe_desc', emoji: '⛏️', category: 'Weapon', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], attributes: { physicalAttack: 4, critChance: 1 } },
];

const frozenWastelandStructures: Structure[] = [
    { name: 'Trạm Nghiên Cứu Bị Bỏ Hoang', description: 'structure_abandoned_research_station_desc', emoji: '🔬', providesShelter: true, buildable: false, restEffect: { hp: 25, stamina: 50 }, heatValue: 2 },
    { name: 'Vệ Tinh Rơi', description: 'structure_fallen_satellite_desc', emoji: '🛰️', providesShelter: false, buildable: false },
];

const frozenWastelandConcepts: WorldConcept[] = [
    {
        worldName: "Tàn Tích Băng Giá", initialNarrative: 'frozen_narrative1', startingBiome: 'tundra',
        playerInventory: [ { name: "Rìu Băng Tự Chế", quantity: 1 }, { name: "Súp Nóng Đóng Hộp", quantity: 1 } ],
        initialQuests: [ 'frozen_quest1', 'frozen_quest2' ], startingSkill: skill2, customStructures: frozenWastelandStructures
    },
];

const frozenWastelandWorld: GenerateWorldSetupOutput = {
    customItemCatalog: frozenWastelandItems,
    customStructures: frozenWastelandStructures,
    concepts: frozenWastelandConcepts as any,
};

// =================================================================
// 3. MAGE ACADEMY - MAGIC WORLD
// =================================================================
const mageAcademyItems: GeneratedItem[] = [
    { name: 'Đũa Phép Của Học Viên', description: 'item_student_wand_desc', emoji: '🪄', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], equipmentSlot: 'weapon', attributes: { magicalAttack: 5 } },
    { name: 'Sách Phép Cơ Bản', description: 'item_tome_of_cantrips_desc', emoji: '📕', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [] },
    { name: 'Đá Bay', description: 'item_floatstone_desc', emoji: '☁️', category: 'Material', tier: 3, effects: [], baseQuantity: { min: 1, max: 3 }, spawnBiomes: ['mountain'] },
    { name: 'Bụi Sao', description: 'item_stardust_desc', emoji: '✨', category: 'Magic', tier: 4, effects: [], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['mountain'] },
    { name: 'Áo Choàng Học Viện', description: 'item_academy_robe_desc', emoji: '🥋', category: 'Equipment', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: [], equipmentSlot: 'armor', attributes: { cooldownReduction: 5 } },
];

const mageAcademyStructures: Structure[] = [
    { name: 'Đài Quan Sát Thiên Văn', description: 'structure_observatory_desc', emoji: '🔭', providesShelter: true, buildable: false },
    { name: 'Thư Viện Vô Tận', description: 'structure_infinite_library_desc', emoji: '📚', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 20 } },
    { name: 'Phòng Thí Nghiệm Giả Kim', description: 'structure_alchemy_lab_desc', emoji: '⚗️', providesShelter: true, buildable: false },
];

const mageAcademyConcepts: WorldConcept[] = [
    {
        worldName: "Học Viện Mây Trôi", initialNarrative: 'mage_narrative1', startingBiome: 'mountain', // Simulate floating island
        playerInventory: [ { name: "Đũa Phép Của Học Viên", quantity: 1 }, { name: "Sách Phép Cơ Bản", quantity: 1 } ],
        initialQuests: [ 'mage_quest1', 'mage_quest2' ], startingSkill: skill1, customStructures: mageAcademyStructures
    },
];

const mageAcademyWorld: GenerateWorldSetupOutput = {
    customItemCatalog: mageAcademyItems,
    customStructures: mageAcademyStructures,
    concepts: mageAcademyConcepts as any,
};

// =================================================================
// EXPORT ALL PRE-MADE WORLDS
// =================================================================

export const premadeWorlds: GenerateWorldSetupOutput[] = [
    floptropicaWorld,
    frozenWastelandWorld,
    mageAcademyWorld,
];
