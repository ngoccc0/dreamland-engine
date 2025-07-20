import { TranslatableString } from '../types/i18n';

export interface ExperienceLevel {
    level: number;
    requiredExp: number;
    rewards?: {
        skillPoints?: number;
        statPoints?: number;
        unlockables?: string[];
    };
}

export class Experience {
    private _currentExp: number;
    private _currentLevel: number;
    private readonly _levelThresholds: ExperienceLevel[];

    constructor(
        initialExp: number = 0,
        levelThresholds: ExperienceLevel[] = defaultLevelThresholds
    ) {
        this._currentExp = initialExp;
        this._levelThresholds = levelThresholds;
        this._currentLevel = this.calculateLevel(initialExp);
    }

    get currentExp(): number {
        return this._currentExp;
    }

    get currentLevel(): number {
        return this._currentLevel;
    }

    get nextLevelExp(): number {
        const nextLevel = this._levelThresholds.find(lt => lt.level === this._currentLevel + 1);
        return nextLevel?.requiredExp || Infinity;
    }

    get expToNextLevel(): number {
        return this.nextLevelExp - this._currentExp;
    }

    get currentLevelData(): ExperienceLevel {
        return this._levelThresholds.find(lt => lt.level === this._currentLevel)!;
    }

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

export interface LevelUpResult {
    levelsGained: number;
    newLevel: number;
    levelUps: ExperienceLevel[];
}

// Default level thresholds following a common RPG progression
const defaultLevelThresholds: ExperienceLevel[] = Array.from({ length: 100 }, (_, i) => ({
    level: i + 1,
    requiredExp: Math.floor(100 * (Math.pow(1.5, i))),
    rewards: {
        skillPoints: (i + 1) % 5 === 0 ? 1 : 0,
        statPoints: 3,
        unlockables: []
    }
}));
