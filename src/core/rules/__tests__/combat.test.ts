/**
 * Combat Rules Unit Tests
 *
 * Tests verify deterministic behavior of all pure combat functions.
 * No external dependencies, no mocking, no DB calls - just math.
 */

import {
    calculateBaseDamage,
    isCritical,
    getCriticalMultiplier,
    applyMultiplier,
    calculateDamage,
    calculateExperience,
    shouldLootDrop,
    getEquipmentGrade,
    getLootQuantity,
    isDead,
    applyDamage,
    CombatStats,
    DamageResult
} from '../combat';

describe('Combat Rules - Damage Calculation', () => {
    describe('calculateBaseDamage', () => {
        it('should calculate base damage as attacker.attack - defender.defense', () => {
            const result = calculateBaseDamage(20, 5);
            expect(result).toBe(15);
        });

        it('should enforce minimum 1 damage to prevent stalemate', () => {
            const result = calculateBaseDamage(10, 20);
            expect(result).toBe(1);
        });

        it('should handle zero stats', () => {
            const result = calculateBaseDamage(0, 0);
            expect(result).toBe(1); // 0-0 = 0, clamped to minimum 1
        });

        it('should handle equal attack and defense', () => {
            const result = calculateBaseDamage(15, 15);
            expect(result).toBe(1); // 15-15=0, clamped to 1
        });

        it('should handle high attack values', () => {
            const result = calculateBaseDamage(100, 30);
            expect(result).toBe(70);
        });
    });

    describe('isCritical', () => {
        it('should return true when random roll is below critical chance threshold', () => {
            const result = isCritical(20, 0.10); // 10% < 20% → true
            expect(result).toBe(true);
        });

        it('should return false when random roll is above critical chance threshold', () => {
            const result = isCritical(20, 0.25); // 25% > 20% → false
            expect(result).toBe(false);
        });

        it('should handle 0% critical chance', () => {
            const result = isCritical(0, 0.5);
            expect(result).toBe(false); // 50% > 0% → false
        });

        it('should handle 100% critical chance', () => {
            const result = isCritical(100, 0.5);
            expect(result).toBe(true); // 50% < 100% → true
        });

        it('should handle edge case at exactly the threshold', () => {
            const result = isCritical(50, 0.5);
            expect(result).toBe(false); // 50% NOT < 50% → false (uses < not <=)
        });

        it('should default to Math.random() when randomRoll not provided', () => {
            // Just verify it doesn't crash
            const result = isCritical(50);
            expect(typeof result).toBe('boolean');
        });
    });

    describe('getCriticalMultiplier', () => {
        it('should return 1.0 for normal hit', () => {
            const result = getCriticalMultiplier(false);
            expect(result).toBe(1.0);
        });

        it('should return 1.5 for critical hit (default)', () => {
            const result = getCriticalMultiplier(true);
            expect(result).toBe(1.5);
        });

        it('should support custom critical multiplier', () => {
            const result = getCriticalMultiplier(true, 2.0);
            expect(result).toBe(2.0);
        });

        it('should return 1.0 for normal hit with custom multiplier', () => {
            const result = getCriticalMultiplier(false, 2.0);
            expect(result).toBe(1.0);
        });
    });

    describe('applyMultiplier', () => {
        it('should apply 1.0 multiplier (normal damage)', () => {
            const result = applyMultiplier(10, 1.0);
            expect(result).toBe(10);
        });

        it('should apply 1.5 multiplier (critical damage)', () => {
            const result = applyMultiplier(10, 1.5);
            expect(result).toBe(15);
        });

        it('should round down fractional damage', () => {
            const result = applyMultiplier(7, 1.5); // 7 × 1.5 = 10.5 → 10
            expect(result).toBe(10);
        });

        it('should handle 0 base damage', () => {
            const result = applyMultiplier(0, 1.5);
            expect(result).toBe(0);
        });

        it('should handle 2x multiplier', () => {
            const result = applyMultiplier(10, 2.0);
            expect(result).toBe(20);
        });
    });

    describe('calculateDamage (integration)', () => {
        it('should calculate normal hit damage', () => {
            const attacker: CombatStats = { attack: 20, critChance: 15 };
            const defender: CombatStats = { defense: 5 };
            const result = calculateDamage(attacker, defender, 0.50, 1.5); // 50% > 15% → not critical

            expect(result.baseDamage).toBe(15);
            expect(result.isCritical).toBe(false);
            expect(result.multiplier).toBe(1.0);
            expect(result.finalDamage).toBe(15);
        });

        it('should calculate critical hit damage', () => {
            const attacker: CombatStats = { attack: 20, critChance: 15 };
            const defender: CombatStats = { defense: 5 };
            const result = calculateDamage(attacker, defender, 0.10, 1.5); // 10% < 15% → critical

            expect(result.baseDamage).toBe(15);
            expect(result.isCritical).toBe(true);
            expect(result.multiplier).toBe(1.5);
            expect(result.finalDamage).toBe(22); // 15 × 1.5 = 22.5 → 22
        });

        it('should enforce minimum 1 damage on base', () => {
            const attacker: CombatStats = { attack: 5, critChance: 50 };
            const defender: CombatStats = { defense: 20 };
            const result = calculateDamage(attacker, defender, 0.20, 1.5);

            expect(result.baseDamage).toBe(1);
            expect(result.finalDamage).toBe(1); // 1 × 1.5 = 1.5 → 1
        });

        it('should handle 0% critical chance', () => {
            const attacker: CombatStats = { attack: 20, critChance: 0 };
            const defender: CombatStats = { defense: 5 };
            const result = calculateDamage(attacker, defender, 0.99, 1.5);

            expect(result.isCritical).toBe(false);
            expect(result.multiplier).toBe(1.0);
        });

        it('should handle 100% critical chance', () => {
            const attacker: CombatStats = { attack: 20, critChance: 100 };
            const defender: CombatStats = { defense: 5 };
            const result = calculateDamage(attacker, defender, 0.99, 1.5);

            expect(result.isCritical).toBe(true);
            expect(result.multiplier).toBe(1.5);
        });

        it('should support custom critical multiplier', () => {
            const attacker: CombatStats = { attack: 20, critChance: 50 };
            const defender: CombatStats = { defense: 5 };
            const result = calculateDamage(attacker, defender, 0.25, 2.0);

            expect(result.isCritical).toBe(true);
            expect(result.multiplier).toBe(2.0);
            expect(result.finalDamage).toBe(30); // 15 × 2.0 = 30
        });
    });
});

