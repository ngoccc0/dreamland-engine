/**
 * Structure loot processing helper
 *
 * @remarks
 * Handles extraction and application of loot items from structures.
 * Applies chance-based loot drop logic and stacks items if they
 * already exist in the spawned items list.
 */

import type { Structure, ItemDefinition, ChunkItem } from "@/core/types/game";
import { getRandomInRange } from "../world-generation";

/**
 * Processes structure loot and adds items to spawned items list.
 *
 * @remarks
 * **Algorithm:**
 * 1. Iterate through structures and their loot definitions
 * 2. For each loot item, check if it passes its spawn chance
 * 3. Generate random quantity from loot definition
 * 4. Check if item already exists in spawned list
 * 5. Stack quantity or add as new item
 *
 * @param structures - Array of spawned structures with loot definitions
 * @param spawnedItems - Existing spawned items to add loot to (mutated)
 * @param allItemDefinitions - Registry of item definitions for resolution
 * @param resolveItem - Function to resolve item by name to definition
 */
export function processStructureLoot(
    structures: Structure[],
    spawnedItems: ChunkItem[],
    allItemDefinitions: Record<string, ItemDefinition>,
    _resolveItem: (name: string) => ItemDefinition | undefined
): void {
    for (const struct of structures) {
        if (!struct.loot) continue;

        for (const lootItem of struct.loot) {
            if (lootItem.chance !== undefined && Math.random() >= lootItem.chance) continue;

            const definition = allItemDefinitions[lootItem.name];
            if (!definition) continue;

            const quantity = getRandomInRange({ min: lootItem.quantity.min, max: lootItem.quantity.max });
            const existingItemIndex = spawnedItems.findIndex(i => (
                (i as any).id === lootItem.name ||
                (i.name === definition.name)
            ));

            if (existingItemIndex > -1) {
                spawnedItems[existingItemIndex].quantity += quantity;
            } else {
                spawnedItems.push({
                    name: definition.name,
                    description: definition.description,
                    tier: definition.tier,
                    quantity,
                    emoji: definition.emoji,
                });
            }
        }
    }
}
