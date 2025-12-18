/**
 * Cooking Workspace State Hook
 *
 * @remarks
 * Manages the full lifecycle of cooking interactions including:
 * - Cooking method selection (CAMPFIRE/POT/OVEN)
 * - Inventory tracking with optimistic updates
 * - Recipe matching and validation
 * - Cooking execution and completion
 *
 * **Integration Points:**
 * - Connects useCooking hook (ingredient slots, recipe)
 * - Connects useOptimisticCooking hook (state reservation)
 * - Manages inventory modifications
 * - Triggers cooking execution
 */

'use client';

import { useCallback, useState, useMemo } from 'react';
import type { GameState } from '@/core/domain/gamestate';
import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';

export type CookingMethod = 'CAMPFIRE' | 'POT' | 'OVEN';

interface CookingWorkspaceState {
    activeMethod: CookingMethod;
    modifiedInventory: Item[];
    cookingProgress: number;
}

/**
 * Hook for managing cooking workspace state coordination
 *
 * @param gameState - Current game state
 * @returns State and handlers for workspace
 */
export function useCookingWorkspaceState(gameState: GameState) {
    const [state, setState] = useState<CookingWorkspaceState>({
        activeMethod: 'CAMPFIRE',
        modifiedInventory: (gameState.player?.inventory || []) as Item[],
        cookingProgress: 0,
    });

    /**
     * Deduct item from modified inventory
     */
    const deductItem = useCallback((itemId: string, quantity: number = 1): boolean => {
        setState((prev) => {
            const found = prev.modifiedInventory.find((item) => item.id === itemId);
            if (!found || found.quantity < quantity) {
                return prev; // Not enough
            }

            return {
                ...prev,
                modifiedInventory: prev.modifiedInventory
                    .map((item) =>
                        item.id === itemId
                            ? { ...item, quantity: Math.max(0, item.quantity - quantity) }
                            : item
                    )
                    .filter((item) => item.quantity > 0),
            };
        });

        return true;
    }, []);

    /**
     * Change cooking method
     */
    const changeMethod = useCallback((method: CookingMethod): void => {
        setState((prev) => ({
            ...prev,
            activeMethod: method,
            cookingProgress: 0,
        }));
    }, []);

    /**
     * Update cooking progress
     */
    const setProgress = useCallback((progress: number): void => {
        setState((prev) => ({
            ...prev,
            cookingProgress: Math.min(100, Math.max(0, progress)),
        }));
    }, []);

    /**
     * Reset workspace state (on close)
     */
    const reset = useCallback((): void => {
        setState({
            activeMethod: 'CAMPFIRE',
            modifiedInventory: (gameState.player?.inventory || []) as Item[],
            cookingProgress: 0,
        });
    }, [gameState.player?.inventory]);

    return {
        state,
        deductItem,
        changeMethod,
        setProgress,
        reset,
    };
}
