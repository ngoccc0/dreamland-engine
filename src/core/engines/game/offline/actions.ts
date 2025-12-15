/**
 * Offline Action Narrative Generation
 *
 * @remarks
 * Generates narrative feedback for player actions (attack, item use, skills)
 * in offline mode. Maps action results to localized narrative strings with
 * appropriate context and sensory details.
 */

import type { Chunk, Language, PlayerStatus } from "@/core/types/game";
import { getTranslatedText } from "@/lib/utils";
import type { TranslationKey } from "@/lib/core/i18n";

/**
 * Generates narrative feedback for an offline action (attack, item use, skill).
 *
 * @remarks
 * **Action Types:**
 * - **attack**: Maps successLevel to narrative keys (critFail, fail, success, critSuccess)
 * - **useItem**: Describes item consumption or taming attempt with effect/target
 * - **useSkill**: Narrates skill execution (damage, heal, crit fail backfire)
 *
 * **Sensory Feedback:**
 * Uses chunk temperature, light level, and moisture to select a random
 * contextual sensory phrase (hot, cold, dark, rain, etc.)
 *
 * @param actionType - Type of action ("attack", "useItem", "useSkill")
 * @param actionResult - Result object with successLevel, damage, status, etc.
 * @param currentChunk - Current chunk for sensory context
 * @param t - Translation function
 * @param language - Language code
 * @returns Narrative string for the action result
 */
export const generateOfflineActionNarrative = (
    actionType: string,
    actionResult: any,
    currentChunk: Chunk,
    t: (key: TranslationKey, replacements?: any) => string,
    language: Language,
) => {
    let narrativeKey: TranslationKey = '';
    let replacements: any = {};

    // Get enemy name from chunk, with fallback translation
    const enemyType = currentChunk.enemy && currentChunk.enemy.type
        ? getTranslatedText(currentChunk.enemy.type, language, t)
        : ' существо';

    // Select sensory feedback based on chunk environment
    const sensoryFeedbackOptions = [
        `sensoryFeedback_${currentChunk.temperature && currentChunk.temperature > 80 ? 'hot' : 'cold'}`,
        `sensoryFeedback_${currentChunk.lightLevel < 20 ? 'dark' : 'normal'}`,
        `sensoryFeedback_${currentChunk.moisture > 70 ? 'rain' : 'normal'}`
    ];
    const sensory_feedback = t(sensoryFeedbackOptions[Math.floor(Math.random() * sensoryFeedbackOptions.length)]);

    switch (actionType) {
        case 'attack': {
            // Map SuccessLevel to narrative suffixes
            const succ = actionResult.successLevel;
            const suffixMap: Record<string, string> = {
                CriticalFailure: 'critFail',
                Failure: 'fail',
                Success: 'success',
                GreatSuccess: 'success',
                CriticalSuccess: 'critSuccess'
            };
            const suffix = suffixMap[succ] ?? succ.toLowerCase();
            narrativeKey = `actionNarrative_attack_${suffix}`;

            let attack_description = t(`attackNarrative_${suffix}`, { enemyType });
            let damage_report = actionResult.playerDamage > 0
                ? t('attackDamageDealt', { damage: actionResult.playerDamage })
                : '';
            let enemy_reaction = '';

            if (actionResult.enemyDefeated) {
                enemy_reaction = t('enemyDefeatedNarrative', { enemyType });
            } else if (actionResult.fled) {
                enemy_reaction = t('enemyFledNarrative', { enemyType });
            } else if (actionResult.enemyDamage > 0) {
                enemy_reaction = t('enemyRetaliationNarrative', { enemyType, damage: actionResult.enemyDamage });
            } else {
                enemy_reaction = t('enemyPreparesNarrative', { enemyType });
            }

            replacements = { attack_description, damage_report, sensory_feedback, enemy_reaction };
            break;
        }

        case 'useItem': {
            if (actionResult.target === 'player') {
                narrativeKey = actionResult.wasUsed ? 'itemUsePlayerSuccessNarrative' : 'itemUsePlayerFailNarrative';
                replacements = {
                    item: getTranslatedText(actionResult.itemName, language, t),
                    effect: actionResult.effectDescription,
                    sensory_feedback
                };
            } else {
                narrativeKey = actionResult.wasTamed ? 'itemTameSuccessNarrative' : 'itemTameFailNarrative';
                replacements = {
                    item: getTranslatedText(actionResult.itemName, language, t),
                    target: getTranslatedText(actionResult.target, language, t),
                    sensory_feedback
                };
            }
            break;
        }

        case 'useSkill': {
            const skillName = getTranslatedText(actionResult.skill.name, language, t);

            if (actionResult.successLevel === 'CriticalFailure') {
                narrativeKey = 'skillCritFailNarrative';
                replacements = { skillName, damage: actionResult.backfireDamage, sensory_feedback };
            } else if (actionResult.successLevel === 'Failure') {
                narrativeKey = 'skillFailNarrative';
                replacements = { skillName, sensory_feedback };
            } else {
                if (actionResult.skill.effect.type === 'HEAL') {
                    narrativeKey = 'skillHealSuccessNarrative';
                    replacements = { skillName, amount: actionResult.healedAmount, sensory_feedback };
                } else if (actionResult.skill.effect.type === 'DAMAGE') {
                    let narrative = t('skillDamageSuccessNarrative', {
                        skillName,
                        enemy: enemyType,
                        damage: actionResult.finalDamage,
                        sensory_feedback
                    });
                    if (actionResult.siphonedAmount) {
                        narrative += ' ' + t('skillSiphonNarrative', { amount: actionResult.siphonedAmount });
                    }
                    return narrative;
                }
            }
            break;
        }
    }

    if (!narrativeKey) return "An unknown action occurred.";
    return t(narrativeKey, replacements);
};
