import { Skill, SkillTree } from '../entities/skill';
import { Combatant } from '../entities/combat';
import { Experience } from '../entities/experience';

export interface ISkillUseCase {
    learnSkill(characterId: string, skillId: string): Promise<boolean>;
    levelUpSkill(characterId: string, skillId: string): Promise<boolean>;
    useSkill(caster: Combatant, skill: Skill, targets: Combatant[]): Promise<void>;
}

export class SkillUseCase implements ISkillUseCase {
    constructor(
        private readonly characterRepository: any, // Will be defined in infrastructure layer
        private readonly skillRepository: any     // Will be defined in infrastructure layer
    ) {}

    async learnSkill(characterId: string, skillId: string): Promise<boolean> {
        const character = await this.characterRepository.findById(characterId);
        if (!character) throw new Error('Character not found');

        const skillTree = character.skillTree;
        if (!skillTree.canUnlockSkill(skillId)) {
            return false;
        }

        const success = skillTree.unlockSkill(skillId);
        if (success) {
            await this.characterRepository.save(character);
        }
        return success;
    }

    async levelUpSkill(characterId: string, skillId: string): Promise<boolean> {
        const character = await this.characterRepository.findById(characterId);
        if (!character) throw new Error('Character not found');

        const success = character.skillTree.levelUpSkill(skillId);
        if (success) {
            await this.characterRepository.save(character);
        }
        return success;
    }

    async useSkill(caster: Combatant, skill: Skill, targets: Combatant[]): Promise<void> {
        if (!skill.isReady()) {
            throw new Error('Skill is on cooldown');
        }

        // Check resource cost
        const { type: resourceType, value: cost } = skill.resourceCost;
        if (!this.hasEnoughResource(caster, resourceType, cost)) {
            throw new Error(`Not enough ${resourceType.toLowerCase()}`);
        }

        // Apply skill effects
        const effects = skill.getEffectsAtLevel();
        for (const target of targets) {
            for (const effect of effects) {
                if (Math.random() <= (effect.chance || 1)) {
                    await this.applyEffect(effect, caster, target);
                }
            }
        }

        // Start cooldown and consume resources
        skill.startCooldown();
        this.consumeResource(caster, resourceType, cost);
    }

    private hasEnoughResource(
        character: Combatant, 
        resourceType: 'MANA' | 'STAMINA' | 'HEALTH', 
        amount: number
    ): boolean {
        // Implementation depends on how resources are stored in Combatant
        return true; // Placeholder
    }

    private consumeResource(
        character: Combatant, 
        resourceType: 'MANA' | 'STAMINA' | 'HEALTH', 
        amount: number
    ): void {
        // Implementation depends on how resources are stored in Combatant
    }

    private async applyEffect(
        effect: any,
        caster: Combatant,
        target: Combatant
    ): Promise<void> {
        // Implementation of effect application
    }
}
