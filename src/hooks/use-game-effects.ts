

'use client';

import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAuth } from '@/context/auth-context';
import { createGameStateRepository, type IGameStateRepository } from '@/infrastructure/persistence';
import type { GameState, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, PlayerBehaviorProfile, Structure, Recipe, GeneratedItem, ItemDefinition } from "@/core/types/game";
import { useGameInitialization } from './game-lifecycle/useGameInitialization';
import { useGameSaving } from './game-lifecycle/useGameSaving';
import { usePlayerProgression } from './game-lifecycle/usePlayerProgression';
import { useGameEvents } from './game-lifecycle/useGameEvents';
import { useWorldRendering } from './game-lifecycle/useWorldRendering';
import { useLanguage } from '@/context/language-context';
import type { GameConfig } from '@/lib/config/game-config'; // Import GameConfig
import { processPlantGrowth } from '@/core/usecases/plant-growth.usecase';
import { getTranslatedText } from '@/lib/core/i18n'; // Re-import getTranslatedText for consistency within this file if needed
import { createRng } from '@/lib/narrative/rng'; // For consistent RNG seed generation
import type { CreatureDefinition } from '@/core/types/creature'; // Import CreatureDefinition for type guarding
import { clamp } from '@/lib/utils'; // Import clamp utility

// Define a basic Action type as it's used in chunk.actions
interface GameAction {
  id: number;
  params?: {
    targetId?: string;
    partName?: string;
    // Add other common action parameters here
  };
  // Add other properties that an action might have
}

/**
 * Orchestrator hook for managing all game side-effects.
 * This hook initializes the correct data repository and then delegates
 * specific lifecycle tasks (initialization, saving, progression, etc.)
 * to specialized child hooks.
 * @param {GameEffectsDeps} deps - A collection of all state variables and updaters from the main game state.
 */
