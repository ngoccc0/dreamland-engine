// ai/tools/game-actions.ts
'use server';
/**
 * @fileOverview Định nghĩa các công cụ (tools) game logic phía server cho Genkit.
 *
 * File này chứa các hàm logic thuần túy của game, được định nghĩa dưới dạng Genkit tools.
 * Những tools này sẽ được mô hình AI (LLM) gọi để thực hiện các hành động cụ thể trong game
 * như tấn công, nhặt đồ, sử dụng vật phẩm, thuần hóa kẻ thù, sử dụng kỹ năng, hoặc quản lý nhiệm vụ.
 *
 * Mục đích chính là tách biệt logic game deterministic (có thể dự đoán được) khỏi
 * khả năng sáng tạo của AI, đảm bảo các quy tắc game được tuân thủ.
 *
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PlayerStatusSchema, EnemySchema, PlayerItemSchema, ChunkItemSchema, ItemDefinitionSchema, PetSchema, SkillSchema, allTerrains, TranslatableStringSchema } from '@/ai/schemas';
import type { PlayerItem, PlayerStatus, Pet, ChunkItem, Skill, Structure, TranslatableString, Terrain } from '@/lib/game/types';
import { getTemplates } from '@/lib/game/templates';
import { buildableStructures } from '@/lib/game/structures';


/**
 * Helper function to get a random integer within a specified range.
 * @param range - An object with min and max properties.
 * @returns A random integer between min and max (inclusive).
 */
const getRandomInRange = (range: { min: number, max: number }) => Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

/**
 * Helper function to get the string value from a TranslatableString based on language, or a default.
 * @param translatable - The TranslatableString object. Can be a simple string too.
 * @param language - The desired language ('en' or 'vi').
 * @returns The translated string, or 'unknown' if not found.
 */
function getTranslatableStringValue(translatable: TranslatableString | string | undefined, language: 'en' | 'vi'): string {
    if (translatable === undefined) {
        return 'unknown';
    }
    if (typeof translatable === 'string') {
        return translatable;
    }
    return translatable[language] || translatable.en || translatable.vi || 'unknown';
}

/**
 * Helper function to ensure a value is of type TranslatableString.
 * If the value is a string, it converts it into a TranslatableString object.
 * If it's already a TranslatableString, it returns it as is.
 * @param value - The string or TranslatableString to convert.
 * @returns The value as a TranslatableString.
 */
function ensureTranslatableString(value: string | TranslatableString): TranslatableString {
    if (typeof value === 'string') {
        return { en: value, vi: value }; // Default to both languages if it's just a string
    }
    return value;
}

// --- PlayerAttack Tool Schemas ---

/**
 * @description Schema định nghĩa đầu vào cho công cụ `playerAttackTool`.
 * @property {PlayerStatusSchema} playerStatus - Trạng thái hiện tại của người chơi.
 * @property {EnemySchema} enemy - Thông tin chi tiết về kẻ thù đang bị tấn công.
 * @property {z.enum} terrain - Loại địa hình hiện tại (ảnh hưởng đến chiến đấu).
 * @property {z.record} customItemDefinitions - Map chứa tất cả định nghĩa vật phẩm tùy chỉnh (AI-generated và static).
 * @property {z.number} [lightLevel] - Mức độ ánh sáng hiện tại (-10 đến 10). Ánh sáng thấp có thể giảm độ chính xác.
 * @property {z.number} [moisture] - Mức độ ẩm hiện tại (0-10). Độ ẩm cao có thể cản trở các cuộc tấn công vật lý.
 * @property {z.enum} successLevel - Kết quả phân loại của một lần tung xúc xẻ d20, quyết định kết quả tấn công.
 */
export const PlayerAttackInputSchema = z.object({
    playerStatus: PlayerStatusSchema,
    enemy: EnemySchema,
    terrain: z.enum(allTerrains),
    customItemDefinitions: z.record(ItemDefinitionSchema).describe("A map of ALL item definitions (static and custom) for the current game session."),
    lightLevel: z.number().optional().describe("The current light level (-10 to 10). Low light (e.g., < -3) can reduce accuracy."),
    moisture: z.number().optional().describe("The current moisture level (0-10). High moisture (e.g., > 8) can impede physical attacks."),
    successLevel: z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']).describe("The categorized result of a d20 dice roll, which dictates the attack's outcome."),
});

