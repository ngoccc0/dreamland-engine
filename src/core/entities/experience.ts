

/**
 * Defines the experience requirements and rewards for a specific character level.
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
