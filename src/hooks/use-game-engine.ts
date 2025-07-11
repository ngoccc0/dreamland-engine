
"use client";

import { useGameState } from "./use-game-state";
import { useActionHandlers } from "./use-action-handlers";
import { useGameEffects } from "./use-game-effects";

import type { GameState, WorldConcept, PlayerItem, ItemDefinition, GeneratedItem, Structure } from "@/lib/game/types";

interface GameEngineProps {
    gameSlot: number;
}

export function useGameEngine(props: GameEngineProps) {
    const gameState = useGameState(props);
    
    const actionHandlers = useActionHandlers({
        ...gameState
    });

    useGameEffects({
        ...gameState,
    });
    
    return {
        ...gameState,
        ...actionHandlers,
    };
}
