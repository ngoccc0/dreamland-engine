import { TranslatableString } from '../types/i18n';
import { PlayerItem } from '../types/items';

export class Inventory {
    private _items: Map<string, PlayerItem>;
    private readonly _maxWeight: number;

    constructor(maxWeight: number = 100) {
        this._items = new Map();
        this._maxWeight = maxWeight;
    }

    get items(): PlayerItem[] {
        return Array.from(this._items.values());
    }

    get currentWeight(): number {
        return this.items.reduce((total, item) => 
            total + (item.weight || 0) * item.quantity, 0);
    }

    get availableSpace(): number {
        return this._maxWeight - this.currentWeight;
    }

    addItem(item: PlayerItem): boolean {
        const existingItem = this._items.get(this.getItemKey(item.name));
        if (existingItem) {
            existingItem.quantity += item.quantity;
            return true;
        }

        const newWeight = this.currentWeight + (item.weight || 0) * item.quantity;
        if (newWeight > this._maxWeight) {
            return false;
        }

        this._items.set(this.getItemKey(item.name), item);
        return true;
    }

    removeItem(itemName: TranslatableString, quantity: number = 1): boolean {
        const existingItem = this._items.get(this.getItemKey(itemName));
        if (!existingItem || existingItem.quantity < quantity) {
            return false;
        }

        existingItem.quantity -= quantity;
        if (existingItem.quantity <= 0) {
            this._items.delete(this.getItemKey(itemName));
        }
        return true;
    }

    hasItem(itemName: TranslatableString, quantity: number = 1): boolean {
        const item = this._items.get(this.getItemKey(itemName));
        return !!item && item.quantity >= quantity;
    }

    private getItemKey(name: TranslatableString): string {
        return typeof name === 'string' ? name : JSON.stringify(name);
    }
}
