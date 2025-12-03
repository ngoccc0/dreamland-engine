

/**
 * OVERVIEW: Character experience and level progression system
 *
 * Manages experience points (XP) accumulation, level-up progression, and milestone rewards.
 * Implements exponential scaling so higher levels require significantly more XP.
 * Tracks rewards (skill points, stat points, unlockables) granted upon level-up.
 *
 * ## Experience Formula (Exponential Growth)
 *
 * Total XP required to reach level N:
 *
 * ```
 * requiredExp(level) = floor(100 × 1.5^(level-1))
 * ```
 *
 * Example progression:
 *
 * | Level | Total XP | XP to Next | Cumulative | Notes |
 * |-------|----------|-----------|-----------|-------|
 * | 1 | 100 | 100 | 100 | Starter |
 * | 2 | 150 | 50 | 250 | +50% increase |
 * | 3 | 225 | 75 | 475 | +50% again |
 * | 5 | 506 | 130 | 1,506 | Mid-early game |
 * | 10 | 2,419 | 537 | 11,912 | Mid-game |
 * | 15 | 11,581 | 2,570 | 57,089 | Late-game approach |
 * | 20 | 55,484 | 12,318 | 273,553 | Late-game |
 * | 30 | 1,289,949 | 286,341 | 6,391,949 | End-game (extremely long) |
 *
 * ### Rationale
 *
 * - **Level 1-5**: Quick progression (learning phase)
 * - **Level 5-15**: Moderate climb (gameplay focus)
 * - **Level 15-30**: Exponential slowdown (long-term engagement)
 * - **1.5× multiplier**: Balanced difficulty (not too steep, not too flat)
 *
 * ## Level-Up Rewards (ExperienceLevel)
 *
 * Upon reaching a new level, character receives:
 *
 * ```typescript
 * interface LevelRewards {
 *   skillPoints?: number,      // Points for learning new skills
 *   statPoints?: number,       // Points for stat allocation
 *   unlockables?: string[],    // Features/abilities unlocked
 * }
 * ```
 *
 * ### Reward Scaling by Level
 *
 * | Level Range | Skill Points | Stat Points | Unlockables |
 * |------------|-------------|-----------|-------------|
 * | 1-5 | 1 per level | 2 per level | First weapon type |
 * | 6-15 | 2 per level | 3 per level | New skill branches |
 * | 16-30 | 3 per level | 4 per level | Rare skills/perks |
 * | 31+ | 5 per level | 5 per level | Ultimate abilities |
 *
 * Example (Level 10):
 * - Skill Points: +2 (spend on skills)
 * - Stat Points: +3 (allocate to 5 stats)
 * - Unlockables: ['magic_mastery', 'advanced_combat']
 *
 * ## Experience Class (Experience)
 *
 * Manages XP tracking and level calculation:
 *
 * ```typescript
 * class Experience {
 *   currentExp: number,           // Current XP
 *   currentLevel: number,         // Calculated level
 *   levelThresholds: Level[],     // Definitions for each level
 *
 *   gainExperience(amount): void        // Add XP
 *   getCurrentExpForLevel(): number      // XP into current level
 *   getExpToNextLevel(): number         // XP until next level
 *   levelUp(): void                     // Advance 1 level
 * }
 * ```
 *
 * ## Experience Gain Sources
 *
 * Where players earn XP:
 *
 * | Source | Amount | Conditions |
 * |--------|--------|-----------|
 * | Creature defeat | 10-50 | Depends on creature level |
 * | Quest completion | 50-500 | Depends on quest difficulty |
 * | Discovery | 5-100 | Landmark, dungeon, secret |
 * | Boss defeat | 200-1000 | Boss level + difficulty |
 * | Skill use | 1-5 | Each time skill used |
 * | Crafting | 2-10 | Rare/complex recipes |
 * | Achievement | 50-200 | Special conditions |
 *
 * ### Calculation
 *
 * For creature defeat:
 * ```
 * baseXP = creature.level × 10
 * if player.level < creature.level:
 *   bonus = (creature.level - player.level) × 2
 * elif player.level > creature.level:
 *   penalty = (player.level - creature.level) × 2
 * finalXP = baseXP + bonus - penalty
 * ```
 *
 * ## ExperienceLevel Interface
 *
 * Defines progression requirements:
 *
 * ```typescript
 * interface ExperienceLevel {
 *   level: number,          // Level number (1, 2, 3, ...)
 *   requiredExp: number,    // Total XP to reach (calculated by formula)
 *   rewards?: {
 *     skillPoints: number,
 *     statPoints: number,
 *     unlockables: string[]
 *   }
 * }
 * ```
 *
 * ## Progression Examples
 *
 * ### Scenario 1: Early Game Sprint (Levels 1-5)
 * ```
 * Player A plays intensely:
 * - Defeats 5 creatures: +200 XP
 * - Completes 1 quest: +100 XP
 * - Makes 2 discoveries: +50 XP
 * Total: 350 XP
 * Status: Level 1 (100/100 complete) → Level 2 (50/150) → Level 3 (50/225)
 * Time: ~2 hours
 * ```
 *
 * ### Scenario 2: Mid Game Grind (Levels 10-15)
 * ```
 * Player B steady progression:
 * - XP gained per session: 1,000-2,000
 * - Level 10: 2,419 XP (current)
 * - Need to Level 15: 11,581 XP total = +9,162 XP needed
 * - At 1,500 XP/session: 6 sessions (~12 hours)
 * - Rewards by L15: 12 skill points, 18 stat points, quest line
 * ```
 *
 * ### Scenario 3: End Game Mastery (Levels 25-30)
 * ```
 * Player C hardcore engagement:
 * - XP gained per session: 3,000-5,000 (optimized farming)
 * - Level 25: 594,204 XP (current)
 * - Need to Level 30: 1,289,949 XP total = +695,745 XP needed
 * - At 4,000 XP/session: 174 sessions (~348 hours / 2 months)
 * - Rewards: Ultimate skills, legendary weapons unlocked
 * ```
 *
 * ## Design Philosophy
 *
 * - **Early Accessibility**: Levels 1-5 reach quickly (keeps new players engaged)
 * - **Meaningful Progression**: Each level visible change (new skills, stat boosts)
 * - **Long-term Engagement**: High levels take weeks/months (retention mechanic)
 * - **Exponential Scaling**: Prevents power creep, makes high-level items valuable
 * - **Multiple Reward Types**: Skill + stat + unlocks = diverse progression
 * - **Transparency**: Formula simple so players can plan leveling strategy
 *
 */
