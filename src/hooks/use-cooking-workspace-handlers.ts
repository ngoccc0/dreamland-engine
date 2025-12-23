/**
 * Cooking Workspace Handlers Hook
 *
 * @remarks
 * Extracted handlers from cooking-workspace.tsx to reduce component size.
 * Contains all event handlers and calculation functions for the cooking UI.
 *
 * **Handlers:**
 * - handleInventoryItemClick: Add item to cooking pot
 * - handleCook: Execute cooking action
 * - handleMethodChange: Switch cooking method
 * - handleClose: Close workspace
 * - calculateSauceEllipse: Calculate sauce visual dimensions
 */

'use client';

import { useCallback } from 'react';
import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';
import type { GameState } from '@/core/domain/gamestate';
import type { CookingMethod } from '@/components/game/panels/cooking-station-panel';
import type { UseCookingHandlers, UseCookingState, UseCookingDerived } from './use-cooking';

export interface CookingWorkspaceHandlersProps {
    /** Item definitions lookup */
    itemDefinitions: Record<string, ItemDefinition>;
    /** Current game state */
    gameState: GameState;
    /** Cooking state from useCooking hook */
    cookingState: UseCookingState;
    /** Cooking handlers from useCooking hook */
    cookingHandlers: UseCookingHandlers;
    /** Cooking derived state from useCooking hook */
    cookingDerived: UseCookingDerived;
    /** Workspace state helpers */
    workspaceState: {
        deductItem: (itemId: string, quantity: number) => void;
        changeMethod: (method: CookingMethod) => void;
        reset: () => void;
    };
    /** Flying items event bus */
    eventBus: {
        emit: (event: string, data: any) => void;
    };
    /** Toast notification function */
    toast: (options: { title: string; description: string; variant?: string }) => void;
    /** Set announcement for screen reader */
    setAnnouncement: (message: string) => void;
    /** Get reserved slots from optimistic cooking */
    getReservedSlots: () => number[];
    /** Close callback */
    onClose: () => void;
    /** Success callback */
    onCookSuccess?: (gameState: GameState) => void;
}

export interface CookingWorkspaceHandlersResult {
    /** Handle inventory item click to add to pot */
    handleInventoryItemClick: (item: Item, slotIndex: number, event: React.MouseEvent) => void;
    /** Handle cook button press */
    handleCook: () => void;
    /** Handle cooking method change */
    handleMethodChange: (method: CookingMethod) => void;
    /** Handle workspace close */
    handleClose: () => void;
    /** Calculate sauce ellipse dimensions */
    calculateSauceEllipse: () => { width: number; height: number; opacity: number };
    /** Find first empty cooking slot */
    findFirstEmptySlot: () => number;
}

/**
 * Hook providing cooking workspace event handlers
 *
 * @param props - Dependencies for handlers
 * @returns Object containing all handler functions
 */
