/**
 * @file src/store/effect.store.ts
 * @description Zustand store for Active Game Effects (buffs, debuffs, poison, etc.)
 * 
 * @remarks
 * Manages all persistent gameplay effects (poison duration, blessings, curses).
 * Effects are aged by GAME_TICK action each interval.
 * Effects with duration 0 are automatically removed.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Effect } from '@/core/types/effects';

interface EffectStoreState {
  activeEffects: Effect[];

  // Add a new effect
  addEffect: (effect: Effect) => void;

  // Remove effect by ID
  removeEffect: (id: string) => void;

  // Age all effects (decrease duration). Called each GAME_TICK.
  ageEffects: () => void;

  // Set entire effect list (used by ActionProcessor)
  setActiveEffects: (effects: Effect[]) => void;

  // Get effects of specific type (for UI filtering)
  getEffectsByType: (type: string) => Effect[];
}

/**
 * Zustand Effect Store.
 * 
 * @remarks
 * - activeEffects: list of currently active effects on player
 * - addEffect: called when effect is created (item consumption, combat spell, etc.)
 * - ageEffects: called each GAME_TICK to decrease durations
 * - removeEffect: manual removal (e.g., potion that cures poison)
 */
export const useEffectStore = create<EffectStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        activeEffects: [],

        addEffect: (effect) =>
          set(
            (state: EffectStoreState) => ({
              activeEffects: [...state.activeEffects, effect],
            }),
            false,
            'addEffect'
          ),

        removeEffect: (id) =>
          set(
            (state: EffectStoreState) => ({
              activeEffects: state.activeEffects.filter((e) => e.id !== id),
            }),
            false,
            'removeEffect'
          ),

        ageEffects: () =>
          set(
            (state: EffectStoreState) => ({
              activeEffects: state.activeEffects
                .map((effect) => ({
                  ...effect,
                  duration: (effect.duration ?? 0) - 1,
                }))
                .filter((effect) => (effect.duration ?? 0) > 0),
            }),
            false,
            'ageEffects'
          ),

        setActiveEffects: (effects) =>
          set({ activeEffects: effects }, false, 'setActiveEffects'),

        getEffectsByType: (type) => {
          const state = get();
          return state.activeEffects.filter((e) => e.type === type);
        },
      }),
      {
        name: 'dreamland-effect-storage',
        version: 1,
      }
    )
  )
);

/**
 * Selector: Get all active effects.
 */
export const useActiveEffects = () => useEffectStore((state) => state.activeEffects);

/**
 * Selector: Get count of active effects.
 */
export const useActiveEffectCount = () => useEffectStore((state) => state.activeEffects.length);
