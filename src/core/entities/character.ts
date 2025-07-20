import { Effect } from '../types/effects';
import { Item } from '../types/items';
import { TranslatableString } from '../types/i18n';

export interface Character {
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
    statuses: Set<string>;
    takeDamage(damage: number): void;
    heal(amount: number): void;
}

export interface CharacterStats {
    strength: number;
    dexterity: number;
    intelligence: number;
    vitality: number;
    luck: number;
}

export type CharacterAction = {
    type: 'move' | 'attack' | 'cast' | 'use_item' | 'interact';
    target?: { x: number; y: number } | string;  // Position or entity ID
    item?: string;  // Item ID for use_item
    skill?: string;  // Skill ID for cast
};
