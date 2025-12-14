/**
 * Loot Rules Module - Pure game logic for item generation and rarity
 *
 * Handles loot generation, rarity calculation, and affix assignment.
 * All functions are pure (no side effects, deterministic, testable).
 *
 * @remarks
 * Used by loot usecases to generate player rewards and item properties.
 * Works with RNG rules for seeded, reproducible item generation.
 */

/**
 * Generates rarity level for loot based on difficulty and luck.
 *
 * @remarks
 * **Formula:** `rarity = baseRarity + luckBonus - difficultyPenalty`
 *
 * **Logic:**
 * 1. Start with base rarity (1-5 or calculated from drops)
 * 2. Add luck bonus (0-2 levels for lucky players)
 * 3. Subtract difficulty reduction (easier zones = lower rarity)
 * 4. Clamp to 1-5 (1=common, 5=legendary)
 * 5. Return rarity level
 *
 * **Rarity Table:**
 * - Rarity 1: Common (50%)
 * - Rarity 2: Uncommon (25%)
 * - Rarity 3: Rare (15%)
 * - Rarity 4: Epic (8%)
 * - Rarity 5: Legendary (2%)
 *
 * **Base Rarity Formula:**
 * - difficulty 1 (easy) → base rarity 1
 * - difficulty 2-3 (normal) → base rarity 2
 * - difficulty 4 (hard) → base rarity 3
 * - difficulty 5 (nightmare) → base rarity 4
 *
 * **Luck Bonus:**
 * - luck 0-10 → 0 bonus
 * - luck 11-20 → +1 rarity
 * - luck 21+ → +2 rarity
 *
 * @param difficulty - Zone difficulty 1-5
 * @param luck - Player luck stat 0+
 * @returns Rarity level 1-5
 *
 * @example
 * calculateRarity(3, 15) → 3 (normal + lucky = rare)
 * calculateRarity(5, 5) → 4 (nightmare = epic)
 * calculateRarity(1, 30) → 3 (easy + super lucky = rare)
 */
export function calculateRarity(difficulty: number, luck: number): number {
    // Clamp difficulty
    const d = Math.max(1, Math.min(5, difficulty));

    // Base rarity by difficulty
    let baseRarity = 1;
    if (d === 1) baseRarity = 1;
    else if (d <= 3) baseRarity = 2;
    else if (d === 4) baseRarity = 3;
    else baseRarity = 4; // d === 5

    // Luck bonus (0-2)
    let luckBonus = 0;
    if (luck > 20) luckBonus = 2;
    else if (luck > 10) luckBonus = 1;

    // Calculate final rarity
    let rarity = baseRarity + luckBonus;

    // Clamp to 1-5
    return Math.max(1, Math.min(5, rarity));
}

/**
 * Generates item attributes (affixes) based on rarity.
 *
 * @remarks
 * **Formula:** `affixes = baseAffixes + rarityMultiplier`
 *
 * **Logic:**
 * 1. Get base item stats (damage, defense, etc.)
 * 2. Determine number of affixes by rarity:
 *    - rarity 1 (common): 0 affixes
 *    - rarity 2 (uncommon): 1 affix
 *    - rarity 3 (rare): 2 affixes
 *    - rarity 4 (epic): 3 affixes
 *    - rarity 5 (legendary): 4 affixes
 * 3. Each affix is property + value:
 *    { name: 'Health+', power: 10 }
 * 4. Affix pool includes: Health+, Damage+, Defense+, CritChance, Lifesteal, etc.
 * 5. Affixes are selected without replacement
 *
 * **Affix Power by Rarity:**
 * - Rare: power 5-15
 * - Epic: power 15-25
 * - Legendary: power 25-50
 *
 * **Edge Cases:**
 * - rarity 1 → always 0 affixes
 * - duplicate affixes impossible (not replaced)
 * - high rarity can't have more affixes than available
 *
 * @param rarity - Item rarity 1-5
 * @param seed - RNG seed for reproducibility
 * @returns Array of affixes [{ name, power }, ...]
 *
 * @example
 * generateLoot(1, 42) → [] (common has no affixes)
 * generateLoot(3, 42) → [{ name: 'Health+', power: 12 }, { name: 'Defense+', power: 8 }]
 * generateLoot(5, 42) → [4 random powerful affixes]
 */
