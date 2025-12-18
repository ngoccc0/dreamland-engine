/**
 * Cooking Station Panel Component
 *
 * @remarks
 * Right pane (desktop) / Cooking tab (mobile) displaying cooking UI with
 * tabs for different cooking methods (Campfire, Pot, Oven), ingredient slots,
 * progress bar, and cook controls.
 *
 * **Key Features:**
 * - Tab switching disabled during animations (soft-lock via disabledTabs prop)
 * - Displays reserved slots as visually distinct
 * - Shows progress bar when cooking is active
 * - Temperature slider for oven method
 * - Responsive slot sizing (desktop vs mobile)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { renderItemEmoji } from '@/components/game/icons';
import type { GameState } from '@/core/domain/gamestate';
import type { ItemDefinition } from '@/core/types/definitions/item';
import { cn } from '@/lib/utils';

export type CookingMethod = 'CAMPFIRE' | 'POT' | 'OVEN';

export interface CookingStationPanelProps {
    /**
     * Current game state
     */
    gameState: GameState;

    /**
     * Item definitions for lookup
     */
    itemDefinitions: Record<string, ItemDefinition>;

    /**
     * Current active cooking method
     */
    activeMethod: CookingMethod;

    /**
     * Callback to change cooking method
     */
    onMethodChange: (method: CookingMethod) => void;

    /**
     * Reserved slot indices (disable clicking on reserved slots)
     */
    reservedSlots: number[];

    /**
     * Tab switching disabled? (true when flying items animating)
     */
    disabledTabs?: boolean;

    /**
     * Mobile layout mode?
     */
    isMobile?: boolean;

    /**
     * Callback when Cook button clicked
     */
    onCook?: () => void;

    /**
     * Current cooking progress (0-100)
     */
    cookingProgress?: number;

    /**
     * Is cooking in progress?
     */
    isAnimating?: boolean;

    /**
     * Current oven temperature (for OVEN method)
     */
    temperature?: number;

    /**
     * Callback to change oven temperature
     */
    onTemperatureChange?: (temp: number) => void;
}

/**
 * Cooking station panel with method tabs and slot display
 *
 * @param props - Component props
 * @returns Rendered cooking UI
 */
export function CookingStationPanel({
    gameState,
    itemDefinitions,
    activeMethod,
    onMethodChange,
    reservedSlots,
    disabledTabs = false,
    isMobile = false,
    onCook,
    cookingProgress = 0,
    isAnimating = false,
    temperature = 180,
    onTemperatureChange,
}: CookingStationPanelProps) {
    const [slotHover, setSlotHover] = useState<number | null>(null);

    const methods: CookingMethod[] = ['CAMPFIRE', 'POT', 'OVEN'];

    /**
     * Get slot grid layout based on cooking method
     */
    const getSlotConfig = useCallback((): { cols: number; count: number } => {
        switch (activeMethod) {
            case 'CAMPFIRE':
                return { cols: 1, count: 3 };
            case 'POT':
                return { cols: 3, count: 9 };
            case 'OVEN':
                return { cols: 3, count: 9 };
            default:
                return { cols: 3, count: 9 };
        }
    }, [activeMethod]);

    const slotConfig = getSlotConfig();

    /**
     * Get cooking method display info
     */
    const getMethodInfo = (method: CookingMethod): { icon: string; label: string } => {
        const info = {
            CAMPFIRE: { icon: '🔥', label: 'Campfire' },
            POT: { icon: '🍲', label: 'Pot' },
            OVEN: { icon: '🔪', label: 'Oven' },
        };
        return info[method];
    };

    return (
        <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                    Cooking Station
                </h3>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                {methods.map((method) => {
                    const info = getMethodInfo(method);
                    return (
                        <button
                            key={method}
                            disabled={disabledTabs}
                            onClick={() => onMethodChange(method)}
                            className={cn(
                                'flex-1 px-3 py-2 rounded text-sm font-medium transition-all',
                                'border border-transparent',
                                activeMethod === method
                                    ? 'bg-amber-600 text-white shadow-md'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600',
                                disabledTabs && 'opacity-50 cursor-not-allowed'
                            )}
                            title={disabledTabs ? 'Wait for animation to complete' : `Switch to ${method}`}
                        >
                            <span className="mr-1">{info.icon}</span>
                            {!isMobile && info.label}
                        </button>
                    );
                })}
            </div>

            {/* Cooking Area */}
            <div className="flex-1 overflow-auto px-4 py-4">
                {/* Ingredient Slots */}
                <div
                    className={cn(
                        'grid gap-2 mb-6',
                        isMobile ? 'grid-cols-2' : `grid-cols-${slotConfig.cols}`
                    )}
                    style={{
                        gridTemplateColumns: `repeat(${slotConfig.cols}, minmax(0, 1fr))`,
                    }}
                >
                    {Array.from({ length: slotConfig.count }).map((_, index) => {
                        const isReserved = reservedSlots.includes(index);
                        const slotSize = isMobile ? 'h-12 w-12' : 'h-16 w-16';

                        return (
                            <div
                                key={index}
                                onMouseEnter={() => setSlotHover(index)}
                                onMouseLeave={() => setSlotHover(null)}
                                className={cn(
                                    'rounded border-2 transition-all',
                                    'flex items-center justify-center',
                                    'bg-white dark:bg-gray-800',
                                    slotSize,
                                    isReserved
                                        ? 'border-amber-500 bg-amber-100/50 dark:bg-amber-900/30'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-gray-700'
                                )}
                            >
                                {isReserved ? (
                                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                        Slot {index + 1}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 dark:text-gray-600 text-xs">
                                        +{index + 1}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Temperature Slider (Oven only) */}
                {activeMethod === 'OVEN' && (
                    <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                        <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                            Temperature: {temperature}°C
                        </label>
                        <Slider
                            value={[temperature]}
                            onValueChange={(val) => onTemperatureChange?.(val[0])}
                            min={50}
                            max={300}
                            step={10}
                            disabled={disabledTabs || isAnimating}
                            className="w-full"
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Low (50) ← → High (300)
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                {isAnimating && cookingProgress > 0 && (
                    <div className="mb-6">
                        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                            Cooking: {Math.round(cookingProgress)}%
                        </div>
                        <Progress value={cookingProgress} className="h-2" />
                    </div>
                )}
            </div>

            {/* Cook Button */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                    onClick={onCook}
                    disabled={isAnimating || disabledTabs}
                    className={cn(
                        'w-full',
                        isAnimating && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    {isAnimating ? 'Cooking...' : 'Cook'}
                </Button>
            </div>
        </div>
    );
}