/**
 * @description Schema định nghĩa đầu ra cho công cụ `playerAttackTool`.
 * @property {z.number} playerDamageDealt - Sát thương người chơi gây ra.
 * @property {z.number} enemyDamageDealt - Sát thương kẻ thù gây ra. Có thể là 0 nếu kẻ thù bỏ chạy.
 * @property {z.number} finalPlayerHp - Máu của người chơi sau khi trao đổi.
 * @property {z.number} finalEnemyHp - Máu của kẻ thù sau khi bị tấn công.
 * @property {z.boolean} enemyDefeated - `true` nếu máu của kẻ thù <= 0.
 * @property {z.boolean} fled - `true` nếu kẻ thù bỏ chạy thay vì chiến đấu.
 * @property {z.string} [combatLog] - Nhật ký chiến đấu ngắn gọn, thực tế.
 * @property {z.array} [lootDrops] - Danh sách các vật phẩm kẻ thù rơi ra nếu bị đánh bại.
 */
export const PlayerAttackOutputSchema = z.object({
    playerDamageDealt: z.number().describe("Damage dealt by the player."),
    enemyDamageDealt: z.number().describe("Damage dealt by the enemy. Can be 0 if it fled."),
    finalPlayerHp: z.number().describe("Player's HP after the exchange."),
    finalEnemyHp: z.number().describe("Enemy's HP after being attacked."),
    enemyDefeated: z.boolean().describe("True if the enemy's HP is 0 or less."),
    fled: z.boolean().describe("True if the enemy fled instead of fighting back."),
    combatLog: z.string().optional().describe("A brief, factual log of what happened, e.g., 'Player dealt 15 damage. The creature fought back fiercely.' or 'The small creature fled in terror!'"),
    lootDrops: z.array(ChunkItemSchema).optional().describe("A list of items dropped by the defeated enemy. The narrative should mention these items."),
});

/**
 * @description Công cụ để tính toán kết quả của người chơi tấn công một kẻ thù trong một vòng chiến đấu.
 * AI nên gọi công cụ này khi hành động của người chơi là một cuộc tấn công.
 * @param {object} input - Dữ liệu đầu vào theo `PlayerAttackInputSchema`.
 * @returns {Promise<object>} - Kết quả chiến đấu theo `PlayerAttackOutputSchema`.
 */
