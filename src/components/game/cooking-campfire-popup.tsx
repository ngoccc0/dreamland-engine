/**
 * Cooking Campfire Popup Component
 *
 * @remarks
 * **Visual Layout:**
 * - Header: "Survivor's Grill" title with flame animation
 * - Canvas: Campfire visual with skewers positioned above in parabol arc
 * - Slots Section:
 *   - 3 ingredient slots (top row, circular layout)
 *   - 1 tool slot (skewers - required)
 *   - 1 spice slot (optional enhancement)
 * - Controls:
 *   - COOK button (enabled when recipe matches)
 *   - Progress bar during cooking animation (0-100% over 1.5s)
 *   - Recipe pattern indicator (shows required vs selected)
 *
 * **Interactions:**
 * - Drag items from inventory to slots
 * - Click slot to remove item
 * - Click COOK to execute cooking
 * - Parabol drop animation on success
 *
 * **Animation Events:**
 * - Flame flicker every 0.8s
 * - Parabol drop trajectory (0.8s duration)
 * - Steam particles on success
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { Item } from '@/core/domain/item';
import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { GameState } from '@/core/domain/gamestate';
import { useCooking } from '@/hooks/use-cooking';

export interface CookingCampfirePopupProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  recipe: CookingRecipe;
  itemDefinitions: Record<string, any>;
  inventoryItems: Item[];
  onCookSuccess?: (gameState: GameState) => void;
}

/**
 * Popup for campfire cooking with 3-slot ingredient system
 */
export function CookingCampfirePopup({
  isOpen,
  onClose,
  gameState,
  recipe,
  itemDefinitions,
  inventoryItems,
  onCookSuccess,
}: CookingCampfirePopupProps) {
  const { state, handlers, derived } = useCooking((result) => {
    if (result.success && onCookSuccess) {
      onCookSuccess(result.gameState);
    }
  });

  const [displayProgress, setDisplayProgress] = useState(0);

  // Set recipe when component mounts or recipe changes
  useEffect(() => {
    if (isOpen) {
      handlers.setRecipe(recipe);
    }
  }, [isOpen, recipe, handlers]);

  // Animate progress bar during cooking
  useEffect(() => {
    if (!state.isAnimating) {
      setDisplayProgress(0);
      return;
    }

    const startTime = Date.now();
    const duration = 1500; // Match hook animation duration

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setDisplayProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [state.isAnimating]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border-2 border-amber-700">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-amber-100 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl animate-pulse">🔥</span>
            Survivor's Grill
            <span className="text-3xl animate-pulse">🔥</span>
          </h2>
          <p className="text-sm text-gray-400">Campfire Cooking</p>
        </div>

        {/* Campfire Visual Canvas */}
        <div className="mb-6 bg-gray-800 rounded border border-orange-900 h-48 flex items-end justify-center relative overflow-hidden">
          {/* Animated flames */}
          <div className="absolute bottom-0 w-32 h-20">
            <div className="animate-flame w-full h-full bg-gradient-to-t from-orange-600 via-red-500 to-transparent rounded-full opacity-70"></div>
          </div>

          {/* Skewers in parabol arc */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <svg width="120" height="100" viewBox="0 0 120 100">
              {/* Left skewer */}
              <line
                x1="30"
                y1="30"
                x2="35"
                y2="90"
                stroke="rgba(139, 90, 43, 0.9)"
                strokeWidth="3"
              />
              {/* Center skewer */}
              <line x1="60" y1="10" x2="60" y2="90" stroke="rgba(139, 90, 43, 0.9)" strokeWidth="3" />
              {/* Right skewer */}
              <line
                x1="90"
                y1="30"
                x2="85"
                y2="90"
                stroke="rgba(139, 90, 43, 0.9)"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>

        {/* Ingredient Slots */}
        <div className="mb-6 bg-gray-800 rounded p-4 border border-gray-700">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase">Ingredients (3)</p>

          {/* Circular slot layout */}
          <div className="flex justify-around mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-20 h-20 rounded-full border-2 border-gray-600 bg-gray-700 flex items-center justify-center cursor-pointer hover:border-amber-500 relative group"
                onClick={() => handlers.removeIngredient(i)}
              >
                {state.ingredientSlots[i] ? (
                  <div className="text-center">
                    <div className="text-2xl">📦</div>
                    <div className="text-xs text-gray-300">
                      {inventoryItems
                        .find((item) => item.id === state.ingredientSlots[i])
                        ?.id?.substring(0, 3)}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs text-center">Empty</div>
                )}
              </div>
            ))}
          </div>

          {/* Required ingredients indicator */}
          <p className="text-xs text-gray-400 text-center">
            Required: {recipe.ingredients.length} | Selected: {derived.selectedIngredients.length}
          </p>
        </div>

        {/* Tool + Spice Slots */}
        <div className="mb-6 bg-gray-800 rounded p-4 border border-gray-700 flex gap-4">
          {/* Tool slot */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Tool</p>
            <div
              className="h-16 rounded border-2 border-gray-600 bg-gray-700 flex items-center justify-center cursor-pointer hover:border-amber-500"
              onClick={() => handlers.removeTool()}
            >
              {state.toolSlot ? '🔱 Skewers' : 'No tool'}
            </div>
          </div>

          {/* Spice slot */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Spice (Opt)</p>
            <div
              className="h-16 rounded border-2 border-gray-600 bg-gray-700 flex items-center justify-center cursor-pointer hover:border-amber-500"
              onClick={() => handlers.removeSpice()}
            >
              {state.spiceSlot ? '🌶️' : 'Optional'}
            </div>
          </div>
        </div>

        {/* Progress Bar (during cooking) */}
        {state.isAnimating && (
          <div className="mb-6">
            <div className="w-full h-4 bg-gray-700 rounded border border-gray-600 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-100"
                style={{ width: `${displayProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Cooking... {Math.round(displayProgress)}%</p>
          </div>
        )}

        {/* Recipe Match Status */}
        <div className="mb-6 p-3 rounded bg-gray-800 border-l-4 border-orange-600">
          <p className="text-sm font-semibold">
            {derived.isRecipeMatched ? (
              <span className="text-green-400">✓ Recipe matched! Ready to cook.</span>
            ) : (
              <span className="text-yellow-400">⚠ Add more ingredients to match recipe.</span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded border border-gray-600 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handlers.cook(gameState, itemDefinitions)}
            disabled={!derived.canCook}
            className={`flex-1 px-4 py-2 rounded font-semibold transition-colors ${
              derived.canCook
                ? 'bg-orange-600 hover:bg-orange-500 text-white border border-orange-500'
                : 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed'
            }`}
          >
            🔥 Cook
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes flame {
          0%,
          100% {
            transform: scaleY(1) scaleX(1);
            opacity: 0.7;
          }
          50% {
            transform: scaleY(1.1) scaleX(0.95);
            opacity: 0.9;
          }
        }

        .animate-flame {
          animation: flame 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
