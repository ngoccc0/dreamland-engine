/**
 * Statistics Factory: Safe initialization of GameState stats with defensive checks
 *
 * OVERVIEW: Creates properly initialized player statistics with sensible defaults,
 * preventing null reference errors when accessing optional fields.
 *
 * ## Problem This Solves
 *
 * **Before (Bug-Prone):**
 * ```typescript
 * const level = gameState.playerStats.playerLevel?.level ?? 1;
 * const exp = gameState.playerStats.playerLevel?.experience ?? 0;
 * // Repeated across dozens of places
 * ```
 *
 * **After (Safe):**
 * ```typescript
 * const stats = StatisticsFactory.ensurePlayerStats(gameState);
 * const level = stats.playerLevel.level;  // Always safe, never undefined
 * const exp = stats.playerLevel.experience; // Always safe, never undefined
 * ```
 *
 * ## Edge Cases Handled
 *
 * 1. **Null/undefined playerLevel:** Initialize as {level:1, experience:0}
 * 2. **Legacy playerLevel as number:** Convert to {level, experience:0}
 * 3. **Missing attributes:** Initialize as empty Record
 * 4. **Missing equipment:** Initialize with empty slots
 * 5. **Missing quest/skill arrays:** Initialize as empty []
 * 6. **Undefined combat stats:** Provide sensible defaults
 *
 * ## Functions
 *
 * - ensurePlayerStats() → PlayerStatusDefinition with all fields safely initialized
 * - ensureCombatStats() → CombatStats with defaults (maxHealth:100, etc)
 * - createEmptyStatistics() → Empty GameState statistics object
 */

import type { PlayerStatusDefinition, GameState, EquipmentSlot, PlayerPersona, WorldProfile } from '@/core/types/game';
import type { CombatStats } from '@/core/entities/combat';

/**
 * ensurePlayerStats
 *
 * Safe factory function to ensure playerStats has all required fields populated.
 *
 * @remarks
 * **Problem Solved:**
 * Without this factory, code must repeatedly write:
 * ```typescript
 * const level = playerStats.playerLevel?.level ?? 1;
 * const exp = playerStats.playerLevel?.experience ?? 0;
 * const skills = playerStats.skills ?? [];
 * // ... etc for 10+ fields
 * ```
 *
 * With factory:
 * ```typescript
 * const stats = ensurePlayerStats(playerStats);
 * const level = stats.playerLevel.level;      // Always defined
 * const exp = stats.playerLevel.experience;   // Always defined
 * const skills = stats.skills;                // Always array
 * ```
 *
 * **Handles:**
 * 1. playerLevel as undefined → {level: 1, experience: 0}
 * 2. playerLevel as number (legacy) → {level: playerLevel, experience: 0}
 * 3. playerLevel as object (correct) → use as-is
 * 4. Missing attributes → {}
 * 5. Missing equipment → all slots undefined but safe to access
 * 6. Missing items/quests/skills → []
 * 7. Missing hunger/mana fields → 0 (sensible defaults)
 *
 * **Idempotency:** Safe to call multiple times (creates new object each time)
 *
 * @param stats - Player stats (may be partially initialized)
 * @returns Fully initialized PlayerStatusDefinition with all fields guaranteed present
 *
 * @example
 * // From incomplete save file
 * const incomplete = { hp: 50, stamina: 20 }; // Missing most fields
 * const safe = ensurePlayerStats(incomplete);
 * // Result: { hp: 50, stamina: 20, maxStamina: 100, items: [], skills: [], ... }
 *
 * @example
 * // From save with legacy playerLevel format
 * const legacy = { hp: 100, playerLevel: 5 }; // playerLevel is number
 * const safe = ensurePlayerStats(legacy);
 * // Result: { hp: 100, playerLevel: {level: 5, experience: 0}, ... }
 */
