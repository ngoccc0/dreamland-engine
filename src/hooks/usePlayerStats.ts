/**
 * usePlayerStats Hook
 *
 * Calculates player's effective statistics including:
 * - Base stats from character.stats (5 core stats)
 * - Equipment bonuses (tier/grade scaled)
 * - Artifact set passive bonuses
 *
 * @remarks
 * This hook provides a **pure computation** of all player stats.
 * Bonuses are applied in layers:
 * 1. Base stats from character.stats (strength, dexterity, intelligence, vitality, luck)
 * 2. Equipment bonuses (per equipped item with tier/grade multipliers)
 * 3. Artifact set bonuses (passive bonuses from completed sets)
 *
 * The result is used by combat engine and UI for displaying effective stats.
 * When equipment/artifacts change, recalculate by calling this hook again.
 *
 * @example
 * ```typescript
 * const effectiveStats = usePlayerStats(character, unlockedArtifactSets);
 * console.log(effectiveStats.strength); // 10 (base) + 5 (equipment) + 3 (artifacts) = 18
 * ```
 */

import type { Character } from '@/core/entities/character';
import type { CharacterStats } from '@/core/entities/character';
import type { UnlockedArtifactSet } from '@/core/types/game';

/**
 * Represents a player's effective stats after applying all bonuses.
 * Each stat includes the base value plus all active bonuses.
 */
export interface EffectiveStats extends CharacterStats {
    /** Calculated health points based on vitality */
    maxHealth: number;
    /** Calculated mana points based on intelligence */
    maxMana: number;
    /** Breakdown of where bonuses come from (for UI/debugging) */
    breakdown: {
        base: CharacterStats;
        equipment: Partial<CharacterStats>;
        artifacts: Partial<CharacterStats>;
    };
}

/**
 * Calculates player's effective statistics including base, equipment, and artifact bonuses.
 *
 * @param {Character} character - The character entity with base stats and equipment
 * @param {UnlockedArtifactSet[] | undefined} unlockedSets - Artifact sets that have been completed
 * @returns {EffectiveStats} The calculated effective statistics with bonus breakdown
 *
 * @remarks
 * **Calculation Order**:
 * 1. Start with base stats from character.stats
 * 2. Add equipment bonuses:
 *    - Weapon: bonus × (1 + (tier-1)×0.1) × (1 + grade×0.1)
 *    - Armor: bonus × (1 + (tier-1)×0.1) × (1 + grade×0.1)
 *    - Accessories (up to 4): bonus × (1 + (tier-1)×0.1) × (1 + grade×0.1) per slot
 * 3. Add artifact set bonuses (applied as passive buffs once set is complete)
 * 4. Calculate derived stats:
 *    - maxHealth = 10 + vitality×2
 *    - maxMana = 5 + intelligence×1.5
 *
 * **Bonus Model: PASSIVE BUFF**
 * - Bonuses are NOT permanent until applied
 * - When equipment unequipped/artifact set lost, bonuses disappear immediately
 * - Combat engine must recalculate stats on state changes
 * - This allows for dynamic stat swapping and builds flexibility
 *
 * @example
 * ```typescript
 * // Character with leather armor (tier 2, grade 1) equipped
 * const char = new Character('p1', 'Hero', { strength: 10, ... });
 * char.equippedItems.armor = { bonus: 5, tier: 2, grade: 1 }; // +5 VIT
 *
 * const stats = usePlayerStats(char, []);
 * // Base: { vitality: 10 }, Equipment: { vitality: 5 × 1.1 × 1.1 = 6.05 }
 * // Result: { vitality: 16.05 }
 * ```
 */
export function usePlayerStats(
    character: Character,
    unlockedSets?: UnlockedArtifactSet[]
): EffectiveStats {
    // Initialize breakdown tracking with base stats
    const breakdown = {
        base: { ...character.stats },
        equipment: {
            strength: 0,
            dexterity: 0,
            intelligence: 0,
            vitality: 0,
            luck: 0
        } as Partial<CharacterStats>,
        artifacts: {
            strength: 0,
            dexterity: 0,
            intelligence: 0,
            vitality: 0,
            luck: 0
        } as Partial<CharacterStats>
    };

    // Start with base stats
    let stats: Partial<CharacterStats> = { ...character.stats };

    // **LAYER 2: Equipment Bonuses**
    if (character.equippedItems) {
        // Weapon bonus
        if (character.equippedItems.weapon) {
            const bonus = calculateEquipmentBonus(character.equippedItems.weapon);
            applyBonusToStats(stats, bonus, breakdown.equipment);
        }

        // Armor bonus
        if (character.equippedItems.armor) {
            const bonus = calculateEquipmentBonus(character.equippedItems.armor);
            applyBonusToStats(stats, bonus, breakdown.equipment);
        }

        // Accessory bonuses (up to 4)
        if (character.equippedItems.accessories && Array.isArray(character.equippedItems.accessories)) {
            for (const accessory of character.equippedItems.accessories) {
                if (accessory) {
                    const bonus = calculateEquipmentBonus(accessory);
                    applyBonusToStats(stats, bonus, breakdown.equipment);
                }
            }
        }
    }

    // **LAYER 3: Artifact Set Bonuses (PASSIVE BUFF)**
    if (unlockedSets && unlockedSets.length > 0) {
        for (const set of unlockedSets) {
            if (set.bonuses) {
                // Map artifact bonus field names to stat names
                const artifactBonus: Partial<CharacterStats> = {};
                if (set.bonuses.str !== undefined) artifactBonus.strength = set.bonuses.str;
                if (set.bonuses.dex !== undefined) artifactBonus.dexterity = set.bonuses.dex;
                if (set.bonuses.con !== undefined) {
                    // 'con' maps to 'vitality' in CharacterStats
                    artifactBonus.vitality = set.bonuses.con;
                }
                if (set.bonuses.int !== undefined) artifactBonus.intelligence = set.bonuses.int;
                if (set.bonuses.wis !== undefined) {
                    // 'wis' doesn't have a direct map, could use vitality/luck
                    artifactBonus.luck = (artifactBonus.luck ?? 0) + set.bonuses.wis;
                }
                if (set.bonuses.cha !== undefined) {
                    // 'cha' doesn't have a direct map, could use luck
                    artifactBonus.luck = (artifactBonus.luck ?? 0) + set.bonuses.cha;
                }

                applyBonusToStats(stats, artifactBonus, breakdown.artifacts);
            }
        }
    }

    // Calculate derived stats
    const maxHealth = 10 + ((stats.vitality ?? 10) * 2);
    const maxMana = 5 + ((stats.intelligence ?? 10) * 1.5);

    return {
        strength: Math.floor(stats.strength ?? 10),
        dexterity: Math.floor(stats.dexterity ?? 10),
        intelligence: Math.floor(stats.intelligence ?? 10),
        vitality: Math.floor(stats.vitality ?? 10),
        luck: Math.floor(stats.luck ?? 10),
        maxHealth,
        maxMana,
        breakdown
    };
}

