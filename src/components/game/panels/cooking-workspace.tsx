/**
 * Cooking Workspace Component
 *
 * @remarks
 * Main responsive container for cooking interactions. Manages:
 * - Responsive layout (desktop split-screen, mobile tabs)
 * - State coordination (optimistic cooking, flying items, inventory updates)
 * - Event wiring (flying item animations, item completion, cooking execution)
 * - A11y announcements (screen reader feedback)
 * - Soft-lock during animations (disable tab switching)
 *
 * **Integration:**
 * - Uses `useCooking` hook for cooking state (ingredients, recipe, temperature)
 * - Uses `useFlyingItems` hook for animation management
 * - Uses `useOptimisticCooking` for optimistic state updates
 * - Deducts items from inventory when added to cooking pot
 * - Executes cooking when Cook button clicked
 * - Updates game state with cooked results
 *
 * **Desktop Layout:**
 * - Left pane (40%): Filtered inventory panel
 * - Right pane (60%): Cooking station with tabs
 * - Flying items: Portal layer (z-9999)
 * - Backdrop: Unified, z-40
 *
 * **Mobile Layout:**
 * - Tab switching: "Inventory" / "Cooking"
 * - Single content area (100% width)
 * - Flying animations: Item flies to tab badge
 * - Same soft-lock during animations
 */

'use client';

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';

import type { GameState } from '@/core/domain/gamestate';
import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { MorphDialogContent } from "@/components/ui/morph-dialog-content";
import { CookingWorkspaceDesktop } from './cooking-workspace-desktop';
import { CookingWorkspaceMobile } from './cooking-workspace-mobile';
import { CookingProvider } from './cooking-context';
import { FlyingItemsPortal } from '../overlays/flying-items-portal';
import { ScreenReaderAnnouncer } from '@/components/ui/sr-announcer';
import { useFlyingItems } from '@/hooks/use-flying-items';
import { useOptimisticCooking } from '@/hooks/use-optimistic-cooking';
import { useCooking } from '@/hooks/use-cooking';
import { useCookingWorkspaceState } from '@/hooks/use-cooking-workspace-state';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface CookingWorkspaceProps {
    /**
     * Is workspace open?
     */
    isOpen: boolean;

    /**
     * Close callback
     */
    onClose: () => void;

    /**
     * Current game state
     */
    gameState: GameState;

    /**
     * Item definitions lookup
     */
    itemDefinitions: Record<string, ItemDefinition>;

    /**
     * Success callback with updated game state
     */
    onCookSuccess?: (updatedGameState: GameState) => void;

    /**
     * Item use callback
     */
    onUseItem?: (itemName: any, target: any) => void;

    /**
     * Item equip callback
     */
    onEquipItem?: (itemName: string) => void;

    /**
     * Item drop callback
     */
    onDropItem?: (itemName: string, quantity?: number) => void;
}

/**
 * Main cooking workspace component with full integration
 *
 * @param props - Component props
 * @returns Rendered responsive cooking UI
 */
