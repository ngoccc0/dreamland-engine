/**
 * @file src/hooks/use-game-state-wrapper.ts
 * @description Strangler Fig Pattern: Wraps Zustand stores and returns old GameState shape
 * 
 * @remarks
 * This hook is the migration bridge. Old components import useGameState and get the same
 * interface they expect. Behind the scenes, this wrapper subscribes to all Zustand stores.
 * 
 * As components are gradually refactored to use individual stores (usePlayerStore, useWorldStore, etc.),
 * this wrapper becomes less necessary. Eventually, it's deleted and all components use stores directly.
 * 
 * **Strangler Fig Pattern Phases:**
 * 1. Create new stores (Zustand) ✅ DONE
 * 2. Create wrapper hook that uses new stores, returns old interface ✅ THIS FILE
 * 3. Gradually refactor components to import stores directly (Phase 2+)
 * 4. Delete wrapper when no components use useGameState anymore (Phase 2+)
 */

import {
  usePlayerStore,
  usePlayerHp,
  usePlayerSatiety,
  usePlayerStamina,
  usePlayerInventory,
  usePlayerAttributes,
  useEffectStore,
  useActiveEffects,
  useTimeStore,
  useGameTimeDisplay,
  useGameDay,
  useGameSeason,
  useAccumulatedMs,
  useWorldStore,
  useCreatures,
  useWeather,
  useCurrentBiome,
  useNarrativeStore,
  useNarrativeText,
  useNarrativeHistory,
  useNarrativeMood,
} from '@/store';
import { PlayerStatus } from '@/core/types/player';
import { World } from '@/core/types/world';
import { Effect } from '@/core/types/effects';

/**
 * Old GameState interface (what existing components expect).
 * This is reconstructed from Zustand stores on each render.
 */
export interface GameState {
  // Player
  playerStats: PlayerStatus;
  setPlayerStats: (stats: PlayerStatus) => void;

  // Effects
  activeEffects: Effect[];
  setActiveEffects: (effects: Effect[]) => void;

  // World
  world: World | null;
  setWorld: (world: World) => void;
  creatures: any[];
  setCreatures: (creatures: any[]) => void;

  // Time
  gameTime: number;
  day: number;
  turn: number;
  season: string;
  accumulatedMs: number;

  // Narrative
  narrativeLog: string[];
  currentNarrative: string;
  setCurrentNarrative: (text: string) => void;

  // Helpers
  isReady: boolean;
}

/**
 * Strangler Fig Wrapper Hook.
 * 
 * @remarks
 * Subscribes to all Zustand stores and reconstructs the old GameState shape.
 * Components using this hook work exactly as before, but now backed by Zustand.
 * 
 * **Performance Note:**
 * This hook will cause full re-render when ANY store changes.
 * To avoid this, migrate components to use individual store selectors:
 * - Instead of: `const { playerStats } = useGameStateWrapper()`
 * - Use: `const player = usePlayerStore()`
 * 
 * @returns GameState object compatible with old code
 */
export function useGameStateWrapper(): GameState {
  // Player state
  const playerStats = usePlayerStore((state: any) => state.player);
  const { setPlayerState } = usePlayerStore();

  // Effect state
  const activeEffects = useActiveEffects();
  const { setActiveEffects } = useEffectStore();

  // World state
  const { currentChunk, creatures } = useWorldStore();
  const { setCurrentChunk, setCreatures } = useWorldStore();
  const { setWorldState } = useWorldStore();

  // Time state
  const { tickCount, accumulatedMs, turnCount, dayCount, season } = useTimeStore();

  // Narrative state
  const currentNarrative = useNarrativeText();
  const narrativeHistory = useNarrativeHistory();
  const { setCurrentText: setCurrentNarrative } = useNarrativeStore();

  // Reconstruct old GameState shape
  const gameState: GameState = {
    // Player
    playerStats,
    setPlayerStats: setPlayerState,

    // Effects
    activeEffects,
    setActiveEffects,

    // World
    world: currentChunk as any, // TODO: Proper world object construction
    setWorld: (world: any) => {
      // Wrapper for backward compatibility - old code expects setWorld(World)
      // but new store has separate setCurrentChunk, setCreatures, setWeather
      const { setCurrentChunk, setCreatures, setWeather, setBiome } = useWorldStore();
      setCurrentChunk(world?.currentChunk);
      if (world?.creatures) setCreatures(world.creatures);
      if (world?.weather) setWeather(world.weather);
      if (world?.currentBiome) setBiome(world.currentBiome);
    },
    creatures,
    setCreatures,

    // Time (note: using tickCount for gameTime)
    gameTime: tickCount,
    day: dayCount,
    turn: turnCount,
    season,
    accumulatedMs,

    // Narrative
    narrativeLog: narrativeHistory.map((entry) => entry.text),
    currentNarrative,
    setCurrentNarrative,

    // Flags
    isReady: true, // Always ready since stores are initialized
  };

  return gameState;
}

/**
 * **MIGRATION GUIDE**
 * 
 * **Old way (will be deleted):**
 * ```tsx
 * function MyComponent() {
 *   const { playerStats, creatures, gameTime } = useGameStateWrapper();
 *   return <div>HP: {playerStats.hp}</div>;
 * }
 * ```
 * 
 * **New way (preferred):**
 * ```tsx
 * function MyComponent() {
 *   const playerStats = usePlayerStore((s) => s.player);
 *   const creatures = useCreatures();
 *   const gameTime = useTimeStore((s) => s.tickCount);
 *   return <div>HP: {playerStats.hp}</div>;
 * }
 * ```
 * 
 * Benefits of new way:
 * - Component re-renders only when HP changes (not when creatures change)
 * - Smaller bundle (no unused selectors)
 * - Clearer dependencies
 */
