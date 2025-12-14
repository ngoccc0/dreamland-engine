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
import { magicItems } from './magic';
import { supportItems } from './support';
import { dataItems } from './data';

/**
 * Complete item catalog - combines all categories
 */
export const allItems: Record<string, ItemDefinition> = {
    ...equipmentItems,
    ...foodItems,
    ...toolItems,
    ...materialItems,
    ...magicItems,
    ...supportItems,
    ...dataItems,
};

/**
 * Get single item definition by ID
 */
export function getItemDefinition(itemId: string): ItemDefinition | undefined {
    return allItems[itemId];
}

// Re-export individual categories for specific access
export { equipmentItems, foodItems, toolItems, materialItems, magicItems, supportItems, dataItems };
