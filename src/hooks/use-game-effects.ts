

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
import { adaptivePlantTick } from '@/core/usecases/adaptivePlantTick'; // Import the new usecase
import { getTranslatedText } from '@/lib/i18n'; // Re-import getTranslatedText for consistency within this file if needed
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
 * Orchestrator hook for managing all game side-effects.
 * This hook initializes the correct data repository and then delegates
 * specific lifecycle tasks (initialization, saving, progression, etc.)
 * to specialized child hooks.
 * @param {GameEffectsDeps} deps - A collection of all state variables and updaters from the main game state.
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

  // --- NEW: Adaptive Plant Tick Logic ---
  useEffect(() => {
    if (!deps.isLoaded || deps.isGameOver || !deps.world || deps.gameTime % 5 !== 0) {
      return; // Run every 5 game ticks for performance
    }

    let newWorld = { ...deps.world };
    const narrativeUpdates: GameEffectsDeps['narrativeLogRef']['current'] = [];
    let worldChanged = false;

    // Iterate over all chunks to find plants
    for (const key in newWorld) {
      if (Object.prototype.hasOwnProperty.call(newWorld, key)) {
        const chunk = newWorld[key];
        let newChunk = { ...chunk };

        if (newChunk.enemy && newChunk.enemy.plantProperties && newChunk.enemy.plantProperties.parts) {
          const plant = newChunk.enemy as CreatureDefinition; // Type guard
          const rngSeed = `${chunk.x},${chunk.y},${deps.gameTime}`; // Unique seed per chunk per tick

          const { newPlant, envUpdates, droppedItems, narrativeEvents, plantRemoved } = adaptivePlantTick({
            plant: plant,
            chunk: newChunk,
            config: deps.config,
            rngSeed: rngSeed,
            gameTime: deps.gameTime,
          });

          if (plantRemoved) {
            newChunk.enemy = null; // Remove the plant if it wilted
            newChunk.actions = newChunk.actions.filter((action: GameAction) => action.params?.targetId !== plant.id); // Also remove related actions, typed as GameAction
          } else {
            newChunk.enemy = newPlant; // Update the plant in the chunk
          }

          // Apply environmental updates to the chunk
          if (envUpdates.lightLevelDelta) {
            newChunk.lightLevel = clamp(newChunk.lightLevel + envUpdates.lightLevelDelta, 0, 100);
          }
          if (envUpdates.nutritionDelta) {
            newChunk.nutrition = (newChunk.nutrition || 0) + envUpdates.nutritionDelta;
          }
          if (envUpdates.vegetationDensityDelta) {
            newChunk.vegetationDensity = clamp(newChunk.vegetationDensity + envUpdates.vegetationDensityDelta, 0, 100);
          }
          // Note: attractCreaturesDelta will be used in future creature AI/spawn logic

          // Add dropped items to chunk.items
          if (droppedItems.length > 0) {
            newChunk.items = [...(newChunk.items || []), ...droppedItems.map(item => ({
              id: item.name, // Using name as ID for simple item
              name: { en: item.name, vi: item.name }, // Placeholder translation, actual itemDef resolve needed
              description: { en: item.name, vi: item.name },
              emoji: '🍃', // Placeholder emoji
              quantity: item.quantity,
              spawnedBy: item.sourcePlantId,
            }))];
          }

          // Add narrative events to log
          narrativeEvents.forEach(event => {
            // getTranslatedText does not handle 'params' directly. Assuming 'event.key' can be interpolated by narrative system later.
            deps.addNarrativeEntry(getTranslatedText(event.key, 'en'), 'system'); // Simplified call
          });

          // Only update if chunk actually changed
          if (JSON.stringify(chunk) !== JSON.stringify(newChunk)) { // Simple deep comparison
            newWorld[key] = newChunk;
            worldChanged = true;
          }
        }
      }
    }

    if (worldChanged) {
      deps.setWorld(newWorld);
    }
  }, [deps.isLoaded, deps.isGameOver, deps.world, deps.playerPosition.x, deps.playerPosition.y, deps.gameTime, deps.setWorld, deps.addNarrativeEntry, deps.config]);
}
