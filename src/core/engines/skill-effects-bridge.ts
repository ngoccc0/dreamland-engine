/**
 * Skill Effects Bridge
 *
 * @remarks
 * Converts skill use outcomes into side effects.
 */

import type { SideEffect } from '@/core/entities/side-effects';

/**
 * Skill use outcome from handler execution
 */
export interface SkillOutcome {
    skillName: string;
    successLevel: string;
    manaCost: number;
    backfireDamage?: number;
    healedAmount?: number;
    finalDamage?: number;
    siphonedAmount?: number;
    enemyDefeated: boolean;
    skillType: 'HEAL' | 'DAMAGE' | 'DEBUFF' | 'BUFF' | 'UNKNOWN';
    playerHpBefore: number;
    playerHpAfter: number;
}

/**
 * Generate side effects from skill outcome
 *
 * @remarks
 * **Effects Generated:**
 * - Audio: Spell cast, success/failure, critical
 * - Animations: Spell cast, hit/heal animation
 * - Notifications: Mana cost, damage/heal, critical success
 * - Events: skill.cast, skill.crit, skill.backfire
 */
export function generateSkillEffects(outcome: SkillOutcome): SideEffect[] {
    const effects: SideEffect[] = [];

    // Audio effects based on success level
    if (outcome.successLevel === 'CriticalFailure') {
        effects.push({
            type: 'playAudio',
            sound: 'skill/backfire.mp3',
            volume: 1.0
        });
    } else if (outcome.successLevel === 'Failure') {
        effects.push({
            type: 'playAudio',
            sound: 'skill/fizzle.mp3',
            volume: 0.7
        });
    } else {
        const soundFile = outcome.successLevel === 'CriticalSuccess'
            ? 'skill/cast-crit.mp3'
            : outcome.skillType === 'HEAL'
                ? 'skill/heal.mp3'
                : 'skill/cast.mp3';

        effects.push({
            type: 'playAudio',
            sound: soundFile,
            volume: 0.9
        });
    }

    // Mana cost notification
    effects.push({
        type: 'showNotification',
        message: `Mana: -${outcome.manaCost}`,
        duration: 1500
    });

    // Backfire effects
    if (outcome.backfireDamage && outcome.backfireDamage > 0) {
        effects.push({
            type: 'playAudio',
            sound: 'skill/backfire-damage.mp3',
            volume: 0.8
        });

        effects.push({
            type: 'triggerAnimation',
            entityId: 'player',
            animation: 'take-damage',
            speed: 1.2
        });

        effects.push({
            type: 'showNotification',
            message: `⚠️ BACKFIRE: Took ${outcome.backfireDamage} damage!`,
            duration: 3000
        });

        effects.push({
            type: 'triggerEvent',
            eventName: 'skill.backfire',
            data: { damage: outcome.backfireDamage }
        });

        return effects; // Stop here for backfire
    }

    // Failure effects
    if (outcome.successLevel === 'Failure') {
        effects.push({
            type: 'showNotification',
            message: 'Spell fizzled!',
            duration: 2000
        });
        return effects;
    }

    // Cast animation
    effects.push({
        type: 'triggerAnimation',
        entityId: 'player',
        animation: 'cast',
        speed: outcome.successLevel === 'CriticalSuccess' ? 1.5 : 1.0
    });

    // Heal effects
    if (outcome.skillType === 'HEAL') {
        if (outcome.healedAmount && outcome.healedAmount > 0) {
            const isCrit = outcome.successLevel === 'CriticalSuccess';
            effects.push({
                type: 'showNotification',
                message: `✨ Healed ${outcome.healedAmount} HP${isCrit ? ' CRITICAL' : ''}!`,
                duration: 2500
            });

            effects.push({
                type: 'spawnParticle',
                particleType: 'heal-burst',
                position: { x: 50, y: 50 }
            });

            effects.push({
                type: 'triggerEvent',
                eventName: 'skill.heal',
                data: { amount: outcome.healedAmount }
            });
        }
    }
    // Damage effects
    else if (outcome.skillType === 'DAMAGE') {
        if (outcome.finalDamage && outcome.finalDamage > 0) {
            const isCrit = outcome.successLevel === 'CriticalSuccess';

            effects.push({
                type: 'triggerAnimation',
                entityId: 'enemy-current',
                animation: isCrit ? 'hit-critical' : 'hit',
                speed: 1.0
            });

            effects.push({
                type: 'showNotification',
                message: `⚡ Dealt ${outcome.finalDamage} damage${isCrit ? ' CRITICAL' : ''}!`,
                duration: 2500
            });

            effects.push({
                type: 'spawnParticle',
                particleType: `spell-impact-${outcome.skillType === 'DAMAGE' ? 'spell' : 'default'}`,
                position: { x: 70, y: 50 }
            });

            effects.push({
                type: 'triggerEvent',
                eventName: 'skill.damage',
                data: {
                    amount: outcome.finalDamage,
                    isCritical: isCrit
                }
            });

            // Life siphon effect
            if (outcome.siphonedAmount && outcome.siphonedAmount > 0) {
                effects.push({
                    type: 'showNotification',
                    message: `🩹 Siphoned ${outcome.siphonedAmount} HP`,
                    duration: 2000
                });

                effects.push({
                    type: 'triggerEvent',
                    eventName: 'skill.siphon',
                    data: { amount: outcome.siphonedAmount }
                });
            }
        }

        // Enemy defeated
        if (outcome.enemyDefeated) {
            effects.push({
                type: 'playAudio',
                sound: 'combat/victory.mp3',
                volume: 1.0
            });

            effects.push({
                type: 'triggerAnimation',
                entityId: 'player',
                animation: 'victory',
                speed: 1.0
            });

            effects.push({
                type: 'showNotification',
                message: '🎉 Enemy defeated by spell!',
                duration: 3000
            });

            effects.push({
                type: 'triggerEvent',
                eventName: 'skill.victory',
                data: { skillName: outcome.skillName }
            });
        }
    }

    // Log for debugging
    effects.push({
        type: 'logDebug',
        message: `Skill: ${outcome.skillName} Level=${outcome.successLevel} Type=${outcome.skillType}`
    });

    return effects;
}
