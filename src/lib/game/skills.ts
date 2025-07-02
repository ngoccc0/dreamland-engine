
import type { Skill } from "./types";

// --- SKILL DEFINITIONS ---
export const skillDefinitions: Skill[] = [
    {
        name: 'skillHealName',
        description: 'skillHealDesc',
        tier: 1,
        manaCost: 20,
        effect: {
            type: 'HEAL',
            amount: 25,
            target: 'SELF',
        }
    },
    {
        name: 'skillFireballName',
        description: 'skillFireballDesc',
        tier: 1,
        manaCost: 15,
        effect: {
            type: 'DAMAGE',
            amount: 15, // Base damage before magical attack scaling
            target: 'ENEMY',
        }
    },
    {
        name: 'skillLifeSiphonName',
        description: 'skillLifeSiphonDesc',
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
        name: 'skillChainLightningName',
        description: 'skillChainLightningDesc',
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
        name: 'skillBlinkName',
        description: 'skillBlinkDesc',
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
