/**
 * Action generation helper for chunk generation
 *
 * @remarks
 * Generates interactive actions available to the player in a chunk.
 * Includes observation actions for enemies, interaction actions for NPCs,
 * pickup actions for items, and generic exploration actions.
 */

import type { Action, Enemy, Npc, ChunkItem } from "@/core/types/game";
import { getTranslatedText } from "@/lib/utils";
import type { TranslationKey } from "@/lib/core/i18n";

/**
 * Generates all actions available in a chunk.
 *
 * @remarks
 * **Action Types:**
 * - **Enemy Observation**: Observe spawned enemy (if present)
 * - **NPC Interaction**: Talk to NPCs (prioritizes first NPC)
 * - **Item Pickup**: Pickup spawned items (if any exist)
 * - **Generic Actions**: Always available exploration actions
 *
 * Each action gets a unique ID for tracking and execution.
 *
 * @param spawnedEnemy - Enemy in chunk, if any
 * @param spawnedNPCs - Array of NPCs in chunk
 * @param spawnedItems - Array of items in chunk
 * @param t - Translation function
 * @returns Array of actions ready for player interaction
 */
export function generateChunkActions(
    spawnedEnemy: Enemy | null,
    spawnedNPCs: Npc[],
    spawnedItems: ChunkItem[],
    _t: (key: TranslationKey, replacements?: any) => string
): Action[] {
    const actions: Action[] = [];
    let actionIdCounter = 1;

    // Add observe enemy action
    if (spawnedEnemy) {
        actions.push({
            id: actionIdCounter++,
            textKey: 'observeAction_enemy',
            params: { enemyType: getTranslatedText(spawnedEnemy.type, 'en') }
        });
    }

    // Add NPC interaction action
    const firstNPC = spawnedNPCs.find(n => n && (n as any).name);
    if (firstNPC) {
        actions.push({
            id: actionIdCounter++,
            textKey: 'talkAction_npc',
            params: { npcName: getTranslatedText((firstNPC as any).name || 'NPC', 'en') }
        });
    }

    // Add item pickup actions
    if (spawnedItems.length > 0) {
        actions.push({
            id: actionIdCounter++,
            textKey: 'pickupAction_items',
            params: { count: spawnedItems.length }
        });
    }

    // Add generic exploration actions (always available)
    actions.push({
        id: actionIdCounter++,
        textKey: 'exploreAction',
        params: {}
    });

    return actions;
}