export function CookingWorkspace({
    isOpen,
    onClose,
    gameState,
    itemDefinitions,
    onCookSuccess,
}: CookingWorkspaceProps) {
    // State
    const [mobileTab, setMobileTab] = useState<'inventory' | 'cooking'>('inventory');
    const [announcement, setAnnouncement] = useState('');
    const [isInventoryDrawerOpen, setIsInventoryDrawerOpen] = useState(false);

    // Toast notifications
    const { toast } = useToast();

    // Hooks
    const { flyingItems, isAnimating, eventBus } = useFlyingItems();
    const { getReservedSlots, commitIngredient } =
        useOptimisticCooking();
    const workspaceState = useCookingWorkspaceState(gameState);
    const {
        state: cookingState,
        handlers: cookingHandlers,
        derived: cookingDerived,
    } = useCooking((result) => {
        // Callback when cooking completes
        if (result.success && onCookSuccess) {
            onCookSuccess(result.gameState);
        }
    });

    // Get inventory items
    const inventoryItems = useMemo(
        () => workspaceState.state.modifiedInventory,
        [workspaceState.state.modifiedInventory]
    );

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
     * Pre-flight validation: check if slot is available
     */
    const handleInventoryItemClick = useCallback(
        (item: Item, slotIndex: number, event: React.MouseEvent) => {
            // Validation failed: slot is full
            if (slotIndex === -1) {
                // Trigger shake animation + toast
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

            // Check if we have this item in inventory
            if (item.quantity <= 0) {
                toast({
                    title: 'No Items',
                    description: 'This item is no longer available',
                    variant: 'destructive',
                });
                return;
            }

            // Get item position for animation
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

            // For mobile: target is tab badge; for desktop: target is cooking slot
            const isMobileLayout = typeof window !== 'undefined' && window.innerWidth < 768;

            // Optimistically deduct item from inventory via workspace state
            workspaceState.deductItem(item.id, 1);

            // Add to cooking slots (state update)
            cookingHandlers.selectIngredient(item.id, slotIndex);

            // Spawn flying item animation
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
            } as any);

            // Announce action
            const itemName = typeof itemDefinitions[item.id]?.name === 'object'
                ? (itemDefinitions[item.id]?.name as any)?.en || item.id
                : itemDefinitions[item.id]?.name || item.id;
            setAnnouncement(`Throwing ${itemName} to the cooking pot`);

            toast({
                title: 'Added',
                description: `${itemName} added to cooking`,
            });
        },
        [
            itemDefinitions,
            cookingHandlers,
            eventBus,
            toast,
        ]
    );

    /**
     * Calculate sauce fill level (0-1) based on ingredients
     */
    const calculateSauceFillLevel = useCallback((): number => {
        const ingredientCount = cookingState.ingredientSlots.filter(slot => slot !== null).length;
        // Max 9 ingredients, but visually fill up proportionally
        return Math.min(ingredientCount / 6, 1); // Reaches max at 6 ingredients
    }, [cookingState.ingredientSlots]);

    /**
     * Calculate sauce ellipse dimensions based on fill level
     * Returns { width, height, opacity } for the sauce div
     */
    const calculateSauceEllipse = useCallback((): { width: number; height: number; opacity: number } => {
        const fillLevel = calculateSauceFillLevel();
        if (fillLevel === 0) return { width: 0, height: 0, opacity: 0 };

        // Base ellipse dimensions (pot bottom)
        const baseWidth = 140; // ~87% of pot width
        const baseHeight = 80; // Elliptical, not circular
        const maxOpacity = 0.8;

        return {
            width: baseWidth * fillLevel,
            height: baseHeight * fillLevel,
            opacity: maxOpacity * fillLevel,
        };
    }, [calculateSauceFillLevel]);

    /**
     * Handle flying item completion
     */
    const handleFlyingItemComplete = useCallback(
        (itemId: string) => {
            // Commit the optimistic update
            commitIngredient(0); // slotIndex already handled by state
            setAnnouncement(`Added to cooking pot`);
        },
        [commitIngredient]
    );

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

        // Execute cooking
        cookingHandlers.cook(gameState, itemDefinitions);

        // Announce
        setAnnouncement('Cooking started');
        toast({
            title: 'Cooking',
            description: 'Your meal is being prepared...',
        });
    }, [
        cookingDerived.canCook,
        cookingHandlers,
        gameState,
        itemDefinitions,
        toast,
    ]);

    /**
     * Handle cooking method change
     */
    const handleMethodChange = useCallback((method: CookingMethod) => {
        // Reset slots when switching methods (different slot counts)
        workspaceState.changeMethod(method);
        cookingHandlers.reset();
        setAnnouncement(`Switched to ${method.toLowerCase()}`);
    }, [cookingHandlers, workspaceState]);

    /**
     * Subscribe to flying item completion events
     */
    useEffect(() => {
        const unsubscribe = eventBus.on('FLYING_ITEM_COMPLETE', () => {
            // Event handled by portal's onAnimationComplete
        });
        return unsubscribe;
    }, [eventBus]);

    /**
     * Handle workspace close
     */
    const handleClose = useCallback(() => {
        // Reset cooking and workspace state
        cookingHandlers.reset();
        workspaceState.reset();
        setMobileTab('inventory');
        setAnnouncement('');
        onClose();
    }, [onClose, cookingHandlers, workspaceState]);

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    const activeMethod = workspaceState.state.activeMethod;

    const contextValue = useMemo(() => ({
        gameState,
        itemDefinitions,
        inventoryItems,
        activeMethod,
        selectedIngredients: cookingDerived.selectedIngredients,
        temperature: cookingState.temperature,
        reservedSlots: getReservedSlots(),
        isWorkspaceAnimating: isAnimating,
        isCookingAnimating: cookingState.isAnimating,
        cookingProgress: cookingState.isAnimating ? 50 : 0,
        canCook: cookingDerived.canCook,
        onMethodChange: handleMethodChange,
        onTemperatureChange: cookingHandlers.setTemperature,
        onRemoveIngredient: cookingHandlers.removeIngredient,
        onInventoryItemClick: handleInventoryItemClick,
        onCook: handleCook,
        calculateSauceEllipse,
    }), [
        gameState,
        itemDefinitions,
        inventoryItems,
        activeMethod,
        cookingDerived.selectedIngredients,
        cookingState.temperature,
        cookingState.isAnimating,
        cookingDerived.canCook,
        handleMethodChange,
        cookingHandlers.setTemperature,
        cookingHandlers.removeIngredient,
        handleInventoryItemClick,
        handleCook,
        calculateSauceEllipse,
        getReservedSlots,
        isAnimating
    ]);

    return (
        <>
            {/* Dialog Popup Wrapper */}
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <MorphDialogContent
                    layoutId="popup-cooking"
                    className="max-w-4xl max-h-[85vh] w-[90vw] p-0 gap-0"
                    containerClassName="w-full h-full flex flex-col relative overflow-hidden"
                    style={{
                        backgroundImage: 'url(/asset/images/ui/back_ground/forest_background.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Semi-transparent overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />

                    {/* Hidden title for accessibility - required by Radix Dialog */}
                    <DialogTitle className="sr-only">Cooking Workspace</DialogTitle>

                    <CookingProvider value={contextValue}>
                        {/* Desktop Layout */}
                        <CookingWorkspaceDesktop
                            isDesktop={isDesktop}
                            isInventoryDrawerOpen={isInventoryDrawerOpen}
                            onToggleInventoryDrawer={() => setIsInventoryDrawerOpen(!isInventoryDrawerOpen)}
                        />

                        {/* Mobile Layout */}
                        <CookingWorkspaceMobile
                            mobileTab={mobileTab}
                            onTabChange={setMobileTab}
                        />
                    </CookingProvider>
                </MorphDialogContent >
            </Dialog >

            {/* Flying Items Portal - renders above everything */}
            < FlyingItemsPortal
                flyingItems={flyingItems}
                onItemComplete={handleFlyingItemComplete}
            />

            {/* Screen Reader Announcer - invisible but accessible */}
            < ScreenReaderAnnouncer message={announcement} />
        </>
    );
}
