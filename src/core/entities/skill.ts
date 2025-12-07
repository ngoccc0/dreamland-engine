import { TranslatableString } from '../types/i18n';
import { Effect } from '../types/effects';
import {
    Skill as SkillType,
    SkillType as SkillTypeEnum,
    SkillUnlockCondition,
    SkillRequirements
} from '../types/skills';

/**
 * OVERVIEW: Skill system entities
 *
 * Defines all data structures for character skills, including skill effects, targeting,
 * unlock conditions, requirements, and progression mechanics.
 * Skills are learned abilities usable in combat or exploration, governed by cooldowns,
 * resource costs, and level prerequisites.
 *
 * ## Skill Basics (Skill Type & SkillTarget)
 *
 * ### SkillType Classification
 *
 * | Type | Example | Context | Effect |
 * |------|---------|---------|--------|
 * | COMBAT | Power Slash | Battle | Deal damage, apply effects |
 * | UTILITY | Teleport | Exploration/Battle | Positional or support effects |
 * | CRAFTING | Forge Weapon | Out-of-battle | Combine materials into items |
 * | PASSIVE | Regeneration | Always Active | Constant bonuses (no activation) |
 * | EXPLORATION | Tracker | Exploration | Reveal map info, track creatures |
 *
 * ### SkillTarget Enumeration
 *
 * Determines who/what skill can affect:
 *
 * ```typescript
 * enum SkillTarget {
 *   SELF = 'SELF',                       // Skill user only
 *   SINGLE_ENEMY = 'SINGLE_ENEMY',      // One enemy (combat)
 *   MULTIPLE_ENEMIES = 'MULTIPLE_ENEMIES', // AoE damage (combat)
 *   SINGLE_ALLY = 'SINGLE_ALLY',        // One ally/NPC (support)
 *   MULTIPLE_ALLIES = 'MULTIPLE_ALLIES', // Group heal/buff
 *   AREA = 'AREA'                        // Map area (exploration)
 * }
 * ```
 *
 * ## Skill Effects (SkillEffect)
 *
 * Specialized effects applied when skill activates:
 *
 * ```typescript
 * interface SkillEffect extends Effect {
 *   baseValue: number,            // Raw effect magnitude before scaling
 *   scaling?: {
 *     attribute: string,          // Stat name (intelligence, strength, etc.)
 *     multiplier: number          // How much attribute affects effect
 *   }
 * }
 * ```
 *
 * ### Examples
 *
 * - **Fireball**:
 *   - baseValue: 20 damage
 *   - scaling: {attribute: 'intelligence', multiplier: 0.5}
 *   - Actual damage: 20 + (intelligence × 0.5)
 *   - At intelligence = 30: 20 + 15 = 35 damage
 *
 * - **Heal**:
 *   - baseValue: 15 HP restore
 *   - scaling: {attribute: 'wisdom', multiplier: 0.3}
 *   - At wisdom = 40: 15 + 12 = 27 HP restored
 *
 * ## Skill Requirements (SkillRequirements)
 *
 * Prerequisites for learning/using skills:
 *
 * ```typescript
 * interface SkillRequirements {
 *   minimumLevel: number,         // Character level required
 *   minimumStats?: {
 *     strength?: number,
 *     intelligence?: number,
 *     dexterity?: number,
 *     vitality?: number,
 *     luck?: number
 *   },
 *   skillPoints: number,          // Points spent to learn
 *   materials?: Item[],           // Items consumed (rare)
 *   prerequisites?: string[]      // Other skills required first
 * }
 * ```
 *
 * ### Progression Gates
 *
 * ```
 * Beginner Skill: Level 1, 0 points, no stats → Open immediately
 * Common Skill: Level 5, 1 point, strength ≥ 10 → Mid-early game
 * Advanced Skill: Level 15, 3 points, intelligence ≥ 20 → Mid-game requirement
 * Rare Skill: Level 25, 10 points, wisdom ≥ 25, needs 3 prerequisites → Late-game build
 * Ultimate Skill: Level 40, 20 points, max stat ≥ 50 → End-game power
 * ```
 *
 * ## Skill Unlock Conditions (SkillUnlockCondition)
 *
 * Special conditions beyond level/stats to unlock skills:
 *
 * ```typescript
 * type SkillUnlockCondition =
 *   | {type: 'level', value: number}          // Reach level X
 *   | {type: 'stat', stat: string, value: number} // Stat ≥ value
 *   | {type: 'quest', questId: string}        // Complete quest
 *   | {type: 'area', areaId: string}          // Discover area
 *   | {type: 'custom', checkFn: () => boolean} // Arbitrary logic
 * ```
 *
 * ### Examples
 *
 * - **Fire Mastery**: {type: 'quest', questId: 'fire_temple'}
 *   - Unlocked only after Fire Temple quest completion
 * - **Ancient Knowledge**: {type: 'area', areaId: 'lost_library'}
 *   - Unlocked upon discovering Lost Library
 * - **Legendary Strike**: {type: 'custom', checkFn: () => hasAllWeapons()}
 *   - Unlocked when player owns all legendary weapons
 *
 * ## Skill Progression Mechanics
 *
 * ### Learning Skills
 *
 * ```
 * Input: Character has skill points + meets requirements
 * Action: learnSkill(skill)
 * Outcome: Skill added to skills[], skill points spent, cooldown set to 0
 * Result: Skill now usable in combat
 * ```
 *
 * ### Leveling Skills
 *
 * ```
 * Usage: Each time skill used in combat, gain experience
 * Threshold: skillXP reaches 100 × level
 * Outcome: Skill level increases
 * Benefit: baseValue increases, cooldown decreases, scaling improves
 * Formula: New baseValue = old × (1 + 0.1 × level)
 * ```
 *
 * Example progression:
 * - Level 1: 20 damage, 3 turn cooldown
 * - Level 2: 22 damage, 2.7 turn cooldown (20 × 1.1)
 * - Level 3: 24.2 damage, 2.4 turn cooldown
 * - Level 5: 29.28 damage, 1.8 turn cooldown
 *
 * ### Cooldowns
 *
 * ```
 * After use: cooldownTurns = cooldown
 * Each turn: cooldownTurns -= 1
 * Ready: cooldownTurns <= 0
 * Can use: Yes (resets cooldown)
 * ```
 *
 * Common cooldowns:
 * - Basic Attack: 0 (always usable)
 * - Quick Skill: 1-2 (frequently available)
 * - Standard Skill: 2-3 (regular usage)
 * - Powerful Skill: 4-5 (limited usage)
 * - Ultimate Skill: 8-10 (rare usage)
 *
 * ## Resource Costs
 *
 * Skills may consume resources:
 *
 * | Resource | Regen Rate | Skill Examples | Cost Range |
 * |----------|-----------|----------------|-----------|
 * | Mana | 10/turn | Fireball, Heal | 10-50 |
 * | Stamina | 5/turn | Power Slash | 10-30 |
 * | Health | None | Sacrifice | 10-50 (risky) |
 * | Items | Consumed | Bomb Throw | 1 item |
 *
 * Usage check:
 * ```
 * if currentMana >= manaCost:
 *   cast skill
 *   currentMana -= manaCost
 * else:
 *   reject skill (insufficient mana)
 * ```
 *
 * ## Skill Tree Structure
 *
 * Skills often arranged hierarchically:
 *
 * ```
 * Combat Branch
 *   ├─ Basic Attack (always available)
 *   ├─ Physical Branch
 *   │  ├─ Power Slash → Whirlwind
 *   │  └─ Riposte → Perfect Guard
 *   └─ Magic Branch
 *      ├─ Fireball → Meteor
 *      └─ Ice Spear → Blizzard
 * Exploration Branch
 *   ├─ Tracker → Keen Sight
 *   └─ Climber → Mountain Master
 * ```
 *
 * Progression rules:
 * - Must learn prerequisites first
 * - Unlock at specified levels
 * - Horizontal skills (same branch) independent
 * - Vertical skills (chain) cumulative benefits
 *
 * ## Design Philosophy
 *
 * - **Meaningful Choices**: Skill points create build diversity
 * - **Progression Reward**: Leveling skills feels impactful
 * - **Cooldown Tension**: Creates turn-based rhythm
 * - **Resource Management**: Mana/Stamina adds strategic depth
 * - **Customization**: Tree structure supports many playstyles
 * - **Balance**: Requirements prevent overpowering early access
 *
 */
