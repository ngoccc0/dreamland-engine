/**
 * Cooking Hook (use-cooking.ts)
 *
 * @remarks
 * **State Management:**
 * - ingredientSlots: Item IDs for selected ingredients (varies by cooking type)
 * - toolSlot: Item ID for tool (wooden_bowl for pot, skewers for campfire)
 * - spiceSlot: Item ID for optional spice enhancement
 * - temperature: For oven only (50-300°C), updates via slider
 * - isAnimating: True during cooking animation (disables interactions)
 * - currentRecipe: Selected recipe for pattern matching
 *
 * **Handlers:**
 * - selectIngredient(itemId, slotIndex): Add ingredient to specific slot
 * - removeIngredient(slotIndex): Clear a slot
 * - selectTool(itemId): Set tool item
 * - selectSpice(itemId): Set optional spice
 * - setTemperature(temp): Update oven temperature (50-300°C)
 * - cook(): Execute cooking via usecase
 * - reset(): Clear all slots and animations
 *
 * **Derived State:**
 * - isRecipeMatched(): Check if ingredients match recipe (unordered)
 * - canCook(): Check if ready (matched recipe + tool + not animating)
 */

'use client';

import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { GameState } from '@/core/domain/gamestate';
import { useCallback, useState } from 'react';
import { executeCooking } from '@/core/usecases/cooking';

export interface UseCookingState {
    ingredientSlots: (string | null)[];
    toolSlot: string | null;
    spiceSlot: string | null;
    temperature: number; // 50-300°C
    isAnimating: boolean;
    currentRecipe: CookingRecipe | null;
}

export interface UseCookingHandlers {
    selectIngredient: (itemId: string, slotIndex: number) => void;
    removeIngredient: (slotIndex: number) => void;
    selectTool: (itemId: string) => void;
    removeTool: () => void;
    selectSpice: (itemId: string) => void;
    removeSpice: () => void;
    setTemperature: (temp: number) => void;
    setRecipe: (recipe: CookingRecipe) => void;
    cook: (gameState: GameState, itemDefinitions: Record<string, object>) => void;
    reset: () => void;
}

export interface UseCookingDerived {
    isRecipeMatched: boolean;
    canCook: boolean;
    selectedIngredients: string[];
}

/**
 * Hook for managing cooking state and interactions
 *
 * @param onCookSuccess - Callback when cooking completes successfully
 * @returns State, handlers, and derived properties
 */
export function useCooking(
    onCookSuccess?: (result: { success: boolean; gameState: GameState; effects: any[] }) => void
) {
    const [state, setState] = useState<UseCookingState>({
        ingredientSlots: Array(9).fill(null), // Max 9 for oven (3x3)
        toolSlot: null,
        spiceSlot: null,
        temperature: 180, // Default oven temp
        isAnimating: false,
        currentRecipe: null,
    });

    // Selector: Get non-null ingredient IDs
    const selectedIngredients = state.ingredientSlots.filter(
        (id): id is string => id !== null
    );

    // Selector: Check if recipe matches (unordered)
    const isRecipeMatched = (() => {
        if (!state.currentRecipe || selectedIngredients.length === 0) return false;
        const requiredIds = new Set(state.currentRecipe.ingredients.map((i) => i.id));
        const selected = new Set(selectedIngredients);
        return Array.from(requiredIds).every((id) => selected.has(id));
    })();

    // Selector: Can cook?
    const canCook = isRecipeMatched && !state.isAnimating;

    // Handler: Select ingredient for slot
    const selectIngredient = useCallback((itemId: string, slotIndex: number) => {
        setState((prev) => {
            const newSlots = [...prev.ingredientSlots];
            newSlots[slotIndex] = itemId;
            return { ...prev, ingredientSlots: newSlots };
        });
    }, []);

    // Handler: Remove ingredient from slot
    const removeIngredient = useCallback((slotIndex: number) => {
        setState((prev) => {
            const newSlots = [...prev.ingredientSlots];
            newSlots[slotIndex] = null;
            return { ...prev, ingredientSlots: newSlots };
        });
    }, []);

    // Handler: Select tool
    const selectTool = useCallback((itemId: string) => {
        setState((prev) => ({ ...prev, toolSlot: itemId }));
    }, []);

    // Handler: Remove tool
    const removeTool = useCallback(() => {
        setState((prev) => ({ ...prev, toolSlot: null }));
    }, []);

    // Handler: Select spice
    const selectSpice = useCallback((itemId: string) => {
        setState((prev) => ({ ...prev, spiceSlot: itemId }));
    }, []);

    // Handler: Remove spice
    const removeSpice = useCallback(() => {
        setState((prev) => ({ ...prev, spiceSlot: null }));
    }, []);

    // Handler: Set temperature (oven)
    const setTemperature = useCallback((temp: number) => {
        const clamped = Math.max(50, Math.min(300, temp));
        setState((prev) => ({ ...prev, temperature: clamped }));
    }, []);

    // Handler: Set recipe
    const setRecipe = useCallback((recipe: CookingRecipe) => {
        setState((prev) => ({ ...prev, currentRecipe: recipe }));
    }, []);

    // Handler: Execute cooking
    const cook = useCallback(
        (gameState: GameState, itemDefinitions: Record<string, any>) => {
            if (!state.currentRecipe || !canCook) return;

            setState((prev) => ({ ...prev, isAnimating: true }));

            // Execute usecase
            const result = executeCooking({
                gameState,
                recipe: state.currentRecipe,
                ingredientIds: selectedIngredients,
                itemDefinitions,
                temperature: state.temperature,
                spiceItemId: state.spiceSlot || undefined,
            });

            // Call callback and reset after animation
            setTimeout(() => {
                if (onCookSuccess) {
                    onCookSuccess(result);
                }
                setState((prev) => ({
                    ...prev,
                    isAnimating: false,
                    ingredientSlots: Array(9).fill(null), // Reset slots
                    spiceSlot: null,
                }));
            }, 1500); // 1.5s animation duration
        },
        [state.currentRecipe, state.temperature, state.spiceSlot, canCook, selectedIngredients, onCookSuccess]
    );

    // Handler: Reset state
    const reset = useCallback(() => {
        setState({
            ingredientSlots: Array(9).fill(null),
            toolSlot: null,
            spiceSlot: null,
            temperature: 180,
            isAnimating: false,
            currentRecipe: null,
        });
    }, []);

    return {
        state,
        handlers: {
            selectIngredient,
            removeIngredient,
            selectTool,
            removeTool,
            selectSpice,
            removeSpice,
            setTemperature,
            setRecipe,
            cook,
            reset,
        },
        derived: {
            isRecipeMatched,
            canCook,
            selectedIngredients,
        },
    };
}
