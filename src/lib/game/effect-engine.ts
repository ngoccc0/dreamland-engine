import type { StatusEffect } from '@/lib/game/types';

type NarrMsg = { text: string; type: 'system' | 'narrative' };

/**
 * Apply a single game tick of effects and hunger decay to a player stats object.
 * This is a pure function designed for unit testing.
 *
 * Inputs: a shallow-cloned stats object (will not be mutated by caller assumption),
 * the current turn number, and a translation function `t` used to produce localized
 * messages. Returns the updated stats and an array of narrative messages.
 */
export function applyTickEffects(stats: any, currentTurn: number, t: (k: string, p?: any) => string) {
    const newStats = { ...(stats || {}) } as any;
    newStats.statusEffects = Array.isArray(newStats.statusEffects) ? newStats.statusEffects.map((s: any) => ({ ...s })) : [];

    const remainingEffects: StatusEffect[] = [];
    let hpDelta = 0;
    let staminaDelta = 0;
    let hpModifierSum = 0;
    let staminaModifierSum = 0;
    const messages: NarrMsg[] = [];

    for (const eff of newStats.statusEffects) {
        const e = { ...eff } as any;
        if (e.type === 'poison' && (e.magnitude || 0) > 0) {
            const dmg = Math.max(0, Math.round(e.magnitude || 0));
            hpDelta -= dmg;
            messages.push({ text: t('poisonDamage', { amount: dmg }), type: 'system' });
        }
        if (e.type === 'exhaustion') {
            const drain = e.magnitude ?? 1;
            staminaDelta -= drain;
        }
        if (e.type === 'strength_buff') hpModifierSum += (e.magnitude || 0);
        if (e.type === 'weakness') hpModifierSum -= (e.magnitude || 0);

        if (typeof e.duration === 'number' && e.duration > 0) {
            e.duration = Math.max(0, e.duration - 1);
            if (e.duration > 0) {
                remainingEffects.push(e);
            } else {
                messages.push({ text: t('effectWornOff', { effect: e.type }), type: 'system' });
            }
        } else {
            remainingEffects.push(e);
        }
    }

    // hunger decay
    const baseHungerDecay = 0.5;
    if (typeof newStats.hunger === 'number') {
        newStats.hunger = Math.max(0, newStats.hunger - baseHungerDecay);
        if (newStats.hunger <= 0) {
            newStats.hp = Math.max(0, (newStats.hp || 0) - 1);
            messages.push({ text: t('youAreStarving'), type: 'system' });
        }
    }

    if (hpDelta !== 0) {
        newStats.hp = Math.max(0, (newStats.hp || 0) + hpDelta);
    }
    if (staminaDelta !== 0) {
        newStats.stamina = Math.max(0, (newStats.stamina || 0) + staminaDelta);
    }

    newStats.maxHpModifier = Math.max(0.5, 1 + hpModifierSum);
    newStats.maxStaminaModifier = Math.max(0.5, 1 + staminaModifierSum);
    newStats.statusEffects = remainingEffects;

    return { newStats, messages };
}

export type { NarrMsg };
