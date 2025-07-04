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
import type { PlayerItem, PlayerStatus, Pet, ChunkItem, Skill, Structure } from '@/lib/game/types';
import { getTemplates } from '@/lib/game/templates';
import { buildableStructures } from '@/lib/game/structures';


const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

// --- Tool for Player Attacking Enemy ---
export const playerAttackTool = ai.defineTool({
    name: 'playerAttack',
    description: 'Calculates the result of a player attacking an enemy in a single combat round. Call this when the player action is an attack.',
    inputSchema: z.object({
        playerStatus: PlayerStatusSchema,
        enemy: EnemySchema,
        terrain: z.enum(["forest", "grassland", "desert", "swamp", "mountain", "cave", "jungle", "volcanic", "wall"]),
        customItemDefinitions: z.record(ItemDefinitionSchema).describe("A map of ALL item definitions (static and custom) for the current game session."),
        lightLevel: z.number().optional().describe("The current light level (-10 to 10). Low light (e.g., < -3) can reduce accuracy."),
        moisture: z.number().optional().describe("The current moisture level (0-10). High moisture (e.g., > 8) can impede physical attacks."),
        successLevel: z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']).describe("The categorized result of a d20 dice roll, which dictates the attack's outcome."),
    }),
    outputSchema: z.object({
        playerDamageDealt: z.number().describe("Damage dealt by the player."),
        enemyDamageDealt: z.number().describe("Damage dealt by the enemy. Can be 0 if it fled."),
        finalPlayerHp: z.number().describe("Player's HP after the exchange."),
        finalEnemyHp: z.number().describe("Enemy's HP after being attacked."),
        enemyDefeated: z.boolean().describe("True if the enemy's HP is 0 or less."),
        fled: z.boolean().describe("True if the enemy fled instead of fighting back."),
        combatLog: z.string().optional().describe("A brief, factual log of what happened, e.g., 'Player dealt 15 damage. The creature fought back fiercely.' or 'The small creature fled in terror!'"),
        lootDrops: z.array(ChunkItemSchema).optional().describe("A list of items dropped by the defeated enemy. The narrative should mention these items."),
    })
}, async ({ playerStatus, enemy, terrain, customItemDefinitions, lightLevel, moisture, successLevel }) => {
    let playerDamage = 0;
    const combatLogParts: string[] = [];

    // Damage Calculation based on Success Level
    let damageMultiplier = 1.0;
    switch (successLevel) {
        case 'CriticalFailure':
            damageMultiplier = 0;
            combatLogParts.push("Player attack was a critical failure.");
            break;
        case 'Failure':
            damageMultiplier = 0;
            combatLogParts.push("Player attack failed.");
            break;
        case 'GreatSuccess':
            damageMultiplier = 1.5;
            break;
        case 'CriticalSuccess':
            damageMultiplier = 2.0;
            break;
        case 'Success':
        default:
            damageMultiplier = 1.0;
            break;
    }
    
    if (damageMultiplier > 0) {
        let playerDamageModifier = 1.0;
        if (lightLevel !== undefined && lightLevel < -3) {
            playerDamageModifier *= 0.8;
        }
        if (moisture !== undefined && moisture > 8) {
            playerDamageModifier *= 0.9;
        }

        let playerBaseDamage = playerStatus.attributes.physicalAttack;
        if (playerStatus.persona === 'warrior') {
            playerBaseDamage += 2; 
        }

        playerDamage = Math.round(playerBaseDamage * damageMultiplier * playerDamageModifier);
    }
    
    const finalEnemyHp = Math.max(0, enemy.hp - playerDamage);
    const enemyDefeated = finalEnemyHp <= 0;
    let lootDrops: ChunkItem[] | undefined = undefined;

    if (playerDamage > 0) {
        combatLogParts.push(`Player dealt ${playerDamage} damage.`);
        if (successLevel === 'CriticalSuccess') combatLogParts.push('Critical Hit!');
    }
    
    // Enemy Response Logic
    if (enemyDefeated) {
        const templates = getTemplates('en');
        const enemyTemplate = templates[terrain]?.enemies.find(e => e.data.type === enemy.type);
        if (enemyTemplate && enemyTemplate.data.loot) {
            const allItemDefinitions = customItemDefinitions;
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
                            emoji: definition.emoji,
                        });
                    }
                }
            }
            if (drops.length > 0) {
                 lootDrops = drops;
            }
        }
        
        return {
            playerDamageDealt: playerDamage,
            enemyDamageDealt: 0,
            finalPlayerHp: playerStatus.hp,
            finalEnemyHp,
            enemyDefeated: true,
            fled: false,
            combatLog: combatLogParts.join(' '),
            lootDrops,
        };
    }
    
    let fled = false;
    let enemyDamage = 0;
    
    const shouldFlee = enemy.behavior === 'passive' || (successLevel === 'CriticalSuccess' && enemy.size === 'small');

    if (shouldFlee) {
        fled = true;
        combatLogParts.push('The creature fled in terror!');
    } else {
        fled = false;
        let enemyDamageModifier = 1.0;
        if (successLevel !== 'CriticalFailure' && lightLevel !== undefined && lightLevel < -3) {
            enemyDamageModifier *= 0.8;
        }
        if (successLevel !== 'CriticalFailure' && moisture !== undefined && moisture > 8) {
            enemyDamageModifier *= 0.9;
        }
        enemyDamage = Math.round(enemy.damage * enemyDamageModifier);
        if (enemyDamage > 0) {
             combatLogParts.push(`Enemy retaliated for ${enemyDamage} damage.`);
        }
    }
    
    const finalPlayerHp = Math.max(0, playerStatus.hp - enemyDamage);

    return {
        playerDamageDealt: playerDamage,
        enemyDamageDealt: enemyDamage,
        finalPlayerHp,
        finalEnemyHp,
        enemyDefeated: false,
        fled,
        combatLog: combatLogParts.join(' '),
        lootDrops: undefined,
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
        updatedPlayerInventory.push({ 
            name: itemToTake.name, 
            quantity: itemToTake.quantity, 
            tier: itemToTake.tier,
            emoji: itemToTake.emoji,
        });
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
        customItemDefinitions: z.record(ItemDefinitionSchema).describe("A map of ALL item definitions (static and custom) for the current game session."),
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

    const itemDef = customItemDefinitions[newStatus.items[itemIndex].name];
    
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
                    effectDescriptions.push(`Healed for ${newStatus.hp - oldHp} HP.`);
                }
                break;
            case 'RESTORE_STAMINA':
                 const oldStamina = newStatus.stamina;
                 newStatus.stamina = Math.min(100, newStatus.stamina + effect.amount);
                 if (newStatus.stamina > oldStamina) {
                    effectDescriptions.push(`Restored ${newStatus.stamina - oldStamina} stamina.`);
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
        return { updatedPlayerStatus: playerStatus, updatedEnemy: enemy, log: `Not enough mana to use ${skillToUse.name}.` };
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
                log = `Skill backfired! Your healing spell inflicts ${backfireDamage} damage on you instead.`;
            } else if (skillToUse.effect.type === 'DAMAGE') {
                 const backfireDamage = Math.round(skillToUse.effect.amount * 0.5);
                newPlayerStatus.hp = Math.max(0, newPlayerStatus.hp - backfireDamage);
                log = `Skill backfired! The fireball explodes in your hand, dealing ${backfireDamage} damage.`;
            }
            return { updatedPlayerStatus: newPlayerStatus, updatedEnemy: newEnemy, log };

        case 'Failure':
            log = `The magic fizzles! Your attempt to cast ${skillToUse.name} fails.`;
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
                log = `Used ${skillToUse.name}, healing for ${healedAmount} HP.`;
                if (successLevel === 'GreatSuccess') log += ' A powerful surge of energy makes you feel much more refreshed.';
                if (successLevel === 'CriticalSuccess') log += ' A divine energy surrounds you, miraculously healing your wounds!';
            }
            break;
        case 'DAMAGE':
            if (skillToUse.effect.target === 'ENEMY') {
                if (!newEnemy) {
                    log = `Used ${skillToUse.name}, but there was no target.`;
                } else {
                    const baseDamage = skillToUse.effect.amount + Math.round(newPlayerStatus.attributes.magicalAttack * 0.5);
                    const finalDamage = Math.round(baseDamage * effectMultiplier);

                    newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                    log = `Used ${skillToUse.name}, dealing ${finalDamage} magic damage to the ${newEnemy.type}.`;
                     if (successLevel === 'GreatSuccess') log += ' The fireball flies faster and more accurately, dealing extra damage.';
                    if (successLevel === 'CriticalSuccess') log = `A magical CRITICAL HIT! Your ${skillToUse.name} explodes violently, dealing a devastating ${finalDamage} damage to the ${newEnemy.type}.`;

                    if (skillToUse.effect.healRatio) {
                        const healedAmount = Math.round(finalDamage * skillToUse.effect.healRatio);
                        const oldHp = newPlayerStatus.hp;
                        newPlayerStatus.hp = Math.min(100, newPlayerStatus.hp + healedAmount);
                        if (newPlayerStatus.hp > oldHp) {
                            log += ` You siphon ${newPlayerStatus.hp - oldHp} health from the hit.`
                        }
                    }

                    if (newEnemy.hp <= 0) {
                        log += ` The ${newEnemy.type} has been vanquished!`;
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

// --- Tool for Completing a Quest ---
export const completeQuestTool = ai.defineTool({
    name: 'completeQuest',
    description: "Confirms a quest is completed and determines a suitable reward. Call this ONLY when the player's action directly fulfills a quest's objective.",
    inputSchema: z.object({
        questText: z.string().describe("The exact text of the quest being completed."),
        playerStatus: PlayerStatusSchema.describe("The player's current status, for context."),
    }),
    outputSchema: z.object({
        isCompleted: z.boolean().describe("Always returns true to confirm completion."),
        rewardDescription: z.string().describe("A short, flavorful text describing the reward given, e.g., 'The hunter thanks you and gives you a handful of rare herbs.'"),
        rewardItems: z.array(PlayerItemSchema).optional().describe("An array of items to be given to the player as a reward."),
    }),
}, async ({ questText, playerStatus }) => {
    // This tool is a "rubber stamp". The LLM decides if the quest is complete.
    // The tool's job is just to formalize the completion and generate a plausible reward.
    
    // Simple reward logic: Give 1-2 random-ish items.
    const possibleRewards: PlayerItem[] = [
        { name: 'Thuốc Máu Yếu', quantity: 2, tier: 1, emoji: '🧪' },
        { name: 'Đá Mài', quantity: 1, tier: 2, emoji: '🔪' },
        { name: 'Bột Xương', quantity: 3, tier: 2, emoji: '💀' },
        { name: 'Cát Ma Thuật', quantity: 1, tier: 4, emoji: '✨'},
    ];
    
    const rewardItems: PlayerItem[] = [];
    const numberOfRewards = getRandomInRange({ min: 1, max: 2 });

    for (let i = 0; i < numberOfRewards; i++) {
        const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        const existing = rewardItems.find(r => r.name === reward.name);
        if (!existing) {
            rewardItems.push(reward);
        }
    }

    return {
        isCompleted: true,
        rewardDescription: "As a token of gratitude, you receive a reward.",
        rewardItems: rewardItems,
    };
});

// --- Tool for Starting a Quest ---
export const startQuestTool = ai.defineTool({
    name: 'startQuest',
    description: "Starts a new quest for the player. Call this ONLY when an NPC gives the player a new quest during a conversation.",
    inputSchema: z.object({
        questText: z.string().describe("The full text of the new quest to be given to the player."),
    }),
    outputSchema: z.object({
        questStarted: z.string().describe("The quest text that was successfully started."),
    }),
}, async ({ questText }) => {
    // This tool is mainly a signal for the flow to add the quest to the player's state.
    return {
        questStarted: questText,
    };
});
