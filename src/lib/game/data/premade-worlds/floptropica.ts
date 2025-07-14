
/**
 * @fileOverview Defines all unique assets for the "Floptropica" premade world.
 * @description This file contains the item, structure, and starting scenario definitions
 * for a comedic, meme-filled world. Items here are marked with `spawnEnabled: false`
 * to prevent them from appearing in other, more serious game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept, ItemDefinition } from '@/lib/game/types';

const floptropicaItems: GeneratedItem[] = [
    { name: { en: "Jiafei's Pan", vi: 'Chảo của Jiafei' }, description: { en: "A versatile pan, perfect for cooking up... products.", vi: 'Một chiếc chảo đa năng, hoàn hảo để nấu... các sản phẩm.' }, emoji: '🍳', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, attributes: { physicalAttack: 5, critChance: 2 }, equipmentSlot: 'weapon', spawnEnabled: false },
    { name: { en: 'Stan Twitter Thread', vi: 'Chủ đề Stan Twitter' }, description: { en: "A printout of a legendary thread. The arguments are incomprehensible, but the passion is palpable.", vi: 'Một bản in của một chủ đề huyền thoại. Các lập luận không thể hiểu được, nhưng niềm đam mê thì có thể cảm nhận được.' }, emoji: '📜', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: "CupcakKe's Remix", vi: 'Bản Remix của CupcakKe' }, description: { en: 'An MP3 player containing a powerful bass-boosted remix. Restores fighting spirit.', vi: 'Một máy nghe nhạc MP3 chứa một bản remix tăng cường âm trầm mạnh mẽ. Phục hồi tinh thần chiến đấu.' }, emoji: '🎶', category: 'Support', tier: 3, effects: [{ type: 'RESTORE_STAMINA', amount: 50 }], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { name: { en: 'Yass Pill', vi: 'Viên Yass' }, description: { en: 'A mysterious, glittery pill that makes you feel fabulous and restores some health.', vi: 'Một viên thuốc bí ẩn, lấp lánh giúp bạn cảm thấy tuyệt vời và phục hồi một ít máu.' }, emoji: '💊', category: 'Support', tier: 2, effects: [{ type: 'HEAL', amount: 30 }], baseQuantity: { min: 2, max: 2 }, spawnEnabled: false },
    { name: { en: 'Gusher', vi: 'Gusher' }, description: { en: 'A fruit snack with a liquid center. A delicacy on the island.', vi: 'Một món ăn nhẹ trái cây có nhân lỏng. Một món ngon trên đảo.' }, emoji: '🥤', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { name: { en: 'Onika Burger Coupon', vi: 'Phiếu giảm giá Onika Burger' }, description: { en: 'A coupon for a free burger at the most exclusive restaurant chain on the island.', vi: 'Một phiếu giảm giá cho một chiếc bánh mì kẹp thịt miễn phí tại chuỗi nhà hàng độc quyền nhất trên đảo.' }, emoji: '🎟️', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const floptropicaStructures: Structure[] = [
    { name: { en: "Deborah's C.V.N.T. University", vi: 'Đại học C.V.N.T. của Deborah' }, description: { en: "A prestigious institution where one learns to serve and slay.", vi: 'Một học viện danh tiếng nơi người ta học cách phục vụ và slay.' }, emoji: '🎓', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 30, stamina: 30 }, heatValue: 1 },
    { name: { en: "Nicki's Barbz Hospital", vi: 'Bệnh viện Barbz của Nicki' }, description: { en: "A place for when you've slayed too close to the sun.", vi: 'Một nơi dành cho khi bạn đã slay quá gần mặt trời.' }, emoji: '🏥', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 100, stamina: 50 }, heatValue: 0 },
    { name: { en: "Onika Burgers", vi: "Onika Burgers" }, description: { en: "A fast food joint that only plays Nicki Minaj. The burgers are... questionable.", vi: 'Một quán ăn nhanh chỉ chơi nhạc của Nicki Minaj. Bánh mì kẹp thịt... có vấn đề.' }, emoji: '🍔', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 15, stamina: 40 }, heatValue: 1 },
];

const skill1: Skill = { name: { en: 'Fireball', vi: 'Quả cầu lửa' }, description: { en: 'Launch a fireball at an enemy, dealing magic damage.', vi: 'Phóng một quả cầu lửa vào kẻ thù, gây sát thương phép.' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: { en: 'Heal', vi: 'Chữa lành' }, description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill3: Skill = { name: { en: 'Life Siphon', vi: 'Hút sinh lực' }, description: { en: 'Deal magic damage and heal for 50% of the damage dealt.', vi: 'Gây sát thương phép và hồi máu bằng 50% sát thương gây ra.' }, tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };

const floptropicaConcepts: WorldConcept[] = [
    {
        worldName: { en: "Floptropica", vi: "Floptropica" }, initialNarrative: { en: "You awaken on a vibrant, slightly chaotic island. The air smells of Jiafei's products and faint screams of 'ATE!'. A strange pop song emanates from the jungle. You feel a strange urge to 'serve cvnt'.", vi: "Bạn tỉnh dậy trên một hòn đảo sôi động, hơi hỗn loạn. Không khí có mùi sản phẩm của Jiafei và tiếng la hét yếu ớt của 'ATE!'. Một bài hát pop kỳ lạ phát ra từ khu rừng. Bạn cảm thấy một sự thôi thúc kỳ lạ để 'phục vụ cvnt'." }, startingBiome: 'floptropica',
        playerInventory: [ { name: "Jiafei's Pan", quantity: 1 }, { name: "Stan Twitter Thread", quantity: 1 } ],
        initialQuests: [ { en: 'Find the source of the mysterious pop music.', vi: 'Tìm nguồn gốc của bản nhạc pop bí ẩn.' }, { en: 'Serve your first cvnt.', vi: 'Phục vụ cvnt đầu tiên của bạn.' } ], startingSkill: skill1, customStructures: floptropicaStructures
    },
    {
        worldName: { en: "Onika Kingdom", vi: "Vương quốc Onika" }, initialNarrative: { en: "Washed ashore, you find yourself in a land where memes are currency and shade is the deadliest weapon. A distant palace blares the sounds of Nicki Minaj.", vi: "Bị dạt vào bờ, bạn thấy mình ở một vùng đất nơi meme là tiền tệ và sự mỉa mai là vũ khí nguy hiểm nhất. Một cung điện xa xôi vang lên âm thanh của Nicki Minaj." }, startingBiome: 'floptropica',
        playerInventory: [ { name: "CupcakKe's Remix", quantity: 1 }, { name: "Onika Burger Coupon", quantity: 1 } ],
        initialQuests: [ { en: "Reach Nicki's Barbz Hospital.", vi: 'Đến Bệnh viện Barbz của Nicki.' }, { en: 'Craft a stan-worthy meme.', vi: 'Tạo một meme xứng đáng với stan.' } ], startingSkill: skill2, customStructures: floptropicaStructures
    },
    {
        worldName: { en: "Bad Bussy Wasteland", vi: "Vùng đất hoang Bad Bussy" }, initialNarrative: { en: "You've been exiled to the Bad Bussy Wasteland. Here, only the most iconic can survive. The ground trembles with the bass of powerful remixes.", vi: "Bạn đã bị đày đến Vùng đất hoang Bad Bussy. Ở đây, chỉ những người mang tính biểu tượng nhất mới có thể tồn tại. Mặt đất rung chuyển với tiếng bass của những bản remix mạnh mẽ." }, startingBiome: 'floptropica',
        playerInventory: [ { name: "Jiafei's Pan", quantity: 1 }, { name: "Yass Pill", quantity: 2 } ],
        initialQuests: [ { en: 'Survive the night.', vi: 'Sống sót qua đêm.' }, { en: "Find Deborah's C.V.N.T. University.", vi: 'Tìm Đại học C.V.N.T. của Deborah.' } ], startingSkill: skill3, customStructures: floptropicaStructures
    }
];

export const floptropicaWorld: GenerateWorldSetupOutput = {
    customItemCatalog: floptropicaItems,
    customStructures: floptropicaStructures,
    concepts: floptropicaConcepts,
};
