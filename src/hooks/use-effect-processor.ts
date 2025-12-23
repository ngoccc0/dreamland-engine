/**
 * @file src/hooks/use-effect-processor.ts
 * @description React hook wrapper for effect processing
 *
 * @remarks
 * **Architecture: Sync-Back Pattern**
 *
 * Effects are computed separately from state mutations.
 * Hook returns pending effects; caller applies atomically.
 *
 * **Why Separate?**
 * - Isolates effect logic from state management
 * - Enables atomic application (all-or-nothing)
 * - Prevents race conditions during weather + tick effects
 *
 * **Pattern:**
 * const { processAllEffects } = useEffectProcessor(deps)
 * const result = processAllEffects()  // Get updated stats + messages
 * setPlayerStats(result.updatedStats)  // Apply in single setState
 *
 * **Implementation:**
 * Wraps pure functions from process-effects.ts with React hooks.
 * Pure logic is testable without React context.
 */

import { useCallback, useRef } from 'react';
import { useLanguage } from '@/context/language-context';
import { EffectEngine } from '@/core/engines/effect-engine';
import { WeatherEngine } from '@/core/engines/weather-engine';
import { processTickEffectsSync, processWeatherEffectsSync, processAllEffectsSync } from '@/core/usecases/process-effects';
import type { PlayerStatusDefinition } from '@/core/types/game';
import type { GameConfig } from '@/lib/config/game-config';

interface UseEffectProcessorDeps {
    /** Current player stats */
    playerStats: PlayerStatusDefinition;
    /** Current game state snapshot */
    gameState: any;
    /** Current game turn */
    currentTurn: number;
    /** Game configuration */
    config: GameConfig;
    /** Weather engine instance */
    weatherEngineRef: React.MutableRefObject<WeatherEngine>;
}

/**
 * Effect processor hook with sync-back pattern
 *
 * @param deps Configuration with player stats and game state
 * @returns Methods to process effects
 *
 * @remarks
 * **Wrapper around pure functions:**
 * The actual logic is in process-effects.ts (pure, testable functions).
 * This hook adds React integration (language context, memoization).
 *
 * **Sync-Back Guarantee:**
 * Caller receives all effects to apply in single atomic update:
 * - Tick effects (status regeneration, hunger decay, etc.)
 * - Weather effects (temperature, precipitation impacts)
 *
 * **Example:**
 * ```typescript
 * const { processAllEffects } = useEffectProcessor(deps);
 * const result = processAllEffects();
 * setPlayerStats(result.updatedStats);  // Apply atomically
 * ```
 */
export function useEffectProcessor(deps: UseEffectProcessorDeps) {
    const { playerStats, gameState, currentTurn, config, weatherEngineRef } =
        deps;
    const { t } = useLanguage();

    // Keep engine instance stable across re-renders
    const effectEngineRef = useRef(new EffectEngine());

    /**
     * Apply both tick and weather effects atomically
     */
    const processAllEffects = useCallback(() => {
        return processAllEffectsSync(
            playerStats,
            gameState,
            currentTurn,
            config,
            t,
            weatherEngineRef,
            effectEngineRef,
        );
    }, [playerStats, gameState, currentTurn, config, t, weatherEngineRef]);

    return {
        processAllEffects,
    };
}
