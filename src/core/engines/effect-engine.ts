export type { Effect } from '../types/effects';
import { Effect, EffectType, EffectCondition, EffectTarget } from '../types/effects';
import { GridCell } from '../entities/world';
import { Character, CharacterStats } from '../entities/character';

/**
 * OVERVIEW: Effect application & status system engine
 *
 * Manages temporary and persistent effects (buffs, debuffs, DoT, environmental effects) applied to entities.
 * Handles effect stacking, condition evaluation, and modding via custom handlers.
 *
 * ## Core Responsibilities
 *
 * - **Effect Storage & Management**: Maintains active effects map with stacking rules
 * - **Condition Evaluation**: Checks if effects can be applied based on target state (stats, skills, status, location, weather)
 * - **Effect Application**: Routes effects to appropriate handlers based on EffectType
 * - **Stat Modification**: Direct stat adjustments (flat, percentage, multiplicative, set)
 * - **Skill Modification**: Skill level and cooldown adjustments
 * - **Status Effects**: Visual status indicators (stunned, poisoned, blessed)
 * - **Damage Over Time (DoT)**: Creates recurring damage via timers
 * - **Movement/Vision Mods**: Mobility and perception adjustments
 * - **Environmental Effects**: Temperature, terrain, weather-based effects
 * - **Custom Handlers**: Extensible mod system for game-specific effect types
 *
 * ## Effect Stacking System
 *
 * Effects follow stacking rules:
 *
 * ```
 * if effect.stackable:
 *   if activeEffects.count < effect.maxStacks:
 *     add effect to stack
 *   else:
 *     reject (max stacks reached)
 * else:
 *   replace existing effect of same type (LIFO)
 * ```
 *
 * Stackable vs Non-Stackable:
 * - **Stackable** (example: blessing stacks): Multiple instances allowed, up to maxStacks limit
 *   - Buffs often stack (multiple +1 str items = +2 str total)
 *   - DoTs stack (multiple poison sources = more total damage)
 * - **Non-Stackable** (example: curse): Only one instance active, new replaces old
 *   - Debuffs often don't stack (only one stun effect active)
 *   - Status conditions exclusive (can't be both frozen and burning)
 *
 * Storage: `activeEffects` Map<string, Effect[]> where key is effect type or ID.
 *
 * ## Condition System
 *
 * Effects can specify conditions that must be met before application:
 *
 * ```
 * effect.conditions = [
 *   { type: 'stat', target: 'strength', operator: '>', value: 10 },
 *   { type: 'status', target: 'blessed', operator: '==', value: true },
 * ]
 * ```
 *
 * ### Condition Types
 *
 * | Type | Evaluates | Example |
 * |------|-----------|---------|
 * | stat | Character.stats[key] | strength > 10, intelligence < 5 |
 * | skill | Character.skills[key] | archery >= 50 |
 * | status | Character has status | blessed == true, stunned != true |
 * | time | Game time | currentTime > 1000 |
 * | location | Position/chunk | position in area, terrain == forest |
 * | weather | Current weather | weatherType == rain, temperature < 0 |
 *
 * ### Operators
 *
 * Standard comparison: `>`, `<`, `>=`, `<=`, `==`, `!=`
 *
 * All conditions must be true (AND logic) for effect to apply.
 *
 * ## Effect Types & Handlers
 *
 * ### Built-In Effect Types
 *
 * | Type | Handler | Effect |
 * |------|---------|--------|
 * | STAT_BUFF | processStatModification() | Increase character stat |
 * | STAT_DEBUFF | processStatModification() | Decrease character stat |
 * | STAT_MODIFICATION | processStatModification() | General stat change (flat, %, multiply, set) |
 * | SKILL_BUFF | processSkillModification() | Improve skill level/cooldown |
 * | SKILL_DEBUFF | processSkillModification() | Worsen skill level/cooldown |
 * | STATUS | applyStatus() | Mark character with status (stunned, poisoned, blessed) |
 * | DAMAGE_OVER_TIME | processOverTimeEffect() | Recurring damage via setInterval |
 * | HEALING_OVER_TIME | processOverTimeEffect() | Recurring healing via setInterval |
 * | MODIFY_MOVEMENT | processMovementModification() | Speed/range adjustments |
 * | MODIFY_VISION | processVisionModification() | Sight range adjustments |
 * | MODIFY_TERRAIN | processTerrainModification() | Terrain interaction changes |
 * | TEMPERATURE | processTemperatureEffect() | Apply heat/cold |
 * | HYPOTHERMIA | processHypothermiaEffect() | Severe cold damage |
 * | HEATSTROKE | processHeatstrokeEffect() | Severe heat damage |
 * | TRIGGER_ABILITY | processTriggerAbility() | Activate special ability |
 *
 * ### Custom Handlers (Modding)
 *
 * Mods can register custom effect types:
 *
 * ```typescript
 * effectEngine.registerEffectHandler('FREEZE', (effect, target) => {
 *   target.currentBehavior = 'frozen';
 *   target.stats.strength *= 0.5;
 *   // Custom freeze-specific logic
 * });
 * ```
 *
 * Then use in game:
 *
 * ```typescript
 * const freezeEffect = {
 *   id: 'freeze-curse',
 *   type: 'FREEZE', // Custom type
 *   duration: 30,
 *   stackable: false,
 *   conditions: [{ type: 'stat', target: 'vitality', operator: '<', value: 5 }],
 * };
 * effectEngine.applyEffect(freezeEffect, target);
 * ```
 *
 * Modding advantages:
 * - Game logic extensible without core engine changes
 * - Multiple mods can coexist via handler registration
 * - Conditions pre-filter invalid targets
 *
 * ## Over-Time Effects (DoT / HoT)
 *
 * Effects with duration create recurring events:
 *
 * ```typescript
 * private processOverTimeEffect(effect: Effect, target: any): void {
 *   const interval = setInterval(() => {
 *     if (effect.type === EffectType.DAMAGE_OVER_TIME) {
 *       target.health -= effect.modifier.value;
 *     } else if (effect.type === EffectType.HEALING_OVER_TIME) {
 *       target.health += effect.modifier.value;
 *     }
 *     if (target.health <= 0 || effect.duration <= 0) {
 *       clearInterval(interval);
 *       this.removeEffect(effect.id);
 *     }
 *   }, effect.tickInterval || 1000);
 * }
 * ```
 *
 * **Warning**: Timers are NOT cleaned up on save/load. See Weakness 3 (Serialization Validation).
 *
 * ## Performance Notes
 *
 * Current implementation:
 * - O(1) effect registration (Map insertion)
 * - O(n) condition evaluation where n = conditions.length (usually <5)
 * - O(effects.length) stacking check per effect application
 * - O(activeEffects.size) full cleanup on restart (TODO: optimize)
 *
 * Optimization opportunities:
 * - Pre-index effects by target type for faster queries
 * - Cache condition results for repeated evaluations
 * - Implement effect queue to batch updates
 *
 * ## State & Persistence
 *
 * **Serialization Risk**: activeEffects contains setInterval timers which don't JSON serialize.
 * Solution: Store effect data separately, recreate timers on load (see test in Weakness 3).
 *
 * ## Design Philosophy
 *
 * - **Condition-First**: Effects require explicit conditions, reducing unexpected interactions
 * - **Stackable by Default**: Allows strategic layering of effects
 * - **Modding-Friendly**: Custom handlers enable game balance experimentation without code changes
 * - **Duration-Based**: Effects naturally expire, avoiding permanent state bloat
 */

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
            case EffectType.TEMPERATURE:
                this.processTemperatureEffect(effect, target);
                break;
            case EffectType.HYPOTHERMIA:
                this.processHypothermiaEffect(effect, target);
                break;
            case EffectType.HEATSTROKE:
                this.processHeatstrokeEffect(effect, target);
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

    private processTemperatureEffect(effect: Effect, target: Character): void {
        if (target.modifyBodyTemperature) {
            target.modifyBodyTemperature(effect.value);
        }
    }

    private processHypothermiaEffect(effect: Effect, target: Character): void {
        // Hypothermia: Apply damage over time and movement debuff
        target.takeDamage(effect.value);
        // Could also apply movement speed reduction here
        if (target.stats) {
            target.stats.dexterity = Math.max(1, target.stats.dexterity - 2); // Reduce dexterity
        }
    }

    private processHeatstrokeEffect(effect: Effect, target: Character): void {
        // Heatstroke: Apply damage over time and stamina drain
        target.takeDamage(effect.value);
        // Could also apply stamina reduction here
        if (target.stats) {
            target.stats.vitality = Math.max(1, target.stats.vitality - 2); // Reduce vitality
        }
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

    /**
     * Checks a character's body temperature and applies long-term temperature effects if necessary.
     * @param character - The character to check.
     */
    checkTemperatureStatusEffects(character: Character): void {
        if (!character.bodyTemperature) return;

        const bodyTemp = character.bodyTemperature;
        const hypothermiaId = `hypothermia_${character.id}`;
        const heatstrokeId = `heatstroke_${character.id}`;

        // Check for hypothermia (body temperature too low)
        if (bodyTemp < 35) {
            // Check if hypothermia effect is already active
            if (!this.activeEffects.has(hypothermiaId)) {
                const hypothermiaEffect: Effect = {
                    id: hypothermiaId,
                    name: { key: 'effect.hypothermia.name' },
                    description: { key: 'effect.hypothermia.description' },
                    type: EffectType.HYPOTHERMIA,
                    target: EffectTarget.SELF,
                    value: 2, // Damage per tick
                    modifier: { type: 'flat', value: 1 },
                    duration: 30, // Lasts 30 seconds, can be reapplied
                    tickRate: 5000 // Apply every 5 seconds
                };
                this.applyEffect(hypothermiaEffect, character);
            }
        } else {
            // Remove hypothermia if body temperature is normal
            this.removeEffect(hypothermiaId);
        }

        // Check for heatstroke (body temperature too high)
        if (bodyTemp > 40) {
            // Check if heatstroke effect is already active
            if (!this.activeEffects.has(heatstrokeId)) {
                const heatstrokeEffect: Effect = {
                    id: heatstrokeId,
                    name: { key: 'effect.heatstroke.name' },
                    description: { key: 'effect.heatstroke.description' },
                    type: EffectType.HEATSTROKE,
                    target: EffectTarget.SELF,
                    value: 3, // Damage per tick
                    modifier: { type: 'flat', value: 1 },
                    duration: 30, // Lasts 30 seconds, can be reapplied
                    tickRate: 5000 // Apply every 5 seconds
                };
                this.applyEffect(heatstrokeEffect, character);
            }
        } else {
            // Remove heatstroke if body temperature is normal
            this.removeEffect(heatstrokeId);
        }
    }
}