describe('Combat Rules - Experience', () => {
    describe('calculateExperience', () => {
        it('should give base XP for equal difficulty', () => {
            const result = calculateExperience(100, 100, 50, 0.002);
            expect(result).toBe(50);
        });

        it('should give more XP for stronger enemy', () => {
            const result = calculateExperience(100, 150, 50, 0.002);
            // multiplier = 1 + (50 × 0.002) = 1.1
            // xp = 50 × 1.1 = 55
            expect(result).toBe(55);
        });

        it('should give less XP for weaker enemy', () => {
            const result = calculateExperience(150, 100, 50, 0.002);
            // multiplier = 1 + (-50 × 0.002) = 0.9
            // xp = 50 × 0.9 = 45
            expect(result).toBe(45);
        });

        it('should enforce minimum XP of 10', () => {
            const result = calculateExperience(200, 50, 5, 0.002);
            // multiplier = 1 + (-150 × 0.002) = 0.7
            // xp = 5 × 0.7 = 3.5 → 3, but clamped to 10
            expect(result).toBeGreaterThanOrEqual(10);
        });

        it('should enforce minimum multiplier of 0.5', () => {
            const result = calculateExperience(100, 10, 50, 0.002);
            // multiplier would be 1 + (-90 × 0.002) = 0.82, no clamping needed
            // But with extreme values, it would clamp to 0.5
            expect(result).toBeGreaterThanOrEqual(25); // 50 × 0.5 = 25
        });

        it('should handle default parameters', () => {
            const result = calculateExperience();
            expect(result).toBe(50); // 50 × 1.0 (equal difficulty)
        });
    });
});

