/**
 * Pure Experience & Level Progression Rules
 *
 * OVERVIEW: Centralized experience gain calculations with no side effects.
 * All formulas are configuration-driven via combatConfig.
 *
 * ## Core Concepts
 *
 * **Experience Gain:** XP awarded for defeating enemies, completing quests, discoveries, etc.
 * **Level Progression:** XP accumulated until threshold reached, then player levels up.
 * **Scaling:** Both gain amount and threshold scale exponentially for balance.
 *
 * ## Pure Functions (No side effects, deterministic)
 *
 * - calculateExperienceGain() → XP for killing enemy
 * - calculateXpForLevel() → XP required to reach specific level
 * - calculateCumulativeXp() → Total XP from level 1 to N
 * - calculateLevelFromXp() → What level has this total XP
 *
 * All use combatConfig for tuning without code changes.
 */

import { combatConfig } from '@/lib/config';

/**
 * calculateExperienceGain
 *
 * Pure function to calculate XP reward for defeating an enemy based on health difference.
 *
 * @remarks
 * **Formula:**
 * ```
 * healthDiff = enemyMaxHealth - playerMaxHealth
 * multiplier = clamp(1.0 + healthDiff × 0.002, 0.5, ∞)
 * xp = max(10, floor(baseXp × multiplier))
 * ```
 *
 * **Logic:**
 * 1. Health difference indicates difficulty (proxy for level/strength)
 * 2. Multiplier adjusts base XP: +1% per 50 HP advantage, -1% per 50 HP disadvantage
 * 3. Minimum 0.5× (prevents extreme penalties for very weak enemies)
 * 4. Minimum 10 XP (never award trivial amounts)
 *
 * **Design Intent:**
 * - Stronger enemies (higher health) grant more XP
 * - Weaker enemies grant reduced XP (but not zero)
 * - Health used as proxy for level (avoids level stat requirement)
 * - Scalable: adjust baseXp in combatConfig to tune all enemies at once
 *
 * **Edge Cases Handled:**
 * - Equal health → multiplier ≈ 1.0 → baseXp reward
 * - Enemy much stronger → multiplier ≈ 1.5+ → bonus XP
 * - Enemy much weaker → multiplier ≈ 0.5 (clamped) → reduced XP
 *
 * @param playerMaxHealth - Player's maximum HP (typically 100)
 * @param enemyMaxHealth - Enemy's maximum HP (difficulty indicator)
 * @param baseXp - Base XP value before multiplier (default: combatConfig.baseXp = 50)
 * @returns XP gained as integer (minimum 10, typically 40-70 for balanced fights)
 *
 * @example
 * calculateExperienceGain(100, 150) // Stronger enemy (+50 HP)
 * // multiplier = 1 + (150-100) × 0.002 = 1.1
 * // xp = floor(50 × 1.1) = 55 (bonus XP)
 *
 * @example
 * calculateExperienceGain(100, 80) // Weaker enemy (-20 HP)
 * // multiplier = 1 + (80-100) × 0.002 = 0.96
 * // xp = floor(50 × 0.96) = 48 (reduced XP)
 */
export function calculateExperienceGain(
    playerMaxHealth: number = 100,
    enemyMaxHealth: number = 100,
    baseXp: number = combatConfig.baseXp
): number {
    const healthDiff = enemyMaxHealth - playerMaxHealth;
    const multiplier = Math.max(0.5, 1 + healthDiff * 0.002);
    const xpGain = Math.floor(baseXp * multiplier);
    return Math.max(10, xpGain);
}

/**
 * calculateXpForLevel
 *
 * Pure function to calculate XP required to progress from one level to the next.
 *
 * @remarks
 * **Formula:**
 * ```
 * xpNeeded(level) = baseXp × xpCurveBase^(level-2)
 * ```
 *
 * **Logic:**
 * 1. Exponential scaling ensures early levels are fast, late levels are slow
 * 2. Encourages early progression and long-term engagement
 * 3. Ratio between consecutive levels: constant (xpCurveBase, typically 1.5)
 *
 * **Examples (with baseXp=50, xpCurveBase=1.5):**
 * - Level 1 to 2: 50 XP
 * - Level 2 to 3: 75 XP (50% more)
 * - Level 3 to 4: 112 XP (50% more)
 * - Level 10 to 11: 2420 XP
 *
 * **Design:** Configurable progression curve without code changes.
 * Adjust combatConfig.baseXp and combatConfig.xpCurveBase to rebalance all levels.
 *
 * @param level - Target level (1-based). Level 1→2 requires returned amount.
 * @returns XP required to reach this level from previous level
 *
 * @example
 * calculateXpForLevel(2) // 50 (to go from level 1 to 2)
 * calculateXpForLevel(5) // 169 (to go from level 4 to 5)
 */
