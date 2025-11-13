// Keep types loose here to avoid circular type resolution issues during
// type-checking in the pre-push hook. Consumers should prefer the canonical
// `StatusEffect` from `@/core/types/game` where available.

import type { PlayerStatusDefinition } from './types';
import type { GameConfig } from '@/lib/config/game-config';

// Local minimal StatusEffect shape used here to avoid circular type-resolution
// problems during type-checking. Keep in sync with the exported interface in
// `src/lib/game/types.ts`.
type LocalStatusEffect = {
    id: string;
    type: 'exhaustion' | 'hungry' | 'poison' | 'strength_buff' | 'weakness';
    duration: number;
    magnitude?: number;
    description: any;
    appliedTurn: number;
    source?: string;
};

type NarrMsg = { text: string; type: 'system' | 'narrative' };

/**
 * Apply a single game tick of effects and hunger decay to a player stats object.
 * This is a pure function designed for unit testing.
 *
 * Inputs: a shallow-cloned stats object (will not be mutated by caller assumption),
 * the current turn number, a translation function `t` used to produce localized
 * messages, and game configuration. Returns the updated stats and an array of narrative messages.
 */
export function applyTickEffects(stats: PlayerStatusDefinition, currentTurn: number, t: (k: string, p?: any) => string, gameConfig?: GameConfig) {
    const newStats: PlayerStatusDefinition = { ...(stats || {}) } as PlayerStatusDefinition;
    newStats.statusEffects = Array.isArray(newStats.statusEffects) ? newStats.statusEffects.map((s: LocalStatusEffect) => ({ ...s })) : [];

    // Ensure hunger is always initialized to a valid number
    if (typeof newStats.hunger !== 'number') {
        newStats.hunger = 100;
    }

    const remainingEffects: LocalStatusEffect[] = [];
    let hpDelta = 0;
    let staminaDelta = 0;
    let hpModifierSum = 0;
    let staminaModifierSum = 0;
    const messages: NarrMsg[] = [];

    for (const eff of newStats.statusEffects) {
        const e = { ...eff } as LocalStatusEffect;
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

    // hunger decay - configurable and interval-based
    if (gameConfig?.playerRegeneration) {
        const regenConfig = gameConfig.playerRegeneration;
        const hungerDecayPerTick = regenConfig.hungerDecayPerTick || 1;
        const hungerDecayInterval = regenConfig.hungerDecayInterval || 10;

        // Initialize hungerTickCounter if not present
        if (typeof newStats.hungerTickCounter !== 'number') {
            newStats.hungerTickCounter = 0;
        }

        // Increment the counter
        newStats.hungerTickCounter = (newStats.hungerTickCounter || 0) + 1;

        // Apply hunger decay only when interval is reached
        if (newStats.hungerTickCounter >= hungerDecayInterval) {
            // Ensure hunger is a number, defaulting to 100 if undefined
            if (typeof newStats.hunger !== 'number') {
                newStats.hunger = 100;
            }

            newStats.hunger = Math.min(newStats.maxHunger || 100, Math.max(0, newStats.hunger - hungerDecayPerTick));

            // Reset the counter after applying decay
            newStats.hungerTickCounter = 0;

            // Check for starvation
            if (newStats.hunger <= 0) {
                newStats.hp = Math.max(0, (newStats.hp || 0) - 1);
                messages.push({ text: t('youAreStarving'), type: 'system' });
            }
        }
    }

    // Player regeneration based on hunger levels - interval-based
    if (gameConfig?.playerRegeneration) {
        const regenConfig = gameConfig.playerRegeneration;
        const hunger = newStats.hunger || 0;

        // Initialize regeneration tick counters if not present
        if (typeof newStats.hpRegenTickCounter !== 'number') {
            newStats.hpRegenTickCounter = 0;
        }
        if (typeof newStats.staminaRegenTickCounter !== 'number') {
            newStats.staminaRegenTickCounter = 0;
        }
        if (typeof newStats.manaRegenTickCounter !== 'number') {
            newStats.manaRegenTickCounter = 0;
        }

        // Increment regeneration tick counters
        newStats.hpRegenTickCounter = (newStats.hpRegenTickCounter || 0) + 1;
        newStats.staminaRegenTickCounter = (newStats.staminaRegenTickCounter || 0) + 1;
        newStats.manaRegenTickCounter = (newStats.manaRegenTickCounter || 0) + 1;

        let hpRegen = 0;
        let staminaRegen = 0;
        let manaRegen = 0;

        // Apply hunger penalties to regeneration rates
        if (hunger < regenConfig.hungerThresholdMild) {
            // Severe hunger (< 10): no regeneration, starvation damage
            hpDelta -= regenConfig.starvationDamagePerTick;
            messages.push({ text: t('starvationDamage'), type: 'system' });
        } else if (hunger < regenConfig.hungerThresholdSevere) {
            // Mild hunger (10-29): reduced regeneration
            messages.push({ text: t('hungerSlowsRegeneration'), type: 'system' });
        }
        // Else (hunger >= 30): no hunger penalty, full regeneration

        // Apply HP regeneration at configured interval
        if (newStats.hpRegenTickCounter >= regenConfig.hpRegenInterval) {
            hpRegen = regenConfig.hpRegenPerTick;
            if (hunger < regenConfig.hungerThresholdSevere) {
                hpRegen *= regenConfig.hungerRegenPenaltyMild;
            }
            newStats.hpRegenTickCounter = 0; // Reset counter
        }

        // Apply stamina regeneration at configured interval
        if (newStats.staminaRegenTickCounter >= regenConfig.staminaRegenInterval) {
            staminaRegen = regenConfig.staminaRegenPerTick;
            if (hunger < regenConfig.hungerThresholdSevere) {
                staminaRegen *= regenConfig.hungerRegenPenaltyMild;
            }
            newStats.staminaRegenTickCounter = 0; // Reset counter
        }

        // Apply mana regeneration at configured interval
        if (newStats.manaRegenTickCounter >= regenConfig.manaRegenInterval) {
            manaRegen = regenConfig.manaRegenPerTick;
            if (hunger < regenConfig.hungerThresholdSevere) {
                manaRegen *= regenConfig.hungerRegenPenaltyMild;
            }
            newStats.manaRegenTickCounter = 0; // Reset counter
        }

        // Apply regeneration
        hpDelta += hpRegen;
        staminaDelta += staminaRegen;
        if (newStats.mana !== undefined) {
            newStats.mana = Math.max(0, (newStats.mana || 0) + manaRegen);
            newStats.mana = Math.min(newStats.mana, newStats.maxMana || 50);
        }
    }

    if (hpDelta !== 0) {
        newStats.hp = Math.max(0, (newStats.hp || 0) + hpDelta);
        newStats.hp = Math.min(newStats.hp, newStats.maxHp || 100);
    }
    if (staminaDelta !== 0) {
        newStats.stamina = Math.max(0, (newStats.stamina || 0) + staminaDelta);
        newStats.stamina = Math.min(newStats.stamina, newStats.maxStamina || 100);
    }

    newStats.maxHpModifier = Math.max(0.5, 1 + hpModifierSum);
    newStats.maxStaminaModifier = Math.max(0.5, 1 + staminaModifierSum);
    newStats.statusEffects = remainingEffects;

    return { newStats, messages };
}

export type { NarrMsg };
