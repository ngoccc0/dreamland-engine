/**
 * @file src/store/time.store.ts
 * @description Zustand store for Game Time State (ticks, day count, season, etc.)
 * 
 * @remarks
 * Manages game progression time: tick counter, accumulated delta, day/turn counters.
 * GAME_TICK action updates this store.
 * 1 turn = 60 ticks = 30 seconds real time.
 * 1 game minute = 60 turns.
 * 1 game hour = 60 game minutes.
 * 1 game day = 24 game hours.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

interface TimeStoreState {
  // Raw tick counter (500ms per tick from game loop)
  tickCount: number;

  // Accumulated milliseconds (for hunger decay calculations)
  accumulatedMs: number;

  // Turn counter (60 ticks = 1 turn)
  turnCount: number;

  // Day counter
  dayCount: number;

  // Hour (0-23)
  hour: number;

  // Minute within hour (0-59)
  minute: number;

  // Season
  season: Season;

  // Actions
  processTick: (deltaMs: number) => void;
  setTimeState: (state: Partial<TimeStoreState>) => void;
}

/**
 * Zustand Time Store.
 * 
 * @remarks
 * - tickCount: incremented each game tick (500ms)
 * - accumulatedMs: tracks time for satiety decay (decreases satiety every 60,000ms = 1 game minute)
 * - turnCount: incremented every 60 ticks
 * - dayCount, hour, minute: derived from turns
 * - season: cycles every X turns (configurable, e.g., 4000 turns per season)
 */
export const useTimeStore = create<TimeStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        tickCount: 0,
        accumulatedMs: 0,
        turnCount: 0,
        dayCount: 0,
        hour: 0,
        minute: 0,
        season: 'spring',

        processTick: (deltaMs) =>
          set((state: TimeStoreState) => {
            const newTickCount = state.tickCount + 1;
            const newAccumulatedMs = state.accumulatedMs + deltaMs;

            // 1 turn = 60 ticks (3,000 milliseconds at 500ms/tick)
            let newTurnCount = state.turnCount;
            let newDayCount = state.dayCount;
            let newHour = state.hour;
            let newMinute = state.minute;

            if (newTickCount % 60 === 0) {
              newTurnCount++;

              // 1 day = 1440 turns (24 hours * 60 minutes)
              if (newTurnCount % 1440 === 0) {
                newDayCount++;
                newHour = 0;
                newMinute = 0;
              } else {
                // 60 turns = 1 hour
                newHour = Math.floor((newTurnCount % 1440) / 60);
                newMinute = newTurnCount % 60;
              }
            }

            // Determine season (every 4,000 turns = ~2.8 hours, roughly 1/10 of a day)
            // Spring: 0-4000, Summer: 4000-8000, Autumn: 8000-12000, Winter: 12000-16000
            const seasonCycle = newTurnCount % 16000;
            let newSeason: Season = 'spring';
            if (seasonCycle < 4000) newSeason = 'spring';
            else if (seasonCycle < 8000) newSeason = 'summer';
            else if (seasonCycle < 12000) newSeason = 'autumn';
            else newSeason = 'winter';

            return {
              tickCount: newTickCount,
              accumulatedMs: newAccumulatedMs,
              turnCount: newTurnCount,
              dayCount: newDayCount,
              hour: newHour,
              minute: newMinute,
              season: newSeason,
            };
          }, false, 'processTick'),

        setTimeState: (newState) =>
          set(newState, false, 'setTimeState'),
      }),
      {
        name: 'dreamland-time-storage',
        version: 1,
      }
    )
  )
);

/**
 * Selector: Get current time display (hour:minute format).
 */
export const useGameTimeDisplay = () =>
  useTimeStore((state) => `${String(state.hour).padStart(2, '0')}:${String(state.minute).padStart(2, '0')}`);

/**
 * Selector: Get day count.
 */
export const useGameDay = () => useTimeStore((state) => state.dayCount);

/**
 * Selector: Get season.
 */
export const useGameSeason = () => useTimeStore((state) => state.season);

/**
 * Selector: Get accumulated milliseconds (for satiety decay logic).
 */
export const useAccumulatedMs = () => useTimeStore((state) => state.accumulatedMs);
