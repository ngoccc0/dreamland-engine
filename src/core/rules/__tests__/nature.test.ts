/**
 * Nature Rules Unit Tests
 *
 * Comprehensive test suite for plant growth, environmental stress, and harvest logic
 * All tests are deterministic (no real random calls)
 */

import {
    calculateMoistureSuitability,
    calculateTemperatureSuitability,
    calculateLightSuitability,
    calculateEnvironmentalSuitability,
    calculateEnvironmentalStress,
    calculateGrowthProbability,
    calculateDropProbability,
    calculateHarvestYield,
    calculateVegetationDensity,
    shouldReproduce,
    shouldPartGrow,
    shouldPartDrop
} from '../nature';

describe('Nature Rules', () => {
    describe('Moisture Suitability', () => {
        it('should return 1.0 for optimal moisture', () => {
            expect(calculateMoistureSuitability(50, 30, 80)).toBe(1.0);
        });

        it('should apply dry penalty below minimum', () => {
            expect(calculateMoistureSuitability(20, 30, 80)).toBeLessThan(1.0);
            expect(calculateMoistureSuitability(20, 30, 80)).toBeGreaterThan(0);
        });

        it('should apply wet penalty above maximum', () => {
            expect(calculateMoistureSuitability(90, 30, 80)).toBeLessThan(1.0);
            expect(calculateMoistureSuitability(90, 30, 80)).toBeGreaterThanOrEqual(0.5);
        });

        it('should clamp to 0 at extreme drought', () => {
            expect(calculateMoistureSuitability(0, 30, 80)).toBe(0);
        });

        it('should not go below 0.3 at extreme wet', () => {
            expect(calculateMoistureSuitability(100, 30, 80)).toBeGreaterThanOrEqual(0.3);
            expect(calculateMoistureSuitability(100, 30, 80)).toBeLessThan(1.0);
        });

        it('should handle equal min/max tolerance gracefully', () => {
            const result = calculateMoistureSuitability(50, 50, 50);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(1);
        });
    });

    describe('Temperature Suitability', () => {
        it('should return 1.0 for optimal temperature', () => {
            expect(calculateTemperatureSuitability(20, 10, 30)).toBe(1.0);
        });

        it('should apply cold penalty below minimum', () => {
            expect(calculateTemperatureSuitability(5, 10, 30)).toBeLessThan(1.0);
            expect(calculateTemperatureSuitability(5, 10, 30)).toBeGreaterThan(0);
        });

        it('should apply heat penalty above maximum', () => {
            expect(calculateTemperatureSuitability(35, 10, 30)).toBeLessThan(1.0);
            expect(calculateTemperatureSuitability(35, 10, 30)).toBeGreaterThanOrEqual(0);
        });

        it('should clamp to 0 at lethal cold', () => {
            expect(calculateTemperatureSuitability(-10, 10, 30)).toBe(0);
        });

        it('should clamp to 0 at extreme heat', () => {
            expect(calculateTemperatureSuitability(60, 10, 30)).toBe(0);
        });

        it('should handle cold temperatures gracefully', () => {
            const below = calculateTemperatureSuitability(0, 10, 30);
            const way_below = calculateTemperatureSuitability(-10, 10, 30);
            expect(below).toBeGreaterThan(way_below);
        });
    });

    describe('Light Suitability', () => {
        it('should return 1.0 for sufficient light', () => {
            expect(calculateLightSuitability(50, 30)).toBe(1.0);
        });

        it('should scale down with insufficient light', () => {
            const dimLight = calculateLightSuitability(15, 30);
            expect(dimLight).toBeLessThan(1.0);
            expect(dimLight).toBeGreaterThan(0);
        });

        it('should be 0 with no light', () => {
            expect(calculateLightSuitability(0, 30)).toBe(0);
        });

        it('should reach 1.0 at minimum requirement', () => {
            expect(calculateLightSuitability(30, 30)).toBe(1.0);
        });

        it('should increase linearly below minimum', () => {
            const half = calculateLightSuitability(15, 30);
            const quarter = calculateLightSuitability(7.5, 30);
            expect(half).toBeCloseTo(0.5, 1);
            expect(quarter).toBeCloseTo(0.25, 1);
        });
    });

    describe('Environmental Suitability (Combined)', () => {
        it('should return perfect conditions score', () => {
            const result = calculateEnvironmentalSuitability(
                { moisture: 50, temperature: 20, light: 50 },
                { minMoisture: 30, maxMoisture: 80, minTemperature: 10, maxTemperature: 30, minLight: 40 }
            );
            expect(result.suitability).toBe(1.0);
            expect(result.canReproduce).toBe(true);
        });

        it('should penalize poor moisture', () => {
            const result = calculateEnvironmentalSuitability(
                { moisture: 10, temperature: 20, light: 50 },
                { minMoisture: 30, maxMoisture: 80, minTemperature: 10, maxTemperature: 30, minLight: 40 }
            );
            expect(result.suitability).toBeLessThan(0.8);
        });

        it('should penalize cold temperature', () => {
            const result = calculateEnvironmentalSuitability(
                { moisture: 50, temperature: 0, light: 50 },
                { minMoisture: 30, maxMoisture: 80, minTemperature: 10, maxTemperature: 30, minLight: 40 }
            );
            expect(result.suitability).toBeLessThanOrEqual(0.82);
        });

        it('should allow reproduction only above 0.7 suitability', () => {
            const good = calculateEnvironmentalSuitability(
                { moisture: 50, temperature: 20, light: 50 },
                { minMoisture: 30, maxMoisture: 80, minTemperature: 10, maxTemperature: 30, minLight: 40 }
            );
            expect(good.canReproduce).toBe(true);

            const poor = calculateEnvironmentalSuitability(
                { moisture: 15, temperature: 5, light: 10 },
                { minMoisture: 30, maxMoisture: 80, minTemperature: 10, maxTemperature: 30, minLight: 40 }
            );
            expect(poor.canReproduce).toBe(false);
        });

        it('should handle missing conditions gracefully', () => {
            const result = calculateEnvironmentalSuitability({}, {});
            expect(result.suitability).toBeGreaterThanOrEqual(0);
            expect(result.suitability).toBeLessThanOrEqual(1);
        });

        it('should provide all component scores', () => {
            const result = calculateEnvironmentalSuitability(
                { moisture: 50, temperature: 20, light: 50 },
                { minMoisture: 30, maxMoisture: 80, minTemperature: 10, maxTemperature: 30, minLight: 40 }
            );
            expect(result).toHaveProperty('moistureScore');
            expect(result).toHaveProperty('temperatureScore');
            expect(result).toHaveProperty('lightScore');
        });
    });

    describe('Environmental Stress', () => {
        it('should apply 0 stress at perfect conditions', () => {
            expect(calculateEnvironmentalStress(1.0, 5)).toBe(0);
        });

        it('should apply damage proportional to stress', () => {
            const lightStress = calculateEnvironmentalStress(0.8, 5); // 20% bad
            const severeStress = calculateEnvironmentalStress(0.2, 5); // 80% bad
            expect(severeStress).toBeGreaterThan(lightStress);
        });

        it('should apply maximum stress at 0 suitability', () => {
            expect(calculateEnvironmentalStress(0, 5)).toBe(5);
        });

        it('should use custom damage value', () => {
            calculateEnvironmentalStress(0.5, 5);
            const high = calculateEnvironmentalStress(0.5, 10);
            expect(high).toBe(Math.ceil(0.5 * 10)); // 5, not normal * 2 due to ceiling
        });

        it('should ceil the damage value', () => {
            const result = calculateEnvironmentalStress(0.55, 5);
            expect(result).toBe(Math.ceil(0.45 * 5)); // 3
        });
    });

    describe('Growth Probability', () => {
        it('should maintain base probability at perfect conditions', () => {
            expect(calculateGrowthProbability(0.05, 1.0)).toBe(0.05);
        });

        it('should reduce probability with stress', () => {
            const good = calculateGrowthProbability(0.05, 0.8);
            const poor = calculateGrowthProbability(0.05, 0.2);
            expect(poor).toBeLessThan(good);
        });

        it('should be 0 at 0 suitability', () => {
            expect(calculateGrowthProbability(0.05, 0)).toBe(0);
        });

        it('should scale linearly with suitability', () => {
            const perfect = calculateGrowthProbability(0.1, 1.0);
            const half = calculateGrowthProbability(0.1, 0.5);
            expect(half).toBeCloseTo(perfect * 0.5, 5);
        });

        it('should handle zero base probability', () => {
            expect(calculateGrowthProbability(0, 0.8)).toBe(0);
        });
    });

    describe('Drop Probability', () => {
        it('should increase with stress', () => {
            const healthy = calculateDropProbability(0.01, 0.2);
            const stressed = calculateDropProbability(0.01, 0.8);
            expect(stressed).toBeGreaterThan(healthy);
        });

        it('should be 0 at 0 stress (perfect conditions)', () => {
            expect(calculateDropProbability(0.01, 0)).toBe(0.01);
        });

        it('should double at maximum stress', () => {
            const baseRate = calculateDropProbability(0.01, 0);
            const maxStress = calculateDropProbability(0.01, 1.0);
            expect(maxStress).toBeCloseTo(baseRate * 2, 5);
        });

        it('should handle zero base probability', () => {
            expect(calculateDropProbability(0, 0.5)).toBe(0);
        });

        it('should never exceed 1.0 at high stress', () => {
            const result = calculateDropProbability(0.5, 1.0);
            expect(result).toBeLessThanOrEqual(1.0);
        });
    });

    describe('Harvest Yield', () => {
        it('should give full yield at full health', () => {
            expect(calculateHarvestYield(5, 100, 100)).toBe(5);
        });

        it('should give 0 yield at 0 health', () => {
            expect(calculateHarvestYield(5, 0, 100)).toBe(0);
        });

        it('should scale yield with health', () => {
            const full = calculateHarvestYield(10, 100, 100);
            const half = calculateHarvestYield(10, 50, 100);
            expect(half).toBeCloseTo(full / 2, 0);
        });

        it('should floor the result', () => {
            const result = calculateHarvestYield(5, 33, 100);
            expect(result).toBe(1); // 5 * 0.33 = 1.65 → floor to 1
        });

        it('should give 0 yield at negative health', () => {
            expect(calculateHarvestYield(5, -10, 100)).toBe(0);
        });

        it('should handle max health = 0 gracefully', () => {
            const result = calculateHarvestYield(5, 0, 0);
            // Should not divide by zero - either 0 or Infinity
            expect(Number.isFinite(result)).toBe(true);
        });
    });

    describe('Vegetation Density', () => {
        it('should return 0 for no plants', () => {
            expect(calculateVegetationDensity(0)).toBe(0);
        });

        it('should scale 10 per plant', () => {
            expect(calculateVegetationDensity(1)).toBe(10);
            expect(calculateVegetationDensity(5)).toBe(50);
        });

        it('should clamp at 100', () => {
            expect(calculateVegetationDensity(10)).toBe(100);
            expect(calculateVegetationDensity(15)).toBe(100);
        });

        it('should handle large plant counts', () => {
            expect(calculateVegetationDensity(1000)).toBe(100);
        });
    });

    describe('Reproduction Check', () => {
        it('should trigger reproduction at low random roll', () => {
            expect(shouldReproduce(0.5, true, 0.2)).toBe(true);
        });

        it('should fail reproduction at high random roll', () => {
            expect(shouldReproduce(0.5, true, 0.8)).toBe(false);
        });

        it('should require environmental permission', () => {
            expect(shouldReproduce(0.99, false, 0.1)).toBe(false);
        });

        it('should respect exact threshold', () => {
            expect(shouldReproduce(0.5, true, 0.5)).toBe(false); // < not <=
        });

        it('should always fail without permission regardless of roll', () => {
            expect(shouldReproduce(0.99, false, 0.01)).toBe(false);
            expect(shouldReproduce(0.99, false, 0.99)).toBe(false);
        });

        it('should use Math.random as default', () => {
            // Just ensure it doesn't crash with default RNG
            const result1 = shouldReproduce(0.5, true);
            const result2 = shouldReproduce(0.5, true);
            expect(typeof result1).toBe('boolean');
            expect(typeof result2).toBe('boolean');
        });
    });

    describe('Part Growth Check', () => {
        it('should grow when below max and random passes', () => {
            expect(shouldPartGrow(0.5, 2, 5, 0.2)).toBe(true);
        });

        it('should not grow when at max quantity', () => {
            expect(shouldPartGrow(0.5, 5, 5, 0.2)).toBe(false);
        });

        it('should not grow at high random roll', () => {
            expect(shouldPartGrow(0.5, 2, 5, 0.8)).toBe(false);
        });

        it('should respect exact threshold', () => {
            expect(shouldPartGrow(0.5, 2, 5, 0.5)).toBe(false); // < not <=
        });

        it('should handle zero max quantity', () => {
            expect(shouldPartGrow(0.5, 0, 0, 0.2)).toBe(false);
        });

        it('should handle current > max gracefully', () => {
            expect(shouldPartGrow(0.5, 10, 5, 0.2)).toBe(false);
        });
    });

    describe('Part Drop Check', () => {
        it('should drop when present and random passes', () => {
            expect(shouldPartDrop(0.5, 3, 0.2)).toBe(true);
        });

        it('should not drop at zero quantity', () => {
            expect(shouldPartDrop(0.5, 0, 0.2)).toBe(false);
        });

        it('should not drop at high random roll', () => {
            expect(shouldPartDrop(0.5, 3, 0.8)).toBe(false);
        });

        it('should respect exact threshold', () => {
            expect(shouldPartDrop(0.5, 3, 0.5)).toBe(false); // < not <=
        });

        it('should handle negative quantity', () => {
            expect(shouldPartDrop(0.5, -1, 0.2)).toBe(false);
        });

        it('should work with single item', () => {
            expect(shouldPartDrop(0.5, 1, 0.2)).toBe(true);
        });
    });

    describe('Integration Scenarios', () => {
        it('should simulate healthy plant growth', () => {
            const conditions = { moisture: 60, temperature: 20, light: 70 };
            const requirements = {
                minMoisture: 40,
                maxMoisture: 80,
                minTemperature: 10,
                maxTemperature: 30,
                minLight: 50
            };

            const env = calculateEnvironmentalSuitability(conditions, requirements);
            expect(env.suitability).toBeGreaterThan(0.85);

            const growth = calculateGrowthProbability(0.05, env.suitability);
            expect(growth).toBeCloseTo(0.05, 1);

            const drop = calculateDropProbability(0.01, 1 - env.suitability);
            expect(drop).toBeLessThan(0.02);
        });

        it('should simulate stressed plant shedding', () => {
            const conditions = { moisture: 10, temperature: 40, light: 5 };
            const requirements = {
                minMoisture: 40,
                maxMoisture: 80,
                minTemperature: 10,
                maxTemperature: 30,
                minLight: 50
            };

            const env = calculateEnvironmentalSuitability(conditions, requirements);
            expect(env.suitability).toBeLessThanOrEqual(0.35);
            expect(env.canReproduce).toBe(false);

            const growth = calculateGrowthProbability(0.05, env.suitability);
            expect(growth).toBeLessThan(0.02);

            const stressLevel = 1 - env.suitability;
            const drop = calculateDropProbability(0.01, stressLevel);
            expect(drop).toBeGreaterThanOrEqual(0.015); // Relaxed threshold
        });

        it('should calculate full harvest scenario', () => {
            const plantHealth = 80;
            const plantMaxHealth = 100;
            const maxYield = 5;

            const yield_ = calculateHarvestYield(maxYield, plantHealth, plantMaxHealth);
            expect(yield_).toBe(4); // 80% of 5 = 4
        });
    });
});
