/**
 * Core Data Layer - Item Definitions
 *
 * Consolidated item catalog from all sources (equipment, food, tools, materials, magic, etc.)
 * This is the single source of truth for all item definitions in the game.
 *
 * MIGRATION NOTE (PHASE 2a):
 * - MOVED FROM: src/lib/game/data/items/*
 * - Updated imports to reference @/core/types/definitions/item
 * - All subcategories consolidated here
 * - Modded items included
 */

import type { ItemDefinition } from '@/core/types/definitions/item';
import { equipmentItems } from './equipment';
import { foodItems } from './food';
import { toolItems } from './tools';
import { materialItems } from './materials';
import { cookingMaterialItems, cookingSpiceItems } from './materials-cooking';
import { magicItems } from './magic';
import { supportItems } from './support';
import { dataItems } from './data';
import { naturePlusItems } from './modded/nature_plus';

/**
 * Complete item catalog - combines all categories
 */
export const allItems: Record<string, ItemDefinition> = {
    ...equipmentItems,
    ...foodItems,
    ...toolItems,
    ...materialItems,
    ...cookingMaterialItems,
    ...magicItems,
    ...supportItems,
    ...dataItems,
    ...naturePlusItems,
};

/**
 * Get single item definition by ID
 */
export function getItemDefinition(itemId: string): ItemDefinition | undefined {
    return allItems[itemId];
}

// Re-export individual categories for specific access
export { equipmentItems, foodItems, toolItems, materialItems, cookingMaterialItems, cookingSpiceItems, magicItems, supportItems, dataItems };
