/**
 * @file src/core/usecases/__tests__/weather-simulation.test.ts
 * @description Tests for weather simulation functions
 *
 * @remarks
 * **Test Strategy:**
 * Focus on weather initialization, updates, forecasts, and normalization.
 * Tests the pure functions in weather-simulation.ts (no React context needed).
 */

import {
    buildWeatherData,
    updateWeatherEngineSync,
    getWeatherForecast,
    getCurrentWeatherCondition,
    normalizeWeatherCondition,
    simulateWeatherSync,
} from '../weather-simulation';
import { WeatherType, WeatherIntensity } from '@/core/types/weather';

describe('weatherSimulationSync - Weather Simulation Functions', () => {
    const mockGameState = {
        currentSeason: 'spring',
        worldProfile: { biomeType: 'grassland' },
    };

    const createMockWeatherEngineRef = () => ({
        current: {
            update: jest.fn(),
            getCurrentCondition: jest.fn().mockReturnValue({
                type: WeatherType.CLEAR,
                intensity: WeatherIntensity.NORMAL,
                temperature: 22,
            }),
            getForecast: jest.fn().mockReturnValue([]),
            getWeatherMessages: jest.fn().mockReturnValue([]),
        },
    });

    describe('buildWeatherData', () => {
        it('should create weather data map with all types', () => {
            const weatherData = buildWeatherData();

            expect(weatherData.size).toBe(8);
            expect(weatherData.has(WeatherType.CLEAR)).toBe(true);
            expect(weatherData.has(WeatherType.CLOUDY)).toBe(true);
            expect(weatherData.has(WeatherType.RAIN)).toBe(true);
            expect(weatherData.has(WeatherType.SNOW)).toBe(true);
            expect(weatherData.has(WeatherType.WIND)).toBe(true);
            expect(weatherData.has(WeatherType.STORM)).toBe(true);
            expect(weatherData.has(WeatherType.FOG)).toBe(true);
            expect(weatherData.has(WeatherType.HEATWAVE)).toBe(true);
        });

        it('should have realistic temperature values', () => {
            const weatherData = buildWeatherData();

            expect(weatherData.get(WeatherType.CLEAR)?.temperature).toBe(22);
            expect(weatherData.get(WeatherType.RAIN)?.temperature).toBe(17);
            expect(weatherData.get(WeatherType.SNOW)?.temperature).toBe(0);
            expect(weatherData.get(WeatherType.HEATWAVE)?.temperature).toBe(35);
        });

        it('should have appropriate wind speeds', () => {
            const weatherData = buildWeatherData();

            expect(weatherData.get(WeatherType.CLEAR)?.windSpeed).toBe(10);
            expect(weatherData.get(WeatherType.STORM)?.windSpeed).toBe(40);
            expect(weatherData.get(WeatherType.FOG)?.windSpeed).toBe(5);
        });

        it('should have realistic visibility values', () => {
            const weatherData = buildWeatherData();

            expect(weatherData.get(WeatherType.CLEAR)?.visibility).toBe(100);
            expect(weatherData.get(WeatherType.FOG)?.visibility).toBe(30);
            expect(weatherData.get(WeatherType.STORM)?.visibility).toBe(40);
        });

        it('should have precipitation by condition', () => {
            const weatherData = buildWeatherData();

            expect(weatherData.get(WeatherType.RAIN)?.precipitation).toBe(50);
            expect(weatherData.get(WeatherType.SNOW)?.precipitation).toBe(30);
            expect(weatherData.get(WeatherType.CLEAR)?.precipitation).toBe(0);
        });
    });

    describe('updateWeatherEngineSync', () => {
        it('should call engine update with game time', () => {
            const engineRef = createMockWeatherEngineRef();

            updateWeatherEngineSync(engineRef, 360, mockGameState);

            expect(engineRef.current.update).toHaveBeenCalledWith(360);
        });

        it('should return weather messages from engine', () => {
            const messages = [{ text: 'Weather changed', type: 'system' }];
            const engineRef = createMockWeatherEngineRef();
            engineRef.current.getWeatherMessages.mockReturnValue(messages);

            const result = updateWeatherEngineSync(engineRef, 360, mockGameState);

            expect(result).toEqual(messages);
        });

        it('should handle missing update method gracefully', () => {
            const engineRef = {
                current: {
                    update: undefined,
                    getWeatherMessages: jest.fn().mockReturnValue([]),
                },
            };

            expect(() => updateWeatherEngineSync(engineRef, 360, mockGameState)).not.toThrow();
        });

        it('should handle null engine ref gracefully', () => {
            const engineRef = { current: null };

            const result = updateWeatherEngineSync(engineRef, 360, mockGameState);

            expect(result).toEqual([]);
        });

        it('should return empty array if no messages method', () => {
            const engineRef = {
                current: {
                    update: jest.fn(),
                    getWeatherMessages: undefined,
                },
            };

            const result = updateWeatherEngineSync(engineRef, 360, mockGameState);

            expect(result).toEqual([]);
        });
    });

    describe('getWeatherForecast', () => {
        it('should request forecast from engine', () => {
            const engineRef = createMockWeatherEngineRef();

            getWeatherForecast(engineRef, 5);

            expect(engineRef.current.getForecast).toHaveBeenCalledWith(5);
        });

        it('should return forecast array', () => {
            const forecast = [
                { type: WeatherType.CLEAR, temperature: 22, windSpeed: 10, precipitation: 0, cloudCover: 0, visibility: 100, intensity: WeatherIntensity.NORMAL, duration: 3600, effects: [], transitions: [] },
                { type: WeatherType.CLOUDY, temperature: 20, windSpeed: 15, precipitation: 0, cloudCover: 60, visibility: 80, intensity: WeatherIntensity.NORMAL, duration: 3600, effects: [], transitions: [] },
            ];
            const engineRef = createMockWeatherEngineRef();
            engineRef.current.getForecast.mockReturnValue(forecast);

            const result = getWeatherForecast(engineRef, 2);

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0].type).toBe(WeatherType.CLEAR);
            expect(result[1].type).toBe(WeatherType.CLOUDY);
        });

        it('should default to 5 turns if not specified', () => {
            const engineRef = createMockWeatherEngineRef();

            getWeatherForecast(engineRef);

            expect(engineRef.current.getForecast).toHaveBeenCalledWith(5);
        });

        it('should return empty array if engine unavailable', () => {
            const engineRef = { current: null };

            const result = getWeatherForecast(engineRef, 5);

            expect(result).toEqual([]);
        });

        it('should handle engine errors gracefully', () => {
            const engineRef = {
                current: {
                    getForecast: jest.fn().mockImplementation(() => {
                        throw new Error('Engine error');
                    }),
                },
            };

            expect(() => getWeatherForecast(engineRef, 5)).not.toThrow();
        });
    });

    describe('getCurrentWeatherCondition', () => {
        it('should return current condition from engine', () => {
            const condition = {
                type: WeatherType.RAIN,
                temperature: 17,
                windSpeed: 20,
            };
            const engineRef = createMockWeatherEngineRef();
            engineRef.current.getCurrentCondition.mockReturnValue(condition);

            const result = getCurrentWeatherCondition(engineRef);

            expect(result.type).toBe(WeatherType.RAIN);
        });

        it('should return default clear weather if engine unavailable', () => {
            const engineRef = { current: null };

            const result = getCurrentWeatherCondition(engineRef);

            expect(result.type).toBe(WeatherType.CLEAR);
            expect(result.temperature).toBe(22);
        });

        it('should normalize returned condition', () => {
            const condition = {
                type: WeatherType.RAIN,
                temperature: 100, // Invalid
                windSpeed: 200, // Invalid
            };
            const engineRef = createMockWeatherEngineRef();
            engineRef.current.getCurrentCondition.mockReturnValue(condition);

            const result = getCurrentWeatherCondition(engineRef);

            expect(result.temperature).toBe(50); // Clamped to max
            expect(result.windSpeed).toBe(100); // Clamped to max
        });
    });

    describe('normalizeWeatherCondition', () => {
        it('should clamp temperature to valid range', () => {
            const result = normalizeWeatherCondition({ temperature: 100 });

            expect(result.temperature).toBe(50);
        });

        it('should clamp temperature from below', () => {
            const result = normalizeWeatherCondition({ temperature: -100 });

            expect(result.temperature).toBe(-50);
        });

        it('should clamp wind speed to 0-100', () => {
            const result = normalizeWeatherCondition({ windSpeed: 200 });

            expect(result.windSpeed).toBe(100);
        });

        it('should clamp precipitation to 0-100', () => {
            const result = normalizeWeatherCondition({ precipitation: 150 });

            expect(result.precipitation).toBe(100);
        });

        it('should clamp cloud cover to 0-100', () => {
            const result = normalizeWeatherCondition({ cloudCover: 150 });

            expect(result.cloudCover).toBe(100);
        });

        it('should clamp visibility to 0-100', () => {
            const result = normalizeWeatherCondition({ visibility: 150 });

            expect(result.visibility).toBe(100);
        });

        it('should provide sensible defaults', () => {
            const result = normalizeWeatherCondition({});

            expect(result.type).toBe(WeatherType.CLEAR);
            expect(result.intensity).toBe(WeatherIntensity.NORMAL);
            expect(result.temperature).toBe(22);
            expect(result.windSpeed).toBe(10);
        });

        it('should handle effects array', () => {
            const result = normalizeWeatherCondition({
                effects: [{ type: 'cold' }],
            });

            expect(Array.isArray(result.effects)).toBe(true);
        });

        it('should handle missing effects gracefully', () => {
            const result = normalizeWeatherCondition({ effects: null });

            expect(result.effects).toEqual([]);
        });
    });

    describe('simulateWeatherSync - Full Cycle', () => {
        it('should return weather simulation result', () => {
            const engineRef = createMockWeatherEngineRef();

            const result = simulateWeatherSync(engineRef, 360, mockGameState);

            expect(result.currentCondition).toBeDefined();
            expect(result.forecast).toBeDefined();
            expect(result.weatherMessages).toBeDefined();
            expect(Array.isArray(result.weatherMessages)).toBe(true);
        });

        it('should update engine and collect messages', () => {
            const messages = [{ text: 'Storm incoming', type: 'system' }];
            const engineRef = createMockWeatherEngineRef();
            engineRef.current.getWeatherMessages.mockReturnValue(messages);

            const result = simulateWeatherSync(engineRef, 360, mockGameState);

            expect(result.weatherMessages).toEqual(messages);
            expect(engineRef.current.update).toHaveBeenCalledWith(360);
        });

        it('should get forecast and current condition', () => {
            const forecast = [
                { type: WeatherType.CLEAR, temperature: 22, windSpeed: 10, precipitation: 0, cloudCover: 0, visibility: 100, intensity: WeatherIntensity.NORMAL, duration: 3600, effects: [], transitions: [] },
                { type: WeatherType.CLOUDY, temperature: 20, windSpeed: 15, precipitation: 0, cloudCover: 60, visibility: 80, intensity: WeatherIntensity.NORMAL, duration: 3600, effects: [], transitions: [] },
            ];
            const condition = { type: WeatherType.RAIN, temperature: 17 };
            const engineRef = createMockWeatherEngineRef();
            engineRef.current.getForecast.mockReturnValue(forecast);
            engineRef.current.getCurrentCondition.mockReturnValue(condition);

            const result = simulateWeatherSync(engineRef, 360, mockGameState);

            // Forecast should be normalized
            expect(result.forecast).toBeDefined();
            expect(Array.isArray(result.forecast)).toBe(true);
            expect(result.currentCondition.type).toBe(WeatherType.RAIN);
        });

        it('should handle missing engine gracefully', () => {
            const engineRef = { current: null };

            const result = simulateWeatherSync(engineRef, 360, mockGameState);

            expect(result).toBeDefined();
            expect(result.currentCondition.type).toBe(WeatherType.CLEAR);
            expect(result.forecast).toEqual([]);
            expect(result.weatherMessages).toEqual([]);
        });
    });

    describe('Weather Data Consistency', () => {
        it('should have non-negative durations', () => {
            const weatherData = buildWeatherData();

            for (const [, condition] of weatherData) {
                expect(condition.duration).toBeGreaterThanOrEqual(0);
            }
        });

        it('should have empty effects arrays', () => {
            const weatherData = buildWeatherData();

            for (const [, condition] of weatherData) {
                expect(Array.isArray(condition.effects)).toBe(true);
                expect(condition.effects.length).toBe(0);
            }
        });

        it('should have valid temperature ranges', () => {
            const weatherData = buildWeatherData();

            for (const [, condition] of weatherData) {
                expect(condition.temperature).toBeGreaterThanOrEqual(-50);
                expect(condition.temperature).toBeLessThanOrEqual(50);
            }
        });

        it('should have valid wind speeds', () => {
            const weatherData = buildWeatherData();

            for (const [, condition] of weatherData) {
                expect(condition.windSpeed).toBeGreaterThanOrEqual(0);
                expect(condition.windSpeed).toBeLessThanOrEqual(100);
            }
        });

        it('should have valid visibility', () => {
            const weatherData = buildWeatherData();

            for (const [, condition] of weatherData) {
                expect(condition.visibility).toBeGreaterThanOrEqual(0);
                expect(condition.visibility).toBeLessThanOrEqual(100);
            }
        });
    });

    describe('Edge Cases - NaN/Infinity Handling', () => {
        it('should normalize NaN temperature to safe default', () => {
            const result = normalizeWeatherCondition({ temperature: NaN });

            expect(result.temperature).toBe(-50); // Minimum safe value
            expect(Number.isFinite(result.temperature)).toBe(true);
        });

        it('should normalize Infinity temperature', () => {
            const result = normalizeWeatherCondition({ temperature: Infinity });

            expect(result.temperature).toBe(50); // Maximum safe value
            expect(Number.isFinite(result.temperature)).toBe(true);
        });

        it('should normalize -Infinity temperature', () => {
            const result = normalizeWeatherCondition({ temperature: -Infinity });

            expect(result.temperature).toBe(-50);
            expect(Number.isFinite(result.temperature)).toBe(true);
        });

        it('should normalize multiple invalid numeric values', () => {
            const invalidValues = [NaN, Infinity, -Infinity, 9999, -9999];

            invalidValues.forEach((val) => {
                const result = normalizeWeatherCondition({
                    temperature: val,
                    windSpeed: val,
                    precipitation: val,
                });

                expect(Number.isFinite(result.temperature)).toBe(true);
                expect(Number.isFinite(result.windSpeed)).toBe(true);
                expect(Number.isFinite(result.precipitation)).toBe(true);

                expect(result.temperature).toBeGreaterThanOrEqual(-50);
                expect(result.temperature).toBeLessThanOrEqual(50);
                expect(result.windSpeed).toBeGreaterThanOrEqual(0);
                expect(result.windSpeed).toBeLessThanOrEqual(100);
            });
        });
    });

    describe('Edge Cases - Large Arrays/Memory Bombs', () => {
        it('should truncate excessive forecast arrays', () => {
            const hugeArray = Array.from({ length: 500 }, (_, i) => ({
                type: WeatherType.CLEAR,
                temperature: 22,
            }));

            const engineRef = {
                current: {
                    getForecast: jest.fn().mockReturnValue(hugeArray),
                },
            };

            const result = getWeatherForecast(engineRef, 500);

            expect(result.length).toBeLessThanOrEqual(100);
        });

        it('should handle forecast with 1,000,000 items', () => {
            const engineRef = {
                current: {
                    getForecast: jest.fn().mockReturnValue(
                        Array.from({ length: 1000000 }, () => ({
                            type: WeatherType.CLEAR,
                        })),
                    ),
                },
            };

            const result = getWeatherForecast(engineRef, 1000000);

            expect(result.length).toBeLessThanOrEqual(100);
            expect(() => getWeatherForecast(engineRef, 1000000)).not.toThrow();
        });

        it('should limit weather messages from engine update', () => {
            const hugeMessageArray = Array.from({ length: 2000 }, (_, i) => ({
                text: `Weather message ${i}`,
                type: 'system',
            }));

            const engineRef = {
                current: {
                    update: jest.fn(),
                    getWeatherMessages: jest.fn().mockReturnValue(hugeMessageArray),
                },
            };

            const result = updateWeatherEngineSync(engineRef, 360);

            expect(result.length).toBeLessThanOrEqual(500);
        });
    });

    describe('Deep Clone Safety', () => {
        it('should not allow mutations of returned condition to affect engine', () => {
            const originalCondition = {
                type: WeatherType.CLEAR,
                temperature: 22,
                windSpeed: 10,
                transitions: [{ from: WeatherType.CLEAR, to: WeatherType.CLOUDY }],
            };

            const engineRef = {
                current: {
                    getCurrentCondition: jest.fn().mockReturnValue(originalCondition),
                },
            };

            const returned = getCurrentWeatherCondition(engineRef);
            // Mutate returned value
            returned.temperature = 999;
            if (returned.transitions) {
                returned.transitions[0] = { from: WeatherType.STORM, to: WeatherType.SNOW } as any;
            }

            // Original should be unchanged
            expect(originalCondition.temperature).toBe(22);
            expect(originalCondition.transitions[0].from).toBe(WeatherType.CLEAR);
        });
    });

    describe('Save Game Compatibility - Corrupted Data', () => {
        it('should handle weather save with corrupt temperature range', () => {
            const corruptedSave = {
                type: WeatherType.RAIN,
                temperature: 9999,
                windSpeed: -100,
                precipitation: 150,
                visibility: -50,
            };

            const normalized = normalizeWeatherCondition(corruptedSave);

            expect(normalized.temperature).toBeGreaterThanOrEqual(-50);
            expect(normalized.temperature).toBeLessThanOrEqual(50);
            expect(normalized.windSpeed).toBeGreaterThanOrEqual(0);
            expect(normalized.precipitation).toBeGreaterThanOrEqual(0);
            expect(normalized.precipitation).toBeLessThanOrEqual(100);
            expect(normalized.visibility).toBeGreaterThanOrEqual(0);
        });

        it('should handle save with missing fields', () => {
            const incompleteSave = {
                type: WeatherType.FOG,
                // Missing temperature, windSpeed, precipitation, etc.
            };

            const normalized = normalizeWeatherCondition(incompleteSave);

            expect(normalized.temperature).toBeDefined();
            expect(normalized.windSpeed).toBeDefined();
            expect(normalized.precipitation).toBeDefined();
            expect(normalized.cloudCover).toBeDefined();
            expect(normalized.visibility).toBeDefined();
        });
    });
});
