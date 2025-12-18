/**
 * Exploration Hook - Wires ExplorationUseCase to React.
 *
 * @remarks
 * **Pattern:** usecase bridge hook
 * - Calls ExplorationUseCase.exploreLocation()
 * - Updates game state with results
 * - Executes side effects (audio, particles, notifications)
 * - Returns handlers for UI to call
 *
 * **Data Flow:**
 * UI Button Click
 *   → handleExplore()
 *   → explorationUsecase.exploreLocation()
 *   → returns [newState, effects]
 *   → setNarrativeLog(updated discoveries)
 *   → executeEffects(effects)
 *
 * **State Pattern:**
 * - Reads playerPosition from useGameState (SSOT)
 * - Writes discoveries back to narrativeLog
 * - No local useState copies of game data
 *
 * @example
 * ```typescript
 * const { handleExplore, isExploring } = useExploration(gameState);
 * return (
 *   <button onClick={handleExplore} disabled={isExploring}>
 *     Explore
 *   </button>
 * );
 * ```
 */

'use client';

import { useCallback, useState } from 'react';
import { useGameEngine } from '@/context/game-engine-context';
import { GridPosition } from '@/core/values/grid-position';
import type { GameState, NarrativeEntry } from '@/core/types/game';

/**
 * Result of exploration action.
 *
 * @remarks
 * Returned by handlers to UI for display.
 */
export interface ExplorationResult {
    itemsFound: string[];
    loreDiscovered: string[];
    xpGained: number;
    duration: number; // milliseconds
}

/**
 * Exploration hook handlers and state.
 *
 * @remarks
 * **Handlers:**
 * - handleExplore: Trigger exploration at current location
 * - handleExploreLocation: Trigger exploration at specific location
 *
 * **State:**
 * - isExploring: Currently exploring (progress bar visible)
 * - lastResult: Last exploration result (for display)
 * - error: Any error during exploration
 */
export interface ExplorationHookResult {
    /** Currently exploring? */
    isExploring: boolean;
    /** Last exploration result */
    lastResult: ExplorationResult | null;
    /** Error message if exploration failed */
    error: string | null;
    /** Trigger exploration at current position */
    handleExplore: (gameState: GameState) => Promise<void>;
    /** Trigger exploration at specific location */
    handleExploreLocation: (position: GridPosition, gameState: GameState) => Promise<void>;
}

/**
 * Hook to manage exploration interactions.
 *
 * @remarks
 * **SSOT Compliance:**
 * - Reads playerPosition from game state parameter (not local state)
 * - Returns updated game state to caller for dispatch
 * - No local copies of gameState
 *
 * **Effect Execution:**
 * Effects from usecase are executed after state update:
 * - SaveGameEffect: Auto-save discoveries
 * - NotificationEffect: Show "Discovered" message
 * - ParticleEffect: Animation at discovery location
 *
 * **Error Handling:**
 * Catches exceptions and returns error message for UI display.
 *
 * @returns Object with handlers and state
 *
 * @throws Will not throw; errors returned in hook state
 */
export function useExploration(): ExplorationHookResult {
    const { explorationUsecase } = useGameEngine();

    const [isExploring, setIsExploring] = useState(false);
    const [lastResult, setLastResult] = useState<ExplorationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Execute exploration at a location.
     *
     * @remarks
     * **Sequence:**
     * 1. Set isExploring = true (show progress bar)
     * 2. Call usecase with current location
     * 3. Get back [explorationResult, effects]
     * 4. Create new narrative entries with discoveries
     * 5. Execute side effects
     * 6. Show result to user
     * 7. Set isExploring = false
     *
     * **Duration:** Exploration is instant, but UI shows 750ms progress bar
     *
     * **Save/Load:**
     * Caller (use-action-handlers or component) is responsible for saving
     * the updated narrativeLog back to GameState.
     *
     * @param position - Location to explore
     * @param gameState - Current game state (for reading context)
     */
    const performExploration = useCallback(
        async (position: GridPosition, gameState: GameState) => {
            try {
                setError(null);
                setIsExploring(true);

                // TODO: Call explorationUsecase.exploreLocation(position)
                // For now, mock the behavior
                await new Promise((resolve) => setTimeout(resolve, 750));

                // TODO: Extract result from usecase output
                const mockResult: ExplorationResult = {
                    itemsFound: ['Iron Ore', 'Berry Seed'],
                    loreDiscovered: ['Ancient ruins hint'],
                    xpGained: 25,
                    duration: 750,
                };

                setLastResult(mockResult);

                // Create narrative entry for discovery
                const discoveryEntry: NarrativeEntry = {
                    type: 'discovery',
                    content: {
                        en: `Discovered ${mockResult.itemsFound.length} items`,
                        vi: `Khám phá ${mockResult.itemsFound.length} vật phẩm`,
                    },
                    turn: gameState.turn,
                    day: gameState.day,
                    timestamp: Date.now(),
                } as any; // TODO: Fix typing

                // Caller will handle updating narrativeLog and saving
                // This hook only manages the interaction state
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Exploration failed';
                setError(message);
            } finally {
                setIsExploring(false);
            }
        },
        [explorationUsecase]
    );

    /**
     * Exploration at current player position.
     */
    const handleExplore = useCallback(
        async (gameState: GameState) => {
            const position = new GridPosition(gameState.playerPosition.x, gameState.playerPosition.y);
            await performExploration(position, gameState);
        },
        [performExploration]
    );

    /**
     * Exploration at specific location.
     */
    const handleExploreLocation = useCallback(
        async (position: GridPosition, gameState: GameState) => {
            await performExploration(position, gameState);
        },
        [performExploration]
    );

    return {
        isExploring,
        lastResult,
        error,
        handleExplore,
        handleExploreLocation,
    };
}
