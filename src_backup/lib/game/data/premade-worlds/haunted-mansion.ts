
/**
 * @fileOverview Defines all unique assets for the "Haunted Mansion" premade world.
 * @description This file contains the item, structure, and starting scenario definitions
 * for a horror-themed world. Items here are marked with `spawnEnabled: false`
 * to prevent them from appearing in other, less spooky game worlds.
 */
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { id: 'rusty_lantern', name: { en: 'Rusty Lantern', vi: 'Đèn lồng Gỉ sét' }, description: { en: 'An old oil lantern. Provides a flickering, unreliable light.', vi: 'Một chiếc đèn lồng dầu cũ kỹ. Cung cấp ánh sáng leo lét, không đáng tin cậy.' }, emoji: '🏮', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'silver_key', name: { en: 'Silver Key', vi: 'Chìa khóa Bạc' }, description: { en: 'A small, ornate silver key. It feels cold to the touch.', vi: 'Một chiếc chìa khóa bạc nhỏ, được trang trí tinh xảo. Cảm giác lạnh khi chạm vào.' }, emoji: '🗝️', category: 'Data', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'torn_diary_page', name: { en: 'Torn Diary Page', vi: 'Trang Nhật ký Bị xé' }, description: { en: "A page torn from a diary. It reads: '...it knows what I'm thinking. The walls... they move...'", vi: "Một trang giấy bị xé từ một cuốn nhật ký. Nó viết: '...nó biết tôi đang nghĩ gì. Những bức tường... chúng di chuyển...'" }, emoji: '📄', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'ectoplasm', name: { en: 'Ectoplasm', vi: 'Ectoplasm' }, description: { en: 'A viscous, supernatural substance left behind by a ghost.', vi: 'Một chất siêu nhiên, nhớt do một con ma để lại.' }, emoji: '👻', category: 'Material', tier: 3, effects: [], baseQuantity: { min: 1, max: 2 }, spawnEnabled: false },
    { id: 'old_compass', name: { en: 'Old Compass', vi: 'La bàn cũ' }, description: { en: 'An old, slightly broken compass. It still points north, mostly.', vi: 'Một chiếc la bàn cũ, hơi hỏng. Nó vẫn chỉ hướng bắc, hầu hết.' }, emoji: '🧭', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Grand Foyer', vi: 'Đại Sảnh' }, description: { en: 'A large, imposing foyer. The portraits on the walls seem to watch you.', vi: 'Một đại sảnh lớn, hùng vĩ. Những bức chân dung trên tường dường như đang theo dõi bạn.' }, emoji: '🚪', providesShelter: true, buildable: false, buildCost: [], restEffect: undefined, heatValue: 0 },
    { name: { en: 'Dusty Library', vi: 'Thư viện Bụi bặm' }, description: { en: 'Rows of books, covered in a thick layer of dust. The air is heavy with the smell of old paper.', vi: 'Những hàng sách, phủ một lớp bụi dày. Không khí nặng mùi giấy cũ.' }, emoji: '📚', providesShelter: true, buildable: false, buildCost: [], restEffect: { hp: 10, stamina: 10, mana: 0 }, heatValue: -1 },
];

const skill1: Skill = { name: { en: 'Fireball', vi: 'Quả cầu lửa' }, description: { en: 'Launch a fireball at an enemy, dealing magic damage.', vi: 'Phóng một quả cầu lửa vào kẻ thù, gây sát thương phép.' }, tier: 1, manaCost: 15, effect: { type: 'DAMAGE', amount: 15, target: 'ENEMY' } };
const skill2: Skill = { name: { en: 'Heal', vi: 'Chữa lành' }, description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };


