/**
 * Combat Rules Engine - Pure Functions for Damage Calculation
 *
 * These are PURE FUNCTIONS:
 * - No external dependencies (no hooks, no DB, no audio)
 * - Deterministic: same input → same output
 * - Stateless: no internal variables or mutations
 * - All dependencies passed as arguments
 *
 * Combat Math:
 * - Base Damage = Attacker.attack - Defender.defense (minimum 1)
 * - Critical Chance = Attacker.critChance / 100
 * - Critical Hit = base damage × critMultiplier (configurable)
 *
 * @example
 * ```typescript
 * const attacker = { attack: 20, critChance: 15 };
 * const defender = { defense: 5 };
 * const isCrit = Math.random() < 0.15;
 *
 * const damage = calculateDamage(attacker, defender, isCrit);
 * // Returns: { baseDamage: 15, isCritical: true, finalDamage: 22 }
 * ```
 */

import { GAME_BALANCE } from '@/config/game-balance';

/**
 * Creature stats needed for combat calculations
 * (matches Creature type from core/domain)
 */
export interface CombatStats {
    attack?: number;
    defense?: number;
    critChance?: number; // 0-100 (percentage)
    maxHp?: number;
    hp?: number;
}

/**
 * Result of a damage calculation
 */
export interface DamageResult {
    baseDamage: number;
    isCritical: boolean;
    finalDamage: number;
    multiplier: number;
}

/**
 * Calculate base damage: Attacker Power - Defender Power
 *
 * @remarks
 * **Formula:** `baseDamage = Math.max(1, attack - defense)`
 *
 * **Logic:**
 * 1. Subtract defender's defense from attacker's attack
 * 2. Clamp to minimum of 1 to prevent zero-damage stalemate
 *
 * **Edge Cases:**
 * - Negative defense treated as 0 (no penalty beyond 0)
 * - High defense can never eliminate damage entirely
 *
 * @param attackerAttack - Attacker's attack stat (damage dealt)
 * @param defenderDefense - Defender's defense stat (damage reduction)
 * @returns Base damage integer (always >= 1)
 *
 * @example
 * calculateBaseDamage(20, 5) → 15 (normal hit)
 * calculateBaseDamage(10, 20) → 1 (clamped minimum)
 * calculateBaseDamage(0, 0) → 1 (minimum guarantee)
 */
export function calculateBaseDamage(
    attackerAttack: number = 0,
    defenderDefense: number = 0
): number {
    return Math.max(GAME_BALANCE.COMBAT.MIN_DAMAGE, attackerAttack - defenderDefense);
}

/**
 * Determine if an attack is critical based on attacker's crit chance
 *
 * @remarks
 * **Formula:** `threshold = critChance / 100; isCrit = randomRoll < threshold`
 *
 * **Logic:**
 * 1. Convert percentage-based critical chance (0-100) to decimal threshold (0.0-1.0)
 * 2. Compare random roll against threshold
 * 3. If roll is below threshold, attack is critical
 *
 * **RNG Injection:** For testing, `randomRoll` parameter allows deterministic values.
 * For production, default `Math.random()` is used.
 *
 * **Edge Cases:**
 * - 0% crit chance always returns false
 * - 100% crit chance always returns true (if randomRoll < 1.0)
 * - Probability threshold is strict inequality (<, not <=)
 *
 * @param critChance - Critical chance percentage (0-100, e.g., 15 = 15%)
 * @param randomRoll - Random value 0.0-1.0 (injectable for testing)
 * @returns true if critical hit triggered, false otherwise
 *
 * @example
 * isCritical(15, 0.10) → true (10% < 15% threshold)
 * isCritical(15, 0.20) → false (20% > 15% threshold)
 * isCritical(0, 0.05) → false (0% chance never crits)
 */
export function isCritical(critChance: number = 0, randomRoll: number = Math.random()): boolean {
    const critThreshold = critChance / 100;
    return randomRoll < critThreshold;
}

