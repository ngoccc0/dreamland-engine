import { TranslatableString } from '../types/i18n';
import { PlayerItem } from '../types/items';

/**
 * Manages a character's inventory, including adding, removing, and checking for items,
 * while also considering weight limits.
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
