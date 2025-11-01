
import type { GenerateWorldSetupOutput } from '@/ai/flows/generate-world-setup';
import type { GeneratedItem, Structure, Skill, WorldConcept } from '@/lib/game/types';

const items: GeneratedItem[] = [
    { id: 'trench_coat', name: { en: 'Trench Coat', vi: 'Áo Khoác Trench' }, description: { en: 'A worn, beige trench coat. Smells of rain and regret.', vi: 'Một chiếc áo khoác trench màu be đã sờn. Phảng phất mùi mưa và sự hối tiếc.' }, emoji: '🧥', category: 'Armor', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'armor', attributes: { physicalAttack: 0, magicalAttack: 0, physicalDefense: 3, magicalDefense: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0 }, spawnEnabled: false },
    { id: 'magnifying_glass', name: { en: 'Magnifying Glass', vi: 'Kính Lúp' }, description: { en: 'A classic tool for any detective worth their salt.', vi: 'Một công cụ kinh điển cho bất kỳ thám tử nào đáng giá.' }, emoji: '🔎', category: 'Tool', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'old_revolver', name: { en: 'Old Revolver', vi: 'Khẩu Súng Lục Cũ' }, description: { en: 'A heavy, reliable firearm. It has seen better days.', vi: 'Một khẩu súng lục nặng, đáng tin cậy. Nó đã từng có những ngày huy hoàng hơn.' }, emoji: '🔫', category: 'Weapon', tier: 2, effects: [], baseQuantity: { min: 1, max: 1 }, equipmentSlot: 'weapon', attributes: { physicalAttack: 6, magicalAttack: 0, physicalDefense: 0, magicalDefense: 0, critChance: 3, attackSpeed: 0, cooldownReduction: 0 }, spawnEnabled: false },
    { id: 'case_file', name: { en: 'Case File', vi: 'Hồ Sơ Vụ Án' }, description: { en: 'The file for your latest case. A corporate exec, a data chip, a dame in trouble. Classic.', vi: 'Hồ sơ vụ án mới nhất của bạn. Một giám đốc công ty, một con chip dữ liệu, một quý cô gặp rắc rối. Kinh điển.' }, emoji: '📂', category: 'Data', tier: 1, effects: [], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
    { id: 'synth_whiskey', name: { en: 'Synth-Whiskey', vi: 'Rượu Synth-Whiskey' }, description: { en: 'A cheap synthetic whiskey. Burns on the way down, but steadies the nerves.', vi: 'Một loại rượu whiskey tổng hợp rẻ tiền. Cháy bỏng khi uống, nhưng giúp thần kinh ổn định.' }, emoji: '🥃', category: 'Support', tier: 1, effects: [{ type: 'RESTORE_STAMINA', amount: 20 }, { type: 'RESTORE_MANA', amount: 5 }], baseQuantity: { min: 1, max: 1 }, spawnEnabled: false },
];

const structures: Structure[] = [
    { name: { en: 'Gumshoe Office', vi: 'Văn phòng Thám tử' }, description: { en: 'Your office. A dusty room with a desk, a chair, and a view of a brick wall.', vi: 'Văn phòng của bạn. Một căn phòng bụi bặm với một cái bàn, một cái ghế và một tầm nhìn ra bức tường gạch.' }, emoji: '🏢', providesShelter: true, buildable: false, restEffect: { hp: 10, stamina: 30 }, heatValue: 1 },
    { name: { en: 'Neon Dragon Bar', vi: 'Quán Bar Rồng Neon' }, description: { en: 'A shady bar where information is traded as freely as currency.', vi: 'Một quán bar mờ ám nơi thông tin được trao đổi tự do như tiền tệ.' }, emoji: '🍻', providesShelter: true, buildable: false, restEffect: { hp: 5, stamina: 10 }, heatValue: 1 },
];

const skill1: Skill = { name: { en: 'Heal', vi: 'Chữa lành' }, description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' }, tier: 1, manaCost: 20, effect: { type: 'HEAL', amount: 25, target: 'SELF' } };
const skill2: Skill = { name: { en: 'Life Siphon', vi: 'Hút sinh lực' }, description: { en: 'Deal magic damage and heal for 50% of the damage dealt.', vi: 'Gây sát thương phép và hồi máu bằng 50% sát thương gây ra.' }, tier: 2, manaCost: 30, effect: { type: 'DAMAGE', amount: 25, target: 'ENEMY', healRatio: 0.5 } };


const concepts: WorldConcept[] = [
    {
        worldName: "worldName_rainyCity", initialNarrative: "detective_narrative1", startingBiome: 'city',
        playerInventory: [ { name: { en: "Trench Coat", vi: "Áo Khoác Trench" }, quantity: 1, tier: 2, emoji: '🧥' }, { name: { en: "Case File", vi: "Hồ Sơ Vụ Án" }, quantity: 1, tier: 1, emoji: '📂' } ],
        initialQuests: [ "detective_quest1", "detective_quest2" ], startingSkill: skill1, customStructures: structures
    },
    {
        worldName: "worldName_rainyCity", initialNarrative: "detective_narrative1", startingBiome: 'city',
        playerInventory: [ { name: { en: "Old Revolver", vi: "Khẩu Súng Lục Cũ" }, quantity: 1, tier: 2, emoji: '🔫' }, { name: { en: "Synth-Whiskey", vi: "Rượu Synth-Whiskey" }, quantity: 2, tier: 1, emoji: '🥃' } ],
        initialQuests: [ "detective_quest1", "detective_quest2" ], startingSkill: skill2, customStructures: structures
    },
];

export const detectiveNoirWorld: GenerateWorldSetupOutput = {
    customItemCatalog: items,
    customStructures: structures,
    concepts: concepts as any,
};
