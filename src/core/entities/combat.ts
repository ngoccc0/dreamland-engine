import { TranslatableString } from '../types/i18n';

/**
 * Defines the types of combatants that can participate in battle.
 */
export enum CombatantType {
    PLAYER = 'PLAYER',    // A player-controlled character.
    NPC = 'NPC',          // A non-player character.
    MONSTER = 'MONSTER'   // A hostile creature.
}

/**
 * Represents the core combat statistics of a combatant.
 */
export interface CombatStats {
    /** Current health points. When this reaches 0, the combatant is defeated. */
    health: number;
    /** Maximum health points the combatant can have. */
    maxHealth: number;
    /** Offensive power, determining base damage dealt. */
    attack: number;
    /** Defensive power, reducing incoming damage. */
    defense: number;
    /** Determines turn order and action frequency. Higher speed means more turns. */
    speed: number;
    /** Optional: Chance (0-1) to deal critical damage. */
    criticalChance?: number;
    /** Optional: Multiplier for critical damage. */
    criticalDamage?: number;
}

/**
 * Defines a skill that can be used in combat.
 */
export interface CombatSkill {
    /** Unique identifier for the skill. */
    id: string;
    /** Multilingual name of the skill. */
    name: TranslatableString;
    /** Multilingual description of the skill. */
    description: TranslatableString;
    /** Optional: Base damage dealt by the skill. */
    damage?: number;
    /** Cooldown duration in turns before the skill can be used again. */
    cooldown: number;
    /** The type of damage the skill deals. */
    type: 'PHYSICAL' | 'MAGICAL' | 'TRUE';
    /** Optional: Effects applied by the skill. */
    effects?: CombatEffect[];
}

/**
 * Defines a temporary effect that can be applied to a combatant during battle.
 */
export interface CombatEffect {
    /** The type of effect (e.g., 'poison', 'stun', 'buff_attack'). */
    type: string;
    /** The duration of the effect in turns. */
    duration: number;
    /** The numerical value associated with the effect (e.g., damage per turn for poison, attack boost). */
    value: number;
    /** If true, multiple instances of this effect can stack. */
    stackable?: boolean;
}

/**
 * Represents a combatant participating in battle, managing their stats, skills, and active effects.
 */
export class Combatant {
    private _stats: CombatStats;
    private _skills: CombatSkill[];
    private _activeEffects: Map<string, CombatEffect[]>;

    /**
     * Creates an instance of Combatant.
     * @param id - Unique identifier for the combatant.
     * @param type - The type of combatant (Player, NPC, Monster).
     * @param name - The multilingual display name of the combatant.
     * @param stats - Initial combat statistics.
     * @param skills - Optional: An array of skills the combatant possesses.
     */
    constructor(
        private readonly _id: string,
        private readonly _type: CombatantType,
        private readonly _name: TranslatableString,
        stats: CombatStats,
        skills: CombatSkill[] = []
    ) {
        this._stats = { ...stats };
        this._skills = [...skills];
        this._activeEffects = new Map();
    }

    /** Gets the unique identifier of the combatant. */
    get id(): string {
        return this._id;
    }

    /** Gets the type of the combatant. */
    get type(): CombatantType {
        return this._type;
    }

    /** Gets the multilingual name of the combatant. */
    get name(): TranslatableString {
        return this._name;
    }

    /** Gets the current combat statistics of the combatant. */
    get stats(): Readonly<CombatStats> {
        return this._stats;
    }

    /** Gets the list of skills the combatant possesses. */
    get skills(): readonly CombatSkill[] {
        return this._skills;
    }

    /** Gets a map of active effects on the combatant. */
    get activeEffects(): ReadonlyMap<string, readonly CombatEffect[]> {
        return this._activeEffects;
    }

    /**
     * Applies damage to the combatant, reducing health based on defense.
     * @param amount - The raw damage amount.
     * @returns The actual damage taken after defense.
     */
    takeDamage(amount: number): number {
        const actualDamage = Math.max(0, amount - this._stats.defense);
        this._stats.health = Math.max(0, this._stats.health - actualDamage);
        return actualDamage;
    }

    /**
     * Heals the combatant, restoring health up to their maximum.
     * @param amount - The amount of health to restore.
     * @returns The actual amount healed.
     */
    heal(amount: number): number {
        const missingHealth = this._stats.maxHealth - this._stats.health;
        const actualHeal = Math.min(missingHealth, amount);
        this._stats.health += actualHeal;
        return actualHeal;
    }

    /**
     * Adds a combat effect to the combatant. If the effect is stackable, it's added to existing effects of the same type.
     * Otherwise, it replaces any existing effect of that type.
     * @param effect - The {@link CombatEffect} to add.
     */
    addEffect(effect: CombatEffect): void {
        const existingEffects = this._activeEffects.get(effect.type) || [];
        
        if (effect.stackable) {
            this._activeEffects.set(effect.type, [...existingEffects, effect]);
        } else {
            // Replace existing effect of the same type
            this._activeEffects.set(effect.type, [effect]);
        }
    }

    /**
     * Removes all active effects of a specific type from the combatant.
     * @param effectType - The type of effect to remove.
     */
    removeEffect(effectType: string): void {
        this._activeEffects.delete(effectType);
    }

    /**
     * Updates the duration of all active effects. Effects with duration <= 0 are removed.
     */
    updateEffects(): void {
        for (const [type, effects] of this._activeEffects.entries()) {
            const updatedEffects = effects
                .map(effect => ({ ...effect, duration: effect.duration - 1 }))
                .filter(effect => effect.duration > 0);

            if (updatedEffects.length > 0) {
                this._activeEffects.set(type, updatedEffects);
            } else {
                this._activeEffects.delete(type);
            }
        }
    }

    /**
     * Checks if the combatant is dead (health <= 0).
     * @returns `true` if the combatant is dead, `false` otherwise.
     */
    isDead(): boolean {
        return this._stats.health <= 0;
    }
}

/**
 * Represents a single action taken by a combatant during a combat round.
 */
export interface CombatAction {
    /** The combatant performing the action. */
    actor: Combatant;
    /** The target of the action. */
    target: Combatant;
    /** Optional: The skill used for the action, if applicable. */
    skill?: CombatSkill;
    /** The type of action performed. */
    type: 'ATTACK' | 'SKILL' | 'DEFEND' | 'FLEE';
}

/**
 * Represents the result of a damage calculation.
 */
export interface DamageResult {
    /** The amount of damage dealt. */
    amount: number;
    /** The type of damage dealt. */
    type: 'PHYSICAL' | 'MAGICAL' | 'TRUE';
    /** True if the damage was a critical hit. */
    isCritical: boolean;
}

/**
 * Represents a single round of combat, including all actions, results, and effects.
 */
export interface CombatRound {
    /** A list of actions performed in this round. */
    actions: CombatAction[];
    /** A map of damage results, indexed by combatant ID. */
    results: Map<string, DamageResult>;
    /** A map of effects applied in this round, indexed by combatant ID. */
    effects: Map<string, CombatEffect[]>;
}

/**
 * Represents the final result of a combat encounter.
 */
export interface CombatResult {
    /** The combatant who won the encounter. */
    winner: Combatant;
    /** The combatant who lost the encounter. */
    loser: Combatant;
    /** A chronological list of combat rounds. */
    rounds: CombatRound[];
    /** Optional: Experience gained by the winner. */
    experience?: number;
    /** Optional: Loot obtained from the loser. */
    loot?: any[]; // TODO: Replace with proper Item type
    /** Optional: Special events triggered by the combat (e.g., quest triggers, achievements). */
    specialEvents?: any[]; 
}