export enum SkillTarget {
    SELF = 'SELF',                // Targets the skill user.
    SINGLE_ENEMY = 'SINGLE_ENEMY',// Targets a single enemy.
    MULTIPLE_ENEMIES = 'MULTIPLE_ENEMIES',// Targets multiple enemies.
    SINGLE_ALLY = 'SINGLE_ALLY',  // Targets a single ally.
    MULTIPLE_ALLIES = 'MULTIPLE_ALLIES',// Targets multiple allies.
    AREA = 'AREA'                 // Targets an area on the map.
}

/**
 * Extends the base {@link Effect} interface with skill-specific properties like base value and attribute scaling.
 */
export interface SkillEffect extends Effect {
    /** The base numerical value of the effect before any scaling. */
    baseValue: number;
    /** Optional: Defines how the effect's value scales with character attributes. */
    scaling?: {
        /** The attribute that influences the scaling (e.g., 'intelligence', 'strength'). */
        attribute: string;
        /** The ratio by which the attribute scales the effect (e.g., 0.1 for 10% scaling). */
        ratio: number;
    }[];
}

/**
 * Represents an active skill that a character can learn, level up, and use.
 * It manages cooldowns, experience, and applies effects.
 */
export class Skill implements SkillType {
    private _cooldownRemaining: number = 0;

