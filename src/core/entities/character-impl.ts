import { Effect } from '../types/effects';
import { Item } from '../types/items';
import { Character as ICharacter, CharacterStats, CharacterAction } from './character';
import { GridPosition } from './grid-position';
import { Skill } from './skill';

export class CharacterImpl implements ICharacter {
    id: string;
    name: string;
    level: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    experience: number;
    position: { x: number; y: number };
    inventory: Item[];
    activeEffects: Effect[];
    skills: string[];
    stats: CharacterStats;
    private skillInstances: Map<string, Skill>;
    private statuses: Set<string>;
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

    takeDamage(amount: number): void {
        if (this.flags['invulnerable']) return;
        this.health = Math.max(0, this.health - amount);
    }

    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    modifyStat(stat: keyof CharacterStats, amount: number): void {
        if (stat in this.stats) {
            this.stats[stat] += amount;
        }
    }

    addStatus(statusId: string): void {
        this.statuses.add(statusId);
    }

    removeStatus(statusId: string): void {
        this.statuses.delete(statusId);
    }

    hasStatus(statusId: string): boolean {
        return this.statuses.has(statusId);
    }

    addSkill(skill: Skill): void {
        this.skills.push(skill.id);
        this.skillInstances.set(skill.id, skill);
    }

    removeSkill(skillId: string): void {
        this.skills = this.skills.filter(id => id !== skillId);
        this.skillInstances.delete(skillId);
    }

    hasSkill(skillId: string): boolean {
        return this.skills.includes(skillId);
    }

    getSkill(skillId: string): Skill | undefined {
        return this.skillInstances.get(skillId);
    }

    canUseSkill(skillId: string): boolean {
        const skill = this.skillInstances.get(skillId);
        if (!skill) return false;
        return skill.isUsable(this.mana);
    }

    useSkill(skillId: string): void {
        const skill = this.skillInstances.get(skillId);
        if (!skill || !this.canUseSkill(skillId)) return;
        
        this.mana -= skill.manaCost;
        skill.startCooldown();
    }

    addItem(item: Item): void {
        this.inventory.push(item);
    }

    removeItem(itemId: string): Item | undefined {
        const index = this.inventory.findIndex(item => item.id === itemId);
        if (index === -1) return undefined;
        return this.inventory.splice(index, 1)[0];
    }

    hasItem(itemId: string): boolean {
        return this.inventory.some(item => item.id === itemId);
    }

    isAlive(): boolean {
        return this.health > 0;
    }

    canMove(): boolean {
        return !this.flags['stunned'];
    }

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
