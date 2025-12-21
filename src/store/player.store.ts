/**
 * @file src/store/player.store.ts
 * @description Zustand store for Player State (Part of Strangler Fig migration pattern)
 * 
 * @remarks
 * Manages player HP, Satiety, Stamina, Inventory, Equipment, Attributes.
 * Uses persist middleware to auto-save to localStorage for PWA offline support.
 * Uses devtools middleware for Redux DevTools debugging.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PlayerStatus } from '@/core/types/player';

interface PlayerStoreState {
  player: PlayerStatus;
  
  // Core update action (called by ActionProcessor)
  setPlayerState: (newState: PlayerStatus) => void;
  
  // Selector helpers for common operations
  updateSatiety: (amount: number) => void;
  updateHp: (amount: number) => void;
  updateStamina: (amount: number) => void;
  updateExperience: (amount: number) => void;
}

/**
 * Factory to create initial player state.
 * TODO: Wire this to actual player factory from core/factories
 */
const createInitialPlayer = (): PlayerStatus => ({
  level: 1,
  experience: 0,
  hp: 100,
  mana: 50,
  stamina: 100,
  satiety: 100,
  bodyTemperature: 37,
  items: [],
  equipment: {
    weapon: null,
    armor: null,
    accessory: null,
  },
  quests: [],
  questsCompleted: 0,
  skills: [],
  persona: { name: 'Player', class: 'Wanderer' } as any, // TODO: Proper type
  attributes: {
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    constitution: 10,
  },
  unlockProgress: {
    kills: 0,
    damageSpells: 0,
    moves: 0,
  },
  journal: {},
  dailyActionLog: [],
  questHints: {},
});

/**
 * Zustand Player Store.
 * 
 * @remarks
 * - persist middleware: stores state in localStorage under 'dreamland-player-storage'
 * - devtools middleware: enables Redux DevTools integration for debugging state changes
 * - setPlayerState: called by ActionProcessor after each action
 * - Selector helpers: for UI components that only care about specific fields
 */
export const usePlayerStore = create<PlayerStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        player: createInitialPlayer(),

        setPlayerState: (newState) =>
          set({ player: newState }, false, 'setPlayerState'),

        updateSatiety: (amount) =>
          set(
            (state: PlayerStoreState) => ({
              player: {
                ...state.player,
                satiety: Math.max(0, Math.min(100, state.player.satiety + amount)),
              },
            }),
            false,
            'updateSatiety'
          ),

        updateHp: (amount) =>
          set(
            (state: PlayerStoreState) => ({
              player: {
                ...state.player,
                hp: Math.max(0, Math.min(state.player.hp + amount, state.player.hp)),
              },
            }),
            false,
            'updateHp'
          ),

        updateStamina: (amount) =>
          set(
            (state: PlayerStoreState) => ({
              player: {
                ...state.player,
                stamina: Math.max(0, Math.min(100, state.player.stamina + amount)),
              },
            }),
            false,
            'updateStamina'
          ),

        updateExperience: (amount) =>
          set(
            (state: PlayerStoreState) => ({
              player: {
                ...state.player,
                experience: state.player.experience + amount,
              },
            }),
            false,
            'updateExperience'
          ),
      }),
      {
        name: 'dreamland-player-storage',
        version: 1,
        // TODO: Add migration logic here if schema changes
      }
    )
  )
);

/**
 * Selector: Get player HP only.
 * Component re-renders only when HP changes.
 */
export const usePlayerHp = () => usePlayerStore((state) => state.player.hp);

/**
 * Selector: Get player Satiety only.
 * Component re-renders only when Satiety changes.
 */
export const usePlayerSatiety = () => usePlayerStore((state) => state.player.satiety);

/**
 * Selector: Get player Stamina only.
 */
export const usePlayerStamina = () => usePlayerStore((state) => state.player.stamina);

/**
 * Selector: Get player Inventory only.
 * Component re-renders only when items change.
 */
export const usePlayerInventory = () => usePlayerStore((state) => state.player.items);

/**
 * Selector: Get player Attributes only.
 */
export const usePlayerAttributes = () => usePlayerStore((state) => state.player.attributes);
