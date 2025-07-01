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
import { PlayerStatusSchema, EnemySchema, PlayerItemSchema, ChunkItemSchema, ItemDefinitionSchema, PetSchema, SkillSchema } from '@/ai/schemas';
import type { PlayerItem, PlayerStatus, Pet, ChunkItem, Skill } from '@/lib/game/types';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import { templates } from '@/lib/game/templates';

const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

// --- Tool for Player Attacking Enemy ---
export const playerAttackTool = ai.defineTool({
    name: 'playerAttack',
    description: 'Calculates the result of a player attacking an enemy in a single combat round. Call this when the player action is an attack.',
    inputSchema: z.object({
        playerStatus: PlayerStatusSchema,
        enemy: EnemySchema,
        terrain: z.enum(["forest", "grassland", "desert", "swamp", "mountain", "cave"]).describe("The terrain of the chunk where the combat takes place."),
        customItemDefinitions: z.record(ItemDefinitionSchema).optional().describe("A map of AI-generated item definitions for the current game session."),
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
        lootDrops: z.array(ChunkItemSchema).optional().describe("A list of items dropped by the defeated enemy. The narrative should mention these items."),
    })
}, async ({ playerStatus, enemy, terrain, customItemDefinitions, lightLevel, moisture }) => {
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

    let lootDrops: ChunkItem[] | undefined = undefined;
    if (enemyDefeated) {
        const enemyTemplate = templates[terrain]?.enemies.find(e => e.data.type === enemy.type);
        if (enemyTemplate && enemyTemplate.data.loot) {
            const allItemDefinitions = { ...staticItemDefinitions, ...customItemDefinitions };
            const drops: ChunkItem[] = [];

            for (const lootItem of enemyTemplate.data.loot) {
                if (Math.random() < lootItem.chance) {
                    const definition = allItemDefinitions[lootItem.name];
                    if (definition) {
                        const quantity = getRandomInRange(lootItem.quantity);
                        drops.push({
                            name: lootItem.name,
                            description: definition.description,
                            tier: definition.tier,
                            quantity: quantity,
                        });
                    }
                }
            }
            if (drops.length > 0) {
                 lootDrops = drops;
            }
        }
    }

    return {
        playerDamageDealt: playerDamage,
        enemyDamageDealt: enemyDamage,
        finalPlayerHp,
        finalEnemyHp,
        enemyDefeated,
        combatLog: combatLogParts.length > 0 ? combatLogParts.join(' ') : undefined,
        lootDrops,
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
        const definition = staticItemDefinitions[itemToTake.name]; // Note: This doesn't include custom defs, but should be fine for now.
        const tier = definition ? definition.tier : itemToTake.tier || 1;
        updatedPlayerInventory.push({ name: itemToTake.name, quantity: itemToTake.quantity, tier: tier });
    }

    return { updatedPlayerInventory, updatedChunkItems };
});

