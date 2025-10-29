

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import { FirebaseGameStateRepository } from '@/infrastructure/persistence/firebase.repository';
import { LocalStorageGameStateRepository } from '@/infrastructure/persistence/local-storage.repository';
import { IndexedDbGameStateRepository } from '@/infrastructure/persistence/indexed-db.repository';
import type { GameState, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, PlayerBehaviorProfile, Structure, Recipe, GeneratedItem, ItemDefinition } from "@/lib/game/types";
import { useGameInitialization } from './game-lifecycle/useGameInitialization';
import { useGameSaving } from './game-lifecycle/useGameSaving';
import { usePlayerProgression } from './game-lifecycle/usePlayerProgression';
import { useGameEvents } from './game-lifecycle/useGameEvents';
import { useWorldRendering } from './game-lifecycle/useWorldRendering';
import { useLanguage } from '@/context/language-context';

/**
 * @fileOverview Orchestrator hook for managing all game side-effects.
 * @description This hook initializes the correct data repository and then delegates
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
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system', entryId?: string) => void;
  finalWorldSetup: GameState['worldSetup'] | null;
  setFinalWorldSetup: React.Dispatch<React.SetStateAction<GameState['worldSetup'] | null>>;
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
  advanceGameTime: (stats?: PlayerStatus) => void;
};

/**
 * @fileOverview Orchestrator hook for managing all game side-effects.
 * @description This hook initializes the correct data repository and then delegates
 * specific lifecycle tasks (initialization, saving, progression, etc.)
 * to specialized child hooks.
 * @param {GameEffectsDeps} deps - A collection of all state variables and updaters from the main game state.
 */
export function useGameEffects(deps: GameEffectsDeps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [gameStateRepository, setGameStateRepository] = useState<IGameStateRepository>(new LocalStorageGameStateRepository());

  // Logic to select the appropriate repository based on user status and browser capabilities.
  useEffect(() => {
    let repo: IGameStateRepository;
    if (user) {
      repo = new FirebaseGameStateRepository(user.uid);
    } else if (typeof window !== 'undefined' && 'indexedDB' in window) {
      repo = new IndexedDbGameStateRepository();
    } else {
      repo = new LocalStorageGameStateRepository();
    }
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
}
