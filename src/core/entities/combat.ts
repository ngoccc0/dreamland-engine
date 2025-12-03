import { TranslatableString } from '../types/i18n';

/**
 * OVERVIEW: Combat system entities
 *
 * Defines all data structures for turn-based combat between Combatants.
 * Includes combat statistics, skills, effects, actions, and outcome tracking.
 *
 * ## Combat Statistics (CombatStats)
 *
 * Every combatant has core combat metrics:
 *
 * | Stat | Effect | Range | Notes |
 * |------|--------|-------|-------|
 * | health | Current HP (0 = dead) | 0 to maxHealth | |
 * | maxHealth | HP capacity | 10-500 | Character level dependent |
 * | attack | Damage dealt per action | 1-100 | Stat-based, scales 1:1 |
 * | defense | Damage reduction per turn | 0-50 | Scales damage reduction directly |
 * | speed | Turn priority & frequency | 1-20 | Higher = earlier turn, more actions |
 * | criticalChance | % chance for 1.5× damage | 0-100 | 100 = guaranteed crit, 0 = no crit |
 * | criticalDamage | Crit damage multiplier | 1.0-3.0 | Weapon/item dependent |
 *
 * ## Combat Skills (CombatSkill)
 *
 * Skills are abilities used in combat:
 *
 * ```typescript
 * interface CombatSkill {\n *   id: string,                    // Unique identifier
 *   name: TranslatableString,      // Display name (EN/VI)
 *   description: TranslatableString, // Ability description
 *   damage?: number,               // Base damage (optional)
 *   cooldown: number,              // Turns before reuse
 *   type: 'PHYSICAL' | 'MAGICAL' | 'TRUE', // Damage type
 *   effects?: CombatEffect[],      // Applied on hit
 * }
 * ```
 *
 * ### Skill Types
 *
 * - **PHYSICAL**: Scales with attack stat, reduced by defense
 * - **MAGICAL**: Scales with intelligence, unaffected by physical defense
 * - **TRUE**: Fixed damage, ignores all defenses (rare, powerful)
 *
 * ### Cooldowns
 *
 * ```
 * turnsSinceLast >= cooldown → skill ready
 * After use: turnsSinceLast = 0, increment each turn
 * ```
 *
 * Examples:
 * - Basic Attack: cooldown = 0 (always ready)
 * - Power Slash: cooldown = 2 (usable every 2-3 turns)
 * - Ultimate: cooldown = 5-10 (rare, powerful)
 *
 * ## Combat Effects (CombatEffect)
 *
 * Temporary effects applied by skills:
 *
 * ```typescript
 * interface CombatEffect {\n *   type: string,           // 'poison', 'stun', 'buff_attack', etc.
 *   duration: number,       // Turns active
 *   value: number,          // Magnitude (damage/turn, stat boost, etc.)
 *   stackable?: boolean,    // Multiple instances allowed
 * }
 * ```
 *
 * ### Common Effects
 *
 * | Type | Duration | Value | Effect |
 * |------|----------|-------|--------|
 * | poison | 3-5 | 2-5 dmg/turn | DoT damage |
 * | stun | 1-2 | N/A | Skip next turn |
 * | buff_attack | 2-3 | +10-20% | Increased damage |
 * | debuff_defense | 2-3 | -50% | Reduced damage reduction |
 * | bleeding | 2-4 | 3-8 dmg/turn | Stackable DoT |
 * | regeneration | 3-5 | 2-4 hp/turn | Healing over time |
 *
 * ### Stacking Rules
 *
 * ```typescript
 * if effect.stackable:
 *   apply effect, allow multiples
 * else:
 *   only 1 instance active, new replaces old
 * ```
 *
 * ## Combatant Class
 *
 * Represents a participant in battle:
 *
 * ```typescript
 * class Combatant {
 *   id: string,                    // Unique ID
 *   type: CombatantType,           // PLAYER | NPC | MONSTER
 *   name: TranslatableString,      // Display name
 *   stats: CombatStats,            // Combat metrics
 *   skills: CombatSkill[],         // Learned abilities
 *   activeEffects: Map<type, CombatEffect[]>, // Active status effects
 * }
 * ```
 *
 * ### Combatant Types
 *
 * - **PLAYER**: Human-controlled, learns skills, has inventory
 * - **NPC**: Friendly/neutral, simple AI, provides rewards (quests, shops)
 * - **MONSTER**: Hostile, aggressive AI, drops loot
 *
 * ## Combat Results (CombatResult)
 *
 * Outcome of a completed battle:
 *
 * ```typescript
 * interface CombatResult {
 *   winner: Combatant,           // Defeating combatant
 *   loser: Combatant,            // Defeated combatant
 *   duration: number,            // Number of rounds fought
 *   xpGained: number,            // XP earned by winner
 *   lootDropped: Item[],         // Items dropped by loser
 *   combatLog: CombatRound[],    // Full history of rounds
 * }
 * ```
 *
 * Winner gains:
 * - XP: loser.level × 100 × difficulty modifier
 * - Loot: random drop from loser's loot table
 * - Achievements: if special conditions met
 *
 * ## Combat Rounds (CombatRound)
 *
 * Single round of combat (both combatants act):
 *
 * ```typescript
 * interface CombatRound {
 *   roundNumber: number,
 *   actions: CombatAction[],             // Both combatants' actions
 *   results: Map<action, outcome>,       // Damage dealt, effects applied
 *   effects: Map<combatant, Effect[]>,  // Active effects after round
 * }
 * ```
 *
 * ## Combat Actions (CombatAction)
 *
 * Individual action taken in combat:
 *
 * ```typescript
 * interface CombatAction {
 *   combatant: Combatant,
 *   actionType: 'attack' | 'skill' | 'defend' | 'item' | 'flee',
 *   target: Combatant,
 *   skill?: CombatSkill,              // If actionType = 'skill'
 *   item?: Item,                      // If actionType = 'item'
 * }
 * ```
 *
 * ### Action Types
 *
 * - **attack**: Basic attack, always available, damage = attack - defense
 * - **skill**: Use learned skill (if cooldown ready, resources available)
 * - **defend**: Reduce incoming damage by 50% next turn
 * - **item**: Use healing/buff item from inventory
 * - **flee**: Attempt escape (50% success chance)
 *
 * ## Design Philosophy
 *
 * - **Simple yet Strategic**: Attack vs defend creates tension
 * - **Skill Depth**: Cooldowns and costs encourage ability use over spam
 * - **Effect Synergy**: Skills combine for powerful combos
 * - **Deterministic**: Formulas transparent (players can calculate expected damage)
 * - **Balanced**: No dominant strategy (rock-paper-scissors: attack-defend-skill)
 *
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
    /**
     * Optional: Loot obtained from the loser.
     * Each loot item includes name, quantity, and optional modifiers.
     */
    loot?: Array<{ name: string; quantity: number; emoji?: string }>;
    /** Optional: Special events triggered by the combat (e.g., quest triggers, achievements). */
    specialEvents?: any[];
}
