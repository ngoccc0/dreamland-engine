/**
 * BONUS CALCULATION REFERENCE
 *
 * This document provides detailed formulas and examples for understanding
 * how player stats are calculated in Dreamland Engine.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 1. CORE STATS (CharacterStats)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CharacterStats contains 5 core attributes:
 *
 * - strength (STR): Physical damage, carrying capacity, armor effectiveness
 * - dexterity (DEX): Accuracy, evasion, critical hit chance
 * - intelligence (INT): Magical damage, mana pool, spell slot count
 * - vitality (VIT): Health pool, defense, status effect resistance
 * - luck (LCK): Critical hit rate, rare item drops, escape chance
 *
 * Base value for new characters: Typically 10 per stat
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 2. EQUIPMENT BONUS CALCULATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Formula:**
 *
 *   Effective Bonus = Base Bonus × Tier Multiplier × Grade Multiplier
 *
 * **Tier Multiplier** (1-6):
 *
 *   tier_mult = 1 + (tier - 1) × 0.1
 *
 *   Tier 1: 1.0x  (base item)
 *   Tier 2: 1.1x
 *   Tier 3: 1.2x
 *   Tier 4: 1.3x
 *   Tier 5: 1.4x
 *   Tier 6: 1.5x  (legendary item)
 *
 * **Grade Multiplier** (0-5):
 *
 *   grade_mult = 1 + grade × 0.1
 *
 *   Grade 0: 1.0x  (normal quality, 50% chance)
 *   Grade 1: 1.1x  (fine quality, 30% chance)
 *   Grade 2: 1.2x  (excellent quality, 20% chance)
 *   Grade 3: 1.3x
 *   Grade 4: 1.4x
 *   Grade 5: 1.5x  (perfect quality, rare)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 3. EQUIPMENT BONUS EXAMPLES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Example 1: Iron Sword (Tier 2, Grade 0)**
 *
 *   Base Bonus: +5 STR
 *   Tier Mult: 1.1x (tier 2)
 *   Grade Mult: 1.0x (grade 0)
 *   Effective: 5 × 1.1 × 1.0 = 5.5 STR
 *
 * **Example 2: Mithril Armor (Tier 5, Grade 2)**
 *
 *   Base Bonus: +8 VIT
 *   Tier Mult: 1.4x (tier 5)
 *   Grade Mult: 1.2x (grade 2)
 *   Effective: 8 × 1.4 × 1.2 = 13.44 VIT
 *
 * **Example 3: Ring of Power (Tier 3, Grade 1)**
 *
 *   Base Bonus: +3 INT
 *   Tier Mult: 1.2x (tier 3)
 *   Grade Mult: 1.1x (grade 1)
 *   Effective: 3 × 1.2 × 1.1 = 3.96 INT
 *
 * **Example 4: Dragon-Scale Armor (Tier 6, Grade 2)**
 *
 *   Base Bonus: +10 VIT, +5 DEX
 *   Tier Mult: 1.5x (tier 6)
 *   Grade Mult: 1.2x (grade 2)
 *   Effective: 10 × 1.5 × 1.2 = 18 VIT
 *   Effective: 5 × 1.5 × 1.2 = 9 DEX\n *\n * ═══════════════════════════════════════════════════════════════════════════\n * 4. FULL STAT CALCULATION EXAMPLE\n * ═══════════════════════════════════════════════════════════════════════════\n *\n * **Player Setup:**\n *\n * Character: \"Hero\" (Level 10)\n * Base Stats:\n *   - strength: 10\n *   - dexterity: 10\n *   - intelligence: 10\n *   - vitality: 10\n *   - luck: 8\n *\n * **Equipped Items:**\n *\n * Weapon: Enchanted Sword\n *   - bonus: +5 STR\n *   - tier: 3\n *   - grade: 1\n *   - effective: 5 × 1.2 × 1.1 = 6.6 STR\n *\n * Armor: Steel Plate\n *   - bonus: +8 VIT\n *   - tier: 2\n *   - grade: 0\n *   - effective: 8 × 1.1 × 1.0 = 8.8 VIT\n *\n * Accessory 1: Ring of Wisdom\n *   - bonus: +2 INT\n *   - tier: 2\n *   - grade: 1\n *   - effective: 2 × 1.1 × 1.1 = 2.42 INT\n *\n * Accessory 2: Ring of Defense\n *   - bonus: +3 VIT\n *   - tier: 2\n *   - grade: 0\n *   - effective: 3 × 1.1 × 1.0 = 3.3 VIT\n *\n * **Artifact Sets Unlocked:**\n *\n * \"Elemental Mastery\" Set (3/3 collected):\n *   - str: +5\n *   - int: +7\n *   - dex: +3\n *\n * **Calculation:**\n *\n * Layer 1 (Base Stats):\n *   STR:  10\n *   DEX:  10\n *   INT:  10\n *   VIT:  10\n *   LCK:  8\n *\n * Layer 2 (Equipment Bonuses):\n *   STR:  +6.6 (enchanted sword)\n *   VIT:  +8.8 + 3.3 = +12.1 (armor + ring)\n *   INT:  +2.42 (ring of wisdom)\n *\n * Layer 3 (Artifact Set Bonuses):\n *   STR:  +5\n *   DEX:  +3\n *   INT:  +7\n *\n * **FINAL EFFECTIVE STATS:**\n *\n *   STR: 10 + 6.6 + 5      = 21.6  (rounded: 21)\n *   DEX: 10 + 0 + 3        = 13    (no equipment bonus)\n *   INT: 10 + 2.42 + 7     = 19.42 (rounded: 19)\n *   VIT: 10 + 12.1 + 0     = 22.1  (rounded: 22)\n *   LCK: 8 + 0 + 0         = 8\n *\n * **Derived Stats:**\n *   max HP = 10 + vitality × 2 = 10 + 22 × 2 = 54 HP\n *   max Mana = 5 + intelligence × 1.5 = 5 + 19 × 1.5 = 33.5 Mana (rounded: 33)\n *\n * ═══════════════════════════════════════════════════════════════════════════\n * 5. ARTIFACT SET BONUSES\n * ═══════════════════════════════════════════════════════════════════════════\n *\n * Artifact sets are unlocked by collecting all artifacts in a set.\n * When complete, they grant PASSIVE stat bonuses.\n *\n * **Field Mapping:**\n *\n * Artifact bonus fields → CharacterStats fields:\n *   - str (strength) → strength\n *   - dex (dexterity) → dexterity\n *   - con (constitution) → vitality  [NOTE: mapped to vitality]\n *   - int (intelligence) → intelligence\n *   - wis (wisdom) → luck  [NOTE: no direct mapping, uses luck]\n *   - cha (charisma) → luck  [NOTE: no direct mapping, uses luck]\n *\n * **Example Sets:**\n *\n * \"Elemental Mastery\" (3 artifacts):\n *   { str: 5, dex: 3, int: 7 }\n *   → +5 STR, +3 DEX, +7 INT\n *\n * \"Ancient Guardian\" (4 artifacts):\n *   { con: 10, wis: 5, cha: 3 }\n *   → +10 VIT, +5 LCK (wis), +3 LCK (cha) = +10 VIT, +8 LCK\n *\n * \"Shadow Assassin\" (2 artifacts):\n *   { dex: 8, str: 4, cha: 2 }\n *   → +8 DEX, +4 STR, +2 LCK\n *\n * ═══════════════════════════════════════════════════════════════════════════\n * 6. CALCULATING EFFECTIVE STATS IN CODE\n * ═══════════════════════════════════════════════════════════════════════════\n *\n * **Hook Implementation:**\n *\n * ```typescript\n * import { usePlayerStats } from '@/hooks/usePlayerStats';\n *\n * const effectiveStats = usePlayerStats(character, unlockedArtifactSets);\n *\n * // Access stats\n * console.log(effectiveStats.strength);    // 21\n * console.log(effectiveStats.maxHealth);   // 54\n * console.log(effectiveStats.maxMana);     // 33\n *\n * // View breakdown\n * console.log(effectiveStats.breakdown.base);       // Base stats\n * console.log(effectiveStats.breakdown.equipment);  // Equipment bonuses\n * console.log(effectiveStats.breakdown.artifacts);  // Artifact bonuses\n * ```\n *\n * **In React Components:**\n *\n * ```typescript\n * const CharacterSheet = () => {\n *   const character = useCharacter();\n *   const unlockedSets = useGameStore(s => s.unlockedArtifactSets);\n *\n *   const stats = usePlayerStats(character, unlockedSets);\n *\n *   return (\n *     <div className=\"character-sheet\">\n *       <div className=\"stat-row\">\n *         <label>Strength</label>\n *         <span>{stats.strength}</span>\n *         <span className=\"breakdown\">\n *           {stats.breakdown.base.strength} + {stats.breakdown.equipment.strength} + {stats.breakdown.artifacts.strength}\n *         </span>\n *       </div>\n *       <div className=\"health-bar\">\n *         <label>HP</label>\n *         <div className=\"bar\" style={{ width: (character.health / stats.maxHealth) * 100 + '%' }} />\n *         <span>{character.health} / {stats.maxHealth}</span>\n *       </div>\n *     </div>\n *   );\n * };\n * ```\n *\n * ═══════════════════════════════════════════════════════════════════════════\n * 7. BALANCE & PROGRESSION\n * ═══════════════════════════════════════════════════════════════════════════\n *\n * **Equipment Scaling (per tier):**\n *   - Tier 1 → Tier 6 = 50% total bonus increase (1.0x → 1.5x)\n *   - Encourages equipment upgrades every few levels\n *\n * **Grade Impact:**\n *   - 5 grades (0-5) = 50% bonus spread across grades\n *   - Tier 6 Grade 5 = 2.25× multiplier (very strong, rare)\n *   - Encourages hunting for high-grade drops\n *\n * **Artifact Bonuses:**\n *   - Typical per-set bonus: +5 to +10 per stat\n *   - Complements equipment bonuses (stacks additively)\n *   - Unlocking sets is long-term goal (3+ artifacts per set)\n *\n * **Cap Recommendation:**\n * - No hard cap on stats (characters can get very strong)\n * - Scaling: Every 10 points of stat = ~2× combat power\n * - Balance encounters using: difficulty × playerLevel × 1.2\n *\n * ═══════════════════════════════════════════════════════════════════════════\n * 8. COMMON MISTAKES & GOTCHAS\n * ═══════════════════════════════════════════════════════════════════════════\n *\n * ❌ WRONG: Modifying character.stats directly\n *   character.stats.strength += 5;  // Permanently changes base stat!\n *\n * ✅ RIGHT: Use equipment/artifact system\n *   character.equipItem(sword);     // Bonus calculated by usePlayerStats\n *\n * ❌ WRONG: Forgetting to recalculate after equipment change\n *   character.equipItem(newSword);\n *   const damage = character.stats.strength;  // Stale value!\n *\n * ✅ RIGHT: Always query via usePlayerStats\n *   character.equipItem(newSword);\n *   const stats = usePlayerStats(character, unlockedSets);\n *   const damage = stats.strength;  // Up-to-date!\n *\n * ❌ WRONG: Assuming artifact bonuses are permanent\n *   if (artifact.collected) player.str += 5;  // Can't unequip!\n *\n * ✅ RIGHT: Artifact bonuses are passive\n *   // Bonuses applied only when set is unlocked\n *   if (unlockedArtifactSets.find(s => s.setName === 'Elemental')) {\n *     // Apply bonuses via usePlayerStats\n *   }\n *\n * ═══════════════════════════════════════════════════════════════════════════\n * 9. TESTING STAT CALCULATIONS\n * ═══════════════════════════════════════════════════════════════════════════\n *\n * **Unit Test Example:**\n *\n * ```typescript\n * test('equipment bonus calculation with tier/grade', () => {\n *   const character = new Character('test', 'Hero', {\n *     strength: 10, dexterity: 10, intelligence: 10,\n *     vitality: 10, luck: 5\n *   });\n *\n *   // Equip Mithril Sword: +5 STR, tier 3, grade 1\n *   character.equipItem({\n *     itemId: 'sword_mithril',\n *     bonus: 5,\n *     tier: 3,\n *     grade: 1\n *   }, 'weapon');\n *\n *   const stats = usePlayerStats(character);\n *\n *   // 5 × 1.2 (tier) × 1.1 (grade) = 6.6\n *   expect(stats.strength).toBe(Math.floor(10 + 6.6));  // 16\n * });\n * ```\n *\n */\n\n// This file is for documentation only.\n// Use the formulas above when calculating player stats in code.\n