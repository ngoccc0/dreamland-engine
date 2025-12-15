
/**
 * Defines all player skills available in the game.
 * This file contains a static array of skill objects, including their
 * effects, mana costs, and the conditions required to unlock them.
 */

import type { Skill } from "@/core/types/game";

/**
 * A static array containing all skill definitions in the game.
 * New skills can be added directly to this array.
 * @type {Skill[]}
 */
export const skillDefinitions: Skill[] = [
    {
        name: { en: 'Heal', vi: 'Chữa lành' },
        description: { en: 'Use mana to restore a small amount of health.', vi: 'Sử dụng mana để phục hồi một lượng nhỏ máu.' },
        tier: 1,
        manaCost: 20,
        effect: {
            type: 'HEAL',
            amount: 25,
            target: 'SELF',
        }
    },
    {
        name: { en: 'Fireball', vi: 'Quả cầu lửa' },
        description: { en: 'Launch a fireball at an enemy, dealing magic damage.', vi: 'Phóng một quả cầu lửa vào kẻ thù, gây sát thương phép.' },
        tier: 1,
        manaCost: 15,
        effect: {
            type: 'DAMAGE',
            amount: 15, // Base damage before magical attack scaling
            target: 'ENEMY',
        }
    },
    {
        name: { en: 'Life Siphon', vi: 'Hút sinh lực' },
        description: { en: 'Deal magic damage and heal for 50% of the damage dealt.', vi: 'Gây sát thương phép và hồi máu bằng 50% sát thương gây ra.' },
        tier: 2,
        manaCost: 30,
        effect: {
            type: 'DAMAGE',
            amount: 25,
            target: 'ENEMY',
            healRatio: 0.5,
        },
        unlockCondition: {
            type: 'kills',
            count: 15,
        }
    },
    {
        name: { en: 'Chain Lightning', vi: 'Sét chuỗi' },
        description: { en: 'Unleash a powerful bolt of lightning. Higher damage than Fireball.', vi: 'Phóng ra một tia sét mạnh mẽ. Sát thương cao hơn Quả cầu lửa.' },
        tier: 2,
        manaCost: 25,
        effect: {
            type: 'DAMAGE',
            amount: 30,
            target: 'ENEMY',
        },
        unlockCondition: {
            type: 'damageSpells',
            count: 20,
        }
    },
    // NOTE: Blink skill requires a targeting UI, which will be implemented in a future update.
    {
        name: { en: 'Blink', vi: 'Dịch chuyển' },
        description: { en: 'Instantly teleport to a nearby location in sight.', vi: 'Dịch chuyển tức thời đến một vị trí gần đó trong tầm mắt.' },
        tier: 3,
        manaCost: 40,
        effect: {
            type: 'TELEPORT',
            amount: 5, // Represents 5x5 area
            target: 'SELF',
        },
        unlockCondition: {
            type: 'moves',
            count: 50,
        }
    }
];