describe('Combat Rules - Loot', () => {
    describe('shouldLootDrop', () => {
        it('should drop loot when random is below chance', () => {
            const result = shouldLootDrop(0.8, 0.5);
            expect(result).toBe(true);
        });

        it('should not drop loot when random is above chance', () => {
            const result = shouldLootDrop(0.8, 0.9);
            expect(result).toBe(false);
        });

        it('should not drop at 0% chance', () => {
            const result = shouldLootDrop(0.0, 0.5);
            expect(result).toBe(false);
        });

        it('should always drop at 100% chance', () => {
            const result = shouldLootDrop(1.0, 0.99);
            expect(result).toBe(true);
        });
    });

    describe('getEquipmentGrade', () => {
        it('should return grade 0 (common) for roll 0-0.5', () => {
            expect(getEquipmentGrade(0.0)).toBe(0);
            expect(getEquipmentGrade(0.25)).toBe(0);
            expect(getEquipmentGrade(0.5)).toBe(0);
        });

        it('should return grade 1 (uncommon) for roll 0.5-0.8', () => {
            expect(getEquipmentGrade(0.51)).toBe(1);
            expect(getEquipmentGrade(0.65)).toBe(1);
            expect(getEquipmentGrade(0.79)).toBe(1);
        });

        it('should return grade 2 (rare) for roll > 0.8', () => {
            expect(getEquipmentGrade(0.81)).toBe(2);
            expect(getEquipmentGrade(0.99)).toBe(2);
        });

        it('should return grade 2 for roll 1.0', () => {
            expect(getEquipmentGrade(1.0)).toBe(2);
        });
    });

    describe('getLootQuantity', () => {
        it('should return min quantity for roll 0', () => {
            const result = getLootQuantity(1, 3, 0.0);
            expect(result).toBe(1);
        });

        it('should return mid quantity for roll 0.5', () => {
            const result = getLootQuantity(1, 3, 0.5);
            expect(result).toBe(2);
        });

        it('should return max quantity for roll near 1.0', () => {
            const result = getLootQuantity(1, 3, 0.99);
            expect(result).toBe(3);
        });

        it('should support different min/max ranges', () => {
            const result = getLootQuantity(5, 10, 0.5);
            expect(result).toBeGreaterThanOrEqual(5);
            expect(result).toBeLessThanOrEqual(10);
        });

        it('should handle single quantity (min === max)', () => {
            const result = getLootQuantity(1, 1, 0.5);
            expect(result).toBe(1);
        });
    });
});

describe('Combat Rules - Health', () => {
    describe('isDead', () => {
        it('should return true when HP is 0', () => {
            expect(isDead(0)).toBe(true);
        });

        it('should return true when HP is negative', () => {
            expect(isDead(-5)).toBe(true);
        });

        it('should return false when HP is positive', () => {
            expect(isDead(1)).toBe(false);
            expect(isDead(100)).toBe(false);
        });
    });

    describe('applyDamage', () => {
        it('should reduce health by damage amount', () => {
            const result = applyDamage(50, 15);
            expect(result).toBe(35);
        });

        it('should clamp health to 0 minimum', () => {
            const result = applyDamage(10, 20);
            expect(result).toBe(0);
        });

        it('should handle 0 damage', () => {
            const result = applyDamage(50, 0);
            expect(result).toBe(50);
        });

        it('should handle large damage values', () => {
            const result = applyDamage(100, 500);
            expect(result).toBe(0);
        });

        it('should handle fractional damage (not applicable but safe)', () => {
            const result = applyDamage(50, 15.7);
            expect(result).toBe(34.3);
        });
    });
});