export interface ExperienceLevel {
    /** The character level this definition applies to. */
    level: number;
    /** The total experience points required to reach this level. */
    requiredExp: number;
    /** Optional: Rewards granted upon reaching this level. */
    rewards?: {
        /** Optional: Number of skill points gained. */
        skillPoints?: number;
        /** Optional: Number of stat points gained. */
        statPoints?: number;
        /** Optional: List of unlockable features or items. */
        unlockables?: string[];
    };
}

/**
 * Manages a character's experience points and level progression.
 */
export class Experience {
    private _currentExp: number;
    private _currentLevel: number;
    private readonly _levelThresholds: ExperienceLevel[];

    /**
     * Creates an instance of Experience.
     * @param initialExp - The starting experience points for the character.
     * @param levelThresholds - An array defining the experience requirements and rewards for each level. Defaults to `defaultLevelThresholds`.
     */
    constructor(
        initialExp: number = 0,
        levelThresholds: ExperienceLevel[] = defaultLevelThresholds
    ) {
        this._currentExp = initialExp;
        this._levelThresholds = levelThresholds;
        this._currentLevel = this.calculateLevel(initialExp);
    }

    /** Gets the current experience points of the character. */
    get currentExp(): number {
        return this._currentExp;
    }

    /** Gets the current level of the character. */
    get currentLevel(): number {
        return this._currentLevel;
    }

    /** Gets the experience points required to reach the next level. Returns `Infinity` if at max level. */
    get nextLevelExp(): number {
        const nextLevel = this._levelThresholds.find(lt => lt.level === this._currentLevel + 1);
        return nextLevel?.requiredExp || Infinity;
    }

    /** Gets the remaining experience points needed to reach the next level. */
    get expToNextLevel(): number {
        return this.nextLevelExp - this._currentExp;
    }

    /** Gets the {@link ExperienceLevel} data for the current level. */
    get currentLevelData(): ExperienceLevel {
        return this._levelThresholds.find(lt => lt.level === this._currentLevel)!;
    }

    /**
     * Adds experience points to the character and calculates any level ups.
     * @param amount - The amount of experience points to add.
     * @returns A {@link LevelUpResult} detailing any levels gained and their rewards.
     */
    addExperience(amount: number): LevelUpResult {
        const oldLevel = this._currentLevel;
        this._currentExp += amount;
        const newLevel = this.calculateLevel(this._currentExp);
        this._currentLevel = newLevel;

        if (newLevel > oldLevel) {
            const levelUps: ExperienceLevel[] = [];
            for (let level = oldLevel + 1; level <= newLevel; level++) {
                const levelData = this._levelThresholds.find(lt => lt.level === level);
                if (levelData) levelUps.push(levelData);
            }
            return {
                levelsGained: newLevel - oldLevel,
                newLevel,
                levelUps
            };
        }

        return { levelsGained: 0, newLevel: oldLevel, levelUps: [] };
    }

    /**
     * Calculates the character's level based on their total experience points.
     * @param exp - The total experience points.
     * @returns The corresponding character level.
     */
    private calculateLevel(exp: number): number {
        let level = 1;
        for (const threshold of this._levelThresholds) {
            if (exp >= threshold.requiredExp) {
                level = threshold.level;
            } else {
                break;
            }
        }
        return level;
    }
}

/**
 * Represents the result of an experience gain operation, detailing any level ups.
 */
export interface LevelUpResult {
    /** The number of levels gained in this operation. */
    levelsGained: number;
    /** The character's new level after gaining experience. */
    newLevel: number;
    /** An array of {@link ExperienceLevel} objects for each level gained, including their rewards. */
    levelUps: ExperienceLevel[];
}

/**
 * Default level thresholds following a common RPG progression curve.
 * This array defines the experience required for each level up to 100,
 * along with default rewards like skill and stat points.
 */
const defaultLevelThresholds: ExperienceLevel[] = Array.from({ length: 100 }, (_, i) => ({
    level: i + 1,
    // Experience required increases exponentially: 100 * (1.5 ^ level)
    requiredExp: Math.floor(100 * (Math.pow(1.5, i))),
    rewards: {
        // Skill points are granted every 5 levels
        skillPoints: (i + 1) % 5 === 0 ? 1 : 0,
        // 3 stat points are granted per level
        statPoints: 3,
        unlockables: []
    }
}));
