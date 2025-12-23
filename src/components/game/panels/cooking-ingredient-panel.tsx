/**
 * Cooking Ingredient Panel Component
 *
 * @remarks
 * Small corner panel that displays ingredients added to the cooking pot in order.
 * Shows a horizontal scrollable list with ingredient icons and tap-to-remove functionality.
 *
 * **Features:**
 * - Displays ingredients in order they were added (left to right)
 * - Tap on ingredient to remove from pot
 * - Glass panel styling for visual consistency
 * - Horizontal scroll if many ingredients
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ItemDefinition } from '@/core/types/definitions/item';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { cn } from '@/lib/utils';
import { getIngredientColor } from '@/lib/cooking/soup-color-blender';

export interface CookingIngredientPanelProps {
    /**
     * Array of ingredient item IDs in order added
     */
    ingredientIds: string[];

    /**
     * Item definitions for icon lookup
     */
    itemDefinitions: Record<string, ItemDefinition>;

    /**
     * Callback when ingredient is tapped for removal
     */
    onRemoveIngredient?: (index: number) => void;

    /**
     * Whether interactions are disabled (during animation)
     */
    disabled?: boolean;

    /**
     * Optional className for positioning
     */
    className?: string;
}

/**
 * Displays ingredients in a horizontal scrollable glass panel
 */
export function CookingIngredientPanel({
    ingredientIds,
    itemDefinitions,
    onRemoveIngredient,
    disabled = false,
    className,
}: CookingIngredientPanelProps) {
    // Don't render if no ingredients
    if (ingredientIds.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'absolute z-20 pointer-events-auto',
                'bg-black/40 backdrop-blur-sm rounded-lg border border-white/20',
                'p-2 shadow-xl',
                'max-w-[200px]',
                className
            )}
        >
            {/* Header */}
            <div className="text-xs text-white/70 mb-1 px-1">
                Ingredients ({ingredientIds.length})
            </div>

            {/* Ingredient list - horizontal scroll */}
            <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                <AnimatePresence mode="popLayout">
                    {ingredientIds.map((itemId, index) => {
                        const definition = itemDefinitions[itemId];
                        const emoji = definition?.emoji || '📦';
                        const ingredientColor = getIngredientColor(itemId);

                        return (
                            <motion.button
                                key={`${itemId}-${index}`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                onClick={() => onRemoveIngredient?.(index)}
                                disabled={disabled}
                                className={cn(
                                    'flex-shrink-0 w-10 h-10 rounded-md',
                                    'flex items-center justify-center',
                                    'bg-black/30 border border-white/10',
                                    'hover:bg-red-500/30 hover:border-red-400/50',
                                    'transition-colors duration-200',
                                    'focus:outline-none focus:ring-2 focus:ring-red-400/50',
                                    disabled && 'opacity-50 cursor-not-allowed'
                                )}
                                title={`Remove ${itemId} (tap to remove)`}
                                style={{
                                    boxShadow: `0 0 8px ${ingredientColor}40`,
                                }}
                            >
                                <IconRenderer
                                    icon={emoji}
                                    size={24}
                                    alt={itemId}
                                />
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Remove hint */}
            <div className="text-[10px] text-white/50 mt-1 px-1 text-center">
                Tap to remove
            </div>
        </div>
    );
}
