"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CookingMethodTabs } from './cooking-method-tabs';
import { CookingFrameContent } from './cooking-frame-content';
import { CookingIngredientPanel } from './cooking-ingredient-panel';
import { CookingTemperatureSlider } from './cooking-temperature-slider';
import { CookingInventoryPanel } from './cooking-inventory-panel';
import type { CookingMethod } from './cooking-station-panel';
import { useCookingContext } from './cooking-context';

interface CookingWorkspaceDesktopProps {
    isDesktop: boolean;
    isInventoryDrawerOpen: boolean;
    onToggleInventoryDrawer: () => void;
}

export function CookingWorkspaceDesktop({
    isDesktop,
    isInventoryDrawerOpen,
    onToggleInventoryDrawer
}: CookingWorkspaceDesktopProps) {
    const {
        activeMethod,
        isWorkspaceAnimating,
        onMethodChange,
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
        onInventoryItemClick,
        isCookingAnimating
    } = useCookingContext();

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
                isAnimating={isWorkspaceAnimating}
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
                        backgroundImage: 'url(/asset/images/ui/back_ground/forest_background.jpg)',
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
                        disabled={isWorkspaceAnimating}
                        className="bottom-4 left-4"
                    />

                    {/* Temperature slider - right side, vertical (OVEN only) */}
                    {activeMethod === 'OVEN' && (
                        <CookingTemperatureSlider
                            temperature={temperature}
                            onTemperatureChange={onTemperatureChange}
                            isAnimating={isWorkspaceAnimating}
                        />
                    )}
                </div>
            </div>

            {/* Cook button - bottom center */}
            <div className="flex justify-center px-4 py-4 border-t border-orange-600/50 bg-gray-900/90 gap-3">
                <button
                    onClick={onCook}
                    disabled={isWorkspaceAnimating || !canCook || isCookingAnimating}
                    className="px-8 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
                >
                    {isCookingAnimating ? 'Cooking...' : 'Cook'}
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
                            isAnimating={isWorkspaceAnimating}
                            isMobile={false}
                            onItemClick={onInventoryItemClick}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
