
'use client';

import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useLanguage } from '@/context/language-context';
import type { PlayerStatusDefinition, NarrativeEntry } from '@/core/types/game';
import { CreatureEngine } from '@/core/rules/creature';
import { EffectEngine } from '@/core/engines/effect-engine';
import { WeatherEngine } from '@/core/engines/weather-engine';
import { GridPosition } from '@/core/values/grid-position';
import { buildWeatherData } from '@/core/usecases/weather-simulation';
import { useGameState } from "./use-game-state";
import { useActionHandlers } from "./use-action-handlers";
import { useGameEffects } from "./use-game-effects";
import { useMoveOrchestrator } from "./move-orchestrator";
import { useEffectProcessor } from "./use-effect-processor";
import { useCreatureSimulation } from "./use-creature-simulation";
import { useWeatherSimulation } from "./use-weather-simulation";
import { useSettings } from "@/context/settings-context"; // Import useSettings
import { useAudioContext } from '@/lib/audio/AudioProvider';
import { ANIMATION_DURATION_MS, defaultGameConfig } from '@/lib/config/game-config';

interface GameEngineProps {
    gameSlot: number;
}

/**
 * Main Game Engine orchestrator hook - coordinates all game subsystems.
 *
 * @remarks
 * This hook serves as the central "conductor" of the game, assembling and coordinating
 * specialized worker hooks following strict separation of concerns:
 * - `useGameState`: Manages raw game world state (creatures, items, weather, player)
 * - `useActionHandlers`: Implements action logic (move, attack, harvest, craft, etc.)
 * - `useGameEffects`: Handles side effects (auto-save, game-over detection, music, narrative)
 * - `GameLayout`: UI layer that calls this engine's action handlers
 *
 * The engine manages several game loops:
 * - **Turn Loop**: Advances when player takes actions (moves, attacks, crafts)
 * - **Time Loop**: Game time (360=6AM, advances per turn), seasons, weather
 * - **Creature Loop**: Creature AI, plant growth, natural world evolution
 * - **Effect Loop**: Visual effects, damage resolution, status effects
 *
 * **Key responsibilities:**
 * - Orchestrate state → actions → effects pipelines
 * - Advance game time and manage seasons
 * - Trigger creature AI and plant growth
 * - Play ambient music/sounds based on biome
 * - Coordinate turn-based movement animations
 * - Provide action handlers to UI (move, attack, harvest, etc.)
 *
 * @param {GameEngineProps} props - Configuration with `gameSlot` for save slot selection
 * @returns {Object} Complete game interface combining state, actions, and handlers
 *
 * @example
 * const engine = useGameEngine({ gameSlot: 0 });
 * // Use state
 * console.log(engine.playerStats.hp);
 * // Perform actions
 * engine.handleMove({ x: 5, y: 10 });
 * engine.handleAttack(targetCreature);
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

    // Build weather data using pure function
    const weatherData = buildWeatherData();

    // Initialize weather engine
    const weatherEngineRef = useRef(new WeatherEngine(effectEngineRef.current, weatherData));

    // Initialize effect processor hook
    const { processAllEffects } = useEffectProcessor({
        playerStats: gameState.playerStats,
        gameState,
        currentTurn: gameState.turn || 0,
        config: defaultGameConfig,
        weatherEngineRef,
    });

    // Initialize creature simulation hook
    const { simulateCreatures } = useCreatureSimulation({
        currentTurn: gameState.turn || 0,
        playerPosition: gameState.playerPosition,
        playerStats: gameState.playerStats,
        gameState,
        creatureEngineRef,
    });

    // Initialize weather simulation hook
    const { simulateWeather } = useWeatherSimulation({
        currentGameTime: gameState.gameTime || 0,
        gameState,
        weatherEngineRef,
    });

    // Queue for narrative entries to fix race condition
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

    // Move orchestrator: handles input throttling based on CSS animation duration
    // Calls onMoveIntent when throttle allows, which delegates to handleMove
    const moveOrchestrator = useMoveOrchestrator({
        animationDurationMs: ANIMATION_DURATION_MS,
        onMoveIntent: (command) => {
            // Delegate to the existing move handler
            actionHandlers.handleMove(command.direction);
        },
        isGameLocked: gameState.isGameOver || gameState.isLoading,
        isAnimatingMove: gameState.isAnimatingMove || false,
    });

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
        // Override handleMove to apply throttling via moveOrchestrator
        // This ensures all move requests respect the 300ms animation interval
        handleMove: (direction: 'north' | 'south' | 'east' | 'west') =>
            moveOrchestrator.emitMoveIntent(direction),
        moveOrchestrator,
        narrativeContainerRef,
        biomeDefinitions
    };
}
