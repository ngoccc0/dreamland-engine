/**
 * @file src/core/usecases/game-tick-usecase.ts
 * @description Pure logic for GAME_TICK action
 * 
 * @remarks
 * Handles passive effects each tick:
 * 1. Accumulate deltaMs until 1 game minute (60,000ms) -> decrease satiety by 1
 * 2. Age all active effects (decrease duration)
 * 
 * This is pure: input + state -> output. No mutations, no side effects.
 */

import { PlayerStatus } from '@/core/types/player';
import { Effect } from '@/core/types/effects';
import { VisualEvent } from './actions/result-types';

interface GameTickInput {
  player: PlayerStatus;
  accumulatedMs: number;
  deltaMs: number;
  activeEffects: Effect[];
}

interface GameTickOutput {
  newPlayer: PlayerStatus;
  newAccumulatedMs: number;
  updatedEffects: Effect[];
  visualEvents: VisualEvent[];
}

/**
 * Process a single game tick.
 * 
 * @remarks
 * **Timing:**
 * - Game loop emits TICK every 500ms
 * - Satiety decreases 1 point per game minute (60,000ms = 120 ticks)
 * - Effects age each tick
 * 
 * **Example:**
 * - accumulatedMs = 50,000
 * - deltaMs = 500
 * - newAccumulatedMs = 50,500
 * - Still under 60,000, so no satiety decrease
 * 
 * - accumulatedMs = 59,700
 * - deltaMs = 500
 * - newAccumulatedMs = 60,200
 * - Over 60,000! Decrease satiety by 1, reset accumulator to 200
 * 
 * @param input - Current player, time accumulator, time delta, active effects
 * @returns Updated player, new accumulator, aged effects, and visual feedback
 */
export function executeGameTick(input: GameTickInput): GameTickOutput {
  const { player, accumulatedMs, deltaMs, activeEffects } = input;
  let newPlayer = player;
  let newAccumulatedMs = accumulatedMs + deltaMs;
  let updatedEffects = [...activeEffects];
  const events: VisualEvent[] = [];

  // Step 1: Check if enough time has passed for satiety decay
  const SATIETY_DECAY_INTERVAL = 60000; // 1 game minute in milliseconds
  let satietyDecayCount = 0;

  if (newAccumulatedMs >= SATIETY_DECAY_INTERVAL) {
    const decayCount = Math.floor(newAccumulatedMs / SATIETY_DECAY_INTERVAL);
    satietyDecayCount = decayCount;
    newAccumulatedMs = newAccumulatedMs % SATIETY_DECAY_INTERVAL;

    // Decrease satiety by decayCount
    const newSatiety = Math.max(0, (newPlayer.satiety || 100) - decayCount);
    newPlayer = {
      ...newPlayer,
      satiety: newSatiety,
    };

    // Show warning if very hungry
    if (newSatiety < 20 && newSatiety > 0) {
      events.push({
        type: 'SHOW_TOAST',
        message: 'You are getting very hungry!',
        severity: 'warning',
        duration: 2000,
      });
    }

    // Apply starvation damage if completely starving
    if (newSatiety === 0) {
      const starvationDamage = 1;
      newPlayer = {
        ...newPlayer,
        hp: Math.max(0, newPlayer.hp - starvationDamage),
      };

      events.push({
        type: 'SHOW_TOAST',
        message: 'You are starving! Losing health.',
        severity: 'error',
        duration: 2000,
      });

      events.push({
        type: 'SHOW_DAMAGE_NUMBER',
        value: starvationDamage,
        position: { x: 0, y: -40 },
        isCrit: false,
        color: '#FF0000',
      });
    }
  }

  // Step 2: Age all active effects (decrease duration)
  updatedEffects = updatedEffects
    .map((effect) => ({
      ...effect,
      duration: (effect.duration ?? 0) > 0 ? (effect.duration ?? 0) - 1 : 0,
    }))
    .filter((effect) => (effect.duration ?? 0) > 0); // Remove expired effects

  // Step 3: Apply damage from active damage-over-time effects
  let totalDamageThisTick = 0;
  activeEffects.forEach((effect) => {
    if (effect.type === 'damage_over_time' && effect.tickRate === 1) {
      totalDamageThisTick += effect.value || 0;
    }
  });

  if (totalDamageThisTick > 0) {
    newPlayer = {
      ...newPlayer,
      hp: Math.max(0, newPlayer.hp - totalDamageThisTick),
    };

    events.push({
      type: 'SHOW_DAMAGE_NUMBER',
      value: totalDamageThisTick,
      position: { x: 0, y: -20 },
      isCrit: false,
      color: '#FF9900',
    });

    // Trigger sound for poison damage
    if (totalDamageThisTick > 0) {
      events.push({
        type: 'PLAY_SOUND',
        soundId: 'poison_damage',
        volume: 0.3,
      });
    }
  }

  return {
    newPlayer,
    newAccumulatedMs,
    updatedEffects,
    visualEvents: events,
  };
}