/**
 * Calculate critical hit multiplier based on hit type
 *
 * @remarks
 * **Logic:**
 * - Critical hit: return custom multiplier (e.g., 1.5 = 50% damage boost)
 * - Normal hit: return 1.0 (no modifier)
 *
 * **Multiplier Meaning:**
 * - 1.0 = no change
 * - 1.5 = 50% increase
 * - 2.0 = 100% increase (double damage)
 *
 * @param isCrit - Whether this attack is a critical hit
 * @param critMultiplier - Damage multiplier for crits (default 1.5, e.g., 50% boost)
 * @returns Multiplier value (1.0 or critMultiplier)
 *
 * @example
 * getCriticalMultiplier(true, 1.5) → 1.5 (critical 50% boost)
 * getCriticalMultiplier(false, 1.5) → 1.0 (normal hit, no boost)
 * getCriticalMultiplier(true, 2.0) → 2.0 (critical double damage)
 */
export function getCriticalMultiplier(
    isCrit: boolean,
    critMultiplier: number = GAME_BALANCE.COMBAT.CRIT_MULTIPLIER
): number {
    return isCrit ? critMultiplier : 1.0;
}

/**
 * Calculate final damage after applying critical hit multiplier
 *
 * @remarks
 * **Formula:** `finalDamage = Math.floor(baseDamage × multiplier)`
 *
 * **Logic:**
 * 1. Multiply base damage by the critical multiplier
 * 2. Round down to nearest integer using `Math.floor()`
 *
 * **Multiplier Examples:**
 * - 1.0 = no modification (normal hit)
 * - 1.5 = 50% increase (typical critical)
 * - 2.0 = 100% increase (double damage)
 *
 * **Rounding:** Fractional damage always rounds down (e.g., 10.9 → 10)
 *
 * @param baseDamage - Base damage (already attack - defense)
 * @param multiplier - Multiplier to apply (1.0 = normal, >1.0 = boost)
 * @returns Final integer damage (rounded down)
 *
 * @example
 * applyMultiplier(10, 1.0) → 10 (no change)
 * applyMultiplier(10, 1.5) → 15 (50% boost: 10 × 1.5 = 15)
 * applyMultiplier(7, 1.5) → 10 (fractional rounds down: 7 × 1.5 = 10.5 → 10)
 */
export function applyMultiplier(baseDamage: number, multiplier: number = 1.0): number {
    return Math.floor(baseDamage * multiplier);
}

/**
 * Complete damage calculation orchestrating all combat steps
 *
 * @remarks
 * **Orchestration Steps:**
 * 1. Calculate base damage: `attacker.attack - defender.defense` (min 1)
 * 2. Determine critical hit: `random < (critChance / 100)`
 * 3. Get multiplier: 1.0 (normal) or custom value (crit)
 * 4. Apply multiplier: `floor(baseDamage × multiplier)`
 *
 * **Formula (Normal Hit):**
 * `finalDamage = attack - defense` (minimum 1)
 *
 * **Formula (Critical Hit):**
 * `finalDamage = floor((attack - defense) × critMultiplier)`
 *
 * **RNG Injection:** The `randomRoll` parameter allows deterministic testing.
 * For production, default `Math.random()` is used.
 *
 * **Return Object:** Contains all intermediate results for transparency and audit trail.
 *
 * @param attacker - Attacker stats (must include attack and critChance)
 * @param defender - Defender stats (must include defense)
 * @param randomRoll - Random 0.0-1.0 for critical chance determination (injectable)
 * @param critMultiplier - Damage multiplier for critical hits (default 1.5 = 50% boost)
 * @returns DamageResult with baseDamage, isCritical, finalDamage, and multiplier applied
 *
 * @example
 * const attacker = { attack: 20, critChance: 20 };
 * const defender = { defense: 5 };
 * const result = calculateDamage(attacker, defender, 0.10, 1.5);
 * // Returns: {
 * //   baseDamage: 15,        // 20 - 5
 * //   isCritical: true,      // 10% < 20%
 * //   finalDamage: 22,       // floor(15 × 1.5) = 22
 * //   multiplier: 1.5
 * // }
 */
export function calculateDamage(
    attacker: CombatStats,
    defender: CombatStats,
    randomRoll: number = Math.random(),
    critMultiplier: number = GAME_BALANCE.COMBAT.CRIT_MULTIPLIER
): DamageResult {
    const baseDamage = calculateBaseDamage(attacker.attack, defender.defense);
    const isCrit = isCritical(attacker.critChance, randomRoll);
    const multiplier = getCriticalMultiplier(isCrit, critMultiplier);
    const finalDamage = applyMultiplier(baseDamage, multiplier);

    return {
        baseDamage,
        isCritical: isCrit,
        finalDamage,
        multiplier
    };
}

