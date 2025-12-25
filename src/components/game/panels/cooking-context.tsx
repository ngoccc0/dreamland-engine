"use client";

import { createContext, useContext } from 'react';
import type { GameState } from '@/core/domain/gamestate';
import type { ItemDefinition } from '@/core/types/definitions/item';
import type { Item } from '@/core/domain/item';
import type { CookingMethod } from './cooking-station-panel';

export interface CookingContextValue {
    // Game Data
    gameState: GameState;
    itemDefinitions: Record<string, ItemDefinition>;
    inventoryItems: Item[];

    // Cooking State
    activeMethod: CookingMethod;
    selectedIngredients: (string | null)[];
    temperature: number;
    reservedSlots: number[];

    // Animations & Status
    isWorkspaceAnimating: boolean; // Morph animation
    isCookingAnimating: boolean;
    cookingProgress: number;
    canCook: boolean;

    // Actions
    onMethodChange: (method: CookingMethod) => void;
    onTemperatureChange: (temp: number) => void;
    onRemoveIngredient: (index: number) => void;
    onInventoryItemClick: (item: Item, slotIndex: number, event: React.MouseEvent) => void;
    onCook: () => void;
    calculateSauceEllipse: () => { width: number; height: number; opacity: number };
}

const CookingContext = createContext<CookingContextValue | null>(null);

export function useCookingContext() {
    const context = useContext(CookingContext);
    if (!context) {
        throw new Error('useCookingContext must be used within a CookingProvider');
    }
    return context;
}

export const CookingProvider = CookingContext.Provider;