export const playerAttackTool = ai.defineTool({
    name: 'playerAttack',
    description: 'Calculates the result of a player attacking an enemy in a single combat round. Call this when the player action is an attack.',
    inputSchema: PlayerAttackInputSchema,
    outputSchema: PlayerAttackOutputSchema
}, async ({ playerStatus, enemy, terrain, customItemDefinitions, lightLevel, moisture, successLevel }) => {
    let playerDamage = 0;
    const combatLogParts: string[] = [];
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
    
    if (enemyDefeated) {
        // Fix: Explicitly type templates and access it correctly
        const templates = getTemplates(playerStatus.language || 'en');
        const terrainKey = terrain as Terrain; // Assert terrain type
        const enemyTemplate = (templates[terrainKey] as { enemies: { data: { type: TranslatableString, loot?: any[] } }[] })?.enemies.find((e: any) => 
            getTranslatableStringValue(e.data.type, playerStatus.language || 'en') === getTranslatableStringValue(enemy.type, playerStatus.language || 'en')
        );

        if (enemyTemplate && enemyTemplate.data.loot) {
            const allItemDefinitions = customItemDefinitions;
            const drops: ChunkItem[] = [];

            for (const lootItem of enemyTemplate.data.loot) {
                if (Math.random() < lootItem.chance) {
                    const itemName = getTranslatableStringValue(lootItem.name, playerStatus.language || 'en');
                    const definition = allItemDefinitions[itemName];
                    if (definition) {
                        const quantity = getRandomInRange(lootItem.quantity);
                        drops.push({
                            name: ensureTranslatableString(lootItem.name), // FIX: Ensure name is TranslatableString
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
                    combatLogParts.push(`Enemy dropped ${drops.map(d => `${d.quantity} ${getTranslatableStringValue(d.name, playerStatus.language || 'en')}`).join(', ')}.`);
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

// --- TakeItem Tool Schemas ---

/**
 * @description Schema định nghĩa đầu vào cho công cụ `takeItemTool`.
 * @property {ChunkItemSchema} itemToTake - Vật phẩm cụ thể được lấy từ chunk.
 * @property {z.array} currentChunkItems - Danh sách đầy đủ các vật phẩm hiện có trong chunk.
 * @property {z.array} playerInventory - Túi đồ hiện tại của người chơi.
 */
export const TakeItemInputSchema = z.object({
    itemToTake: ChunkItemSchema.describe("The specific item being taken from the chunk."),
    currentChunkItems: z.array(ChunkItemSchema).describe("The complete list of items currently in the chunk."),
    playerInventory: z.array(PlayerItemSchema).describe("The player's current inventory."),
});

/**
 * @description Schema định nghĩa đầu ra cho công cụ `takeItemTool`.
 * @property {z.array} updatedPlayerInventory - Túi đồ của người chơi sau khi hành động.
 * @property {z.array} updatedChunkItems - Các vật phẩm còn lại trong chunk sau khi hành động.
 */
export const TakeItemOutputSchema = z.object({
    updatedPlayerInventory: z.array(PlayerItemSchema),
    updatedChunkItems: z.array(ChunkItemSchema),
});

/**
 * @description Công cụ để di chuyển toàn bộ một stack vật phẩm từ thế giới game vào túi đồ của người chơi.
 * AI nên gọi công cụ này khi hành động của người chơi là nhặt hoặc lấy vật phẩm.
 * @param {object} input - Dữ liệu đầu vào theo `TakeItemInputSchema`.
 * @returns {Promise<object>} - Kết quả cập nhật túi đồ và chunk theo `TakeItemOutputSchema`.
 */
export const takeItemTool = ai.defineTool({
    name: 'takeItem',
    description: "Moves an entire stack of items from the game world into the player's inventory. Call this when the player action is to pick up or take an item.",
    inputSchema: TakeItemInputSchema,
    outputSchema: TakeItemOutputSchema
}, async ({ itemToTake, currentChunkItems, playerInventory }) => {
    const updatedChunkItems = currentChunkItems.filter(i => getTranslatableStringValue(i.name, 'en') !== getTranslatableStringValue(itemToTake.name, 'en')); // Use 'en' for filtering consistency if internal
    const updatedPlayerInventory = [...playerInventory];
    
    // Fix: Use getTranslatableStringValue for comparison
    const existingItem = updatedPlayerInventory.find(i => getTranslatableStringValue(i.name, 'en') === getTranslatableStringValue(itemToTake.name, 'en'));
    
    if (existingItem) {
        existingItem.quantity += itemToTake.quantity;
    } else {
        updatedPlayerInventory.push({ 
            name: ensureTranslatableString(itemToTake.name), // FIX: Ensure name is TranslatableString
            quantity: itemToTake.quantity, 
            tier: itemToTake.tier,
            emoji: itemToTake.emoji,
        });
    }

    return { updatedPlayerInventory, updatedChunkItems };
});

// --- UseItem Tool Schemas ---

/**
 * @description Schema định nghĩa đầu vào cho công cụ `useItemTool`.
 * @property {z.string} itemName - Tên của vật phẩm cần sử dụng từ túi đồ.
 * @property {PlayerStatusSchema} playerStatus - Trạng thái hiện tại của người chơi.
 * @property {z.record} customItemDefinitions - Map chứa tất cả định nghĩa vật phẩm tùy chỉnh (AI-generated và static).
 */
export const UseItemInputSchema = z.object({
    itemName: z.string().describe("The name of the item to use from the inventory."),
    playerStatus: PlayerStatusSchema,
    customItemDefinitions: z.record(ItemDefinitionSchema).describe("A map of ALL item definitions (static and custom) for the current game session."),
});

/**
 * @description Schema định nghĩa đầu ra cho công cụ `useItemTool`.
 * @property {PlayerStatusSchema} updatedPlayerStatus - Trạng thái người chơi sau khi vật phẩm được sử dụng.
 * @property {z.boolean} wasUsed - `true` nếu vật phẩm được tìm thấy và sử dụng thành công.
 * @property {z.string} effectDescription - Mô tả thực tế về tác dụng của vật phẩm.
 */
export const UseItemOutputSchema = z.object({
    updatedPlayerStatus: PlayerStatusSchema,
    wasUsed: z.boolean().describe("Whether the item was successfully found and used."),
    effectDescription: z.string().describe("A simple, factual description of what the item did, e.g., 'Healed for 25 HP. Restored 10 Stamina.'"),
});

/**
 * @description Công cụ để sử dụng một vật phẩm từ túi đồ của người chơi, áp dụng hiệu ứng của nó và giảm số lượng.
 * AI nên gọi công cụ này khi hành động của người chơi là sử dụng một vật phẩm TRÊN BẢN THÂN (ví dụ: 'ăn quả mọng', 'uống thuốc').
 * @param {object} input - Dữ liệu đầu vào theo `UseItemInputSchema`.
 * @returns {Promise<object>} - Kết quả cập nhật trạng thái người chơi theo `UseItemOutputSchema`.
 */
export const useItemTool = ai.defineTool({
    name: 'useItem',
    description: "Uses one item from the player's inventory, applying its effect and decrementing its quantity. Call this when the player action is to use an item ON THEMSELVES (e.g. 'eat berry', 'drink potion').",
    inputSchema: UseItemInputSchema,
    outputSchema: UseItemOutputSchema
}, async ({ itemName, playerStatus, customItemDefinitions }) => {
    const newStatus: PlayerStatus = JSON.parse(JSON.stringify(playerStatus)); // Deep copy
    // Fix: Use getTranslatableStringValue for comparison
    const itemIndex = newStatus.items.findIndex((i: PlayerItem) => getTranslatableStringValue(i.name, playerStatus.language || 'en').toLowerCase() === itemName.toLowerCase());

    if (itemIndex === -1) {
        return { updatedPlayerStatus: playerStatus, wasUsed: false, effectDescription: 'Item not found.' };
    }

    // Fix: Use getTranslatableStringValue for accessing customItemDefinitions
    const itemDef = customItemDefinitions[getTranslatableStringValue(newStatus.items[itemIndex].name, playerStatus.language || 'en')];
    
    if (!itemDef) {
        return { updatedPlayerStatus: playerStatus, wasUsed: false, effectDescription: 'Item has no defined effect.' };
    }
    
    const effectDescriptions: string[] = [];
    // Fix: Explicitly type 'effect'
    itemDef.effects.forEach((effect: typeof ItemDefinitionSchema._type['effects'][number]) => {
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

// --- TameEnemy Tool Schemas ---

/**
 * @description Schema định nghĩa đầu vào cho công cụ `tameEnemyTool`.
 * @property {z.string} itemName - Tên vật phẩm thức ăn dùng để thuần hóa.
 * @property {PlayerStatusSchema} playerStatus - Trạng thái hiện tại của người chơi.
 * @property {EnemySchema} enemy - Kẻ thù đang cố gắng thuần hóa.
 */
export const TameEnemyInputSchema = z.object({
    itemName: z.string().describe("The name of the food item to use for taming."),
    playerStatus: PlayerStatusSchema,
    enemy: EnemySchema,
});

/**
 * @description Schema định nghĩa đầu ra cho công cụ `tameEnemyTool`.
 * @property {z.boolean} wasTamed - `true` nếu nỗ lực thuần hóa thành công.
 * @property {z.boolean} itemConsumed - `true` nếu sinh vật đã ăn vật phẩm.
 * @property {PlayerStatusSchema} updatedPlayerStatus - Trạng thái người chơi sau khi vật phẩm được tiêu thụ.
 * @property {EnemySchema} updatedEnemy - Trạng thái mới của kẻ thù, hoặc `null` nếu đã được thuần hóa.
 * @property {PetSchema} newPet - Dữ liệu pet mới, nếu thuần hóa thành công.
 * @property {z.string} log - Nhật ký thực tế về những gì đã xảy ra.
 */
export const TameEnemyOutputSchema = z.object({
    wasTamed: z.boolean().describe("Whether the taming attempt succeeded."),
    itemConsumed: z.boolean().describe("Whether the creature ate the item."),
    updatedPlayerStatus: PlayerStatusSchema.describe("The player's status after consuming the item from inventory."),
    updatedEnemy: EnemySchema.nullable().describe("The enemy's new state, or null if tamed."),
    newPet: PetSchema.nullable().describe("The new pet data, if taming was successful."),
    log: z.string().describe("A factual log of what happened, e.g., 'The wolf ate the Raw Wolf Meat. Taming failed.'"),
});

/**
 * @description Công cụ để cố gắng thuần hóa một kẻ thù bằng cách cho nó một vật phẩm thức ăn từ túi đồ của người chơi.
 * AI nên gọi công cụ này khi hành động của người chơi là sử dụng một vật phẩm lên một sinh vật (ví dụ: 'cho thịt sói').
 * @param {object} input - Dữ liệu đầu vào theo `TameEnemyInputSchema`.
 * @returns {Promise<object>} - Kết quả thuần hóa theo `TameEnemyOutputSchema`.
 */
export const tameEnemyTool = ai.defineTool({
    name: 'tameEnemy',
    description: "Attempts to tame an enemy by giving it a food item from the player's inventory. Call this when the player's action is to use an item on a creature (e.g. 'give meat to wolf').",
    inputSchema: TameEnemyInputSchema,
    outputSchema: TameEnemyOutputSchema
}, async ({ itemName, playerStatus, enemy }) => {
    const newStatus: PlayerStatus = JSON.parse(JSON.stringify(playerStatus)); // Deep copy
    // Fix: Use getTranslatableStringValue for comparison
    const itemIndex = newStatus.items.findIndex(i => getTranslatableStringValue(i.name, playerStatus.language || 'en').toLowerCase() === itemName.toLowerCase());

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

    // Fix: Check if enemy.diet exists before calling includes, and handle TranslatableString for enemy.type
    if (!enemy.diet || !enemy.diet.includes(itemName)) {
        return {
            wasTamed: false,
            itemConsumed: false,
            updatedPlayerStatus: playerStatus,
            updatedEnemy: enemy,
            newPet: null,
            log: `The ${getTranslatableStringValue(enemy.type, playerStatus.language || 'en')} is not interested in the ${itemName}.`
        };
    }
    
    newStatus.items[itemIndex].quantity -= 1;
    if (newStatus.items[itemIndex].quantity <= 0) {
        newStatus.items.splice(itemIndex, 1);
    }
    
    const newEnemyState = { ...enemy };
    // Fix: Provide default values for satiation and maxSatiation if they are undefined
    newEnemyState.satiation = Math.min((newEnemyState.satiation ?? 0) + 1, (newEnemyState.maxSatiation ?? 1));

    const baseTameChance = 0.1; 
    const satiationBonus = ((newEnemyState.satiation ?? 0) / (newEnemyState.maxSatiation ?? 1)) * 0.4; 
    const healthPenalty = (newEnemyState.hp / 100) * 0.2; 
    const tamingChance = baseTameChance + satiationBonus - healthPenalty;

    if (Math.random() < tamingChance) {
        const newPet: Pet = {
            // FIX: Use ensureTranslatableString to correctly assign enemy.type with type assertion
            type: ensureTranslatableString(enemy.type as TranslatableString), 
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
            updatedEnemy: null, 
            newPet: newPet,
            log: `The ${getTranslatableStringValue(enemy.type, playerStatus.language || 'en')} ate the ${itemName}. Taming was successful!`
        };
    } else {
        return {
            wasTamed: false,
            itemConsumed: true,
            updatedPlayerStatus: newStatus,
            updatedEnemy: newEnemyState,
            newPet: null,
            log: `The ${getTranslatableStringValue(enemy.type, playerStatus.language || 'en')} ate the ${itemName}, but remains wild.`
        };
    }
});

// --- UseSkill Tool Schemas ---

/**
 * @description Schema định nghĩa đầu vào cho công cụ `useSkillTool`.
 * @property {z.string} skillName - Tên kỹ năng cần sử dụng từ danh sách kỹ năng của người chơi.
 * @property {PlayerStatusSchema} playerStatus - Trạng thái hiện tại của người chơi.
 * @property {EnemySchema} [enemy] - Kẻ thù, nếu kỹ năng nhắm mục tiêu.
 * @property {z.enum} successLevel - Kết quả phân loại của một lần tung xúc xắc d20, quyết định kết quả kỹ năng.
 */
export const UseSkillInputSchema = z.object({
    skillName: z.string().describe("The name of the skill to use from the player's skill list."),
    playerStatus: PlayerStatusSchema,
    enemy: EnemySchema.nullable().optional().describe("The enemy, if the skill targets one."),
    successLevel: z.enum(['CriticalFailure', 'Failure', 'Success', 'GreatSuccess', 'CriticalSuccess']).describe("The categorized result of a d20 dice roll, which dictates the skill's outcome."),
});

/**
 * @description Schema định nghĩa đầu ra cho công cụ `useSkillTool`.
 * @property {PlayerStatusSchema} updatedPlayerStatus - Trạng thái người chơi sau khi kỹ năng được sử dụng.
 * @property {EnemySchema} [updatedEnemy] - Trạng thái mới của kẻ thù, hoặc `null` nếu bị đánh bại.
 * @property {z.string} log - Nhật ký thực tế về những gì đã xảy ra (ví dụ: 'Người chơi hết mana.', 'Hồi máu 25 HP.'). Nhật ký này nên được AI dùng để kể chuyện.
 */
export const UseSkillOutputSchema = z.object({
    updatedPlayerStatus: PlayerStatusSchema.describe("The player's status after the skill is used."),
    updatedEnemy: EnemySchema.nullable().optional().describe("The enemy's new state, or null if defeated."),
    log: z.string().describe("A factual log of what happened, e.g., 'Player is out of mana.', 'Healed for 25 HP.', 'The skill fizzles!'. This log should be narrated by the AI."),
});

/**
 * @description Công cụ để sử dụng một trong các kỹ năng đã biết của người chơi, xem xét mức độ thành công của lần tung d20.
 * AI nên gọi công cụ này khi hành động của người chơi là sử dụng một kỹ năng (ví dụ: 'sử dụng Hồi máu', 'thi triển Cầu Lửa').
 * @param {object} input - Dữ liệu đầu vào theo `UseSkillInputSchema`.
 * @returns {Promise<object>} - Kết quả sử dụng kỹ năng theo `UseSkillOutputSchema`.
 */
export const useSkillTool = ai.defineTool({
    name: 'useSkill',
    description: "Uses one of the player's known skills, considering the d20 roll's success level. Call this when the player's action is to use a skill (e.g., 'use Heal', 'cast Fireball').",
    inputSchema: UseSkillInputSchema,
    outputSchema: UseSkillOutputSchema
}, async ({ skillName, playerStatus, enemy, successLevel }) => {
    const newPlayerStatus: PlayerStatus = JSON.parse(JSON.stringify(playerStatus));
    let newEnemy: typeof enemy | null = enemy ? JSON.parse(JSON.stringify(enemy)) : null;

    // Fix: Use getTranslatableStringValue for comparison
    const skillToUse = newPlayerStatus.skills.find(s => getTranslatableStringValue(s.name, playerStatus.language || 'en').toLowerCase() === skillName.toLowerCase());

    if (!skillToUse) {
        return { updatedPlayerStatus: playerStatus, updatedEnemy: enemy, log: `Player does not know the skill: ${skillName}.` };
    }

    if (newPlayerStatus.mana < skillToUse.manaCost) {
        // FIX: Add type assertion for skillToUse.name to resolve potential TypeScript inference issues.
        return { updatedPlayerStatus: playerStatus, updatedEnemy: enemy, log: `Not enough mana to use ${getTranslatableStringValue(skillToUse.name as TranslatableString, playerStatus.language || 'en')}.` };
    }

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
            // FIX: Add type assertion for skillToUse.name.
            log = `The magic fizzles! Your attempt to cast ${getTranslatableStringValue(skillToUse.name as TranslatableString, playerStatus.language || 'en')} fails.`;
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

    switch (skillToUse.effect.type) {
        case 'HEAL':
            if (skillToUse.effect.target === 'SELF') {
                const healAmount = Math.round(skillToUse.effect.amount * effectMultiplier);
                const oldHp = newPlayerStatus.hp;
                newPlayerStatus.hp = Math.min(100, newPlayerStatus.hp + healAmount);
                const healedAmount = newPlayerStatus.hp - oldHp;
                // FIX: Add type assertion for skillToUse.name.
                log = `Used ${getTranslatableStringValue(skillToUse.name as TranslatableString, playerStatus.language || 'en')}, healing for ${healedAmount} HP.`;
                if (successLevel === 'GreatSuccess') log += ' A powerful surge of energy makes you feel much more refreshed.';
                if (successLevel === 'CriticalSuccess') log += ' A divine energy surrounds you, miraculously healing your wounds!';
            }
            break;
        case 'DAMAGE':
            if (skillToUse.effect.target === 'ENEMY') {
                if (!newEnemy) {
                    // FIX: Add type assertion for skillToUse.name.
                    log = `Used ${getTranslatableStringValue(skillToUse.name as TranslatableString, playerStatus.language || 'en')}, but there was no target.`;
                } else {
                    const baseDamage = skillToUse.effect.amount + Math.round(newPlayerStatus.attributes.magicalAttack * 0.5);
                    const finalDamage = Math.round(baseDamage * effectMultiplier);

                    newEnemy.hp = Math.max(0, newEnemy.hp - finalDamage);
                    // FIX: Add type assertion for skillToUse.name.
                    log = `Used ${getTranslatableStringValue(skillToUse.name as TranslatableString, playerStatus.language || 'en')}, dealing ${finalDamage} magic damage to the ${getTranslatableStringValue(newEnemy.type, playerStatus.language || 'en')}.`;
                        if (successLevel === 'GreatSuccess') log += ' The fireball flies faster and more accurately, dealing extra damage.';
                    // FIX: Add type assertion for skillToUse.name.
                    if (successLevel === 'CriticalSuccess') log = `A magical CRITICAL HIT! Your ${getTranslatableStringValue(skillToUse.name as TranslatableString, playerStatus.language || 'en')} explodes violently, dealing a devastating ${finalDamage} damage to the ${getTranslatableStringValue(newEnemy.type, playerStatus.language || 'en')}.`;

                    if (skillToUse.effect.healRatio) {
                        const healedAmount = Math.round(finalDamage * skillToUse.effect.healRatio);
                        const oldHp = newPlayerStatus.hp;
                        newPlayerStatus.hp = Math.min(100, newPlayerStatus.hp + healedAmount);
                        if (newPlayerStatus.hp > oldHp) {
                            log += ` You siphon ${newPlayerStatus.hp - oldHp} health from the hit.`
                        }
                    }

                    if (newEnemy.hp <= 0) {
                        log += ` The ${getTranslatableStringValue(newEnemy.type, playerStatus.language || 'en')} has been vanquished!`;
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

// --- CompleteQuest Tool Schemas ---

/**
 * @description Schema định nghĩa đầu vào cho công cụ `completeQuestTool`.
 * @property {z.string} questText - Văn bản chính xác của nhiệm vụ đang được hoàn thành.
 * @property {PlayerStatusSchema} playerStatus - Trạng thái hiện tại của người chơi, để tham chiếu.
 */
export const CompleteQuestInputSchema = z.object({
    questText: z.string().describe("The exact text of the quest being completed."),
    playerStatus: PlayerStatusSchema.describe("The player's current status, for context."),
});

/**
 * @description Schema định nghĩa đầu ra cho công cụ `completeQuestTool`.
 * @property {z.boolean} isCompleted - Luôn trả về `true` để xác nhận hoàn thành nhiệm vụ.
 * @property {z.string} rewardDescription - Văn bản mô tả phần thưởng, ví dụ: 'Người thợ săn cảm ơn bạn và tặng bạn một nắm thảo mộc quý hiếm.'
 * @property {z.array} [rewardItems] - Mảng các vật phẩm sẽ được trao cho người chơi như một phần thưởng.
 */
export const CompleteQuestOutputSchema = z.object({
    isCompleted: z.boolean().describe("Always returns true to confirm completion."),
    rewardDescription: z.string().describe("A short, flavorful text describing the reward given, e.g., 'The hunter thanks you and gives you a handful of rare herbs.'"),
    rewardItems: z.array(PlayerItemSchema).optional().describe("An array of items to be given to the player as a reward."),
});

/**
 * @description Công cụ để xác nhận một nhiệm vụ đã hoàn thành và xác định phần thưởng phù hợp.
 * AI chỉ nên gọi công cụ này KHI hành động của người chơi trực tiếp hoàn thành mục tiêu nhiệm vụ.
 * @param {object} input - Dữ liệu đầu vào theo `CompleteQuestInputSchema`.
 * @returns {Promise<object>} - Kết quả hoàn thành nhiệm vụ và phần thưởng theo `CompleteQuestOutputSchema`.
 */
export const completeQuestTool = ai.defineTool({
    name: 'completeQuest',
    description: "Confirms a quest is completed and determines a suitable reward. Call this ONLY when the player's action directly fulfills a quest's objective.",
    inputSchema: CompleteQuestInputSchema,
    outputSchema: CompleteQuestOutputSchema
}, async ({ questText, playerStatus }) => {
    const possibleRewards: PlayerItem[] = [
        { name: {en: 'Minor Healing Potion', vi: 'Thuốc Máu Yếu'}, quantity: 2, tier: 1, emoji: '🧪' },
        { name: {en: 'Sharpening Stone', vi: 'Đá Mài'}, quantity: 1, tier: 2, emoji: '🔪' },
        { name: {en: 'Bone Powder', vi: 'Bột Xương'}, quantity: 3, tier: 2, emoji: '💀' },
        { name: {en: 'Magic Dust', vi: 'Cát Ma Thuật'}, quantity: 1, tier: 4, emoji: '✨'},
    ];
    
    const rewardItems: PlayerItem[] = [];
    const numberOfRewards = getRandomInRange({ min: 1, max: 2 });

    for (let i = 0; i < numberOfRewards; i++) {
        const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        const existing = rewardItems.find(r => getTranslatableStringValue(r.name, playerStatus.language || 'en') === getTranslatableStringValue(reward.name, playerStatus.language || 'en'));
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

// --- StartQuest Tool Schemas ---

/**
 * @description Schema định nghĩa đầu vào cho công cụ `startQuestTool`.
 * @property {z.string} questText - Văn bản đầy đủ của nhiệm vụ mới sẽ được giao cho người chơi.
 */
export const StartQuestInputSchema = z.object({
    questText: z.string().describe("The full text of the new quest to be given to the player."),
});

/**
 * @description Schema định nghĩa đầu ra cho công cụ `startQuestTool`.
 * @property {z.string} questStarted - Văn bản nhiệm vụ đã được bắt đầu thành công.
 */
export const StartQuestOutputSchema = z.object({
    questStarted: z.string().describe("The quest text that was successfully started."),
});

/**
 * @description Công cụ để bắt đầu một nhiệm vụ mới cho người chơi.
 * AI chỉ nên gọi công cụ này KHI một NPC giao cho người chơi một nhiệm vụ mới trong cuộc trò chuyện.
 * @param {object} input - Dữ liệu đầu vào theo `StartQuestInputSchema`.
 * @returns {Promise<object>} - Kết quả bắt đầu nhiệm vụ theo `StartQuestOutputSchema`.
 */
export const startQuestTool = ai.defineTool({
    name: 'startQuest',
    description: "Starts a new quest for the player. Call this ONLY when an NPC gives the player a new quest during a conversation.",
    inputSchema: StartQuestInputSchema,
    outputSchema: StartQuestOutputSchema
}, async ({ questText }) => {
    return {
        questStarted: questText,
    };
});