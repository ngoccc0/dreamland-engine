/**
 * Side Effects Integration Tests
 *
 * Verify that usecases generate correct side effects
 * and that the effect executor properly routes them.
 *
 * @remarks
 * Tests validate the complete effect pipeline:
 * 1. Usecase generates effects array
 * 2. Effect types are correct (discriminated union)
 * 3. Effect data is properly structured
 * 4. Executor can process all effect types without errors
 */

import {
    SideEffect,
    AudioEffect,
    NotificationEffect,
    ParticleEffect,
    SaveGameEffect,
    TriggerEventEffect,
} from '@/core/entities/side-effects';
import { executeEffect, executeEffects, EffectExecutorDeps } from '@/core/engines/effect-executor';

describe('Side Effects System Integration', () => {
    /**
     * Mock dependencies for testing effect execution
     */
    const createMockDeps = (): EffectExecutorDeps => ({
        audioService: {
            play: jest.fn(),
            stop: jest.fn(),
        },
        particleEngine: {
            spawn: jest.fn(),
        },
        notificationService: {
            show: jest.fn(),
        },
        saveManager: {
            save: jest.fn(),
        },
        eventBus: {
            emit: jest.fn(),
        },
        logger: {
            debug: jest.fn(),
        },
    });

    describe('Audio Effects', () => {
        it('should execute playAudio effect', () => {
            const deps = createMockDeps();
            const effect: AudioEffect = {
                type: 'playAudio',
                sound: 'test-sound',
                volume: 0.8,
                pitch: 1.0,
            };

            executeEffect(effect, deps);

            expect(deps.audioService?.play).toHaveBeenCalledWith('test-sound', 0.8, 1.0);
        });

        it('should handle missing audioService gracefully', () => {
            const deps: EffectExecutorDeps = {};
            const effect: AudioEffect = {
                type: 'playAudio',
                sound: 'test-sound',
            };

            // Should not throw
            expect(() => executeEffect(effect, deps)).not.toThrow();
        });
    });

    describe('Notification Effects', () => {
        it('should execute showNotification effect', () => {
            const deps = createMockDeps();
            const effect: NotificationEffect = {
                type: 'showNotification',
                message: 'Test message',
                duration: 3000,
                type_: 'success',
            };

            executeEffect(effect, deps);

            expect(deps.notificationService?.show).toHaveBeenCalledWith(
                'Test message',
                3000,
                'success'
            );
        });
    });

    describe('Particle Effects', () => {
        it('should execute spawnParticle effect', () => {
            const deps = createMockDeps();
            const effect: ParticleEffect = {
                type: 'spawnParticle',
                particleType: 'explosion',
                position: { x: 10, y: 20 },
                duration: 500,
                count: 10,
            };

            executeEffect(effect, deps);

            expect(deps.particleEngine?.spawn).toHaveBeenCalledWith('explosion', { x: 10, y: 20 }, {
                duration: 500,
                count: 10,
            });
        });
    });

    describe('Save Game Effects', () => {
        it('should execute saveGame effect', () => {
            const deps = createMockDeps();
            const timestamp = Date.now();
            const effect: SaveGameEffect = {
                type: 'saveGame',
                timestamp,
                reason: 'auto-save',
            };

            executeEffect(effect, deps);

            expect(deps.saveManager?.save).toHaveBeenCalledWith(timestamp, 'auto-save');
        });
    });

    describe('Event Effects', () => {
        it('should execute triggerEvent effect', () => {
            const deps = createMockDeps();
            const effect: TriggerEventEffect = {
                type: 'triggerEvent',
                eventName: 'test.event',
                data: { key: 'value' },
            };

            executeEffect(effect, deps);

            expect(deps.eventBus?.emit).toHaveBeenCalledWith('test.event', { key: 'value' });
        });
    });

    describe('Batch Execution', () => {
        it('should execute multiple effects in sequence', () => {
            const deps = createMockDeps();
            const effects: SideEffect[] = [
                {
                    type: 'playAudio',
                    sound: 'hit',
                },
                {
                    type: 'showNotification',
                    message: 'Damage dealt!',
                    type_: 'info',
                },
                {
                    type: 'spawnParticle',
                    particleType: 'blood',
                    position: { x: 5, y: 5 },
                },
            ];

            executeEffects(effects, deps);

            expect(deps.audioService?.play).toHaveBeenCalledWith('hit', undefined, undefined);
            expect(deps.notificationService?.show).toHaveBeenCalledWith('Damage dealt!', undefined, 'info');
            expect(deps.particleEngine?.spawn).toHaveBeenCalledWith('blood', { x: 5, y: 5 }, expect.any(Object));
        });

        it('should continue executing after error', () => {
            const deps: EffectExecutorDeps = {
                audioService: {
                    play: () => {
                        throw new Error('Audio service error');
                    },
                    stop: jest.fn(),
                },
                notificationService: {
                    show: jest.fn(),
                },
            };

            const effects: SideEffect[] = [
                {
                    type: 'playAudio',
                    sound: 'error',
                },
                {
                    type: 'showNotification',
                    message: 'Should still execute',
                },
            ];

            // Should not throw
            expect(() => executeEffects(effects, deps)).not.toThrow();

            // Second effect should still execute
            expect(deps.notificationService?.show).toHaveBeenCalledWith('Should still execute', undefined, undefined);
        });
    });

    describe('Type Safety', () => {
        it('should maintain discriminated union type safety', () => {
            const deps = createMockDeps();

            // This should compile - type system ensures all properties match effect.type
            const audioEffect: SideEffect = {
                type: 'playAudio',
                sound: 'test',
                volume: 0.5,
            };

            const notificationEffect: SideEffect = {
                type: 'showNotification',
                message: 'Test',
                type_: 'success',
            };

            executeEffect(audioEffect, deps);
            executeEffect(notificationEffect, deps);

            expect(deps.audioService?.play).toHaveBeenCalled();
            expect(deps.notificationService?.show).toHaveBeenCalled();
        });
    });
});
