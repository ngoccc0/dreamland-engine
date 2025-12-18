/**
 * Flying Items Hook
 *
 * @remarks
 * Manages the state of items currently animating from inventory to cooking slots.
 * Coordinates with EventBus to spawn animations and receive completion events.
 *
 * **Data Model:**
 * - `flyingItems`: Array of currently animated items (each has start/end coords)
 * - `isAnimating`: Derived boolean; true if any items are flying (used for soft-lock)
 *
 * **Lifecycle:**
 * 1. Listener subscribed to EventBus `FLYING_ITEM_START` event
 * 2. Event adds item to flyingItems state
 * 3. FlyingItemsPortal renders item with Framer Motion animation
 * 4. Animation completes -> onAnimationComplete callback
 * 5. Emits EventBus `FLYING_ITEM_COMPLETE` event
 * 6. Item removed from flyingItems state
 *
 * **Hard Cap:** Maximum 5 simultaneous flying items to prevent performance issues
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { EventBus } from '@/lib/events/event-bus';

export interface FlyingItemEvent {
    id: string;
    icon: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isMobile?: boolean;
    targetSlotId?: string;
    itemId: string;
    onComplete?: () => void;
}

// Global event bus instance for flying items
const flyingItemsEventBus = new EventBus();

/**
 * Hook to manage flying item animations
 *
 * @returns Object with flying items state and control methods
 */
export function useFlyingItems() {
    const [flyingItems, setFlyingItems] = useState<FlyingItemEvent[]>([]);

    /**
     * Derived: Is system currently animating?
     * Used to soft-lock tab switching and other interactions
     */
    const isAnimating = flyingItems.length > 0;

    /**
     * Subscribe to flying item events on mount
     */
    useEffect(() => {
        const unsubscribe = flyingItemsEventBus.on(
            'FLYING_ITEM_START',
            (data?: Record<string, unknown>) => {
                setFlyingItems((prev) => {
                    // Hard cap: max 5 simultaneous items
                    if (prev.length >= 5) {
                        console.warn('[useFlyingItems] Hard cap reached (5 items), rejecting new item');
                        return prev;
                    }

                    if (!data) return prev;

                    const newItem: FlyingItemEvent = {
                        id: (data.id as string) || `flying-${Date.now()}-${Math.random()}`,
                        icon: (data.icon as string) || '📦',
                        startX: (data.startX as number) || 0,
                        startY: (data.startY as number) || 0,
                        endX: (data.endX as number) || 0,
                        endY: (data.endY as number) || 0,
                        isMobile: (data.isMobile as boolean) || false,
                        targetSlotId: (data.targetSlotId as string) || undefined,
                        itemId: (data.itemId as string) || '',
                    };

                    return [...prev, newItem];
                });
            }
        );

        return unsubscribe;
    }, []);

    /**
     * Handle animation complete: remove item and emit completion event
     *
     * @param itemId - ID of the flying item that completed
     */
    const handleComplete = useCallback((itemId: string) => {
        setFlyingItems((prev) => prev.filter((item) => item.id !== itemId));

        // Find the item to get its target slot
        const completedItem = flyingItems.find((item) => item.id === itemId);
        if (completedItem) {
            flyingItemsEventBus.emit('FLYING_ITEM_COMPLETE', {
                itemId: completedItem.itemId,
                targetSlotId: completedItem.targetSlotId,
            });
        }
    }, [flyingItems]);

    /**
     * Spawn a flying item animation
     *
     * @param item - Item event data
     */
    const spawnItem = useCallback((item: FlyingItemEvent): void => {
        flyingItemsEventBus.emit('FLYING_ITEM_START', item as unknown as Record<string, unknown>);
    }, []);

    /**
     * Clear all flying items (e.g., on workspace close)
     */
    const clearAll = useCallback((): void => {
        setFlyingItems([]);
    }, []);

    /**
     * Listen to flying item completion (for external subscribers)
     *
     * @param callback - Called when any flying item completes
     * @returns Unsubscribe function
     */
    const onComplete = useCallback(
        (callback: (data?: Record<string, unknown>) => void): (() => void) => {
            return flyingItemsEventBus.on('FLYING_ITEM_COMPLETE', callback as any);
        },
        []
    );

    return {
        // State
        flyingItems,
        isAnimating,

        // Control methods
        spawnItem,
        handleComplete,
        clearAll,
        onComplete,

        // Direct event bus access (for advanced usage)
        eventBus: flyingItemsEventBus,
    };
}