    /** Unique identifier for the skill. */
    id: string;
    /** Multilingual name of the skill. */
    name: TranslatableString;
    /** Multilingual description of the skill. */
    description: TranslatableString;
    /** Current level of the skill. */
    level: number;
    /** Maximum level the skill can reach. */
    maxLevel: number;
    /** Current experience points accumulated for this skill. */
    experience: number;
    /** Experience points required to reach the next skill level. */
    experienceToNext: number;
    /** The category or type of the skill (e.g., 'combat', 'utility', 'crafting'). */
    type: SkillTypeEnum;
    /** An array of effects this skill applies when used. */
    effects: Effect[];
    /** The cooldown duration (in seconds or turns) after using the skill. */
    cooldown: number;
    /** The mana cost to activate this skill. */
    manaCost: number;
    /** Optional: Conditions that must be met to unlock this skill. */
    unlockConditions?: SkillUnlockCondition[];
    /** Optional: Requirements (e.g., minimum player level, attribute scores) to learn or use this skill. */
    requirements?: SkillRequirements;
    /** Optional: Additional metadata for the skill, allowing for mod extensions. */
    metadata?: Record<string, any>;
    /** The target type of the skill (e.g., 'SELF', 'SINGLE_ENEMY', 'AREA'). */
    target: SkillTarget;

    /**
     * Creates an instance of Skill.
     * @param params - An object containing all properties to initialize the skill, including target and effects.
     */
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

    /** Gets the remaining cooldown duration for the skill. */
    get cooldownRemaining(): number { return this._cooldownRemaining; }

    /**
     * Awards experience to the skill. If enough experience is gained, the skill levels up.
     * @param amount - The amount of experience to add.
     * @returns `true` if the skill leveled up, `false` otherwise.
     */
    gainExperience(amount: number): boolean {
        this.experience += amount;
        if (this.experience >= this.experienceToNext && this.level < this.maxLevel) {
            this.levelUp();
            return true;
        }
        return false;
    }

    /**
     * Checks if the skill can currently level up (i.e., not at max level).
     * @returns `true` if the skill can level up, `false` otherwise.
     */
    canLevel(): boolean {
        return this.level < this.maxLevel;
    }

    /**
     * Levels up the skill, increasing its level, resetting experience, and updating effects.
     * @returns `true` if the skill successfully leveled up, `false` otherwise.
     */
    levelUp(): boolean {
        if (!this.canLevel()) return false;
        this.level++;
        this.experience -= this.experienceToNext;
        this.experienceToNext = this.calculateNextLevelExp();
        this.updateEffects();
        return true;
    }

    /**
     * Calculates the experience required for the next skill level.
     * @returns The experience points needed for the next level.
     */
    private calculateNextLevelExp(): number {
        // Experience required increases exponentially with level.
        return Math.floor(100 * Math.pow(1.5, this.level));
    }

