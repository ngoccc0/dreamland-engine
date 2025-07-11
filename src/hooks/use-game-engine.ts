

"use client";

import { useRef } from 'react';
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
    
    const scrollToBottom = () => {
        const container = narrativeContainerRef.current;
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 0);
        }
    };

    const actionHandlers = useActionHandlers({
        ...gameState,
        scrollToBottom
    });

    useGameEffects({
        ...gameState,
        narrativeContainerRef
    });
    
    return {
        ...gameState,
        ...actionHandlers,
        narrativeContainerRef,
        scrollToBottom,
    };
}
