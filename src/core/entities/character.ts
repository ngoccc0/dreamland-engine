import { Effect } from '../types/effects';
import { Item } from '../types/items';
import type { TranslatableString } from '../types/i18n';
import { Skill } from './skill';

/**
 * OVERVIEW: Character entity system
 *
 * Represents a player or NPC character in the game world with complete attribute,
 * inventory, skill, and status management. Characters are the primary unit of interaction
 * in the game, tracking progression, items, abilities, and effects.
 *
 * ## Character Attributes
 *
 * ### Core Stats (CharacterStats)
 *
 * Five core attributes determine character capabilities:
 *
 * | Stat | Effect | Scaling | Primary Use |
 * |------|--------|---------|-------------|
 * | Strength | +1 attack per point | Melee damage, carry capacity | Physical combat |
 * | Dexterity | +1 critical chance % per point | Hit chance, evasion, critical damage | Accuracy, evasion |
 * | Intelligence | +2 mana per point | Spell damage, mana pool | Magic casting |
 * | Vitality | +3 health per point | HP pool, defense | Tanking, survival |
 * | Luck | +1 critical damage % per point | Rare item drop rate, critical hit frequency | Loot quality |
 *
 * ### Health & Resources
 *
 * ```typescript
 * health / maxHealth: 0-100% lifecycle (0 = dead)
 * stamina / maxStamina: for physical abilities (regenerates out of combat)
 * mana / maxMana: for magic abilities (regenerates faster than stamina)
 * bodyTemperature: -20 to +50°C (extremes cause damage)
 * ```
 *
 * ## Character Progression
 *
 * ### Experience & Leveling
 *
 * ```typescript
 * experience: total XP accumulated
 * level: derived from experience threshold (see ExperienceUseCase)
 * levelUpRewards: skill points, stat points, ability unlocks
 * ```
 *
 * ### Skills System
 *
 * Characters learn skills from a skill tree:
 * ```typescript
 * skills: string[] of skill IDs known
 * skillInstances: Map<skillId, Skill> runtime state (level, cooldown, XP)
 * ```
 *
 * Skills are learned via SkillUseCase:
 * - Cost skill points (1-5 depending on tier)
 * - Have level-up progression (level 1-10)
 * - Can have prerequisites (must know parent skill)
 *
 * ## Inventory Management
 *
 * Characters carry items with weight limits:
 *
 * ```typescript
 * inventory: Inventory object with capacity management
 * maxCarryWeight: default 100 units
 * currentWeight: sum of all items × quantity
 * availableSpace: maxWeight - currentWeight
 * ```
 *
 * Common items:
 * - Equipment (weapons, armor): equipped via slots
 * - Consumables (potions, food): used to restore resources
 * - Crafting materials: gathered from world, used to create items
 * - Quest items: special, don't drop on death
 *
 * ## Status Effects & Active Effects
 *
 * Characters can have multiple active effects:
 *
 * ```typescript
 * activeEffects: Effect[] currently active
 * statuses: Set<string> status flags (stunned, blessed, poisoned)
 * ```
 *
 * Effect types:
 * - Buffs: positive stat changes (duration-based)
 * - Debuffs: negative stat changes
 * - DoT: damage over time (poison, bleeding)
 * - Stun: prevent action for duration
 * - Temperature: hypothermia, heatstroke
 *
 * Effects automatically expire after duration or can be manually removed.
 *
 * ## Character Flags & State
 *
 * Runtime state flags track special conditions:
 *
 * ```typescript
 * flags: {
 *   invulnerable: true,  // Takes no damage
 *   stunned: true,       // Cannot act
 *   cursed: true,        // Reduced effectiveness
 *   blessed: true,       // Enhanced effectiveness
 *   frozen: true,        // Immobilized
 *   burning: true,       // Takes DoT damage
 * }
 * ```
 *
 * ## Character Actions
 *
 * Characters can perform various actions:
 *
 * ```typescript
 * type CharacterAction = {
 *   type: 'move' | 'attack' | 'cast' | 'use_item' | 'interact',
 *   target?: position or entity ID,
 *   item?: item ID (for use_item),
 *   skill?: skill ID (for cast)
 * }
 * ```
 *
 * Actions are routed through ActionHandlers to apply game logic:
 * - Move: update position, trigger movement costs
 * - Attack: initiate combat with CombatUseCase
 * - Cast: use skill from skillInstances, apply effects
 * - UseItem: consume item, apply effects
 * - Interact: NPC dialogue, chest looting, etc.
 *
 * ## Character Types
 *
 * ### Player Character
 * - Controlled by human player
 * - Has inventory, equipment slots
 * - Can learn skills and level up
 * - Respawns on death at last checkpoint
 *
 * ### NPC Character
 * - Controlled by AI or static
 * - May have dialogue trees
 * - Provides quests or services (shops)
 * - Cannot be looted on defeat
 *
 * ### Enemy Character
 * - Hostile, attacks on sight
 * - Uses simplified AI (attack > defend > flee)
 * - Drops loot and XP on defeat
 * - May have special abilities (boss fights)
 *
 * ## Serialization
 *
 * Characters persist to database (see CharacterRepository):
 *
 * ```typescript
 * // Safe to serialize
 * id, name, level, health, maxHealth, stats, experience, position
 * inventory: PlayerItem[]
 * skills: string[] (IDs only, instances recreated on load)
 * activeEffects: Effect[]
 * 
 * // Runtime only (not persisted)
 * skillInstances: Map (recreated from skill IDs on load)
 * flags: {...} (recalculated on load)
 * ```
 *
 * ## API Methods
 *
 * | Method | Purpose |
 * |--------|---------|
 * | `takeDamage(amount)` | Reduce health, check if dead |
 * | `heal(amount)` | Restore health |
 * | `addEffect(effect)` | Apply temporary effect |
 * | `hasStatus(status)` | Check if status active |
 * | `learnSkill(skillId)` | Add skill to known skills |
 * | `updateEffects()` | Tick down durations, remove expired |
 *
 * ## Design Philosophy
 *
 * - **Flexible Stats**: 5-stat system balances complexity vs depth
 * - **Resource Management**: Mana/stamina encourage strategic ability use
 * - **Skill Specialization**: Skills unlock via tree, not arbitrary learning
 * - **Effect Driven**: Status effects implement most gameplay mechanics
 * - **Persistent Progression**: Characters saved between sessions with full state
 *
 */