    /**
     * Updates the numerical values of the skill's effects based on its current level.
     * This typically involves scaling the `baseValue` of effects.
     */
    private updateEffects(): void {
        this.effects = (this.effects as SkillEffect[]).map(effect => ({
            ...effect,
            // Example scaling: effect value increases by 10% per skill level.
            value: effect.baseValue * (1 + (this.level - 1) * 0.1)
        }));
    }

    /**
     * Puts the skill on cooldown.
     */
    startCooldown(): void {
        this._cooldownRemaining = this.cooldown;
    }

    /**
     * Reduces the remaining cooldown duration of the skill.
     * @param amount - The amount of time (in seconds or turns) to reduce the cooldown by.
     */
    reduceCooldown(amount: number): void {
        this._cooldownRemaining = Math.max(0, this._cooldownRemaining - amount);
    }

    /**
     * Checks if the skill can be used, considering current mana and cooldown status.
     * @param currentMana - The character's current mana points.
     * @returns `true` if the skill is usable, `false` otherwise.
     */
    isUsable(currentMana: number): boolean {
        return currentMana >= this.manaCost && this._cooldownRemaining <= 0;
    }

    /**
     * Checks if the skill is ready to be used (i.e., its cooldown has expired).
     * @returns `true` if the skill is ready, `false` otherwise.
     */
    isReady(): boolean {
        return this._cooldownRemaining <= 0;
    }
}

/**
 * Represents a node in a skill tree, linking a skill to its prerequisites.
 */
export interface SkillNode {
    /** The {@link Skill} associated with this node. */
    skill: Skill;
    /** An array of skill IDs that must be unlocked before this skill can be. */
    prerequisites: string[];
}

/**
 * Manages a collection of skills organized in a tree structure,
 * handling skill unlocking, leveling, and skill point allocation.
 */
export class SkillTree {
    private skills: Map<string, Skill>;
    private nodes: Map<string, SkillNode>;
    private unlockedSkills: Set<string>;
    private skillPoints: number;

    /**
     * Creates an instance of SkillTree.
     * @param initialSkills - Optional: An array of skills to initially add to the tree.
     * @param initialPoints - Optional: The starting number of skill points available.
     */
    constructor(initialSkills: Skill[] = [], initialPoints: number = 0) {
        this.skills = new Map();
        this.nodes = new Map();
        this.unlockedSkills = new Set();
        this.skillPoints = initialPoints;

        initialSkills.forEach(skill => {
            this.addSkill(skill);
        });
    }

    /**
     * Adds a skill to the skill tree, optionally defining its prerequisites.
     * @param skill - The {@link Skill} to add.
     * @param prerequisites - Optional: An array of skill IDs that must be unlocked first.
     */
    addSkill(skill: Skill, prerequisites: string[] = []): void {
        this.skills.set(skill.id, skill);
        this.nodes.set(skill.id, { skill, prerequisites });
    }

    /**
     * Retrieves a skill instance from the tree by its ID.
     * @param skillId - The unique ID of the skill.
     * @returns The {@link Skill} instance if found, otherwise `undefined`.
     */
    getSkill(skillId: string): Skill | undefined {
        return this.skills.get(skillId);
    }

    /**
     * Retrieves a skill node from the tree by its skill ID.
     * @param skillId - The unique ID of the skill.
     * @returns The {@link SkillNode} if found, otherwise `undefined`.
     */
    getNode(skillId: string): SkillNode | undefined {
        return this.nodes.get(skillId);
    }

    /**
     * Attempts to unlock a skill. Checks for prerequisites and sufficient skill points.
     * @param skillId - The ID of the skill to unlock.
     * @returns `true` if the skill was successfully unlocked, `false` otherwise.
     */
    unlockSkill(skillId: string): boolean {
        const node = this.nodes.get(skillId);
        // Cannot unlock if node doesn't exist or skill is already unlocked or cannot be unlocked.
        if (!node || !this.canUnlockSkill(skillId)) {
            return false;
        }

        // Ensure player has skill points.
        if (this.skillPoints <= 0) {
            return false;
        }

        // Check if all prerequisites are met.
        if (!this.checkPrerequisites(node)) {
            return false;
        }

        this.unlockedSkills.add(skillId);
        this.skillPoints--; // Consume one skill point.
        return true;
    }

