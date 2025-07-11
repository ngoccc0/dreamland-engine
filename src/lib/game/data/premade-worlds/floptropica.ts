
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const floptropicaItems: GeneratedItem[] = [
    { name: { en: "Jiafei's Pan", vi: 'Chảo của Jiafei' }, description: { en: "A versatile pan, perfect for cooking up... products.", vi: "Một chiếc chảo đa năng, hoàn hảo để nấu... các sản phẩm." }, emoji: '🍳', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'], attributes: { physicalAttack: 5, critChance: 2 } },
    { name: { en: 'Stan Twitter Thread', vi: 'Chủ đề Stan Twitter' }, description: { en: "A printout of a legendary thread. The arguments are incomprehensible, but the passion is palpable.", vi: "Một bản in của một chủ đề huyền thoại. Các lập luận không thể hiểu được, nhưng niềm đam mê thì có thể cảm nhận được." }, emoji: '📜', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
    { name: { en: "CupcakKe's Remix", vi: 'Bản Remix của CupcakKe' }, description: { en: "An MP3 player containing a powerful bass-boosted remix. Restores fighting spirit.", vi: "Một máy nghe nhạc MP3 chứa một bản remix tăng cường âm trầm mạnh mẽ. Phục hồi tinh thần chiến đấu." }, emoji: '🎶', category: 'Support', tier: 3, effects: [{ type: 'RESTORE_STAMINA', amount: 50 }], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
    { name: { en: 'Yass Pill', vi: 'Viên Yass' }, description: { en: "A mysterious, glittery pill that makes you feel fabulous and restores some health.", vi: "Một viên thuốc bí ẩn, lấp lánh giúp bạn cảm thấy tuyệt vời và phục hồi một ít máu." }, emoji: '💊', category: 'Support', tier: 2, effects: [{ type: 'HEAL', amount: 30 }], baseQuantity: { min: 2, max: 2 }, spawnBiomes: ['floptropica'] },
    { name: { en: 'Gusher', vi: 'Gusher' }, description: { en: 'A fruit snack with a liquid center. A delicacy on the island.', vi: "Một món ăn nhẹ trái cây có nhân lỏng. Một món ngon trên đảo." }, emoji: '🥤', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], baseQuantity: { min: 1, max: 2 }, spawnBiomes: ['floptropica'] },
    { name: { en: 'Onika Burger Coupon', vi: 'Phiếu giảm giá Onika Burger' }, description: { en: 'A coupon for a free burger at the most exclusive restaurant chain on the island.', vi: "Một phiếu giảm giá cho một chiếc bánh mì kẹp thịt miễn phí tại chuỗi nhà hàng độc quyền nhất trên đảo." }, emoji: '🎟️', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnBiomes: ['floptropica'] },
];

const floptropicaStructures: Structure[] = [
    { name: { en: "Deborah's C.V.N.T. University", vi: 'Đại học C.V.N.T. của Deborah' }, description: { en: "A prestigious institution where one learns to serve and slay.", vi: "Một học viện danh tiếng nơi người ta học cách phục vụ và 'slay'." }, emoji: '🎓', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 30, stamina: 30 }, heatValue: 1 },
    { name: { en: "Nicki's Barbz Hospital", vi: 'Bệnh viện Barbz của Nicki' }, description: { en: "A place for when you've slayed too close to the sun.", vi: "Một nơi dành cho khi bạn đã 'slay' quá gần mặt trời." }, emoji: '🏥', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 100, stamina: 50 }, heatValue: 0 },
    { name: { en: "Onika Burgers", vi: "Onika Burgers" }, description: { en: "A fast food joint that only plays Nicki Minaj. The burgers are... questionable.", vi: "Một quán ăn nhanh chỉ chơi nhạc của Nicki Minaj. Bánh mì kẹp thịt... có vấn đề." }, emoji: '🍔', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 15, stamina: 40 }, heatValue: 1 },
];

const skill1: Skill = { name: 'skillFireballName', description: 'skillFireballDesc', tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: 'skillHealName', description: 'skillHealDesc', tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill3: Skill = { name: 'skillLifeSiphonName', description: 'skillLifeSiphonDesc', tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };

const floptropicaConcepts: WorldConcept[] = [
    {
        worldName: "worldName_floptropica", initialNarrative: 'floptropica_narrative1', startingBiome: 'floptropica',
        playerInventory: [ { name: "Jiafei's Pan", quantity: 1 }, { name: "Stan Twitter Thread", quantity: 1 } ],
        initialQuests: [ 'floptropica_quest1', 'floptropica_quest2' ], startingSkill: skill1, customStructures: floptropicaStructures
    },
    {
        worldName: "worldName_onikaKingdom", initialNarrative: 'floptropica_narrative2', startingBiome: 'floptropica',
        playerInventory: [ { name: "CupcakKe's Remix", quantity: 1 }, { name: "Onika Burger Coupon", quantity: 1 } ],
        initialQuests: [ 'floptropica_quest3', 'floptropica_quest4' ], startingSkill: skill2, customStructures: floptropicaStructures
    },
    {
        worldName: "worldName_badBussyWasteland", initialNarrative: 'floptropica_narrative3', startingBiome: 'floptropica',
        playerInventory: [ { name: "Jiafei's Pan", quantity: 1 }, { name: "Yass Pill", quantity: 2 } ],
        initialQuests: [ 'floptropica_quest5', 'floptropica_quest6' ], startingSkill: skill3, customStructures: floptropicaStructures
    }
];

export const floptropicaWorld: GenerateWorldSetupOutput = {
    customItemCatalog: floptropicaItems as any,
    customStructures: floptropicaStructures as any,
    concepts: floptropicaConcepts as any,
};
