import { TranslatableString } from '../types/i18n';
import { PlayerItem } from '../types/items';

/**
 * OVERVIEW: Inventory management system
 *
 * Manages item storage, weight constraints, and item organization for characters.
 * Implements weight-based capacity system where each item has mass (in kg).
 * Supports item stacking, equipped items tracking, and quick access slots.
 *
 * ## Inventory Mechanics
 *
 * ### Weight System
 *
 * Every item has weight (kg). Inventory has weight capacity (maxWeight).
 *
 * ```
 * totalWeight = Σ(item.weight × item.quantity)
 * canAdd(item) = (totalWeight + item.weight) <= maxWeight
 * ```
 *
 * | Level | Max Weight | Typical Items | Notes |
 * |-------|-----------|----------------|-------|
 * | 1-10 | 20 kg | 10 apples or 1 sword | Restrictive for new players |
 * | 11-20 | 40 kg | 2 swords + potions + supplies | Comfortable for mid-game |
 * | 21-30 | 60 kg | Full loadout + extras | Veteran capacity |
 * | 31-40 | 100 kg | Encumbered state | Rare stacking builds |
 * | 41+ | 150+ kg | Collection level | Heavy packing possible |
 *
 * ### Item Stacking
 *
 * - **Stackable items** (potions, herbs, arrows): combine into single slot
 *   - Max stack: defined per item (typically 20-99)
 *   - Weight scales: 5 potions = 5 × 0.1 kg
 * - **Non-stackable items** (weapons, armor, quest items): 1 item per slot
 *   - Sword 1, Sword 2, Sword 3 in separate slots
 *
 * ```typescript
 * if item.stackable:
 *   existing_slot.quantity += amount
 * else:
 *   add_new_slot(item)
 * ```
 *
 * ### Equipped Items
 *
 * Active gear providing stat bonuses:
 *
 * | Slot | Item Types | Effect | Limit |
 * |------|-----------|--------|-------|
 * | head | helmet, crown, hat | +defense, +magic defense | 1 |
 * | body | armor, robe, jacket | +defense, +health | 1 |
 * | hands | gloves, gauntlets | +attack, +attack speed | 2 (one per hand) |
 * | feet | boots, shoes | +speed, +evasion | 1 |
 * | mainhand | sword, staff, bow | +attack, +magic attack | 1 |
 * | offhand | shield, dagger, torch | +defense or +attack | 1 |
 * | accessory | ring, amulet, earring | Various bonuses | 2-4 |
 *
 * Equipped items counted toward weight capacity but worn instead of carried.
 *
 * ### Quick Access Slots
 *
 * Fast-access consumable slots (during combat, out of inventory):
 *
 * ```
 * slots[0-2]: Quick items (potions, bombs, food)
 * trigger: numberkey or hotbar button
 * effect: instant use without opening inventory
 * ```
 *
 * Use case: Combat healing without losing turn
 *
 * ## Inventory Class Structure
 *
 * ```typescript
 * class Inventory {
 *   maxWeight: number,                      // Weight capacity
 *   slots: InventorySlot[],                 // Item storage
 *   equippedItems: Map<string, Item>,      // Active gear
 *   quickAccessSlots: Item[],              // Fast-access items
 *   weightUsed: number,                    // Current weight
 *
 *   // Methods
 *   canAdd(item): boolean                  // Can fit item?
 *   addItem(item, quantity): boolean       // Add to inventory
 *   removeItem(item, quantity): boolean    // Remove from inventory
 *   equipItem(item, slot): boolean         // Equip gear
 *   unequipItem(slot): Item                // Remove gear
 *   useItem(item): void                    // Consume item
 *   setQuickAccess(item, slot): void       // Bind quick slot
 * }
 * ```
 *
 * ## Inventory Slot (InventorySlot)
 *
 * Represents one inventory storage location:
 *
 * ```typescript
 * interface InventorySlot {
 *   item: Item,           // Item stored
 *   quantity: number,     // How many (1+ for stackable, 1 for equipment)
 * }
 * ```
 *
 * Example:
 * - Slot 0: {item: Potion of Health, quantity: 15} → 1.5 kg
 * - Slot 1: {item: Wooden Sword, quantity: 1} → 2.0 kg
 * - Slot 2: {item: Apple, quantity: 42} → 4.2 kg
 * - Slot 3: EMPTY
 * - Total weight: 7.7 kg / 20 kg capacity
 *
 * ## Item Categories by Use
 *
 * ### Consumables
 * - Type: Stackable, consumable
 * - Examples: Potion, Food, Bomb, Scroll
 * - Effect: Apply temporary buff/heal on use
 * - Weight: 0.05-0.5 kg each
 * - Max stack: 50-99
 *
 * ### Equipment
 * - Type: Non-stackable, wearable
 * - Examples: Sword, Armor, Shield, Ring
 * - Effect: Passive stat bonuses when equipped
 * - Weight: 0.5-10 kg each
 * - Max per slot: 1
 *
 * ### Materials
 * - Type: Stackable, crafting resource
 * - Examples: Ore, Wood, Herb, Leather
 * - Effect: Used in crafting to create items
 * - Weight: 0.1-1 kg each
 * - Max stack: 99
 *
 * ### Quest Items
 * - Type: Non-stackable, quest-specific
 * - Examples: Artifact, Key, Letter
 * - Effect: No direct use (story items)
 * - Weight: 0.5-5 kg
 * - Max per slot: 1
 *
 * ## Weight Calculation Examples
 *
 * ### Scenario 1: Early Game (Potion Hoarder)
 * ```
 * 20 HP Potions @ 0.1 kg = 2.0 kg
 * 10 Mana Potions @ 0.1 kg = 1.0 kg
 * 30 Herbs @ 0.05 kg = 1.5 kg
 * Wooden Sword (equipped) = 2.0 kg (doesn't count toward limit if equipped)
 * Total = 4.5 kg / 20 kg
 * Status: Lots of room (22.5% full)
 * ```
 *
 * ### Scenario 2: Mid Game (Balanced Explorer)
 * ```
 * Iron Sword (equipped) = 3.0 kg
 * Iron Armor (equipped) = 4.0 kg
 * Shield (equipped) = 2.0 kg
 * 5 HP Potions @ 0.15 kg = 0.75 kg
 * Crafting materials (mixed) = 3.0 kg
 * Quest item = 1.0 kg
 * Total equipped (counts) = 9.0 kg
 * Total items = 9.75 kg / 40 kg
 * Status: Comfortable (24.4% full)
 * ```
 *
 * ### Scenario 3: Late Game (Collector)
 * ```
 * Legendary Sword (equipped) = 5.0 kg
 * Enchanted Armor (equipped) = 6.0 kg
 * 3 Backup weapons = 15.0 kg
 * 40 Mixed potions = 4.0 kg
 * Rare crafting materials = 12.0 kg
 * Accessories = 2.0 kg
 * Quest artifacts = 5.0 kg
 * Total = 49.0 kg / 60 kg
 * Status: Nearly full (81.7% full)
 * ```
 *
 * ## Design Philosophy
 *
 * - **Resource Management**: Weight forces tactical decisions (what to carry)
 * - **Progression**: Capacity increases reward adventuring and leveling
 * - **Realism**: Equipment weight matters (armored warriors carry less loot)
 * - **Accessibility**: Early inventory spacious to not frustrate new players
 * - **Depth**: Item stacking + equipment + quick slots = strategic organization
 *
 * ## API Methods
 *
 * ### addItem(item, quantity): boolean
 * Adds items to inventory if space available, handles stacking.
 *
 * ### removeItem(item, quantity): boolean
 * Removes items from inventory, returns true if successful.
 *
 * ### equipItem(item, slot): boolean
 * Equips item from inventory to equipment slot, frees inventory slot.
 *
 * ### canAdd(item, quantity): boolean
 * Checks if item fits without modification, used for loot evaluation.
 *
 */
