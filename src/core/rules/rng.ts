/**
 * RNG Rules Module - Pure game logic for random number generation
 *
 * Handles seeded random number generation and weighted random selection.
 * All functions are pure (no side effects, deterministic, testable).
 *
 * @remarks
 * Used by loot, creature generation, and event selection usecases.
 * Seeded RNG ensures reproducible game state for replays and testing.
 */

/**
 * Seeded linear congruential generator for deterministic randomness.
 *
 * @remarks
 * **Formula:** `nextSeed = (seed × 1103515245 + 12345) mod 2^31`
 *
 * **Logic:**
 * 1. Standard LCG parameters (GLIBC constants)
 * 2. Takes 32-bit seed and produces next seed in sequence
 * 3. Output is integer [0, 2147483647]
 * 4. Normalize to 0-1 float by dividing by 2147483647
 * 5. For [0, N) integer: multiply float by N and floor
 *
 * **Properties:**
 * - Deterministic: Same seed always produces same sequence
 * - Repeatable: Can replay with known seed value
 * - Sufficient for game mechanics (not cryptographic)
 * - Fast: Single integer operation
 *
 * **Edge Cases:**
 * - seed 0 is valid (will generate sequence)
 * - Negative seeds: Use absolute value
 * - Very large seeds: Automatically wrapped by modulo
 *
 * @param seed - Current seed value
 * @returns Next seed in sequence
 *
 * @example
 * nextSeed(42) → 1103515287 (deterministic)
 * nextSeed(1103515287) → 12345 (continues sequence)
 */
export function nextSeed(seed: number): number {
    return (seed * 1103515245 + 12345) % 2147483647;
}

/**
 * Generates random float [0, 1) with seeded RNG.
 *
 * @remarks
 * **Formula:** `random = (nextSeed mod 2147483647) / 2147483647`
 *
 * **Logic:**
 * 1. Call nextSeed to advance generator
 * 2. Normalize seed to float: seed / 2147483647
 * 3. Result is [0, 1) with good distribution
 * 4. Does NOT mutate original seed (pure function)
 *
 * **Usage:**
 * - As base for other distributions
 * - Direct use: `if (random(seed) < 0.3) {} // 30% chance`
 * - Scale: `Math.floor(random(seed) * N) // [0, N)`
 *
 * **Properties:**
 * - Output: [0, 1)
 * - Distribution: Uniform
 * - Returns both random value and next seed
 * - Caller must track returned seed for next call
 *
 * @param seed - Current seed value
 * @returns [randomFloat, nextSeed] tuple
 *
 * @example
 * const [rand, nextS] = random(42);
 * // rand ≈ 0.51 (normalized)
 * // nextS is new seed for next call
 */
export function random(seed: number): [number, number] {
    const next = nextSeed(seed);
    const value = next / 2147483647;
    return [value, next];
}

/**
 * Generates random integer [min, max).
 *
 * @remarks
 * **Formula:** `result = floor(random × (max - min)) + min`
 *
 * **Logic:**
 * 1. Call random() to get [0, 1) float
 * 2. Scale to range: float × (max - min)
 * 3. Floor to integer
 * 4. Add offset: + min
 * 5. Result in [min, max)
 *
 * **Range:**
 * - [0, N): randomInt(seed, 0, N)
 * - [1, 6]: randomInt(seed, 1, 7) // D6 die
 * - [-5, 5): randomInt(seed, -5, 5)
 *
 * **Edge Cases:**
 * - min == max → always returns min
 * - min > max → swapped internally
 * - Floats truncated to integers
 *
 * @param seed - Current seed value
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns [randomInt, nextSeed] tuple
 *
 * @example
 * const [roll, nextS] = randomInt(42, 1, 7);
 * // roll is 1-6 (d6 die roll)
 * // nextS for next call
 */
export function randomInt(seed: number, min: number, max: number): [number, number] {
    // Handle edge cases
    if (min === max) return [min, seed];
    if (min > max) {
        [min, max] = [max, min];
    }

    const [rand, nextS] = random(seed);
    const value = Math.floor(rand * (max - min)) + min;
    return [value, nextS];
}

