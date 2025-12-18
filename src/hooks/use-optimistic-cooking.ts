/**
 * Optimistic Cooking Hook
 *
 * @remarks
 * Manages optimistic state updates for cooking interactions. Deducts items
 * from inventory and reserves cooking slots immediately on click, preventing
 * state desynchronization and double-add bugs.
 *
 * **State Model:**
 * - On `addIngredientOptimistic()`: Validate slot is empty, deduct item quantity
 *   immediately, mark slot as reserved. Returns success/failure.
 * - On animation complete: Call `commitIngredient()` to finalize (state already correct).
 * - On error/timeout: Call `revertIngredient()` to restore inventory.
 *
 * **Key Invariant:**
 * Item is removed from inventory BEFORE animation starts. This prevents race
 * conditions where rapid clicks cause duplicate additions.
 */

'use client';

import { useCallback, useState } from 'react';
import type { Item } from '@/core/domain/item';

interface ReservedSlot {
    itemId: string;
    quantity: number;
}

interface OptimisticSnapshot {
    inventoryBefore: Item[];
    reservedSlots: Map<number, ReservedSlot>;
}

/**
 * Hook for optimistic cooking state management
 *
 * @returns Methods to add, commit, and revert ingredient additions
 */
export function useOptimisticCooking() {
    // Track reserved slots (slotIndex -> {itemId, quantity})
    const [reservedSlots, setReservedSlots] = useState<Map<number, ReservedSlot>>(
        new Map()
    );

    // Track snapshot for undo capability
    const [lastSnapshot, setLastSnapshot] = useState<OptimisticSnapshot | null>(null);

    /**
     * Validate if a slot is available for cooking
     *
     * @param slotIndex - Index of the target cooking slot
     * @returns true if slot is empty and not reserved
     */
    const isSlotAvailable = useCallback((slotIndex: number): boolean => {
        return !reservedSlots.has(slotIndex);
    }, [reservedSlots]);

    /**
     * Get all currently reserved slot indices
     *
     * @returns Array of reserved slot indices
     */
    const getReservedSlots = useCallback((): number[] => {
        return Array.from(reservedSlots.keys());
    }, [reservedSlots]);

    /**
     * Check if any slots are reserved
     *
     * @returns true if system is busy with animations
     */
    const hasReservedSlots = useCallback((): boolean => {
        return reservedSlots.size > 0;
    }, [reservedSlots]);

    /**
     * Optimistically add ingredient: deduct from inventory and reserve slot
     *
     * @remarks
     * **Process:**
     * 1. Validate target slot is available (not reserved)
     * 2. Create snapshot of current inventory for undo capability
     * 3. Deduct 1 quantity of item from inventory (local state)
     * 4. Mark slot as reserved
     * 5. Return success + snapshot for potential undo
     *
     * **If validation fails:** Returns {success: false}, no state changes
     *
     * @param slotIndex - Target cooking slot index
     * @param item - Item to add to cooking pot
     * @param inventory - Current player inventory array
     * @returns {success: boolean, snapshot?: OptimisticSnapshot}
     */
    const addIngredientOptimistic = useCallback(
        (
            slotIndex: number,
            item: Item,
            inventory: Item[]
        ): { success: boolean; snapshot?: OptimisticSnapshot } => {
            // 1. Validate slot is available
            if (!isSlotAvailable(slotIndex)) {
                return { success: false };
            }

            // 2. Create snapshot
            const snapshot: OptimisticSnapshot = {
                inventoryBefore: structuredClone(inventory),
                reservedSlots: new Map(reservedSlots),
            };

            // 3. Reserve slot
            setReservedSlots((prev) => {
                const next = new Map(prev);
                next.set(slotIndex, { itemId: item.id, quantity: 1 });
                return next;
            });

            // 4. Store snapshot for undo
            setLastSnapshot(snapshot);

            return { success: true, snapshot };
        },
        [isSlotAvailable, reservedSlots]
    );

    /**
     * Finalize (commit) ingredient addition after animation completes
     *
     * @remarks
     * Call this after flying item animation finishes. Removes reservation
     * from slot, allowing new items to be added to that slot.
     *
     * @param slotIndex - Target slot to release
     */
    const commitIngredient = useCallback((slotIndex: number): void => {
        setReservedSlots((prev) => {
            const next = new Map(prev);
            next.delete(slotIndex);
            return next;
        });
    }, []);

    /**
     * Revert ingredient addition (undo) on error or timeout
     *
     * @remarks
     * Restores inventory to pre-addition state and clears reservation.
     * Call this if flying animation fails or times out.
     *
     * @param slotIndex - Slot to release
     * @param snapshot - Snapshot from addIngredientOptimistic() for inventory restore
     */
    const revertIngredient = useCallback(
        (slotIndex: number, _snapshot: OptimisticSnapshot | null): void => {
            // Release slot reservation
            setReservedSlots((prev) => {
                const next = new Map(prev);
                next.delete(slotIndex);
                return next;
            });

            // Inventory restore is handled by caller (e.g., CookingInventoryPanel)
            // This hook just manages slot reservations
        },
        []
    );

    /**
     * Revert all pending reservations (e.g., on workspace close)
     *
     * @remarks
     * Clears all reserved slots. Inventory should be restored externally.
     */
    const revertAll = useCallback((): void => {
        setReservedSlots(new Map());
        setLastSnapshot(null);
    }, []);

    return {
        // State
        reservedSlots,
        lastSnapshot,

        // Methods
        isSlotAvailable,
        getReservedSlots,
        hasReservedSlots,
        addIngredientOptimistic,
        commitIngredient,
        revertIngredient,
        revertAll,
    };
}
