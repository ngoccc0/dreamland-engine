/**
 * @file src/core/events/__tests__/GameEvents.test.ts
 * @description Unit tests for global event emitter
 */

import { GameEvents, type EventType } from '../GameEvents';

describe('GameEvents - Global Event Bus', () => {
    beforeEach(() => {
        // Clear all subscribers before each test to prevent cross-contamination
        GameEvents.clear();
    });

    describe('subscribe & emit', () => {
        it('should call callback when event is emitted', () => {
            const callback = jest.fn();

            GameEvents.subscribe('LEVEL_UP', callback);
            GameEvents.emit('LEVEL_UP', {
                character: { id: '1', name: 'Player' },
                newLevel: 6,
                statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
            });

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    newLevel: 6,
                }),
            );
        });

        it('should handle multiple subscribers on same event', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            GameEvents.subscribe('LEVEL_UP', callback1);
            GameEvents.subscribe('LEVEL_UP', callback2);

            GameEvents.emit('LEVEL_UP', {
                character: { id: '1', name: 'Player' },
                newLevel: 6,
                statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
            });

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should not call other event type subscribers', () => {
            const levelUpCallback = jest.fn();
            const achievementCallback = jest.fn();

            GameEvents.subscribe('LEVEL_UP', levelUpCallback);
            GameEvents.subscribe('ACHIEVEMENT_UNLOCKED', achievementCallback);

            GameEvents.emit('LEVEL_UP', {
                character: { id: '1', name: 'Player' },
                newLevel: 6,
                statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
            });

            expect(levelUpCallback).toHaveBeenCalledTimes(1);
            expect(achievementCallback).toHaveBeenCalledTimes(0);
        });
    });

    describe('unsubscribe', () => {
        it('should remove listener when returned unsubscribe is called', () => {
            const callback = jest.fn();

            const unsubscribe = GameEvents.subscribe('LEVEL_UP', callback);

            GameEvents.emit('LEVEL_UP', {
                character: { id: '1', name: 'Player' },
                newLevel: 6,
                statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
            });

            expect(callback).toHaveBeenCalledTimes(1);

            // Unsubscribe and emit again
            unsubscribe();
            GameEvents.emit('LEVEL_UP', {
                character: { id: '1', name: 'Player' },
                newLevel: 7,
                statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
            });

            // Should still be 1 call (not called a second time)
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should support unsubscribe(eventType, callback) pattern', () => {
            const callback = jest.fn();

            GameEvents.subscribe('LEVEL_UP', callback);
            GameEvents.emit('LEVEL_UP', {
                character: { id: '1', name: 'Player' },
                newLevel: 6,
                statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
            });

            expect(callback).toHaveBeenCalledTimes(1);

            // Unsubscribe using explicit call
            GameEvents.unsubscribe('LEVEL_UP', callback);
            GameEvents.emit('LEVEL_UP', {
                character: { id: '1', name: 'Player' },
                newLevel: 7,
                statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
            });

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('React Strict Mode safety (no duplicate listeners)', () => {
        it('should not create duplicate listeners when component mounts twice', () => {
            const callback = jest.fn();

            // Simulate React Strict Mode mount/unmount/mount cycle
            const unsubscribe1 = GameEvents.subscribe('LEVEL_UP', callback);
            unsubscribe1();

            const unsubscribe2 = GameEvents.subscribe('LEVEL_UP', callback);

            // Emit once
            GameEvents.emit('LEVEL_UP', {
                character: { id: '1', name: 'Player' },
                newLevel: 6,
                statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
            });

            // Should only be called once, not twice
            expect(callback).toHaveBeenCalledTimes(1);

            unsubscribe2();
        });
    });

    describe('error handling', () => {
        it('should catch subscriber errors and continue with next subscriber', () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Subscriber error');
            });
            const normalCallback = jest.fn();

            GameEvents.subscribe('LEVEL_UP', errorCallback);
            GameEvents.subscribe('LEVEL_UP', normalCallback);

            // Should not throw even if first subscriber errors
            expect(() => {
                GameEvents.emit('LEVEL_UP', {
                    character: { id: '1', name: 'Player' },
                    newLevel: 6,
                    statBonus: { maxHealth: 10, skillPoints: 1, statPoints: 1 },
                });
            }).not.toThrow();

            expect(errorCallback).toHaveBeenCalledTimes(1);
            expect(normalCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSubscriberCount', () => {
        it('should return correct subscriber count', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            expect(GameEvents.getSubscriberCount('LEVEL_UP')).toBe(0);

            GameEvents.subscribe('LEVEL_UP', callback1);
            expect(GameEvents.getSubscriberCount('LEVEL_UP')).toBe(1);

            GameEvents.subscribe('LEVEL_UP', callback2);
            expect(GameEvents.getSubscriberCount('LEVEL_UP')).toBe(2);

            GameEvents.unsubscribe('LEVEL_UP', callback1);
            expect(GameEvents.getSubscriberCount('LEVEL_UP')).toBe(1);

            GameEvents.unsubscribe('LEVEL_UP', callback2);
            expect(GameEvents.getSubscriberCount('LEVEL_UP')).toBe(0);
        });
    });

    describe('clear', () => {
        it('should remove all subscribers', () => {
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            GameEvents.subscribe('LEVEL_UP', callback1);
            GameEvents.subscribe('ACHIEVEMENT_UNLOCKED', callback2);

            expect(GameEvents.getSubscriberCount('LEVEL_UP')).toBe(1);
            expect(GameEvents.getSubscriberCount('ACHIEVEMENT_UNLOCKED')).toBe(1);

            GameEvents.clear();

            expect(GameEvents.getSubscriberCount('LEVEL_UP')).toBe(0);
            expect(GameEvents.getSubscriberCount('ACHIEVEMENT_UNLOCKED')).toBe(0);
        });
    });

    describe('type safety', () => {
        it('should have correct event type inference', () => {
            const callback = jest.fn();

            // This should type-check correctly
            GameEvents.subscribe('CREATURE_DIED', callback);

            GameEvents.emit('CREATURE_DIED', {
                creatureId: '123',
                creatureName: 'Goblin',
                killedBy: 'Player',
            });

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    creatureName: 'Goblin',
                }),
            );
        });
    });
});
