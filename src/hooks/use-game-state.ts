'use client';

import { useEffect } from "react";

// Sub-Hooks for State Management
import { useWorldState } from "./state/use-world-state";
import { usePlayerState } from "./state/use-player-state";
import { useGameLifecycle } from "./state/use-game-lifecycle";
import { useContentRegistry } from "./state/use-content-registry";

interface GameStateProps {
    gameSlot: number;
}

/**
 * Return type of useGameState hook.
 */
export type GameStateResult = ReturnType<typeof useGameState>;

/**
 * Central game state manager (Facade).
 * 
 * @remarks
 * REFACTORED (Dec 2025): Now aggregates specialized state hooks.
 * - `useWorldState`: World generation, biomes, regions.
 * - `usePlayerState`: Stats, position, inventory, quests.
 * - `useGameLifecycle`: Time, loading states, narrative log.
 * - `useContentRegistry`: Items, recipes, structures.
 */
export function useGameState({ gameSlot: _gameSlot }: GameStateProps) {
    const worldState = useWorldState();
    const playerState = usePlayerState();
    const lifecycleState = useGameLifecycle();
    const contentState = useContentRegistry();

    // Sync initialization state
    useEffect(() => {
        if (worldState.isWorldGenerated) {
            lifecycleState.setIsLoaded(true);
        }
    }, [worldState.isWorldGenerated, lifecycleState.setIsLoaded]);

    return {
        ...worldState,
        ...playerState,
        ...lifecycleState,
        ...contentState
    };
}
