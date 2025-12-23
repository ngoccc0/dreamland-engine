
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
import { useNarrativeQueue } from "./use-narrative-queue";
import { useGameTime } from "./use-game-time";
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
    const { addNarrativeEntry, narrativeLogRef } = useNarrativeQueue({
        initialLog: gameState.narrativeLog || [],
        setNarrativeLog: gameState.setNarrativeLog
    });
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



    const { advanceGameTime } = useGameTime({
        gameState,
        creatureEngineRef,
        settings,
        processAllEffects,
        simulateWeather,
        simulateCreatures,
        addNarrativeEntry
    });

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
