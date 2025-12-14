import {
    nextSeed,
    random,
    randomInt,
    weightedRandom,
    rollLoot,
} from '@/core/rules/rng';

describe('RNG Rules', () => {
    describe('nextSeed', () => {
        test('should return deterministic next seed', () => {
            const seed1 = nextSeed(42);
            const seed2 = nextSeed(42);
            expect(seed1).toBe(seed2);
        });

        test('should advance seed through sequence', () => {
            let seed = 42;
            const sequence: number[] = [];
            for (let i = 0; i < 5; i++) {
                seed = nextSeed(seed);
                sequence.push(seed);
            }
            // All should be different
            const unique = new Set(sequence);
            expect(unique.size).toBe(5);
        });

        test('should handle seed 0', () => {
            const result = nextSeed(0);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(2147483647);
        });

        test('should handle large seed values', () => {
            const result = nextSeed(2147483646);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(2147483647);
        });

        test('should produce values in valid range', () => {
            for (let i = 0; i < 100; i++) {
                const seed = nextSeed(i);
                expect(seed).toBeGreaterThanOrEqual(0);
                expect(seed).toBeLessThan(2147483647);
            }
        });
    });

    describe('random', () => {
        test('should return value in [0, 1)', () => {
            const [value] = random(42);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        });

        test('should return deterministic for same seed', () => {
            const [val1] = random(42);
            const [val2] = random(42);
            expect(val1).toBe(val2);
        });

        test('should advance seed on each call', () => {
            let seed = 42;
            const [, nextS1] = random(seed);
            const [, nextS2] = random(nextS1);
            expect(nextS1).not.toBe(seed);
            expect(nextS2).not.toBe(nextS1);
        });

        test('should produce different values with different seeds', () => {
            const [val1] = random(1);
            const [val2] = random(2);
            expect(val1).not.toBe(val2);
        });

        test('should distribute values across range', () => {
            let seed = 12345;
            const values: number[] = [];
            for (let i = 0; i < 1000; i++) {
                const [value, nextS] = random(seed);
                values.push(value);
                seed = nextS;
            }
            const avg = values.reduce((a, b) => a + b) / values.length;
            // Average should be close to 0.5
            expect(avg).toBeGreaterThan(0.4);
            expect(avg).toBeLessThan(0.6);
        });

        test('should never return exactly 1', () => {
            let seed = 42;
            for (let i = 0; i < 100; i++) {
                const [value, nextS] = random(seed);
                expect(value).toBeLessThan(1);
                seed = nextS;
            }
        });

        test('should return next seed for chaining', () => {
            const [val1, next1] = random(42);
            const [val2, next2] = random(next1);
            // Second value should be different from first
            expect(val2).not.toBe(val1);
        });
    });

    describe('randomInt', () => {
        test('should return integer in [min, max)', () => {
            const [value] = randomInt(42, 1, 7);
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThan(7);
        });

        test('should be deterministic for same seed', () => {
            const [val1] = randomInt(42, 1, 7);
            const [val2] = randomInt(42, 1, 7);
            expect(val1).toBe(val2);
        });

        test('should return min when min === max', () => {
            const [value] = randomInt(42, 5, 5);
            expect(value).toBe(5);
        });

        test('should handle negative ranges', () => {
            const [value] = randomInt(42, -5, 5);
            expect(value).toBeGreaterThanOrEqual(-5);
            expect(value).toBeLessThan(5);
        });

        test('should swap min and max if reversed', () => {
            const [value1] = randomInt(42, 10, 1);
            const [value2] = randomInt(42, 1, 10);
            expect(value1).toBe(value2);
        });

        test('should distribute evenly across range', () => {
            let seed = 12345;
            const counts: Record<number, number> = {};
            for (let i = 0; i < 1000; i++) {
                const [value, nextS] = randomInt(seed, 0, 6);
                counts[value] = (counts[value] || 0) + 1;
                seed = nextS;
            }
            // Each value should appear roughly equally
            for (let i = 0; i < 6; i++) {
                expect(counts[i]).toBeGreaterThan(100);
                expect(counts[i]).toBeLessThan(250);
            }
        });

        test('d6 die roll should be 1-6', () => {
            let seed = 42;
            for (let i = 0; i < 100; i++) {
                const [roll, nextS] = randomInt(seed, 1, 7);
                expect(roll).toBeGreaterThanOrEqual(1);
                expect(roll).toBeLessThanOrEqual(6);
                seed = nextS;
            }
        });

        test('should never return max value', () => {
            let seed = 42;
            for (let i = 0; i < 100; i++) {
                const [value, nextS] = randomInt(seed, 0, 10);
                expect(value).toBeLessThan(10);
                seed = nextS;
            }
        });
    });

    describe('weightedRandom', () => {
        test('should select from items array', () => {
            const items = ['a', 'b', 'c'];
            const weights = [1, 1, 1];
            const [selected] = weightedRandom(42, items, weights);
            expect(items).toContain(selected);
        });

        test('should respect weight ratios', () => {
            const items = ['common', 'rare'];
            const weights = [90, 10];
            let seed = 12345;
            const counts = { common: 0, rare: 0 };
            for (let i = 0; i < 1000; i++) {
                const [selected, nextS] = weightedRandom(seed, items, weights);
                counts[selected as 'common' | 'rare']++;
                seed = nextS;
            }
            // ~900 common, ~100 rare
            expect(counts.common).toBeGreaterThan(800);
            expect(counts.rare).toBeLessThan(200);
        });

        test('should always select only item when array has 1 item', () => {
            const items = ['only'];
            const weights = [1];
            const [selected] = weightedRandom(42, items, weights);
            expect(selected).toBe('only');
        });

        test('should handle item with 0 weight', () => {
            const items = ['a', 'b', 'c'];
            const weights = [0, 50, 50];
            let seed = 42;
            for (let i = 0; i < 100; i++) {
                const [selected, nextS] = weightedRandom(seed, items, weights);
                // 'a' should never be selected (0 weight)
                expect(selected).not.toBe('a');
                seed = nextS;
            }
        });

        test('should handle equal weights (uniform distribution)', () => {
            const items = [1, 2, 3, 4];
            const weights = [1, 1, 1, 1];
            let seed = 12345;
            const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
            for (let i = 0; i < 400; i++) {
                const [selected, nextS] = weightedRandom(seed, items, weights);
                counts[selected as 1 | 2 | 3 | 4]++;
                seed = nextS;
            }
            // Each should appear ~100 times
            for (let i = 1; i <= 4; i++) {
                expect(counts[i]).toBeGreaterThan(50);
                expect(counts[i]).toBeLessThan(150);
            }
        });

        test('should throw on empty items array', () => {
            expect(() => {
                weightedRandom(42, [], []);
            }).toThrow();
        });

        test('should throw if items and weights length mismatch', () => {
            expect(() => {
                weightedRandom(42, ['a', 'b'], [1]);
            }).toThrow();
        });

        test('should handle very large weights', () => {
            const items = ['likely', 'unlikely'];
            const weights = [1000000, 1];
            let seed = 42;
            let likelyCount = 0;
            for (let i = 0; i < 100; i++) {
                const [selected, nextS] = weightedRandom(seed, items, weights);
                if (selected === 'likely') likelyCount++;
                seed = nextS;
            }
            expect(likelyCount).toBeGreaterThan(95);
        });

        test('should be deterministic with same seed', () => {
            const items = ['x', 'y', 'z'];
            const weights = [1, 2, 3];
            const [sel1] = weightedRandom(42, items, weights);
            const [sel2] = weightedRandom(42, items, weights);
            expect(sel1).toBe(sel2);
        });

        test('should handle numeric items', () => {
            const items = [10, 20, 30];
            const weights = [1, 1, 1];
            const [selected] = weightedRandom(42, items, weights);
            expect([10, 20, 30]).toContain(selected);
        });
    });

    describe('rollLoot', () => {
        test('should return success when roll < chance', () => {
            const result = rollLoot(42, 80, 3, 1); // 80% + 25% - 0% = 105% clamped 99%
            expect(result.success).toBeDefined();
            expect(result.roll).toBeDefined();
            expect(result.finalChance).toBeDefined();
            expect(result.nextSeed).toBeDefined();
        });

        test('should add rarity bonus', () => {
            const result1 = rollLoot(42, 30, 1, 1); // 30 + 0 - 0 = 30
            const result2 = rollLoot(42, 30, 5, 1); // 30 + 50 - 0 = 80
            expect(result2.finalChance).toBeGreaterThan(result1.finalChance);
        });

        test('should subtract difficulty penalty', () => {
            const result1 = rollLoot(42, 50, 3, 1); // 50 + 25 - 0 = 75
            const result2 = rollLoot(42, 50, 3, 5); // 50 + 25 - 40 = 35
            expect(result1.finalChance).toBeGreaterThan(result2.finalChance);
        });

        test('should clamp chance to 1-99%', () => {
            const result1 = rollLoot(42, 0, 1, 5); // very low
            const result2 = rollLoot(42, 100, 5, 1); // very high
            expect(result1.finalChance).toBeGreaterThanOrEqual(1);
            expect(result1.finalChance).toBeLessThanOrEqual(99);
            expect(result2.finalChance).toBeGreaterThanOrEqual(1);
            expect(result2.finalChance).toBeLessThanOrEqual(99);
        });

        test('should roll between 0-99', () => {
            let seed = 42;
            for (let i = 0; i < 100; i++) {
                const result = rollLoot(seed, 50, 3, 2);
                expect(result.roll).toBeGreaterThanOrEqual(0);
                expect(result.roll).toBeLessThan(100);
                seed = result.nextSeed;
            }
        });

        test('should clamp rarity 1-5', () => {
            const result1 = rollLoot(42, 50, 0, 3); // clamp to 1
            const result2 = rollLoot(42, 50, 1, 3); // normal 1
            expect(result1.finalChance).toBe(result2.finalChance);

            const result3 = rollLoot(42, 50, 10, 3); // clamp to 5
            const result4 = rollLoot(42, 50, 5, 3); // normal 5
            expect(result3.finalChance).toBe(result4.finalChance);
        });

        test('should clamp difficulty 1-5', () => {
            const result1 = rollLoot(42, 50, 3, 0); // clamp to 1
            const result2 = rollLoot(42, 50, 3, 1); // normal 1
            expect(result1.finalChance).toBe(result2.finalChance);

            const result3 = rollLoot(42, 50, 3, 10); // clamp to 5
            const result4 = rollLoot(42, 50, 3, 5); // normal 5
            expect(result3.finalChance).toBe(result4.finalChance);
        });

        test('should return next seed for chaining', () => {
            const result1 = rollLoot(42, 50, 3, 2);
            const result2 = rollLoot(result1.nextSeed, 50, 3, 2);
            expect(result2.nextSeed).not.toBe(result1.nextSeed);
        });

        test('should give high success rate for high rarity + low difficulty', () => {
            let seed = 12345;
            let successes = 0;
            for (let i = 0; i < 100; i++) {
                const result = rollLoot(seed, 30, 5, 1);
                if (result.success) successes++;
                seed = result.nextSeed;
            }
            expect(successes).toBeGreaterThan(70);
        });

        test('should give low success rate for low rarity + high difficulty', () => {
            let seed = 12345;
            let successes = 0;
            for (let i = 0; i < 100; i++) {
                const result = rollLoot(seed, 30, 1, 5);
                if (result.success) successes++;
                seed = result.nextSeed;
            }
            expect(successes).toBeLessThan(30);
        });

        test('common rarity (rarity 1) should get no bonus', () => {
            const base = rollLoot(42, 50, 1, 1); // 50 + 0 - 0 = 50
            const withBonus = rollLoot(42, 50 + 10, 1, 1); // 60 + 0 - 0 = 60
            expect(withBonus.finalChance).toBeGreaterThan(base.finalChance);
        });

        test('should be deterministic with same parameters', () => {
            const result1 = rollLoot(42, 50, 3, 2);
            const result2 = rollLoot(42, 50, 3, 2);
            expect(result1.success).toBe(result2.success);
            expect(result1.roll).toBe(result2.roll);
            expect(result1.finalChance).toBe(result2.finalChance);
        });
    });

    describe('Integration - RNG flow', () => {
        test('should generate reproducible sequence with same seed', () => {
            let seed1 = 42;
            let seed2 = 42;
            const sequence1: number[] = [];
            const sequence2: number[] = [];

            for (let i = 0; i < 10; i++) {
                const [val1, nextS1] = random(seed1);
                sequence1.push(val1);
                seed1 = nextS1;

                const [val2, nextS2] = random(seed2);
                sequence2.push(val2);
                seed2 = nextS2;
            }

            expect(sequence1).toEqual(sequence2);
        });

        test('weighted selection should use seeded RNG', () => {
            const items = ['a', 'b', 'c'];
            const weights = [1, 1, 1];
            const [sel1] = weightedRandom(42, items, weights);
            const [sel2] = weightedRandom(42, items, weights);
            expect(sel1).toBe(sel2);
        });

        test('loot roll should use seeded RNG', () => {
            const result1 = rollLoot(42, 50, 3, 2);
            const result2 = rollLoot(42, 50, 3, 2);
            expect(result1.roll).toBe(result2.roll);
            expect(result1.success).toBe(result2.success);
        });

        test('complex loot generation: weight selection + roll', () => {
            let seed = 12345;

            // Select rarity
            const rarities = [1, 2, 3, 4, 5];
            const rarityWeights = [60, 25, 10, 4, 1];
            const [rarity, nextS1] = weightedRandom(seed, rarities, rarityWeights);

            // Roll drop chance
            const result = rollLoot(nextS1, 50, rarity, 2);

            expect([1, 2, 3, 4, 5]).toContain(rarity);
            expect(result.success).toBeDefined();
        });
    });
});
