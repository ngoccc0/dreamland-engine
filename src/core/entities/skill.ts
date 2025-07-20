import { TranslatableString } from '../types/i18n';
import { Effect } from '../types/effects';
import { 
    Skill as SkillType, 
    SkillType as SkillTypeEnum, 
    SkillUnlockCondition, 
    SkillRequirements 
} from '../types/skills';

export enum SkillTarget {
    SELF = 'SELF',
    SINGLE_ENEMY = 'SINGLE_ENEMY',
    MULTIPLE_ENEMIES = 'MULTIPLE_ENEMIES',
    SINGLE_ALLY = 'SINGLE_ALLY',
    MULTIPLE_ALLIES = 'MULTIPLE_ALLIES',
    AREA = 'AREA'
}

export interface SkillEffect extends Effect {
    baseValue: number;
    scaling?: {
        attribute: string;
        ratio: number;
    }[];
}

export class Skill implements SkillType {
    private _cooldownRemaining: number = 0;

    id: string;
    name: TranslatableString;
    description: TranslatableString;
    level: number;
    maxLevel: number;
    experience: number;
    experienceToNext: number;
    type: SkillTypeEnum;
    effects: Effect[];
    cooldown: number;
    manaCost: number;
    unlockConditions?: SkillUnlockCondition[];
    requirements?: SkillRequirements;
    metadata?: Record<string, any>;
    target: SkillTarget;

    constructor(
        params: SkillType & {
            target: SkillTarget;
            effects: SkillEffect[];
        }
    ) {
        this.id = params.id;
        this.name = params.name;
        this.description = params.description;
        this.level = params.level;
        this.maxLevel = params.maxLevel;
        this.experience = params.experience;
        this.experienceToNext = params.experienceToNext;
        this.type = params.type;
        this.effects = [...params.effects];
        this.cooldown = params.cooldown;
        this.manaCost = params.manaCost;
        this.unlockConditions = params.unlockConditions ? [...params.unlockConditions] : undefined;
        this.requirements = params.requirements ? { ...params.requirements } : undefined;
        this.metadata = params.metadata ? { ...params.metadata } : undefined;
        this.target = params.target;
    }

    get cooldownRemaining(): number { return this._cooldownRemaining; }

    gainExperience(amount: number): boolean {
        this.experience += amount;
        if (this.experience >= this.experienceToNext && this.level < this.maxLevel) {
            this.levelUp();
            return true;
        }
        return false;
    }

    canLevel(): boolean {
        return this.level < this.maxLevel;
    }

    levelUp(): boolean {
        if (!this.canLevel()) return false;
        this.level++;
        this.experience -= this.experienceToNext;
        this.experienceToNext = this.calculateNextLevelExp();
        this.updateEffects();
        return true;
    }

    private calculateNextLevelExp(): number {
        return Math.floor(100 * Math.pow(1.5, this.level));
    }

    private updateEffects(): void {
        this.effects = (this.effects as SkillEffect[]).map(effect => ({
            ...effect,
            value: effect.baseValue * (1 + (this.level - 1) * 0.1)
        }));
    }

    startCooldown(): void {
        this._cooldownRemaining = this.cooldown;
    }

    reduceCooldown(amount: number): void {
        this._cooldownRemaining = Math.max(0, this._cooldownRemaining - amount);
    }

    isUsable(currentMana: number): boolean {
        return currentMana >= this.manaCost && this._cooldownRemaining <= 0;
    }

    isReady(): boolean {
        return this._cooldownRemaining <= 0;
    }
}

export interface SkillNode {
    skill: Skill;
    prerequisites: string[];
}

export class SkillTree {
    private skills: Map<string, Skill>;
    private nodes: Map<string, SkillNode>;
    private unlockedSkills: Set<string>;
    private skillPoints: number;

    constructor(initialSkills: Skill[] = [], initialPoints: number = 0) {
        this.skills = new Map();
        this.nodes = new Map();
        this.unlockedSkills = new Set();
        this.skillPoints = initialPoints;

        initialSkills.forEach(skill => {
            this.addSkill(skill);
        });
    }

    addSkill(skill: Skill, prerequisites: string[] = []): void {
        this.skills.set(skill.id, skill);
        this.nodes.set(skill.id, { skill, prerequisites });
    }

    getSkill(skillId: string): Skill | undefined {
        return this.skills.get(skillId);
    }

    getNode(skillId: string): SkillNode | undefined {
        return this.nodes.get(skillId);
    }

    unlockSkill(skillId: string): boolean {
        const node = this.nodes.get(skillId);
        if (!node || !this.canUnlockSkill(skillId)) {
            return false;
        }

        if (this.skillPoints <= 0) {
            return false;
        }

        if (!this.checkPrerequisites(node)) {
            return false;
        }

        this.unlockedSkills.add(skillId);
        this.skillPoints--;
        return true;
    }

    private checkPrerequisites(node: SkillNode): boolean {
        return node.prerequisites.every(preReqId => this.unlockedSkills.has(preReqId));
    }

    addSkillPoints(points: number): void {
        this.skillPoints += points;
    }

    getSkillPoints(): number {
        return this.skillPoints;
    }

    canUnlockSkill(skillId: string): boolean {
        const node = this.nodes.get(skillId);
        if (!node || this.unlockedSkills.has(skillId)) {
            return false;
        }

        if (!this.checkPrerequisites(node)) {
            return false;
        }

        if (!this.meetsUnlockConditions(node.skill)) {
            return false;
        }

        return this.skillPoints > 0;
    }

    private meetsUnlockConditions(skill: Skill): boolean {
        if (!skill.unlockConditions) {
            return true;
        }

        return skill.unlockConditions.every(condition => 
            (condition.progress || 0) >= condition.value
        );
    }

    getUnlockedSkills(): Skill[] {
        return Array.from(this.unlockedSkills)
            .map(id => this.skills.get(id))
            .filter((skill): skill is Skill => skill !== undefined);
    }

    getAllSkills(): Skill[] {
        return Array.from(this.skills.values());
    }

    getRootNodes(): SkillNode[] {
        return Array.from(this.nodes.values()).filter(node => 
            node.prerequisites.length === 0
        );
    }

    getChildNodes(skillId: string): SkillNode[] {
        return Array.from(this.nodes.values()).filter(node => 
            node.prerequisites.includes(skillId)
        );
    }

    levelUpSkill(skillId: string): boolean {
        const skill = this.skills.get(skillId);
        if (!skill || !this.unlockedSkills.has(skillId) || !skill.canLevel() || this.skillPoints < 1) {
            return false;
        }

        if (skill.levelUp()) {
            this.skillPoints--;
            return true;
        }
        return false;
    }
}
