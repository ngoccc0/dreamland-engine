
import type { DiceType } from "./types";
import type { TranslationKey } from "../i18n";

// --- DICE ROLL HELPERS ---
export type SuccessLevel = 'CriticalFailure' | 'Failure' | 'Success' | 'GreatSuccess' | 'CriticalSuccess';

export function getSuccessLevel(roll: number, diceType: DiceType): SuccessLevel {
    if (diceType === 'd20') {
        if (roll === 1) return 'CriticalFailure';
        if (roll <= 8) return 'Failure';
        if (roll <= 16) return 'Success';
        if (roll <= 19) return 'GreatSuccess';
        return 'CriticalSuccess'; // 20
    }
    if (diceType === 'd12') {
        if (roll === 1) return 'CriticalFailure';
        if (roll <= 5) return 'Failure';
        if (roll <= 10) return 'Success';
        if (roll === 11) return 'GreatSuccess';
        return 'CriticalSuccess'; // 12
    }
    if (diceType === '2d6') {
        if (roll === 2) return 'CriticalFailure';
        if (roll <= 5) return 'Failure';
        if (roll <= 9) return 'Success';
        if (roll <= 11) return 'GreatSuccess';
        return 'CriticalSuccess'; // 12
    }
    return 'Success'; // fallback
}

export const rollDice = (diceType: DiceType): { roll: number; range: string } => {
    switch (diceType) {
        case 'd12':
            return { roll: Math.floor(Math.random() * 12) + 1, range: '1-12' };
        case '2d6':
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            return { roll: d1 + d2, range: '2-12' };
        case 'd20':
        default:
            return { roll: Math.floor(Math.random() * 20) + 1, range: '1-20' };
    }
};

export const successLevelToTranslationKey: Record<SuccessLevel, TranslationKey> = {
    CriticalFailure: 'criticalFailure',
    Failure: 'failure',
    Success: 'success',
    GreatSuccess: 'greatSuccess',
    CriticalSuccess: 'criticalSuccess',
}
