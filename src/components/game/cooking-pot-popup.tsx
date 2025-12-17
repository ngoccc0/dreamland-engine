/**
 * Cooking Pot Popup Component
 *
 * @remarks
 * **Visual Layout:**
 * - Header: "Economy Engine" title with steam animation
 * - Canvas: Pot with water level bar (visual indicator of fullness)
 * - Hidden Slots: 9 slots (3x3 grid) but only visible as container
 * - Bowl Counter: Shows calculated bowl yield (ceil(count/2))
 * - Layers Visual:
 *   - Rim (brown outline)
 *   - Water (animated blue gradient)
 *   - Ingredients (stack inside)
 *   - Body (shadow, depth)
 * - Dispense Animation: Ladle appears every 0.5s per bowl (staggered dispense)
 *
 * **Interactions:**
 * - Drag items to 9 hidden slots (appears as single drop zone)
 * - Click to remove items
 * - COOK button triggers batch cooking
 * - Auto-calculates: N items → ceil(N/2) bowls → dispense animation
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { Item } from '@/core/domain/item';
import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { GameState } from '@/core/domain/gamestate';
import { useCooking } from '@/hooks/use-cooking';

export interface CookingPotPopupProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  recipe: CookingRecipe;
  itemDefinitions: Record<string, any>;
  inventoryItems: Item[];
  onCookSuccess?: (gameState: GameState) => void;
}

/**
 * Popup for pot cooking with batch yield calculation
 */
export function CookingPotPopup({
  isOpen,
  onClose,
  gameState,
  recipe,
  itemDefinitions,
  inventoryItems,
  onCookSuccess,
}: CookingPotPopupProps) {
  const { state, handlers, derived } = useCooking((result) => {
    if (result.success && onCookSuccess) {
      onCookSuccess(result.gameState);
    }
  });

  const [displayProgress, setDisplayProgress] = useState(0);
  const [ladles, setLadles] = useState<number[]>([]); // Track active ladle dispense animations

  // Set recipe when component mounts or recipe changes
  useEffect(() => {
    if (isOpen) {
      handlers.setRecipe(recipe);
    }
  }, [isOpen, recipe, handlers]);

  // Calculate bowl yield
  const ingredientCount = derived.selectedIngredients.length;
  const bowlYield = ingredientCount > 0 ? Math.ceil(ingredientCount / 2) : 0;

  // Animate progress bar during cooking
  useEffect(() => {
    if (!state.isAnimating) {
      setDisplayProgress(0);
      setLadles([]);
      return;
    }

    const startTime = Date.now();
    const duration = 1500; // Match hook animation duration

    // Generate ladle animations (one per bowl)
    const ladleTimings: number[] = [];
    for (let i = 0; i < bowlYield; i++) {
      ladleTimings.push(i * 500); // Stagger by 0.5s
    }
    setLadles(ladleTimings);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setDisplayProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [state.isAnimating, bowlYield]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border-2 border-blue-700">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-blue-100 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">🫕</span>
            Economy Engine
            <span className="text-3xl">🫕</span>
          </h2>
          <p className="text-sm text-gray-400">Pot Cooking (Batch Yield)</p>
        </div>

        {/* Pot Visual Canvas */}
        <div className="mb-6 bg-gray-800 rounded border border-blue-900 h-48 flex items-end justify-center relative overflow-hidden">
          {/* Pot Body (3D effect) */}
          <div className="absolute w-32 h-24 rounded-b-full bg-gradient-to-b from-gray-500 via-gray-600 to-gray-700 shadow-lg flex flex-col">
            {/* Pot Rim */}
            <div className="h-2 bg-gradient-to-b from-yellow-700 to-yellow-900 rounded-t-full"></div>

            {/* Water Level (animated) */}
            <div
              className="flex-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 opacity-60 relative overflow-hidden"
              style={{
                height: `${Math.min(100, (ingredientCount / 9) * 100)}%`,
              }}
            >
              {/* Water wave animation */}
              <div className="absolute bottom-0 w-full h-1 bg-blue-300 opacity-40 animate-pulse"></div>
            </div>

            {/* Pot Body Overlay (depth) */}
            <div className="absolute bottom-0 w-full h-full opacity-20 bg-gradient-to-r from-black via-transparent to-black rounded-b-full"></div>
          </div>

          {/* Steam Particles (while cooking) */}
          {state.isAnimating && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-20">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-blue-200 rounded-full opacity-60 animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animation: `float ${1.5 + i * 0.3}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                ></div>
              ))}
            </div>
          )}

          {/* Ladle Dispense Animation */}
          {state.isAnimating &&
            ladles.map((delay, idx) => {
              const elapsed = displayProgress * 15; // 0-1500ms
              const ladleStart = delay;
              const ladeturation = 400; // 0.4s per ladle animation
              const isActive = elapsed >= ladleStart && elapsed < ladleStart + ladeturation;

              if (!isActive) return null;

              const localProgress = (elapsed - ladleStart) / ladeturation;
              const ladleY = localProgress * 60; // Drop 60px

              return (
                <div
                  key={idx}
                  className="absolute right-8 text-2xl"
                  style={{
                    transform: `translateY(-${ladleY}px)`,
                    top: '50%',
                  }}
                >
                  🥄
                </div>
              );
            })}
        </div>

        {/* Bowl Yield Info */}
        <div className="mb-6 bg-blue-900/30 rounded p-4 border border-blue-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-blue-100">Bowl Yield Calculation</p>
            <p className="text-lg font-bold text-yellow-300">{bowlYield} 🥣</p>
          </div>
          <p className="text-xs text-gray-400">
            {ingredientCount} ingredients → {bowlYield} bowl{bowlYield !== 1 ? 's' : ''} (ceil({ingredientCount} ÷ 2))
          </p>
        </div>

        {/* Hidden Ingredients Grid (9 slots) */}
        <div className="mb-6 bg-gray-800 rounded p-4 border border-gray-700">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase">Ingredients (Max 9)</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`h-16 rounded border-2 flex items-center justify-center text-center transition-colors ${
                  state.ingredientSlots[i]
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 bg-gray-700/30 hover:border-blue-400'
                }`}
                onClick={() => handlers.removeIngredient(i)}
              >
                {state.ingredientSlots[i] ? (
                  <div className="text-xs">
                    <div className="text-lg mb-1">📦</div>
                    <div className="text-gray-300">
                      {inventoryItems
                        .find((item) => item.id === state.ingredientSlots[i])
                        ?.id?.substring(0, 4)}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs">—</div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Required: {recipe.ingredients.length} | Added: {derived.selectedIngredients.length}
          </p>
        </div>

        {/* Tool + Spice Slots */}
        <div className="mb-6 bg-gray-800 rounded p-4 border border-gray-700 flex gap-4">
          {/* Tool slot (water) */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Water</p>
            <div className="h-12 rounded border-2 border-blue-600 bg-blue-900/20 flex items-center justify-center text-sm">
              💧 Required
            </div>
          </div>

          {/* Spice slot */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Spice (Opt)</p>
            <div
              className="h-12 rounded border-2 border-gray-600 bg-gray-700 flex items-center justify-center cursor-pointer hover:border-blue-400"
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
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-100"
                style={{ width: `${displayProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Cooking... {Math.round(displayProgress)}%</p>
          </div>
        )}

        {/* Recipe Match Status */}
        <div className="mb-6 p-3 rounded bg-gray-800 border-l-4 border-blue-600">
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
                ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500'
                : 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed'
            }`}
          >
            🫕 Cook
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
