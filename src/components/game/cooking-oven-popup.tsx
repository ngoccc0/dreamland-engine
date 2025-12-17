/**
 * Cooking Oven Popup Component
 *
 * @remarks
 * **Visual Layout:**
 * - Header: "Industrial Bakery" title with temperature display
 * - Canvas: Oven with glass window showing tray inside
 * - Tray Grid: 3×3 items with individual progress bars + quality color feedback
 * - Temperature Gauge:
 *   - Slider (50-300°C)
 *   - Current temp display (red/green based on ideal range)
 *   - Ideal zone indicator (170-190°C = green, <160 = blue, >200 = red)
 * - Timer: Countdown from start to completion (1.5s)
 * - Per-Item Quality Feedback:
 *   - Green: PERFECT (±10°C)
 *   - Red: BURNT (>ideal)
 *   - Blue: UNDERCOOKED (<ideal)
 *
 * **Interactions:**
 * - Drag items to 3×3 grid
 * - Adjust temperature with slider
 * - COOK button (disabled if temp not set)
 * - Each item shows quality color during cooking
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { Item } from '@/core/domain/item';
import type { CookingRecipe } from '@/core/types/definitions/cooking-recipe';
import type { GameState } from '@/core/domain/gamestate';
import { useCooking } from '@/hooks/use-cooking';

export interface CookingOvenPopupProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  recipe: CookingRecipe;
  itemDefinitions: Record<string, any>;
  inventoryItems: Item[];
  onCookSuccess?: (gameState: GameState) => void;
}

const IDEAL_TEMP = 180;
const PERFECT_RANGE = 10;

/**
 * Determine quality color based on temperature
 */
function getQualityColor(temp: number): string {
  const diff = Math.abs(temp - IDEAL_TEMP);
  if (diff <= PERFECT_RANGE) return 'bg-green-500'; // Perfect
  if (temp > IDEAL_TEMP) return 'bg-red-500'; // Burnt
  return 'bg-blue-500'; // Undercooked
}

/**
 * Get quality text
 */
function getQualityText(temp: number): string {
  const diff = Math.abs(temp - IDEAL_TEMP);
  if (diff <= PERFECT_RANGE) return 'Perfect';
  if (temp > IDEAL_TEMP) return 'Burnt';
  return 'Undercooked';
}

/**
 * Popup for oven cooking with temperature-based quality
 */
