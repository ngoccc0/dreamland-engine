import { Skill } from '../entities/skill';
import { Combatant } from '../entities/combat';
// removed unused type imports (SkillTree, Experience)

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

        // Check resource cost (compat shim: some Skill implementations expose resourceCost/getEffectsAtLevel)
        const resourceCost = (skill as any).resourceCost || { type: 'MANA', value: 0 };
        const { type: resourceType, value: cost } = resourceCost;
        if (!this.hasEnoughResource(caster, resourceType, cost)) {
            throw new Error(`Not enough ${String(resourceType).toLowerCase()}`);
        }

        // Apply skill effects (fallback to the effects array if helper method is missing)
        const effects = typeof (skill as any).getEffectsAtLevel === 'function' ? (skill as any).getEffectsAtLevel() : (skill.effects || []);
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
        _character: Combatant, 
        _resourceType: 'MANA' | 'STAMINA' | 'HEALTH', 
        _amount: number
    ): boolean {
        // Implementation depends on how resources are stored in Combatant
        return true; // Placeholder
    }

    private consumeResource(
        _character: Combatant, 
        _resourceType: 'MANA' | 'STAMINA' | 'HEALTH', 
        _amount: number
    ): void {
        // Implementation depends on how resources are stored in Combatant
    }

    private async applyEffect(
        _effect: any,
        _caster: Combatant,
        _target: Combatant
    ): Promise<void> {
        // Implementation of effect application
    }
}
