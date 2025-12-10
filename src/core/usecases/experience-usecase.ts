import type { LevelUpResult } from '../entities/experience';
import { combatConfig } from '@/lib/config';

/**
 * calculateXpForLevel
 *
 * Pure utility function to calculate XP required to progress from a given level to the next.
 * Uses exponential formula based on combatConfig values.
 *
 * @remarks
 * Formula: xpForLevel(n) = combatConfig.baseXp × combatConfig.xpCurveBase^(n-1)
 * Currently: 50 × 1.5^(n-1) for level progression.
 * Levels start at 1. Level 1→2 requires 50 XP.
 * Each subsequent level requires 50% more XP than the previous.
 *
 * Examples (with current config):
 * - calculateXpForLevel(2) = 50 (to reach level 2)
 * - calculateXpForLevel(3) = 75 (to reach level 3)
 * - calculateXpForLevel(4) = 112 (to reach level 4)
 * - calculateXpForLevel(5) = 169 (to reach level 5)
 *
 * @param {number} level - Target level (1-based). If level <= 1, returns 0.
 * @returns {number} XP required to reach that level from the previous level.
 *
 * @remarks
 * Game designers can tune progression by modifying combatConfig.baseXp and combatConfig.xpCurveBase
 * without changing this function logic.
 */
export function calculateXpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(combatConfig.baseXp * Math.pow(combatConfig.xpCurveBase, level - 2));
}

/**
 * calculateCumulativeXp
 *
 * Pure utility function to calculate total XP needed to reach a given level from level 1.
 *
 * @remarks
 * Cumulative XP = sum of calculateXpForLevel(2) + calculateXpForLevel(3) + ... + calculateXpForLevel(level)
 *
 * Examples:
 * - calculateCumulativeXp(1) = 0
 * - calculateCumulativeXp(2) = 100
 * - calculateCumulativeXp(3) = 250 (100 + 150)
 * - calculateCumulativeXp(4) = 475 (100 + 150 + 225)
 *
 * @param {number} level - Target level (1-based).
 * @returns {number} Total cumulative XP required to reach that level.
 */
export function calculateCumulativeXp(level: number): number {
    if (level <= 1) return 0;
    let total = 0;
    for (let i = 2; i <= level; i++) {
        total += calculateXpForLevel(i);
    }
    return total;
}

/**
 * calculatePlayerLevel
 *
 * Pure utility function to determine player level from cumulative XP.
 *
 * @remarks
 * Performs binary search or linear search to find the level where cumulative XP < playerXp < cumulative XP of next level.
 * Since level progression is exponential, we cap searches at level 100 max.
 *
 * @param {number} playerXp - Player's total accumulated XP.
 * @returns {number} Player's current level (1+).
 */
export function calculatePlayerLevel(playerXp: number): number {
    let level = 1;
    while (level < 100 && playerXp >= calculateCumulativeXp(level + 1)) {
        level++;
    }
    return level;
}