/**
 * Apply bonus object to stats and breakdown tracking.
 *
 * @param {Partial<CharacterStats>} stats - Stats object to modify
 * @param {Partial<CharacterStats>} bonus - Bonuses to apply
 * @param {Partial<CharacterStats>} breakdownTrack - Breakdown object to update
 */
function applyBonusToStats(
    stats: Partial<CharacterStats>,
    bonus: Partial<CharacterStats>,
    breakdownTrack: Partial<CharacterStats>
): void {
    Object.keys(bonus).forEach(key => {
        const statKey = key as keyof CharacterStats;
        const value = bonus[statKey];
        if (value !== undefined && value > 0) {
            stats[statKey] = (stats[statKey] ?? 10) + value;
            breakdownTrack[statKey] = (breakdownTrack[statKey] ?? 0) + value;
        }
    });
}

/**
 * Calculates equipment bonus with tier/grade multipliers.
 *
 * **Formula**: `bonus × (1 + (tier-1)×0.1) × (1 + grade×0.1)`
 * - Tier 1 = 1.0x, Tier 6 = 1.5x
 * - Grade 0 = 1.0x, Grade 5 = 1.5x
 *
 * @param {any} equipment - Equipment item with bonus, tier, grade properties
 * @returns {Partial<CharacterStats>} Calculated bonuses for each stat
 *
 * @example
 * ```typescript
 * // Iron Sword: bonus +3 STR, tier 2, grade 1
 * const bonus = calculateEquipmentBonus({ bonus: 3, tier: 2, grade: 1, itemId: 'weapon_iron_sword' });
 * // Result: { strength: 3 × 1.1 × 1.1 = 3.63 }
 * ```
 */
function calculateEquipmentBonus(equipment: any): Partial<CharacterStats> {
    if (!equipment) {
        return {};
    }

    const tier = equipment.tier ?? 1;
    const grade = equipment.grade ?? 0;

    // Tier multiplier: tier 1 = 1.0, tier 6 = 1.5
    const tierMult = 1 + (Math.max(1, Math.min(6, tier)) - 1) * 0.1;

    // Grade multiplier: grade 0 = 1.0, grade 5 = 1.5
    const gradeMult = 1 + Math.max(0, Math.min(5, grade)) * 0.1;

    // Total multiplier
    const totalMult = tierMult * gradeMult;

    const result: Partial<CharacterStats> = {};

    // Standard bonus field
    if (equipment.bonus && typeof equipment.bonus === 'number' && equipment.bonus > 0) {
        // Determine primary stat based on equipment type
        const itemId = equipment.itemId?.toLowerCase() ?? '';
        let primaryStat: keyof CharacterStats = 'strength';

        if (itemId.includes('armor') || itemId.includes('shield') || itemId.includes('robe')) {
            primaryStat = 'vitality';
        } else if (itemId.includes('ring') || itemId.includes('amulet') || itemId.includes('wand')) {
            primaryStat = 'intelligence';
        } else if (itemId.includes('dagger') || itemId.includes('bow')) {
            primaryStat = 'dexterity';
        }

        result[primaryStat] = equipment.bonus * totalMult;
    }

    // Per-stat bonuses (if equipment has specific stat values)
    const statFields: (keyof CharacterStats)[] = ['strength', 'dexterity', 'intelligence', 'vitality', 'luck'];
    for (const stat of statFields) {
        if (equipment[stat] && typeof equipment[stat] === 'number' && equipment[stat] > 0) {
            result[stat] = (result[stat] ?? 0) + equipment[stat] * totalMult;
        }
    }

    return result;
}

/**
 * Hook to recalculate stats when character state changes.
 * Use this in React components to trigger stat updates.
 *
 * @remarks
 * This hook should be called whenever:
 * - Equipment is changed
 * - Artifact sets are unlocked/locked
 * - Character base stats change
 *
 * @example
 * ```typescript
 * const MyCharacterSheet = () => {
 *   const character = useCharacter();
 *   const unlockedSets = usePlayerState(state => state.unlockedArtifactSets);
 *   const stats = useRecalculateStats(character, unlockedSets);
 *
 *   return <div>STR: {stats.strength}</div>;
 * };
 * ```
 */
export function useRecalculateStats(
    character: Character,
    unlockedSets?: UnlockedArtifactSet[]
) {
    return usePlayerStats(character, unlockedSets);
}
