import { z } from 'zod';

/**
 * Item Domain Type - Represents any inventory item
 *
 * Items track quantity, durability, active effects, and equipped state.
 * This is the MINIMAL core domain model; specific item properties
 * (like weapon damage) come from the item definitions in core/data/items/.
 */

/**
 * Side Effect applied by an item
 *
 * @example
 * ```typescript
 * {
 *   type: 'DAMAGE_BOOST',
 *   amount: 5,
 *   duration: 10  // turns
 * }
 * ```
 */
export const ItemEffectSchema = z.object({
    type: z.string().describe('Effect type ID'),
    amount: z.number().describe('Effect magnitude (damage, heal, etc.)'),
    duration: z.number().int().optional().describe('Duration in turns (undefined = permanent)'),
});

export type ItemEffect = z.infer<typeof ItemEffectSchema>;

/**
 * Core Item in Player Inventory
 *
 * Links to item definition by ID, tracks stack quantity and durability.
 */
export const ItemSchema = z.object({
    id: z.string().describe('Item definition ID (reference to core/data/items/)'),
    quantity: z.number().int().positive().describe('Stack count (1 = single item)'),
    equipped: z.boolean().default(false).describe('Currently equipped by player?'),
    durability: z.number().min(0).optional().describe('Current durability (tools/weapons only)'),
    effects: z.array(ItemEffectSchema).default([]).describe('Active effects from this item'),
    metadata: z.record(z.unknown()).default({}).describe('Custom metadata (enchantments, etc.)'),
});

export type Item = z.infer<typeof ItemSchema>;

/**
 * Create a new item with defaults
 *
 * @param id - Item definition ID
 * @param quantity - Stack count (default 1)
 * @returns New Item instance
 */
export function createItem(id: string, quantity: number = 1): Item {
    return {
        id,
        quantity,
        equipped: false,
        effects: [],
        metadata: {},
    };
}

/**
 * Add an effect to item (for potions, buffs, etc.)
 *
 * @param item - Item to modify
 * @param effect - Effect to add
 * @returns New Item with effect added
 */
export function addEffect(item: Item, effect: ItemEffect): Item {
    return {
        ...item,
        effects: [...item.effects, effect],
    };
}

/**
 * Remove effect by type
 *
 * @param item - Item to modify
 * @param effectType - Effect type to remove
 * @returns New Item with effect removed
 */
export function removeEffect(item: Item, effectType: string): Item {
    return {
        ...item,
        effects: item.effects.filter((e) => e.type !== effectType),
    };
}

/**
 * Damage item durability
 *
 * @param item - Item to damage
 * @param damage - Durability loss amount
 * @returns New Item with reduced durability
 */
export function damageDurability(item: Item, damage: number): Item {
    if (item.durability === undefined) return item;

    return {
        ...item,
        durability: Math.max(0, item.durability - damage),
    };
}

/**
 * Check if item is broken (0 durability)
 */
export function isBroken(item: Item): boolean {
    return item.durability !== undefined && item.durability <= 0;
}