/**
 * Calculate experience gained from defeating a combatant
 *
 * @remarks
 * **Formula:** `xp = Math.max(10, floor(baseXp × (1 + healthDiff × multiplier)))`
 *
 * **Logic:**
 * 1. Calculate health difference: `loserMaxHealth - winnerMaxHealth`
 * 2. Calculate multiplier: `1 + (healthDiff × healthDiffMultiplier)`
 * 3. Clamp multiplier to 0.5 minimum (prevents negative XP)
 * 4. Calculate XP: `floor(baseXp × multiplier)`
 * 5. Enforce minimum of 10 XP (avoid trivial rewards)
 *
 * **Difficulty Proxy:** Uses health (HP) as difficulty indicator.
 * - Enemies with higher max HP grant more XP (assumed stronger)
 * - Enemies weaker than player grant reduced XP (multiplier < 1.0)
 * - Default 0.002 multiplier means +1% XP per 50 HP difference
 *
 * **Edge Cases:**
 * - Equal health → multiplier = 1.0 (normal XP)
 * - Stronger opponent → multiplier > 1.0 (bonus XP)
 * - Much weaker opponent → multiplier ≥ 0.5 (clamped minimum)
 *
 * @param winnerMaxHealth - Winner's max HP (assumed player/victor)
 * @param loserMaxHealth - Loser's max HP (assumed enemy/defeated)
 * @param baseXp - Base XP award (typical 50, configurable)
 * @param healthDiffMultiplier - XP scaling per HP diff (default 0.002 = 0.2% per HP)
 * @returns Final XP gained integer (minimum 10)
 *
 * @example
 * calculateExperience(100, 150, 50, 0.002)
 * // Difference: 150 - 100 = 50
 * // Multiplier: 1 + (50 × 0.002) = 1.1
 * // XP: floor(50 × 1.1) = 55
 *
 * calculateExperience(100, 50, 50, 0.002)
 * // Difference: 50 - 100 = -50
 * // Multiplier: 1 + (-50 × 0.002) = 0.9
 * // XP: floor(50 × 0.9) = 45
 */
export function calculateExperience(
    winnerMaxHealth: number = 100,
    loserMaxHealth: number = 100,
    baseXp: number = 50,
    healthDiffMultiplier: number = 0.002
): number {
    const healthDiff = loserMaxHealth - winnerMaxHealth;
    const multiplier = Math.max(0.5, 1 + healthDiff * healthDiffMultiplier);
    const xpGain = Math.floor(baseXp * multiplier);
    return Math.max(10, xpGain);
}

/**
 * Determine if loot item drops based on probability
 *
 * @remarks
 * **Formula:** `drops = randomRoll < dropChance`
 *
 * **Logic:**
 * 1. Generate or receive random value 0.0-1.0
 * 2. Compare against dropChance threshold
 * 3. If random is strictly below threshold, item drops
 *
 * **Probability Notes:**
 * - dropChance of 0.8 = 80% chance to drop
 * - Threshold is strict inequality (<, not <=)
 * - Used for loot generation, skill procs, enchantments
 *
 * **RNG Injection:** For testing, pass deterministic values.
 * For production, default `Math.random()` is used.
 *
 * @param dropChance - Drop probability 0.0-1.0 (e.g., 0.8 = 80% chance)
 * @param randomRoll - Random value 0.0-1.0 (injectable for testing)
 * @returns true if item drops (roll < chance), false otherwise
 *
 * @example
 * shouldLootDrop(0.8, 0.5) → true (50% < 80%)
 * shouldLootDrop(0.8, 0.9) → false (90% > 80%)
 * shouldLootDrop(0.0, 0.5) → false (0% drop chance never triggers)
 */
export function shouldLootDrop(dropChance: number, randomRoll: number = Math.random()): boolean {
    return randomRoll < dropChance;
}

