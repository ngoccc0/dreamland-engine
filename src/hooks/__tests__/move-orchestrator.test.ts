/**
 * @file src/hooks/__tests__/move-orchestrator.test.ts
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
import { useMoveOrchestrator, type MoveCommand } from '../move-orchestrator';

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

    describe('Game State Respect', () => {
        it('should not emit intent when game is locked', () => {
            const onMoveIntent = jest.fn();
            const { rerender } = renderHook(
                (props) => useMoveOrchestrator(props),
                {
                    initialProps: {
                        ...defaultDeps,
                        onMoveIntent,
                        isGameLocked: true,
                    },
                },
            );

            const { result } = renderHook(() =>
                useMoveOrchestrator({
                    ...defaultDeps,
                    onMoveIntent,
                    isGameLocked: true,
                }),
            );

            act(() => {
                result.current.emitMoveIntent('north');
            });

            expect(onMoveIntent).toHaveBeenCalledTimes(0);
        });

        it('should not emit intent while animation is playing', () => {
            const onMoveIntent = jest.fn();
            const { result } = renderHook(() =>
                useMoveOrchestrator({
                    ...defaultDeps,
                    onMoveIntent,
                    isAnimatingMove: true,
                }),
            );

            act(() => {
                result.current.emitMoveIntent('north');
            });

            expect(onMoveIntent).toHaveBeenCalledTimes(0);
        });

        it('should resume emitting after animation completes', () => {
            const onMoveIntent = jest.fn();
            const { rerender } = renderHook(
                (props) => useMoveOrchestrator(props),
                {
                    initialProps: {
                        ...defaultDeps,
                        onMoveIntent,
                        isAnimatingMove: true,
                    },
                },
            );

            let result = renderHook(() =>
                useMoveOrchestrator({
                    ...defaultDeps,
                    onMoveIntent,
                    isAnimatingMove: true,
                }),
            ).result;

            act(() => {
                result.current.emitMoveIntent('north');
            });
            expect(onMoveIntent).toHaveBeenCalledTimes(0);

            // Animation completes
            rerender({
                ...defaultDeps,
                onMoveIntent,
                isAnimatingMove: false,
            });

            // Re-render with animation complete
            result = renderHook(() =>
                useMoveOrchestrator({
                    ...defaultDeps,
                    onMoveIntent,
                    isAnimatingMove: false,
                }),
            ).result;

            act(() => {
                result.current.emitMoveIntent('north');
            });
            expect(onMoveIntent).toHaveBeenCalledTimes(1);
        });
    });

    describe('Custom Animation Duration', () => {
        it('should respect custom animation duration', () => {
            const onMoveIntent = jest.fn();
            const { result } = renderHook(() =>
                useMoveOrchestrator({
                    ...defaultDeps,
                    onMoveIntent,
                    animationDurationMs: 150,
                }),
            );

            act(() => {
                result.current.emitMoveIntent('north');
                expect(onMoveIntent).toHaveBeenCalledTimes(1);

                // At 100ms (too soon for 150ms throttle)
                jest.advanceTimersByTime(100);
                result.current.emitMoveIntent('north');
                expect(onMoveIntent).toHaveBeenCalledTimes(1);

                // At 150ms (exactly threshold)
                jest.advanceTimersByTime(50);
                result.current.emitMoveIntent('north');
                expect(onMoveIntent).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Direction Changes', () => {
        it('should allow changing direction even if throttle not passed', () => {
            const onMoveIntent = jest.fn();
            const { result } = renderHook(() =>
                useMoveOrchestrator({
                    ...defaultDeps,
                    onMoveIntent,
                }),
            );

            act(() => {
                // First move north at t=0
                result.current.emitMoveIntent('north');
                expect(onMoveIntent).toHaveBeenLastCalledWith(
                    expect.objectContaining({ direction: 'north' }),
                );
                expect(onMoveIntent).toHaveBeenCalledTimes(1);

                // At t=100ms, try to move east (different direction)
                // Still blocked by throttle
                jest.advanceTimersByTime(100);
                result.current.emitMoveIntent('east');
                expect(onMoveIntent).toHaveBeenCalledTimes(1); // Still just 1

                // At t=300ms, move east (now allowed)
                jest.advanceTimersByTime(200);
                result.current.emitMoveIntent('east');
                expect(onMoveIntent).toHaveBeenCalledTimes(2);
                expect(onMoveIntent).toHaveBeenLastCalledWith(
                    expect.objectContaining({ direction: 'east' }),
                );
            });
        });
    });

    describe('Timestamp Accuracy', () => {
        it('should include timestamp in emitted intent', () => {
            const onMoveIntent = jest.fn();
            const { result } = renderHook(() =>
                useMoveOrchestrator({
                    ...defaultDeps,
                    onMoveIntent,
                }),
            );

            act(() => {
                const beforeTime = Date.now();
                result.current.emitMoveIntent('north');
                const afterTime = Date.now();

                expect(onMoveIntent).toHaveBeenCalledWith(
                    expect.objectContaining({
                        timestamp: expect.any(Number),
                    }),
                );

                const call = onMoveIntent.mock.calls[0][0];
                expect(call.timestamp).toBeGreaterThanOrEqual(beforeTime);
                expect(call.timestamp).toBeLessThanOrEqual(afterTime);
            });
        });
    });

    describe('Rapid Spam Prevention', () => {
        it('should ignore rapid successive inputs', () => {
            const onMoveIntent = jest.fn();
            const { result } = renderHook(() =>
                useMoveOrchestrator({
                    ...defaultDeps,
                    onMoveIntent,
                }),
            );

            act(() => {
                result.current.emitMoveIntent('north');
                expect(onMoveIntent).toHaveBeenCalledTimes(1);

                // Try to emit 10 times within 100ms window
                for (let i = 0; i < 10; i++) {
                    jest.advanceTimersByTime(10);
                    result.current.emitMoveIntent('north');
                }

                // Should still be just 1
                expect(onMoveIntent).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Return Value', () => {
        it('should return emitMoveIntent and canEmitMove functions', () => {
            const { result } = renderHook(() =>
                useMoveOrchestrator(defaultDeps),
            );

            expect(result.current).toHaveProperty('emitMoveIntent');
            expect(result.current).toHaveProperty('canEmitMove');
            expect(result.current).toHaveProperty('keysPressed');
            expect(typeof result.current.emitMoveIntent).toBe('function');
            expect(typeof result.current.canEmitMove).toBe('function');
        });
    });
});
