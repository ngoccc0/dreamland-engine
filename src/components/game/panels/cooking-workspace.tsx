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

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { GameState } from '@/core/domain/gamestate';
import type { Item } from '@/core/domain/item';
import type { ItemDefinition } from '@/core/types/definitions/item';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CookingInventoryPanel } from './cooking-inventory-panel';
import { CookingStationPanel, type CookingMethod } from './cooking-station-panel';
import { CookingMethodTabs } from './cooking-method-tabs';
import { CookingFrameContent } from './cooking-frame-content';
import { CookingIngredientPanel } from './cooking-ingredient-panel';
import { CookingTemperatureSlider } from './cooking-temperature-slider';
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

    return (
        <>
            {/* Dialog Popup Wrapper */}
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent
                    className="max-w-4xl max-h-[85vh] w-[90vw] p-0 gap-0 overflow-hidden flex flex-col relative fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
                    style={{
                        backgroundImage: 'url(/asset/images/ui/forest_background.jpg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Semi-transparent overlay for better text readability */}
                    <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />

                    {/* Hidden title for accessibility - required by Radix Dialog */}
                    <DialogTitle className="sr-only">Cooking Workspace</DialogTitle>

                    {/* Desktop: Centered cooking frame with collapsible drawer */}
                    <div
                        className={cn(
                            'hidden md:flex w-full h-full flex-col relative z-10',
                            !isDesktop && 'hidden'
                        )}
                    >
                        {/* Method tabs/buttons - top center */}
                        <CookingMethodTabs
                            activeMethod={activeMethod}
                            onMethodChange={handleMethodChange}
                            isAnimating={isAnimating}
                        />

                        {/* Main content: centered cooking frame with inventory drawer */}
                        <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gray-950/85 px-4 py-4">
                            {/* Inventory drawer toggle button - only on mobile */}
                            {typeof window !== 'undefined' && window.innerWidth < 768 && (
                                <button
                                    onClick={() => setIsInventoryDrawerOpen(!isInventoryDrawerOpen)}
                                    className="absolute left-4 top-4 z-20 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors md:hidden"
                                    title="Toggle ingredients drawer"
                                >
                                    ☰ Ingredients
                                </button>
                            )}

                            {/* Cooking frame - centered, responsive sizing */}
                            <div
                                className="relative rounded border-4 border-orange-600/50 overflow-hidden shadow-2xl"
                                style={{
                                    backgroundImage: 'url(/asset/images/ui/forest_background.jpg)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    width: 'clamp(300px, 50vw, 600px)',
                                    height: 'clamp(300px, 50vw, 600px)',
                                }}
                            >
                                {/* Cooking method visuals - centered in frame */}
                                <CookingFrameContent
                                    activeMethod={activeMethod}
                                    calculateSauceEllipse={calculateSauceEllipse}
                                    ingredientIds={cookingDerived.selectedIngredients}
                                />

                                {/* Ingredient panel - bottom left corner */}
                                <CookingIngredientPanel
                                    ingredientIds={cookingDerived.selectedIngredients}
                                    itemDefinitions={itemDefinitions}
                                    onRemoveIngredient={(index) => cookingHandlers.removeIngredient(index)}
                                    disabled={isAnimating}
                                    className="bottom-4 left-4"
                                />

                                {/* Temperature slider - right side, vertical (OVEN only) */}
                                {activeMethod === 'OVEN' && (
                                    <CookingTemperatureSlider
                                        temperature={cookingState.temperature}
                                        onTemperatureChange={cookingHandlers.setTemperature}
                                        isAnimating={isAnimating}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Cook button - bottom center */}
                        <div className="flex justify-center px-4 py-4 border-t border-orange-600/50 bg-gray-900/90 gap-3">
                            <button
                                onClick={handleCook}
                                disabled={isAnimating || !cookingDerived.canCook}
                                className="px-8 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
                            >
                                {isAnimating ? 'Cooking...' : 'Cook'}
                            </button>
                        </div>

                        {/* Inventory drawer - left side, slides in when open */}
                        {isInventoryDrawerOpen && (
                            <div className="absolute left-0 top-0 bottom-0 w-80 bg-gray-900/95 border-r-2 border-orange-600/50 z-30 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300">
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-white">Ingredients</h3>
                                        <button
                                            onClick={() => setIsInventoryDrawerOpen(false)}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <CookingInventoryPanel
                                        items={inventoryItems}
                                        itemDefinitions={itemDefinitions}
                                        reservedSlots={getReservedSlots()}
                                        isAnimating={isAnimating}
                                        isMobile={false}
                                        onItemClick={handleInventoryItemClick}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile: Tabbed layout */}
                    <div
                        className={cn(
                            'md:hidden w-full h-full flex flex-col bg-gray-950/85 relative z-10'
                        )}
                    >
                        {/* Tab buttons */}
                        <div className="flex gap-2 p-4 bg-gray-900/90 border-b border-orange-600/50">
                            {(['inventory', 'cooking'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setMobileTab(tab)}
                                    disabled={isAnimating}
                                    className={cn(
                                        'flex-1 px-4 py-2 rounded text-sm font-medium transition-all',
                                        mobileTab === tab
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-gray-700 text-gray-200 hover:bg-gray-600',
                                        isAnimating && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    {tab === 'inventory' ? '🍖 Ingredients' : '🔥 Cooking'}
                                </button>
                            ))}

                            {/* Cooking method icon display (mobile) */}
                            {mobileTab === 'cooking' && (
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {activeMethod === 'CAMPFIRE' && (
                                        <img
                                            src="/asset/images/ui/camp_fire.png"
                                            alt="Campfire"
                                            className="h-12 w-12 object-contain drop-shadow-lg"
                                        />
                                    )}
                                    {activeMethod === 'POT' && (
                                        <img
                                            src="/asset/images/ui/iron_pot_front.png"
                                            alt="Pot"
                                            className="h-12 w-12 object-contain drop-shadow-lg"
                                        />
                                    )}
                                    {activeMethod === 'OVEN' && (
                                        <img
                                            src="/asset/images/ui/oven.png"
                                            alt="Oven"
                                            className="h-12 w-12 object-contain drop-shadow-lg"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto">
                            {mobileTab === 'inventory' ? (
                                <CookingInventoryPanel
                                    items={inventoryItems}
                                    itemDefinitions={itemDefinitions}
                                    reservedSlots={getReservedSlots()}
                                    isAnimating={isAnimating}
                                    isMobile={true}
                                    onItemClick={handleInventoryItemClick}
                                />
                            ) : (
                                <CookingStationPanel
                                    gameState={gameState}
                                    itemDefinitions={itemDefinitions}
                                    activeMethod={activeMethod}
                                    onMethodChange={handleMethodChange}
                                    reservedSlots={getReservedSlots()}
                                    disabledTabs={isAnimating}
                                    isMobile={true}
                                    onCook={handleCook}
                                    cookingProgress={cookingState.isAnimating ? 50 : 0}
                                    isAnimating={cookingState.isAnimating}
                                    temperature={cookingState.temperature}
                                    onTemperatureChange={cookingHandlers.setTemperature}
                                />
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Flying Items Portal - renders above everything */}
            <FlyingItemsPortal
                flyingItems={flyingItems}
                onItemComplete={handleFlyingItemComplete}
            />

            {/* Screen Reader Announcer - invisible but accessible */}
            <ScreenReaderAnnouncer message={announcement} />
        </>
    );
}