    /**
     * Checks if all prerequisites for a given skill node have been met (unlocked).
     * @param node - The {@link SkillNode} to check.
     * @returns `true` if all prerequisites are met, `false` otherwise.
     */
    private checkPrerequisites(node: SkillNode): boolean {
        return node.prerequisites.every(preReqId => this.unlockedSkills.has(preReqId));
    }

    /**
     * Adds skill points to the player's pool.
     * @param points - The number of skill points to add.
     */
    addSkillPoints(points: number): void {
        this.skillPoints += points;
    }

    /**
     * Gets the current number of available skill points.
     * @returns The number of skill points.
     */
    getSkillPoints(): number {
        return this.skillPoints;
    }

    /**
     * Checks if a skill can be unlocked, considering its prerequisites, unlock conditions, and available skill points.
     * @param skillId - The ID of the skill to check.
     * @returns `true` if the skill can be unlocked, `false` otherwise.
     */
    canUnlockSkill(skillId: string): boolean {
        const node = this.nodes.get(skillId);
        // Cannot unlock if node doesn't exist or skill is already unlocked.
        if (!node || this.unlockedSkills.has(skillId)) {
            return false;
        }

        // Check if all prerequisites are met.
        if (!this.checkPrerequisites(node)) {
            return false;
        }

        // Check if skill-specific unlock conditions are met.
        if (!this.meetsUnlockConditions(node.skill)) {
            return false;
        }

        // Finally, check if there are enough skill points.
        return this.skillPoints > 0;
    }

    /**
     * Checks if the skill's specific unlock conditions (e.g., 'kills', 'damageSpells') are met.
     * @param skill - The {@link Skill} to check.
     * @returns `true` if all unlock conditions are met, `false` otherwise.
     */
    private meetsUnlockConditions(skill: Skill): boolean {
        if (!skill.unlockConditions) {
            return true; // No specific conditions, so it's met.
        }

        // All conditions must have their progress meet or exceed their required value.
        return skill.unlockConditions.every(condition =>
            (condition.progress || 0) >= condition.value
        );
    }

    /**
     * Retrieves all skills that have been unlocked by the player.
     * @returns An array of unlocked {@link Skill} instances.
     */
    getUnlockedSkills(): Skill[] {
        return Array.from(this.unlockedSkills)
            .map(id => this.skills.get(id))
            .filter((skill): skill is Skill => skill !== undefined);
    }

    /**
     * Retrieves all skills present in the skill tree (both unlocked and locked).
     * @returns An array of all {@link Skill} instances.
     */
    getAllSkills(): Skill[] {
        return Array.from(this.skills.values());
    }

    /**
     * Retrieves all skill nodes that have no prerequisites, typically the starting points of skill branches.
     * @returns An array of root {@link SkillNode}s.
     */
    getRootNodes(): SkillNode[] {
        return Array.from(this.nodes.values()).filter(node =>
            node.prerequisites.length === 0
        );
    }

    /**
     * Retrieves all skill nodes that have the specified skill as a prerequisite.
     * @param skillId - The ID of the parent skill.
     * @returns An array of child {@link SkillNode}s.
     */
    getChildNodes(skillId: string): SkillNode[] {
        return Array.from(this.nodes.values()).filter(node =>
            node.prerequisites.includes(skillId)
        );
    }

    /**
     * Attempts to level up an unlocked skill. Consumes one skill point.
     * @param skillId - The ID of the skill to level up.
     * @returns `true` if the skill was successfully leveled up, `false` otherwise.
     */
    levelUpSkill(skillId: string): boolean {
        const skill = this.skills.get(skillId);
        // Cannot level up if skill doesn't exist, is not unlocked, cannot level further, or no skill points are available.
        if (!skill || !this.unlockedSkills.has(skillId) || !skill.canLevel() || this.skillPoints < 1) {
            return false;
        }

        if (skill.levelUp()) {
            this.skillPoints--; // Consume one skill point.
            return true;
        }
        return false;
    }
}