export function useCookingWorkspaceHandlers(
    props: CookingWorkspaceHandlersProps
): CookingWorkspaceHandlersResult {
    const {
        itemDefinitions,
        gameState,
        cookingState,
        cookingHandlers,
        cookingDerived,
        workspaceState,
        eventBus,
        toast,
        setAnnouncement,
        getReservedSlots,
        onClose,
    } = props;

    /**
     * Find first empty cooking slot
     */
    const findFirstEmptySlot = useCallback((): number => {
        const reserved = getReservedSlots();
        for (let i = 0; i < 9; i++) {
            if (cookingState.ingredientSlots[i] === null && !reserved.includes(i)) {
                return i;
            }
        }
        return -1;
    }, [cookingState.ingredientSlots, getReservedSlots]);

    /**
     * Handle inventory item click
     */
    const handleInventoryItemClick = useCallback(
        (item: Item, slotIndex: number, event: React.MouseEvent) => {
            if (slotIndex === -1) {
                const itemName = typeof itemDefinitions[item.id]?.name === 'object'
                    ? (itemDefinitions[item.id]?.name as any)?.en || item.id
                    : itemDefinitions[item.id]?.name || item.id;

                toast({
                    title: 'Pot Full',
                    description: `Cannot add ${itemName}: all slots are full`,
                    variant: 'destructive',
                });
                setAnnouncement(`Cannot add ${itemName}: all slots are full`);
                return;
            }

            if (item.quantity <= 0) {
                toast({
                    title: 'No Items',
                    description: 'This item is no longer available',
                    variant: 'destructive',
                });
                return;
            }

            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            const isMobileLayout = typeof window !== 'undefined' && window.innerWidth < 768;

            workspaceState.deductItem(item.id, 1);
            cookingHandlers.selectIngredient(item.id, slotIndex);

            eventBus.emit('FLYING_ITEM_START', {
                id: `flying-${Date.now()}-${Math.random()}`,
                icon: (itemDefinitions[item.id] as any)?.emoji || '📦',
                startX: rect.left + rect.width / 2,
                startY: rect.top + rect.height / 2,
                endX: isMobileLayout ? window.innerWidth - 50 : window.innerWidth / 2 + 150,
                endY: isMobileLayout ? 50 : window.innerHeight / 2,
                isMobile: isMobileLayout,
                targetSlotId: `slot-${slotIndex}`,
                itemId: item.id,
            });

            const itemName = typeof itemDefinitions[item.id]?.name === 'object'
                ? (itemDefinitions[item.id]?.name as any)?.en || item.id
                : itemDefinitions[item.id]?.name || item.id;
            setAnnouncement(`Throwing ${itemName} to the cooking pot`);

            toast({
                title: 'Added',
                description: `${itemName} added to cooking`,
            });
        },
        [itemDefinitions, cookingHandlers, eventBus, toast, setAnnouncement, workspaceState]
    );

    /**
     * Calculate sauce fill level (0-1) based on ingredients
     */
    const calculateSauceFillLevel = useCallback((): number => {
        const ingredientCount = cookingState.ingredientSlots.filter(slot => slot !== null).length;
        return Math.min(ingredientCount / 6, 1);
    }, [cookingState.ingredientSlots]);

    /**
     * Calculate sauce ellipse dimensions based on fill level
     */
    const calculateSauceEllipse = useCallback((): { width: number; height: number; opacity: number } => {
        const fillLevel = calculateSauceFillLevel();
        if (fillLevel === 0) return { width: 0, height: 0, opacity: 0 };

        const baseWidth = 140;
        const baseHeight = 80;
        const maxOpacity = 0.8;

        return {
            width: baseWidth * fillLevel,
            height: baseHeight * fillLevel,
            opacity: maxOpacity * fillLevel,
        };
    }, [calculateSauceFillLevel]);

    /**
     * Handle cook button click
     */
    const handleCook = useCallback(() => {
        if (!cookingDerived.canCook) {
            toast({
                title: 'Not Ready',
                description: 'Select ingredients matching a recipe to cook',
                variant: 'destructive',
            });
            return;
        }

        cookingHandlers.cook(gameState, itemDefinitions);
        setAnnouncement('Cooking started');
        toast({
            title: 'Cooking',
            description: 'Your meal is being prepared...',
        });
    }, [cookingDerived.canCook, cookingHandlers, gameState, itemDefinitions, toast, setAnnouncement]);

    /**
     * Handle cooking method change
     */
    const handleMethodChange = useCallback((method: CookingMethod) => {
        workspaceState.changeMethod(method);
        cookingHandlers.reset();
        setAnnouncement(`Switched to ${method.toLowerCase()}`);
    }, [cookingHandlers, workspaceState, setAnnouncement]);

    /**
     * Handle workspace close
     */
    const handleClose = useCallback(() => {
        cookingHandlers.reset();
        workspaceState.reset();
        setAnnouncement('');
        onClose();
    }, [onClose, cookingHandlers, workspaceState, setAnnouncement]);

    return {
        handleInventoryItemClick,
        handleCook,
        handleMethodChange,
        handleClose,
        calculateSauceEllipse,
        findFirstEmptySlot,
    };
}