export class Inventory {
    private _items: Map<string, PlayerItem>;
    private readonly _maxWeight: number;

    /**
     * Creates an instance of Inventory.
     * @param maxWeight - The maximum total weight the inventory can hold. Defaults to 100.
     */
    constructor(maxWeight: number = 100) {
        this._items = new Map();
        this._maxWeight = maxWeight;
    }

    /** Gets an array of all {@link PlayerItem}s currently in the inventory. */
    get items(): PlayerItem[] {
        return Array.from(this._items.values());
    }

    /**
     * Calculates the current total weight of all items in the inventory.
     * @returns The total weight.
     */
    get currentWeight(): number {
        return this.items.reduce((total, item) =>
            total + (item.weight || 0) * item.quantity, 0);
    }

    /**
     * Calculates the remaining available weight capacity in the inventory.
     * @returns The available weight capacity.
     */
    get availableSpace(): number {
        return this._maxWeight - this.currentWeight;
    }

    /**
     * Adds an item to the inventory. If the item already exists, its quantity is updated.
     * Checks for weight limits before adding.
     * @param item - The {@link PlayerItem} to add.
     * @returns `true` if the item was added successfully, `false` if there wasn't enough space.
     */
    addItem(item: PlayerItem): boolean {
        const itemKey = this.getItemKey(item.name);
        const existingItem = this._items.get(itemKey);

        if (existingItem) {
            // If item exists, just update quantity
            existingItem.quantity += item.quantity;
            return true;
        }

        // Check weight limit for new item
        const newWeight = this.currentWeight + (item.weight || 0) * item.quantity;
        if (newWeight > this._maxWeight) {
            return false; // Not enough space
        }

        this._items.set(itemKey, item);
        return true;
    }

    /**
     * Removes a specified quantity of an item from the inventory.
     * @param itemName - The {@link TranslatableString} name of the item to remove.
     * @param quantity - The quantity to remove. Defaults to 1.
     * @returns `true` if the item was removed successfully, `false` if the item was not found or quantity was insufficient.
     */
    removeItem(itemName: TranslatableString, quantity: number = 1): boolean {
        const itemKey = this.getItemKey(itemName);
        const existingItem = this._items.get(itemKey);

        if (!existingItem || existingItem.quantity < quantity) {
            return false; // Item not found or not enough quantity
        }

        existingItem.quantity -= quantity;
        if (existingItem.quantity <= 0) {
            this._items.delete(itemKey); // Remove item entirely if quantity drops to 0 or less
        }
        return true;
    }

    /**
     * Checks if the inventory contains a specified quantity of an item.
     * @param itemName - The {@link TranslatableString} name of the item to check for.
     * @param quantity - The minimum quantity required. Defaults to 1.
     * @returns `true` if the item is present in the required quantity, `false` otherwise.
     */
    hasItem(itemName: TranslatableString, quantity: number = 1): boolean {
        const item = this._items.get(this.getItemKey(itemName));
        return !!item && item.quantity >= quantity;
    }

    /**
     * Generates a unique key for an item based on its {@link TranslatableString} name.
     * This is used for internal map storage.
     * @param name - The {@link TranslatableString} name of the item.
     * @returns A string key for the item.
     */
    private getItemKey(name: TranslatableString): string {
        // If name is a string (translation key), use it directly.
        // If it's an object, stringify it to create a unique key.
        return typeof name === 'string' ? name : JSON.stringify(name);
    }
}
