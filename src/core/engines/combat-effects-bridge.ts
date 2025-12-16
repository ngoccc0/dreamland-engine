/**
 * Combat Effects Bridge (Phase 4B.2)
 *
 * @remarks
 * Converts combat outcomes from existing handlers into side effects.
 * This bridges the existing combat system with the new effect executor.
 */

import type { SideEffect } from '@/core/entities/side-effects';

/**
 * Combat outcome from handler execution
 */
export interface CombatOutcome {
    playerDamage: number;
    enemyDamage: number;
    enemyDefeated: boolean;
    enemyFled: boolean;
    successLevel: string;
    lootDrops: Array<{ name: string; quantity: number; emoji?: string }>;
    playerHpBefore: number;
    playerHpAfter: number;
    enemyHpBefore: number;
    enemyHpAfter: number;
}

/**
 * Generate side effects from combat outcome
 *
 * @remarks
 * Takes a combat result and returns array of side effects to execute.
 *
 * **Effects Generated:**
 * - Audio: Hit sounds, critical hit, defeat fanfare
 * - Animations: Damage numbers, hit/miss animations
 * - Notifications: Damage dealt, enemy defeated, loot acquired
 * - Events: combat.ended, enemy.defeated, loot.acquired
 *
 * @param outcome - Combat result from handler
 * @returns Array of side effects
 *
 * @example
 * const outcome = { playerDamage: 25, enemyDamage: 0, enemyDefeated: true, ... };
 * const effects = generateCombatEffects(outcome);
 * executeEffects(effects);
 */
export function generateCombatEffects(outcome: CombatOutcome): SideEffect[] {
    const effects: SideEffect[] = [];

    // Audio effects
    if (outcome.playerDamage > 0) {
        const isCritical = outcome.successLevel === 'CriticalSuccess';
        effects.push({
            type: 'playAudio',
            sound: isCritical ? 'combat/critical-hit.mp3' : 'combat/hit.mp3',
            volume: isCritical ? 1.0 : 0.8
        });
    } else if (outcome.successLevel === 'CriticalFailure') {
        effects.push({
            type: 'playAudio',
            sound: 'combat/miss.mp3',
            volume: 0.6
        });
    }

    // Enemy hit animation
    if (outcome.playerDamage > 0) {
        effects.push({
            type: 'triggerAnimation',
            entityId: 'enemy-current',
            animation: outcome.successLevel === 'CriticalSuccess' ? 'hit-critical' : 'hit',
            speed: 1.0
        });
    }

    // Damage notification
    if (outcome.playerDamage > 0) {
        const critMarker = outcome.successLevel === 'CriticalSuccess' ? ' 💥 CRITICAL' : '';
        effects.push({
            type: 'showNotification',
            message: `Dealt ${outcome.playerDamage} damage${critMarker}!`,
            duration: 2000
        });
    }

    // Enemy defeated effects
    if (outcome.enemyDefeated) {
        effects.push({
            type: 'playAudio',
            sound: 'combat/victory.mp3',
            volume: 1.0
        });

        effects.push({
            type: 'showNotification',
            message: '🎉 Enemy defeated!',
            duration: 3000
        });

        effects.push({
            type: 'triggerAnimation',
            entityId: 'player',
            animation: 'victory',
            speed: 1.2
        });

        effects.push({
            type: 'triggerEvent',
            eventName: 'combat.victory',
            data: {
                playerDamageDealt: outcome.playerDamage,
                enemyDefeated: true
            }
        });
    }

    // Enemy fled effects
    if (outcome.enemyFled) {
        effects.push({
            type: 'playAudio',
            sound: 'combat/flee.mp3',
            volume: 0.7
        });

        effects.push({
            type: 'showNotification',
            message: 'Enemy fled!',
            duration: 2000
        });
    }

    // Loot effects
    if (outcome.lootDrops && outcome.lootDrops.length > 0) {
        const lootNames = outcome.lootDrops
            .map(drop => `${drop.quantity}x ${drop.name}`)
            .join(', ');

        effects.push({
            type: 'showNotification',
            message: `📦 Loot: ${lootNames}`,
            duration: 3000
        });

        effects.push({
            type: 'triggerEvent',
            eventName: 'loot.acquired',
            data: {
                items: outcome.lootDrops
            }
        });

        effects.push({
            type: 'spawnParticle',
            particleType: 'loot-drop',
            position: { x: 10, y: 10 }
        });
    }

    // Player damage taken (if any)
    if (outcome.enemyDamage > 0) {
        effects.push({
            type: 'showNotification',
            message: `You took ${outcome.enemyDamage} damage!`,
            duration: 2000
        });

        effects.push({
            type: 'triggerAnimation',
            entityId: 'player',
            animation: 'take-damage',
            speed: 1.0
        });
    }

    // Log combat for debugging
    effects.push({
        type: 'logDebug',
        message: `Combat: player_dmg=${outcome.playerDamage} enemy_dmg=${outcome.enemyDamage} defeated=${outcome.enemyDefeated}`
    });

    return effects;
}
