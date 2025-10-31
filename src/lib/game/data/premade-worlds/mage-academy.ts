
/**
 * Defines all unique assets for the "Mage Academy" premade world.
 * This file contains the item, structure, and starting scenario definitions
 * for a high-fantasy world set on a magical floating island. Items here are marked with 
 * `spawnEnabled: false` to prevent them from appearing in other, less magical game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const mageAcademyItems: GeneratedItem[] = [
    { id: 'student_wand', name: { en: "Student's Wand", vi: 'Đũa Phép Của Học Viên' }, description: { en: 'A standard-issue wand for apprentices at the academy. Simple, but reliable.', vi: 'Một cây đũa phép tiêu chuẩn cho các pháp sư tập sự tại học viện. Đơn giản nhưng đáng tin cậy.' }, emoji: '🪄', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 0, magicalAttack: 5, physicalDefense: 0, magicalDefense: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0 }, spawnEnabled: false },
    { id: 'tome_of_cantrips', name: { en: 'Tome of Cantrips', vi: 'Sách Phép Cơ Bản' }, description: { en: 'A textbook containing basic, foundational spells.', vi: 'Một cuốn sách giáo khoa chứa các phép thuật cơ bản, nền tảng.' }, emoji: '📕', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'floatstone', name: { en: 'Floatstone', vi: 'Đá Bay' }, description: { en: 'A lightweight rock that hums with anti-gravitational energy.', vi: 'Một tảng đá nhẹ phát ra năng lượng chống trọng lực.' }, emoji: '☁️', category: 'Material', tier: 3, effects: [], baseQuantity: { min: 1, max: 3 }, spawnEnabled: false },
    { id: 'stardust', name: { en: 'Stardust', vi: 'Bụi Sao' }, description: { en: 'Shimmering dust collected from cosmic winds. A potent magical catalyst.', vi: 'Bụi lung linh được thu thập từ gió vũ trụ. Một chất xúc tác ma thuật mạnh mẽ.' }, emoji: '✨', category: 'Magic', tier: 4, effects: [], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { id: 'academy_robe', name: { en: 'Academy Robe', vi: 'Áo Choàng Học Viện' }, description: { en: 'A simple robe worn by students, enchanted to aid in focus.', vi: 'Một chiếc áo choàng đơn giản được học sinh mặc, được phù phép để hỗ trợ sự tập trung.' }, emoji: '🥋', category: 'Armor', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'armor', attributes: { physicalAttack: 0, magicalAttack: 0, physicalDefense: 0, magicalDefense: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 5 }, spawnEnabled: false },
];

const mageAcademyStructures: Structure[] = [
    { name: { en: 'Observatory', vi: 'Đài Quan Sát Thiên Văn' }, description: { en: 'A grand observatory with a massive telescope pointed at the endless sky.', vi: 'Một đài quan sát lớn với một kính thiên văn khổng lồ hướng lên bầu trời vô tận.' }, emoji: '🔭', providesShelter: true, buildable: false },
    { name: { en: 'Infinite Library', vi: 'Thư Viện Vô Tận' }, description: { en: 'A library whose shelves seem to stretch into impossible dimensions.', vi: 'Một thư viện có những kệ sách dường như kéo dài đến những không gian không thể tưởng tượng được.' }, emoji: '📚', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 20 } },
    { name: { en: 'Alchemy Lab', vi: 'Phòng Thí Nghiệm Giả Kim' }, description: { en: 'A laboratory filled with bubbling beakers and the smell of strange reagents.', vi: 'Một phòng thí nghiệm chứa đầy những cốc thủy tinh sủi bọt và mùi của những loại thuốc thử kỳ lạ.' }, emoji: '⚗️', providesShelter: true, buildable: false },
];

const startingSkill: Skill = { name: { en: 'Fireball', vi: 'Quả cầu lửa' }, description: { en: 'Launch a fireball at an enemy, dealing magic damage.', vi: 'Phóng một quả cầu lửa vào kẻ thù, gây sát thương phép.' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };

const mageAcademyConcepts: WorldConcept[] = [
    {
        worldName: "worldName_driftingAcademy", initialNarrative: 'mage_narrative1', startingBiome: 'mountain', // Simulate floating island
        playerInventory: [ { name: { en: "Student's Wand", vi: 'Đũa Phép Của Học Viên' }, quantity: 1, tier: 2, emoji: '🪄' }, { name: { en: "Tome of Cantrips", vi: 'Sách Phép Cơ Bản' }, quantity: 1, tier: 1, emoji: '📕' } ],
        initialQuests: [ 'mage_quest1', 'mage_quest2' ], startingSkill: startingSkill, customStructures: mageAcademyStructures, customItemCatalog: mageAcademyItems
    },
];

export const mageAcademyWorld: GenerateWorldSetupOutput = {
    customItemCatalog: mageAcademyItems,
    customStructures: mageAcademyStructures,
    concepts: mageAcademyConcepts as any,
};