export function CookingOvenPopup({
  isOpen,
  onClose,
  gameState,
  recipe,
  itemDefinitions,
  inventoryItems,
  onCookSuccess,
}: CookingOvenPopupProps) {
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
      handlers.setTemperature(IDEAL_TEMP); // Default to ideal temp
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

  const qualityColor = getQualityColor(state.temperature);
  const qualityText = getQualityText(state.temperature);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full border-2 border-red-700">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-red-100 mb-2 flex items-center justify-center gap-2">
            <span className="text-3xl">🔥</span>
            Industrial Bakery
            <span className="text-3xl">🔥</span>
          </h2>
          <p className="text-sm text-gray-400">Oven Cooking (Temperature Precision)</p>
        </div>

        {/* Temperature Gauge + Quality */}
        <div className="mb-6 bg-gray-800 rounded p-4 border border-red-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Temperature</p>
              <div className="text-3xl font-bold text-white">
                {state.temperature}°C
                <span className={`text-lg ml-2 ${qualityColor === 'bg-green-500' ? 'text-green-400' : qualityColor === 'bg-red-500' ? 'text-red-400' : 'text-blue-400'}`}>
                  ({qualityText})
                </span>
              </div>
            </div>

            {/* Quality Indicator Circle */}
            <div className={`w-20 h-20 rounded-full ${qualityColor} opacity-60 flex items-center justify-center border-4 border-gray-700`}>
              <div className="text-2xl">
                {qualityColor === 'bg-green-500' && '✓'}
                {qualityColor === 'bg-red-500' && '🔥'}
                {qualityColor === 'bg-blue-500' && '❄️'}
              </div>
            </div>
          </div>

          {/* Temperature Slider */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-semibold">50°C</span>
            <input
              type="range"
              min="50"
              max="300"
              value={state.temperature}
              onChange={(e) => handlers.setTemperature(parseInt(e.target.value))}
              disabled={state.isAnimating}
              className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <span className="text-xs text-gray-400 font-semibold">300°C</span>
          </div>

          {/* Ideal Zone Indicator */}
          <p className="text-xs text-gray-400 mt-3 text-center">
            Ideal zone: {IDEAL_TEMP - PERFECT_RANGE}°C - {IDEAL_TEMP + PERFECT_RANGE}°C
          </p>
        </div>

        {/* Oven Visual (Glass Window) */}
        <div className="mb-6 bg-gray-800 rounded border-4 border-gray-700 p-4 h-48 relative overflow-hidden">
          {/* Glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-5"></div>

          {/* 3×3 Tray Grid */}
          <div className="grid grid-cols-3 gap-3 h-full">
            {Array.from({ length: 9 }).map((_, i) => {
              const isSelected = state.ingredientSlots[i];
              return (
                <div
                  key={i}
                  className={`relative rounded border-2 flex flex-col items-center justify-center transition-all ${
                    isSelected ? `${qualityColor} opacity-40 border-yellow-500` : 'border-gray-600 bg-gray-700/40'
                  }`}
                  onClick={() => handlers.removeIngredient(i)}
                >
                  {isSelected && (
                    <>
                      <div className="text-xl">🍞</div>

                      {/* Per-item progress bar (during cooking) */}
                      {state.isAnimating && (
                        <div className="absolute bottom-1 w-8 h-1 bg-gray-800 rounded overflow-hidden border border-gray-600">
                          <div
                            className="h-full bg-yellow-500 transition-all duration-100"
                            style={{ width: `${displayProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Heating indicator (during cooking) */}
          {state.isAnimating && (
            <div className="absolute top-2 right-2 text-2xl animate-pulse">🔥</div>
          )}
        </div>

        {/* Ingredient Slots Section */}
        <div className="mb-6 bg-gray-800 rounded p-4 border border-gray-700">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase">Ingredients (Max 9)</p>
          <p className="text-xs text-gray-400 text-center">
            Required: {recipe.ingredients.length} | Added: {derived.selectedIngredients.length}
          </p>
        </div>

        {/* Spice Slot */}
        <div className="mb-6 bg-gray-800 rounded p-4 border border-gray-700">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Spice (Optional)</p>
          <div
            className="h-12 rounded border-2 border-gray-600 bg-gray-700 flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors"
            onClick={() => handlers.removeSpice()}
          >
            {state.spiceSlot ? '🌶️ Spice' : 'No spice'}
          </div>
        </div>

        {/* Progress Bar + Timer (during cooking) */}
        {state.isAnimating && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-semibold">Baking Progress</span>
              <span className="text-xs text-gray-300 font-semibold">
                {Math.round(displayProgress)}% ({Math.round((1.5 * (100 - displayProgress)) / 100)}s)
              </span>
            </div>
            <div className="w-full h-4 bg-gray-700 rounded border border-gray-600 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-yellow-500 transition-all duration-100"
                style={{ width: `${displayProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Recipe Match Status */}
        <div className="mb-6 p-3 rounded bg-gray-800 border-l-4 border-red-600">
          <p className="text-sm font-semibold">
            {derived.isRecipeMatched ? (
              <span className="text-green-400">✓ Recipe matched! Ready to bake.</span>
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
                ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500'
                : 'bg-gray-700 text-gray-500 border border-gray-600 cursor-not-allowed'
            }`}
          >
            🔥 Bake
          </button>
        </div>
      </div>
    </div>
  );
}
