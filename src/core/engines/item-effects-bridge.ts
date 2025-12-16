/**
 * Item Effects Bridge (Phase 4B.3)
 *
 * @remarks
 * Converts item use outcomes into side effects.
 */

import type { SideEffect } from '@/core/entities/side-effects';

/**
 * Item use outcome from handler execution
 */
export interface ItemUseOutcome {
    itemName: string;
    targetType: 'player' | 'world' | 'craft';
    wasSuccessful: boolean;
    effectsApplied: Array<{
        type: 'HEAL' | 'RESTORE_STAMINA' | 'RESTORE_MANA' | 'RESTORE_HUNGER' | 'OTHER';
        amount: number;
        description: string;
    }>;
    itemWasConsumed: boolean;
    playerHpBefore?: number;
    playerHpAfter?: number;
    playerStaminaBefore?: number;
    playerStaminaAfter?: number;
}

/**
 * Generate side effects from item use outcome
 *
 * @remarks
 * **Effects Generated:**
 * - Audio: Item use sound (based on item type)
 * - Notifications: Effect feedback (heal amount, stamina restored, etc.)
 * - Particles: Based on item type (heal burst, energy sparkle)
 * - Events: item.used, item.consumed
 * - Animations: Player glow effect for beneficial items
 */
export function generateItemEffects(outcome: ItemUseOutcome): SideEffect[] {
    const effects: SideEffect[] = [];

    // Early return if item use failed
    if (!outcome.wasSuccessful) {
        effects.push({
            type: 'playAudio',
            sound: 'item/fail.mp3',
            volume: 0.7
        });

        effects.push({
            type: 'showNotification',
            message: '✗ Item had no effect',
            duration: 2000
        });

        return effects;
    }

    // Play item use sound
    effects.push({
        type: 'playAudio',
        sound: 'item/use.mp3',
        volume: 0.8
    });

    // Process each effect applied
    outcome.effectsApplied.forEach((effect) => {
        if (effect.amount <= 0) return;

        switch (effect.type) {
            case 'HEAL':
                effects.push({
                    type: 'playAudio',
                    sound: 'item/heal.mp3',
                    volume: 0.9
                });

                effects.push({
                    type: 'triggerAnimation',
                    entityId: 'player',
                    animation: 'glow',
                    speed: 1.0
                });

                effects.push({
                    type: 'spawnParticle',
                    particleType: 'heal-burst',
                    position: { x: 50, y: 50 }
                });

                effects.push({
                    type: 'showNotification',
                    message: `💚 +${effect.amount} HP`,
                    duration: 2000
                });

                effects.push({
                    type: 'triggerEvent',
                    eventName: 'item.heal',
                    data: { amount: effect.amount, itemName: outcome.itemName }
                });
                break;

            case 'RESTORE_STAMINA':
                effects.push({
                    type: 'playAudio',
                    sound: 'item/stamina.mp3',
                    volume: 0.8
                });

                effects.push({
                    type: 'triggerAnimation',
                    entityId: 'player',
                    animation: 'glow',
                    speed: 1.2
                });

                effects.push({
                    type: 'spawnParticle',
                    particleType: 'energy-sparkle',
                    position: { x: 50, y: 50 }
                });

                effects.push({
                    type: 'showNotification',
                    message: `⚡ +${effect.amount} Stamina`,
                    duration: 2000
                });

                effects.push({
                    type: 'triggerEvent',
                    eventName: 'item.stamina',
                    data: { amount: effect.amount, itemName: outcome.itemName }
                });
                break;

            case 'RESTORE_MANA':
                effects.push({
                    type: 'playAudio',
                    sound: 'item/mana.mp3',
                    volume: 0.8
                });

                effects.push({
                    type: 'triggerAnimation',
                    entityId: 'player',
                    animation: 'glow',
                    speed: 1.0
                });

                effects.push({
                    type: 'spawnParticle',
                    particleType: 'mana-burst',
                    position: { x: 50, y: 50 }
                });

                effects.push({
                    type: 'showNotification',
                    message: `✨ +${effect.amount} Mana`,
                    duration: 2000
                });

                effects.push({
                    type: 'triggerEvent',
                    eventName: 'item.mana',
                    data: { amount: effect.amount, itemName: outcome.itemName }
                });
                break;

            case 'RESTORE_HUNGER':
                effects.push({
                    type: 'playAudio',
                    sound: 'item/eat.mp3',
                    volume: 0.8
                });

                effects.push({
                    type: 'triggerAnimation',
                    entityId: 'player',
                    animation: 'chew',
                    speed: 1.0
                });

                effects.push({
                    type: 'showNotification',
                    message: `🍖 -${effect.amount} Hunger`,
                    duration: 2000
                });

                effects.push({
                    type: 'triggerEvent',
                    eventName: 'item.eat',
                    data: { amount: effect.amount, itemName: outcome.itemName }
                });
                break;
        }
    });

    // Item consumed notification
    if (outcome.itemWasConsumed) {
        effects.push({
            type: 'showNotification',
            message: `${outcome.itemName} consumed`,
            duration: 1500
        });

        effects.push({
            type: 'triggerEvent',
            eventName: 'item.consumed',
            data: { itemName: outcome.itemName }
        });
    }

    // Logging
    effects.push({
        type: 'logDebug',
        message: `Item: ${outcome.itemName} Target=${outcome.targetType} Success=${outcome.wasSuccessful}`
    });

    return effects;
}
