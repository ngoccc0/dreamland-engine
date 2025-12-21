import {
    calculateRarity,
    generateLoot,
    applyAffixes,
    calculateItemValue,
    generateLootPackage,
} from '@/core/rules/loot';

describe('Loot Rules', () => {
    describe('calculateRarity', () => {
        test('should return base rarity for difficulty 1 (common)', () => {
            expect(calculateRarity(1, 0)).toBe(1);
        });

        test('should return base rarity for difficulty 2-3 (uncommon)', () => {
            expect(calculateRarity(2, 0)).toBe(2);
            expect(calculateRarity(3, 0)).toBe(2);
        });

        test('should return rarity 3 for difficulty 4 (rare)', () => {
            expect(calculateRarity(4, 0)).toBe(3);
        });

        test('should return rarity 4 for difficulty 5 (nightmare)', () => {
            expect(calculateRarity(5, 0)).toBe(4);
        });

        test('should add +1 rarity for luck 11-20', () => {
            const rarity1 = calculateRarity(2, 0);
            const rarity2 = calculateRarity(2, 15);
            expect(rarity2).toBe(rarity1 + 1);
        });

        test('should add +2 rarity for luck 21+', () => {
            const rarity1 = calculateRarity(2, 0);
            const rarity2 = calculateRarity(2, 25);
            expect(rarity2).toBe(rarity1 + 2);
        });

        test('should clamp rarity to 1-5', () => {
            expect(calculateRarity(5, 100)).toBe(5); // legendary + super lucky = max
            expect(calculateRarity(0, 0)).toBe(1); // clamped difficulty
            expect(calculateRarity(10, 0)).toBe(4); // clamped difficulty to max
        });

        test('should return consistent rarity for same inputs', () => {
            const rarity1 = calculateRarity(3, 15);
            const rarity2 = calculateRarity(3, 15);
            expect(rarity1).toBe(rarity2);
        });

        test('difficulty 1 + luck 10 should still be rarity 1 (no bonus yet)', () => {
            expect(calculateRarity(1, 10)).toBe(1);
        });

        test('difficulty 1 + luck 11 should be rarity 2 (+1 bonus)', () => {
            expect(calculateRarity(1, 11)).toBe(2);
        });

        test('should scale rarity with difficulty', () => {
            const rare1 = calculateRarity(1, 0);
            const rare2 = calculateRarity(2, 0);
            const rare3 = calculateRarity(3, 0);
            const rare4 = calculateRarity(4, 0);
            const rare5 = calculateRarity(5, 0);
            expect(rare2).toBeGreaterThanOrEqual(rare1);
            expect(rare3).toBeGreaterThanOrEqual(rare2);
            expect(rare4).toBeGreaterThanOrEqual(rare3);
            expect(rare5).toBeGreaterThanOrEqual(rare4);
        });
    });

    describe('generateLoot', () => {
        test('should return 0 affixes for rarity 1 (common)', () => {
            const affixes = generateLoot(1, 42);
            expect(affixes.length).toBe(0);
        });

        test('should return 1 affix for rarity 2 (uncommon)', () => {
            const affixes = generateLoot(2, 42);
            expect(affixes.length).toBe(1);
        });

        test('should return 2 affixes for rarity 3 (rare)', () => {
            const affixes = generateLoot(3, 42);
            expect(affixes.length).toBe(2);
        });

        test('should return 3 affixes for rarity 4 (epic)', () => {
            const affixes = generateLoot(4, 42);
            expect(affixes.length).toBe(3);
        });

        test('should return 4 affixes for rarity 5 (legendary)', () => {
            const affixes = generateLoot(5, 42);
            expect(affixes.length).toBe(4);
        });

        test('should not have duplicate affix names', () => {
            const affixes = generateLoot(5, 42);
            const names = affixes.map((a) => a.name);
            const unique = new Set(names);
            expect(unique.size).toBe(names.length);
        });

        test('each affix should have name and power', () => {
            const affixes = generateLoot(4, 42);
            for (const affix of affixes) {
                expect(affix.name).toBeTruthy();
                expect(typeof affix.power).toBe('number');
                expect(affix.power).toBeGreaterThan(0);
            }
        });

        test('legendary affixes should have higher power than common', () => {
            const rareAffixes = generateLoot(3, 42);
            const legendaryAffixes = generateLoot(5, 99);

            if (rareAffixes.length > 0 && legendaryAffixes.length > 0) {
                const rareAvgPower =
                    rareAffixes.reduce((sum, a) => sum + a.power, 0) / rareAffixes.length;
                const legendaryAvgPower =
                    legendaryAffixes.reduce((sum, a) => sum + a.power, 0) / legendaryAffixes.length;
                expect(legendaryAvgPower).toBeGreaterThan(rareAvgPower);
            }
        });

        test('should be deterministic with same seed', () => {
            const affixes1 = generateLoot(3, 42);
            const affixes2 = generateLoot(3, 42);
            expect(affixes1).toEqual(affixes2);
        });

        test('should vary with different seeds', () => {
            const affixes1 = generateLoot(4, 1);
            const affixes2 = generateLoot(4, 2);
            expect(affixes1).not.toEqual(affixes2);
        });

        test('clamp rarity out of range', () => {
            const affixes1 = generateLoot(0, 42); // clamped to 1
            const affixes2 = generateLoot(1, 42);
            expect(affixes1).toEqual(affixes2);

            const affixes3 = generateLoot(10, 42); // clamped to 5
            const affixes4 = generateLoot(5, 42);
            expect(affixes3).toEqual(affixes4);
        });
    });

    describe('applyAffixes', () => {
        test('should return base value for 0 affixes', () => {
            expect(applyAffixes(100, 0)).toBe(100);
        });

        test('should return ~110 for 1 affix (10% boost)', () => {
            expect(applyAffixes(100, 1)).toBeCloseTo(110, 0);
        });

        test('should return ~120 for 2 affixes (20% boost)', () => {
            expect(applyAffixes(100, 2)).toBeCloseTo(120, 0);
        });

        test('should return 135 for 3 affixes (35% boost)', () => {
            expect(applyAffixes(100, 3)).toBe(135);
        });

        test('should return 150 for 4 affixes (50% boost)', () => {
            expect(applyAffixes(100, 4)).toBe(150);
        });

        test('should clamp negative affix count to 0', () => {
            expect(applyAffixes(100, -5)).toBe(100);
        });

        test('should clamp high affix count to 4', () => {
            expect(applyAffixes(100, 10)).toBe(150);
        });

        test('should scale with different base values', () => {
            expect(applyAffixes(50, 2)).toBe(60);
            expect(applyAffixes(200, 2)).toBe(240);
        });

        test('should handle 0 base value', () => {
            expect(applyAffixes(0, 3)).toBe(0);
        });
    });

    describe('calculateItemValue', () => {
        test('should return base value for common item (rarity 1)', () => {
            expect(calculateItemValue(100, 1, 0)).toBe(100);
        });

        test('should apply 1.5× multiplier for uncommon (rarity 2)', () => {
            expect(calculateItemValue(100, 2, 0)).toBe(150);
        });

        test('should apply 2.5× multiplier for rare (rarity 3)', () => {
            expect(calculateItemValue(100, 3, 0)).toBe(250);
        });

        test('should apply 5.0× multiplier for epic (rarity 4)', () => {
            expect(calculateItemValue(100, 4, 0)).toBe(500);
        });

        test('should apply 10.0× multiplier for legendary (rarity 5)', () => {
            expect(calculateItemValue(100, 5, 0)).toBe(1000);
        });

        test('should add 20% value per affix', () => {
            calculateItemValue(100, 3, 0); // 250
            const with2Affixes = calculateItemValue(100, 3, 2); // 250 × 1.4 = 350
            expect(with2Affixes).toBe(Math.floor(250 * 1.4));
        });

        test('should combine rarity and affix bonuses', () => {
            // rare (2.5×) + 4 affixes (1.8×) = 2.5 × 1.8 = 4.5
            const value = calculateItemValue(100, 3, 4);
            expect(value).toBe(Math.floor(100 * 2.5 * 1.8));
        });

        test('legendary + 4 affixes should be ~18× base value', () => {
            // 10 × 1.8 = 18
            const value = calculateItemValue(100, 5, 4);
            expect(value).toBeGreaterThan(1700);
            expect(value).toBeLessThan(1900);
        });

        test('should return minimum 1 gold', () => {
            expect(calculateItemValue(0, 1, 0)).toBe(1);
        });

        test('should clamp rarity 1-5', () => {
            const val1 = calculateItemValue(100, 0, 0); // clamped to 1
            const val2 = calculateItemValue(100, 1, 0);
            expect(val1).toBe(val2);
        });

        test('should clamp affix count 0-4', () => {
            const val1 = calculateItemValue(100, 3, 10); // clamped to 4
            const val2 = calculateItemValue(100, 3, 4);
            expect(val1).toBe(val2);
        });
    });

    describe('generateLootPackage', () => {
        test('should return complete loot package', () => {
            const pkg = generateLootPackage(3, 10, 100, 42);
            expect(pkg.rarity).toBeDefined();
            expect(pkg.affixes).toBeDefined();
            expect(pkg.totalValue).toBeDefined();
            expect(pkg.weight).toBeDefined();
        });

        test('rarity should match calculateRarity', () => {
            const pkg = generateLootPackage(3, 15, 100, 42);
            const expected = calculateRarity(3, 15);
            expect(pkg.rarity).toBe(expected);
        });

        test('affixes should match generateLoot', () => {
            const pkg = generateLootPackage(4, 0, 100, 42);
            const expected = generateLoot(pkg.rarity, 42);
            expect(pkg.affixes).toEqual(expected);
        });

        test('totalValue should match calculateItemValue', () => {
            const pkg = generateLootPackage(3, 0, 100, 42);
            const expected = calculateItemValue(100, pkg.rarity, pkg.affixes.length);
            expect(pkg.totalValue).toBe(expected);
        });

        test('weight should be exponential by rarity', () => {
            const weights: Record<number, number> = {};
            const testCases = [
                { difficulty: 1, luck: 0 },  // rarity 1
                { difficulty: 2, luck: 0 },  // rarity 2
                { difficulty: 3, luck: 0 },  // rarity 2
                { difficulty: 4, luck: 10 }, // rarity 3 (base 3 + luck 0)
                { difficulty: 5, luck: 25 }, // rarity 5 (base 4 + luck 2)
            ];
            for (const tc of testCases) {
                const pkg = generateLootPackage(tc.difficulty, tc.luck, 100, 42);
                weights[pkg.rarity] = pkg.weight;
            }
            // Check that we have valid weights for rarity values we can generate
            expect(weights[1]).toBe(1);
            expect(weights[2]).toBe(2);
            // rarity 3+ depend on difficulty/luck combinations
            if (weights[3]) expect(weights[3]).toBe(4);
            if (weights[4]) expect(weights[4]).toBe(8);
            if (weights[5]) expect(weights[5]).toBe(16);
        });

        test('should generate higher value for higher difficulty', () => {
            const pkg1 = generateLootPackage(1, 0, 100, 42);
            const pkg5 = generateLootPackage(5, 0, 100, 42);
            expect(pkg5.totalValue).toBeGreaterThan(pkg1.totalValue);
        });

        test('should generate higher value for higher luck', () => {
            const pkg1 = generateLootPackage(3, 0, 100, 42);
            const pkg2 = generateLootPackage(3, 25, 100, 42);
            expect(pkg2.totalValue).toBeGreaterThanOrEqual(pkg1.totalValue);
        });

        test('should be deterministic with same inputs', () => {
            const pkg1 = generateLootPackage(3, 10, 100, 42);
            const pkg2 = generateLootPackage(3, 10, 100, 42);
            expect(pkg1).toEqual(pkg2);
        });

        test('should handle high base value', () => {
            const pkg = generateLootPackage(5, 0, 10000, 42);
            expect(pkg.totalValue).toBeGreaterThan(10000);
        });

        test('legendary item should have heavy weight (16 lbs)', () => {
            const pkg = generateLootPackage(5, 25, 100, 42); // high luck to get rarity 5
            expect(pkg.weight).toBe(16);
        });

        test('should not generate unreasonable values', () => {
            const pkg = generateLootPackage(5, 50, 1000, 42);
            expect(pkg.totalValue).toBeLessThan(500000); // sanity check
        });
    });

    describe('Integration - Loot generation flow', () => {
        test('high difficulty + high luck should give legendary items', () => {
            let legendaryCount = 0;
            for (let i = 0; i < 100; i++) {
                const pkg = generateLootPackage(5, 25, 100, 42 + i);
                if (pkg.rarity === 5) legendaryCount++;
            }
            expect(legendaryCount).toBeGreaterThan(0);
        });

        test('low difficulty + no luck should give common items', () => {
            let commonCount = 0;
            for (let i = 0; i < 100; i++) {
                const pkg = generateLootPackage(1, 0, 100, 42 + i);
                if (pkg.rarity === 1) commonCount++;
            }
            expect(commonCount).toBeGreaterThan(50); // at least half should be common
        });

        test('affix count should increase with rarity', () => {
            const packages: Record<number, number[]> = {
                1: [],
                2: [],
                3: [],
                4: [],
                5: [],
            };

            for (let i = 0; i < 20; i++) {
                const pkg = generateLootPackage(i % 5 + 1, 0, 100, 42 + i);
                packages[pkg.rarity].push(pkg.affixes.length);
            }

            // Each rarity tier should have consistent affix counts
            for (const count of packages[1]) expect(count).toBe(0);
            for (const count of packages[2]) expect(count).toBe(1);
            for (const count of packages[3]) expect(count).toBe(2);
            for (const count of packages[4]) expect(count).toBe(3);
            for (const count of packages[5]) expect(count).toBe(4);
        });

        test('item value should scale with rarity and affixes', () => {
            const pkg1 = generateLootPackage(1, 0, 100, 42);
            const pkg5 = generateLootPackage(5, 0, 100, 42);
            expect(pkg5.totalValue).toBeGreaterThan(pkg1.totalValue);
        });
    });
});
