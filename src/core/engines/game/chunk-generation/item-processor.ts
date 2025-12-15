/**
 * Item processing helper for chunk generation
 *
 * @remarks
 * Converts raw item references into resolved `ChunkItem` objects with
 * proper definitions, quantities, and properties. Handles quantity
 * calculation and logging for spawn debugging.
 */

import type { ItemDefinition, ChunkItem } from "@/core/types/game";
import { getRandomInRange } from "../world-generation";
import { getTranslatedText } from "@/lib/utils";
import { logger } from "@/lib/core/logger";

/**
 * Processes selected item references into final ChunkItem objects.
 *
 * @remarks
 * **Algorithm:**
 * 1. For each selected item reference, resolve its definition
 * 2. Generate random quantity from baseQuantity range
 * 3. Skip items with 0 quantity
 * 4. Push resolved item to spawnedItems list
 * 5. Log debug info for spawn analysis
 *
 * @param itemRefs - Raw item references from entity selection
 * @param spawnedItems - Output array to populate (mutated)
 * @param resolveItem - Function to resolve item reference to definition
 */
export function processSelectedItems(
    itemRefs: Array<{ name: string }>,
    spawnedItems: ChunkItem[],
    resolveItem: (name: string) => ItemDefinition | undefined
): void {
    for (const itemRef of itemRefs) {
        logger.debug('[processSelectedItems] Processing itemRef', { itemRef });
        const itemDef = resolveItem(itemRef.name);
        logger.debug('[processSelectedItems] Resolved itemDef', { itemDef });

        if (itemDef) {
            logger.debug('[processSelectedItems] Item definition found', {
                baseQuantityMin: itemDef.baseQuantity.min,
                baseQuantityMax: itemDef.baseQuantity.max
            });
            const finalQuantity = getRandomInRange({
                min: itemDef.baseQuantity.min,
                max: itemDef.baseQuantity.max
            });
            logger.debug('[processSelectedItems] Final quantity determined from baseQuantity range', { finalQuantity });

            if (finalQuantity > 0) {
                spawnedItems.push({
                    name: itemDef.name,
                    description: itemDef.description,
                    tier: itemDef.tier,
                    quantity: finalQuantity,
                    emoji: itemDef.emoji,
                });
                logger.debug('[processSelectedItems] Item pushed to spawnedItems', {
                    itemName: getTranslatedText(itemDef.name, 'en'),
                    finalQuantity
                });
            } else {
                logger.debug('[processSelectedItems] finalQuantity is 0, item not spawned (should not happen if baseQuantity.min > 0)', {
                    itemName: getTranslatedText(itemDef.name, 'en'),
                    finalQuantity
                });
            }
        } else {
            logger.warn('[processSelectedItems] Item definition not found for itemRef', { itemRefName: itemRef.name });
        }
    }
}
