import type { DiceType } from "./types";
import type { TranslationKey } from "../i18n";

// --- DICE ROLL HELPERS ---
/**
 * @typedef {'CriticalFailure' | 'Failure' | 'Success' | 'GreatSuccess' | 'CriticalSuccess'} SuccessLevel
 * @description Represents the qualitative outcome of a dice roll.
 */
export type SuccessLevel = 'CriticalFailure' | 'Failure' | 'Success' | 'GreatSuccess' | 'CriticalSuccess';

/**
 * @description Categorizes a numerical dice roll into a qualitative success level based on the type of dice used.
 * @param {number} roll - The numerical result of the dice roll.
 * @param {DiceType} diceType - The type of dice used ('d20', 'd12', '2d6').
 * @returns {SuccessLevel} The corresponding success level.
 */
export function getSuccessLevel(roll: number, diceType: DiceType): SuccessLevel {
    if (diceType === 'd20') {
        if (roll === 1) return 'CriticalFailure';
        if (roll <= 8) return 'Failure';      // 35%
        if (roll <= 16) return 'Success';     // 40%
        if (roll <= 19) return 'GreatSuccess';// 15%
        return 'CriticalSuccess'; // 5%
    }
    if (diceType === 'd12') {
        if (roll === 1) return 'CriticalFailure';
        if (roll <= 5) return 'Failure';      // 33.3%
        if (roll <= 9) return 'Success';      // 33.3%
        if (roll <= 11) return 'GreatSuccess';// 16.7%
        return 'CriticalSuccess'; // 8.3%
    }
    if (diceType === '2d6') {
        // Probabilities: 2(2.8%), 3(5.6%), 4(8.3%), 5(11.1%), 6(13.9%), 7(16.7%), 8(13.9%), 9(11.1%), 10(8.3%), 11(5.6%), 12(2.8%)
        if (roll === 2) return 'CriticalFailure';  // 2.8%
        if (roll <= 6) return 'Failure';          // 38.9%
        if (roll <= 9) return 'Success';          // 41.7%
        if (roll <= 11) return 'GreatSuccess';     // 13.9%
        return 'CriticalSuccess'; // 12 (2.8%)
    }
    return 'Success'; // fallback
}

/**
 * @description Simulates rolling a game die.
 * @param {DiceType} diceType - The type of dice to roll.
 * @returns {{ roll: number; range: string }} An object containing the numerical result and a string representing the dice range.
 */
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

/**
 * @description A mapping from SuccessLevel enums to their corresponding translation keys.
 * @type {Record<SuccessLevel, TranslationKey>}
 */
export const successLevelToTranslationKey: Record<SuccessLevel, TranslationKey> = {
    CriticalFailure: 'criticalFailure',
    Failure: 'failure',
    Success: 'success',
    GreatSuccess: 'greatSuccess',
    CriticalSuccess: 'criticalSuccess',
}
