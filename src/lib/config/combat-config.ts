/**
 * Combat System Configuration
 *
 * @remarks
 * Centralizes all combat balance parameters including damage calculations,
 * XP progression, class bonuses, and combat mechanics.
 * This file enables game designers to tune combat difficulty without
 * modifying core logic files.
 *
 * TODO: Add difficulty settings (Easy/Normal/Hard) that scale these values
 */

/**
 * Combat configuration record
 *
 * @remarks
 * Adjusting these values affects game balance.
 * - Lower baseXp makes leveling slower
 * - Lower damageModifier reduces total damage dealt
 * - Higher classBonus makes warrior class stronger
 */
export const combatConfig = {
  /**
   * Base XP awarded for defeating an enemy
   * @remarks Used in combat-usecase.ts calculatePlayerExp()
   */
  baseXp: 50,

  /**
   * XP multiplier based on health difference between player and enemy
   * @remarks If player has much more HP than enemy, XP is reduced
   */
  xpHealthDifferenceMultiplier: 0.002,

  /**
   * Default maximum health for any combatant
   * @remarks Used as fallback when creating new combatants
   */
  defaultMaxHealth: 100,

  /**
   * Base XP curve progression
   * @remarks Level N requires: baseXp * Math.pow(1.5, N - 1)
   * Current: Level 1 = 50, Level 2 = 75, Level 3 = 112.5, etc.
   */
  xpCurveBase: 1.5,

  /**
   * Damage reduction when defending
   * @remarks Reduces incoming damage by this fraction (0.5 = 50% reduction)
   */
  defendDamageReduction: 0.5,

  /**
   * Critical hit damage multiplier
   * @remarks When critical hit lands, multiply damage by this value
   */
  criticalHitMultiplier: 1.5,

  /**
   * Light environment damage modifier
   * @remarks Damage = baseDamage * this value when light level is low
   */
  lowLightDamageModifier: 0.8,

  /**
   * Moisture environment damage modifier
   * @remarks Damage = baseDamage * this value when moisture is high
   */
  highMoistureDamageModifier: 0.9,

  /**
   * Class-specific bonuses
   * @remarks Applied to base attack damage for each class
   */
  classBonus: {
    warrior: 2,
    scholar: 0,
    explorer: 1,
  },

  /**
   * Flee combat success base chance
   * @remarks Probability of successfully fleeing (before modifiers)
   */
  fleeSuccessBaseChance: 0.5,
} as const;

/**
 * Export type for TypeScript consumers
 * Ensures compile-time type safety when accessing config values
 */
export type CombatConfig = typeof combatConfig;
