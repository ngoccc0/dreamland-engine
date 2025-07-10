import type { ItemDefinition } from "./types";
import { dataItems } from "./data/items/data";
import { equipmentItems } from "./data/items/equipment";
import { foodItems } from "./data/items/food";
import { magicItems } from "./data/items/magic";
import { materialItems } from "./data/items/materials";
import { supportItems } from "./data/items/support";
import { toolItems } from "./data/items/tools";
import { naturePlusItems } from "./data/items/modded/nature_plus";


// --- CENTRAL ITEM CATALOG ---
// This file now aggregates item definitions from multiple modular files.
// To add more items, especially from mods, you would import them here and spread them into the final object.
// The description and name fields now hold keys for the i18n system.
export const itemDefinitions: Record<string, ItemDefinition> = {
    ...dataItems,
    ...equipmentItems,
    ...foodItems,
    ...magicItems,
    ...materialItems,
    ...supportItems,
    ...toolItems,
    ...naturePlusItems,
};
