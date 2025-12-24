/**
 * @file src/hooks/move-orchestrator.ts
 * @description Move input throttling logic
 *
 * @remarks
 * **Architecture Decision: Input Throttling as Pure Logic**
 *
 * This hook provides ONLY throttling and validation logic.
 * It does NOT capture keyboard events (that's useKeyboardBindings' job).
 *
 * **Flow:**
 * UI (useKeyboardBindings) → canMove check → handleMove → game logic
 *
 * **Throttling Strategy:**
 * Based on CSS animation duration (300ms), not frame rate.
 * User presses key → check canMove() → if OK, execute move
 *
 * **Why Separate:**
 * - Input handling (keyboard) belongs to UI layer
 * - Throttling logic is game domain (animation duration)
 * - Separating them prevents duplicate listeners and race conditions
 */

import { useRef, useCallback } from 'react';

/**
 * Intent to move in a direction
 * Returned by useMoveOrchestrator after throttle check
 */
export interface MoveCommand {
  direction: 'north' | 'south' | 'east' | 'west';
  timestamp: number;
}

interface UseMoveOrchestratorDeps {
  /** Current game animation duration in ms (default 300) */
  animationDurationMs: number;
  /** Callback when valid move command should be executed */
  onMoveIntent: (command: MoveCommand) => void;
  /** Is game currently locked (paused, in dialog, etc) */
  isGameLocked: boolean;
  // NOTE: isAnimatingMove removed - animation is now visual-only, doesn't block input
}

/**
 * Move input orchestrator with throttling
 *
 * @param deps Configuration and callbacks
 * @returns Object with move validation and intent emission
 *
 * @remarks
 * **Throttle Mechanism:**
 * Tracks lastMoveTime. If current time - lastMoveTime < animationDurationMs,
 * input is ignored. This simulates "wait for animation to finish" behavior.
 *
 * **No Keyboard Handling:**
 * This hook does NOT attach keyboard listeners.
 * Keyboard → useKeyboardBindings → emitMoveIntent → game logic
 *
 * **No Queue Ownership:**
 * This hook ONLY emits intents via onMoveIntent callback.
 * useGameEngine receives intent → manages queue, collisions, sync.
 * This separation keeps the hook under 150 lines.
 */
export function useMoveOrchestrator(deps: UseMoveOrchestratorDeps) {
  const { animationDurationMs, onMoveIntent, isGameLocked } = deps;

  // Track the last time a move command was emitted
  const lastMoveTimeRef = useRef<number>(0);

  /**
   * Check if enough time has passed since last move
   * @returns true if we should allow a new move
   */
  const canEmitMove = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastMove = now - lastMoveTimeRef.current;
    return timeSinceLastMove >= animationDurationMs;
  }, [animationDurationMs]);

  /**
   * Emit a move intent
   * Respects throttle and game state
   *
   * Called by: useKeyboardBindings → handleMove callback
   */
  const emitMoveIntent = useCallback(
    (direction: 'north' | 'south' | 'east' | 'west') => {
      // Respect game locks (dialogs, paused, etc)
      if (isGameLocked) {
        return;
      }

      // Respect throttle (300ms animation duration)
      if (!canEmitMove()) {
        return;
      }

      // Emit intent to parent
      onMoveIntent({
        direction,
        timestamp: Date.now(),
      });

      // Update last move time AFTER emitting
      lastMoveTimeRef.current = Date.now();
    },
    [isGameLocked, canEmitMove, onMoveIntent],
  );

  // Return handlers for validation + intent emission
  return {
    emitMoveIntent,
    canEmitMove,
  };
}
