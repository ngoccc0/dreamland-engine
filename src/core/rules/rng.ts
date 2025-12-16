/**
 * Random Number Generation Rules Engine - Pure Functions for All Randomization
 *
 * These are PURE FUNCTIONS for randomization:
 * - Dice rolls and probabilities
 * - Weighted selection from arrays
 * - Array shuffling (Fisher-Yates)
 * - Range-based random values
 *
 * No external dependencies (no state, no side effects).
 * All RNG uses `Math.random()` for fully non-deterministic randomness per playthrough.
 *
 * DESIGN NOTE: No seeding support (per Decision #7 - hard reset, no replay need).
 * If deterministic replay becomes needed in Phase 4+, add optional `randomFn` parameter.
 *
 * @example
 * ```typescript
 * const roll = rollDice(20); // D20 roll: 1-20
 * const hasChance = rollPercentage(75); // 75% chance
 * const selected = selectWeighted([
 *   { value: 'common', weight: 70 },
 *   { value: 'rare', weight: 25 },
 *   { value: 'epic', weight: 5 }
 * ]); // Weighted by probability
 * ```
 */

/**
 * Weighted item for selection
 */
export interface WeightedItem<T> {
    value: T;
    weight: number; // Sum of all weights across array should total 100 or 1.0
}

/**
 * Roll one or more dice
 *
 * @remarks
 * **Formula:** `result = sum of (floor(random * sides) + 1) for each die`
 *
 * **Logic:**
 * 1. For each die requested, generate random value 0.0-0.999...
 * 2. Scale to range [0, sides) using `Math.floor(random * sides)`
 * 3. Add 1 to shift to range [1, sides]
 * 4. Sum all dice rolls
 *
 * **Range:**
 * - 1dN: min=1, max=N
 * - NdM: min=N, max=N×M
 *
 * **Edge Cases:**
 * - sides < 1 returns 0 (invalid die)
 * - count < 1 returns 0 (no dice rolled)
 *
 * @param sides - Number of sides on each die (e.g., 20 for d20)
 * @param count - Number of dice to roll (default 1, e.g., 2 for 2d20)
 * @param randomFn - Random function 0.0-1.0 (injectable for testing, default Math.random)
 * @returns Sum of all dice rolls (integer, min=count, max=count×sides)
 *
 * @example
 * rollDice(20) → 14 (single d20)
 * rollDice(6, 2) → 9 (2d6 sum)
 * rollDice(20, 3) → 45 (3d20 sum)
 * rollDice(2, 1) → 1 or 2 (coin flip)
 */
export function rollDice(
    sides: number,
    count: number = 1,
    randomFn: () => number = Math.random
): number {
    if (sides < 1 || count < 1) return 0;

    let total = 0;
    for (let i = 0; i < count; i++) {
        total += Math.floor(randomFn() * sides) + 1;
    }
    return total;
}

/**
 * Roll a percentage chance (does X% chance succeed?)
 *
 * @remarks
 * **Formula:** `threshold = chance / 100; success = randomRoll < threshold`
 *
 * **Logic:**
 * 1. Convert percentage chance (0-100) to decimal threshold (0.0-1.0)
 * 2. Generate random value 0.0-1.0
 * 3. If random value is strictly less than threshold, chance succeeds
 *
 * **Probability:**
 * - 0% chance: always false
 * - 50% chance: true ~50% of the time
 * - 100% chance: always true (if randomFn() < 1.0)
 *
 * **Edge Cases:**
 * - Negative chance treated as 0% (always fails)
 * - Chance > 100 clamped to 100% (always succeeds)
 * - Uses strict < inequality (0.5 exactly at 50% boundary fails)
 *
 * @param chance - Percentage chance 0-100 (e.g., 75 = 75%)
 * @param randomFn - Random function 0.0-1.0 (injectable for testing, default Math.random)
 * @returns true if chance succeeded, false otherwise
 *
 * @example
 * rollPercentage(75) → true ~75% of the time
 * rollPercentage(0) → false (never)
 * rollPercentage(100) → true (always, if randomFn < 1.0)
 * rollPercentage(50) → true ~50% of the time
 */
export function rollPercentage(
    chance: number,
    randomFn: () => number = Math.random
): boolean {
    const clamped = Math.max(0, Math.min(100, chance));
    const threshold = clamped / 100;
    return randomFn() < threshold;
}