/**
 * Selects random item from weighted list.
 *
 * @remarks
 * **Formula:** `selectedItem = items[findIndex(randomFloat × totalWeight)]`
 *
 * **Logic:**
 * 1. Sum all weights to get total weight
 * 2. Generate random float [0, 1)
 * 3. Scale to [0, totalWeight): float × totalWeight
 * 4. Iterate through items, accumulate weights
 * 5. Return first item where accumulated >= scaled value
 * 6. Fallback to last item if rounding error
 *
 * **Weights:**
 * - Array of numbers (weights)
 * - All weights should be > 0
 * - Don't need to sum to 1 (normalized internally)
 * - [0.3, 0.5, 0.2] or [3, 5, 2] both work
 *
 * **Edge Cases:**
 * - Single item → always selected
 * - weights = [0, 5, 5] → first item never selected (0 weight)
 * - All equal weights → uniform distribution
 *
 * @param seed - Current seed value
 * @param items - Array of items to select from
 * @param weights - Array of weights (same length as items)
 * @returns [selectedItem, nextSeed] tuple
 *
 * @example
 * const loot = ['common', 'rare', 'legendary'];
 * const weights = [70, 25, 5];
 * const [item, nextS] = weightedRandom(42, loot, weights);
 * // ~70% common, ~25% rare, ~5% legendary
 */
export function weightedRandom<T>(
    seed: number,
    items: T[],
    weights: number[]
): [T, number] {
    if (items.length === 0) {
        throw new Error('Cannot select from empty items array');
    }

    if (items.length !== weights.length) {
        throw new Error('Items and weights arrays must have same length');
    }

    // Single item: return immediately
    if (items.length === 1) {
        return [items[0], seed];
    }

    // Calculate total weight
    const totalWeight = weights.reduce((sum, w) => sum + Math.max(0, w), 0);

    // If no weight, return first item
    if (totalWeight === 0) {
        return [items[0], seed];
    }

    // Generate random value in [0, totalWeight)
    const [rand, nextS] = random(seed);
    let randomValue = rand * totalWeight;

    // Find which item this corresponds to
    let accumulated = 0;
    for (let i = 0; i < items.length; i++) {
        accumulated += Math.max(0, weights[i]);
        if (randomValue < accumulated) {
            return [items[i], nextS];
        }
    }

    // Fallback (shouldn't reach here, but handles floating point edge cases)
    return [items[items.length - 1], nextS];
}

/**
 * Generates loot roll with base chance and modifiers.
 *
 * @remarks
 * **Formula:** `finalChance = baseChance + rarityBonus - difficultyPenalty`
 *
 * **Logic:**
 * 1. Start with baseChance (0-100%)
 * 2. Add rarity bonus:
 *    - rarity 1 (common): 0% bonus
 *    - rarity 2 (uncommon): +10%
 *    - rarity 3 (rare): +25%
 *    - rarity 4 (epic): +40%
 *    - rarity 5 (legendary): +50%
 * 3. Subtract difficulty penalty:
 *    - difficulty 1: 0% penalty
 *    - difficulty 2: -5% penalty
 *    - difficulty 3: -15% penalty
 *    - difficulty 4: -25% penalty
 *    - difficulty 5: -40% penalty
 * 4. Clamp final chance to 1-99%
 * 5. Roll random [0, 100): if less than chance, success
 * 6. Return { success: boolean, roll: number, chance: number }
 *
 * **Edge Cases:**
 * - Very high rarity + low difficulty = ~100% success
 * - Very low base + high difficulty = ~1% (never 0%)
 * - roll === chance is failure (strict <)
 *
 * @param seed - Current seed value
 * @param baseChance - Base success chance 0-100
 * @param rarity - Item rarity 1-5
 * @param difficulty - Enemy/area difficulty 1-5
 * @returns { success, roll, finalChance, nextSeed }
 *
 * @example
 * rollLoot(42, 30, 3, 2)
 * // baseChance 30 + rarity 25 - difficulty 5 = 50%
 * // Roll random 0-100, success if < 50
 */
export function rollLoot(
    seed: number,
    baseChance: number,
    rarity: number,
    difficulty: number
): {
    success: boolean;
    roll: number;
    finalChance: number;
    nextSeed: number;
} {
    // Clamp rarity and difficulty
    const r = Math.max(1, Math.min(5, rarity));
    const d = Math.max(1, Math.min(5, difficulty));

    // Rarity bonus
    const rarityBonuses = [0, 0, 10, 25, 40, 50];
    const rarityBonus = rarityBonuses[r] || 0;

    // Difficulty penalty
    const difficultyPenalties = [0, 0, 5, 15, 25, 40];
    const difficultyPenalty = difficultyPenalties[d] || 0;

    // Calculate final chance
    let finalChance = baseChance + rarityBonus - difficultyPenalty;
    finalChance = Math.max(1, Math.min(99, finalChance)); // clamp 1-99

    // Roll
    const [roll, nextS] = randomInt(seed, 0, 100);

    return {
        success: roll < finalChance,
        roll,
        finalChance,
        nextSeed: nextS,
    };
}
