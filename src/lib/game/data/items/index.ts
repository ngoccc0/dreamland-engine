import type { ItemDefinition } from "../../definitions/item";
import { foodItems } from './food';
import { supportItems } from './support';
import { materialItems } from './materials';
import { toolItems } from './tools';
import { equipmentItems } from './equipment';
import { magicItems } from './magic';

// The description field now holds a key for the i18n system.
export const itemDefinitions: Record<string, ItemDefinition> = {
    ...foodItems,
    ...supportItems,
    ...materialItems,
    ...toolItems,
    ...equipmentItems,
    ...magicItems,
};
