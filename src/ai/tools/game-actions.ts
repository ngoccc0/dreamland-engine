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
import { PlayerStatusSchema, EnemySchema, PlayerItemSchema, ChunkItemSchema, ItemDefinitionSchema } from '@/ai/schemas';
import type { PlayerItem, PlayerStatus } from '@/lib/game/types';
import { itemDefinitions } from '@/lib/game/config';

// --- Tool for Player Attacking Enemy ---
export const playerAttackTool = ai.defineTool({
    name: 'playerAttack',
    description: 'Calculates the result of a player attacking an enemy in a single combat round. Call this when the player action is an attack.',
    inputSchema: z.object({
        playerStatus: PlayerStatusSchema,
        enemy: EnemySchema,
        lightLevel: z.number().optional().describe("The current light level (-10 to 10). Low light (e.g., < -3) can reduce accuracy."),
        moisture: z.number().optional().describe("The current moisture level (0-10). High moisture (e.g., > 8) can impede physical attacks."),
    }),
    outputSchema: z.object({
        playerDamageDealt: z.number().describe("Damage dealt by the player."),
        enemyDamageDealt: z.number().describe("Damage dealt by the enemy in retaliation."),
        finalPlayerHp: z.number().describe("Player's HP after the exchange."),
        finalEnemyHp: z.number().describe("Enemy's HP after being attacked."),
        enemyDefeated: z.boolean().describe("True if the enemy's HP is 0 or less."),
        combatLog: z.string().optional().describe("A brief, factual log of environmental effects on combat, e.g. 'Sương mù làm giảm độ chính xác của người chơi.'"),
    })
}, async ({ playerStatus, enemy, lightLevel, moisture }) => {
    let playerDamageModifier = 1.0;
    const combatLogParts: string[] = [];

    // Environmental effects on player's attack
    if (lightLevel !== undefined && lightLevel < -3) {
        playerDamageModifier *= 0.8; // 20% penalty in fog/darkness
        combatLogParts.push("Tầm nhìn kém trong sương mù/bóng tối làm giảm độ chính xác của người chơi.");
    }
    if (moisture !== undefined && moisture > 8) {
        playerDamageModifier *= 0.9; // 10% penalty in heavy rain
        combatLogParts.push("Mưa lớn cản trở đòn tấn công của người chơi.");
    }

    const playerDamage = Math.round(playerStatus.attributes.physicalAttack * playerDamageModifier);
    const finalEnemyHp = Math.max(0, enemy.hp - playerDamage);
    const enemyDefeated = finalEnemyHp <= 0;

    // Environmental effects on enemy's attack (can be symmetrical for now)
    let enemyDamageModifier = 1.0;
     if (lightLevel !== undefined && lightLevel < -3) {
        enemyDamageModifier *= 0.8;
        combatLogParts.push("Kẻ địch cũng bị ảnh hưởng bởi tầm nhìn kém.");
    }
    if (moisture !== undefined && moisture > 8) {
        enemyDamageModifier *= 0.9;
    }

    const enemyDamage = enemyDefeated ? 0 : Math.round(enemy.damage * enemyDamageModifier);
    const finalPlayerHp = Math.max(0, playerStatus.hp - enemyDamage);

    return {
        playerDamageDealt: playerDamage,
        enemyDamageDealt: enemyDamage,
        finalPlayerHp,
        finalEnemyHp,
        enemyDefeated,
        combatLog: combatLogParts.length > 0 ? combatLogParts.join(' ') : undefined,
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
        // Find the tier from the item definition catalog if needed, though itemToTake should have it.
        const definition = itemDefinitions[itemToTake.name];
        const tier = definition ? definition.tier : itemToTake.tier || 1;
        updatedPlayerInventory.push({ name: itemToTake.name, quantity: itemToTake.quantity, tier: tier });
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
        customItemDefinitions: z.record(ItemDefinitionSchema).optional().describe("A map of AI-generated item definitions for the current game session."),
    }),
    outputSchema: z.object({
        updatedPlayerStatus: PlayerStatusSchema,
        wasUsed: z.boolean().describe("Whether the item was successfully found and used."),
        effectDescription: z.string().describe("A simple, factual description of what the item did, e.g., 'Healed for 25 HP. Restored 10 Stamina.'"),
    }),
}, async ({ itemName, playerStatus, customItemDefinitions }) => {
    const newStatus: PlayerStatus = JSON.parse(JSON.stringify(playerStatus)); // Deep copy
    const itemIndex = newStatus.items.findIndex((i: PlayerItem) => i.name.toLowerCase() === itemName.toLowerCase());

    if (itemIndex === -1) {
        return { updatedPlayerStatus: playerStatus, wasUsed: false, effectDescription: 'Item not found.' };
    }

    const customDef = customItemDefinitions?.[newStatus.items[itemIndex].name];
    const staticDef = itemDefinitions[newStatus.items[itemIndex].name];
    const itemDef = customDef || staticDef;

    if (!itemDef) {
         return { updatedPlayerStatus: playerStatus, wasUsed: false, effectDescription: 'Item has no defined effect.' };
    }
    
    // Apply effects
    const effectDescriptions: string[] = [];
    itemDef.effects.forEach(effect => {
        switch (effect.type) {
            case 'HEAL':
                const oldHp = newStatus.hp;
                newStatus.hp = Math.min(100, newStatus.hp + effect.amount);
                if (newStatus.hp > oldHp) {
                    effectDescriptions.push(`Hồi ${newStatus.hp - oldHp} máu.`);
                }
                break;
            case 'RESTORE_STAMINA':
                 const oldStamina = newStatus.stamina;
                 newStatus.stamina = Math.min(100, newStatus.stamina + effect.amount);
                 if (newStatus.stamina > oldStamina) {
                    effectDescriptions.push(`Phục hồi ${newStatus.stamina - oldStamina} thể lực.`);
                 }
                break;
        }
    });

    if (effectDescriptions.length === 0) {
        return { updatedPlayerStatus: playerStatus, wasUsed: false, effectDescription: 'Item had no effect.' };
    }

    // Decrement quantity and remove if zero
    newStatus.items[itemIndex].quantity -= 1;
    if (newStatus.items[itemIndex].quantity <= 0) {
        newStatus.items.splice(itemIndex, 1);
    }
    
    return { 
        updatedPlayerStatus: newStatus, 
        wasUsed: true, 
        effectDescription: effectDescriptions.join(' ') 
    };
});
