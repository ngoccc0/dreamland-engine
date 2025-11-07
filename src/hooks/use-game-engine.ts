
'use client';

import { useRef, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { applyTickEffects } from '@/lib/game/effect-engine';
import type { PlayerStatusDefinition } from '@/lib/game/types';
import { CreatureEngine } from '@/core/engines/creature-engine';
import { GridPosition } from '@/core/values/grid-position';
import { useGameState } from "./use-game-state";
import { useActionHandlers } from "./use-action-handlers";
import { useGameEffects } from "./useGameEffects";
import { useSettings } from "@/context/settings-context"; // Import useSettings

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
    const { biomeDefinitions } = gameState as any;
    const narrativeContainerRef = useRef<HTMLDivElement>(null);
    const narrativeLogRef = useRef(gameState.narrativeLog || [] as any[]);
    const { t } = useLanguage();
    const { settings } = useSettings(); // Use settings context

    // Initialize creature engine
    const creatureEngineRef = useRef(new CreatureEngine(t));

    const addNarrativeEntry = (text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string) => {
        // Preserve explicit entryId when provided (placeholders use predictable ids).
        // If no id provided, generate a stable unique id.
        const id = entryId ?? `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
        const entry = { id, text, type } as any;
        gameState.setNarrativeLog(prev => {
            const arr = (prev || []);
            const existingIdx = arr.findIndex((e: any) => e.id === id);
            let next: any[];
            if (existingIdx >= 0) {
                // Replace existing entry in-place to avoid duplicates when updating placeholders
                next = arr.map((e: any) => e.id === id ? { ...e, text: entry.text, type: entry.type } : e);
            } else {
                next = [...arr, entry];
            }
            // Defensive dedupe: keep last occurrence for each id (handles race conditions)
            const deduped = Array.from(new Map(next.map((e: any) => [e.id, e])).values());
            narrativeLogRef.current = deduped;
            return deduped;
        });
    };

    const advanceGameTime = (stats?: any) => {
        const currentTurn = gameState.turn || 0;

        gameState.setGameTime(prev => {
                const next = prev + (settings as any).timePerTurn; // Use timePerTurn from settings
                if (next >= (settings as any).dayDuration) { // Use dayDuration from settings
                    gameState.setDay(d => d + 1);
                    gameState.setTurn(t => t + 1);
                    return next % (settings as any).dayDuration; // Use dayDuration from settings
            }
            gameState.setTurn(t => t + 1);
            return next;
        });

        // If caller provided a candidate stats object, apply per-tick effects
        if (stats) {
            const newStats = { ...stats } as PlayerStatusDefinition;
            const { newStats: updated, messages } = applyTickEffects(newStats, currentTurn, t);
            for (const m of messages) addNarrativeEntry(m.text, m.type);
            gameState.setPlayerStats(() => updated);
        }

        // Update creatures
        const playerPosition = new GridPosition(gameState.playerPosition.x, gameState.playerPosition.y);
        // Get visible chunks around the player for creature simulation
        const visibleChunks = new Map<string, any>();
        const viewRadius = 5; // Include chunks within 5 tiles of the player

        // Add current chunk if it exists
        if (gameState.currentChunk) {
            const chunkKey = `${gameState.currentChunk.x},${gameState.currentChunk.y}`;
            visibleChunks.set(chunkKey, gameState.currentChunk);
        }

        // Add surrounding chunks if world data is available
        if (gameState.world && typeof gameState.world.getChunksInArea === 'function') {
            try {
                const surroundingChunks = gameState.world.getChunksInArea(playerPosition, viewRadius);
                for (const chunk of surroundingChunks) {
                    const chunkKey = `${chunk.x},${chunk.y}`;
                    visibleChunks.set(chunkKey, chunk);
                }
            } catch (error) {
                // Fallback to just current chunk if world methods are not available
                console.warn('World getChunksInArea method not available, using only current chunk for creature updates');
            }
        }

        const creatureMessages = creatureEngineRef.current.updateCreatures(
            currentTurn,
            playerPosition,
            gameState.playerStats,
            visibleChunks
        );

        // Add creature messages to narrative
        for (const message of creatureMessages) {
            addNarrativeEntry(message.text, message.type);
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
        biomeDefinitions
    };
}
