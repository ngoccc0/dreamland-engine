/**
 * Cooking Method Tabs Component
 *
 * @remarks
 * Displays interactive tabs for switching between cooking methods (CAMPFIRE, POT, OVEN).
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { CookingMethod } from './cooking-station-panel';

export interface CookingMethodTabsProps {
    /**
     * Currently active cooking method
     */
    activeMethod: CookingMethod;

    /**
     * Callback when method is changed
     */
    onMethodChange: (method: CookingMethod) => void;

    /**
     * Is system animating? (tabs disabled during animations)
     */
    isAnimating?: boolean;
}

/**
 * Renders cooking method selection tabs
 */
export function CookingMethodTabs({
    activeMethod,
    onMethodChange,
    isAnimating = false,
}: CookingMethodTabsProps) {
    const methods: CookingMethod[] = ['CAMPFIRE', 'POT', 'OVEN'];
    const icons = {
        CAMPFIRE: '🔥',
        POT: '🍲',
        OVEN: '🔪',
    };

    return (
        <div className="flex justify-center gap-2 px-4 py-4 border-b border-orange-600/50 bg-gray-900/90">
            {methods.map((method) => (
                <button
                    key={method}
                    disabled={isAnimating}
                    onClick={() => onMethodChange(method)}
                    className={cn(
                        'px-4 py-2 rounded text-sm font-medium transition-all',
                        activeMethod === method
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-700 text-gray-200 hover:bg-gray-600',
                        isAnimating && 'opacity-50'
                    )}
                >
                    <span className="mr-2">{icons[method]}</span>
                    {method}
                </button>
            ))}
        </div>
    );
}