/**
 * Select one item from array based on weights
 *
 * @remarks
 * **Algorithm:** Weighted Random Selection (Roulette Wheel)
 *
 * **Logic:**
 * 1. Sum all weights to get total weight
 * 2. Generate random value 0 to total weight
 * 3. Iterate through items, subtracting weight until accumulated >= random value
 * 4. Return that item
 *
 * **Weight Interpretation:**
 * - Weights can sum to any positive number (not required to be 100)
 * - Item weight = probability × total weight
 * - Weight 50 out of 100 total = 50% chance
 * - Weight 3 out of 10 total = 30% chance
 *
 * **Edge Cases:**
 * - Empty array throws error (no selection possible)
 * - All zero weights throws error (invalid distribution)
 * - Negative weights treated as 0 (no probability)
 * - Always returns first item if all weights are 0 (fallback)
 *
 * @param items - Array of {value, weight} items to select from
 * @param randomFn - Random function 0.0-1.0 (injectable for testing, default Math.random)
 * @returns One selected item value, weighted by probability
 * @throws Error if items array is empty or all weights are zero
 *
 * @example
 * const loot = selectWeighted([
 *   { value: 'common', weight: 70 },
 *   { value: 'rare', weight: 25 },
 *   { value: 'epic', weight: 5 }
 * ]);
 * // Returns 'common' ~70% of the time, 'rare' ~25%, 'epic' ~5%
 *
 * const size = selectWeighted([
 *   { value: 'small', weight: 3 },
 *   { value: 'large', weight: 1 }
 * ]);
 * // Returns 'small' 75% of the time, 'large' 25%
 */
export function selectWeighted<T>(
    items: WeightedItem<T>[],
    randomFn: () => number = Math.random
): T {
    if (items.length === 0) {
        throw new Error('selectWeighted: items array cannot be empty');
    }

    // Sum all positive weights
    const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);

    if (totalWeight <= 0) {
        throw new Error('selectWeighted: total weight must be > 0');
    }

    // Generate random value 0 to totalWeight
    let random = randomFn() * totalWeight;

    // Iterate until accumulated weight >= random value
    for (const item of items) {
        random -= Math.max(0, item.weight);
        if (random <= 0) {
            return item.value;
        }
    }

    // Fallback (should never reach if weights correct)
    return items[items.length - 1].value;
}

/**
 * Shuffle array in-place using Fisher-Yates algorithm
 *
 * @remarks
 * **Algorithm:** Fisher-Yates Shuffle (Knuth Shuffle)
 *
 * **Logic:**
 * 1. Start from last element (index length-1)
 * 2. Pick random index from 0 to current index
 * 3. Swap current element with random element
 * 4. Move to previous element and repeat until index 0
 *
 * **Property:** Unbiased—all permutations equally likely
 *
 * **Time Complexity:** O(n)
 * **Space Complexity:** O(1) if mutating input; O(n) if creating copy
 *
 * **WARNING:** Mutates input array! Clone if you need original.
 *
 * **Example Shuffle (simplified):**
 * - Input: [1, 2, 3, 4, 5]
 * - After swap at index 4: [1, 2, 3, 5, 4] (maybe)
 * - After swap at index 3: [1, 5, 3, 2, 4] (maybe)
 * - ... continues to index 0
 * - Output: fully randomized permutation
 *
 * @param array - Array to shuffle (MUTATED IN PLACE)
 * @param randomFn - Random function 0.0-1.0 (injectable for testing, default Math.random)
 * @returns The same array reference, now shuffled
 *
 * @example
 * const items = [1, 2, 3, 4, 5];
 * shuffleArray(items);
 * // items is now randomized: [3, 5, 1, 4, 2] (example)
 *
 * // To avoid mutation:
 * const copy = [...items];
 * shuffleArray(copy);
 * // items unchanged, copy is shuffled
 */
export function shuffleArray<T>(
    array: T[],
    randomFn: () => number = Math.random
): T[] {
    // Fisher-Yates shuffle
    for (let i = array.length - 1; i > 0; i--) {
        // Pick random index from 0 to i (inclusive)
        const j = Math.floor(randomFn() * (i + 1));
        // Swap array[i] and array[j]
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Generate random integer within inclusive range
 *
 * @remarks
 * **Formula:** `result = floor(random * (max - min + 1)) + min`
 *
 * **Logic:**
 * 1. Calculate range size: `max - min + 1`
 * 2. Scale random value [0, 1) to range [0, range)
 * 3. Add min offset to shift into [min, max]
 * 4. Round down with `Math.floor()`
 *
 * **Range Inclusive:** Both min and max are possible outcomes
 *
 * **Edge Cases:**
 * - min > max returns min (invalid range, no error)
 * - min === max returns that value (degenerate case)
 * - Negative ranges work normally
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param randomFn - Random function 0.0-1.0 (injectable for testing, default Math.random)
 * @returns Random integer between min and max (inclusive)
 *
 * @example
 * randomBetween(1, 6) → 1-6 (uniform like d6)
 * randomBetween(1, 100) → 1-100 (uniform percentile)
 * randomBetween(-10, 10) → -10 to 10 (negative range works)
 * randomBetween(5, 5) → 5 (always same value)
 */
export function randomBetween(
    min: number,
    max: number,
    randomFn: () => number = Math.random
): number {
    // Swap if min > max
    const [actualMin, actualMax] = min > max ? [max, min] : [min, max];
    const range = actualMax - actualMin + 1;
    return Math.floor(randomFn() * range) + actualMin;
}
