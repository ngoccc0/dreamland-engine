
'use client';

import { useRef, useEffect } from 'react';
import { useGameState } from "./use-game-state";
import { useActionHandlers } from "./use-action-handlers";
import { useGameEffects } from "./useGameEffects";

/**
 * @fileOverview The main Game Engine hook, acting as the primary orchestrator.
 *
 * @description
 * This hook serves as the central "Manager" in the application's architecture.
 * Its primary responsibility is to assemble all specialized "worker" hooks
 * (`useGameState`, `useActionHandlers`, `useGameEffects`) and provide a single,
 * clean interface for the UI (the `GameLayout` component) to interact with.
 *
 * This architecture adheres to the "separation of concerns" principle:
 * - `useGameState`: Manages all the raw state of the game.
 * - `useActionHandlers`: Contains the logic for *how* to execute player actions (the "How").
 * - `useGameEffects`: Manages all side effects that react to state changes (saving, game over checks, etc.).
 * - `GameLayout`: The UI layer, which only knows *what* action it wants to perform (the "What"),
 *   and calls the appropriate function provided by this engine.
 *
 * @param {GameEngineProps} props - The properties for the game engine, specifically the game slot.
 * @returns An object containing the entire game state and all action handler functions.
 */
export function useGameEngine(props: { gameSlot: number }) {
    const gameState = useGameState(props);
    const narrativeContainerRef = useRef<HTMLDivElement>(null);
    
    /**
     * @description This effect ensures that whenever the narrativeLog changes, the view scrolls to the bottom.
     * The dependency array `[gameState.narrativeLog]` triggers the effect on every new entry.
     */
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
        ...gameState
    });

    useGameEffects({
        ...gameState
    });
    
    return {
        ...gameState,
        ...actionHandlers,
        narrativeContainerRef,
    };
}
