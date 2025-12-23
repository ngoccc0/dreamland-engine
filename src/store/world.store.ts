/**
 * @file src/store/world.store.ts
 * @description Zustand store for World State (chunks, creatures, weather, terrain)
 * 
 * @remarks
 * Manages dynamic world state: currently loaded chunks, creatures in world, weather conditions.
 * Static data (creature/item definitions) should NOT be in this store; use core/data instead.
 * Only runtime state (creature positions, health, current chunk) lives here.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Chunk } from '@/core/types/world';
import { Creature } from '@/core/domain/creature';
import { WeatherCondition } from '@/core/types/weather';

interface WorldStoreState {
  // Current loaded chunk
  currentChunk: Chunk | null;

  // Currently active creatures in the world
  creatures: Creature[];

  // Weather state
  weather: WeatherCondition;

  // Current biome ID
  currentBiome: string;

  // Actions
  setCurrentChunk: (chunk: Chunk) => void;
  setCreatures: (creatures: Creature[]) => void;
  updateCreature: (creatureId: string, updates: Partial<Creature>) => void;
  removeCreature: (creatureId: string) => void;
  addCreature: (creature: Creature) => void;
  setWeather: (weather: WeatherCondition) => void;
  setBiome: (biomeId: string) => void;
  setWorldState: (state: Partial<WorldStoreState>) => void;
}

/**
 * Zustand World Store.
 * 
 * @remarks
 * - currentChunk: the map/terrain chunk player is currently in
 * - creatures: all creatures currently spawned/active in the world
 * - weather: current weather conditions (affects gameplay)
 * - biome: current biome type (affects spawning, visuals, etc.)
 */
export const useWorldStore = create<WorldStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        currentChunk: null,
        creatures: [],
        weather: {
          effects: [],
          temperature: 20,
          windSpeed: 0,
          precipitation: 0,
          cloudCover: 0,
          visibility: 100,
        } as WeatherCondition,
        currentBiome: 'meadow',

        setCurrentChunk: (chunk) =>
          set({ currentChunk: chunk }, false, 'setCurrentChunk'),

        setCreatures: (creatures) =>
          set({ creatures }, false, 'setCreatures'),

        updateCreature: (creatureId, updates) =>
          set(
            (state: WorldStoreState) => ({
              creatures: state.creatures.map((c: Creature) =>
                c.id === creatureId ? { ...c, ...updates } as Creature : c
              ),
            }),
            false,
            'updateCreature'
          ),

        removeCreature: (creatureId) =>
          set(
            (state: WorldStoreState) => ({
              creatures: state.creatures.filter((c: Creature) => c.id !== creatureId),
            }),
            false,
            'removeCreature'
          ),

        addCreature: (creature) =>
          set(
            (state: WorldStoreState) => ({
              creatures: [...state.creatures, creature],
            }),
            false,
            'addCreature'
          ),

        setWeather: (weather) =>
          set({ weather }, false, 'setWeather'),

        setBiome: (biomeId) =>
          set({ currentBiome: biomeId }, false, 'setBiome'),

        setWorldState: (newState) =>
          set(newState, false, 'setWorldState'),
      }),
      {
        name: 'dreamland-world-storage',
        version: 1,
      }
    )
  )
);

/**
 * Selector: Get all creatures.
 */
export const useCreatures = () => useWorldStore((state) => state.creatures);

/**
 * Selector: Get creature by ID.
 */
export const useCreatureById = (id: string) =>
  useWorldStore((state) => state.creatures.find((c) => c.id === id));

/**
 * Selector: Get current weather.
 */
export const useWeather = () => useWorldStore((state) => state.weather);

/**
 * Selector: Get current biome.
 */
export const useCurrentBiome = () => useWorldStore((state) => state.currentBiome);
