
import { useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import type { NarrativeEntry } from '@/core/types/game';

interface UseNarrativeQueueProps {
    initialLog: NarrativeEntry[];
    setNarrativeLog: React.Dispatch<React.SetStateAction<NarrativeEntry[]>>;
}

/**
 * Hook for managing the narrative queue and preventing race conditions.
 * 
 * @remarks
 * Handles atomic batching of narrative entries to ensure FIFO order and proper
 * state updates within React's render cycle.
 */
export function useNarrativeQueue({ initialLog, setNarrativeLog }: UseNarrativeQueueProps) {
    const narrativeLogRef = useRef<NarrativeEntry[]>(initialLog || []);
    const narrativeQueueRef = useRef<Array<{ entry: NarrativeEntry; id: string }>>([]);

    /**
     * Flush the narrative entry queue atomically to the game state.
     * This ensures FIFO ordering and proper deduplication of entries.
     */
    const flushNarrativeQueue = useCallback(() => {
        if (narrativeQueueRef.current.length === 0) return;

        const entriesToAdd = [...narrativeQueueRef.current];
        narrativeQueueRef.current = []; // Clear queue immediately

        setNarrativeLog(prev => {
            let arr: NarrativeEntry[] = (prev || []);

            // Apply each queued entry in FIFO order
            for (const { entry, id } of entriesToAdd) {
                const existingIdx = arr.findIndex((e: NarrativeEntry) => e.id === id);
                if (existingIdx >= 0) {
                    // Update existing entry
                    arr = arr.map((e: NarrativeEntry) =>
                        e.id === id
                            ? { ...e, text: entry.text, type: entry.type, isNew: false, ...(entry.animationMetadata && { animationMetadata: entry.animationMetadata }) }
                            : e
                    );
                } else {
                    // Add new entry
                    arr = [...arr, entry];
                }
            }

            // Final dedupe: keep last occurrence for each id
            const deduped: NarrativeEntry[] = Array.from(new Map(arr.map((e: NarrativeEntry) => [e.id, e])).values());
            narrativeLogRef.current = deduped;
            return deduped;
        });
    }, [setNarrativeLog]);

    // Flush narrative queue on every frame to ensure entries are applied atomically
    useEffect(() => {
        flushNarrativeQueue();
    });

    const addNarrativeEntry = useCallback((text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string, animationMetadata?: NarrativeEntry['animationMetadata']) => {
        /**
         * Queue a narrative entry for atomic batched application.
         */
        const id = entryId ?? `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const entry: NarrativeEntry = { id, text, type, isNew: true, ...(animationMetadata && { animationMetadata }) };

        // Queue entry for batch processing
        narrativeQueueRef.current.push({ entry, id });
    }, []);

    return {
        addNarrativeEntry,
        narrativeLogRef
    };
}
