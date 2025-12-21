import { TranslatableString } from './i18n';
import { Effect, EffectType } from './effects';

export interface Item {
    id: string;
    name: TranslatableString;
    description: TranslatableString;
    type: ItemType;
    rarity: ItemRarity;
    value: number;
    weight: number;
    stackable: boolean;
    maxStack: number;
    effects: Effect[];
    requirements?: ItemRequirements;
    /**
     * Effect applied if item use FAILS the difficulty check.
     * Example: Eating bad mushroom causes poison.
     * 
     * @remarks
     * When item consumption fails (failed dice roll), this effect is applied instead of the intended effect.
     */
    failureEffect?: {
        type: EffectType;
        value: number;
        duration?: number;
    };
    metadata?: Record<string, any>;
}

export enum ItemType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    CONSUMABLE = 'consumable',
    MATERIAL = 'material',
    QUEST = 'quest',
    MISC = 'misc'
}

export enum ItemRarity {
    COMMON = 'common',
    UNCOMMON = 'uncommon',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary'
}

export interface ItemRequirements {
    level?: number;
    stats?: {
        strength?: number;
        dexterity?: number;
        intelligence?: number;
    };
    class?: string[];
}

// Base interface for all items
export interface BaseItem {
    name: TranslatableString;
    description: TranslatableString;
    type: ItemType;
    rarity: ItemRarity;
    weight?: number;
    value?: number;
    stackable?: boolean;
    maxStack?: number;
    effects?: Effect[];
    tags?: string[];
}

// Interface for items in player inventory
export interface PlayerItem extends BaseItem {
    id: string; // Unique identifier for this inventory item instance
    quantity: number;
    durability?: number;
    maxDurability?: number;
    isEquipped?: boolean;
}
