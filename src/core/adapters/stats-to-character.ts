/**
 * Stats to Character Adapter
 *
 * OVERVIEW: Bridges PlayerStatusDefinition (factory) ↔ Character (entity)
 *
 * ## Problem This Solves
 *
 * Type mismatch: Code initialized stats with PlayerStatusDefinition
 * but engines (weather, effects) expect Character class.
 *
 * **Without adapter:**
 * ```typescript
 * const stats = ensurePlayerStats(...);  // PlayerStatusDefinition
 * weatherEngine.applyWeatherEffects(stats);  // Error: expects Character
 * ```
 *
 * **With adapter:**
 * ```typescript
 * const stats = ensurePlayerStats(...);
 * const character = adaptStatsToCharacter(stats);
 * weatherEngine.applyWeatherEffects(character);  // ✅ Works
 * ```
 *
 * ## Design Philosophy
 *
 * - **Minimal Invasive:** Only adapts at the boundary, doesn't change engines
 * - **Temporary Bridge:** Enables future unified type without changing existing code
 * - **Pure Function:** Stateless, immutable, easy to test
 * - **Single Responsibility:** Only converts, doesn't apply logic
 *
 * ## Adapter Pattern (Structural Design Pattern)
 *
 * Adapter converts incompatible interfaces. In this case:
 * - **Source:** PlayerStatusDefinition (data interface from factory)
 * - **Target:** Character (class entity expected by weather-engine)
 * - **Adapter:** adaptStatsToCharacter() function
 *
 * **Future Benefit:** Once Character and PlayerStatusDefinition are unified,
 * this adapter can be deleted with zero other changes needed.
 *
 * ## Notes
 *
 * - Character expects methods (takeDamage, heal, etc) but we only adapt data
 * - Weather engine only reads data, doesn't call methods, so this is safe
 * - If weather engine ADDS method calls, we'll need to wrap Character with proxy
 */

import type { Character } from '@/core/entities/character';
import type { PlayerStatusDefinition } from '@/core/types/game';

/**
 * Adapt PlayerStatusDefinition to Character interface
 *
 * Converts factory-created player stats to character entity expected by engines.
 * Creates a minimal Character-like object suitable for read-only operations
 * (weather effects, visibility, temperature calculations).
 *
 * @remarks
 * **What's converted:**
 * - All stat fields mapped 1:1
 * - Position defaults to {x: 0, y: 0} if not in stats
 * - inventory defaults to [] if not in stats
 * - activeEffects defaults to [] if not in stats
 * - skills defaults to [] if not in stats
 * - stats (attributes) mapped from attributes field
 *
 * **What's NOT converted:**
 * - Methods (takeDamage, heal) - not in PlayerStatusDefinition
 * - skillInstances Map - not persisted in factory stats
 * - flags object - can be recreated on load
 *
 * **Safe because:**
 * - Weather engine only reads fields, doesn't call methods
 * - This is a pure data conversion, no side effects
 * - Used at boundary (hooks ↔ engines), not internally
 *
 * @param stats - Player stats from factory (PlayerStatusDefinition)
 * @returns Object conforming to Character interface for engines
 *
 * @example
 * ```typescript
 * const playerStats = ensurePlayerStats(savedData);
 * const character = adaptStatsToCharacter(playerStats);
 *
 * // Now safe to pass to engines
 * const weatherEffects = weatherEngine.applyWeatherEffects(cell, character);
 * const effectChanges = effectEngine.applyEffect(effect, character);
 * ```
 */
