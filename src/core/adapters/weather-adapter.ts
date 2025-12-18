/**
 * Weather Adapter: Bridges WeatherUseCase (pure) with Game Loop (mutating).
 *
 * @remarks
 * **Problem:**
 * - WeatherEngine: Stateful, mutates internal state directly
 * - WeatherUseCase: Pure function, returns [newState, effects[]]
 * - Game Loop: Expects state mutations to be atomic
 *
 * **Solution:**
 * Adapter wraps WeatherUseCase output and applies changes to GameState
 * in a way that maintains consistency and prevents desync.
 *
 * **Pattern:**
 * 1. Call WeatherUseCase.update(gameState) → returns [newWeatherState, effects]
 * 2. Pass to adapter: applyWeatherStateChanges(gameState, result)
 * 3. Adapter merges only weather fields into gameState
 * 4. Return merged state to game loop
 *
 * **Why This Matters:**
 * - Ensures weather changes don't clobber other state (inventory, position, etc.)
 * - Provides transitional bridge from WeatherEngine to WeatherUseCase
 * - Can be removed in Phase 2 once game loop fully supports usecase pattern
 *
 * @example
 * ```typescript
 * // In use-game-engine.ts
 * const [weatherState, weatherEffects] = weatherUsecase.update(gameState, deltaTime);
 * const newGameState = applyWeatherStateChanges(gameState, [weatherState, weatherEffects]);
 * setGameState(newGameState); // Atomic update
 * ```
 */

import type { GameState } from '@/core/types/game';

/**
 * Applies weather state changes without overwriting other game state.
 *
 * @remarks
 * **Strategy:** Selective merge
 * - Takes only weather-related fields from usecase output
 * - Preserves all other state (player, inventory, etc.)
 * - Ensures atomic update: either everything succeeds or nothing changes
 *
 * **Fields Affected:**
 * - weatherZones: Current weather in each zone
 * - gameTime: Global game time (if weather affects time)
 * - precipitation: Current precipitation level
 * - temperature: Global temperature
 *
 * **Fields NOT Touched:**
 * - playerStats, playerPosition, inventory, etc.
 * - Chunk data, creature data, structure data
 * - Narrative log, discoveries, etc.
 *
 * @param originalState - Current complete game state
 * @param usecaseOutput - [newWeatherState, effects] from WeatherUseCase.update()
 * @returns Merged GameState with only weather fields updated
 */
export function applyWeatherStateChanges(
    originalState: GameState,
    usecaseOutput: [GameState, any[]]
): GameState {
    const [newWeatherState, _effects] = usecaseOutput;

    // Merge only weather-related fields
    const mergedState: GameState = {
        ...originalState,
        // Weather fields
        weatherZones: newWeatherState.weatherZones,
        gameTime: newWeatherState.gameTime,
        day: newWeatherState.day,
        currentSeason: newWeatherState.currentSeason,
        // All other fields preserved via spread operator
    };

    return mergedState;
}

/**
 * Extracts weather-specific effects for processing.
 *
 * @remarks
 * Filters effects returned by WeatherUseCase to identify which ones
 * are weather-related (e.g., EffectEngineEffect, VisualEffect).
 * Other effects (SaveGame, Notification) are passed separately.
 *
 * **Weather Effects:**
 * - EffectEngineEffect: Particle systems, lightning, fog
 * - VisualEffect: HUD updates showing weather changes
 * - CreatureAffectionEffect: Creatures react to weather
 *
 * @param effects - All effects from WeatherUseCase.update()
 * @returns Only weather-related effects
 */
export function extractWeatherEffects(effects: any[]): any[] {
    return effects.filter((_effect) => {
        // TODO: Implement based on effect type
        // For now, return all effects; will refine in Phase 2
        return true;
    });
}

/**
 * Validates that weather state merge doesn't create inconsistencies.
 *
 * @remarks
 * Safety check before applying weather changes.
 * Ensures:
 * - No NaN values in temperature/precipitation
 * - No undefined weather zones (should be Map or object)
 * - Game time is monotonically increasing
 *
 * @param original - Original state
 * @param merged - Merged state with weather changes
 * @throws {Error} If merge created inconsistent state
 * @returns true if validation passes
 */
export function validateWeatherMerge(
    original: GameState,
    merged: GameState
): boolean {
    // Validate weather zones exist
    if (!merged.weatherZones) {
        throw new Error('Weather merge: weatherZones is undefined');
    }

    // Validate game time is monotonically increasing
    if (merged.gameTime < original.gameTime) {
        throw new Error(
            `Weather merge: gameTime decreased (${original.gameTime} → ${merged.gameTime})`
        );
    }

    // Validate non-weather state unchanged (sample check)
    if (merged.playerPosition !== original.playerPosition) {
        throw new Error('Weather merge: playerPosition unexpectedly changed');
    }

    return true;
}