export interface CharacterStats {
    /** Physical power and melee damage. Higher strength increases physical attack power. */
    strength: number;
    /** Agility and accuracy. Higher dexterity improves hit chance and evasion. */
    dexterity: number;
    /** Magical power and mana capacity. Higher intelligence increases magical attack and mana pool. */
    intelligence: number;
    /** Health and defense. Higher vitality increases maximum health and physical defense. */
    vitality: number;
    /** Critical hits and rare item finds. Higher luck increases critical hit chance and improves loot quality. */
    luck: number;
}

/**
 * Represents possible character actions in the game, detailing the type of action and its target/parameters.
 */
export type CharacterAction = {
    /** The type of action being performed (e.g., 'move', 'attack', 'cast', 'use_item', 'interact'). */
    type: 'move' | 'attack' | 'cast' | 'use_item' | 'interact';
    /** Optional: Position (x, y) or entity ID for the action target. */
    target?: { x: number; y: number } | string;
    /** Optional: Item ID when the action involves using an item. */
    item?: string;
    /** Optional: Skill ID when the action involves casting a skill. */
    skill?: string;
};

/**
 * Main character class representing both Non-Player Characters (NPCs) and player characters.
 * This class manages character stats, inventory, skills, and status effects.
 */
export class Character {
    /** Unique identifier for the character. */
    id: string;
    /** Character's display name. */
    name: string;
    /** Current character level. */
    level: number;
    /** Current health points. */
    health: number;
    /** Maximum health points the character can have. */
    maxHealth: number;
    /** Current stamina points. */
    stamina: number;
    /** Maximum stamina points the character can have. */
    maxStamina: number;
    /** Current mana points. */
    mana: number;
    /** Maximum mana points the character can have. */
    maxMana: number;
    /** Current body temperature in Celsius. */
    bodyTemperature: number;
    /** Current experience points. */
    experience: number;
    /** Character's position in the game world. */
    position: { x: number; y: number };
    /** Items carried by the character in their inventory. */
    inventory: Item[];
    /** Active status effects currently affecting the character. */
    activeEffects: Effect[];
    /** List of skill IDs the character knows. */
    skills: string[];
    /** Character's base stats. */
    stats: CharacterStats;
    /** Collection of active status effect IDs. */
    private statuses: Set<string>;
    /** Map of skill instances, indexed by skill ID. */
    private skillInstances: Map<string, Skill>;
    /** Character state flags (e.g., 'invulnerable', 'stunned'). */
    private flags: { [key: string]: boolean };

    /**
     * Creates an instance of Character.
     * @param id - Unique identifier for the character.
     * @param name - Display name of the character.
     * @param baseStats - Initial base statistics for the character.
     */
    constructor(id: string, name: string, baseStats: CharacterStats) {
        this.id = id;
        this.name = name;
        this.level = 1;
        this.health = 100;
        this.maxHealth = 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.mana = 100;
        this.maxMana = 100;
        this.bodyTemperature = 37; // Normal human body temperature in Celsius
        this.experience = 0;
        this.position = { x: 0, y: 0 };
        this.inventory = [];
        this.activeEffects = [];
        this.skills = [];
        this.stats = { ...baseStats };
        this.skillInstances = new Map();
        this.statuses = new Set();
        this.flags = {};
    }

    /**
     * Applies damage to the character, reducing their health.
     * Damage is ignored if the character has the 'invulnerable' flag.
     * @param amount - The amount of damage to take.
     */
    takeDamage(amount: number): void {
        if (this.flags['invulnerable']) return;
        this.health = Math.max(0, this.health - amount);
    }

