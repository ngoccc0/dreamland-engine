import { Effect } from '../types/effects';
import { Item } from '../types/items';
import { TranslatableString } from '../types/i18n';
import { Skill } from './skill';

/** Character statistics representing core attributes */
export interface CharacterStats {
    /** Physical power and melee damage */
    strength: number;
    /** Agility and accuracy */
    dexterity: number;
    /** Magical power and mana capacity */
    intelligence: number;
    /** Health and defense */
    vitality: number;
    /** Critical hits and rare item finds */
    luck: number;
}

/** Represents possible character actions in the game */
export type CharacterAction = {
    /** The type of action being performed */
    type: 'move' | 'attack' | 'cast' | 'use_item' | 'interact';
    /** Position or entity ID for the action target */
    target?: { x: number; y: number } | string;
    /** Item ID when using items */
    item?: string;
    /** Skill ID when casting skills */
    skill?: string;
};

/** Main character class representing both NPCs and player characters */
export class Character {
    /** Unique identifier for the character */
    id: string;
    /** Character's display name */
    name: string;
    /** Current character level */
    level: number;
    /** Current health points */
    health: number;
    /** Maximum health points */
    maxHealth: number;
    /** Current mana points */
    mana: number;
    /** Maximum mana points */
    maxMana: number;
    /** Current experience points */
    experience: number;
    /** Character's position in the game world */
    position: { x: number; y: number };
    /** Items carried by the character */
    inventory: Item[];
    /** Active status effects on the character */
    activeEffects: Effect[];
    /** List of skill IDs the character knows */
    skills: string[];
    /** Character's base stats */
    stats: CharacterStats;
    /** Collection of active status effects */
    private statuses: Set<string>;
    /** Map of skill instances */
    private skillInstances: Map<string, Skill>;
    /** Character state flags */
    private flags: { [key: string]: boolean };

    constructor(id: string, name: string, baseStats: CharacterStats) {
        this.id = id;
        this.name = name;
        this.level = 1;
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 100;
        this.maxMana = 100;
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

    /** Apply damage to the character if not invulnerable */
    takeDamage(amount: number): void {
        if (this.flags['invulnerable']) return;
        this.health = Math.max(0, this.health - amount);
    }

    /** Heal the character up to their maximum health */
    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /** Modify a character's stat by the given amount */
    modifyStat(stat: keyof CharacterStats, amount: number): void {
        if (stat in this.stats) {
            this.stats[stat] += amount;
        }
    }

    /** Add a status effect to the character */
    addStatus(statusId: string): void {
        this.statuses.add(statusId);
    }

    /** Remove a status effect from the character */
    removeStatus(statusId: string): void {
        this.statuses.delete(statusId);
    }

    /** Check if the character has a specific status */
    hasStatus(statusId: string): boolean {
        return this.statuses.has(statusId);
    }

    /** Add a new skill to the character's repertoire */
    addSkill(skill: Skill): void {
        this.skills.push(skill.id);
        this.skillInstances.set(skill.id, skill);
    }

    /** Remove a skill from the character */
    removeSkill(skillId: string): void {
        this.skills = this.skills.filter(id => id !== skillId);
        this.skillInstances.delete(skillId);
    }

    /** Check if the character has a specific skill */
    hasSkill(skillId: string): boolean {
        return this.skills.includes(skillId);
    }

    /** Get a skill instance by its ID */
    getSkill(skillId: string): Skill | undefined {
        return this.skillInstances.get(skillId);
    }

    /** Check if a skill can be used based on mana cost */
    canUseSkill(skillId: string): boolean {
        const skill = this.skillInstances.get(skillId);
        if (!skill) return false;
        return skill.isUsable(this.mana);
    }

    /** Use a skill, consuming mana and starting its cooldown */
    useSkill(skillId: string): void {
        const skill = this.skillInstances.get(skillId);
        if (!skill || !this.canUseSkill(skillId)) return;
        
        this.mana -= skill.manaCost;
        skill.startCooldown();
    }

    /** Add an item to the character's inventory */
    addItem(item: Item): void {
        this.inventory.push(item);
    }

    /** Remove and return an item from the inventory */
    removeItem(itemId: string): Item | undefined {
        const index = this.inventory.findIndex(item => item.id === itemId);
        if (index === -1) return undefined;
        return this.inventory.splice(index, 1)[0];
    }

    /** Check if the character has a specific item */
    hasItem(itemId: string): boolean {
        return this.inventory.some(item => item.id === itemId);
    }

    /** Check if the character is alive */
    isAlive(): boolean {
        return this.health > 0;
    }

    /** Check if the character can move */
    canMove(): boolean {
        return !this.flags['stunned'];
    }

    /** Update character state, process effects and cooldowns */
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
