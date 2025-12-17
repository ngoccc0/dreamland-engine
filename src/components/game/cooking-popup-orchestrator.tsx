/**
 * Cooking Popup Orchestrator
 *
 * @remarks
 * **Purpose:** Main container that manages 3 cooking method tabs (Campfire, Pot, Oven).
 *
 * **Layout:**
 * - Tab navigation (3 buttons: 🔥 Campfire, 🫕 Pot, 🔥 Oven)
 * - Active tab displays corresponding popup component
 * - Shared state: currentTab, gameState, inventoryItems
 * - Each popup has independent handlers and state management
 *
 * **Interaction Flow:**
 * 1. User clicks cooking station UI element → opens orchestrator
 * 2. User selects cooking method tab
 * 3. User selects recipe and adds ingredients
 * 4. User clicks COOK button → popup calls usecase
 * 5. Success → close popup, update inventory, show notification
 *
 * **Dependencies:**
 * - CookingCampfirePopup
 * - CookingPotPopup
 * - CookingOvenPopup
 * - useCooking hook (for state management)
 * - allCookingRecipes (recipe selection)
 */

'use client';

import React, { useState } from 'react';
import type { GameState } from '@/core/domain/gamestate';
import type { ItemDefinition } from '@/core/types/definitions/item';
import { CookingCampfirePopup } from './cooking-campfire-popup';
import { CookingPotPopup } from './cooking-pot-popup';
import { CookingOvenPopup } from './cooking-oven-popup';
import { getAllCookingRecipes } from '@/core/data/recipes/cooking';

export type CookingMethod = 'CAMPFIRE' | 'POT' | 'OVEN';

export interface CookingPopupOrchestratorProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  itemDefinitions: Record<string, ItemDefinition>;
  onCookSuccess?: (updatedGameState: GameState) => void;
}

/**
 * Main cooking dialog with 3 method tabs
 */
export function CookingPopupOrchestrator({
  isOpen,
  onClose,
  gameState,
  itemDefinitions,
  onCookSuccess,
}: CookingPopupOrchestratorProps) {
  const [activeTab, setActiveTab] = useState<CookingMethod>('CAMPFIRE');

  if (!isOpen) return null;

  // Get recipes for active cooking method
  const allRecipes = getAllCookingRecipes();
  const methodRecipes = allRecipes.filter((r) => r.cookingType === activeTab);

  // Get inventory items
  const inventoryItems = gameState.player?.inventory || [];

  // Handle close
  const handleClose = () => {
    onClose();
  };

  // Handle cook success
  const handleSuccess = (updatedGameState: GameState) => {
    if (onCookSuccess) {
      onCookSuccess(updatedGameState);
    }
    // Close popup after success
    handleClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-40">
      {/* Tab Navigation */}
      <div className="fixed top-0 left-0 right-0 flex justify-center pt-4 gap-4 z-50">
        <TabButton
          label="Survivor's Grill"
          emoji="🔥"
          active={activeTab === 'CAMPFIRE'}
          onClick={() => setActiveTab('CAMPFIRE')}
        />
        <TabButton
          label="Economy Engine"
          emoji="🫕"
          active={activeTab === 'POT'}
          onClick={() => setActiveTab('POT')}
        />
        <TabButton
          label="Industrial Bakery"
          emoji="🔥"
          active={activeTab === 'OVEN'}
          onClick={() => setActiveTab('OVEN')}
        />
      </div>

      {/* Popup Content (with top margin for tabs) */}
      <div className="pt-20 flex justify-center min-h-screen">
        {activeTab === 'CAMPFIRE' && methodRecipes.length > 0 && (
          <CookingCampfirePopup
            isOpen={true}
            onClose={handleClose}
            gameState={gameState}
            recipe={methodRecipes[0]} // First recipe of this type
            itemDefinitions={itemDefinitions}
            inventoryItems={inventoryItems}
            onCookSuccess={handleSuccess}
          />
        )}

        {activeTab === 'POT' && methodRecipes.length > 0 && (
          <CookingPotPopup
            isOpen={true}
            onClose={handleClose}
            gameState={gameState}
            recipe={methodRecipes[0]}
            itemDefinitions={itemDefinitions}
            inventoryItems={inventoryItems}
            onCookSuccess={handleSuccess}
          />
        )}

        {activeTab === 'OVEN' && methodRecipes.length > 0 && (
          <CookingOvenPopup
            isOpen={true}
            onClose={handleClose}
            gameState={gameState}
            recipe={methodRecipes[0]}
            itemDefinitions={itemDefinitions}
            inventoryItems={inventoryItems}
            onCookSuccess={handleSuccess}
          />
        )}

        {methodRecipes.length === 0 && (
          <div className="bg-gray-900 rounded-lg p-6 border-2 border-gray-700 text-center">
            <p className="text-gray-400">No recipes available for this cooking method.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tab button component
 */
interface TabButtonProps {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, emoji, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
        active
          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50 border-2 border-amber-500'
          : 'bg-gray-800 text-gray-300 border-2 border-gray-700 hover:border-amber-500'
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