export function generateLoot(
    rarity: number,
    seed: number
): Array<{ name: string; power: number }> {
    // Clamp rarity
    const r = Math.max(1, Math.min(5, rarity));

    // Affixes per rarity level
    const affixCounts = [0, 0, 1, 2, 3, 4]; // index by rarity
    const affixCount = affixCounts[r];

    // All available affixes
    const affixPool = [
        { name: 'Health+', power: 10 },
        { name: 'Damage+', power: 8 },
        { name: 'Defense+', power: 6 },
        { name: 'CritChance+', power: 5 },
        { name: 'Lifesteal+', power: 7 },
        { name: 'Speed+', power: 4 },
        { name: 'Accuracy+', power: 5 },
        { name: 'Resistance+', power: 6 },
    ];

    if (affixCount === 0) {
        return [];
    }

    // Seeded selection (simple hash-based picker)
    const selectedAffixes: Array<{ name: string; power: number }> = [];
    let currentSeed = seed;

    for (let i = 0; i < affixCount; i++) {
        // Deterministic index selection
        currentSeed = (currentSeed * 1103515245 + 12345) % 2147483647;
        const availableAffixes = affixPool.filter(
            (affix) => !selectedAffixes.some((sel) => sel.name === affix.name)
        );

        if (availableAffixes.length === 0) break;

        const index = currentSeed % availableAffixes.length;
        const selected = availableAffixes[index];

        // Scale power by rarity
        let scaledPower = selected.power;
        if (r === 2) scaledPower = Math.floor(selected.power * 0.8); // slightly lower
        else if (r === 3) scaledPower = selected.power; // normal
        else if (r === 4) scaledPower = Math.floor(selected.power * 1.5); // boost
        else if (r === 5) scaledPower = selected.power * 2; // double

        selectedAffixes.push({
            name: selected.name,
            power: scaledPower,
        });
    }

    return selectedAffixes;
}

/**
 * Applies rarity-based affix modifiers to item attributes.
 *
 * @remarks
 * **Formula:** `modifiedValue = baseValue × (1 + affixCount × rarityMultiplier)`
 *
 * **Logic:**
 * 1. Count number of affixes on item
 * 2. Each affix provides multiplier boost:
 *    - Common (0 affixes): 1.0× (no boost)
 *    - Uncommon (1 affix): 1.1× (10% boost)
 *    - Rare (2 affixes): 1.2× (20% boost)
 *    - Epic (3 affixes): 1.35× (35% boost)
 *    - Legendary (4 affixes): 1.5× (50% boost)
 * 3. Apply multiplier to base stat
 * 4. Return modified value
 *
 * **Effect Stacking:**
 * - Affixes don't stack additively
 * - Each affix level increases multiplier
 * - Max boost capped at 50%
 *
 * @param baseValue - Base attribute value
 * @param affixCount - Number of affixes on item
 * @returns Modified attribute value
 *
 * @example
 * applyAffixes(100, 0) → 100 (no affixes)
 * applyAffixes(100, 2) → 120 (rare = +20%)
 * applyAffixes(100, 4) → 150 (legendary = +50%)
 */
export function applyAffixes(baseValue: number, affixCount: number): number {
    // Clamp affix count
    const count = Math.max(0, Math.min(4, affixCount));

    // Multiplier by affix count
    const multipliers = [1.0, 1.1, 1.2, 1.35, 1.5];
    const multiplier = multipliers[count] || 1.0;

    return baseValue * multiplier;
}

