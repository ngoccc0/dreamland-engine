import { Effect } from '../types/effects';
import { Item } from '../types/items';
import type { TranslatableString } from '../types/i18n';
import { Skill } from './skill';

/**
 * Character statistics representing core attributes that influence a character's capabilities.
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
