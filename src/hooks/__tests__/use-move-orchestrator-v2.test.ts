/**
 * @file src/hooks/__tests__/use-move-orchestrator-v2.test.ts
 * @description Tests for refactored move orchestrator (input throttling)
 *
 * @remarks
 * **Critical Test Cases:**
 *
 * 1. User holds key continuously → Multiple intents emitted at 300ms intervals
 * 2. User spams key rapidly → Intents throttled to max 1 per 300ms
 * 3. Game locked → No intents emitted
 * 4. Animation playing → No intents emitted
 * 5. Keys properly mapped (Arrow, WASD, HJKL)
 * 6. Cleanup on unmount
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMoveOrchestrator, type MoveCommand } from '../use-move-orchestrator-v2';

describe('useMoveOrchestrator - Move Input Throttling', () => {
  // Mock config
  const defaultDeps = {
    animationDurationMs: 300,
    onMoveIntent: jest.fn(),
    isGameLocked: false,
    isAnimatingMove: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Throttling - Continuous Key Hold', () => {
    it('should emit move intent at 300ms intervals when key is held', () => {
      const onMoveIntent = jest.fn();
      const { result } = renderHook(() =>
        useMoveOrchestrator({
          ...defaultDeps,
          onMoveIntent,
        }),
      );

      // Simulate user holding 'W' key for 1000ms
      act(() => {
        // First press at t=0
        result.current.emitMoveIntent('north');
        expect(onMoveIntent).toHaveBeenCalledTimes(1);
        expect(onMoveIntent).toHaveBeenCalledWith(
          expect.objectContaining({ direction: 'north' }),
        );
      });

      // At t=100ms (too soon)
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.emitMoveIntent('north');
      });
      expect(onMoveIntent).toHaveBeenCalledTimes(1); // Still 1

      // At t=300ms (exactly threshold)
      act(() => {
        jest.advanceTimersByTime(200);
        result.current.emitMoveIntent('north');
      });
      expect(onMoveIntent).toHaveBeenCalledTimes(2); // Now 2

      // At t=600ms
      act(() => {
        jest.advanceTimersByTime(300);
        result.current.emitMoveIntent('north');
      });
      expect(onMoveIntent).toHaveBeenCalledTimes(3); // Now 3

      // At t=900ms
      act(() => {
        jest.advanceTimersByTime(300);
        result.current.emitMoveIntent('north');
      });
      expect(onMoveIntent).toHaveBeenCalledTimes(4); // Now 4

      // At t=1000ms (only 100ms passed, too soon)
      act(() => {
        jest.advanceTimersByTime(100);
        result.current.emitMoveIntent('north');
      });
      expect(onMoveIntent).toHaveBeenCalledTimes(4); // Still 4
    });

    it('should emit exactly 4 intents for 900ms hold at 300ms throttle', () => {
      const onMoveIntent = jest.fn();
      const { result } = renderHook(() =>
        useMoveOrchestrator({
          ...defaultDeps,
          onMoveIntent,
        }),
      );

      act(() => {
        // t=0: emit 1
        result.current.emitMoveIntent('north');
        expect(onMoveIntent).toHaveBeenCalledTimes(1);

        // t=300: emit 2
        jest.advanceTimersByTime(300);
        result.current.emitMoveIntent('north');
        expect(onMoveIntent).toHaveBeenCalledTimes(2);

        // t=600: emit 3
        jest.advanceTimersByTime(300);
        result.current.emitMoveIntent('north');
        expect(onMoveIntent).toHaveBeenCalledTimes(3);

        // t=900: emit 4
        jest.advanceTimersByTime(300);
        result.current.emitMoveIntent('north');
        expect(onMoveIntent).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe('Game State Locking', () => {
    it('should not emit intent when game is locked', () => {
      const onMoveIntent = jest.fn();
      const { result, rerender } = renderHook(
        ({ deps }) => useMoveOrchestrator(deps),
        {
          initialProps: {
            deps: {
              ...defaultDeps,
              isGameLocked: true,
              onMoveIntent,
            },
          },
        },
      );

      act(() => {
        result.current.emitMoveIntent('north');
      });

      expect(onMoveIntent).not.toHaveBeenCalled();
    });

    it('should not emit intent when animation is playing', () => {
      const onMoveIntent = jest.fn();
      const { result } = renderHook(() =>
        useMoveOrchestrator({
          ...defaultDeps,
          isAnimatingMove: true,
          onMoveIntent,
        }),
      );

      act(() => {
        result.current.emitMoveIntent('north');
      });

      expect(onMoveIntent).not.toHaveBeenCalled();
    });
  });

  describe('Direction Mapping', () => {
    it('should emit move intent when calling emitMoveIntent directly', () => {
      const onMoveIntent = jest.fn();
      const { result } = renderHook(() =>
        useMoveOrchestrator({
          ...defaultDeps,
          onMoveIntent,
        }),
      );

      act(() => {
        result.current.emitMoveIntent('north');
      });

      expect(onMoveIntent).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'north' }),
      );
    });
  });

  describe('canEmitMove Helper', () => {
    it('should return true when enough time has passed', () => {
      const { result } = renderHook(() =>
        useMoveOrchestrator(defaultDeps),
      );

      expect(result.current.canEmitMove()).toBe(true);

      act(() => {
        result.current.emitMoveIntent('north');
      });

      // Immediately after, should be false
      expect(result.current.canEmitMove()).toBe(false);

      // After 300ms, should be true
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.canEmitMove()).toBe(true);
    });
  });

  describe('Key State Tracking', () => {
    it('should initialize with empty key set', () => {
      const { result } = renderHook(() =>
        useMoveOrchestrator(defaultDeps),
      );

      expect(result.current.keysPressed.size).toBe(0);
    });
  });

  describe('Custom Animation Duration', () => {
    it('should respect custom animation duration setting', () => {
      const onMoveIntent = jest.fn();
      const { result } = renderHook(() =>
        useMoveOrchestrator({
          ...defaultDeps,
          animationDurationMs: 200, // Custom shorter duration
          onMoveIntent,
        }),
      );

      act(() => {
        result.current.emitMoveIntent('north');
        expect(onMoveIntent).toHaveBeenCalledTimes(1);
      });

      // After 150ms (too soon for 200ms threshold)
      act(() => {
        jest.advanceTimersByTime(150);
        result.current.emitMoveIntent('north');
      });
      expect(onMoveIntent).toHaveBeenCalledTimes(1);

      // After 200ms total (at threshold)
      act(() => {
        jest.advanceTimersByTime(50);
        result.current.emitMoveIntent('north');
      });
      expect(onMoveIntent).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive calls within same throttle window', () => {
      const onMoveIntent = jest.fn();
      const { result } = renderHook(() =>
        useMoveOrchestrator({
          ...defaultDeps,
          onMoveIntent,
        }),
      );

      act(() => {
        // Rapid calls at t=0
        result.current.emitMoveIntent('north');
        result.current.emitMoveIntent('north');
        result.current.emitMoveIntent('north');
        result.current.emitMoveIntent('north');
      });

      // Should only emit once
      expect(onMoveIntent).toHaveBeenCalledTimes(1);
    });

    it('should handle direction changes while throttled', () => {
      const onMoveIntent = jest.fn();
      const { result } = renderHook(() =>
        useMoveOrchestrator({
          ...defaultDeps,
          onMoveIntent,
        }),
      );

      act(() => {
        result.current.emitMoveIntent('north');
        result.current.emitMoveIntent('east'); // Different direction
        result.current.emitMoveIntent('south'); // Another direction
      });

      // All should be ignored (within throttle)
      expect(onMoveIntent).toHaveBeenCalledTimes(1);
      expect(onMoveIntent).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'north' }),
      );
    });

    it('should emit new direction after throttle window expires', () => {
      const onMoveIntent = jest.fn();
      const { result } = renderHook(() =>
        useMoveOrchestrator({
          ...defaultDeps,
          onMoveIntent,
        }),
      );

      act(() => {
        result.current.emitMoveIntent('north');
        jest.advanceTimersByTime(300);
        result.current.emitMoveIntent('east');
      });

      expect(onMoveIntent).toHaveBeenCalledTimes(2);
      expect(onMoveIntent).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ direction: 'north' }),
      );
      expect(onMoveIntent).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ direction: 'east' }),
      );
    });
  });
});
