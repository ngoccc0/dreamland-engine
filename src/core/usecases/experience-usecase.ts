import type { LevelUpResult } from '../entities/experience';

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
    ) {}

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
        return Math.floor(100 * (Math.pow(1.5, level - 1)));
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
