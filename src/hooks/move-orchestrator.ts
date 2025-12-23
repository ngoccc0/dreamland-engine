/**
 * @file src/hooks/move-orchestrator.ts
 * @description Extracted move input handling with throttling
 *
 * @remarks
 * **Architecture Decision: Input Layer Isolation**
 *
 * This hook handles ONLY input capture and throttling.
 * It does NOT own the move queue or process moves.
 *
 * **Ownership Model:**
 * - useMoveOrchestrator: Input → Throttle → Emit Intent
 * - useGameEngine: Intent → Queue → Collision Check → State Update
 *
 * **Why Separate?**
 * Input handling is React/browser concern (keyboard, touch, debouncing).
 * Game logic is pure (collision, state mutation, world updates).
 * Separating them allows testing each independently and prevents race conditions.
 *
 * **Throttling Strategy:**
 * Based on CSS animation duration (300ms), not frame rate.
 * User holding key → emit move intent every 300ms
 * User spamming key → ignore duplicates within 300ms window
 *
 * **Test Requirement:**
 * User holds 'A' for 1000ms → expect 3-4 MoveCommands emitted
 * (approximately 1000ms / 300ms = 3.33 intents)
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Intent to move in a direction
 * emitted by useMoveOrchestrator
 * consumed by useGameEngine
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
    /** Is a move animation currently playing */
    isAnimatingMove: boolean;
}

/**
 * Move input orchestrator with throttling
 *
 * @param deps Configuration and callbacks
 * @returns Object with keyboard event handlers
 *
 * @remarks
 * **Throttle Mechanism:**
 * Tracks lastMoveTime. If current time - lastMoveTime < animationDurationMs,
 * input is ignored. This simulates "wait for animation to finish" behavior.
 *
 * **Keyboard Support:**
 * Arrow keys: ARROWUP, ARROWDOWN, ARROWLEFT, ARROWRIGHT
 * WASD: W (north), A (west), S (south), D (east)
 * HJKL: H (west), J (south), K (north), L (east) [vim-style]
 *
 * **No Queue Ownership:**
 * This hook ONLY emits intents via onMoveIntent callback.
 * useGameEngine receives intent → manages queue.
 * This separation prevents this hook from growing beyond 200 lines.
 */
export function useMoveOrchestrator(deps: UseMoveOrchestratorDeps) {
    const { animationDurationMs, onMoveIntent, isGameLocked, isAnimatingMove } =
        deps;

    // Track the last time a move command was emitted
    // (not when a move started; when we SENT the intent)
    const lastMoveTimeRef = useRef<number>(0);

    // Track which keys are currently pressed (for continuous movement)
    const keysPressed = useRef<Set<string>>(new Set());

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
     * Emit a move intent (called by keyboard handler)
     * Respects throttle and game state
     */
    const emitMoveIntent = useCallback(
        (direction: 'north' | 'south' | 'east' | 'west') => {
            // Respect game locks
            if (isGameLocked || isAnimatingMove) {
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
        [isGameLocked, isAnimatingMove, canEmitMove, onMoveIntent],
    );

    /**
     * Handle keyboard input
     * Maps keys to directions and calls emitMoveIntent
     */
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const key = e.key.toUpperCase();

            // Prevent default browser behavior for arrow keys
            if (['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT'].includes(key)) {
                e.preventDefault();
            }

            // Map keys to directions
            let direction: 'north' | 'south' | 'east' | 'west' | null = null;

            // Arrow keys
            if (key === 'ARROWUP') direction = 'north';
            else if (key === 'ARROWDOWN') direction = 'south';
            else if (key === 'ARROWLEFT') direction = 'west';
            else if (key === 'ARROWRIGHT') direction = 'east';
            // WASD
            else if (key === 'W') direction = 'north';
            else if (key === 'S') direction = 'south';
            else if (key === 'A') direction = 'west';
            else if (key === 'D') direction = 'east';
            // HJKL (vim style)
            else if (key === 'K') direction = 'north';
            else if (key === 'J') direction = 'south';
            else if (key === 'H') direction = 'west';
            else if (key === 'L') direction = 'east';

            if (direction) {
                keysPressed.current.add(key);
                emitMoveIntent(direction);
            }
        },
        [emitMoveIntent],
    );

    /**
     * Track key release (cleanup)
     */
    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        const key = e.key.toUpperCase();
        keysPressed.current.delete(key);
    }, []);

    /**
     * Attach keyboard listeners on mount
     * Remove on unmount
     */
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Return handlers for testing or programmatic usage
    return {
        emitMoveIntent,
        canEmitMove,
        keysPressed: keysPressed.current,
    };
}
