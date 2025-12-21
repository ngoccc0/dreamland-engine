/**
 * @file src/store/narrative.store.ts
 * @description Zustand store for Narrative State (story log, current scene, descriptions)
 * 
 * @remarks
 * Manages narrative output: the text descriptions, story history, current scene mood.
 * This is UI-focused; game logic doesn't depend on narrative store.
 * Narrative engine generates text, narrative store displays it.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface NarrativeEntry {
  timestamp: number;
  text: string;
  mood?: string;
  source?: string; // 'action', 'exploration', 'combat', etc.
}

interface NarrativeStoreState {
  // Current narrative text (latest entry)
  currentText: string;

  // History of narrative entries (last 100)
  history: NarrativeEntry[];

  // Current mood/tone (affects text generation style)
  currentMood: string;

  // Context variables (for procedural text generation)
  context: Record<string, any>;

  // Actions
  addNarrativeEntry: (text: string, mood?: string, source?: string) => void;
  setCurrentText: (text: string) => void;
  setMood: (mood: string) => void;
  setContext: (context: Record<string, any>) => void;
  clearHistory: () => void;
  setNarrativeState: (state: Partial<NarrativeStoreState>) => void;
}

/**
 * Zustand Narrative Store.
 * 
 * @remarks
 * - currentText: the main narrative text displayed to player
 * - history: archive of narrative entries (for replayability, lore)
 * - mood: affects text generation style (ominous, cheerful, neutral, etc.)
 * - context: variables passed to narrative engine (weather, biome, creatures nearby, etc.)
 */
export const useNarrativeStore = create<NarrativeStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        currentText: 'You stand in a mysterious world...',
        history: [],
        currentMood: 'neutral',
        context: {},

        addNarrativeEntry: (text, mood = 'neutral', source = 'action') =>
          set(
            (state: NarrativeStoreState) => ({
              currentText: text,
              currentMood: mood,
              history: [
                ...state.history,
                {
                  timestamp: Date.now(),
                  text,
                  mood,
                  source,
                },
              ].slice(-100), // Keep last 100 entries
            }),
            false,
            'addNarrativeEntry'
          ),

        setCurrentText: (text) =>
          set({ currentText: text }, false, 'setCurrentText'),

        setMood: (mood) =>
          set({ currentMood: mood }, false, 'setMood'),

        setContext: (context) =>
          set({ context }, false, 'setContext'),

        clearHistory: () =>
          set({ history: [] }, false, 'clearHistory'),

        setNarrativeState: (newState) =>
          set(newState, false, 'setNarrativeState'),
      }),
      {
        name: 'dreamland-narrative-storage',
        version: 1,
      }
    )
  )
);

/**
 * Selector: Get current narrative text.
 */
export const useNarrativeText = () => useNarrativeStore((state) => state.currentText);

/**
 * Selector: Get narrative history.
 */
export const useNarrativeHistory = () => useNarrativeStore((state) => state.history);

/**
 * Selector: Get current mood.
 */
export const useNarrativeMood = () => useNarrativeStore((state) => state.currentMood);
