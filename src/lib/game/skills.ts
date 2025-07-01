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
            amount: 20,
            target: 'ENEMY',
        }
    },
    {
        name: 'Lightning Bolt',
        description: 'Triệu hồi một tia sét mạnh mẽ tấn công kẻ địch, gây sát thương phép cao.',
        tier: 2,
        manaCost: 25,
        effect: {
            type: 'DAMAGE',
            amount: 35,
            target: 'ENEMY',
        }
    }
];
