import { TranslatableString } from '../types/i18n';
import { Effect } from '../types/effects';

export interface Skill {
    id: string;
    name: TranslatableString;
    description: TranslatableString;
    level: number;
    maxLevel: number;
    experience: number;
    experienceToNext: number;
    type: SkillType;
    effects: Effect[];
    cooldown: number;
    manaCost: number;
    unlockConditions?: SkillUnlockCondition[];
    requirements?: SkillRequirements;
    metadata?: Record<string, any>;
}

export enum SkillType {
    PASSIVE = 'passive',
    ACTIVE = 'active',
    ULTIMATE = 'ultimate',
    MOVEMENT = 'movement',
    UTILITY = 'utility',
    COMBAT = 'combat',
    CRAFTING = 'crafting'
}

export interface SkillUnlockCondition {
    type: 'level' | 'kills' | 'damage' | 'moves' | 'custom';
    value: number;
    progress?: number;
}

export interface SkillRequirements {
    level?: number;
    stats?: {
        strength?: number;
        dexterity?: number;
        intelligence?: number;
        vitality?: number;
        wisdom?: number;
    };
    skills?: {
        id: string;
        level: number;
    }[];
    class?: string[];
}
