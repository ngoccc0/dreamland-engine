/**
 * Harvest Effects Bridge (Phase 4B.3)
 *
 * @remarks
 * Converts harvest outcomes into side effects.
 */

import type { SideEffect } from '@/core/entities/side-effects';

/**
 * Harvest outcome from handler execution
 */
export interface HarvestOutcome {
    targetName: string;
    partName?: string;
    harvestSuccess: boolean;
    lootCount: number;
    lootItems: Array<{
        name: string;
        quantity: number;
        rarity: string;
    }>;
    targetWasEliminated: boolean;
}

/**
 * Generate side effects from harvest outcome
 *
 * @remarks
 * **Effects Generated:**
 * - Audio: Harvest sound (success/fail), item pickup sounds
 * - Notifications: Loot acquired, items collected
 * - Particles: Item drops, collection sparkles
 * - Events: harvest.success, harvest.loot
 */
export function generateHarvestEffects(outcome: HarvestOutcome): SideEffect[] {
    const effects: SideEffect[] = [];

    // Early return if harvest failed
    if (!outcome.harvestSuccess) {
        effects.push({
            type: 'playAudio',
            sound: 'harvest/fail.mp3',
            volume: 0.7
        });

        effects.push({
            type: 'showNotification',
            message: '✗ Harvest failed',
            duration: 2000
        });

        return effects;
    }

    // Harvest success sound
    effects.push({
        type: 'playAudio',
        sound: 'harvest/success.mp3',
        volume: 0.9
    });

    // Loot acquisition notification
    if (outcome.lootCount > 0) {
        const lootSummary = outcome.lootItems
            .map(item => `${item.quantity}x ${item.name}`)
            .join(', ');

        effects.push({
            type: 'showNotification',
            message: `📦 Collected: ${lootSummary}`,
            duration: 3000
        });

        // Individual item pickup sounds (max 3 to avoid overwhelming)
        const itemsToSound = outcome.lootItems.slice(0, 3);
        itemsToSound.forEach((item, index) => {
            // Stagger item sounds slightly
            setTimeout(() => {
                effects.push({
                    type: 'playAudio',
                    sound: 'item/pickup.mp3',
                    volume: 0.7
                });
            }, index * 200);
        });

        // Loot drop particles
        effects.push({
            type: 'spawnParticle',
            particleType: 'loot-drop',
            position: { x: 50, y: 50 }
        });

        // Loot acquisition event
        effects.push({
            type: 'triggerEvent',
            eventName: 'harvest.loot',
            data: {
                targetName: outcome.targetName,
                lootCount: outcome.lootCount,
                items: outcome.lootItems
            }
        });
    } else {
        effects.push({
            type: 'showNotification',
            message: '🔍 No loot found',
            duration: 2000
        });
    }

    // Target elimination notification
    if (outcome.targetWasEliminated) {
        effects.push({
            type: 'playAudio',
            sound: 'harvest/eliminate.mp3',
            volume: 0.8
        });

        effects.push({
            type: 'triggerAnimation',
            entityId: 'enemy-current',
            animation: 'dissolve',
            speed: 1.0
        });

        effects.push({
            type: 'showNotification',
            message: `💀 ${outcome.targetName} eliminated`,
            duration: 2500
        });

        effects.push({
            type: 'triggerEvent',
            eventName: 'harvest.eliminate',
            data: {
                targetName: outcome.targetName,
                partName: outcome.partName
            }
        });
    }

    // Logging
    effects.push({
        type: 'logDebug',
        message: `Harvest: ${outcome.targetName}${outcome.partName ? ` Part=${outcome.partName}` : ''} Loot=${outcome.lootCount}`
    });

    return effects;
}
