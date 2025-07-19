
/**
 * @fileOverview Defines all unique assets for the "Floptropica" premade world.
 * @description This file contains the item, structure, and starting scenario definitions
 * for a comedic, meme-filled world. Items here are marked with `spawnEnabled: false`
 * to prevent them from appearing in other, more serious game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept, ItemDefinition } from '@/lib/game/types';

const floptropicaItems: GeneratedItem[] = [
    { id: 'jiafeis_pan', name: { en: "Jiafei's Pan", vi: 'Chảo của Jiafei' }, description: { en: "A versatile pan, perfect for cooking up... products.", vi: 'Một chiếc chảo đa năng, hoàn hảo để nấu... các sản phẩm.' }, emoji: '🍳', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, attributes: { physicalAttack: 5, critChance: 2 }, equipmentSlot: 'weapon', spawnEnabled: false },
    { id: 'stan_twitter_thread', name: { en: 'Stan Twitter Thread', vi: 'Chủ đề Stan Twitter' }, description: { en: "A printout of a legendary thread. The arguments are incomprehensible, but the passion is palpable.", vi: 'Một bản in của một chủ đề huyền thoại. Các lập luận không thể hiểu được, nhưng niềm đam mê thì có thể cảm nhận được.' }, emoji: '📜', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'cupcakkes_remix', name: { en: "CupcakKe's Remix", vi: 'Bản Remix của CupcakKe' }, description: { en: 'An MP3 player containing a powerful bass-boosted remix. Restores fighting spirit.', vi: 'Một máy nghe nhạc MP3 chứa một bản remix tăng cường âm trầm mạnh mẽ. Phục hồi tinh thần chiến đấu.' }, emoji: '🎶', category: 'Support', tier: 3, effects: [{ type: 'RESTORE_STAMINA', amount: 50 }], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'yass_pill', name: { en: 'Yass Pill', vi: 'Viên Yass' }, description: { en: 'A mysterious, glittery pill that makes you feel fabulous and restores some health.', vi: 'Một viên thuốc bí ẩn, lấp lánh giúp bạn cảm thấy tuyệt vời và phục hồi một ít máu.' }, emoji: '💊', category: 'Support', tier: 2, effects: [{ type: 'HEAL', amount: 30 }], baseQuantity: { min: 2, max: 2 }, spawnEnabled: false },
    { id: 'gusher', name: { en: 'Gusher', vi: 'Gusher' }, description: { en: 'A fruit snack with a liquid center. A delicacy on the island.', vi: 'Một món ăn nhẹ trái cây có nhân lỏng. Một món ngon trên đảo.' }, emoji: '🥤', category: 'Food', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 30 }], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { id: 'onika_burger_coupon', name: { en: 'Onika Burger Coupon', vi: 'Phiếu giảm giá Onika Burger' }, description: { en: 'A coupon for a free burger at the most exclusive restaurant chain on the island.', vi: 'Một phiếu giảm giá cho một chiếc bánh mì kẹp thịt miễn phí tại chuỗi nhà hàng độc quyền nhất trên đảo.' }, emoji: '🎟️', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'floptropica_map', name: { en: 'Floptropica Map', vi: 'Bản đồ Floptropica' }, description: { en: 'A crudely drawn map of Floptropica, showing some key locations.', vi: 'Một bản đồ Floptropica được vẽ nguệch ngoạc, hiển thị một số địa điểm quan trọng.' }, emoji: '🗺️', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
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
        worldName: { en: "The Jungle of Slay", vi: "Khu rừng của Slay" },
        initialNarrative: { en: "You awaken in a vibrant, meme-filled jungle, armed with only a pan and a legendary Twitter thread. Your quest: to find the lost archives of Pop Culture.", vi: "Bạn thức dậy trong một khu rừng đầy meme sôi động, chỉ với một chiếc chảo và một chủ đề Twitter huyền thoại. Nhiệm vụ của bạn: tìm kiếm kho lưu trữ văn hóa Pop đã mất." },
        startingBiome: 'jungle',
        playerInventory: [
            { name: { en: "Jiafei's Pan", vi: 'Chảo của Jiafei' }, quantity: 1, tier: 2, emoji: '🍳' },
            { name: { en: "Stan Twitter Thread", vi: 'Chủ đề Stan Twitter' }, quantity: 1, tier: 1, emoji: '📜' },
            { name: { en: "Floptropica Map", vi: 'Bản đồ Floptropica' }, quantity: 1, tier: 1, emoji: '🗺️' }
        ],
        initialQuests: [ { en: "Find the 'Lost Archives' of Pop Culture.", vi: "Tìm 'Kho lưu trữ đã mất' của Văn hóa Pop." }, { en: "Defeat 5 'Haters'.", vi: "Đánh bại 5 'Kẻ thù'." } ],
        startingSkill: skill1,
        customStructures: floptropicaStructures
    },
    {
        worldName: { en: "Onika's Urban Kingdom", vi: "Vương quốc đô thị của Onika" },
        initialNarrative: { en: "The concrete jungle of Onika's Kingdom is your new reality. With a powerful remix and a burger coupon, you must navigate the city's challenges and rise to fame.", vi: "Khu rừng bê tông của Vương quốc Onika là thực tại mới của bạn. Với một bản remix mạnh mẽ và một phiếu giảm giá bánh mì kẹp thịt, bạn phải vượt qua những thử thách của thành phố và vươn lên danh tiếng." },
        startingBiome: 'city',
        playerInventory: [
            { name: { en: "CupcakKe's Remix", vi: 'Bản Remix của CupcakKe' }, quantity: 1, tier: 3, emoji: '🎶' },
            { name: { en: "Onika Burger Coupon", vi: 'Phiếu giảm giá Onika Burger' }, quantity: 1, tier: 1, emoji: '🎟️' }
        ],
        initialQuests: [ { en: "Achieve 'Main Pop Girl' status.", vi: "Đạt được trạng thái 'Main Pop Girl'." }, { en: "Collect 3 'Receipts' of your rivals.", vi: "Thu thập 3 'Biên lai' của đối thủ." } ],
        startingSkill: skill2,
        customStructures: floptropicaStructures
    },
    {
        worldName: { en: "The Bad Bussy Desert", vi: "Sa mạc Bad Bussy" },
        initialNarrative: { en: "Stranded in the desolate Bad Bussy Wasteland, your only companions are a trusty pan and some 'Yass Pills'. Survive the harsh environment and uncover its hidden secrets.", vi: "Mắc kẹt trong Sa mạc Bad Bussy hoang vắng, những người bạn đồng hành duy nhất của bạn là một chiếc chảo đáng tin cậy và một vài 'Viên Yass'. Sống sót trong môi trường khắc nghiệt và khám phá những bí mật ẩn giấu của nó." },
        startingBiome: 'desert',
        playerInventory: [
            { name: { en: "Jiafei's Pan", vi: 'Chảo của Jiafei' }, quantity: 1, tier: 2, emoji: '🍳' },
            { name: { en: "Yass Pill", vi: 'Viên Yass' }, quantity: 2, tier: 2, emoji: '💊' }
        ],
        initialQuests: [ { en: "Find the 'Oasis of Authenticity'.", vi: "Tìm 'Ốc đảo của sự chân thực'." }, { en: "Defeat the 'Cringe Lord'.", vi: "Đánh bại 'Chúa tể Cringe'." } ],
        startingSkill: skill3,
        customStructures: floptropicaStructures
    }
];

export const floptropicaWorld: GenerateWorldSetupOutput = {
    customItemCatalog: floptropicaItems,
    customStructures: floptropicaStructures,
    concepts: floptropicaConcepts as any,
};
