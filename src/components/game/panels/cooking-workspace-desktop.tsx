"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CookingMethodTabs } from './cooking-method-tabs';
import { CookingFrameContent } from './cooking-frame-content';
import { CookingIngredientPanel } from './cooking-ingredient-panel';
import { CookingTemperatureSlider } from './cooking-temperature-slider';
import { CookingInventoryPanel } from './cooking-inventory-panel';
import type { CookingMethod } from './cooking-station-panel';
import type { ItemDefinition } from '@/core/types/definitions/item';
import type { Item } from '@/core/domain/item';

interface CookingWorkspaceDesktopProps {
    isDesktop: boolean;
    activeMethod: CookingMethod;
    isAnimating: boolean;
    onMethodChange: (method: CookingMethod) => void;
    isInventoryDrawerOpen: boolean;
    onToggleInventoryDrawer: () => void;
    calculateSauceEllipse: () => { width: number; height: number; opacity: number };
    selectedIngredients: (string | null)[];
    itemDefinitions: Record<string, ItemDefinition>;
    onRemoveIngredient: (index: number) => void;
    temperature: number;
    onTemperatureChange: (temp: number) => void;
    canCook: boolean;
    onCook: () => void;
    inventoryItems: Item[];
    reservedSlots: number[];
    onInventoryItemClick: (item: Item, slotIndex: number, event: React.MouseEvent) => void;
}

export function CookingWorkspaceDesktop({
    isDesktop,
    activeMethod,
    isAnimating,
    onMethodChange,
    isInventoryDrawerOpen,
    onToggleInventoryDrawer,
    calculateSauceEllipse,
    selectedIngredients,
    itemDefinitions,
    onRemoveIngredient,
    temperature,
    onTemperatureChange,
    canCook,
    onCook,
    inventoryItems,
    reservedSlots,
    onInventoryItemClick
}: CookingWorkspaceDesktopProps) {
    return (
        <div
            className={cn(
                'hidden md:flex w-full h-full flex-col relative z-10',
                !isDesktop && 'hidden'
            )}
        >
            {/* Method tabs/buttons - top center */}
            <CookingMethodTabs
                activeMethod={activeMethod}
                onMethodChange={onMethodChange}
                isAnimating={isAnimating}
            />

            {/* Main content: centered cooking frame with inventory drawer */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gray-950/85 px-4 py-4">
                {/* Inventory drawer toggle button - only on mobile */}
                {typeof window !== 'undefined' && window.innerWidth < 768 && (
                    <button
                        onClick={onToggleInventoryDrawer}
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
                        ingredientIds={selectedIngredients}
                    />

                    {/* Ingredient panel - bottom left corner */}
                    <CookingIngredientPanel
                        ingredientIds={selectedIngredients}
                        itemDefinitions={itemDefinitions}
                        onRemoveIngredient={onRemoveIngredient}
                        disabled={isAnimating}
                        className="bottom-4 left-4"
                    />

                    {/* Temperature slider - right side, vertical (OVEN only) */}
                    {activeMethod === 'OVEN' && (
                        <CookingTemperatureSlider
                            temperature={temperature}
                            onTemperatureChange={onTemperatureChange}
                            isAnimating={isAnimating}
                        />
                    )}
                </div>
            </div>

            {/* Cook button - bottom center */}
            <div className="flex justify-center px-4 py-4 border-t border-orange-600/50 bg-gray-900/90 gap-3">
                <button
                    onClick={onCook}
                    disabled={isAnimating || !canCook}
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
                                onClick={onToggleInventoryDrawer}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <CookingInventoryPanel
                            items={inventoryItems}
                            itemDefinitions={itemDefinitions}
                            reservedSlots={reservedSlots}
                            isAnimating={isAnimating}
                            isMobile={false}
                            onItemClick={onInventoryItemClick}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
