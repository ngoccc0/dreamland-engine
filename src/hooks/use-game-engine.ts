
"use client";

import { useGameState } from "./use-game-state";
import { useActionHandlers } from "./use-action-handlers";
import { useGameEffects } from "./use-game-effects";

import type { GameState, WorldConcept, PlayerItem, ItemDefinition, GeneratedItem, Structure } from "@/lib/game/types";

interface GameEngineProps {
    gameSlot: number;
    worldSetup?: Omit<WorldConcept, 'playerInventory' | 'customItemCatalog' | 'customStructures'> & { playerInventory: PlayerItem[] };
    initialGameState?: GameState;
    customItemDefinitions?: Record<string, ItemDefinition>;
    customItemCatalog?: GeneratedItem[];
    customStructures?: Structure[];
}

export function useGameEngine(props: GameEngineProps) {
    const gameState = useGameState(props);
    
    const actionHandlers = useActionHandlers({
        ...gameState
    });

    useGameEffects({
        ...gameState,
        ...actionHandlers,
    });
    
    return {
        ...gameState,
        ...actionHandlers,
    };
}