const concepts: WorldConcept[] = [
    {
        worldName: { en: "The Whispering Halls of Blackwood", vi: "Hành lang thì thầm của Blackwood" },
        initialNarrative: { en: "You find yourself trapped within the decaying walls of Blackwood Manor, a rusty lantern your only guide. Whispers echo from the shadows, and a torn diary page hints at a dark past. Can you uncover the mansion's secrets before they consume you?", vi: "Bạn thấy mình bị mắc kẹt trong những bức tường mục nát của Dinh thự Blackwood, chiếc đèn lồng gỉ sét là vật dẫn đường duy nhất của bạn. Những tiếng thì thầm vang vọng từ bóng tối, và một trang nhật ký bị xé hé lộ một quá khứ đen tối. Bạn có thể khám phá những bí mật của dinh thự trước khi chúng nuốt chửng bạn không?" },
        startingBiome: 'cave', // Using 'cave' to represent dark, indoor spaces
        playerInventory: [
            { name: {en: "Rusty Lantern", vi: "Đèn lồng Gỉ sét"}, quantity: 1, tier: 1, emoji: '🏮' },
            { name: {en: "Torn Diary Page", vi: "Trang Nhật ký Bị xé"}, quantity: 1, tier: 1, emoji: '📄' }
        ],
        initialQuests: [
            { en: "Find the missing pages of the diary.", vi: "Tìm những trang nhật ký bị mất." },
            { en: "Uncover the truth behind the manor's haunting.", vi: "Khám phá sự thật đằng sau vụ ma ám của dinh thự." }
        ],
        startingSkill: skill1,
        customStructures: structures
    },
    {
        worldName: { en: "The Shadowed Grounds of Blackwood", vi: "Khu đất bị che phủ bởi bóng tối của Blackwood" },
        initialNarrative: { en: "A chilling fog clings to the grounds of Blackwood Manor. You possess a mysterious silver key, a relic that might unlock more than just doors. Beware the unseen horrors that lurk in the mist.", vi: "Một màn sương lạnh lẽo bao phủ khu đất của Dinh thự Blackwood. Bạn sở hữu một chiếc chìa khóa bạc bí ẩn, một di vật có thể mở khóa nhiều hơn là những cánh cửa. Hãy cẩn thận với những nỗi kinh hoàng vô hình ẩn nấp trong màn sương." },
        startingBiome: 'swamp', // Represents a haunted, misty exterior
        playerInventory: [
            { name: {en: "Silver Key", vi: "Chìa khóa Bạc"}, quantity: 1, tier: 2, emoji: '🗝️' },
            { name: {en: "Old Compass", vi: "La bàn cũ"}, quantity: 1, tier: 1, emoji: '🧭' }
        ],
        initialQuests: [
            { en: "Discover what the silver key unlocks.", vi: "Khám phá chìa khóa bạc mở khóa điều gì." },
            { en: "Navigate the haunted grounds to a safe haven.", vi: "Điều hướng qua khu đất bị ma ám đến một nơi trú ẩn an toàn." }
        ],
        startingSkill: skill2,
        customStructures: structures
    },
    {
        worldName: { en: "The Ectoplasmic Enigma", vi: "Bí ẩn Ectoplasm" },
        initialNarrative: { en: "You awaken in a spectral forest, surrounded by an eerie glow. Strange ectoplasmic residue covers the trees, hinting at recent paranormal activity. Your goal: to understand and perhaps control the ghostly energies of this place.", vi: "Bạn thức dậy trong một khu rừng ma quái, được bao quanh bởi một ánh sáng kỳ lạ. Cặn ectoplasm kỳ lạ bao phủ cây cối, gợi ý về hoạt động siêu nhiên gần đây. Mục tiêu của bạn: hiểu và có thể kiểm soát năng lượng ma quái của nơi này." },
        startingBiome: 'forest', // Represents a haunted forest
        playerInventory: [
            { name: {en: "Ectoplasm", vi: "Ectoplasm"}, quantity: 1, tier: 3, emoji: '👻' },
            { name: {en: "Rusty Lantern", vi: "Đèn lồng Gỉ sét"}, quantity: 1, tier: 1, emoji: '🏮' }
        ],
        initialQuests: [
            { en: "Collect more ectoplasm to study its properties.", vi: "Thu thập thêm ectoplasm để nghiên cứu các đặc tính của nó." },
            { en: "Find the source of the spectral energy.", vi: "Tìm nguồn năng lượng ma quái." }
        ],
        startingSkill: skill1,
        customStructures: structures
    }
];

export const hauntedMansionWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
