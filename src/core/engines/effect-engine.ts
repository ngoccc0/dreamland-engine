export type { Effect } from '../types/effects';
import { Effect, EffectType, EffectCondition, EffectTarget } from '../types/effects';
import { GridCell } from '../entities/world';
import { Character, CharacterStats } from '../entities/character';

export class EffectEngine {
    private activeEffects: Map<string, Effect[]> = new Map();
    private customEffectHandlers: Map<string, (effect: Effect, target: any) => void> = new Map();

    // Register a custom effect handler from mods
    registerEffectHandler(
        effectType: string,
        handler: (effect: Effect, target: any) => void
    ) {
        this.customEffectHandlers.set(effectType, handler);
    }

    applyEffect(effect: Effect, target: any): void {
        // Check if effect can be applied
        if (!this.canApplyEffect(effect, target)) {
            return;
        }

        // Get existing effects of same type
        const existingEffects = this.activeEffects.get(effect.id) || [];

        // Handle stacking
        if (effect.stackable) {
            if (!effect.maxStacks || existingEffects.length < effect.maxStacks) {
                existingEffects.push(effect);
            }
        } else {
            // Replace existing effect
            existingEffects.length = 0;
            existingEffects.push(effect);
        }

        this.activeEffects.set(effect.id, existingEffects);
        this.processEffect(effect, target);
    }

    private canApplyEffect(effect: Effect, target: any): boolean {
        if (!effect.conditions) return true;

        return effect.conditions.every(condition => 
            this.checkCondition(condition, target));
    }

    private checkCondition(condition: EffectCondition, target: any): boolean {
        const value = this.getValueForCondition(condition, target);
        const checkValue = condition.value;

        switch (condition.operator) {
            case '>': return value > checkValue;
            case '<': return value < checkValue;
            case '>=': return value >= checkValue;
            case '<=': return value <= checkValue;
            case '==': return value === checkValue;
            case '!=': return value !== checkValue;
            default: return false;
        }
    }

    private getValueForCondition(condition: EffectCondition, target: any): any {
        switch (condition.type) {
            case 'stat':
                return target.stats?.[condition.target || ''];
            case 'skill':
                return target.skills?.[condition.target || ''];
            case 'status':
                return target.statuses?.has(condition.target);
            case 'time':
                return target.time || Date.now();
            case 'location':
                return target.position;
            case 'weather':
                return target.weather?.type;
            default:
                return null;
        }
    }

    private processEffect(effect: Effect, target: any): void {
        // Check for custom handler first
        const customHandler = this.customEffectHandlers.get(effect.type);
        if (customHandler) {
            customHandler(effect, target);
            return;
        }

        // Default handlers
        switch (effect.type) {
            case EffectType.BUFF:
            case EffectType.DEBUFF:
                this.processStatModification(effect, target);
                break;
            case EffectType.STATUS:
                this.processStatusEffect(effect, target);
                break;
            case EffectType.DAMAGE_OVER_TIME:
            case EffectType.HEALING_OVER_TIME:
                this.processOverTimeEffect(effect, target);
                break;
            case EffectType.MODIFY_MOVEMENT:
                this.processMovementModification(effect, target);
                break;
            case EffectType.MODIFY_VISION:
                this.processVisionModification(effect, target);
                break;
            case EffectType.MODIFY_TERRAIN:
                this.processTerrainModification(effect, target);
                break;
            case EffectType.TRIGGER_ABILITY:
                this.processTriggerAbility(effect, target);
                break;
        }
    }

    private processStatModification(effect: Effect, target: Character): void {
        const stat = effect.target.toString();
        if (!target.stats || !Object.prototype.hasOwnProperty.call(target.stats, stat)) return;

        switch (effect.modifier.type) {
            case 'flat':
                target.stats[stat as keyof CharacterStats] += effect.modifier.value;
                break;
            case 'percentage':
                target.stats[stat as keyof CharacterStats] *= (1 + effect.modifier.value);
                break;
            case 'multiply':
                target.stats[stat as keyof CharacterStats] *= effect.modifier.value;
                break;
            case 'set':
                target.stats[stat as keyof CharacterStats] = effect.modifier.value;
                break;
        }
    }

    private processSkillModification(effect: Effect, target: Character): void {
        // Similar to stat modification but for skills
    }

    private processStatusEffect(effect: Effect, target: Character): void {
        if (!target.hasStatus(effect.id)) target.addStatus(effect.id);
    }

    private processOverTimeEffect(effect: Effect, target: Character): void {
        const interval = setInterval(() => {
            if (effect.type === EffectType.DAMAGE_OVER_TIME) {
                target.takeDamage(effect.value);
            } else {
                target.heal(effect.value);
            }
        }, effect.tickRate || 1000);

        if (effect.duration) {
            setTimeout(() => {
                clearInterval(interval);
                this.removeEffect(effect.id);
            }, effect.duration * 1000);
        }
    }

    private processMovementModification(effect: Effect, target: Character): void {
        // Modify movement speed or cost
    }

    private processVisionModification(effect: Effect, target: Character): void {
        // Modify vision range or lighting
    }

    private processTerrainModification(effect: Effect, target: GridCell): void {
        // Modify terrain attributes
    }

    private processTriggerAbility(effect: Effect, target: Character): void {
        // Trigger special abilities
    }

    updateEffects(gameTime: number): void {
        for (const [id, effects] of this.activeEffects.entries()) {
            effects.forEach(effect => {
                if (effect.duration) {
                    if (gameTime >= effect.duration) {
                        this.removeEffect(id);
                    }
                }
            });
        }
    }

    removeEffect(effectId: string): void {
        this.activeEffects.delete(effectId);
    }

    getActiveEffects(targetId?: string): Effect[] {
        if (targetId) {
            return this.activeEffects.get(targetId) || [];
        }
        return Array.from(this.activeEffects.values()).flat();
    }
}
