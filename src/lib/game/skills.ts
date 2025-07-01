import type { Skill } from "./types";

// --- SKILL DEFINITIONS ---
export const skillDefinitions: Skill[] = [
    {
        name: 'Heal',
        description: 'Dùng mana để hồi lại một lượng máu.',
        tier: 1,
        manaCost: 20,
        effect: {
            type: 'HEAL',
            amount: 25,
            target: 'SELF',
        }
    },
    {
        name: 'Fireball',
        description: 'Tung một quả cầu lửa vào kẻ địch, gây sát thương phép.',
        tier: 1,
        manaCost: 15,
        effect: {
            type: 'DAMAGE',
            amount: 15, // Base damage before magical attack scaling
            target: 'ENEMY',
        }
    },
    {
        name: 'Life Siphon',
        description: 'Gây sát thương phép và hồi lại máu bằng 50% sát thương gây ra.',
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
        name: 'Chain Lightning',
        description: 'Tạo ra một tia sét mạnh mẽ. Sát thương cao hơn Fireball.',
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
        name: 'Blink',
        description: 'Dịch chuyển tức thời đến một vị trí gần đó trong tầm mắt.',
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
