
'use client';

import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useLanguage } from '@/context/language-context';
import { applyTickEffects } from '@/lib/game/effect-engine';
import type { PlayerStatusDefinition, NarrativeEntry } from '@/core/types/game';
import { CreatureEngine } from '@/core/engines/creature-engine';
import { EffectEngine } from '@/core/engines/effect-engine';
import { WeatherEngine } from '@/core/engines/weather-engine';
import { processPlantGrowth } from '@/core/usecases/plant-growth.usecase';
import { WeatherType, WeatherIntensity, WeatherCondition } from '@/core/types/weather';
import { GridPosition } from '@/core/values/grid-position';
import { useGameState } from "./use-game-state";
import { useActionHandlers } from "./use-action-handlers";
import { useGameEffects } from "./use-game-effects";
import { useSettings } from "@/context/settings-context"; // Import useSettings
import { useAudioContext } from '@/lib/audio/AudioProvider';
import { defaultGameConfig } from '@/lib/config/game-config';

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
    const { playAmbienceForBiome, stopMusic } = useAudioContext();

    // Track in-flight move operations (fixed: turn-based cleanup instead of 5-second timeout)
    const activeMoveOpsRef = useRef<Set<string>>(new Set());

    // Initialize creature engine
    const creatureEngineRef = useRef(new CreatureEngine(t));

    // Initialize effect engine
    const effectEngineRef = useRef(new EffectEngine());

    // Define weather data with realistic base temperatures
    const weatherData: Map<WeatherType, WeatherCondition> = new Map([
        [WeatherType.CLEAR, {
            type: WeatherType.CLEAR,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600, // 1 hour
            effects: [],
            temperature: 22, // Average grassland temperature
            windSpeed: 10,
            precipitation: 0,
            cloudCover: 0,
            visibility: 100,
            transitions: []
        }],
        [WeatherType.CLOUDY, {
            type: WeatherType.CLOUDY,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600,
            effects: [],
            temperature: 20, // Slightly cooler
            windSpeed: 15,
            precipitation: 0,
            cloudCover: 60,
            visibility: 80,
            transitions: []
        }],
        [WeatherType.RAIN, {
            type: WeatherType.RAIN,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600,
            effects: [],
            temperature: 17, // Cooler during rain
            windSpeed: 20,
            precipitation: 50,
            cloudCover: 80,
            visibility: 70,
            transitions: []
        }],
        [WeatherType.SNOW, {
            type: WeatherType.SNOW,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600,
            effects: [],
            temperature: 0, // Cold during snow
            windSpeed: 25,
            precipitation: 30,
            cloudCover: 90,
            visibility: 50,
            transitions: []
        }],
        [WeatherType.WIND, {
            type: WeatherType.WIND,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600,
            effects: [],
            temperature: 20, // Neutral temperature
            windSpeed: 35,
            precipitation: 0,
            cloudCover: 20,
            visibility: 85,
            transitions: []
        }],
        [WeatherType.STORM, {
            type: WeatherType.STORM,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600,
            effects: [],
            temperature: 15, // Stormy and cool
            windSpeed: 40,
            precipitation: 70,
            cloudCover: 95,
            visibility: 40,
            transitions: []
        }],
        [WeatherType.FOG, {
            type: WeatherType.FOG,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600,
            effects: [],
            temperature: 18, // Cool and damp
            windSpeed: 5,
            precipitation: 10,
            cloudCover: 100,
            visibility: 30,
            transitions: []
        }],
        [WeatherType.HEATWAVE, {
            type: WeatherType.HEATWAVE,
            intensity: WeatherIntensity.NORMAL,
            duration: 3600,
            effects: [],
            temperature: 35, // Hot during heatwave
            windSpeed: 10,
            precipitation: 0,
            cloudCover: 20,
            visibility: 90,
            transitions: []
        }]
    ]);

    // Initialize weather engine
    const weatherEngineRef = useRef(new WeatherEngine(effectEngineRef.current, weatherData));


    // Queue for narrative entries to fix race condition
    // Entries are batched and flushed atomically per frame via useLayoutEffect
    const narrativeQueueRef = useRef<Array<{ entry: NarrativeEntry; id: string }>>([]);

    /**
     * Flush the narrative entry queue atomically to the game state.
     * This ensures FIFO ordering and proper deduplication of entries.
     *
     * @remarks
     * Called via useLayoutEffect to batch all queued entries from the current frame
     * and apply them atomically. This prevents race conditions from Promise microtasks
     * executing out of order.
     */
    const flushNarrativeQueue = useCallback(() => {
        if (narrativeQueueRef.current.length === 0) return;

        const entriesToAdd = [...narrativeQueueRef.current];
        narrativeQueueRef.current = []; // Clear queue immediately

        gameState.setNarrativeLog(prev => {
            let arr: NarrativeEntry[] = (prev || []);

            // Apply each queued entry in FIFO order
            for (const { entry, id } of entriesToAdd) {
                const existingIdx = arr.findIndex((e: NarrativeEntry) => e.id === id);
                if (existingIdx >= 0) {
                    // Update existing entry (placeholder placeholder updates)
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

            // Final dedupe: keep last occurrence for each id (defensive measure)
            const deduped: NarrativeEntry[] = Array.from(new Map(arr.map((e: NarrativeEntry) => [e.id, e])).values());
            narrativeLogRef.current = deduped;
            return deduped;
        });
    }, [gameState]);

    // Flush narrative queue on every frame to ensure entries are applied atomically
    useEffect(() => {
        // This effect runs AFTER paint but BEFORE browser render, ensuring atomic batch updates
        flushNarrativeQueue();
    });

    /**
     * Clear stale in-flight move operations at turn boundaries.
     *
     * @remarks
     * When the game turn increments, we clear the activeMoveOps Set to ensure
     * no stale move keys block new movement attempts. This is a deterministic
     * cleanup boundary (tied to game logic) instead of a timeout-based cleanup
     * which was problematic in React.StrictMode.
     *
     * This effect fixes the race condition documented in move-orchestrator.ts:
     * Previously, a 5-second timeout could leave stale entries if the component
     * unmounted/remounted, blocking movement. Now cleanup happens at game turn changes.
     */
    useEffect(() => {
        activeMoveOpsRef.current.clear();
    }, [gameState.turn]);

    const addNarrativeEntry = useCallback((text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string, animationMetadata?: NarrativeEntry['animationMetadata']) => {
        /**
         * Queue a narrative entry for atomic batched application.
         *
         * @remarks
         * Entries are queued in FIFO order and flushed atomically per frame via useLayoutEffect.
         * This fixes the race condition from Promise.resolve().then() where microtasks could
         * execute out of order, causing entries to be lost.
         *
         * ATOMIC BATCHING: All entries queued in a single synchronous block will be applied
         * together in a single setNarrativeLog call, ensuring deduplication works correctly.
         *
         * Example fix scenario:
         * - Tick 1: addNarrativeEntry("move") → queued
         * - Tick 2: addNarrativeEntry("pickup") → queued
         * - Tick 3: addNarrativeEntry("combat") → queued
         * - End of frame: All 3 entries flushed atomically with correct FIFO ordering
         */
        const id = entryId ?? `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const entry: NarrativeEntry = { id, text, type, isNew: true, ...(animationMetadata && { animationMetadata }) };

        // Queue entry for batch processing
        narrativeQueueRef.current.push({ entry, id });
    }, []);

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

        gameState.setGameTime(prev => {
            const next = prev + ((settings as any).timePerTurn || 15); // Use timePerTurn from settings, default 15
            if (next >= (settings as any).dayDuration) { // Use dayDuration from settings
                gameState.setDay(d => d + 1);
            }
            gameState.setTurn(t => t + 1); // Increment turn once per tick
            return next % (settings as any).dayDuration; // Use dayDuration from settings
        });

        // If caller provided a candidate stats object, apply per-tick effects
        if (stats) {
            const newStats = { ...stats } as PlayerStatusDefinition;
            const { newStats: updated, messages } = applyTickEffects(newStats, currentTurn, t, defaultGameConfig);
            for (const m of messages) addNarrativeEntry(m.text, m.type);
            gameState.setPlayerStats(() => updated);
        }

        // Update weather engine
        weatherEngineRef.current.update(gameState.gameTime);

        // Apply weather effects to player's current cell
        const playerPosition = new GridPosition(gameState.playerPosition.x, gameState.playerPosition.y);
        if (gameState.world && typeof gameState.world.getCellAt === 'function') {
            try {
                const playerCurrentCell = gameState.world.getCellAt(playerPosition);
                if (playerCurrentCell) {
                    weatherEngineRef.current.applyWeatherEffects(playerCurrentCell, gameState.playerStats);
                }
            } catch {
                // Silently handle world method unavailability
            }
        }

        // (Plant updates moved after visibleChunks are assembled)

        // Update creatures
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
            } catch {
                // Fallback to just current chunk if world methods are not available
                // Try to fill visibleChunks by querying getCellAt for each coordinate in viewRadius
                if (gameState.world && typeof gameState.world.getCellAt === 'function' && gameState.currentChunk) {
                    const cx = gameState.currentChunk.x;
                    const cy = gameState.currentChunk.y;
                    for (let dx = -viewRadius; dx <= viewRadius; dx++) {
                        for (let dy = -viewRadius; dy <= viewRadius; dy++) {
                            try {
                                const cell = gameState.world.getCellAt(new GridPosition(cx + dx, cy + dy));
                                if (cell) {
                                    const key = `${cell.x},${cell.y}`;
                                    visibleChunks.set(key, cell);
                                }
                            } catch {
                                // ignore missing cells
                            }
                        }
                    }
                } else {
                    // visibleChunks will contain only currentChunk
                }
            }
        }

        // Register creatures found in visibleChunks so CreatureEngine can simulate them.
        try {
            for (const [chunkKey, chunk] of visibleChunks) {
                if (chunk && chunk.enemy) {
                    const creatureId = `creature_${chunk.x}_${chunk.y}`;
                    if (!creatureEngineRef.current.getCreature(creatureId)) {
                        creatureEngineRef.current.registerCreature(creatureId, chunk.enemy, new GridPosition(chunk.x, chunk.y), chunk);
                    }
                }
            }
        } catch (err) {
            // Silently handle creature registration failures
        }

        // Update plants in visible area
        try {
            const plantResult = processPlantGrowth({
                currentTick: currentTurn,
                chunks: visibleChunks,
                season: gameState.currentSeason,
                worldProfile: gameState.worldProfile,
                t
            });
            for (const m of plantResult.narrativeMessages) addNarrativeEntry(m.text, m.type);
        } catch (err: any) {
            // Silently handle plant updates; world continues
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

    // This effect stops menu music and starts ambience when the game loads.
    useEffect(() => {
        if (gameState.isLoaded && gameState.world && typeof gameState.world.getCellAt === 'function') {
            // Stop any menu music
            stopMusic();
            // Start ambience for current biome
            try {
                const playerPosition = new GridPosition(gameState.playerPosition.x, gameState.playerPosition.y);
                const playerCurrentCell = gameState.world.getCellAt(playerPosition);
                if (playerCurrentCell && playerCurrentCell.terrain) {
                    playAmbienceForBiome(playerCurrentCell.terrain);
                }
            } catch {
                console.warn('Failed to get current biome for ambience music');
            }
        }
    }, [gameState.isLoaded, gameState.world, gameState.playerPosition.x, gameState.playerPosition.y, stopMusic, playAmbienceForBiome]);

    // This effect triggers ambience music when the player enters a new biome.
    useEffect(() => {
        if (gameState.world && typeof gameState.world.getCellAt === 'function') {
            try {
                const playerPosition = new GridPosition(gameState.playerPosition.x, gameState.playerPosition.y);
                const playerCurrentCell = gameState.world.getCellAt(playerPosition);
                if (playerCurrentCell && playerCurrentCell.terrain) {
                    playAmbienceForBiome(playerCurrentCell.terrain);
                }
            } catch {
                // Silently handle biome fetch
            }
        }
    }, [gameState.playerPosition.x, gameState.playerPosition.y, gameState.world, playAmbienceForBiome]);


    const actionHandlers = useActionHandlers({
        ...gameState,
        narrativeLogRef,
        activeMoveOpsRef,
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