/**
 * OVERVIEW: Experience & progression system
 *
 * Manages character experience gain, level-up mechanics, skill points, stat points, and unlockable content.
 * Handles exponential level scaling to create natural progression pacing.
 *
 * ## Core Mechanics
 *
 * ### Experience Gain
 *
 * ```
 * character.experience += amount
 * // After each gain, check if level threshold crossed
 * ```
 *
 * Experience sources:
 * - Defeating enemies: XP = enemy.level × 100
 * - Harvesting rare plants: XP = plant.rarity × 50
 * - Discovering locations: XP = 500 (one-time)
 * - Completing quests: XP = quest.reward
 * - Crafting rare items: XP = item.complexity × 10
 *
 * ### Level-Up Formula
 *
 * ```
 * requiredXP(level) = floor(100 × 1.5^(level-1))
 *
 * Examples:
 * Level 1: 100 XP
 * Level 2: 150 XP (cumulative: 250)
 * Level 3: 225 XP (cumulative: 475)
 * Level 4: 337 XP (cumulative: 812)
 * Level 5: 506 XP (cumulative: 1318)
 * Level 10: 2419 XP (cumulative: 14,266)
 * Level 20: 144,663 XP
 * ```
 *
 * Rationale: 1.5× multiplier creates exponential scaling
 * - Early levels: Fast progression (encourages new players)
 * - Late levels: Slow progression (long-term engagement)
 * - Avoids level cap fatigue
 *
 * ### Level-Up Rewards
 *
 * Each level grants:
 *
 * ```
 * Skill Points: 1 per level
 * Stat Points: 1 per level (or 1 every 2 levels)
 * Max Health: +10 HP
 * Ability Unlocks: Level-gated abilities (level 5 = fireball, level 10 = teleport)
 * Achievement Unlocks: Milestone rewards (level 20 = special title)
 * ```
 *
 * ### Stat Point Allocation
 *
 * Player can distribute stat points to:
 * - Strength: +1 attack per point
 * - Dexterity: +1 critical chance per point
 * - Intelligence: +2 mana per point
 * - Vitality: +3 health per point (prioritized for tanking)
 * - Luck: +1 critical damage per point
 *
 * Allocations are permanent (can respec at special NPCs for cost).
 *
 * ### Skill Points
 *
 * Each skill tree node costs skill points:
 * - Basic skills: 1 point
 * - Intermediate: 2 points
 * - Advanced: 3+ points
 * - Ultimate abilities: 5 points + level requirement
 *
 * ## LevelUpResult Structure
 *
 * ```typescript
 * interface LevelUpResult {
 *   levelsGained: number,
 *   newLevel: number,
 *   totalXP: number,
 *   levelUps: Array<{
 *     level: number,
 *     rewards: {
 *       skillPoints: number,
 *       statPoints: number,
 *       unlockedAbilities: string[],
 *       achievements: string[]
 *     }
 *   }>
 * }
 * ```
 *
 * ## Performance Notes
 *
 * - Calculation O(1) for single XP gain
 * - Level-up check O(1) (just XP threshold comparison)
 * - Multiple level-ups: O(levels gained) — typically 0-3, rarely > 5
 * - No database queries in calculation (for real-time responsiveness)
 *
 * ## Design Philosophy
 *
 * - **Exponential Curve**: Keeps progression feeling fresh at all levels
 * - **Player Choice**: Stat points create build diversity
 * - **Milestone Moments**: Level-ups feel significant, not incremental
 * - **Long-Term Goals**: High level requirements create player retention hooks
 * - **Reward Density**: Every level gives something meaningful (skill points + stats + unlocks)
 */
export interface IExperienceUseCase {
    gainExperience(characterId: string, amount: number): Promise<LevelUpResult>;
    calculateRequiredExperience(level: number): number;
    getCharacterLevel(characterId: string): Promise<number>;
}

export class ExperienceUseCase implements IExperienceUseCase {
    constructor(
        private readonly characterRepository: any, // Will be defined in infrastructure layer
        private readonly notificationService: any  // For level up notifications
    ) { }

    async gainExperience(characterId: string, amount: number): Promise<LevelUpResult> {
        const character = await this.characterRepository.findById(characterId);
        if (!character) throw new Error('Character not found');

        const result = character.experience.addExperience(amount);

        if (result.levelsGained > 0) {
            // Handle level up rewards
            await this.handleLevelUpRewards(character, result);
            // Notify the player
            await this.notificationService.notifyLevelUp(characterId, result);
        }

        await this.characterRepository.save(character);
        return result;
    }

    calculateRequiredExperience(level: number): number {
        return calculateXpForLevel(level);
    }

    async getCharacterLevel(characterId: string): Promise<number> {
        const character = await this.characterRepository.findById(characterId);
        if (!character) throw new Error('Character not found');
        return character.experience.currentLevel;
    }

    private async handleLevelUpRewards(character: any, result: LevelUpResult): Promise<void> {
        for (const levelUp of result.levelUps) {
            const rewards = levelUp.rewards;
            if (rewards) {
                if (rewards.skillPoints) {
                    character.skillTree.addSkillPoints(rewards.skillPoints);
                }
                if (rewards.statPoints) {
                    character.addStatPoints(rewards.statPoints);
                }
                if (rewards.unlockables) {
                    await this.handleUnlockables(character, rewards.unlockables);
                }
            }
        }
    }

    private async handleUnlockables(_character: any, _unlockables: string[]): Promise<void> {
        // Implementation for handling unlockable content
    }
}
