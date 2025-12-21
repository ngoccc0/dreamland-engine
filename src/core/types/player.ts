import { TranslatableString } from './i18n';
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
    /**
     * Satiety represents how full the player is (0-100).
     * 0 = starving (losing health per tick)
     * 100 = fully satiated (optimal)
     * 
     * @remarks
     * Replaces old "hunger" semantic. Decreases 1 point per game minute.
     */
    satiety: number;
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
