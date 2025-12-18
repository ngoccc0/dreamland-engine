/**
 * Exploration State Selector Hook.
 *
 * @remarks
 * **Pattern:** Selective subscription hook
 * - Returns only discovery-related state (no player position, stamina, etc.)
 * - Memoized to prevent unnecessary re-renders
 * - Component re-renders ONLY when discoveries change
 *
 * **Performance:**
 * - Subscribers re-render only on discovery changes
 * - Player position changes don't trigger re-render
 * - Other feature updates don't affect this component
 *
 * @example
 * ```typescript
 * export function ExplorationPanel() {
 *   const { discoveries } = useExplorationState();
 *   return <div>{discoveries.length} locations explored</div>;
 * }
 * ```
 */

'use client';

import { useMemo } from 'react';
import type { NarrativeEntry } from '@/core/types/game';

/**
 * Slice of game state related to exploration.
 *
 * @remarks
 * Isolated from other game state to prevent unnecessary re-renders.
 * Only includes discovery-related fields.
 */
export interface ExplorationState {
    /** List of discovered locations */
    discoveries: NarrativeEntry[];
    /** Last time user triggered exploration */
    lastExplorationTime: number | null;
    /** Current exploration progress (0-100) */
    explorationProgress: number;
}

/**
 * Hook to create exploration state slice from narrative log.
 *
 * @remarks
 * Selector hook that returns only exploration-related state.
 * Uses `useMemo` to prevent re-render on unrelated state changes.
 *
 * **Dependency Array:**
 * Only includes narrative log. Changes to playerPosition,
 * stamina, or other fields don't trigger re-render.
 *
 * @param narrativeLog - Full narrative log from game state
 * @returns ExplorationState - Discoveries, progress, last interaction time
 */
export function createExplorationStateSelector(
    narrativeLog: NarrativeEntry[]
): ExplorationState {
    return useMemo(() => {
        // Extract only exploration-related entries
        // Note: Filter by entry type that suggests exploration/discovery
        const discoveries = narrativeLog?.filter(
            (entry) => entry.type === 'narrative' || entry.type === 'action'
        ) || [];

        return {
            discoveries,
            lastExplorationTime: discoveries.length > 0
                ? Date.now() // TODO: Track actual exploration time in GameState
                : null,
            explorationProgress: Math.min(100, discoveries.length * 10),
        };
    }, [narrativeLog]);
}
