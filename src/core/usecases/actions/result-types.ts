/**
 * @file src/core/usecases/actions/result-types.ts
 * @description Unified result format for all action processing
 * 
 * @remarks
 * Action Processor always returns ActionResult with three distinct sections:
 * 1. newState: Updated game state (immutable snapshots)
 * 2. activeEffects: Gameplay effects (persistent, affects logic)
 * 3. visualEvents: UI events (one-time, for animation/sound)
 * 
 * This separation prevents game logic from contamination by UI concerns.
 */

import { PlayerStatus } from '@/core/types/player';
import { Effect } from '@/core/types/effects';
import { World } from '@/core/types/world';

/**
 * Visual Events: One-time, fire-and-forget UI instructions.
 * These do NOT affect game state or logic; purely for presentation.
 * 
 * @remarks
 * Examples:
 * - PLAY_SOUND: Play audio at given volume
 * - SHOW_DAMAGE_NUMBER: Display floating damage number
 * - SCREEN_SHAKE: Camera shake effect
 * - PARTICLE_EFFECT: Visual effect at location
 * - SHOW_TOAST: Notification message
 */
export type VisualEvent =
  | {
      type: 'PLAY_SOUND';
      soundId: string;
      volume?: number;
    }
  | {
      type: 'SHOW_DAMAGE_NUMBER';
      value: number;
      position: { x: number; y: number };
      isCrit: boolean;
      color?: string;
    }
  | {
      type: 'SCREEN_SHAKE';
      intensity: 'LOW' | 'MEDIUM' | 'HIGH';
      duration?: number;
    }
  | {
      type: 'PARTICLE_EFFECT';
      effectId: string;
      position: { x: number; y: number };
    }
  | {
      type: 'SHOW_TOAST';
      message: string;
      severity: 'info' | 'success' | 'warning' | 'error';
      duration?: number;
    }
  | {
      type: 'SHOW_ANIMATION';
      animationId: string;
      targetId?: string;
      position?: { x: number; y: number };
    };

/**
 * Complete result of action processing.
 * 
 * @remarks
 * Returned by ActionProcessor.process() and consumed by hooks/components.
 * Strictly separates state changes (logic) from UI feedback (presentation).
 */
export interface ActionResult {
  /**
   * New player state after action.
   * Always provided (even if action fails, returns updated state).
   */
  newPlayerState: PlayerStatus;

  /**
   * New world state after action (creatures, world objects, etc.).
   * May be null if action doesn't affect world.
   */
  newWorldState?: World;

  /**
   * Active gameplay effects (buffs, debuffs, status conditions).
   * This list includes all effects now active on player (newly added + existing).
   * 
   * @remarks
   * Used by effect system to track poison duration, blessings, curses, etc.
   * Has nothing to do with visual feedback; it's pure game state.
   */
  activeEffects: Effect[];

  /**
   * One-time visual events for UI layer to render.
   * Examples: sounds, animations, notifications, damage numbers.
   * 
   * @remarks
   * UI executes these immediately after state is updated.
   * Game logic never depends on whether these events were rendered.
   */
  visualEvents: VisualEvent[];

  /**
   * Optional: Debug message explaining what happened.
   * Used for testing and telemetry.
   */
  debugMessage?: string;
}
