import { TranslatableString } from '../types/i18n';

export enum CombatantType {
    PLAYER = 'PLAYER',
    NPC = 'NPC',
    MONSTER = 'MONSTER'
}

export interface CombatStats {
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    speed: number;
    criticalChance?: number;
    criticalDamage?: number;
}

export interface CombatSkill {
    id: string;
    name: TranslatableString;
    description: TranslatableString;
    damage?: number;
    cooldown: number;
    type: 'PHYSICAL' | 'MAGICAL' | 'TRUE';
    effects?: CombatEffect[];
}

export interface CombatEffect {
    type: string;
    duration: number;
    value: number;
    stackable?: boolean;
}

export class Combatant {
    private _stats: CombatStats;
    private _skills: CombatSkill[];
    private _activeEffects: Map<string, CombatEffect[]>;

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

    get id(): string {
        return this._id;
    }

    get type(): CombatantType {
        return this._type;
    }

    get name(): TranslatableString {
        return this._name;
    }

    get stats(): Readonly<CombatStats> {
        return this._stats;
    }

    get skills(): readonly CombatSkill[] {
        return this._skills;
    }

    get activeEffects(): ReadonlyMap<string, readonly CombatEffect[]> {
        return this._activeEffects;
    }

    takeDamage(amount: number): number {
        const actualDamage = Math.max(0, amount - this._stats.defense);
        this._stats.health = Math.max(0, this._stats.health - actualDamage);
        return actualDamage;
    }

    heal(amount: number): number {
        const missingHealth = this._stats.maxHealth - this._stats.health;
        const actualHeal = Math.min(missingHealth, amount);
        this._stats.health += actualHeal;
        return actualHeal;
    }

    addEffect(effect: CombatEffect): void {
        const existingEffects = this._activeEffects.get(effect.type) || [];
        
        if (effect.stackable) {
            this._activeEffects.set(effect.type, [...existingEffects, effect]);
        } else {
            // Replace existing effect of the same type
            this._activeEffects.set(effect.type, [effect]);
        }
    }

    removeEffect(effectType: string): void {
        this._activeEffects.delete(effectType);
    }

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

    isDead(): boolean {
        return this._stats.health <= 0;
    }
}

export interface CombatAction {
    actor: Combatant;
    target: Combatant;
    skill?: CombatSkill;
    type: 'ATTACK' | 'SKILL' | 'DEFEND' | 'FLEE';
}

export interface DamageResult {
    amount: number;
    type: 'PHYSICAL' | 'MAGICAL' | 'TRUE';
    isCritical: boolean;
}

export interface CombatRound {
    actions: CombatAction[];
    results: Map<string, DamageResult>;
    effects: Map<string, CombatEffect[]>;
}

export interface CombatResult {
    winner: Combatant;
    loser: Combatant;
    rounds: CombatRound[];
    experience?: number;
    loot?: any[]; // This should be replaced with proper Item type
    specialEvents?: any[]; // For quest triggers, achievements, etc.
}
