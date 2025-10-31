
'use client';

import { useRef, useEffect } from 'react';
import { useGameState } from "./use-game-state";
import { useActionHandlers } from "./use-action-handlers";
import { useGameEffects } from "./useGameEffects";

// Remove unused type imports to satisfy lint

interface GameEngineProps {
    gameSlot: number;
}

/**
 * The main Game Engine hook.
 * This hook acts as the primary "Manager" or "Orchestrator" in our architecture.
 * Its main responsibility is to assemble all the specialized "workers" (other hooks)
 * and provide a single, clean interface for the UI (the GameLayout component) to interact with.
 *
 * It follows the "separation of concerns" principle:
 * - `useGameState`: Manages all the raw state of the game.
 * - `useActionHandlers`: Contains the logic for *how* to execute player actions (the "How").
 * - `useGameEffects`: Manages all side effects that react to state changes (saving, game over checks, etc.).
 * - `GameLayout`: The UI layer, which only knows *what* action it wants to perform (the "What"),
 *   and calls the appropriate function provided by this engine.
 */
export function useGameEngine(props: GameEngineProps) {
    const gameState = useGameState(props);
    const narrativeContainerRef = useRef<HTMLDivElement>(null);
    const narrativeLogRef = useRef(gameState.narrativeLog || [] as any[]);

    const addNarrativeEntry = (text: string, type: 'narrative' | 'action' | 'system', entryId?: string) => {
        const entry = { id: entryId ?? `${Date.now()}`, text, type } as any;
        gameState.setNarrativeLog(prev => {
            const next = [...(prev || []), entry];
            narrativeLogRef.current = next;
            return next;
        });
    };

    const advanceGameTime = (stats?: any) => {
        gameState.setGameTime(prev => {
            const next = prev + 1;
            if (next >= 1440) {
                gameState.setDay(d => d + 1);
                gameState.setTurn(t => t + 1);
                return next % 1440;
            }
            gameState.setTurn(t => t + 1);
            return next;
        });
        if (stats) {
            gameState.setPlayerStats(() => stats);
        }
    };
    
    // This effect ensures that whenever the narrativeLog changes, we scroll to the bottom.
    // The dependency array [gameState.narrativeLog] triggers the effect on every new entry.
    useEffect(() => {
        const container = narrativeContainerRef.current;
        if (container) {
            // We use a small timeout to ensure the DOM has updated with the new element before we try to scroll.
            setTimeout(() => {
                const lastElementId = gameState.narrativeLog[gameState.narrativeLog.length - 1]?.id;
                if (lastElementId) {
                    const lastElement = container.querySelector('#' + CSS.escape(lastElementId));
                    if (lastElement) {
                        lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                } else {
                    // Fallback for initial load or if ID is not found
                    container.scrollTop = container.scrollHeight;
                }
            }, 50);
        }
    }, [gameState.narrativeLog]);
    

    const actionHandlers = useActionHandlers({
        ...gameState,
        narrativeLogRef,
        addNarrativeEntry,
        advanceGameTime,
    } as any);

    useGameEffects({
        ...gameState,
        narrativeLogRef,
        addNarrativeEntry,
        advanceGameTime,
        gameSlot: props.gameSlot,
    } as any);
    
    return {
        ...gameState,
        ...actionHandlers,
        narrativeContainerRef,
    };
}
