import { TranslatableString } from '../../lib/i18n';
import { PlayerItem } from './items';
import { Skill } from '../entities/skill';
import { PlayerPersona } from './game';

export interface PlayerAttributes {
    strength: number;
    dexterity: number;
    intelligence: number;
    constitution: number;
}

export interface PlayerEquipment {
    weapon: PlayerItem | null;
    armor: PlayerItem | null;
    accessory: PlayerItem | null;
}

export interface PlayerProgress {
    kills: number;
    damageSpells: number;
    moves: number;
}

export interface PlayerStatus {
    level: number;
    experience: number;
    hp: number;
    mana: number;
    stamina: number;
    bodyTemperature: number;
    items: PlayerItem[];
    equipment: PlayerEquipment;
    quests: TranslatableString[];
    questsCompleted: number;
    skills: Skill[];
    persona: PlayerPersona;
    attributes: PlayerAttributes;
    unlockProgress: PlayerProgress;
    journal?: Record<number, string>;
    dailyActionLog?: string[];
    questHints?: Record<string, string>;
}