type GameEffectsDeps = {
  isLoaded: boolean;
  isLoading: boolean;
  isGameOver: boolean;
  isSaving: boolean;
  setIsLoaded: (loaded: boolean) => void;
  setIsGameOver: (gameOver: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  playerStats: PlayerStatus;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStatus>>;
  playerBehaviorProfile: PlayerBehaviorProfile;
  setPlayerBehaviorProfile: React.Dispatch<React.SetStateAction<PlayerBehaviorProfile>>;
  world: GameState['world'];
  setWorld: React.Dispatch<React.SetStateAction<GameState['world']>>;
  playerPosition: GameState['playerPosition'];
  setPlayerPosition: (pos: GameState['playerPosition']) => void;
  narrativeLogRef: React.RefObject<NarrativeEntry[]>;
  setNarrativeLog: (log: NarrativeEntry[]) => void;
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system' | 'monologue', entryId?: string) => void;
  finalWorldSetup: GameState['worldSetup'] | null;
  setFinalWorldSetup: Dispatch<SetStateAction<GameState['worldSetup'] | null>>;
  turn: number;
  setTurn: (turn: number) => void;
  day: number;
  setDay: (day: number) => void;
  gameTime: number;
  setGameTime: (time: number) => void;
  currentSeason: Season;
  setCurrentSeason: (season: Season) => void;
  worldProfile: WorldProfile;
  setWorldProfile: (profile: WorldProfile) => void;
  weatherZones: GameState['weatherZones'];
  setWeatherZones: (zones: GameState['weatherZones']) => void;
  regions: GameState['regions'];
  setRegions: (regions: GameState['regions']) => void;
  regionCounter: number;
  setRegionCounter: (counter: number) => void;
  setCurrentChunk: (chunk: Chunk | null) => void;
  customItemDefinitions: Record<string, ItemDefinition>;
  setCustomItemDefinitions: (defs: Record<string, ItemDefinition>) => void;
  customItemCatalog: GeneratedItem[];
  setCustomItemCatalog: (catalog: GeneratedItem[]) => void;
  customStructures: Structure[];
  setCustomStructures: (structures: Structure[]) => void;
  recipes: Record<string, Recipe>;
  setRecipes: (recipes: Record<string, Recipe>) => void;
  buildableStructures: Record<string, Structure>;
  setBuildableStructures: (structures: Record<string, Structure>) => void;
  gameSlot: number;
  config: GameConfig; // New: Add game config to dependencies
  advanceGameTime: (stats?: PlayerStatus) => void;
};

/**
 * Game side-effects orchestrator - manages all reactive effects and game lifecycle.
 *
 * @remarks
 * This hook initializes and coordinates specialized lifecycle hooks that handle
 * all side-effects (state changes that cause external actions):
 * - **Initialization**: Setup world, load save data, initialize game state
 * - **Saving**: Auto-save game state, handle manual saves
 * - **Progression**: Track player level-ups, quest completion, skill mastery
 * - **Events**: Respond to state changes (game-over, achievements, narrative triggers)
 * - **Rendering**: Optimize chunk rendering, viewport management
 *
 * **Repository Pattern:**
 * Automatically selects correct data repository (Firebase vs offline) based on auth status.
 * When user authenticates, uses Firebase for cloud saves. When offline, uses IndexedDB.
 * Switches repositories reactively when auth state changes.
 *
 * **Effect Lifecycle:**
 * 1. On mount: Initialize correct repository based on auth status
 * 2. On state change: Trigger specialized lifecycle hooks
 * 3. On auth change: Re-initialize repository (switch between Firebase/offline)
 * 4. On unmount: Cleanup auto-save timers, pending requests
 *
 * @param {GameEffectsDeps} deps - Complete game state object with all setters and refs
 * @returns {void} This hook produces side-effects only, no return value
 *
 * @example
 * useGameEffects({
 *   ...gameState,
 *   narrativeLogRef,
 *   gameSlot: 0,
 *   config: defaultGameConfig,
 *   advanceGameTime: () => {...}
 * });
 */
export function useGameEffects(deps: GameEffectsDeps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [gameStateRepository, setGameStateRepository] = useState<IGameStateRepository>(
    createGameStateRepository({ userId: null })
  );

  /**
   * Select appropriate repository based on authentication status
   *
   * @remarks
   * Uses createGameStateRepository factory to abstract implementation selection logic.
   * When user authenticates, switches to Firebase; when logging out, switches to offline storage.
   */
  useEffect(() => {
    const repo = createGameStateRepository({
      userId: user?.uid ?? null,
      preferOffline: false,
    });
    setGameStateRepository(repo);
  }, [user]);

  // --- DELEGATE TO SPECIALIZED HOOKS ---

  useGameInitialization({ ...deps, gameStateRepository });

  useGameSaving({ ...deps, gameStateRepository });

  usePlayerProgression({
    isLoaded: deps.isLoaded,
    playerStats: deps.playerStats,
    setPlayerStats: deps.setPlayerStats,
    playerBehaviorProfile: deps.playerBehaviorProfile,
    addNarrativeEntry: deps.addNarrativeEntry,
  });

  useGameEvents({
    isLoaded: deps.isLoaded,
    isGameOver: deps.isGameOver,
    setIsGameOver: deps.setIsGameOver,
    playerStats: deps.playerStats,
    setPlayerStats: deps.setPlayerStats,
    world: deps.world,
    setWorld: deps.setWorld,
    regions: deps.regions,
    setRegions: deps.setRegions,
    regionCounter: deps.regionCounter,
    setRegionCounter: deps.setRegionCounter,
    playerPosition: deps.playerPosition,
    addNarrativeEntry: deps.addNarrativeEntry,
    currentSeason: deps.currentSeason,
    worldProfile: deps.worldProfile,
    customItemDefinitions: deps.customItemDefinitions,
    customItemCatalog: deps.customItemCatalog,
    customStructures: deps.customStructures,
    language: language,
    turn: deps.turn,
  });

  useWorldRendering({
    isLoaded: deps.isLoaded,
    world: deps.world,
    playerPosition: deps.playerPosition,
    weatherZones: deps.weatherZones,
    gameTime: deps.gameTime,
    setCurrentChunk: deps.setCurrentChunk,
  });

  // Plant processing now handled in use-game-engine.ts for visible chunks
  // Global world processing can be added here if needed for offline progression
}

