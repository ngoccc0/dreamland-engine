import { TranslatableString } from './i18n';
import { Effect } from './effects';

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
    rarity: ItemRarity;
    weight?: number;
    value?: number;
    tags?: string[];
}

// Interface for items in player inventory
export interface PlayerItem extends BaseItem {
    quantity: number;
    durability?: number;
    maxDurability?: number;
    isEquipped?: boolean;
}
