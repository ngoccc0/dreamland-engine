

'use client';

import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useAuth } from '@/context/auth-context';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import { FirebaseGameStateRepository } from '@/infrastructure/persistence/firebase.repository';
import { LocalStorageGameStateRepository } from '@/infrastructure/persistence/local-storage.repository';
import { IndexedDbGameStateRepository } from '@/infrastructure/persistence/indexed-db.repository';
import type { GameState, PlayerStatus, NarrativeEntry, Chunk, Season, WorldProfile, PlayerBehaviorProfile, Structure, Recipe, GeneratedItem, ItemDefinition } from "@/core/types/game";
import { useGameInitialization } from './game-lifecycle/useGameInitialization';
import { useGameSaving } from './game-lifecycle/useGameSaving';
import { usePlayerProgression } from './game-lifecycle/usePlayerProgression';
import { useGameEvents } from './game-lifecycle/useGameEvents';
import { useWorldRendering } from './game-lifecycle/useWorldRendering';
import { useLanguage } from '@/context/language-context';
import type { GameConfig } from '@/lib/config/game-config'; // Import GameConfig
import { adaptivePlantTick, scheduleNextEvent, calculateEnvironmentalMultiplier } from '@/core/usecases/adaptivePlantTick'; // Import scheduling helpers
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

  // --- NEW: Scheduled per-part plant events (Hybrid) ---
  useEffect(() => {
    if (!deps.isLoaded || deps.isGameOver || !deps.world) return;

    let newWorld = { ...deps.world };
    let worldChanged = false;

    // processing caps to avoid spikes
    const MAX_EVENTS_PER_CHUNK = 100;

    for (const key in newWorld) {
      if (!Object.prototype.hasOwnProperty.call(newWorld, key)) continue;
      const chunk = newWorld[key];
      let newChunk = { ...chunk } as typeof chunk;

      if (newChunk.enemy && newChunk.enemy.plantProperties && newChunk.enemy.plantProperties.parts) {
        const plant = newChunk.enemy as CreatureDefinition;
        const parts = plant.plantProperties!.parts || [];

        // Compute chunk-level env multiplier once
        const envResult = calculateEnvironmentalMultiplier(newChunk as any, deps.config, deps.gameTime, plant);
        const envMultiplier = envResult.multiplier;
        const envState = envResult.state;

        let eventsProcessed = 0;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i] as any;
          // Ensure runtime fields exist
          if (typeof part.currentQty !== 'number') part.currentQty = part.currentQty || 0;
          if (part.currentQty < 0) part.currentQty = 0;
          if (typeof part.decayCounter !== 'number') part.decayCounter = 0;
          part.staminaCost = part.staminaCost ?? 5;

          // Initialize nextTick if missing and growth possible
          if ((part.nextTick === undefined || part.nextTick === null) && (part.currentQty || 0) < (part.maxQty || 0)) {
            part.nextTick = scheduleNextEvent(part, envMultiplier, deps.gameTime, `${chunk.x},${chunk.y},${plant.id},${part.name}`);
            part.lastEnvMultiplier = envMultiplier;
          }

          // Handle UNSUITABLE state: increment decay counter
          if (envState === 'UNSUITABLE') {
            part.decayCounter = (part.decayCounter || 0) + 1;
            // After 10 ticks in unsuitable conditions, start losing parts
            if (part.decayCounter >= 10 && part.currentQty > 0) {
              part.currentQty = Math.max(0, part.currentQty - 1);
            }
          } else {
            // Reset decay counter in suitable conditions
            part.decayCounter = 0;
          }

          // Process due events for this part (loop while due and cap not reached)
          while (part.nextTick !== null && part.nextTick !== undefined && part.nextTick <= deps.gameTime && eventsProcessed < MAX_EVENTS_PER_CHUNK) {
            // Seed RNG deterministically per part event
            const rngSeed = `${chunk.x},${chunk.y},${plant.id},${part.name},${part.nextTick}`;
            const rng = createRng(rngSeed);

            let changed = false;

            // Growth attempt
            const growProb = (part.growProb || 0) * envMultiplier;
            if ((part.currentQty || 0) < (part.maxQty || 0) && rng.float() < growProb) {
              part.currentQty = Math.min(part.maxQty || Infinity, (part.currentQty || 0) + 1);
              deps.addNarrativeEntry(getTranslatedText('growEvent', 'en'), 'system');
              changed = true;
            }

            // Drop attempt
            const dropProb = (part.dropProb || 0) * envMultiplier;
            const windFactor = ((newChunk as any).windLevel || 0) / 100;
            const finalDropProb = dropProb + (part.name === 'leaves' ? windFactor * 0.005 : 0);
            if ((part.currentQty || 0) > 0 && rng.float() < finalDropProb) {
              part.currentQty = Math.max(0, (part.currentQty || 0) - 1);
              // produce dropped loot if defined
              if (part.droppedLoot && Array.isArray(part.droppedLoot) && part.droppedLoot.length > 0) {
                for (const lootDef of part.droppedLoot) {
                  if (rng.float() < (lootDef.chance || 0)) {
                    const qty = rng.int((lootDef.quantity?.min) || 1, (lootDef.quantity?.max) || 1);
                    if (qty > 0) {
                      newChunk.items = [...(newChunk.items || []), {
                        id: lootDef.name,
                        name: { en: lootDef.name, vi: lootDef.name },
                        description: { en: lootDef.name, vi: lootDef.name },
                        emoji: '🍃',
                        quantity: qty,
                        spawnedBy: plant.id || 'unknown'
                      }];
                      changed = true;
                    }
                  }
                }
              }
              deps.addNarrativeEntry(getTranslatedText('dropEvent', 'en'), 'system');
            }

            eventsProcessed++;

            // After applying event, schedule next event for this part (use current gameTime as basis)
            part.nextTick = scheduleNextEvent(part, envMultiplier, deps.gameTime, `${chunk.x},${chunk.y},${plant.id},${part.name},${eventsProcessed}`);
            part.lastEnvMultiplier = envMultiplier;

            if (!changed) break; // no further immediate changes, stop loop for this part
          }
        }

        // Remove plant if all harvestable parts are gone
        const allPartsEmpty = parts.every((p: any) => (p.currentQty || 0) === 0);
        if (allPartsEmpty) {
          newChunk.enemy = null;
          worldChanged = true;
        } else {
          // Write back changes if any
          if (JSON.stringify(plant.plantProperties!.parts) !== JSON.stringify(parts)) {
            const updatedPlant = { ...plant, plantProperties: { ...plant.plantProperties!, parts: parts } } as CreatureDefinition;
            newChunk.enemy = updatedPlant;
            worldChanged = true;
          } else {
            newChunk.enemy = plant;
          }
        }

        // Apply lightweight env heuristics similar to adaptivePlantTick (small deltas)
        const leaves = parts.find((p: any) => p.name === 'leaves');
        if (leaves && (leaves.currentQty || 0) > 0) {
          newChunk.lightLevel = clamp((newChunk.lightLevel || 0) - Math.floor((leaves.currentQty || 0) / Math.max(1, leaves.maxQty || 1) * 1), 0, 100);
        }
        const roots = parts.find((p: any) => p.name === 'roots');
        if (roots && (roots.currentQty || 0) > 0) {
          newChunk.nutrition = (newChunk.nutrition || 0) + 0.01 * (roots.currentQty || 0);
        }

        // Commit changes to world map
        if (worldChanged) newWorld[key] = newChunk;
      }
    }

    if (worldChanged) deps.setWorld(newWorld);
  }, [deps.isLoaded, deps.isGameOver, deps.world, deps.playerPosition.x, deps.playerPosition.y, deps.gameTime, deps.setWorld, deps.addNarrativeEntry, deps.config]);
}