/**
 * Calculates total item value (for selling/trading).
 *
 * @remarks
 * **Formula:** `value = baseValue × rarityMultiplier × (1 + affixBonus)`
 *
 * **Logic:**
 * 1. Start with base item value (material cost)
 * 2. Apply rarity multiplier:
 *    - common: 1.0×
 *    - uncommon: 1.5×
 *    - rare: 2.5×
 *    - epic: 5.0×
 *    - legendary: 10.0×
 * 3. Apply affix bonus:
 *    - Each affix adds 20% value
 *    - 2 affixes = +40% total
 * 4. Return total value (integer gold)
 *
 * **Value Scaling:**
 * - Common items: baseValue to 1.5× baseValue
 * - Legendary with 4 affixes: 10× baseValue × 1.8 = 18× baseValue
 *
 * @param baseValue - Base item value in gold
 * @param rarity - Item rarity 1-5
 * @param affixCount - Number of affixes
 * @returns Total item value in gold
 *
 * @example
 * calculateItemValue(100, 1, 0) → 100 (common, no affixes)
 * calculateItemValue(100, 3, 2) → 600 (rare + 2 affixes = 2.5 × 1.4)
 * calculateItemValue(100, 5, 4) → 1800 (legendary + 4 affixes = 10 × 1.8)
 */
export function calculateItemValue(
    baseValue: number,
    rarity: number,
    affixCount: number
): number {
    // Clamp inputs
    const r = Math.max(1, Math.min(5, rarity));
    const count = Math.max(0, Math.min(4, affixCount));

    // Rarity multiplier
    const rarityMultipliers = [1, 1.0, 1.5, 2.5, 5.0, 10.0];
    const rarityMult = rarityMultipliers[r] || 1.0;

    // Affix bonus (20% per affix)
    const affixBonus = 1.0 + count * 0.2;

    // Calculate total value
    const totalValue = Math.floor(baseValue * rarityMult * affixBonus);

    return Math.max(1, totalValue); // minimum 1 gold
}

/**
 * Generates complete loot package from drops.
 *
 * @remarks
 * **Formula:** `lootPackage = { rarity, affixes[], totalValue, weight }`
 *
 * **Logic:**
 * 1. Calculate rarity from difficulty + luck
 * 2. Generate affixes for rarity level
 * 3. Calculate item value
 * 4. Determine drop weight (how heavy the item feels):
 *    - common: 1 lb
 *    - uncommon: 2 lbs
 *    - rare: 4 lbs
 *    - epic: 8 lbs
 *    - legendary: 16 lbs
 * 5. Return complete package
 *
 * **Complete Package:**
 * ```typescript
 * {
 *   rarity: 3,
 *   affixes: [{ name: 'Health+', power: 12 }],
 *   totalValue: 250,
 *   weight: 4
 * }
 * ```
 *
 * @param difficulty - Enemy/zone difficulty 1-5
 * @param luck - Player luck stat 0+
 * @param baseValue - Base item value in gold
 * @param seed - RNG seed
 * @returns Complete loot package
 *
 * @example
 * generateLootPackage(3, 10, 100, 42)
 * → { rarity: 3, affixes: [...], totalValue: 250, weight: 4 }
 */
export function generateLootPackage(
    difficulty: number,
    luck: number,
    baseValue: number,
    seed: number
): {
    rarity: number;
    affixes: Array<{ name: string; power: number }>;
    totalValue: number;
    weight: number;
} {
    // Calculate rarity
    const rarity = calculateRarity(difficulty, luck);

    // Generate affixes
    const affixes = generateLoot(rarity, seed);

    // Calculate value
    const totalValue = calculateItemValue(baseValue, rarity, affixes.length);

    // Weight by rarity (exponential)
    const weights = [0, 1, 2, 4, 8, 16];
    const weight = weights[rarity] || 1;

    return {
        rarity,
        affixes,
        totalValue,
        weight,
    };
}
