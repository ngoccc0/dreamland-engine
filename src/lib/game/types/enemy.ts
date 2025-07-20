import type { TranslatableString } from "@/core/types/i18n";

export type EnemyBehavior = 'aggressive' | 'passive' | 'defensive' | 'territorial' | 'immobile' | 'ambush';
export type EnemySize = 'medium' | 'small' | 'large';

export interface Enemy {
    type: TranslatableString;
    hp: number;
    damage: number;
    behavior: EnemyBehavior;
    size: EnemySize;
    emoji: string;
    satiation: number;
    maxSatiation: number;
    diet: string[];
    senseEffect?: {
        range: number;
        type: string;
    };
}
