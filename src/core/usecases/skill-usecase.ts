import { Skill } from '../entities/skill';
import { Combatant } from '../entities/combat';
import { SideEffect } from '../entities/side-effects';
// removed unused type imports (SkillTree, Experience)

/**
 * OVERVIEW: Skill system orchestrator
 *
 * Manages skill learning, leveling, and usage in combat. Handles skill tree navigation,
 * cooldown tracking, resource costs, and effect application.
 *
 * ## Skill System Architecture
 *
 * ### Skill Tree Structure
 *
 * Skills organized in tree with dependencies:
 *
 * ```
 * Root (Starter Skills - free)
 * ├─ Attack (basic, 0 cost)
 * └─ Defend (basic, 0 cost)
 *
 * Tier 1 (Cost: 1 skill point each)
 * ├─ Power Slash (requires Attack 1)
 * ├─ Parry (requires Defend 1)
 * └─ Fireball (requires Intelligence 10)
 *
 * Tier 2 (Cost: 2-3 skill points)
 * ├─ Whirlwind (requires Power Slash 3)
 * ├─ Ice Storm (requires Fireball 3)
 * └─ Shield Bash (requires Parry 2)
 *
 * Ultimate (Cost: 5 points + Level 20 requirement)
 * └─ Meteor Strike (requires Fire spells 5)
 * ```
 *
 * Node unlocking cost varies by tier and power.
 *
 * ### Skill Progression
 *
 * After unlocking, skills can be leveled up:
 *
 * ```
 * Skill Level 1: Base effect
 * Skill Level 2: +20% effectiveness
 * Skill Level 3: +40% effectiveness, unlocks secondary effect
 * ...
 * Skill Level 10: Maximum power, special effects available
 * ```
 *
 * Leveling costs skill points (1-3 per level depending on tier).
 *
 * ## Skill Usage Mechanics
 *
 * ### Cooldown System
 *
 * ```
 * Basic attacks: 0 cooldown (always ready)
 * Tier 1 skills: 2-3 seconds
 * Tier 2 skills: 5-8 seconds
 * Ultimate abilities: 30-60 seconds
 *
 * isReady() = (currentTime - lastUsed) >= cooldownDuration
 * ```
 *
 * ### Resource Costs
 *
 * Skills consume one or more resources:
 *
 * ```
 * skill.resourceCost = {
 *   type: 'MANA' | 'STAMINA' | 'HEALTH' | 'COMPOSITE',
 *   value: amount
 * }
 *
 * Example:
 *   Basic Attack: 0 stamina
 *   Power Slash: 15 stamina
 *   Fireball: 25 mana
 *   Whirlwind: 40 stamina + 10 mana
 *   Meteor Strike: 100 mana + 30 health (dangerous spell)
 * ```
 *
 * Check before use:
 * ```
 * if caster.stats.mana < skill.resourceCost.mana:
 *   throw 'Insufficient mana'
 * if skill.isOnCooldown():
 *   throw 'Skill on cooldown'
 * ```
 *
 * ### Skill Effects
 *
 * Each skill has 1-3 effects applied to targets:
 *
 * ```
 * effect = skill.getEffectsAtLevel(skillLevel)
 * // Example: Power Slash level 2
 * // - Deal 50 damage (scales with skill level: 40 + 2×5)
 * // - Apply 'bleeding' (3 damage/turn for 5 turns)
 *
 * for target in targets:
 *   effectEngine.applyEffect(effect, target)
 * ```
 *
 * Effects from all targets' skills combine (can trigger chain reactions).
 *
 * ## Learning & Leveling API
 *
 * ### Learn Skill
 *
 * ```typescript
 * learnSkill(characterId, skillId): Promise<boolean>
 *   // Check: character has skill points available
 *   // Check: skill dependencies met (parent skills unlocked)
 *   // Check: level requirements (if any)
 *   // Unlock skill in skill tree
 *   // Return true on success
 * ```
 *
 * ### Level Up Skill
 *
 * ```typescript
 * levelUpSkill(characterId, skillId): Promise<boolean>
 *   // Check: skill already learned
 *   // Check: character has skill points for next level
 *   // Check: skill isn't at max level
 *   // Increment level, consume points
 *   // Return true on success
 * ```
 *
 * ### Use Skill
 *
 * ```typescript
 * useSkill(caster, skill, targets): Promise<void>
 *   // Check: skill is ready (not on cooldown)
 *   // Check: caster has resources (mana, stamina, etc.)
 *   // Consume resources
 *   // Apply effects to each target
 *   // Set cooldown timer
 *   // Emit narrative message
 * ```
 *
 * ## Skill Balance Tuning
 *
 * Key adjustable parameters per skill:
 *
 * | Parameter | Range | Impact |
 * |-----------|-------|--------|
 * | Damage coefficient | 0-500 | Direct damage output |
 * | Cooldown | 0-120s | Usage frequency |
 * | Resource cost | 0-200 | Sustainability |
 * | Range | 1-10 chunks | Applicability in combat |
 * | AoE radius | 0-5 chunks | Area denial |
 * | Status effect chance | 0-100% | Utility value |
 *
 * Mana-based (intelligence): Strategic, less spammable
 * Stamina-based (strength): Frequent, tactical
 * Health-based (rare): High risk/high reward
 *
 * ## Performance Notes
 *
 * - O(1) learn/level skill (tree lookup + stat update)
 * - O(1) cooldown check (timestamp comparison)
 * - O(effects.length) skill use (usually 1-3 effects)
 * - No pathfinding for skill targeting (direct application)
 *
 * ## Design Philosophy
 *
 * - **Convergent Trees**: Multiple paths to powerful abilities
 * - **Meaningful Choices**: Stat allocation affects viable skills
 * - **Emergent Synergies**: Skills combine for powerful combos
 * - **Resource Tradeoffs**: Powerful skills drain resources
 * - **Respec Accessibility**: Players can experiment via NPC resets (for cost)
 */