export function adaptStatsToCharacter(stats: PlayerStatusDefinition): Partial<Character> {
    return {
        // Identity
        id: 'player',  // Player always has fixed ID
        name: stats.persona || 'Player',

        // Core stats
        level: stats.level ?? 1,
        experience: stats.experience ?? 0,
        health: stats.hp ?? 100,
        maxHealth: stats.maxHp ?? 100,
        stamina: stats.stamina ?? 100,
        maxStamina: stats.maxStamina ?? 100,
        mana: stats.mana ?? 50,
        maxMana: stats.maxMana ?? 50,
        bodyTemperature: stats.bodyTemperature ?? 37,

        // Inventory & items
        inventory: stats.items ?? [],
        activeEffects: [],  // Not in PlayerStatusDefinition, engine will populate
        skills: stats.skills ?? [],

        // Attributes (map from stats.attributes to Character.stats.CharacterStats)
        stats: {
            strength: stats.attributes?.physicalAttack ?? 10,
            dexterity: stats.attributes?.critChance ?? 5,
            intelligence: stats.attributes?.magicalAttack ?? 5,
            vitality: stats.attributes?.magicalDefense ?? 0,
            luck: stats.attributes?.cooldownReduction ?? 0,
        },

        // Position (default to origin if not in stats)
        position: { x: 0, y: 0 },

        // Equipment
        equippedItems: {
            weapon: stats.equipment?.weapon ?? undefined,
            armor: stats.equipment?.armor ?? undefined,
            accessories: [],
        },
    } as unknown as Partial<Character>;
}

/**
 * Reverse adapter: Character → PlayerStatusDefinition
 *
 * Converts Character data back to PlayerStatusDefinition format for storage.
 * Used when syncing character changes back to player stats.
 *
 * @remarks
 * **Conversion logic:**
 * - Character.health → PlayerStatusDefinition.hp
 * - Character.maxHealth → PlayerStatusDefinition.maxHp
 * - Character.stats.strength → attributes.physicalAttack
 * - Character.position is NOT synced (handled by separate position state)
 *
 * **Not converted:**
 * - skillInstances (Map, not in PlayerStatusDefinition)
 * - flags (runtime state, recreated)
 *
 * @param character - Character entity from engine
 * @param currentStats - Current PlayerStatusDefinition to merge with
 * @returns Updated PlayerStatusDefinition with character changes
 *
 * @example
 * ```typescript
 * // After weather engine applies temperature damage
 * const character = adaptedCharacter;
 * character.health = 85;  // Took 15 damage
 *
 * const updatedStats = revertStatsFromCharacter(character, playerStats);
 * setPlayerStats(updatedStats);
 * ```
 */
export function revertStatsFromCharacter(
    character: Partial<Character>,
    currentStats: PlayerStatusDefinition
): PlayerStatusDefinition {
    return {
        ...currentStats,

        // Update health/mana/stamina from character
        hp: character.health ?? currentStats.hp,
        maxHp: character.maxHealth ?? currentStats.maxHp,
        mana: character.mana ?? currentStats.mana,
        maxMana: character.maxMana ?? currentStats.maxMana,
        stamina: character.stamina ?? currentStats.stamina,
        maxStamina: character.maxStamina ?? currentStats.maxStamina,
        bodyTemperature: character.bodyTemperature ?? currentStats.bodyTemperature,

        // Update level/experience if character changed them
        level: character.level ?? currentStats.level,
        experience: character.experience ?? currentStats.experience,

        // Update attributes from character stats
        attributes: {
            ...currentStats.attributes,
            physicalAttack: character.stats?.strength ?? currentStats.attributes.physicalAttack,
            magicalAttack: character.stats?.intelligence ?? currentStats.attributes.magicalAttack,
            physicalDefense: character.stats?.vitality ?? currentStats.attributes.physicalDefense,
            magicalDefense: character.stats?.vitality ?? currentStats.attributes.magicalDefense,
            critChance: character.stats?.dexterity ?? currentStats.attributes.critChance,
        },

        // Note: position NOT updated here (handled separately by playerPosition state)
        // Note: inventory NOT updated here (handled separately by inventory system)
    };
}

/**
 * Check if stats are safely adaptable to Character
 *
 * Validates that stats have minimum required fields for adaptation.
 * Used to ensure adapter won't create invalid Character objects.
 *
 * @param stats - Stats to validate
 * @returns true if stats have minimum fields, false otherwise
 *
 * @example
 * ```typescript
 * if (!canAdaptStatsToCharacter(stats)) {
 *     console.warn('Stats missing required fields, using defaults');
 *     stats = ensurePlayerStats(stats);  // Fill in defaults
 * }
 * ```
 */
export function canAdaptStatsToCharacter(stats: any): stats is PlayerStatusDefinition {
    return (
        typeof stats === 'object' &&
        stats !== null &&
        (typeof stats.hp === 'number' || typeof stats.maxHp === 'number') &&
        (typeof stats.level === 'number' || typeof stats.experience === 'number')
    );
}
