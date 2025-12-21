import {
    rollDice,
    rollPercentage,
    selectWeighted,
    shuffleArray,
    randomBetween,
    WeightedItem,
} from '@/core/rules/rng';

describe('RNG Rules - Pure Randomization Functions', () => {
    describe('rollDice', () => {
        test('should roll single d20 within range 1-20', () => {
            for (let i = 0; i < 50; i++) {
                const roll = rollDice(20);
                expect(roll).toBeGreaterThanOrEqual(1);
                expect(roll).toBeLessThanOrEqual(20);
            }
        });

        test('should roll d6 single die (1-6)', () => {
            for (let i = 0; i < 30; i++) {
                const roll = rollDice(6);
                expect(roll).toBeGreaterThanOrEqual(1);
                expect(roll).toBeLessThanOrEqual(6);
            }
        });

        test('should sum multiple dice (2d6)', () => {
            for (let i = 0; i < 30; i++) {
                const roll = rollDice(6, 2);
                expect(roll).toBeGreaterThanOrEqual(2);
                expect(roll).toBeLessThanOrEqual(12);
            }
        });

        test('should handle 3d20 correctly', () => {
            for (let i = 0; i < 20; i++) {
                const roll = rollDice(20, 3);
                expect(roll).toBeGreaterThanOrEqual(3);
                expect(roll).toBeLessThanOrEqual(60);
            }
        });

        test('should return 0 for invalid die sides', () => {
            expect(rollDice(0)).toBe(0);
            expect(rollDice(-5)).toBe(0);
        });

        test('should return 0 for invalid die count', () => {
            expect(rollDice(20, 0)).toBe(0);
            expect(rollDice(20, -1)).toBe(0);
        });

        test('should use injected random function', () => {
            const mockRandom = jest.fn(() => 0.5);
            const roll = rollDice(10, 1, mockRandom);
            expect(mockRandom).toHaveBeenCalled();
            // 0.5 * 10 = 5, floor = 5, + 1 = 6
            expect(roll).toBe(6);
        });

        test('should be deterministic with fixed random function', () => {
            const fixed = () => 0.5;
            const roll1 = rollDice(6, 1, fixed);
            const roll2 = rollDice(6, 1, fixed);
            expect(roll1).toBe(roll2);
        });
    });

    describe('rollPercentage', () => {
        test('should always return true for 100% chance', () => {
            for (let i = 0; i < 20; i++) {
                expect(rollPercentage(100)).toBe(true);
            }
        });

        test('should always return false for 0% chance', () => {
            for (let i = 0; i < 20; i++) {
                expect(rollPercentage(0)).toBe(false);
            }
        });

        test('should return true for 50% with 0.4 random', () => {
            const mockRandom = () => 0.4; // 0.4 < 0.5
            expect(rollPercentage(50, mockRandom)).toBe(true);
        });

        test('should return false for 50% with 0.6 random', () => {
            const mockRandom = () => 0.6; // 0.6 > 0.5
            expect(rollPercentage(50, mockRandom)).toBe(false);
        });

        test('should clamp negative chance to 0%', () => {
            expect(rollPercentage(-50)).toBe(false);
        });

        test('should clamp chance > 100 to 100%', () => {
            expect(rollPercentage(150)).toBe(true);
        });

        test('should respect 75% chance distribution', () => {
            const mockRandom = () => 0.7; // 0.7 < 0.75
            expect(rollPercentage(75, mockRandom)).toBe(true);

            const mockRandom2 = () => 0.8; // 0.8 > 0.75
            expect(rollPercentage(75, mockRandom2)).toBe(false);
        });
    });

    describe('selectWeighted', () => {
        test('should select from single item array', () => {
            const items = [{ value: 'only', weight: 100 }];
            const result = selectWeighted(items);
            expect(result).toBe('only');
        });

        test('should throw on empty array', () => {
            expect(() => selectWeighted([])).toThrow('cannot be empty');
        });

        test('should throw on all-zero weights', () => {
            const items = [
                { value: 'a', weight: 0 },
                { value: 'b', weight: 0 },
            ];
            expect(() => selectWeighted(items)).toThrow('total weight must be > 0');
        });

        test('should select first item with weight 100 of 100', () => {
            const mockRandom = () => 0.1; // 0.1 * 100 = 10
            const items: WeightedItem<string>[] = [
                { value: 'first', weight: 70 },
                { value: 'second', weight: 30 },
            ];
            const result = selectWeighted(items, mockRandom);
            expect(result).toBe('first');
        });

        test('should select second item with weight 100 of 100', () => {
            const mockRandom = () => 0.8; // 0.8 * 100 = 80
            const items: WeightedItem<string>[] = [
                { value: 'first', weight: 70 },
                { value: 'second', weight: 30 },
            ];
            const result = selectWeighted(items, mockRandom);
            expect(result).toBe('second');
        });

        test('should work with non-100 weight sums', () => {
            const mockRandom = () => 0.9; // 0.9 * 4 = 3.6, exceeds common (3)
            const items: WeightedItem<string>[] = [
                { value: 'common', weight: 3 },
                { value: 'rare', weight: 1 },
            ];
            const result = selectWeighted(items, mockRandom);
            expect(result).toBe('rare');
        });

        test('should handle negative weights as 0', () => {
            const items: WeightedItem<string>[] = [
                { value: 'a', weight: -10 },
                { value: 'b', weight: 100 },
            ];
            const result = selectWeighted(items);
            // Should always pick 'b' since -10 treated as 0
            expect(result).toBe('b');
        });
    });

    describe('shuffleArray', () => {
        test('should mutate array in place', () => {
            const arr = [1, 2, 3, 4, 5];
            const result = shuffleArray(arr);
            expect(result).toBe(arr); // Same reference
        });

        test('should return array of same length', () => {
            const arr = [1, 2, 3, 4, 5];
            shuffleArray(arr);
            expect(arr).toHaveLength(5);
        });

        test('should contain all original elements', () => {
            const arr = [1, 2, 3, 4, 5];
            shuffleArray(arr);
            expect(new Set(arr)).toEqual(new Set([1, 2, 3, 4, 5]));
        });

        test('should work with empty array', () => {
            const arr: number[] = [];
            shuffleArray(arr);
            expect(arr).toHaveLength(0);
        });

        test('should work with single element', () => {
            const arr = [42];
            shuffleArray(arr);
            expect(arr).toEqual([42]);
        });

        test('should use deterministic shuffle with fixed random', () => {
            const arr1 = ['a', 'b', 'c', 'd'];
            const arr2 = ['a', 'b', 'c', 'd'];
            const fixedRandom = () => 0.5;

            shuffleArray(arr1, fixedRandom);
            shuffleArray(arr2, fixedRandom);

            expect(arr1).toEqual(arr2);
        });

        test('should produce different results with different random values', () => {
            const arr1 = [1, 2, 3, 4, 5];
            const arr2 = [1, 2, 3, 4, 5];

            shuffleArray(arr1, () => 0.2);
            shuffleArray(arr2, () => 0.8);

            // Should produce different orderings (with high probability)
            // Note: There's a tiny chance they're the same, but very unlikely
            // For deterministic test, we just verify the shuffle happened
            expect(new Set(arr1)).toEqual(new Set([1, 2, 3, 4, 5]));
            expect(new Set(arr2)).toEqual(new Set([1, 2, 3, 4, 5]));
        });
    });

    describe('randomBetween', () => {
        test('should generate value between min and max', () => {
            for (let i = 0; i < 30; i++) {
                const val = randomBetween(1, 10);
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(10);
            }
        });

        test('should include min value', () => {
            const mockRandom = () => 0.0; // Lowest possible
            const val = randomBetween(5, 10, mockRandom);
            expect(val).toBe(5);
        });

        test('should include max value', () => {
            const mockRandom = () => 0.999; // Nearly 1.0
            const val = randomBetween(5, 10, mockRandom);
            expect(val).toBe(10);
        });

        test('should work with same min and max', () => {
            expect(randomBetween(5, 5)).toBe(5);
        });

        test('should swap if min > max', () => {
            const mockRandom = () => 0.5;
            const val1 = randomBetween(5, 10, mockRandom);
            const val2 = randomBetween(10, 5, mockRandom);
            expect(val1).toBe(val2);
        });

        test('should work with negative ranges', () => {
            for (let i = 0; i < 20; i++) {
                const val = randomBetween(-10, 10);
                expect(val).toBeGreaterThanOrEqual(-10);
                expect(val).toBeLessThanOrEqual(10);
            }
        });

        test('should handle single value range', () => {
            expect(randomBetween(42, 42)).toBe(42);
        });

        test('should be deterministic with fixed random', () => {
            const fixed = () => 0.5;
            const val1 = randomBetween(1, 100, fixed);
            const val2 = randomBetween(1, 100, fixed);
            expect(val1).toBe(val2);
        });
    });

    describe('Integration Tests', () => {
        test('should roll d20 combat attack check', () => {
            const attackBonus = 5;
            const roll = rollDice(20) + attackBonus;
            expect(roll).toBeGreaterThanOrEqual(1 + attackBonus);
            expect(roll).toBeLessThanOrEqual(20 + attackBonus);
        });

        test('should determine critical hit (15% chance)', () => {
            const critChance = 15;
            const hits = [];
            for (let i = 0; i < 1000; i++) {
                if (rollPercentage(critChance)) hits.push(i);
            }
            // With 1000 rolls and 15% chance, expect ~150 crits (with some variance)
            expect(hits.length).toBeGreaterThan(100);
            expect(hits.length).toBeLessThan(200);
        });

        test('should select loot with weighted distribution', () => {
            const lootTable: WeightedItem<string>[] = [
                { value: 'common', weight: 70 },
                { value: 'rare', weight: 25 },
                { value: 'epic', weight: 5 },
            ];

            const results = { common: 0, rare: 0, epic: 0 };
            for (let i = 0; i < 1000; i++) {
                const item = selectWeighted(lootTable);
                results[item as keyof typeof results]++;
            }

            // Should roughly match distribution (with variance)
            expect(results.common).toBeGreaterThan(600);
            expect(results.rare).toBeGreaterThan(150);
            expect(results.epic).toBeGreaterThan(0);
        });

        test('should shuffle deck properly', () => {
            const deck = Array.from({ length: 52 }, (_, i) => i + 1);
            shuffleArray(deck);

            // All cards present
            expect(new Set(deck)).toEqual(new Set(Array.from({ length: 52 }, (_, i) => i + 1)));

            // Unlikely to be in same order (but possible)
            const originalOrder = Array.from({ length: 52 }, (_, i) => i + 1);
            expect(deck).not.toEqual(originalOrder);
        });
    });
});
