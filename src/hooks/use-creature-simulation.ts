/**
 * @file src/hooks/use-creature-simulation.ts
 * @description React hook wrapper for creature simulation
 *
 * @remarks
 * **Architecture: Sync-Back Pattern**
 *
 * Creatures are simulated separately from state mutations.
 * Hook returns pending messages; caller applies atomically.
 *
 * **Why Separate?**
 * - Isolates creature AI from state management
 * - Enables atomic message application
 * - Prevents race conditions during world updates
 * - Testable without React context (pure functions)
 *
 * **Pattern:**
 * const { simulateCreatures } = useCreatureSimulation(deps)
 * const { creatureMessages, plantMessages } = simulateCreatures()
 * // Caller applies messages to narrative atomically
 *
 * **Implementation:**
 * Wraps pure functions from creature-simulation.ts with React hooks.
 * Pure logic is testable without React context.
 */

import { useCallback } from 'react';
import { useLanguage } from '@/context/language-context';
import {
    simulateCreaturesSync,
    type CreatureSimulationResult,
} from '@/core/usecases/creature-simulation';
import { GridPosition } from '@/core/values/grid-position';
import type { PlayerStatusDefinition } from '@/core/types/game';

interface UseCreatureSimulationDeps {
    /** Current game turn */
    currentTurn: number;
    /** Player's current position */
    playerPosition: { x: number; y: number };
    /** Player's current stats */
    playerStats: PlayerStatusDefinition;
    /** Game state snapshot */
    gameState: any;
    /** Creature engine instance */
    creatureEngineRef: React.MutableRefObject<any>;
}

/**
 * Creature simulation hook with sync-back pattern
 *
 * @param deps Configuration with game state and creature engine
 * @returns Methods to simulate creatures
 *
 * @remarks
 * **Wrapper around pure functions:**
 * The actual logic is in creature-simulation.ts (pure, testable functions).
 * This hook adds React integration (language context, memoization).
 *
 * **Sync-Back Guarantee:**
 * Caller receives all creature and plant messages to apply atomically:
 * - Creature AI decisions and movements
 * - Plant growth updates
 * - Environmental impacts
 *
 * **Example:**
 * ```typescript
 * const { simulateCreatures } = useCreatureSimulation(deps);
 * const { creatureMessages, plantMessages } = simulateCreatures();
 * const allMessages = [...creatureMessages, ...plantMessages];
 * allMessages.forEach(msg => addNarrativeEntry(msg.text, msg.type));
 * ```
 */
export function useCreatureSimulation(deps: UseCreatureSimulationDeps) {
    const { currentTurn, playerPosition, playerStats, gameState, creatureEngineRef } = deps;
    const { t } = useLanguage();

    /**
     * Run full creature simulation cycle
     */
    const simulateCreatures = useCallback((): CreatureSimulationResult => {
        const playerPos = new GridPosition(playerPosition.x, playerPosition.y);
        return simulateCreaturesSync(
            creatureEngineRef,
            currentTurn,
            playerPos,
            playerStats,
            gameState,
            t,
        );
    }, [currentTurn, playerPosition, playerStats, gameState, creatureEngineRef, t]);

    return {
        simulateCreatures,
    };
}
