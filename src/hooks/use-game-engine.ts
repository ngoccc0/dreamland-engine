

'use client';

import { useRef, useEffect } from 'react';
import { useGameState } from "./use-game-state";
import { useActionHandlers } from "./use-action-handlers";
import { useGameEffects } from "./use-game-effects";

import type { GameState, WorldConcept, PlayerItem, ItemDefinition, GeneratedItem, Structure } from "@/lib/game/types";

interface GameEngineProps {
    gameSlot: number;
}

export function useGameEngine(props: GameEngineProps) {
    const gameState = useGameState(props);
    const narrativeContainerRef = useRef<HTMLDivElement>(null);
    
    // This effect ensures that whenever the narrativeLog changes, we scroll to the bottom.
    // The dependency array [gameState.narrativeLog] triggers the effect on every new entry.
    useEffect(() => {
        const container = narrativeContainerRef.current;
        if (container) {
            // We use a small timeout to ensure the DOM has updated with the new element before we try to scroll.
            setTimeout(() => {
                const lastElement = container.querySelector('#' + CSS.escape(gameState.narrativeLog[gameState.narrativeLog.length - 1]?.id));
                if (lastElement) {
                    lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
