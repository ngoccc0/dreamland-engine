'use client';

/**
 * Combat Actions Hook
 *
 * OVERVIEW: Extracted combat-specific handlers from use-action-handlers.ts
 *
 * This file contains all player-initiated combat actions:
 * - handleAttack(): Execute attack against current chunk enemy
 *
 * **Why extracted?**
 * - Combat is high-risk for duplicate events (dedup guard will wire here first)
 * - Keeps combat logic isolated for easier testing
 * - Reduces use-action-handlers.ts size (God Object reduction)
 *
 * ## Notes
 *
 * Part of Precursor split strategy:
 * - Phase 1: Extract combat (this file)
 * - Phase 2: Extract crafting
 * - Phase 3: Extract harvest
 * - Future: Extract other handlers to complete split
 */

import { useCallback } from 'react';
import type { ActionHandlerDeps } from '@/hooks/use-action-handlers';
import type { TranslationKey } from '@/core/types/game';
import { AudioActionType } from '@/core/data/audio-events';
import { generateCombatEffects } from '@/core/engines/combat-effects-bridge';

/**
 * Create combat action handlers
 *
 * @remarks
 * Factory function that creates handleAttack with all dependencies injected.
 *
 * **Dependencies:**
 * - isLoading, isGameOver, isLoaded: Guard conditions
 * - setPlayerBehaviorProfile: Track behavior stats
 * - world: Current game world state
 * - playerPosition: Current position for enemy lookup
 * - addNarrativeEntry: Log action narrative
 * - t: Translation function
 * - playerStats: Current player stats (for logging)
 * - handleOfflineAttack: Execute combat rule (from offline handler)
 * - setPlayerStats: Update stats with action log
 * - audio: Play combat sfx
 * - executeEffectsWithQuests: Apply combat effects + evaluate quests
 *
 * @param deps - Action handler dependencies
 * @returns Object with handleAttack callback
 *
 * @example
 * ```typescript
 * const { handleAttack } = createHandleCombatActions(deps);
 * handleAttack(); // Execute attack
 * ```
 */
export function createHandleCombatActions(deps: Partial<ActionHandlerDeps> & Record<string, any>) {
    const {
        isLoading = false,
        isGameOver = false,
        isLoaded = false,
        setPlayerBehaviorProfile,
        world,
        playerPosition,
        addNarrativeEntry,
        t,
        playerStats,
        handleOfflineAttack,
        setPlayerStats,
        audio,
        executeEffectsWithQuests,
    } = deps;

    /**
     * handleAttack
     *
     * Execute attack action against enemy in current chunk.
     *
     * @remarks
     * **Flow:**
     * 1. Guard: Check not loading/dead/not loaded
     * 2. Increment attack counter in behavior profile
     * 3. Look up enemy in current chunk
     * 4. Guard: Fail gracefully if no enemy
     * 5. Log action to narrative and daily log
     * 6. Play attack sound effect
     * 7. Execute combat rule (handleOfflineAttack)
     * 8. Generate and apply combat effects (damage, loot, etc)
     * 9. Evaluate quests (may auto-complete based on kills)
     *
     * **Dedup Safety:**
     * This handler is vulnerable to race conditions:
     * - If attack action fires twice in rapid succession
     * - Both processes may see same enemy, both process kill
     * - Creature kills will double-count
     *
     * Solution: EventDeduplicationGuard will check before executing effects
     * (Integrated in Phase 3)
     */
    const handleAttack = useCallback(() => {
        if (isLoading || isGameOver || !isLoaded) return;
        if (!setPlayerBehaviorProfile || !world || !playerPosition || !addNarrativeEntry || !t || !playerStats || !handleOfflineAttack || !setPlayerStats || !audio || !executeEffectsWithQuests) {
            console.warn('Combat action missing required dependencies');
            return;
        }

        setPlayerBehaviorProfile((p: any) => ({ ...p, attacks: p.attacks + 1 }));

        const baseChunk = world[`${playerPosition.x},${playerPosition.y}`];
        if (!baseChunk?.enemy) {
            addNarrativeEntry(t('noTarget'), 'system');
            return;
        }

        const actionText = `${t('attackAction')} ${t(baseChunk.enemy.type as TranslationKey)}`;
        addNarrativeEntry(actionText, 'action');

        // Emit audio for attack
        audio.playSfxForAction(AudioActionType.PLAYER_ATTACK, {});

        const newPlayerStats = {
            ...playerStats,
            dailyActionLog: [...(playerStats.dailyActionLog || []), actionText]
        };

        setPlayerStats(newPlayerStats);

        // Capture combat outcome and execute effects
        const outcome = handleOfflineAttack();
        if (outcome) {
            // Generate and execute side effects from combat outcome
            const effects = generateCombatEffects(outcome);
            executeEffectsWithQuests(effects);
        }
    }, [
        isLoading,
        isGameOver,
        isLoaded,
        setPlayerBehaviorProfile,
        world,
        playerPosition,
        addNarrativeEntry,
        t,
        playerStats,
        handleOfflineAttack,
        setPlayerStats,
        audio,
        executeEffectsWithQuests,
    ]);

    return { handleAttack };
}