export function calculateXpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(
        combatConfig.baseXp * Math.pow(combatConfig.xpCurveBase, level - 2)
    );
}

/**
 * calculateCumulativeXp
 *
 * Pure function to calculate total XP needed to reach a level from level 1.
 *
 * @remarks
 * **Formula:**
 * ```
 * cumulativeXp(level) = sum of calculateXpForLevel(i) for i = 2 to level
 * ```
 *
 * **Logic:**
 * 1. Sum all XP requirements from level 2 up to target level
 * 2. Represents total progression investment (useful for progress bars, stats displays)
 * 3. Exponential curve means late levels dominate total (e.g., level 20 = 50% of level 30 total)
 *
 * **Examples (with baseXp=50, xpCurveBase=1.5):**
 * - Level 1: 0 XP (starting point)
 * - Level 2: 50 XP (0 + 50)
 * - Level 3: 125 XP (50 + 75)
 * - Level 5: 450 XP (50 + 75 + 112 + 169)
 * - Level 10: 2,419 XP
 *
 * **Uses:**
 * - Character status: Show "X,234 / 50,000 XP to level 20"
 * - Progress visualization: percentage = currentXp / requiredXp
 * - Save/load: Store total XP, derive level from cumulative lookup
 *
 * @param level - Target level to calculate cumulative XP for
 * @returns Total XP accumulated from level 1 to this level
 *
 * @example
 * calculateCumulativeXp(1) // 0
 * calculateCumulativeXp(3) // 125 (50 + 75)
 * calculateCumulativeXp(5) // 450
 */
export function calculateCumulativeXp(level: number): number {
    let total = 0;
    for (let i = 2; i <= level; i++) {
        total += calculateXpForLevel(i);
    }
    return total;
}

/**
 * calculateLevelFromXp
 *
 * Pure function to determine character level based on cumulative XP.
 *
 * @remarks
 * **Logic:**
 * 1. Binary search or linear search for level threshold
 * 2. Find highest level where cumulativeXp >= totalXp
 * 3. Current implementation: linear (good for up to level 100)
 * 4. Could optimize to binary search if capping at level 1000+
 *
 * **Uses:**
 * - After gaining XP: gainExperience(50) → level might increase
 * - Save/load: Load totalXp from save, derive current level
 * - Display: Show "Level 15" to player based on their XP
 *
 * **Edge Cases:**
 * - 0 XP → Level 1
 * - 1000000 XP → Level ~40+
 * - Negative XP → Clamped to 1 (handled in caller)
 *
 * @param totalXp - Total cumulative XP earned
 * @returns Character level (minimum 1)
 *
 * @example
 * calculateLevelFromXp(0) // 1 (starting level)
 * calculateLevelFromXp(50) // 2 (just reached level 2)
 * calculateLevelFromXp(450) // 5 (enough for level 5)
 */
export function calculateLevelFromXp(totalXp: number): number {
    let level = 1;
    // Iterate until we exceed available XP or hit a practical level cap (100)
    while (level < 100 && calculateCumulativeXp(level + 1) <= totalXp) {
        level++;
    }
    return level;
}

/**
 * calculateLevelUpBonus
 *
 * Pure function to calculate stat bonuses when leveling up.
 *
 * @remarks
 * **Formula:**
 * - Skill Points: 1 per level
 * - Stat Points: 1 per level (can be distributed by player)
 * - Max Health: +10 HP per level
 * - Ability Unlocks: Certain levels unlock new abilities
 *
 * Returns structured object for easy use in usecases.
 * Tunable via combatConfig if needed in future.
 *
 * @param newLevel - The level just reached
 * @returns Object with skill points, stat points, HP bonus
 *
 * @example
 * calculateLevelUpBonus(5) // { skillPoints: 1, statPoints: 1, maxHealthBonus: 10 }
 */
export function calculateLevelUpBonus(newLevel: number): {
    skillPoints: number;
    statPoints: number;
    maxHealthBonus: number;
} {
    return {
        skillPoints: 1,
        statPoints: 1,
        maxHealthBonus: 10,
        // Note: Ability unlocks (e.g., level 5 = fireball) handled in usecases/achievements
    };
}
