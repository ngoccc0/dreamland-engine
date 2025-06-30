/**
 * @fileOverview Defines the Genkit tools for core game mechanics.
 *
 * This file provides a set of reliable, server-side functions (tools) that the AI
 * can call to perform actions like combat or item manipulation. This separates the
 * game's "rules engine" from the AI's "storytelling" role, ensuring that game
 * state changes are predictable and correct.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PlayerStatusSchema, EnemySchema, PlayerItemSchema, ChunkItemSchema } from '@/ai/schemas';
import type { PlayerItem } from '@/lib/game/types';

// --- Tool for Player Attacking Enemy ---
export const playerAttackTool = ai.defineTool({
    name: 'playerAttack',
    description: 'Calculates the result of a player attacking an enemy in a single combat round. Call this when the player action is an attack.',
    inputSchema: z.object({
        playerStatus: PlayerStatusSchema,
        enemy: EnemySchema,
    }),
    outputSchema: z.object({
        playerDamageDealt: z.number().describe("Damage dealt by the player."),
        enemyDamageDealt: z.number().describe("Damage dealt by the enemy in retaliation."),
        finalPlayerHp: z.number().describe("Player's HP after the exchange."),
        finalEnemyHp: z.number().describe("Enemy's HP after being attacked."),
        enemyDefeated: z.boolean().describe("True if the enemy's HP is 0 or less."),
    })
}, async ({ playerStatus, enemy }) => {
    const playerDamage = playerStatus.attributes.physicalAttack;
    const finalEnemyHp = Math.max(0, enemy.hp - playerDamage);
    const enemyDefeated = finalEnemyHp <= 0;
    const enemyDamage = enemyDefeated ? 0 : enemy.damage;
    const finalPlayerHp = Math.max(0, playerStatus.hp - enemyDamage);
    return {
        playerDamageDealt: playerDamage,
        enemyDamageDealt: enemyDamage,
        finalPlayerHp,
        finalEnemyHp,
        enemyDefeated,
    };
});

// --- Tool for Taking an Item from the Chunk ---
export const takeItemTool = ai.defineTool({
    name: 'takeItem',
    description: "Moves an entire stack of items from the game world into the player's inventory. Call this when the player action is to pick up or take an item.",
    inputSchema: z.object({
        itemToTake: ChunkItemSchema.describe("The specific item being taken from the chunk."),
        currentChunkItems: z.array(ChunkItemSchema).describe("The complete list of items currently in the chunk."),
        playerInventory: z.array(PlayerItemSchema).describe("The player's current inventory."),
    }),
    outputSchema: z.object({
        updatedPlayerInventory: z.array(PlayerItemSchema),
        updatedChunkItems: z.array(ChunkItemSchema),
    }),
}, async ({ itemToTake, currentChunkItems, playerInventory }) => {
    // Remove from chunk
    const updatedChunkItems = currentChunkItems.filter(i => i.name !== itemToTake.name);
    
    // Add to player inventory
    const updatedPlayerInventory = [...playerInventory];
    const existingItem = updatedPlayerInventory.find(i => i.name === itemToTake.name);
    if (existingItem) {
        existingItem.quantity += itemToTake.quantity;
    } else {
        updatedPlayerInventory.push({ name: itemToTake.name, quantity: itemToTake.quantity, tier: itemToTake.tier });
    }

    return { updatedPlayerInventory, updatedChunkItems };
});

// --- Tool for Using an Item from Inventory ---
export const useItemTool = ai.defineTool({
    name: 'useItem',
    description: "Uses one item from the player's inventory, applying its effect and decrementing its quantity. Call this when the player action is to use an item.",
    inputSchema: z.object({
        itemName: z.string().describe("The name of the item to use from the inventory."),
        playerStatus: PlayerStatusSchema,
    }),
    outputSchema: z.object({
        updatedPlayerStatus: PlayerStatusSchema,
        wasUsed: z.boolean().describe("Whether the item was successfully found and used."),
        effectDescription: z.string().describe("A simple description of what the item did, e.g., 'Healed 25 HP'."),
    }),
}, async ({ itemName, playerStatus }) => {
    const newStatus = JSON.parse(JSON.stringify(playerStatus)); // Deep copy to avoid mutation
    const itemIndex = newStatus.items.findIndex((i: PlayerItem) => i.name.toLowerCase() === itemName.toLowerCase());

    if (itemIndex === -1) {
        return { updatedPlayerStatus: playerStatus, wasUsed: false, effectDescription: 'Item not found.' };
    }
    
    // Decrement quantity
    newStatus.items[itemIndex].quantity -= 1;
    
    // Apply effect (simple healing example)
    let effectDescription = 'Used item.';
    if (itemName.toLowerCase().includes('heal')) {
        newStatus.hp = Math.min(100, newStatus.hp + 25);
        effectDescription = 'Healed for 25 HP.';
    }

    // Remove if quantity is zero
    if (newStatus.items[itemIndex].quantity <= 0) {
        newStatus.items.splice(itemIndex, 1);
    }
    
    return { updatedPlayerStatus: newStatus, wasUsed: true, effectDescription };
});
