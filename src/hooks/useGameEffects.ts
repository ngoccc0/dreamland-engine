
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

/**
 * @typedef {object} GameEffectsDeps
 * @description A collection of all state variables and updater functions required by the game effects hooks.
 * This is used to pass down the entire game context to child hooks.
 * @property {boolean} isLoaded - Flag indicating if the game has finished its initial load.
 * @property {boolean} isLoading - Flag indicating if an AI action is in progress.
 * @property {boolean} isGameOver - Flag indicating if the game is over.
 * @property {boolean} isSaving - Flag indicating if a save operation is in progress.
 * @property {Function} setIsLoaded - Function to set the loaded state.
 * @property {Function} setIsGameOver - Function to set the game over state.
 * @property {Function} setIsSaving - Function to set the saving state.
 * @property {PlayerStatus} playerStats - The current status of the player.
 * @property {Function} setPlayerStats - Function to update the player's status.
 * @property {PlayerBehaviorProfile} playerBehaviorProfile - The player's accumulated behavior statistics.
 * @property {Function} setPlayerBehaviorProfile - Function to update the player's behavior profile.
 * @property {GameState['world']} world - The game world, a map of chunks.
 * @property {Function} setWorld - Function to update the world state.
 * @property {GameState['playerPosition']} playerPosition - The player's current coordinates.
 * @property {Function} setPlayerPosition - Function to update the player's position.
 * @property {React.RefObject<NarrativeEntry[]>} narrativeLogRef - A ref to the narrative log for imperative access.
 * @property {Function} setNarrativeLog - Function to set the entire narrative log.
 * @property {Function} addNarrativeEntry - Function to add a new entry to the narrative log.
 * @property {GameState['worldSetup'] | null} finalWorldSetup - The initial world concept data.
 * @property {Function} setFinalWorldSetup - Function to set the world setup data.
 * @property {number} turn - The current game turn.
 * @property {Function} setTurn - Function to set the game turn.
 * @property {number} day - The current game day.
 * @property {Function} setDay - Function to set the game day.
 * @property {number} gameTime - The current time of day in minutes.
 * @property {Function} setGameTime - Function to set the game time.
 * @property {Season} currentSeason - The current season.
 * @property {Function} setCurrentSeason - Function to set the season.
 * @property {WorldProfile} worldProfile - The profile defining the world's characteristics.
 * @property {Function} setWorldProfile - Function to set the world profile.
 * @property {GameState['weatherZones']} weatherZones - The map of weather zones.
 * @property {Function} setWeatherZones - Function to update the weather zones.
 * @property {GameState['regions']} regions - The map of world regions.
 * @property {Function} setRegions - Function to update the regions.
 * @property {number} regionCounter - A counter for generating new region IDs.
 * @property {Function} setRegionCounter - Function to update the region counter.
 * @property {Function} setCurrentChunk - Function to set the currently active, effective chunk.
 * @property {Record<string, ItemDefinition>} customItemDefinitions - A map of all item definitions.
 * @property {Function} setCustomItemDefinitions - Function to update item definitions.
 * @property {GeneratedItem[]} customItemCatalog - A list of all items available in the world.
 * @property {Function} setCustomItemCatalog - Function to update the item catalog.
 * @property {Structure[]} customStructures - A list of custom structures.
 * @property {Function} setCustomStructures - Function to update custom structures.
 * @property {Record<string, Recipe>} recipes - A map of all crafting recipes.
 * @property {Function} setRecipes - Function to update recipes.
 * @property {Record<string, Structure>} buildableStructures - A map of all buildable structures.
 * @property {Function} setBuildableStructures - Function to update buildable structures.
 * @property {number} gameSlot - The active game slot number.
 * @property {Function} advanceGameTime - Function to advance the game clock and turn.
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
  setPlayerStats: (fn: (prev: PlayerStatus) => PlayerStatus) => void;
  playerBehaviorProfile: PlayerBehaviorProfile;
  setPlayerBehaviorProfile: (fn: (prev: any) => any) => void;
  world: GameState['world'];
  setWorld: (fn: (prev: GameState['world']) => GameState['world']) => void;
  playerPosition: GameState['playerPosition'];
  setPlayerPosition: (pos: GameState['playerPosition']) => void;
  narrativeLogRef: React.RefObject<NarrativeEntry[]>;
  setNarrativeLog: (log: NarrativeEntry[]) => void;
  addNarrativeEntry: (text: string, type: 'narrative' | 'action' | 'system', entryId?: string) => void;
  finalWorldSetup: GameState['worldSetup'] | null;
  setFinalWorldSetup: (setup: GameState['worldSetup']) => void;
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
  setBuildableStructures: (structures: Structure[]) => void;
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
    language: deps.playerStats.language || 'en', // Safely get language
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
