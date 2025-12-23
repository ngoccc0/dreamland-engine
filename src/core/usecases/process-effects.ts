/**
 * @file src/core/usecases/process-effects.ts
 * @description Pure effect processing logic (testable without React)
 *
 * @remarks
 * **Separated from hook for testability:**
 * - Pure functions that don't depend on React
 * - No hooks, no context, just business logic
 * - Hooks call these functions to compute effects
 *
 * **Pattern: Sync-Back**
 * Functions return new stats + messages; caller applies atomically
 */

import { applyTickEffects } from '@/core/rules/effects/effect-engine';
import { EffectEngine } from '@/core/engines/effect-engine';
import { WeatherEngine } from '@/core/engines/weather-engine';
import { adaptStatsToCharacter } from '@/core/adapters/stats-to-character';
import type { PlayerStatusDefinition } from '@/core/types/game';
import type { GameConfig } from '@/lib/config/game-config';
import { GridPosition } from '@/core/values/grid-position';

/**
 * Result of effect processing
 */
export interface EffectProcessorResult {
    /** Updated player stats after all effects */
    updatedStats: PlayerStatusDefinition;
    /** Narrative messages from tick effects */
    tickMessages: Array<{ text: string; type: string }>;
    /** Narrative messages from weather effects */
    weatherMessages: Array<{ text: string; type: string }>;
}

/**
 * Apply tick-based status effects immutably
 *
 * @param stats Current player stats
 * @param currentTurn Current game turn
 * @param t Translation function
 * @param config Game configuration
 * @returns Updated stats and messages
 *
 * @remarks
 * Applies status regeneration, hunger, thirst, status conditions.
 * Does NOT mutate input stats.
 *
 * @example
 * ```typescript
 * const result = processTickEffectsSync(stats, turn, t, config);
 * // result.updatedStats has changes
 * // result.tickMessages contains narrative
 * ```
 */
export function processTickEffectsSync(
    stats: PlayerStatusDefinition,
    currentTurn: number,
    t: (key: string) => string,
    config: GameConfig,
): EffectProcessorResult {
    const newStats = { ...stats } as PlayerStatusDefinition;
    const { newStats: updated, messages } = applyTickEffects(
        newStats,
        currentTurn,
        t,
        config,
    );

    return {
        updatedStats: updated,
        tickMessages: messages,
        weatherMessages: [],
    };
}

/**
 * Apply weather-based effects immutably
 *
 * @param stats Current player stats
 * @param gameState Game state with world and position
 * @param weatherEngineRef Weather engine instance
 * @param effectEngineRef Effect engine instance
 * @returns Updated stats and messages
 *
 * @remarks
 * Applies temperature, precipitation, wind impacts to player.
 * Does NOT mutate input stats.
 * Gracefully handles missing world/cells.
 *
 * @example
 * ```typescript
 * const result = processWeatherEffectsSync(stats, gameState, weatherRef, effectRef);
 * // result.updatedStats has weather impacts applied
 * ```
 */
export function processWeatherEffectsSync(
    stats: PlayerStatusDefinition,
    gameState: any,
    weatherEngineRef: { current?: WeatherEngine | null },
    effectEngineRef: { current?: EffectEngine | null },
): EffectProcessorResult {
    let updatedStats = stats;
    const weatherMessages: Array<{ text: string; type: string }> = [];

    // Get player's current cell from game state
    if (gameState?.world && gameState?.playerPosition && weatherEngineRef.current && effectEngineRef.current) {
        try {
            const playerPosition = new GridPosition(
                gameState.playerPosition.x,
                gameState.playerPosition.y,
            );
            const playerCurrentCell = gameState.world.getCellAt(
                playerPosition,
            );

            if (playerCurrentCell) {
                // Adapt stats to Character for weather engine
                const character = adaptStatsToCharacter(stats);

                // Get weather effects for this biome/time
                const weatherEffects =
                    weatherEngineRef.current.applyWeatherEffects(
                        playerCurrentCell,
                        character as any,
                    );

                // Apply each effect immutably
                if (
                    weatherEffects &&
                    weatherEffects.length > 0
                ) {
                    for (const effect of weatherEffects) {
                        const changes =
                            effectEngineRef.current.processEffect(
                                effect,
                                updatedStats,
                            );
                        updatedStats =
                            effectEngineRef.current.applyEffectChangesToPlayer(
                                updatedStats,
                                changes,
                            );
                    }
                }
            }
        } catch {
            // Silently handle world method unavailability
            // Game continues without weather effects
        }
    }

    return {
        updatedStats,
        tickMessages: [],
        weatherMessages,
    };
}

/**
 * Apply both tick and weather effects atomically
 *
 * @param stats Current player stats
 * @param gameState Game state snapshot
 * @param currentTurn Current turn number
 * @param config Game configuration
 * @param t Translation function
 * @param weatherEngineRef Weather engine instance
 * @param effectEngineRef Effect engine instance
 * @returns All effects applied atomically
 *
 * @remarks
 * **Atomic Application:**
 * 1. Tick effects applied first
 * 2. Weather effects applied to updated stats
 * 3. All messages combined
 * 4. No state mutations (immutable)
 *
 * **Usage:**
 * Caller receives result and applies in single setState:
 * ```typescript
 * const result = processAllEffectsSync(...);
 * setPlayerStats(result.updatedStats);
 * ```
 */
export function processAllEffectsSync(
    stats: PlayerStatusDefinition,
    gameState: any,
    currentTurn: number,
    config: GameConfig,
    t: (key: string) => string,
    weatherEngineRef: { current?: WeatherEngine | null },
    effectEngineRef: { current?: EffectEngine | null },
): EffectProcessorResult {
    // Apply tick effects first
    let result = processTickEffectsSync(stats, currentTurn, t, config);

    // Apply weather effects to already-updated stats
    const weatherResult = processWeatherEffectsSync(
        result.updatedStats,
        gameState,
        weatherEngineRef,
        effectEngineRef,
    );

    // Combine all messages
    const allMessages = [
        ...(result.tickMessages || []),
        ...(weatherResult.weatherMessages || []),
    ];

    return {
        updatedStats: weatherResult.updatedStats,
        tickMessages: allMessages,
        weatherMessages: [],
    };
}
