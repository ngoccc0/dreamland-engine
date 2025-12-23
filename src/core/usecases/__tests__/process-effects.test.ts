/**
 * @file src/core/usecases/__tests__/process-effects.test.ts
 * @description Tests for pure effect processing functions
 *
 * @remarks
 * **Test Strategy:**
 * Tests the pure functions in process-effects.ts (no React context needed).
 * These functions handle all the business logic for effect application.
 *
 * **Critical Test Cases:**
 * 1. Tick effects applied correctly
 * 2. Weather effects applied correctly
 * 3. Combined effects apply atomically
 * 4. Immutability verified
 * 5. Error handling graceful
 */

import {
    processAllEffectsSync,
    processTickEffectsSync,
    processWeatherEffectsSync,
} from '../process-effects';
import { WeatherEngine } from '@/core/engines/weather-engine';
import { EffectEngine } from '@/core/engines/effect-engine';
import { createDefaultPlayerStats, ensurePlayerStats } from '@/core/factories/statistics-factory';
import { defaultGameConfig } from '@/lib/config/game-config';
import { WeatherType, WeatherIntensity } from '@/core/types/weather';
import type { PlayerStatusDefinition } from '@/core/types/game';

// Shared test fixtures
const mockPlayerStats: PlayerStatusDefinition = (() => {
    const base = createDefaultPlayerStats();
    return {
        ...base,
        hp: 50,
        maxHp: 100,
        stamina: 100,
        maxStamina: 150,
        hunger: 50,
        thirst: 50,
    };
})();

const mockGameState = {
    world: null,
    playerPosition: { x: 0, y: 0 },
    currentSeason: 'spring',
};

const mockT = (key: string) => key; // Mock translation

// Create weather engine with required dependencies
const createMockWeatherEngineRef = () => {
    const effectEngine = new EffectEngine();
    const weatherData = new Map([
        [
            WeatherType.CLEAR,
            {
                type: WeatherType.CLEAR,
                intensity: WeatherIntensity.NORMAL,
                duration: 3600,
                effects: [],
                temperature: 22,
                windSpeed: 10,
                precipitation: 0,
                cloudCover: 0,
                visibility: 100,
                transitions: [],
            },
        ],
    ]);
    return {
        current: new WeatherEngine(effectEngine, weatherData),
    };
};

const createMockEffectEngineRef = () => ({
    current: new EffectEngine(),
});

describe('processEffectsSync - Pure Effect Functions', () => {

    describe('Immutability', () => {
        it('should not mutate original player stats', () => {
            const originalStats = JSON.stringify(mockPlayerStats);

            processAllEffectsSync(
                mockPlayerStats,
                mockGameState,
                0,
                defaultGameConfig,
                mockT,
                createMockWeatherEngineRef(),
                createMockEffectEngineRef(),
            );

            expect(JSON.stringify(mockPlayerStats)).toEqual(originalStats);
        });

        it('should return new stats object', () => {
            const result = processAllEffectsSync(
                mockPlayerStats,
                mockGameState,
                0,
                defaultGameConfig,
                mockT,
                createMockWeatherEngineRef(),
                createMockEffectEngineRef(),
            );

            expect(result.updatedStats).not.toBe(mockPlayerStats);
        });
    });

    describe('Tick Effects', () => {
        it('should process tick effects and return updated stats', () => {
            const result = processTickEffectsSync(
                mockPlayerStats,
                0,
                mockT,
                defaultGameConfig,
            );

            expect(result.updatedStats).toBeDefined();
            expect(result.tickMessages).toBeDefined();
            expect(Array.isArray(result.tickMessages)).toBe(true);
        });

        it('should return stats object with expected fields', () => {
            const result = processTickEffectsSync(
                mockPlayerStats,
                0,
                mockT,
                defaultGameConfig,
            );

            expect(result.updatedStats.hp).toBeDefined();
            expect(result.updatedStats.stamina).toBeDefined();
        });
    });

    describe('Weather Effects', () => {
        it('should handle missing world gracefully', () => {
            const result = processWeatherEffectsSync(
                mockPlayerStats,
                { ...mockGameState, world: null },
                createMockWeatherEngineRef(),
                createMockEffectEngineRef(),
            );

            expect(result.updatedStats).toBeDefined();
            expect(result.updatedStats).toEqual(mockPlayerStats);
        });

        it('should return weather messages array', () => {
            const result = processWeatherEffectsSync(
                mockPlayerStats,
                mockGameState,
                createMockWeatherEngineRef(),
                createMockEffectEngineRef(),
            );

            expect(Array.isArray(result.weatherMessages)).toBe(true);
        });

        it('should handle null engine refs gracefully', () => {
            const result = processWeatherEffectsSync(
                mockPlayerStats,
                mockGameState,
                { current: null },
                createMockEffectEngineRef(),
            );

            // Should return original stats when engine is unavailable
            expect(result.updatedStats).toEqual(mockPlayerStats);
        });

    });

    it('should preserve item list through effect application', () => {
        const statsWithItems = {
            ...mockPlayerStats,
            items: [{ name: 'sword', quantity: 1 }] as any,
        };

        const result = processAllEffectsSync(
            statsWithItems,
            mockGameState,
            0,
            defaultGameConfig,
            mockT,
            createMockWeatherEngineRef(),
            createMockEffectEngineRef(),
        );

        expect(result.updatedStats.items).toEqual(statsWithItems.items);
    });

    it('should return valid stat bounds after effects', () => {
        const result = processAllEffectsSync(
            mockPlayerStats,
            mockGameState,
            0,
            defaultGameConfig,
            mockT,
            createMockWeatherEngineRef(),
            createMockEffectEngineRef(),
        );

        // HP should be within reasonable bounds
        expect(result.updatedStats.hp).toBeGreaterThanOrEqual(0);
        expect(result.updatedStats.hp).toBeLessThanOrEqual(200);
    });
});

describe('Save Game Compatibility', () => {
    it('should work with minimal stat objects', () => {
        const minimalStats = ensurePlayerStats({
            hp: 75,
            stamina: 80,
            hunger: 40,
            thirst: 30,
        } as any);

        const result = processAllEffectsSync(
            minimalStats,
            mockGameState,
            0,
            defaultGameConfig,
            mockT,
            createMockWeatherEngineRef(),
            createMockEffectEngineRef(),
        );

        expect(result.updatedStats.hp).toBeDefined();
        expect(result.updatedStats.stamina).toBeDefined();
    });
});

describe('Error Handling', () => {
    it('should handle malformed game state gracefully', () => {
        const malformedState = {
            world: { getCellAt: null },
            playerPosition: null,
        };

        expect(() =>
            processAllEffectsSync(
                mockPlayerStats,
                malformedState,
                0,
                defaultGameConfig,
                mockT,
                createMockWeatherEngineRef(),
                createMockEffectEngineRef(),
            ),
        ).not.toThrow();
    });

    it('should return result even if weather fails', () => {
        const result = processAllEffectsSync(
            mockPlayerStats,
            mockGameState,
            0,
            defaultGameConfig,
            mockT,
            { current: null },
            { current: null },
        );

        expect(result.updatedStats).toBeDefined();
    });
});
