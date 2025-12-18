/**
 * Cooking Inventory Panel Component
 *
 * @remarks
 * Left pane (desktop) / Inventory tab (mobile) displaying filtered inventory
 * items available for cooking. Implements pre-flight validation to prevent
 * animations for full slots, and shake animation for error feedback.
 *
 * **Key Behavior:**
 * 1. Filter inventory to Food + Material categories using useMemo
 * 2. On item click: Validate target slot is available BEFORE animation
 * 3. If slot full: Shake animation + toast error, NO flying animation
 * 4. If slot available: Emit FLYING_ITEM_START event for animation
 * 5. Display reserved slots as faded/disabled
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { renderItemEmoji } from '@/components/game/icons';
import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';
import { cn } from '@/lib/utils';

export interface CookingInventoryPanelProps {
    /**
     * Player inventory items
     */
    items: Item[];

    /**
     * Item definitions for lookup
     */
    itemDefinitions: Record<string, ItemDefinition>;

    /**
     * Currently reserved slot indices (from useOptimisticCooking)
     */
    reservedSlots: number[];

    /**
     * Is system currently animating? (soft-lock state)
     */
    isAnimating: boolean;

    /**
     * Mobile layout mode?
     */
    isMobile?: boolean;

    /**
     * Callback when item is clicked
     */
    onItemClick: (item: Item, slotIndex: number, event: React.MouseEvent) => void;
}

/**
 * Filtered inventory panel for cooking interactions
 *
 * @param props - Component props
 * @returns Rendered inventory grid
 */
export function CookingInventoryPanel({
    items,
    itemDefinitions,
    reservedSlots,
    isAnimating,
    isMobile = false,
    onItemClick,
}: CookingInventoryPanelProps) {
    /**
     * Filter inventory to Food + Material categories
     * Uses useMemo to prevent re-filtering on every render
     */
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const def = itemDefinitions[item.id];
            if (!def) return false;
            const category = (def as any).category?.toLowerCase() || '';
            return category === 'food' || category === 'material';
        });
    }, [items, itemDefinitions]);

    /**
     * Group items by ID for display (consolidate duplicates)
     */
    const groupedItems = useMemo(() => {
        const groups = new Map<string, Item>();
        filteredItems.forEach((item) => {
            groups.set(item.id, item);
        });
        return Array.from(groups.values());
    }, [filteredItems]);

    /**
     * Find first empty slot (for auto-assignment)
     * This is where the item will be placed if the click succeeds
     */
    const findFirstEmptySlot = useCallback((): number => {
        // Max 9 slots for largest cooking method (oven 3x3)
        for (let i = 0; i < 9; i++) {
            if (!reservedSlots.includes(i)) {
                return i;
            }
        }
        return -1; // All slots full
    }, [reservedSlots]);

    /**
     * Handle item click with pre-flight validation
     */
    const handleItemClick = useCallback(
        (item: Item, event: React.MouseEvent<HTMLDivElement>) => {
            // Find target slot
            const targetSlot = findFirstEmptySlot();

            // If no empty slot, don't proceed with animation
            if (targetSlot === -1) {
                // This is handled by parent (CookingWorkspace) to show toast + shake
                onItemClick(item, targetSlot, event);
                return;
            }

            // Valid slot found, proceed
            onItemClick(item, targetSlot, event);
        },
        [findFirstEmptySlot, onItemClick]
    );

    return (
        <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {isMobile ? 'Ingredients' : 'Available Ingredients'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {filteredItems.length} items available
                </p>
            </div>

            {/* Items Grid */}
            <ScrollArea className="flex-1">
                <div
                    className={cn(
                        'p-3 grid gap-2',
                        isMobile ? 'grid-cols-2' : 'grid-cols-3'
                    )}
                >
                    {groupedItems.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                            No food or materials available
                        </div>
                    ) : (
                        groupedItems.map((item) => {
                            const def = itemDefinitions[item.id];
                            let itemName = item.id;
                            if (def?.name) {
                                if (typeof def.name === 'object' && 'en' in def.name) {
                                    itemName = (def.name as any).en;
                                } else if (typeof def.name === 'string') {
                                    itemName = def.name;
                                }
                            }

                            return (
                                <div
                                    key={item.id}
                                    onClick={(e) => handleItemClick(item, e)}
                                    className={cn(
                                        'p-2 rounded border border-gray-300 dark:border-gray-600 cursor-pointer',
                                        'transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20',
                                        'flex flex-col items-center gap-1',
                                        isAnimating && 'opacity-60 cursor-not-allowed',
                                        reservedSlots.length > 0 &&
                                        'opacity-75 relative'
                                    )}
                                    title={`${itemName} (${item.quantity}x)`}
                                >
                                    {/* Item Icon */}
                                    <div className="text-3xl">
                                        {renderItemEmoji(def?.emoji || '📦')}
                                    </div>

                                    {/* Item Name & Quantity */}
                                    <div className="text-xs text-center">
                                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[60px]">
                                            {itemName}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400 font-semibold">
                                            ×{item.quantity}
                                        </div>
                                    </div>

                                    {/* Reserved Indicator */}
                                    {reservedSlots.length > 0 && (
                                        <div className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