/**
 * Determine equipment rarity grade from random roll
 *
 * @remarks
 * **Distribution (by rarity threshold):**
 * - Grade 0 (Common): 0.0 ≤ roll ≤ 0.5 (50%)
 * - Grade 1 (Uncommon): 0.5 < roll ≤ 0.8 (30%)
 * - Grade 2 (Rare): 0.8 < roll ≤ 1.0 (20%)
 *
 * **Logic:**
 * 1. If roll ≤ 0.5 → Grade 0 (common)
 * 2. Else if roll ≤ 0.8 → Grade 1 (uncommon)
 * 3. Else → Grade 2 (rare)
 *
 * **Note:** Grade determines stats, appearance, and sellvalue in equipment systems.
 *
 * @param randomRoll - Random value 0.0-1.0 (injectable for testing)
 * @returns Equipment grade: 0 (common), 1 (uncommon), 2 (rare)
 *
 * @example
 * getEquipmentGrade(0.25) → 0 (common: 25% < 50%)
 * getEquipmentGrade(0.65) → 1 (uncommon: 50% < 65% ≤ 80%)
 * getEquipmentGrade(0.95) → 2 (rare: 95% > 80%)
 */
export function getEquipmentGrade(randomRoll: number = Math.random()): 0 | 1 | 2 {
    if (randomRoll <= 0.5) return 0;
    if (randomRoll <= 0.8) return 1;
    return 2;
}

/**
 * Calculate loot quantity within a min-max range
 *
 * @remarks
 * **Formula:** `qty = floor(randomRoll × (maxQty - minQty + 1)) + minQty`
 *
 * **Logic:**
 * 1. Calculate range size: `maxQty - minQty + 1` (+1 to include max)
 * 2. Scale random to range: `floor(randomRoll × range)`
 * 3. Offset by minimum: add `minQty` to shift to target range
 *
 * **Distribution:** Uniform probability across all values in [minQty, maxQty].
 *
 * **Edge Cases:**
 * - minQty = maxQty → always returns minQty
 * - randomRoll near 0.0 → returns minQty
 * - randomRoll near 1.0 → returns maxQty
 *
 * @param minQty - Minimum quantity (inclusive)
 * @param maxQty - Maximum quantity (inclusive)
 * @param randomRoll - Random value 0.0-1.0 (injectable for testing)
 * @returns Quantity integer between minQty and maxQty (both inclusive)
 *
 * @example
 * getLootQuantity(1, 3, 0.0) → 1 (minimum)
 * getLootQuantity(1, 3, 0.5) → 2 (middle)
 * getLootQuantity(1, 3, 0.99) → 3 (maximum)
 * getLootQuantity(5, 5, 0.5) → 5 (single value range)
 */
export function getLootQuantity(
    minQty: number = 1,
    maxQty: number = 1,
    randomRoll: number = Math.random()
): number {
    return Math.floor(randomRoll * (maxQty - minQty + 1)) + minQty;
}

/**
 * Check if a creature is dead based on health
 *
 * @remarks
 * **Logic:** A creature is dead when `currentHp ≤ 0`.
 *
 * **Note:**
 * - Death is permanent (no resurrection in this function)
 * - Negative HP is valid (overkill tracking)
 * - Used to determine combat end conditions and loot eligibility
 *
 * @param currentHp - Current health value (can be negative)
 * @returns true if dead (HP ≤ 0), false if alive (HP > 0)
 *
 * @example
 * isDead(0) → true (exactly dead)
 * isDead(-5) → true (overkill)
 * isDead(1) → false (alive)
 */
export function isDead(currentHp: number): boolean {
    return currentHp <= 0;
}

/**
 * Apply damage to current health
 *
 * @remarks
 * **Formula:** `newHp = Math.max(0, currentHp - damage)`
 *
 * **Logic:**
 * 1. Subtract damage from current HP
 * 2. Clamp result to 0 minimum (prevents negative healing)
 * 3. Return new health value
 *
 * **Clamping Behavior:**
 * - Overkill (damage > HP) results in 0, not negative
 * - Note: If tracking overkill is needed, store original HP separately
 *
 * **Invariant:** Result is always ≥ 0
 *
 * @param currentHp - Current health before damage (any non-negative value)
 * @param damage - Damage amount to subtract (non-negative)
 * @returns New health (0 minimum, clamped)
 *
 * @example
 * applyDamage(50, 15) → 35 (normal damage)
 * applyDamage(10, 20) → 0 (overkill clamped to 0)
 * applyDamage(100, 0) → 100 (no damage)
 */
export function applyDamage(currentHp: number, damage: number): number {
    return Math.max(0, currentHp - damage);
}
