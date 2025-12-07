
/**
 * Defines all unique assets for the "Frozen Wasteland" premade world.
 * This file contains the item, structure, and starting scenario definitions
 * for a post-apocalyptic, icy world. Items here are marked with `spawnEnabled: false`
 * to prevent them from appearing in other, less hostile game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/core/types/game';

const frozenWastelandItems: GeneratedItem[] = [
    { id: 'insulated_canvas', name: { en: 'Insulated Canvas', vi: 'Vải Bố Cách Nhiệt' }, description: { en: 'Thick canvas, patched together to offer some protection against the biting cold.', vi: 'Vải bạt dày, được vá lại với nhau để bảo vệ khỏi cái lạnh cắt da.' }, emoji: '🧣', category: 'Material', tier: 2, effects: [], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { id: 'canned_hot_soup', name: { en: 'Canned Hot Soup', vi: 'Súp Nóng Đóng Hộp' }, description: { en: 'A self-heating can of soup. A warm meal is a luxury in this frozen world.', vi: 'Một hộp súp tự hâm nóng. Một bữa ăn ấm áp là một thứ xa xỉ trong thế giới băng giá này.' }, emoji: '🥫', category: 'Food', tier: 2, effects: [{ type: 'RESTORE_STAMINA', amount: 40 }], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'satellite_debris', name: { en: 'Satellite Debris', vi: 'Mảnh Vỡ Vệ Tinh' }, description: { en: 'A twisted piece of metal from a fallen satellite. Might contain advanced components.', vi: 'Một mảnh kim loại bị xoắn từ một vệ tinh rơi. Có thể chứa các thành phần tiên tiến.' }, emoji: '🛰️', category: 'Material', tier: 4, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'survivors_diary', name: { en: "Survivor's Diary", vi: 'Nhật Ký Của Người Sống Sót' }, description: { en: "A weathered journal. Its pages detail the struggles of someone who came before.", vi: 'Một cuốn nhật ký cũ kỹ. Các trang của nó chi tiết về cuộc đấu tranh của một người nào đó đã đến trước.' }, emoji: '📔', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'makeshift_ice_axe', name: { en: 'Makeshift Ice Axe', vi: 'Rìu Băng Tự Chế' }, description: { en: 'A crude axe made from sharpened scrap metal, useful for climbing and defense.', vi: 'Một chiếc rìu thô sơ làm từ phế liệu kim loại được mài sắc, hữu ích cho việc leo trèo và phòng thủ.' }, emoji: '⛏️', category: 'Weapon', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, attributes: { physicalAttack: 4, magicalAttack: 0, physicalDefense: 0, magicalDefense: 0, critChance: 1, attackSpeed: 0, cooldownReduction: 0 }, equipmentSlot: 'weapon', spawnEnabled: false },
];

const frozenWastelandStructures: Structure[] = [
    { name: { en: 'Abandoned Research Station', vi: 'Trạm Nghiên Cứu Bị Bỏ Hoang' }, description: { en: 'A desolate outpost, half-buried in snow. Its instruments are long silent.', vi: 'Một tiền đồn hoang vắng, bị chôn vùi một nửa trong tuyết. Các công cụ của nó đã im lặng từ lâu.' }, emoji: '🔬', providesShelter: true, buildable: false, restEffect: { hp: 25, stamina: 50 }, heatValue: 2 },
    { name: { en: 'Fallen Satellite', vi: 'Vệ Tinh Rơi' }, description: { en: 'The wreckage of a satellite that crashed from orbit long ago.', vi: 'Xác của một vệ tinh rơi từ quỹ đạo từ rất lâu.' }, emoji: '🛰️', providesShelter: true, buildable: false },
];

const startingSkill: Skill = { name: { en: 'Heal', vi: 'Chữa lành' }, description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };

const frozenWastelandConcepts: WorldConcept[] = [
    {
        worldName: "worldName_frostedWreckage", initialNarrative: 'frozen_narrative1', startingBiome: 'tundra',
        playerInventory: [ { name: { en: "Makeshift Ice Axe", vi: 'Rìu Băng Tự Chế' }, quantity: 1, tier: 1, emoji: '⛏️' }, { name: { en: "Canned Hot Soup", vi: 'Súp Nóng Đóng Hộp' }, quantity: 1, tier: 2, emoji: '🥫' } ],
        initialQuests: [ 'frozen_quest1', 'frozen_quest2' ], startingSkill: startingSkill, customStructures: frozenWastelandStructures, customItemCatalog: frozenWastelandItems
    },
];

export const frozenWastelandWorld: GenerateWorldSetupOutput = {
    customItemCatalog: frozenWastelandItems,
    customStructures: frozenWastelandStructures,
    concepts: frozenWastelandConcepts as any,
};