// --- Tool for Using an Item from Inventory ---
export const useItemTool = ai.defineTool({
    name: 'useItem',
    description: "Uses one item from the player's inventory, applying its effect and decrementing its quantity. Call this when the player action is to use an item ON THEMSELVES (e.g. 'eat berry', 'drink potion').",
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
    const staticDef = staticItemDefinitions[newStatus.items[itemIndex].name];
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


// --- Tool for Taming an Enemy ---
export const tameEnemyTool = ai.defineTool({
    name: 'tameEnemy',
    description: "Attempts to tame an enemy by giving it a food item from the player's inventory. Call this when the player's action is to use an item on a creature (e.g. 'give meat to wolf').",
    inputSchema: z.object({
        itemName: z.string().describe("The name of the food item to use for taming."),
        playerStatus: PlayerStatusSchema,
        enemy: EnemySchema,
    }),
    outputSchema: z.object({
        wasTamed: z.boolean().describe("Whether the taming attempt succeeded."),
        itemConsumed: z.boolean().describe("Whether the creature ate the item."),
        updatedPlayerStatus: PlayerStatusSchema.describe("The player's status after consuming the item from inventory."),
        updatedEnemy: EnemySchema.nullable().describe("The enemy's new state, or null if tamed."),
        newPet: PetSchema.nullable().describe("The new pet data, if taming was successful."),
        log: z.string().describe("A factual log of what happened, e.g., 'The wolf ate the Raw Wolf Meat. Taming failed.'"),
    }),
}, async ({ itemName, playerStatus, enemy }) => {
    const newStatus: PlayerStatus = JSON.parse(JSON.stringify(playerStatus)); // Deep copy
    const itemIndex = newStatus.items.findIndex(i => i.name.toLowerCase() === itemName.toLowerCase());

    if (itemIndex === -1) {
        return {
            wasTamed: false,
            itemConsumed: false,
            updatedPlayerStatus: playerStatus,
            updatedEnemy: enemy,
            newPet: null,
            log: "Player does not have the specified item."
        };
    }

    // Check if the item is in the enemy's diet
    if (!enemy.diet.includes(itemName)) {
        return {
            wasTamed: false,
            itemConsumed: false,
            updatedPlayerStatus: playerStatus,
            updatedEnemy: enemy,
            newPet: null,
            log: `The ${enemy.type} is not interested in the ${itemName}.`
        };
    }
    
    // Consume the item
    newStatus.items[itemIndex].quantity -= 1;
    if (newStatus.items[itemIndex].quantity <= 0) {
        newStatus.items.splice(itemIndex, 1);
    }
    
    const newEnemyState = { ...enemy };
    newEnemyState.satiation = Math.min(newEnemyState.satiation + 1, newEnemyState.maxSatiation);

    // Taming Logic
    // Chance increases with higher satiation and lower enemy HP.
    const baseTameChance = 0.1; // 10% base chance
    const satiationBonus = (newEnemyState.satiation / newEnemyState.maxSatiation) * 0.4; // up to 40% bonus
    const healthPenalty = (newEnemyState.hp / 100) * 0.2; // penalty for high health, up to 20%
    const tamingChance = baseTameChance + satiationBonus - healthPenalty;

    if (Math.random() < tamingChance) {
        // SUCCESS
        const newPet: Pet = {
            type: enemy.type,
            level: 1,
        };
        
        if (!newStatus.pets) {
            newStatus.pets = [];
        }
        newStatus.pets.push(newPet);

        return {
            wasTamed: true,
            itemConsumed: true,
            updatedPlayerStatus: newStatus,
            updatedEnemy: null, // Enemy is gone
            newPet: newPet,
            log: `The ${enemy.type} ate the ${itemName}. Taming was successful!`
        };
    } else {
        // FAILURE
        return {
            wasTamed: false,
            itemConsumed: true,
            updatedPlayerStatus: newStatus,
            updatedEnemy: newEnemyState,
            newPet: null,
            log: `The ${enemy.type} ate the ${itemName}, but remains wild.`
        };
    }
});

// --- Tool for Using a Skill ---
export const useSkillTool = ai.defineTool({
    name: 'useSkill',
    description: "Uses one of the player's known skills, considering the d20 roll's success level. Call this when the player's action is to use a skill (e.g., 'use Heal', 'cast Fireball').",
    inputSchema: z.object({
        skillName: z.string().describe("The name of the skill to use from the player's skill list."),
        playerStatus: PlayerStatusSchema,
        enemy: EnemySchema.nullable().optional().describe("The enemy, if the skill targets one."),
        successLevel: z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']).describe("The categorized result of a d20 dice roll, which dictates the skill's outcome."),
    }),
    outputSchema: z.object({
        updatedPlayerStatus: PlayerStatusSchema.describe("The player's status after the skill is used."),
        updatedEnemy: EnemySchema.nullable().optional().describe("The enemy's new state, or null if defeated."),
        log: z.string().describe("A factual log of what happened, e.g., 'Player is out of mana.', 'Healed for 25 HP.', 'The skill fizzles!'. This log should be narrated by the AI."),
    }),
}, async ({ skillName, playerStatus, enemy, successLevel }) => {
    const newPlayerStatus: PlayerStatus = JSON.parse(JSON.stringify(playerStatus));
    let newEnemy: typeof enemy | null = enemy ? JSON.parse(JSON.stringify(enemy)) : null;

    const skillToUse = newPlayerStatus.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());

    if (!skillToUse) {
        return { updatedPlayerStatus: playerStatus, updatedEnemy: enemy, log: `Player does not know the skill: ${skillName}.` };
    }

    if (newPlayerStatus.mana < skillToUse.manaCost) {
        return { updatedPlayerStatus: playerStatus, updatedEnemy: enemy, log: `Không đủ mana để sử dụng ${skillToUse.name}.` };
    }

    // Deduct mana regardless of outcome, unless it's a critical failure that prevents casting.
    newPlayerStatus.mana -= skillToUse.manaCost;

    let log = "";
    let effectMultiplier = 1.0;

    switch (successLevel) {
        case 'CriticalFailure':
            if (skillToUse.effect.type === 'HEAL') {
                const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
                newPlayerStatus.hp = Math.max(0, newPlayerStatus.hp - backfireDamage);
                log = `Kỹ năng phản tác dụng! Phép thuật chữa lành của bạn gây ra ${backfireDamage} sát thương cho chính bạn.`;
            } else if (skillToUse.effect.type === 'DAMAGE') {
                 const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
                newPlayerStatus.hp = Math.max(0, newPlayerStatus.hp - backfireDamage);
                log = `Kỹ năng phản tác dụng! Quả cầu lửa nổ tung trên tay bạn, gây ${backfireDamage} sát thương.`;
            }
            return { updatedPlayerStatus: newPlayerStatus, updatedEnemy: newEnemy, log };

        case 'Failure':
            log = `Năng lượng ma thuật tiêu tán! Nỗ lực sử dụng ${skillToUse.name} của bạn đã thất bại.`;
            return { updatedPlayerStatus: newPlayerStatus, updatedEnemy: newEnemy, log };

        case 'GreatSuccess':
            effectMultiplier = 1.5;
            break;
        case 'CriticalSuccess':
            effectMultiplier = 2.0;
            break;
        case 'Success':
        default:
            effectMultiplier = 1.0;
            break;
    }

    // Apply skill effect
    switch (skillToUse.effect.type) {
        case 'HEAL':
            if (skillToUse.effect.target === 'SELF') {
                const healAmount = Math.round(skillToUse.effect.amount * effectMultiplier);
                const oldHp = newPlayerStatus.hp;
                newPlayerStatus.hp = Math.min(100, newPlayerStatus.hp + healAmount);
                const healedAmount = newPlayerStatus.hp - oldHp;
                log = `Sử dụng ${skillToUse.name}, hồi ${healedAmount} máu.`;
                if (successLevel === 'GreatSuccess') log += ' Luồng năng lượng mạnh mẽ giúp bạn cảm thấy sảng khoái hơn nhiều.';
                if (successLevel === 'CriticalSuccess') log += ' Một luồng năng lượng thần thánh bao bọc lấy bạn, chữa lành vết thương một cách thần kỳ!';
            }
            break;
        case 'DAMAGE':
            if (skillToUse.effect.target === 'ENEMY') {
                if (!newEnemy) {
                    log = `Sử dụng ${skillToUse.name}, nhưng không có mục tiêu.`;
                } else {
                    const baseDamage = skillToUse.effect.amount + Math.round(newPlayerStatus.attributes.magicalAttack * 0.5);
                    const finalDamage = Math.round(baseDamage * effectMultiplier);

                    newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                    log = `Sử dụng ${skillToUse.name}, gây ${finalDamage} sát thương phép lên ${newEnemy.type}.`;
                     if (successLevel === 'GreatSuccess') log += ' Quả cầu lửa bay nhanh và chính xác hơn, gây thêm sát thương.';
                    if (successLevel === 'CriticalSuccess') log = `Một đòn CHÍ MẠNG phép thuật! ${skillToUse.name} của bạn bùng nổ dữ dội, gây ${finalDamage} sát thương hủy diệt lên ${newEnemy.type}.`;


                    if (newEnemy.hp <= 0) {
                        log += ` ${newEnemy.type} đã bị tiêu diệt!`;
                        newEnemy = null;
                    }
                }
            }
            break;
    }

    return {
        updatedPlayerStatus: newPlayerStatus,
        updatedEnemy: newEnemy,
        log,
    };
});
