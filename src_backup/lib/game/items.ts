/**
 * @fileOverview Central item catalog for the game.
 * @description This file acts as an aggregator, importing item definitions from various
 * modular files (organized by category) and combining them into a single, comprehensive
 * `itemDefinitions` object. This approach supports easy expansion and modding.
 */

import type { ItemDefinition } from "./types";
import { dataItems } from "./data/items/data";
import { equipmentItems } from "./data/items/equipment";
import { foodItems } from "./data/items/food";
import { magicItems } from "./data/items/magic";
import { materialItems } from "./data/items/materials";
import { supportItems } from "./data/items/support";
import { toolItems } from "./data/items/tools";
import { naturePlusItems } from "./data/items/modded/nature_plus";


/**
 * The master record of all item definitions in the game.
 * It combines static, category-based item lists with items from mods.
 * To add more items, especially from mods, you would import them here and
 * spread them into this final object.
 * @type {Record<string, ItemDefinition>}
 */
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