export function ensurePlayerStats(
    stats?: Partial<PlayerStatusDefinition> | null
): PlayerStatusDefinition {
    if (!stats) {
        return createDefaultPlayerStats();
    }

    // Handle legacy playerLevel as number
    let playerLevel: { level: number; experience: number };
    if (typeof stats.playerLevel === 'number') {
        playerLevel = {
            level: stats.playerLevel,
            experience: 0,
        };
    } else if (stats.playerLevel && typeof stats.playerLevel === 'object') {
        playerLevel = {
            level: stats.playerLevel.level ?? 1,
            experience: stats.playerLevel.experience ?? 0,
        };
    } else {
        playerLevel = {
            level: 1,
            experience: 0,
        };
    }

    return {
        hp: stats.hp ?? 100,
        stamina: stats.stamina ?? 50,
        maxStamina: stats.maxStamina ?? 100,
        hunger: stats.hunger ?? 0,
        hungerTickCounter: stats.hungerTickCounter ?? 0,
        hpRegenTickCounter: stats.hpRegenTickCounter ?? 0,
        staminaRegenTickCounter: stats.staminaRegenTickCounter ?? 0,
        manaRegenTickCounter: stats.manaRegenTickCounter ?? 0,
        mana: stats.mana ?? 0,
        items: stats.items ?? [],
        quests: stats.quests ?? [],
        skills: stats.skills ?? [],
        persona: (stats.persona ?? 'explorer') as PlayerPersona,
        pets: stats.pets ?? [],
        unlockProgress: {
            kills: stats.unlockProgress?.kills ?? 0,
            damageSpells: stats.unlockProgress?.damageSpells ?? 0,
            moves: stats.unlockProgress?.moves,
        },
        playerLevel,
        questsCompleted: stats.questsCompleted ?? 0,
        equipment: {
            weapon: (stats.equipment?.weapon ?? null),
            armor: (stats.equipment?.armor ?? null),
            accessory: (stats.equipment?.accessory ?? null),
        },
        attributes: stats.attributes ?? {},
        dailyActionLog: stats.dailyActionLog ?? [],
        questHints: stats.questHints ?? {},
        artifactCollection: stats.artifactCollection ?? [],
    };
}

/**
 * ensureCombatStats
 *
 * Safe factory function to initialize combat stats with sensible defaults.
 *
 * @remarks
 * **Problem:** Combat calculations need health/attack/defense values,
 * but CombatStats might have undefined properties.
 *
 * **Solution:** Provide typed defaults so calculations never fail.
 *
 * **Defaults:**
 * - maxHealth: 100 (standard enemy)
 * - health: same as maxHealth (full health)
 * - attack: 10 (weak default)
 * - defense: 5 (weak default)
 * - speed: 1 (turn order neutral)
 * - criticalChance: 0 (no crit)
 *
 * **Uses:**
 * - Before combat calculations that need all stats
 * - After loading creature/player stats from save file
 * - When initializing new enemies
 *
 * @param stats - Combat stats (may be partial)
 * @returns Complete CombatStats with all fields initialized
 *
 * @example
 * // From incomplete creature definition
 * const partial = { attack: 15 };
 * const safe = ensureCombatStats(partial);
 * // Result: { maxHealth: 100, health: 100, attack: 15, defense: 5, speed: 1, ... }
 */
export function ensureCombatStats(stats?: Partial<CombatStats> | null): CombatStats {
    if (!stats) {
        return createDefaultCombatStats();
    }

    const maxHealth = stats.maxHealth ?? 100;
    return {
        health: stats.health ?? maxHealth,
        maxHealth,
        attack: stats.attack ?? 10,
        defense: stats.defense ?? 5,
        speed: stats.speed ?? 1,
        criticalChance: stats.criticalChance ?? 0,
        criticalDamage: stats.criticalDamage ?? 1.5,
    };
}

/**
 * createDefaultPlayerStats
 *
 * Creates a completely new, empty player stats object with sensible defaults.
 *
 * @remarks
 * Use when loading a save file fails, or creating a brand new game.
 * All fields are initialized with safe defaults (empty arrays, 0/100 for resources).
 *
 * @returns Fresh PlayerStatusDefinition ready for gameplay
 */
export function createDefaultPlayerStats(): PlayerStatusDefinition {
    return {
        hp: 100,
        stamina: 50,
        maxStamina: 100,
        hunger: 0,
        hungerTickCounter: 0,
        hpRegenTickCounter: 0,
        staminaRegenTickCounter: 0,
        manaRegenTickCounter: 0,
        mana: 0,
        items: [],
        quests: [],
        skills: [],
        persona: 'explorer',
        pets: [],
        unlockProgress: {
            kills: 0,
            damageSpells: 0,
        },
        playerLevel: {
            level: 1,
            experience: 0,
        },
        questsCompleted: 0,
        equipment: {
            weapon: null,
            armor: null,
            accessory: null,
        },
        attributes: {},
        dailyActionLog: [],
        questHints: {},
        artifactCollection: [],
    };
}

/**
 * createDefaultCombatStats
 *
 * Creates default combat stats for a weak/generic creature.
 *
 * @remarks
 * Use when initializing a new combatant without a specific stat template.
 * Safe baseline for calculations.
 *
 * @returns CombatStats with weak baseline values
 */
export function createDefaultCombatStats(): CombatStats {
    return {
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        speed: 1,
        criticalChance: 0,
        criticalDamage: 1.5,
    };
}

/**
 * createEmptyStatistics
 *
 * Creates an empty GameState with minimal statistics (for testing/initialization).
 *
 * @remarks
 * Useful for:
 * - Unit tests that need a minimal GameState
 * - Testing event processing without full world
 * - Initializing before loading save file
 *
 * @returns Minimal GameState with empty world/player data
 */
export function createEmptyStatistics(): Pick<GameState, 'playerStats'> {
    return {
        playerStats: createDefaultPlayerStats(),
    };
}
