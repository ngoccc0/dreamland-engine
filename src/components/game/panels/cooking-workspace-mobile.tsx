"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CookingInventoryPanel } from './cooking-inventory-panel';
import { CookingStationPanel, type CookingMethod } from './cooking-station-panel';
import type { GameState } from '@/core/domain/gamestate';
import type { ItemDefinition } from '@/core/types/definitions/item';
import type { Item } from '@/core/domain/item';

interface CookingWorkspaceMobileProps {
    mobileTab: 'inventory' | 'cooking';
    onTabChange: (tab: 'inventory' | 'cooking') => void;
    isAnimating: boolean;
    activeMethod: CookingMethod;
    onMethodChange: (method: CookingMethod) => void;
    inventoryItems: Item[];
    itemDefinitions: Record<string, ItemDefinition>;
    reservedSlots: number[];
    onInventoryItemClick: (item: Item, slotIndex: number, event: React.MouseEvent) => void;
    gameState: GameState;
    onCook: () => void;
    cookingProgress: number;
    isCookingAnimating: boolean;
    temperature: number;
    onTemperatureChange: (temp: number) => void;
}

export function CookingWorkspaceMobile({
    mobileTab,
    onTabChange,
    isAnimating,
    activeMethod,
    onMethodChange,
    inventoryItems,
    itemDefinitions,
    reservedSlots,
    onInventoryItemClick,
    gameState,
    onCook,
    cookingProgress,
    isCookingAnimating,
    temperature,
    onTemperatureChange
}: CookingWorkspaceMobileProps) {
    return (
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
                        onClick={() => onTabChange(tab)}
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
                        reservedSlots={reservedSlots}
                        isAnimating={isAnimating}
                        isMobile={true}
                        onItemClick={onInventoryItemClick}
                    />
                ) : (
                    <CookingStationPanel
                        gameState={gameState}
                        itemDefinitions={itemDefinitions}
                        activeMethod={activeMethod}
                        onMethodChange={onMethodChange}
                        reservedSlots={reservedSlots}
                        disabledTabs={isAnimating}
                        isMobile={true}
                        onCook={onCook}
                        cookingProgress={cookingProgress}
                        isAnimating={isCookingAnimating}
                        temperature={temperature}
                        onTemperatureChange={onTemperatureChange}
                    />
                )}
            </div>
        </div>
    );
}