    /**
     * Heals the character, restoring health up to their maximum health.
     * @param amount - The amount of health to restore.
     */
    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Modifies the character's body temperature by a given amount.
     * Temperature is clamped between 30°C and 45°C to prevent unrealistic values.
     * @param amount - The amount to change the body temperature by.
     */
    modifyBodyTemperature(amount: number): void {
        this.bodyTemperature = Math.max(30, Math.min(45, this.bodyTemperature + amount));
    }

    /**
     * Modifies a character's specific stat by a given amount.
     * @param stat - The name of the stat to modify (e.g., 'strength', 'dexterity').
     * @param amount - The amount to add to the stat. Can be positive or negative.
     */
    modifyStat(stat: keyof CharacterStats, amount: number): void {
        if (stat in this.stats) {
            this.stats[stat] += amount;
        }
    }

    /**
     * Adds a status effect to the character.
     * @param statusId - The unique ID of the status effect to add.
     */
    addStatus(statusId: string): void {
        this.statuses.add(statusId);
    }

    /**
     * Removes a status effect from the character.
     * @param statusId - The unique ID of the status effect to remove.
     */
    removeStatus(statusId: string): void {
        this.statuses.delete(statusId);
    }

    /**
     * Checks if the character currently has a specific status effect.
     * @param statusId - The unique ID of the status effect to check.
     * @returns `true` if the character has the status, `false` otherwise.
     */
    hasStatus(statusId: string): boolean {
        return this.statuses.has(statusId);
    }

    /**
     * Adds a new skill to the character's repertoire.
     * @param skill - The {@link Skill} instance to add.
     */
    addSkill(skill: Skill): void {
        this.skills.push(skill.id);
        this.skillInstances.set(skill.id, skill);
    }

    /**
     * Removes a skill from the character.
     * @param skillId - The unique ID of the skill to remove.
     */
    removeSkill(skillId: string): void {
        this.skills = this.skills.filter(id => id !== skillId);
        this.skillInstances.delete(skillId);
    }

    /**
     * Checks if the character has a specific skill.
     * @param skillId - The unique ID of the skill to check.
     * @returns `true` if the character has the skill, `false` otherwise.
     */
    hasSkill(skillId: string): boolean {
        return this.skills.includes(skillId);
    }

    /**
     * Retrieves a skill instance by its ID.
     * @param skillId - The unique ID of the skill to retrieve.
     * @returns The {@link Skill} instance if found, otherwise `undefined`.
     */
    getSkill(skillId: string): Skill | undefined {
        return this.skillInstances.get(skillId);
    }

    /**
     * Checks if a skill can be used by the character based on mana cost and cooldown.
     * @param skillId - The unique ID of the skill to check.
     * @returns `true` if the skill can be used, `false` otherwise.
     */
    canUseSkill(skillId: string): boolean {
        const skill = this.skillInstances.get(skillId);
        if (!skill) return false;
        return skill.isUsable(this.mana);
    }

    /**
     * Uses a skill, consuming mana and starting its cooldown.
     * @param skillId - The unique ID of the skill to use.
     */
    useSkill(skillId: string): void {
        const skill = this.skillInstances.get(skillId);
        if (!skill || !this.canUseSkill(skillId)) return;

        this.mana -= skill.manaCost;
        skill.startCooldown();
    }

    /**
     * Adds an item to the character's inventory.
     * @param item - The {@link Item} to add.
     */
    addItem(item: Item): void {
        this.inventory.push(item);
    }

    /**
     * Removes and returns an item from the character's inventory.
     * @param itemId - The unique ID of the item to remove.
     * @returns The removed {@link Item} if found, otherwise `undefined`.
     */
    removeItem(itemId: string): Item | undefined {
        const index = this.inventory.findIndex(item => item.id === itemId);
        if (index === -1) return undefined;
        return this.inventory.splice(index, 1)[0];
    }

    /**
     * Checks if the character has a specific item in their inventory.
     * @param itemId - The unique ID of the item to check for.
     * @returns `true` if the character has the item, `false` otherwise.
     */
    hasItem(itemId: string): boolean {
        return this.inventory.some(item => item.id === itemId);
    }

    /**
     * Checks if the character is currently alive (health > 0).
     * @returns `true` if the character is alive, `false` otherwise.
     */
    isAlive(): boolean {
        return this.health > 0;
    }

    /**
     * Checks if the character can currently move.
     * Movement is restricted if the character has the 'stunned' flag.
     * @returns `true` if the character can move, `false` otherwise.
     */
    canMove(): boolean {
        return !this.flags['stunned'];
    }

    /**
     * Updates the character's state, processing active effects and skill cooldowns.
     * @param deltaTime - The time elapsed since the last update, in milliseconds.
     */
    update(deltaTime: number): void {
        // Update skill cooldowns
        this.skillInstances.forEach(skill => {
            skill.reduceCooldown(deltaTime / 1000);
        });

        // Update active effects
        this.activeEffects = this.activeEffects.filter(effect => {
            if (effect.duration) {
                return effect.duration > 0;
            }
            return true;
        });
    }
}