export interface ISkillUseCase {
    learnSkill(characterId: string, skillId: string): Promise<boolean>;
    levelUpSkill(characterId: string, skillId: string): Promise<boolean>;
    useSkill(caster: Combatant, skill: Skill, targets: Combatant[]): Promise<SkillUseResult>;
}

/**
 * Result of using a skill - returns side effects to execute
 *
 * @remarks
 * Pure function pattern: (caster, skill, targets) → effects[]
 * Hooks execute effects (audio, animations, damage apply, etc)
 */
export interface SkillUseResult {
    success: boolean;
    effects: SideEffect[];
    message?: string;
}

export class SkillUseCase implements ISkillUseCase {
    constructor(
        private readonly characterRepository: any, // Will be defined in infrastructure layer
        private readonly skillRepository: any     // Will be defined in infrastructure layer
    ) { }

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

    async useSkill(caster: Combatant, skill: Skill, targets: Combatant[]): Promise<SkillUseResult> {
        /**
         * Use a skill and generate side effects
         *
         * @remarks
         * **Pattern:** Pure function returns {success, effects[]}
         *
         * Effects generated:
         * - PlayAudioEffect: Skill sound cue (e.g., "fireball-cast", "sword-slash")
         * - TriggerAnimationEffect: Caster animation (e.g., "cast-spell", "melee-attack")
         * - ApplyDamageEffect: Damage to each target
         * - ApplyStatusEffect: Status effects (bleeding, burning, slowness)
         * - TriggerEventEffect: Fire skill-used event
         */
        if (!skill.isReady()) {
            return {
                success: false,
                effects: [
                    {
                        type: 'showNotification',
                        message: `${skill.name} is on cooldown!`,
                        type_: 'warning'
                    }
                ]
            };
        }

        // Check resource cost (compat shim: some Skill implementations expose resourceCost/getEffectsAtLevel)
        const resourceCost = (skill as any).resourceCost || { type: 'MANA', value: 0 };
        const { type: resourceType, value: cost } = resourceCost;
        if (!this.hasEnoughResource(caster, resourceType, cost)) {
            return {
                success: false,
                effects: [
                    {
                        type: 'showNotification',
                        message: `Not enough ${String(resourceType).toLowerCase()}!`,
                        type_: 'warning'
                    }
                ]
            };
        }

        const effects: SideEffect[] = [];

        // Play skill sound effect
        const skillSoundMap: { [key: string]: string } = {
            fireball: 'fireball-cast',
            'power-slash': 'sword-slash',
            'ice-storm': 'magic-ice',
            'meteor-strike': 'meteor-impact'
        };
        const skillNameStr = String(skill.name).toLowerCase();
        const soundId = skillSoundMap[skillNameStr] || 'skill-use';
        effects.push({
            type: 'playAudio',
            sound: soundId,
            volume: 0.8
        });

        // Trigger caster animation
        effects.push({
            type: 'triggerAnimation',
            entityId: caster.id,
            animation: 'skill-cast',
            speed: 1.5
        });

        // Get skill effects based on level
        const skillEffects = typeof (skill as any).getEffectsAtLevel === 'function'
            ? (skill as any).getEffectsAtLevel()
            : (skill.effects || []);

        // Apply effects to each target
        for (const target of targets) {
            for (const effect of skillEffects) {
                // Hit chance roll
                if (Math.random() <= (effect.chance || 1)) {
                    // Damage
                    if (effect.damage) {
                        effects.push({
                            type: 'applyDamage',
                            targetId: target.id,
                            amount: effect.damage,
                            damageType: effect.damageType || 'physical'
                        });
                    }

                    // Status effect
                    if (effect.statusEffect) {
                        effects.push({
                            type: 'applyStatus',
                            targetId: target.id,
                            statusType: effect.statusEffect.type,
                            duration: effect.statusEffect.duration || 10
                        });
                    }
                }
            }

            // Target reaction animation
            effects.push({
                type: 'triggerAnimation',
                entityId: target.id,
                animation: 'hit'
            });
        }

        // Start cooldown and consume resources
        skill.startCooldown();
        this.consumeResource(caster, resourceType, cost);

        // Trigger skill-used event
        effects.push({
            type: 'triggerEvent',
            eventName: 'skill.used',
            data: {
                skillId: skill.name,
                casterId: caster.id,
                targetCount: targets.length
            }
        });

        return {
            success: true,
            effects,
            message: `${caster.name} used ${skill.name}!`
        };
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
}
