
import { GridPosition } from '@/core/values/grid-position';
import type { EffectProcessorResult } from '@/core/usecases/process-effects';
import type { WeatherSimulationResult } from '@/core/usecases/weather-simulation';
import type { CreatureSimulationResult } from '@/core/usecases/creature-simulation';
import type { GameStateResult } from './use-game-state';

interface UseGameTimeDeps {
    gameState: GameStateResult;
    creatureEngineRef: React.MutableRefObject<any>;
    settings: any;
    processAllEffects: () => EffectProcessorResult;
    simulateWeather: () => WeatherSimulationResult;
    simulateCreatures: () => CreatureSimulationResult;
    addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string) => void;
}

/**
 * Hook to manage game time advancement and the consolidated simulation loop.
 * 
 * @remarks
 * Orchestrates the "Turn" -> "Time" -> "Simulation" pipeline.
 */
export function useGameTime(deps: UseGameTimeDeps) {
    const { gameState, creatureEngineRef, settings, processAllEffects, simulateWeather, simulateCreatures, addNarrativeEntry } = deps;

    const advanceGameTime = (stats?: any) => {
        const currentTurn = gameState.turn || 0;

        // Apply any pending creature updates from the previous turn
        const pending = creatureEngineRef.current.applyPendingUpdates();
        const pendingMessages = pending.messages || [];
        const pendingUpdates = pending.updates || [];

        for (const message of pendingMessages) {
            // If the creature produced damage to the player, apply it to React state here
            if (message.meta && typeof message.meta.playerDamage === 'number') {
                const damage = message.meta.playerDamage as number;
                // Use gameState.setPlayerStats (returned from useGameState) to update React state
                if (typeof gameState.setPlayerStats === 'function') {
                    gameState.setPlayerStats((prev: any) => ({ ...(prev || {}), hp: Math.max(0, (prev?.hp || 0) - damage) }));
                }
            }

            // Add narrative/system entries as before
            addNarrativeEntry(message.text, message.type as any);
        }

        // Sync creature position updates into the world/chunk map so UI and handlers see movement
        if (pendingUpdates.length > 0) {
            try {
                gameState.setWorld((prev: any) => {
                    const nw = { ...(prev || {}) };
                    for (const u of pendingUpdates) {
                        const prevKey = u.prevPosition ? `${u.prevPosition.x},${u.prevPosition.y}` : undefined;
                        const newKey = `${u.newPosition.x},${u.newPosition.y}`;

                        // Remove enemy from previous chunk if moved across tiles, but only when it matches the same creature id
                        if (prevKey && prevKey !== newKey && nw[prevKey] && nw[prevKey].enemy) {
                            try {
                                const existingId = (nw[prevKey].enemy as any)?.id;
                                if (!existingId || existingId === u.creatureId) {
                                    delete nw[prevKey].enemy;
                                }
                            } catch { }
                        }

                        // Prepare enemy data for world (strip runtime-only fields)
                        const raw = { ...(u.creature as any) };
                        delete raw.position;
                        delete raw.currentChunk;
                        delete raw.lastMoveTick;
                        delete raw.targetPosition;
                        delete raw.currentBehavior;
                        delete raw._prevPosition;

                        // Persist stable id so world chunk keeps identity
                        try { raw.id = u.creatureId; } catch { }

                        // Ensure destination chunk exists in world
                        if (!nw[newKey]) {
                            nw[newKey] = { x: u.newPosition.x, y: u.newPosition.y, items: [], actions: [], structures: [] };
                        }

                        nw[newKey] = { ...(nw[newKey] || {}), enemy: raw };
                    }
                    return nw;
                });
            } catch (err) {
                // Silently handle creature sync failures
            }
        }

        gameState.setGameTime((prev: any) => {
            const next = prev + ((settings as any).timePerTurn || 15); // Use timePerTurn from settings, default 15
            if (next >= (settings as any).dayDuration) { // Use dayDuration from settings
                gameState.setDay((d: any) => d + 1);
            }
            gameState.setTurn((t: any) => t + 1); // Increment turn once per tick
            return next % (settings as any).dayDuration; // Use dayDuration from settings
        });

        // Apply tick and weather effects atomically using sync-back pattern
        // This processes both status effects, hunger/thirst, and weather impacts in one atomic update
        const effectResult = processAllEffects();

        // Apply all effects atomically to player stats
        if (effectResult.updatedStats !== gameState.playerStats) {
            gameState.setPlayerStats(effectResult.updatedStats);
        }

        // Add effect messages to narrative
        for (const msg of effectResult.tickMessages) {
            addNarrativeEntry(msg.text, msg.type as 'narrative' | 'system' | 'action' | 'monologue');
        }

        // Update weather engine
        const weatherResult = simulateWeather();

        // Add weather messages to narrative atomically
        for (const msg of weatherResult.weatherMessages) {
            addNarrativeEntry(msg.text, msg.type as 'narrative' | 'system' | 'action' | 'monologue');
        }

        // Simulate creatures and plants using sync-back pattern
        const { creatureMessages, plantMessages } = simulateCreatures();

        // Add creature and plant messages to narrative atomically
        for (const msg of plantMessages) {
            addNarrativeEntry(msg.text, msg.type as 'narrative' | 'system' | 'action' | 'monologue');
        }
        for (const msg of creatureMessages) {
            addNarrativeEntry(msg.text, msg.type as 'narrative' | 'system' | 'action' | 'monologue');
        }
    };

    return { advanceGameTime };
}
