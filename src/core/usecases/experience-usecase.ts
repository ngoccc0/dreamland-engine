import { Experience, LevelUpResult } from '../entities/experience';
import { SkillTree } from '../entities/skill';

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

    private async handleUnlockables(character: any, unlockables: string[]): Promise<void> {
        // Implementation for handling unlockable content
    }
}
